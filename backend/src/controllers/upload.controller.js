import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditSecurityEvent } from "../services/security-events.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = process.env.RENDER ? "/var/data" : path.resolve(__dirname, "../../data");
const uploadsDirectory = path.join(dataDirectory, "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

function decodeUploadedOriginalName(originalName) {
  const rawName = String(originalName || "").trim();
  if (!rawName) return "archivo";
  try {
    const decoded = Buffer.from(rawName, "latin1").toString("utf8");
    return decoded.includes("\uFFFD") ? rawName : decoded;
  } catch {
    return rawName;
  }
}

function sanitizeStorageFileName(fileName) {
  const normalized = String(fileName || "")
    .replaceAll(/[\\/]/g, " ")
    .replaceAll(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return normalized || "archivo";
}

export async function uploadFileController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required in field 'file'.",
      });
    }

    const originalName = decodeUploadedOriginalName(req.file.originalname);
    const safeName = sanitizeStorageFileName(originalName);
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDirectory, uniqueName);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/api/uploads/files/${uniqueName}`;
    const uploadPayload = {
      fileUrl,
      fileThumbUrl: fileUrl,
      filePublicId: uniqueName,
      fileMimeType: req.file.mimetype,
      bytes: req.file.size,
      originalName,
    };

    auditSecurityEvent("file_uploaded", req, {
      originalName,
      mimeType: req.file.mimetype,
      bytes: req.file.size,
      fileUrl: uploadPayload.fileUrl,
    });

    return res.status(201).json({
      ok: true,
      data: uploadPayload,
    });
  } catch (error) {
    return next(error);
  }
}

export async function serveUploadedFileController(req, res, next) {
  try {
    const { fileName } = req.params;
    if (!fileName || /[/\\]/.test(fileName)) {
      return res.status(400).json({ ok: false, message: "Nombre de archivo inválido." });
    }
    const filePath = path.join(uploadsDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, message: "Archivo no encontrado." });
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}
