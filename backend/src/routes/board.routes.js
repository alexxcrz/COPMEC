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

export const boardRouter = Router();

boardRouter.get("/", listBoardsController);
boardRouter.post("/", createBoardController);
boardRouter.get("/current", getCurrentBoardController);
boardRouter.get("/:boardId", getBoardByIdController);
boardRouter.get("/:boardId/search", searchBoardRowsController);
boardRouter.post("/:boardId/columns", createBoardColumnController);
boardRouter.post("/:boardId/rows", createBoardRowController);
boardRouter.patch("/:boardId/cells", updateBoardCellController);
