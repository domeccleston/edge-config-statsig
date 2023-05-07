import { ParsedUrlQuery } from "node:querystring";
import { decodeExperiments, encodeExperiments } from "./coding";
import { DEV_OR_PREVIEW_ENV, getIsolatedExperimentDefaults } from "./constants";
import { EXPERIMENTS } from "./experiments";
import {
  CodableExperiment,
  ExperimentName,
  ExperimentParamName,
  GenericEncodableExperiments,
} from "./types";

/**
 * Returns a generator that computes the cartesian product of a two dimensional array.
 * @see https://stackoverflow.com/a/44012184
 *
 * Input: [1, 2], [10, 20], [100, 200, 300]
 * Output: [[1, 10, 100], [1, 10, 200], ..., [2, 10, 100], ...]
 *
 * @param head - The beginning element in the input array.
 * @param tail - The remaining elements in the input array.
 * @returns A generator producing the product of the head & tail.
 */
export function* cartesian<T>(
  head: T[],
  ...tail: T[][]
): Generator<T[], void, void> {
  const remainder =
    tail.length > 0 && tail[0] !== undefined
      ? cartesian(tail[0], ...tail.slice(1))
      : [[]];
  for (const r of remainder) {
    for (const h of head) {
      yield [h, ...r];
    }
  }
}

export function getEncodedVariations(maxGeneratedVariations = 100) {
  const experimentPairs = Object.entries(EXPERIMENTS);
  const experimentsForPath: [string, CodableExperiment][] = [];
  const possibleValues = [];
  for (const [experimentName, experiment] of experimentPairs) {
    experimentsForPath.push([
      experimentName as ExperimentName,
      experiment.params,
    ]);
  }
  for (const [expName, params] of experimentsForPath) {
    const parameters = Object.entries(params);

    for (const [paramName, paramValues] of parameters) {
      const parameterVariants = Array.isArray(paramValues)
        ? paramValues.map((_, index) => ({ expName, paramName, index }))
        : [{ expName, paramName, index: 0 }];

      possibleValues.push(parameterVariants);
    }
  }

  const possibleVariations: {
    expName: string;
    paramName: string;
    index: number;
  }[][] = [];
  const firstValue = possibleValues[0];
  if (firstValue) {
    const generator = cartesian(firstValue, ...possibleValues.slice(1));
    let count = 0;
    for (const variation of generator) {
      possibleVariations.push(variation);
      count += 1;
      if (count >= maxGeneratedVariations) {
        break;
      }
    }
  }

  const encodedVariations: string[] = [];
  for (const variation of possibleVariations) {
    const experiments = getIsolatedExperimentDefaults();

    for (const {
      expName: rawExpName,
      paramName: rawParamName,
      index,
    } of variation) {
      const expName = rawExpName as ExperimentName;
      const paramName = rawParamName as ExperimentParamName<ExperimentName>;
      const exp = EXPERIMENTS[expName];
      const paramValues = exp.params[paramName];
      const paramValueAtIndex = paramValues[index];
      if (!paramValueAtIndex) continue;
      experiments[expName][paramName] = paramValueAtIndex;
    }

    const encodedVariation = encodeExperiments(experiments);

    encodedVariations.push(encodedVariation);
  }

  return encodedVariations;
}

/* Return an array of encoded experiement URLS, formatted for returning from getStaticPaths */
export function getExperimentPaths() {
  const paths = [];
  const encodedVariations = getEncodedVariations();

  for (const encodedExperiments of encodedVariations) {
    paths.push({
      params: { experiment: encodedExperiments },
    });
  }

  return paths;
}

/**
 * Decode experiment values from a dynamic `path/[experiments].tsx` route or return the default values.
 *
 * @param params - Parameters maybe with `experiments` from a `path/[experiments].tsx` dynamic route
 * @returns Experiment values based on the unique `path` variation being visited or the defaults
 */
export function getExperimentProps(
  params?: ParsedUrlQuery
): GenericEncodableExperiments {
  let experiments = getIsolatedExperimentDefaults();

  const encodedPathExperiments = params?.experiments;
  if (encodedPathExperiments) {
    try {
      experiments = decodeExperiments(
        encodedPathExperiments
      ) as GenericEncodableExperiments;
    } catch (e) {
      // If we fail to decode, default values are served. The page with default values is already generated
      // as part of `get-static-paths`.
      if (DEV_OR_PREVIEW_ENV) {
        // eslint-disable-next-line no-console
        console.error(
          "Experiment values failed to decode in getStaticProps. Serving default values.",
          e
        );
      }
    }
  }
  return experiments;
}
