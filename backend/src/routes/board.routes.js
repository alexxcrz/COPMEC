import { Router } from "express";
import {
  createBoardColumnController,
  createBoardRowController,
  createBoardController,
  getBoardByIdController,
  getCurrentBoardController,
  listBoardsController,
  searchBoardRowsController,
  updateBoardCellController,
} from "../controllers/board.controller.js";
import { requireMinimumRole, requireRoles } from "../middleware/auth.middleware.js";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";

export const boardRouter = Router();

boardRouter.get("/", listBoardsController);
boardRouter.post("/", requireRoles([ROLE_LEAD, ROLE_SR]), createBoardController);
boardRouter.get("/current", getCurrentBoardController);
boardRouter.get("/:boardId", getBoardByIdController);
boardRouter.get("/:boardId/search", searchBoardRowsController);
boardRouter.post("/:boardId/columns", requireRoles([ROLE_LEAD, ROLE_SR]), createBoardColumnController);
boardRouter.post("/:boardId/rows", createBoardRowController);
boardRouter.patch("/:boardId/cells", requireMinimumRole("Junior (Jr)"), updateBoardCellController);
