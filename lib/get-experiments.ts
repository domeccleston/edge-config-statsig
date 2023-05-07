import type { DynamicConfig, StatsigUser } from "statsig-node";
import statsig from "statsig-node";
import { EdgeConfigDataAdapter } from "statsig-node-vercel";
import type {
  CodableExperiment,
  CodableExperiments,
  ExperimentName,
  GenericEncodableExperiments,
} from "./types";
import {
  DEFAULT_RULES,
  DEV_OR_PREVIEW_ENV,
  getIsolatedExperimentDefaults,
} from "./constants";
import { getStatsigUserPropertiesFromJWT } from "./jwt";

interface ExperimentsFetchAttempt {
  experiments: GenericEncodableExperiments;
  rules: Record<string, string>;
  aborted: boolean;
}

let dataAdapter: EdgeConfigDataAdapter | null = null;

/* 
- Take a user ID
- For each of our defined experiments, get the experiment values
  for that user
- Return an object with those experiment values
- If unable to fetch values for any experiment, return defaults
*/

/**
 * Read experiment values from Statsig via Edge Config.
 *
 * @param userID - Statsig User ID
 * @returns Experiment values and rules for user
 */
export async function getExperiments(
  userID: string,
  jwtCookieValue?: string
): Promise<ExperimentsFetchAttempt> {
  const experiments = getIsolatedExperimentDefaults() as CodableExperiments;
  const plainRules: Record<string, string> = {};

  const [jwtData] = await Promise.all([
    getStatsigUserPropertiesFromJWT(jwtCookieValue),
  ]);

  const statsigUser: StatsigUser = {
    userID,
    custom: {
      ...jwtData,
    },
  };

  const promises = [];
  for (const [name, params] of Object.entries(experiments)) {
    const newParams = {
      ...params,
    } as CodableExperiment;

    promises.push(
      (async (): Promise<void> => {
        const config = await getStatsigExperiment(
          name as ExperimentName,
          statsigUser
        );

        if (config) {
          for (const paramName of Object.keys(newParams)) {
            const value = config.get(paramName, experiments[name]?.[paramName]);

            if (value !== undefined) newParams[paramName] = value;
          }

          experiments[name] = newParams;
          plainRules[name] = config.getRuleID();
        }
      })()
    );
  }

  // Await all individual promises to populate the parameters from Statsig
  try {
    await Promise.all(promises);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      "A statsig edge config adapter error occured, the experiment engine provided default values",
      e
    );
    return {
      experiments: getIsolatedExperimentDefaults(),
      rules: DEFAULT_RULES(),
      aborted: true,
    };
  }

  return {
    experiments: experiments as GenericEncodableExperiments,
    rules: plainRules,
    aborted: false,
  };
}

function getDataAdapter(): EdgeConfigDataAdapter {
  if (dataAdapter === null) {
    dataAdapter = new EdgeConfigDataAdapter(
      process.env.EDGE_CONFIG_ITEM_KEY!,
      process.env.EDGE_CONFIG
    );
  }

  return dataAdapter;
}

async function getStatsigExperiment<T extends ExperimentName>(
  experimentName: T,
  statsigUser: StatsigUser
): Promise<DynamicConfig | undefined> {
  try {
    console.time('get_statsig')
    await statsig.initialize(process.env.STATSIG_SERVER_API_KEY!, {
      dataAdapter: getDataAdapter(),
    });
    console.timeEnd('get_statsig')

    const _experiment = statsig.getExperiment(statsigUser, experimentName);
    return _experiment;
  } catch (e) {
    if (DEV_OR_PREVIEW_ENV) {
      throw e;
    }
    // eslint-disable-next-line no-console
    console.warn(e);
    // console.timeEnd('get_statsig')
    return undefined;
  }
}
