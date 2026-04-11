import multer from "multer";
import path from "node:path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"]);

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
