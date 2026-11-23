import { createHmac, timingSafeEqual } from "crypto";
import { getAuthEnv } from "@/lib/env";

export const SESSION_COOKIE = "cms_session";

export function createSessionToken() {
  const secret = getAuthEnv().cmsSessionSecret;
  return createHmac("sha256", secret).update("cms-authenticated").digest("hex");
}

export function isValidSessionToken(token: string | undefined) {
  if (!token) return false;

  try {
    const expected = createSessionToken();
    const actual = Buffer.from(token);
    const wanted = Buffer.from(expected);
    if (actual.length !== wanted.length) return false;
    return timingSafeEqual(actual, wanted);
  } catch {
    return false;
  }
}

export function passwordsMatch(input: string) {
  try {
    const expected = getAuthEnv().adminPassword;
    if (!input) return false;

    const actual = Buffer.from(input);
    const wanted = Buffer.from(expected);
    if (actual.length !== wanted.length) return false;
    return timingSafeEqual(actual, wanted);
  } catch {
    return false;
  }
}
