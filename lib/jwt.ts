import { importJWK, jwtVerify } from "jose";
import type { JWK, JWTPayload, JWTVerifyResult } from "jose";
import { DEV_OR_PREVIEW_ENV } from "./constants";
import {
  USER_PROPERTIES,
  PASS_OR_REFORMAT as PASS_OR_FORMAT,
} from "./constants";
import type { StatsigUser, MaybeUserValue } from "./types";

/**
 *  Decode `jwtCookieValue` and get properties decided by USER_PROPERTIES.
 *
 *  If a property is marked as passthrough in `PASS_OR_FORMAT`, the decoded value is returned as-is. If a format function
 *  is supplied, the function will be applied to the decoded value and passed with the existing name or a supplied `name`.
 *
 * @param jwtCookieValue - Encoded JWT
 * @returns
 */
export async function getStatsigUserPropertiesFromJWT(
  jwtCookieValue: string | undefined
): Promise<StatsigUser["custom"]> {
  if (!jwtCookieValue) return {};

  let userCache: JWTPayload;
  try {
    userCache = (await decodeJWT(jwtCookieValue)).payload;
  } catch (e) {
    if (DEV_OR_PREVIEW_ENV) throw e;
    return {};
  }

  const custom: StatsigUser["custom"] = {};
  for (const property of USER_PROPERTIES) {
    const value = userCache[property] as MaybeUserValue<typeof property>;
    const action = PASS_OR_FORMAT[property];

    if (value === undefined) continue;

    if (action === "passthrough") {
      custom[property] = value ?? undefined;
    } else {
      const formatted = action(value);

      custom[formatted.property ?? property] = formatted.value ?? undefined;
    }
  }

  return custom;
}

// TODO: Move jwt utilities to package
// https://linear.app/vercel/issue/GRO-1258
const jwtSecretAsString = process.env.JWT_SECRET ?? "";

const generateKey = (key: string, alg = "HS256"): JWK => {
  const signingKey = alg.startsWith("RS")
    ? { kty: "RSA", n: btoa(key), e: "AQAB", alg }
    : { kty: "oct", k: btoa(key), alg };

  return signingKey;
};

const decodeJWT = async (
  jwt: string,
  key = jwtSecretAsString,
  alg = "HS256"
): Promise<JWTVerifyResult> => {
  const signingKey = generateKey(key, alg);
  const jwk = await importJWK(signingKey);

  return jwtVerify(jwt, jwk);
};
