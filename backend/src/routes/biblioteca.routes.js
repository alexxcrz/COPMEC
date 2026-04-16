import { Router } from "express";
import {
  getBibliotecaController,
  uploadBibliotecaFileController,
  serveBibliotecaFileController,
  deleteBibliotecaFileController,
} from "../controllers/biblioteca.controller.js";
import { requireAuth, requireWarehouseAction } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const bibliotecaRouter = Router();

// Cualquier usuario autenticado puede listar
bibliotecaRouter.get("/", requireAuth, getBibliotecaController);

// Servir archivos desde disco
bibliotecaRouter.get("/files/:fileName", requireAuth, serveBibliotecaFileController);

// Solo usuarios con permiso manageCatalog pueden subir
bibliotecaRouter.post(
  "/",
  requireWarehouseAction("manageCatalog"),
  upload.single("file"),
  uploadBibliotecaFileController,
);

// Solo usuarios con permiso manageCatalog pueden eliminar
bibliotecaRouter.delete(
  "/:fileId",
  requireWarehouseAction("manageCatalog"),
  deleteBibliotecaFileController,
);
