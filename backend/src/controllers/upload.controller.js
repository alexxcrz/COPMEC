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

export async function uploadFileController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required in field 'file'.",
      });
    }

    const safeName = req.file.originalname.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDirectory, uniqueName);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/api/uploads/files/${uniqueName}`;

    auditSecurityEvent("file_uploaded", req, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      bytes: req.file.size,
      fileUrl,
    });

    return res.status(201).json({
      ok: true,
      data: {
        fileUrl,
        fileThumbUrl: fileUrl,
        filePublicId: uniqueName,
        fileMimeType: req.file.mimetype,
        bytes: req.file.size,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function serveUploadedFileController(req, res, next) {
  try {
    const { fileName } = req.params;
    if (!fileName || /[\/\\]/.test(fileName)) {
      return res.status(400).json({ ok: false, message: "Nombre de archivo inválido." });
    }
    const filePath = path.join(uploadsDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, message: "Archivo no encontrado." });
    }
    res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}
