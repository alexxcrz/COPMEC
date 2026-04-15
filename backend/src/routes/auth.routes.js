import { Router } from "express";
import { clearSessionCookie, isMasterCredentials, setSessionCookie } from "../config/auth.js";
import { requireRoles } from "../middleware/auth.middleware.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import { readSecurityEvents } from "../services/security-events.service.js";
import { BOOTSTRAP_MASTER_ID, authenticateWarehouseUser, bootstrapFirstLeadUser, changeWarehouseSelfPassword, getLoginDirectory, hasLeadUser, resetWarehouseUserPassword, sanitizeUserRecord } from "../services/warehouse.store.js";
import { STRONG_PASSWORD_MIN_LENGTH, TEMPORARY_PASSWORD_MIN_LENGTH } from "../utils/passwords.js";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";

export const authRouter = Router();

authRouter.get("/login-options", (_req, res) => {
  res.json(getLoginDirectory());
});

authRouter.post("/login", (req, res) => {
  const login = String(req.body?.email || req.body?.login || "").trim();
  const password = String(req.body?.password || "");

  if (!login || !password) {
    auditSecurityEvent("login_failed", req, { reason: "missing_credentials", login });
    res.status(400).json({ ok: false, message: "Credenciales incompletas." });
    return;
  }

  const directory = getLoginDirectory();
  if (directory.system.masterBootstrapEnabled && isMasterCredentials(login, password)) {
    setSessionCookie(res, { type: "master", userId: BOOTSTRAP_MASTER_ID });
    auditSecurityEvent("login_success", req, { login, authType: "master" });
    res.json({ ok: true, userId: BOOTSTRAP_MASTER_ID, isBootstrapMaster: true });
    return;
  }

  const user = authenticateWarehouseUser(login, password);
  if (!user) {
    auditSecurityEvent("login_failed", req, { reason: "invalid_credentials", login });
    res.status(401).json({ ok: false, message: "Credenciales inválidas." });
    return;
  }

  setSessionCookie(res, { type: "user", userId: user.id, sessionVersion: user.sessionVersion || 1 });
  auditSecurityEvent("login_success", req, { login, authType: "user", userId: user.id, role: user.role });
  res.json({ ok: true, userId: user.id, user: sanitizeUserRecord(user), mustChangePassword: Boolean(user.mustChangePassword), isBootstrapMaster: false });
});

authRouter.get("/session", (req, res) => {
  if (!req.auth) {
    res.status(401).json({ ok: false, message: "Sin sesión activa." });
    return;
  }

  if (req.auth.type === "master") {
    res.json({ ok: true, userId: BOOTSTRAP_MASTER_ID, isBootstrapMaster: true, hasLeadUser: hasLeadUser() });
    return;
  }

  res.json({ ok: true, userId: req.auth.user.id, user: sanitizeUserRecord(req.auth.user), mustChangePassword: Boolean(req.auth.user.mustChangePassword), isBootstrapMaster: false });
});

authRouter.get("/security-events", requireRoles([ROLE_LEAD, ROLE_SR]), (req, res) => {
  const limit = Number(req.query.limit || 200);
  res.json({ ok: true, data: readSecurityEvents(limit) });
});

authRouter.patch("/password", (req, res) => {
  const result = changeWarehouseSelfPassword(req.auth, req.body?.password || "");
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : 400;
    res.status(status).json({ ok: false, message: result.reason === "weak_password" ? `La contraseña debe tener al menos ${STRONG_PASSWORD_MIN_LENGTH} caracteres e incluir mayúscula, minúscula, número y símbolo.` : "No fue posible actualizar la contraseña." });
    return;
  }

  setSessionCookie(res, { type: "user", userId: result.user.id, sessionVersion: result.user.sessionVersion || 1 });
  auditSecurityEvent("self_password_changed", req, { userId: result.user.id, role: result.user.role });
  res.json({ ok: true, data: { state: result.state, userId: result.user.id, mustChangePassword: Boolean(result.user.mustChangePassword) } });
});

authRouter.patch("/users/:userId/password", requireRoles([ROLE_LEAD, ROLE_SR]), (req, res) => {
  const result = resetWarehouseUserPassword(req.auth, req.params.userId, req.body?.password || "");
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: result.reason === "weak_temporary_password" ? `La contraseña temporal debe tener al menos ${TEMPORARY_PASSWORD_MIN_LENGTH} caracteres.` : "No fue posible restablecer la contraseña." });
    return;
  }

  auditSecurityEvent("user_password_reset", req, { targetUserId: result.userId, targetUserName: result.userName });
  res.json({ ok: true, data: { state: result.state, userId: result.userId, userName: result.userName, mustChangePassword: true } });
});

authRouter.post("/logout", (_req, res) => {
  auditSecurityEvent("logout", _req);
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.post("/bootstrap-lead", (req, res) => {
  if (req.auth?.type !== "master") {
    auditSecurityEvent("bootstrap_lead_unauthorized", req);
    res.status(401).json({ ok: false, message: "Acceso de maestro requerido para configuración inicial." });
    return;
  }

  const result = bootstrapFirstLeadUser(req.body || {});
  if (!result.ok) {
    const status = result.reason === "lead_already_exists" || result.reason === "bootstrap_not_enabled" ? 409 : 400;
    const message =
      result.reason === "weak_password"
        ? `La contraseña debe tener al menos ${STRONG_PASSWORD_MIN_LENGTH} caracteres e incluir mayúscula, minúscula, número y símbolo.`
        : result.reason === "invalid_payload"
          ? "Completa todos los campos requeridos: nombre, correo/usuario, área, cargo y contraseña."
          : result.reason === "lead_already_exists"
            ? "Ya existe un usuario Lead. La configuración inicial ya fue completada."
            : "El modo de configuración inicial no está activo.";
    res.status(status).json({ ok: false, message });
    return;
  }

  setSessionCookie(res, { type: "user", userId: result.userId, sessionVersion: result.user?.sessionVersion || 1 });
  auditSecurityEvent("bootstrap_lead_created", req, { userId: result.userId });
  res.status(201).json({ ok: true, userId: result.userId, user: sanitizeUserRecord(result.user), state: result.state });
});