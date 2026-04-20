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
} from "../services/warehouse.store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = process.env.RENDER ? "/var/data" : path.resolve(__dirname, "../../data");
const bibliotecaDirectory = path.join(dataDirectory, "biblioteca");

if (!fs.existsSync(bibliotecaDirectory)) {
  fs.mkdirSync(bibliotecaDirectory, { recursive: true });
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

    const safeName = req.file.originalname.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${safeName}`;
    const filePath = path.join(bibliotecaDirectory, uniqueName);

    fs.writeFileSync(filePath, req.file.buffer);

    const entry = addBibliotecaFile({
      area: String(area).trim() || "General",
      description: String(description).trim(),
      priority: validPriority,
      uploadedById: req.auth.userId,
      uploadedByName: req.auth.user?.name || "Sistema",
      originalName: req.file.originalname,
      fileName: uniqueName,
      fileMimeType: req.file.mimetype,
      bytes: req.file.size,
    });

    if (shouldNotify) {
      addBibliotecaNotification({
        fileId: entry.id,
        originalName: req.file.originalname,
        area: entry.area,
        priority: validPriority,
        authorName: req.auth.user?.name || "Sistema",
      });
    }

    auditSecurityEvent("biblioteca_file_uploaded", req, {
      fileId: entry.id,
      originalName: req.file.originalname,
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
    // Cache covers and images for 7 days; documents for 1 day
    const isImage = /\.(jpe?g|png|webp|gif)$/i.test(fileName);
    const maxAge = isImage ? 60 * 60 * 24 * 7 : 60 * 60 * 24;
    res.setHeader("Cache-Control", `private, max-age=${maxAge}, stale-while-revalidate=3600`);
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
