import { Router } from "express";
import { requireRoles, requireWarehouseStateWriteAccess } from "../middleware/auth.middleware.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  createWarehouseWeekFromCatalog,
  getWarehouseState,
  replaceWarehouseState,
  subscribeWarehouseState,
} from "../services/warehouse.store.js";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";

export const warehouseRouter = Router();

warehouseRouter.get("/state", (_req, res) => {
  res.json(getWarehouseState());
});

warehouseRouter.put("/state", requireWarehouseStateWriteAccess, (req, res) => {
  const nextState = replaceWarehouseState(req.body || {});
  auditSecurityEvent("warehouse_state_replaced", req, {
    revision: nextState?.revision,
    users: Array.isArray(nextState?.users) ? nextState.users.length : 0,
    boards: Array.isArray(nextState?.controlBoards) ? nextState.controlBoards.length : 0,
  });
  res.json(nextState);
});

warehouseRouter.post("/weeks", requireRoles([ROLE_LEAD, ROLE_SR]), (_req, res) => {
  const nextState = createWarehouseWeekFromCatalog();
  auditSecurityEvent("warehouse_week_created", _req, {
    revision: nextState?.revision,
    totalWeeks: Array.isArray(nextState?.weeks) ? nextState.weeks.length : 0,
  });
  res.status(201).json(nextState);
});

warehouseRouter.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendState = (state) => {
    res.write(`data: ${JSON.stringify({ type: "state", state })}\n\n`);
  };

  sendState(getWarehouseState());
  const unsubscribe = subscribeWarehouseState(sendState);

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});