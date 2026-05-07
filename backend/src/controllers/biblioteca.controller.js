import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  getBibliotecaFiles,
  addBibliotecaFile,
  addBibliotecaNotification,
  deleteBibliotecaFile,
  updateBibliotecaFileCover,
  updateBibliotecaFileName,
} from "../services/warehouse.store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = process.env.RENDER ? "/var/data" : path.resolve(__dirname, "../../data");
const bibliotecaDirectory = path.join(dataDirectory, "biblioteca");

if (!fs.existsSync(bibliotecaDirectory)) {
  fs.mkdirSync(bibliotecaDirectory, { recursive: true });
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

export async function getBibliotecaController(req, res, next) {
  try {
    const files = getBibliotecaFiles();
    return res.json({ ok: true, data: files });
  } catch (error) {
    return next(error);
  }
}

export async function uploadBibliotecaFileController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "Archivo requerido." });
    }

    const { area = "General", description = "", priority = "baja", notifyPlayers = "false" } = req.body;
    const shouldNotify = notifyPlayers === "true" || notifyPlayers === true;
    const validPriority = ["alta", "media", "baja"].includes(priority) ? priority : "baja";

    const originalName = decodeUploadedOriginalName(req.file.originalname);
    const safeName = sanitizeStorageFileName(originalName);
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(bibliotecaDirectory, uniqueName);

    fs.writeFileSync(filePath, req.file.buffer);

    const entry = addBibliotecaFile({
      area: String(area).trim() || "General",
      description: String(description).trim(),
      priority: validPriority,
      uploadedById: req.auth.userId,
      uploadedByName: req.auth.user?.name || "Sistema",
      originalName,
      fileName: uniqueName,
      fileMimeType: req.file.mimetype,
      bytes: req.file.size,
    });

    if (shouldNotify) {
      addBibliotecaNotification({
        fileId: entry.id,
        originalName,
        area: entry.area,
        priority: validPriority,
        authorName: req.auth.user?.name || "Sistema",
      });
    }

    auditSecurityEvent("biblioteca_file_uploaded", req, {
      fileId: entry.id,
      originalName,
      area,
    });

    return res.status(201).json({ ok: true, data: entry });
  } catch (error) {
    console.error("[biblioteca] upload error:", error?.message);
    return next(error);
  }
}

export async function serveBibliotecaFileController(req, res, next) {
  try {
    const { fileName } = req.params;
    if (!fileName || /[/\\]/.test(fileName)) {
      return res.status(400).json({ ok: false, message: "Nombre de archivo inválido." });
    }
    const filePath = path.join(bibliotecaDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, message: "Archivo no encontrado." });
    }
    // File names are immutable (timestamped), so aggressive cache is safe and faster.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
}

export async function uploadBibliotecaCoverController(req, res, next) {
  try {
    const { fileId } = req.params;
    if (!req.file) return res.status(400).json({ ok: false, message: "Imagen de portada requerida." });

    const files = getBibliotecaFiles();
    const entry = files.find((f) => f.id === fileId);
    if (!entry) return res.status(404).json({ ok: false, message: "Archivo no encontrado." });

    // Eliminar portada anterior si existe
    if (entry.coverFileName) {
      const oldPath = path.join(bibliotecaDirectory, entry.coverFileName);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const safeName = `cover_${fileId}_${Date.now()}${path.extname(req.file.originalname).toLowerCase() || ".jpg"}`;
    const coverPath = path.join(bibliotecaDirectory, safeName);
    fs.writeFileSync(coverPath, req.file.buffer);

    const result = updateBibliotecaFileCover(fileId, {
      coverFileName: safeName,
      fileThumbUrl: null, // se sirve desde disco
    });

    auditSecurityEvent("biblioteca_cover_uploaded", req, { fileId });
    return res.json({ ok: true, data: result.file });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBibliotecaCoverController(req, res, next) {
  try {
    const { fileId } = req.params;
    const files = getBibliotecaFiles();
    const entry = files.find((f) => f.id === fileId);
    if (!entry) return res.status(404).json({ ok: false, message: "Archivo no encontrado." });

    if (entry.coverFileName) {
      const coverPath = path.join(bibliotecaDirectory, entry.coverFileName);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    const result = updateBibliotecaFileCover(fileId, { coverFileName: null, fileThumbUrl: null });
    return res.json({ ok: true, data: result.file });
  } catch (error) {
    return next(error);
  }
}

export async function renameBibliotecaFileNameController(req, res, next) {
  try {
    const { fileId } = req.params;
    const originalName = String(req.body?.originalName || "").replaceAll(/\s+/g, " ").trim();
    if (!originalName) {
      return res.status(400).json({ ok: false, message: "Nombre de archivo requerido." });
    }

    const result = updateBibliotecaFileName(fileId, originalName);
    if (!result.ok) {
      const status = result.reason === "file_not_found" ? 404 : 400;
      return res.status(status).json({ ok: false, message: result.message || "No se pudo actualizar el nombre." });
    }

    auditSecurityEvent("biblioteca_file_renamed", req, {
      fileId,
      originalName,
    });

    return res.json({ ok: true, data: result.file });
  } catch (error) {
    return next(error);
  }
}

export async function deleteBibliotecaFileController(req, res, next) {
  try {
    const { fileId } = req.params;
    const files = getBibliotecaFiles();
    const file = files.find((f) => f.id === fileId);

    const result = deleteBibliotecaFile(fileId);
    if (!result.ok) {
      return res.status(404).json({ ok: false, message: result.message || "Archivo no encontrado." });
    }

    if (file?.fileName) {
      const filePath = path.join(bibliotecaDirectory, file.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (file?.coverFileName) {
      const coverPath = path.join(bibliotecaDirectory, file.coverFileName);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }

    auditSecurityEvent("biblioteca_file_deleted", req, { fileId });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}
