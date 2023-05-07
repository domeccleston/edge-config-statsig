import Cookies from "js-cookie";
import { IncomingMessage } from "http";
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";

import {
  formatAuthenticatedID,
  generateRandomID,
  VERCEL_AUTHENTICATED_PREFIX,
  computeIdentityVersion,
} from "./identity";

const FNV_PRIME_32 = 16_777_619n;
const FNV_OFFSET_32 = 2_166_136_261n;

export const STATSIG_COOKIE_PREFIX = "grw";
export const STATSIG_IDENTITY_COOKIE = `${STATSIG_COOKIE_PREFIX}_i_${computeIdentityVersion()}`;

export function getCookie(name: string, req?: IncomingMessage) {
  if (req) {
    // In the server side
    const parse = require("cookie").parse;

    const { cookie } = req.headers;
    if (!cookie) return;

    return parse(cookie)[name];
  }

  // In the client side
  return Cookies.get(name);
}

export function generateStatsigUserId(): string {
  return generateRandomID();
}

export function generateStatsigUserIdOnClient(vercelUserUid?: string): string {
  if (!vercelUserUid) return generateRandomID();

  return formatAuthenticatedID(vercelUserUid);
}

export function getStatsigUserId(cookies: RequestCookies): string | undefined {
  return cookies.get(STATSIG_IDENTITY_COOKIE)?.value;
}

export function getStatsigUserIdOnClient(hasAuth: boolean): string | null {
  const cookie = getCookie(STATSIG_IDENTITY_COOKIE) as string | undefined;

  const hasValidStatsigCookie =
    cookie &&
    cookie !== "undefined" &&
    (hasAuth ? cookie.startsWith(VERCEL_AUTHENTICATED_PREFIX) : true);

  return hasValidStatsigCookie ? cookie : null;
}
