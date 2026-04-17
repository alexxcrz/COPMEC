import { Router } from "express";
import {
  getBibliotecaController,
  uploadBibliotecaFileController,
  serveBibliotecaFileController,
  deleteBibliotecaFileController,
  uploadBibliotecaCoverController,
  deleteBibliotecaCoverController,
} from "../controllers/biblioteca.controller.js";
import { requireAuth, requireWarehouseAction } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const bibliotecaRouter = Router();

// Cualquier usuario autenticado puede listar
bibliotecaRouter.get("/", requireAuth, getBibliotecaController);

// Servir archivos desde disco (archivos y portadas usan el mismo directorio)
bibliotecaRouter.get("/files/:fileName", requireAuth, serveBibliotecaFileController);

// Solo usuarios con permiso uploadBiblioteca pueden subir
bibliotecaRouter.post(
  "/",
  requireWarehouseAction("uploadBiblioteca"),
  upload.single("file"),
  uploadBibliotecaFileController,
);

// Portada personalizada para un archivo existente
bibliotecaRouter.patch(
  "/:fileId/cover",
  requireWarehouseAction("uploadBiblioteca"),
  upload.single("cover"),
  uploadBibliotecaCoverController,
);

bibliotecaRouter.delete(
  "/:fileId/cover",
  requireWarehouseAction("uploadBiblioteca"),
  deleteBibliotecaCoverController,
);

// Solo usuarios con permiso deleteBiblioteca pueden eliminar
bibliotecaRouter.delete(
  "/:fileId",
  requireWarehouseAction("deleteBiblioteca"),
  deleteBibliotecaFileController,
);
