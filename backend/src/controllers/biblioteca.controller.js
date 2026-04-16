import { uploadCellFile } from "../services/cloudinary.service.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  getBibliotecaFiles,
  addBibliotecaFile,
  deleteBibliotecaFile,
} from "../services/warehouse.store.js";

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

    const { area = "General", description = "" } = req.body;

    const uploadResult = await uploadCellFile(req.file, "copmec/biblioteca");
    const entry = addBibliotecaFile({
      area: String(area).trim() || "General",
      description: String(description).trim(),
      uploadedById: req.auth.userId,
      uploadedByName: req.auth.user?.name || "Sistema",
      ...uploadResult,
    });

    auditSecurityEvent("biblioteca_file_uploaded", req, {
      fileId: entry.id,
      originalName: uploadResult.originalName,
      area,
    });

    return res.status(201).json({ ok: true, data: entry });
  } catch (error) {
    console.error("[biblioteca] upload error:", error?.message, error?.http_code);
    return next(error);
  }
}

export async function deleteBibliotecaFileController(req, res, next) {
  try {
    const { fileId } = req.params;
    const result = deleteBibliotecaFile(fileId);

    if (!result.ok) {
      return res.status(404).json({ ok: false, message: result.message || "Archivo no encontrado." });
    }

    auditSecurityEvent("biblioteca_file_deleted", req, { fileId });

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}
