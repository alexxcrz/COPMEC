import { Router } from "express";
import { importBoardController } from "../controllers/import.controller.js";
import { importUpload } from "../middleware/import.middleware.js";

export const importRouter = Router();

importRouter.post("/", importUpload.single("file"), importBoardController);
