const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const isProduction = process.env.NODE_ENV === "production";
export const allowedOrigins = parseList(process.env.CORS_ALLOWED_ORIGINS);
export const jsonBodyLimit = process.env.JSON_BODY_LIMIT || "1mb";
export const urlencodedBodyLimit = process.env.URLENCODED_BODY_LIMIT || "1mb";
export const windowMs = parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
export const maxRequestsPerWindow = parseInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 300);
export const uploadRateLimitMaxRequests = parseInteger(process.env.RATE_LIMIT_UPLOAD_MAX_REQUESTS, 20);
export const trustProxyValue = isProduction ? 1 : false;

export function validateEnv() {
  const missing = [];

  if (isProduction && !process.env.DATABASE_URL) {
    missing.push("DATABASE_URL");
  }

  if (isProduction && allowedOrigins.length === 0) {
    missing.push("CORS_ALLOWED_ORIGINS");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function corsOriginValidator(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const devOrigins = new Set(DEFAULT_DEV_ORIGINS);

  if (!isProduction && devOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Origin not allowed by CORS."));
}