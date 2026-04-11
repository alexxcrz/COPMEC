import { Router } from "express";
import { importBoardController } from "../controllers/import.controller.js";
import { requireRoles } from "../middleware/auth.middleware.js";
import { importUpload } from "../middleware/import.middleware.js";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";

export const importRouter = Router();

importRouter.post("/", requireRoles([ROLE_LEAD, ROLE_SR]), importUpload.single("file"), importBoardController);
