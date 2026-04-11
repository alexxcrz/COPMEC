import { Router } from "express";
import { uploadFileController } from "../controllers/upload.controller.js";
import { upload } from "../middleware/upload.middleware.js";

export const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), uploadFileController);
