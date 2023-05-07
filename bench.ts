export const EXPERIMENTS = {
  button_text: {
    params: {
      button_text: ["Buy now", "Add to cart"],
    },
    paths: []
  },
  image: {
    params: {
      image_url: ["verceltshirt", "verceltshirtgroup"],
    },
    paths: []
  },
  headline: {
    params: {
      headline: ["Vercel t-shirt", "100% cotton premium Vercel-branded t-shirt"],
    },
    paths: []
  },
};

export type CodableExperiment = Record<string, ParameterType>;
export type CodableExperiments = Record<string, CodableExperiment>;

export type ParameterBaseType = string | number | boolean;
export type ParameterType = ParameterBaseType | ParameterBaseType[];

export type PathHost = "com" | "org";
export interface ExperimentType {
  params: Record<string, ParameterType[]>;
  paths: string[];
}
export type ExperimentsType = Record<string, ExperimentType>;

export function verifyType<T extends ExperimentsType>(value: T): T {
  return value;
}

export type Experiments = typeof EXPERIMENTS;

export type ExperimentName = keyof Experiments;
export type Experiment<N extends ExperimentName> = Experiments[N];

export type ExperimentParamName<N extends ExperimentName> =
  keyof Experiments[N]["params"];

export type ExperimentParam<
  N extends ExperimentName,
  P extends ExperimentParamName<N>
> = Experiments[N]["params"][P];

export type ExperimentParamType<
  N extends ExperimentName,
  P extends ExperimentParamName<N>
> = P extends ExperimentParamName<N>
  ? ExperimentParam<N, P> extends unknown[]
    ? ExperimentParam<N, P>[number]
    : ExperimentParam<N, P>
  : string | undefined;

export type GenericEncodableExperiment<E extends ExperimentName> = {
  [P in ExperimentParamName<E>]: ExperimentParamType<E, P>;
};

export type GenericEncodableExperiments = {
  [E in ExperimentName]: GenericEncodableExperiment<E>;
};
export type ExpApiResponse = {
  e: string; // Experiments
  r: string; // Rules
} | null;

export type StatsigEnv = "production" | "preview";

type StatsigValue = string | number | boolean;

export interface StatsigExperiment {
  name: string;
  value: Record<string, StatsigValue | StatsigValue[]> | undefined;
  rule_id: string;
}

export interface StatsigApiOptions {
  sdkType: "httpapi";
  sdkVersion: "0.1.0";
}

export interface ExperimentConfig {
  name: string;
  groups: Set<string>;
  events?: Set<string>;
}

export interface StatsigEvent {
  eventName: string;
  value?: number | string;
  time: number; // unix timestamp
  user: StatsigUser;
  metadata?: Record<string, string>;
}

export interface StatsigUser {
  userID: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  locale?: string;
  appVersion?: string;
  custom?: Record<string, string | number | boolean | string[] | undefined>;
  privateAttributes?: Record<
    string,
    string | number | boolean | string[] | undefined
  >;
  customIDs?: Record<string, string>;
  statsigEnvironment?: {
    tier: string;
  };
}

export interface StatsigEventsPayload {
  events: StatsigEvent[];
}

export type Maybe<K> = K | undefined;

export interface UserCacheJWT {
  isVercelian: boolean;
  slowQueue: boolean;
  uid: string | null;
}
export type UserProperty = keyof UserCacheJWT;
export type MaybeUserValue<P extends UserProperty> = Maybe<UserCacheJWT[P]>;

export type FormatFn<T extends UserProperty> = (
  originalValue: UserCacheJWT[T]
) => {
  value: string | number | boolean | string[] | null;
  property?: string;
};

const EXPERIMENT_NAMES = Object.keys(EXPERIMENTS);
const EXPERIMENT_DELINEATOR = "e";
const PARAMETER_DELINEATOR = "p";
const PARAMETER_VALUE_DELINEATOR = "v";
const RULES_DELINEATOR = ",";
export function encodeExperiments(experiments: CodableExperiments): string {
  console.log(experiments);
  console.time("encodeExperiments");

  const encodedExperiments: string[] = [];
  const entries = Object.entries(experiments);
  for (const [expName, exp] of entries) {
    console.time(`encodeExperiment-${expName}`);

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

    console.timeEnd(`encodeExperiment-${expName}`);
  }

  console.timeEnd("encodeExperiments");
  return encodedExperiments.join(EXPERIMENT_DELINEATOR);
}

  const data = {
    button_text: { button_text: "Add to cart" },
    image: { image_url: "verceltshirtgroup" },
    headline: { headline: "100% cotton premium Vercel-branded t-shirt" },
  };

const encoded = encodeExperiments(data);
console.log(encoded);

export {};
