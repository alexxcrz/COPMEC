import { Router } from "express";
import { uploadFileController } from "../controllers/upload.controller.js";
import { requireWarehouseAction } from "../middleware/auth.middleware.js";
import { requireValidUploadSignature, upload } from "../middleware/upload.middleware.js";

export const uploadRouter = Router();

uploadRouter.post("/", requireWarehouseAction("boardWorkflow"), upload.single("file"), requireValidUploadSignature, uploadFileController);
