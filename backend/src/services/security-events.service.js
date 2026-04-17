import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Usar disco persistente de Render si está disponible
const dataDirectory = process.env.RENDER ? "/var/data" : path.resolve(__dirname, "../../data");
const logFilePath = path.join(dataDirectory, "security-events.log");

function ensureLogFile() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "", "utf8");
  }
}

function limitValue(value, maxLength = 400) {
  const normalized = typeof value === "string" ? value : JSON.stringify(value);
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

export function auditSecurityEvent(eventType, req, details = {}) {
  try {
    ensureLogFile();
    const entry = {
      timestamp: new Date().toISOString(),
      eventType,
      method: req?.method || null,
      path: req?.originalUrl || req?.path || null,
      ip: req?.ip || req?.socket?.remoteAddress || null,
      origin: req?.headers?.origin || null,
      userAgent: req?.headers?.["user-agent"] || null,
      authType: req?.auth?.type || null,
      userId: req?.auth?.userId || req?.auth?.user?.id || null,
      role: req?.auth?.role || req?.auth?.user?.role || null,
      details: Object.fromEntries(Object.entries(details).map(([key, value]) => [key, limitValue(value)])),
    };
    fs.appendFileSync(logFilePath, `${JSON.stringify(entry)}\n`, "utf8");

    // Rotate: keep last 10 000 entries to prevent unbounded disk growth.
    rotateLogIfNeeded();
  } catch {
    // Security logging must not break the request flow.
  }
}

const LOG_MAX_LINES = 10_000;
const LOG_ROTATE_EVERY = 100; // only check every N writes
let _rotateCounter = 0;

function rotateLogIfNeeded() {
  _rotateCounter += 1;
  if (_rotateCounter % LOG_ROTATE_EVERY !== 0) return;
  try {
    const raw = fs.readFileSync(logFilePath, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length > LOG_MAX_LINES) {
      const trimmed = lines.slice(-LOG_MAX_LINES).join("\n") + "\n";
      fs.writeFileSync(logFilePath, trimmed, "utf8");
    }
  } catch {
    // Non-critical — skip silently.
  }
}

export function readSecurityEvents(limit = 200) {
  try {
    ensureLogFile();
    const raw = fs.readFileSync(logFilePath, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-Math.max(1, Math.min(Number(limit) || 200, 1000)))
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}