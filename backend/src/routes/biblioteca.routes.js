import { Router } from "express";
import {
  getBibliotecaController,
  uploadBibliotecaFileController,
  deleteBibliotecaFileController,
} from "../controllers/biblioteca.controller.js";
import { requireAuth, requireWarehouseAction } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const bibliotecaRouter = Router();

// Cualquier usuario autenticado puede listar
bibliotecaRouter.get("/", requireAuth, getBibliotecaController);

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
