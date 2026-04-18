import { Router } from "express";
import { uploadFileController, serveUploadedFileController } from "../controllers/upload.controller.js";
import { requireValidUploadSignature, upload } from "../middleware/upload.middleware.js";
import { canUserDoWarehouseAction } from "../services/warehouse.store.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const uploadRouter = Router();

// Serve uploaded files from disk
uploadRouter.get("/files/:fileName", requireAuth, serveUploadedFileController);

// Allow upload for users with boardWorkflow OR editIncidencia permission
uploadRouter.post("/", (req, res, next) => {
  if (!req.auth) return res.status(401).json({ ok: false, message: "Sesión requerida." });
  if (req.auth.type === "master") return next();
  const canBoard = canUserDoWarehouseAction(req.auth.user, "boardWorkflow");
  const canIncidencia = canUserDoWarehouseAction(req.auth.user, "editIncidencia");
  if (!canBoard && !canIncidencia) {
    auditSecurityEvent("forbidden_action", req, { actionId: "upload", userId: req.auth.userId });
    return res.status(403).json({ ok: false, message: "Sin permiso para subir archivos." });
  }
  next();
}, upload.single("file"), requireValidUploadSignature, uploadFileController);

