import { clearSessionCookie, verifySessionToken } from "../config/auth.js";
import { allowedOrigins, isProduction, sessionCookieName } from "../config/env.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  canUserDoBoardAction,
  canUserDoWarehouseAction,
  findWarehouseUserById,
  validateWarehouseStateMutation,
} from "../services/warehouse.store.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";
const ROLE_SSR = "Semi-Senior (Ssr)";
const ROLE_JR = "Junior (Jr)";

const ROLE_LEVEL = {
  [ROLE_JR]: 1,
  [ROLE_SSR]: 2,
  [ROLE_SR]: 3,
  [ROLE_LEAD]: 4,
};

export function attachAuthSession(req, res, next) {
  const token = req.cookies?.[sessionCookieName];
  if (!token) {
    req.auth = null;
    next();
    return;
  }

  try {
    const payload = verifySessionToken(token);
    if (payload.type === "master") {
      req.auth = { type: "master", userId: "bootstrap-master", role: "Lead" };
      next();
      return;
    }

    const user = findWarehouseUserById(payload.userId);
    if (!user || !user.isActive) {
      clearSessionCookie(res);
      req.auth = null;
      next();
      return;
    }

    req.auth = { type: "user", userId: user.id, role: user.role, user };
    next();
  } catch {
    clearSessionCookie(res);
    req.auth = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.auth) {
    auditSecurityEvent("auth_required", req);
    res.status(401).json({ ok: false, message: "Sesión requerida." });
    return;
  }
  next();
}

export function requireRoles(allowedRoles) {
  const roleSet = new Set(Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]);
  return (req, res, next) => {
    if (!req.auth) {
      auditSecurityEvent("auth_required", req, { allowedRoles: Array.from(roleSet) });
      res.status(401).json({ ok: false, message: "Sesión requerida." });
      return;
    }

    const currentRole = req.auth.role || req.auth.user?.role || null;
    if (req.auth.type === "master") {
      next();
      return;
    }

    if (roleSet.has(currentRole)) {
      next();
      return;
    }

    auditSecurityEvent("forbidden_role", req, { allowedRoles: Array.from(roleSet), currentRole });
    res.status(403).json({ ok: false, message: "No tienes permisos para realizar esta acción." });
  };
}

export function requireMinimumRole(minimumRole) {
  return (req, res, next) => {
    if (!req.auth) {
      auditSecurityEvent("auth_required", req, { minimumRole });
      res.status(401).json({ ok: false, message: "Sesión requerida." });
      return;
    }

    if (req.auth.type === "master") {
      next();
      return;
    }

    const currentRole = req.auth.role || req.auth.user?.role || null;
    if ((ROLE_LEVEL[currentRole] || 0) >= (ROLE_LEVEL[minimumRole] || Number.MAX_SAFE_INTEGER)) {
      next();
      return;
    }

    auditSecurityEvent("forbidden_role", req, { minimumRole, currentRole });
    res.status(403).json({ ok: false, message: "No tienes permisos suficientes para esta acción." });
  };
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

  auditSecurityEvent("blocked_origin", req, { origin });
  res.status(403).json({ ok: false, message: "Origen no confiable." });
}

export function requireWarehouseStateWriteAccess(req, res, next) {
  const result = validateWarehouseStateMutation(req.auth, req.body || {});
  if (result.ok) {
    next();
    return;
  }

  auditSecurityEvent("forbidden_state_mutation", req, result);
  res.status(result.reason === "auth_required" ? 401 : 403).json({
    ok: false,
    message: "No tienes permisos para actualizar este estado del sistema.",
  });
}

export function requireWarehouseAction(actionId) {
  return (req, res, next) => {
    if (!req.auth) {
      auditSecurityEvent("auth_required", req, { actionId });
      res.status(401).json({ ok: false, message: "Sesión requerida." });
      return;
    }

    if (req.auth.type === "master") {
      next();
      return;
    }

    if (canUserDoWarehouseAction(req.auth.user, actionId)) {
      next();
      return;
    }

    auditSecurityEvent("forbidden_action", req, { actionId, userId: req.auth.userId });
    res.status(403).json({ ok: false, message: "No tienes permisos para realizar esta acción." });
  };
}

export function requireBoardAction(actionId, options = {}) {
  const { boardIdParam = "boardId" } = options;

  return (req, res, next) => {
    if (!req.auth) {
      auditSecurityEvent("auth_required", req, { actionId, boardIdParam });
      res.status(401).json({ ok: false, message: "Sesión requerida." });
      return;
    }

    if (req.auth.type === "master") {
      next();
      return;
    }

    const boardId = req.params?.[boardIdParam] || req.body?.[boardIdParam] || req.body?.boardId;
    if (!boardId) {
      res.status(400).json({ ok: false, message: "No se encontró el tablero objetivo." });
      return;
    }

    if (canUserDoBoardAction(req.auth.user, boardId, actionId)) {
      next();
      return;
    }

    auditSecurityEvent("forbidden_board_action", req, { actionId, boardId, userId: req.auth.userId });
    res.status(403).json({ ok: false, message: "No tienes permisos para operar en este tablero." });
  };
}