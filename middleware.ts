import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import Statsig from "statsig-node";
import { EdgeConfigDataAdapter } from "statsig-node-vercel";
import {
  EXPERIMENTS_COOKIE,
  EXPERIMENTS_COOKIE_EXPIRE_INTERVAL_NUM,
  EXPERIMENTS_RULES_COOKIE,
  STATSIG_IDENTITY_COOKIE,
  STATSIG_IDENTITY_COOKIE_EXPIRE_INTERVAL_NUM,
  VARIATION_WITH_DEFAULT_EXPERIMENTS,
} from "./lib/constants";

import { generateStatsigUserId, getStatsigUserId } from "./lib/statsig";
import { getExperiments } from "./lib/get-experiments";
import { RequestCookies } from "next/dist/server/web/spec-extension/cookies";
import { encodeExperiments, encodeRules } from "./lib/coding";

export const config = {
  matcher: "/",
};

const EXPERIMENTS = {
  button_text: {
    params: {
      button_text: ["Buy now", "Add to cart"],
    },
  },
  image: {
    params: {
      image_url: ["verceltshirt", "verceltshirtgroup"],
    },
  },
  headline: {
    params: {
      headline: ["Vercel t-shirt", "100% premium cotton Vercel t-shirt"],
    },
  },
};

function rewriteUrl(req: NextRequest, path: string) {
  const url = req.nextUrl.clone();
  url.pathname = `/${path}`;
  const res = NextResponse.rewrite(url);
  return res;
}

function getExperimentUrlFromCookie(cookies: RequestCookies) {
  const statsigCookie = cookies.get(EXPERIMENTS_COOKIE);
  const encodedExperiments = statsigCookie?.value;
  return encodedExperiments;
}


function setCookieOnResponse(
  response: NextResponse,
  cookieName: string,
  cookieValue: string,
  expire:
    | typeof EXPERIMENTS_COOKIE_EXPIRE_INTERVAL_NUM
    | typeof STATSIG_IDENTITY_COOKIE_EXPIRE_INTERVAL_NUM = EXPERIMENTS_COOKIE_EXPIRE_INTERVAL_NUM
): void {
  response.cookies.set(cookieName, cookieValue, {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + expire),
  });
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  let id = getStatsigUserId(req.cookies);
  let needIdCookieUpdate = false;

  if (id) {
    const url = getExperimentUrlFromCookie(req.cookies);
    if (url) {
      return rewriteUrl(req, url);
    }
  } else {
    id = generateStatsigUserId();
    needIdCookieUpdate = true;
    const { experiments, rules } = await getExperiments(id);
    try {
      const experimentsEncoded = encodeExperiments(experiments);
      const rulesEncoded = encodeRules(rules);
      const response = rewriteUrl(req, experimentsEncoded);
      if (needIdCookieUpdate) {
        setCookieOnResponse(
          response,
          STATSIG_IDENTITY_COOKIE,
          id,
          STATSIG_IDENTITY_COOKIE_EXPIRE_INTERVAL_NUM
        );
      }
      setCookieOnResponse(response, EXPERIMENTS_COOKIE, experimentsEncoded);
      setCookieOnResponse(response, EXPERIMENTS_RULES_COOKIE, rulesEncoded);
      return response;
    } catch (e) {
      console.log(e);
      return rewriteUrl(req, VARIATION_WITH_DEFAULT_EXPERIMENTS);
    }
  }
}


/* 

PSEUDOCODE

CLI
  - Download experiment values from Statsig
  - Transform experiment JSON to add encoded path
  - Sync this into Edge Config

MIDDLEWARE
  - Check for user cookie
    - If exists:
      - rewrite to that path
    - If not exists: 
      - 

*/