import jwt from "jsonwebtoken";
import {
  isProduction,
  masterPassword,
  masterUsername,
  sessionCookieName,
  sessionSecret,
  sessionTtlSeconds,
} from "./env.js";

export function signSessionToken(payload) {
  return jwt.sign(payload, sessionSecret, {
    expiresIn: sessionTtlSeconds,
    issuer: "copmec-api",
    audience: "copmec-web",
  });
}

export function verifySessionToken(token) {
  return jwt.verify(token, sessionSecret, {
    issuer: "copmec-api",
    audience: "copmec-web",
  });
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: sessionTtlSeconds * 1000,
    path: "/",
  };
}

export function clearSessionCookie(res) {
  res.clearCookie(sessionCookieName, {
    ...getSessionCookieOptions(),
    maxAge: undefined,
  });
}

export function setSessionCookie(res, payload) {
  res.cookie(sessionCookieName, signSessionToken(payload), getSessionCookieOptions());
}

export function isMasterCredentials(login, password) {
  return String(login || "").trim().toLowerCase() === String(masterUsername || "").trim().toLowerCase() && String(password || "") === String(masterPassword || "");
}