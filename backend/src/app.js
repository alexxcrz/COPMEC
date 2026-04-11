import cors from "cors";
import express from "express";
import { boardRouter } from "./routes/board.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { importRouter } from "./routes/import.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { warehouseRouter } from "./routes/warehouse.routes.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    name: "COPMEC API",
    status: "ok",
    phase: "base-setup",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/boards", boardRouter);
app.use("/api/imports", importRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/warehouse", warehouseRouter);

app.use(errorHandler);
