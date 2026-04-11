import { importBoardFromFile } from "../services/import.service.js";
import { auditSecurityEvent } from "../services/security-events.service.js";

export async function importBoardController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "Debes adjuntar un archivo en el campo 'file'.",
      });
    }

    const board = await importBoardFromFile(req.file);

    auditSecurityEvent("board_imported", req, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      boardId: board?.id,
      boardName: board?.name,
    });

    return res.status(201).json({
      ok: true,
      data: board,
    });
  } catch (error) {
    return next(error);
  }
}
