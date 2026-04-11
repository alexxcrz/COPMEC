import { Router } from "express";
import { uploadFileController } from "../controllers/upload.controller.js";
import { requireMinimumRole } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const uploadRouter = Router();

uploadRouter.post("/", requireMinimumRole("Junior (Jr)"), upload.single("file"), uploadFileController);
