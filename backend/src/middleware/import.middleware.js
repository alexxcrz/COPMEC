import multer from "multer";
import path from "node:path";
import { auditSecurityEvent } from "../services/security-events.service.js";
import { isAllowedImportBuffer } from "../utils/file-signatures.js";

const storage = multer.memoryStorage();
const ALLOWED_EXTENSIONS = new Set([".csv", ".xlsx", ".xls"]);
const ALLOWED_MIME_TYPES = new Set([
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

function fileFilter(_req, file, cb) {
  const extension = path.extname(String(file.originalname || "")).toLowerCase();
  const valid = ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(extension);

  if (!valid) {
    cb(new Error("Archivo no soportado. Usa CSV o XLSX."));
    return;
  }

  cb(null, true);
}

export const importUpload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 10, parts: 12 },
  fileFilter,
});

export function requireValidImportSignature(req, res, next) {
  if (!req.file) {
    next();
    return;
  }

  if (!isAllowedImportBuffer(req.file)) {
    auditSecurityEvent("blocked_import_signature", req, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(400).json({ ok: false, message: "El contenido del archivo importado no coincide con el formato esperado." });
    return;
  }

  next();
}
