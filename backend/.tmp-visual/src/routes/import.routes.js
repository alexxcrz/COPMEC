import { Router } from "express";
import { importBoardController } from "../controllers/import.controller.js";
import { requireWarehouseAction } from "../middleware/auth.middleware.js";
import { importUpload, requireValidImportSignature } from "../middleware/import.middleware.js";

export const importRouter = Router();

importRouter.post("/", requireWarehouseAction("importInventory"), importUpload.single("file"), requireValidImportSignature, importBoardController);
