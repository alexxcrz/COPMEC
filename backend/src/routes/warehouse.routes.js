import { Router } from "express";
import {
  createWarehouseWeekFromCatalog,
  getWarehouseState,
  replaceWarehouseState,
  subscribeWarehouseState,
} from "../services/warehouse.store.js";

export const warehouseRouter = Router();

warehouseRouter.get("/state", (_req, res) => {
  res.json(getWarehouseState());
});

warehouseRouter.put("/state", (req, res) => {
  const nextState = replaceWarehouseState(req.body || {});
  res.json(nextState);
});

warehouseRouter.post("/weeks", (_req, res) => {
  const nextState = createWarehouseWeekFromCatalog();
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