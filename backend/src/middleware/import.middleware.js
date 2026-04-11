import multer from "multer";
import path from "node:path";

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
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter,
});
