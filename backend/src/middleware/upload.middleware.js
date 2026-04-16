import multer from "multer";
import path from "node:path";
import { auditSecurityEvent } from "../services/security-events.service.js";
import { isAllowedUploadBuffer } from "../utils/file-signatures.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".xlsx", ".xls", ".docx", ".doc", ".txt"]);

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const extension = path.extname(String(file.originalname || "")).toLowerCase();
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const hasValidExtension = ALLOWED_EXTENSIONS.has(extension);

  if (hasValidMimeType && hasValidExtension) {
    cb(null, true);
    return;
  }

  cb(new Error("Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, PDF."));
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20, parts: 25 },
  fileFilter,
});

export function requireValidUploadSignature(req, res, next) {
  if (!req.file) {
    next();
    return;
  }

  if (!isAllowedUploadBuffer(req.file)) {
    auditSecurityEvent("blocked_upload_signature", req, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(400).json({ ok: false, message: "El contenido del archivo no coincide con un formato permitido." });
    return;
  }

  next();
}
