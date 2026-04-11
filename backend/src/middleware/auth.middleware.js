import { verifySessionToken } from "../config/auth.js";
import { allowedOrigins, isProduction, sessionCookieName } from "../config/env.js";
import { findWarehouseUserById } from "../services/warehouse.store.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function attachAuthSession(req, _res, next) {
  const token = req.cookies?.[sessionCookieName];
  if (!token) {
    req.auth = null;
    next();
    return;
  }

  try {
    const payload = verifySessionToken(token);
    if (payload.type === "master") {
      req.auth = { type: "master", userId: null, role: "Lead" };
      next();
      return;
    }

    const user = findWarehouseUserById(payload.userId);
    if (!user || !user.isActive) {
      req.auth = null;
      next();
      return;
    }

    req.auth = { type: "user", userId: user.id, role: user.role, user };
    next();
  } catch {
    req.auth = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.auth) {
    res.status(401).json({ ok: false, message: "Sesión requerida." });
    return;
  }
  next();
}

export function requireTrustedOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = String(req.headers.origin || "").trim();
  if (!origin) {
    next();
    return;
  }

  if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/i.test(origin)) {
    next();
    return;
  }

  if (allowedOrigins.includes(origin)) {
    next();
    return;
  }

  res.status(403).json({ ok: false, message: "Origen no confiable." });
}