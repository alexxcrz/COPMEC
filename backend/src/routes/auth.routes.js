import { Router } from "express";
import { clearSessionCookie, isMasterCredentials, setSessionCookie } from "../config/auth.js";
import { requireRoles } from "../middleware/auth.middleware.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import { readSecurityEvents } from "../services/security-events.service.js";
import { BOOTSTRAP_MASTER_ID, authenticateWarehouseUser, getLoginDirectory, hasLeadUser, sanitizeUserRecord } from "../services/warehouse.store.js";

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

  setSessionCookie(res, { type: "user", userId: user.id });
  auditSecurityEvent("login_success", req, { login, authType: "user", userId: user.id, role: user.role });
  res.json({ ok: true, userId: user.id, user: sanitizeUserRecord(user), isBootstrapMaster: false });
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

  res.json({ ok: true, userId: req.auth.user.id, user: sanitizeUserRecord(req.auth.user), isBootstrapMaster: false });
});

authRouter.get("/security-events", requireRoles([ROLE_LEAD, ROLE_SR]), (req, res) => {
  const limit = Number(req.query.limit || 200);
  res.json({ ok: true, data: readSecurityEvents(limit) });
});

authRouter.post("/logout", (_req, res) => {
  auditSecurityEvent("logout", _req);
  clearSessionCookie(res);
  res.json({ ok: true });
});