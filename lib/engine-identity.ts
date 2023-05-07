import { EXPERIMENTS } from "./experiments";
import { fnv1a } from "./fnv1a";
import type { ExperimentsType } from "./types";

export function computeExperimentEngineIdentity(
  experiments?: ExperimentsType
): string {
  const experimentsString = JSON.stringify(experiments ?? EXPERIMENTS);
  return String(fnv1a(experimentsString));
}
