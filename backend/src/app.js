import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  authRateLimitMaxRequests,
  corsOriginValidator,
  isProduction,
  jsonBodyLimit,
  maxRequestsPerWindow,
  trustProxyValue,
  uploadRateLimitMaxRequests,
  urlencodedBodyLimit,
  windowMs,
} from "./config/env.js";
import { attachAuthSession, requireAuth, requireTrustedOrigin } from "./middleware/auth.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { boardRouter } from "./routes/board.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { importRouter } from "./routes/import.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { warehouseRouter } from "./routes/warehouse.routes.js";
import { auditSecurityEvent } from "./services/security-events.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxyValue);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: corsOriginValidator,
  credentials: true,
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
  handler: (req, res) => {
    auditSecurityEvent("rate_limited", req, { scope: "global" });
    res.status(429).json({ message: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." });
  },
}));

const uploadLimiter = rateLimit({
  windowMs,
  max: uploadRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditSecurityEvent("rate_limited", req, { scope: "uploads" });
    res.status(429).json({ message: "Límite temporal alcanzado para cargas o importaciones." });
  },
});

const authLimiter = rateLimit({
  windowMs,
  max: authRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditSecurityEvent("rate_limited", req, { scope: "auth_login" });
    res.status(429).json({ message: "Demasiados intentos de autenticación. Intenta más tarde." });
  },
});

app.use(cookieParser());
app.use(attachAuthSession);
app.use(requireTrustedOrigin);
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  next();
});
app.use(express.json({ limit: jsonBodyLimit, strict: true }));
app.use(express.urlencoded({ extended: true, limit: urlencodedBodyLimit }));

app.get("/api", (_req, res) => {
  res.json({
    name: "COPMEC API",
    status: "ok",
    environment: isProduction ? "production" : "development",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRouter);
app.use("/api/boards", requireAuth, boardRouter);
app.use("/api/imports", requireAuth, uploadLimiter, importRouter);
app.use("/api/uploads", requireAuth, uploadLimiter, uploadRouter);
app.use("/api/warehouse", requireAuth, warehouseRouter);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));
  app.get("/{*path}", (req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) {
      return next();
    }

    res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      name: "COPMEC API",
      status: "ok",
      environment: isProduction ? "production" : "development",
      frontend: "build not found",
    });
  });
}

app.use(errorHandler);
