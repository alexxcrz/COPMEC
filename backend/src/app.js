import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import {
  corsOriginValidator,
  isProduction,
  jsonBodyLimit,
  maxRequestsPerWindow,
  trustProxyValue,
  uploadRateLimitMaxRequests,
  urlencodedBodyLimit,
  windowMs,
} from "./config/env.js";
import { boardRouter } from "./routes/board.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { importRouter } from "./routes/import.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { warehouseRouter } from "./routes/warehouse.routes.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxyValue);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: corsOriginValidator,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.use(rateLimit({
  windowMs,
  max: maxRequestsPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  message: { message: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
}));

const uploadLimiter = rateLimit({
  windowMs,
  max: uploadRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Límite temporal alcanzado para cargas o importaciones." },
});

app.use(express.json({ limit: jsonBodyLimit, strict: true }));
app.use(express.urlencoded({ extended: true, limit: urlencodedBodyLimit }));

app.get("/", (_req, res) => {
  res.json({
    name: "COPMEC API",
    status: "ok",
    environment: isProduction ? "production" : "development",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/boards", boardRouter);
app.use("/api/imports", uploadLimiter, importRouter);
app.use("/api/uploads", uploadLimiter, uploadRouter);
app.use("/api/warehouse", warehouseRouter);

app.use(errorHandler);
