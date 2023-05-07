import { EXPERIMENTS } from "./experiments";
import type {
  CodableExperiment,
  CodableExperiments,
  ExperimentName,
  ExperimentType,
} from "./types";

const EXPERIMENT_DELINEATOR = "e";
const PARAMETER_DELINEATOR = "p";
const PARAMETER_VALUE_DELINEATOR = "v";
const RULES_DELINEATOR = ",";

export function encodeRules(rulesByName: Record<string, string>): string {
  const rules = [];

  for (const [name, rule] of Object.entries(rulesByName)) {
    const nameIndex = EXPERIMENT_NAMES.indexOf(name);
    if (nameIndex > -1) {
      rules[nameIndex] = rule;
    }
  }

  return rules.join(RULES_DELINEATOR);
}

export function decodeRules(rules: string): Record<string, string> {
  const decodedRules: Record<string, string> = {};

  rules.split(RULES_DELINEATOR).forEach((rule, index) => {
    const expName = EXPERIMENT_NAMES[index];
    if (expName !== undefined) {
      decodedRules[expName] = rule;
    }
  });

  return decodedRules;
}

const EXPERIMENT_NAMES = Object.keys(EXPERIMENTS);
export function encodeExperiments(experiments: CodableExperiments): string {
  // console.time("encodeExperiments");

  const encodedExperiments: string[] = [];
  const entries = Object.entries(experiments);
  for (const [expName, exp] of entries) {
    // console.time(`encodeExperiment-${expName}`);

    const expNameIndex = EXPERIMENT_NAMES.indexOf(expName);
    if (expNameIndex < 0)
      throw new Error(
        `Experiment '${expName}' is not defined in experiments.ts.`
      );
    const parameters = Object.entries(exp);
    if (parameters.length < 1) throw new Error(`No parameters were provided.`);
    const params: string[] = [`${expNameIndex}`];
    parameters.forEach(([paramName, param], i) => {
      const expFromDefinition = EXPERIMENTS[expName as ExperimentName] as
        | ExperimentType
        | undefined;
      if (!expFromDefinition)
        throw new Error(
          `Received an experiment '${expName}' that is not contained in experiments.ts.`
        );
      const paramsForExperiment = expFromDefinition.params[paramName] as
        | unknown[]
        | undefined;
      if (!paramsForExperiment)
        throw new Error(
          `Received a parameter '${paramName}' that does not exist for experiment '${expName}' in experiments.ts.`
        );
      const paramIndex = paramsForExperiment.indexOf(param);
      if (paramIndex < 0)
        throw new Error(
          `Received a value ${JSON.stringify(
            param
          )} for parameter '${paramName}' for experiment '${expName}' that does not exist in experiments.ts.`
        );
      params.push(`${i}${PARAMETER_VALUE_DELINEATOR}${paramIndex}`);
    });
    encodedExperiments.push(params.join(PARAMETER_DELINEATOR));

    // console.timeEnd(`encodeExperiment-${expName}`);
  }

  // console.timeEnd("encodeExperiments");
  return encodedExperiments.join(EXPERIMENT_DELINEATOR);
}

export function decodeExperiments(
  variation: string | string[]
): CodableExperiments {
  const encodedString = Array.isArray(variation) ? variation[0] : variation;
  if (!encodedString || encodedString.length === 0)
    throw new Error("Encoded experiment string is empty.");

  const experiments = encodedString.split(EXPERIMENT_DELINEATOR);

  if (experiments.length === 0) throw new Error("No experiments are encoded.");

  const decodedExperiments: CodableExperiments = {};
  const experimentNames = Object.keys(EXPERIMENTS);

  for (const experiment of experiments) {
    const decodedExperiment: CodableExperiment = {};
    const parameters = experiment.split(PARAMETER_DELINEATOR);
    if (
      parameters.length < 2 ||
      parameters[0] === undefined ||
      parameters[1] === undefined
    )
      throw new Error(`Invalid experiment encoding.`);
    const experimentIndex = parseInt(parameters[0]);
    if (Number.isNaN(experimentIndex))
      throw new Error(`Experiment index ${experimentIndex} is NaN.`);
    const experimentName = experimentNames[experimentIndex];
    if (!experimentName)
      throw new Error(
        `Experiment provided with index ${experimentIndex} is not a valid index.`
      );
    parameters.splice(0, 1);
    for (const parameter of parameters) {
      const [index, valueIndex] = parameter.split(PARAMETER_VALUE_DELINEATOR);

      if (!index)
        throw new Error(
          `No parameter index was provided for experiment ${experimentName}.`
        );

      if (!valueIndex)
        throw new Error(
          `No parameter value index was provided for experiment ${experimentName}.`
        );

      const parameterIndex = parseInt(index);
      const parameterValueIndex = parseInt(valueIndex);
      if (Number.isNaN(parameterIndex)) {
        throw new Error(
          `Received invalid parameter index '${index}' for experiment '${experimentName}'.`
        );
      }
      if (Number.isNaN(parameterValueIndex)) {
        throw new Error(
          `Received invalid parameter value index '${valueIndex}' for experiment '${experimentName}'.`
        );
      }
      const experimentFromDefinedExperiments = EXPERIMENTS[
        experimentName as ExperimentName
      ] as ExperimentType | undefined;
      if (!experimentFromDefinedExperiments) {
        throw new Error(
          `Experiment '${experimentName}' does not exist in experiments definition.`
        );
      }
      const parameterFromExperiments = Object.entries(
        experimentFromDefinedExperiments.params
      )[parameterIndex];

      if (!parameterFromExperiments) continue;
      const parameterName = parameterFromExperiments[0];
      const parameterValue = parameterFromExperiments[1][parameterValueIndex];

      if (parameterValue === undefined)
        throw new Error(
          `Parameter value at index ${parameterValueIndex} for parameter at index ${parameterIndex} for experiment '${experimentName}' does not exist.`
        );
      decodedExperiment[parameterName] = parameterValue;
    }
    decodedExperiments[experimentName] = decodedExperiment;
  }

  return decodedExperiments;
}
