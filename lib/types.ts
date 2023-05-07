import type { EXPERIMENTS } from "./experiments";

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
