import ms from "ms";

import {
  CodableExperiments,
  GenericEncodableExperiments,
  ParameterType,
} from "./types";
import { EXPERIMENTS } from "./experiments";
import type { UserProperty, FormatFn, StatsigEnv } from "./types";
import { computeIdentityVersion } from "./identity";
import { computeExperimentEngineIdentity } from "./engine-identity";
import { encodeExperiments } from "./coding";

export const EXPERIMENT_ENTRIES = Object.entries(EXPERIMENTS);
export const EXPERIMENT_DEFAULTS = getIsolatedExperimentDefaults();

export const STATSIG_COOKIE_PREFIX = "grw";
export const STATSIG_IDENTITY_COOKIE = `${STATSIG_COOKIE_PREFIX}_i_${computeIdentityVersion()}`;
export const STATSIG_IDENTITY_COOKIE_EXPIRE_INTERVAL = "36Weeks";
export const STATSIG_IDENTITY_COOKIE_EXPIRE_INTERVAL_NUM = ms("36Weeks");

export const EXPERIMENTS_COOKIE_PREFIX = `${STATSIG_COOKIE_PREFIX}_exp`;
export const EXPERIMENTS_COOKIE = `${EXPERIMENTS_COOKIE_PREFIX}_${computeExperimentEngineIdentity()}`;
export const EXPERIMENTS_RULES_COOKIE = `${EXPERIMENTS_COOKIE_PREFIX}_rules_${computeExperimentEngineIdentity()}`;
export const EXPERIMENTS_OVERWRITE_COOKIE = `${STATSIG_COOKIE_PREFIX}_ovrw`;
export const EXPERIMENTS_COOKIE_EXPIRE_INTERVAL = "30d";
export const EXPERIMENTS_COOKIE_EXPIRE_INTERVAL_NUM = ms("30d");

export const DEFAULT_RULES = (): Record<string, string> => {
  const defaults: Record<string, string> = {};
  for (const [experimentName, _] of EXPERIMENT_ENTRIES) {
    defaults[experimentName] = "allocation";
  }
  return defaults;
};

export function getIsolatedExperimentDefaults(): GenericEncodableExperiments {
  const defaults: Record<string, Record<string, ParameterType>> = {};
  for (const [experimentName, experiment] of EXPERIMENT_ENTRIES) {
    const newExperiment: Record<string, ParameterType> = {};
    for (const [variantName, variantOptions] of Object.entries(
      experiment.params
    )) {
      const defaultValue = (variantOptions as ParameterType[])[0];
      if (defaultValue === undefined) continue;
      newExperiment[variantName] = defaultValue;
    }
    defaults[experimentName] = newExperiment;
  }
  return defaults as GenericEncodableExperiments;
}

export const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV as
  | undefined
  | "production"
  | "preview"
  | "development";

export const DEV_OR_PREVIEW_ENV = VERCEL_ENV !== "production";

export const STATSIG_URL = "https://api.statsig.com/v1";

export const STATSIG_ENV: StatsigEnv =
  VERCEL_ENV === "production" ? "production" : "preview";

export const DEV_ENV = VERCEL_ENV !== "production" && VERCEL_ENV !== "preview";

export const RULES_FOR_NOT_INCLUDED = [
  "layerAssignment",
  "holdout",
  "notStarted",
  "targetingGate",
  "allocation",
  "abandoned",
  "prestart",
  "launchedGroup",
];

export const USER_PROPERTIES: UserProperty[] = [
  "isVercelian",
  "uid",
  "slowQueue",
];

export const PASS_OR_REFORMAT: Record<
  UserProperty,
  "passthrough" | FormatFn<UserProperty>
> = {
  isVercelian: "passthrough",
  slowQueue: "passthrough",
  uid(originalValue) {
    return {
      value: Boolean(originalValue),
      property: "isPossiblyLoggedIn",
    };
  },
};

export const VARIATION_WITH_DEFAULT_EXPERIMENTS = encodeExperiments(
  EXPERIMENT_DEFAULTS as CodableExperiments
);
