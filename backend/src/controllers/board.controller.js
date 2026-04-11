import {
  createBoardColumn,
  createBoardRow,
  createBoard,
  getAllBoards,
  getBoardById,
  getCurrentBoard,
  searchBoardRows,
  updateBoardCell,
} from "../services/board.persistence.js";

const DEFAULT_COLUMNS = [
  { key: "codigo", label: "Codigo", type: "text" },
  { key: "descripcion", label: "Descripcion", type: "text" },
  { key: "cantidad", label: "Cantidad", type: "number" },
  { key: "extras", label: "Extras", type: "select", options: [{ value: "Extras", label: "Extras", color: "#dff2ec", textColor: "#123d3d" }] },
];

const DEFAULT_ROW = {
  cells: {
    codigo: "",
    descripcion: "",
    cantidad: "",
    extras: "Extras",
  },
};

export async function listBoardsController(_req, res, next) {
  try {
    const boards = await getAllBoards();
    return res.json({ ok: true, data: boards });
  } catch (error) {
    return next(error);
  }
}

export async function createBoardController(req, res, next) {
  try {
    const name = String(req.body?.name || "Nuevo tablero").trim();
    const columns = Array.isArray(req.body?.columns) && req.body.columns.length
      ? req.body.columns
      : DEFAULT_COLUMNS;
    const rows = Array.isArray(req.body?.rows) && req.body.rows.length
      ? req.body.rows
      : [DEFAULT_ROW];

    const board = await createBoard({
      name,
      columns,
      rows,
    });

    return res.status(201).json({ ok: true, data: board });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentBoardController(_req, res, next) {
  try {
    const board = await getCurrentBoard();
    if (!board) {
      return res.status(404).json({
        ok: false,
        message: "Aun no existe un tablero importado.",
      });
    }

    return res.json({ ok: true, data: board });
  } catch (error) {
    return next(error);
  }
}

export async function getBoardByIdController(req, res, next) {
  try {
    const board = await getBoardById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ ok: false, message: "Tablero no encontrado." });
    }

    return res.json({ ok: true, data: board });
  } catch (error) {
    return next(error);
  }
}

export async function searchBoardRowsController(req, res, next) {
  try {
    const { boardId } = req.params;
    const query = req.query.q || "";

    const rows = await searchBoardRows(boardId, query);
    if (!rows) {
      return res.status(404).json({ ok: false, message: "Tablero no encontrado." });
    }

    return res.json({ ok: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function updateBoardCellController(req, res, next) {
  try {
    const { boardId } = req.params;
    const { rowId, columnKey, value } = req.body;

    if (!rowId || !columnKey) {
      return res.status(400).json({
        ok: false,
        message: "rowId y columnKey son obligatorios.",
      });
    }

    await updateBoardCell({ boardId, rowId, columnKey, value });

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}

export async function createBoardRowController(req, res, next) {
  try {
    const { boardId } = req.params;
    const row = await createBoardRow(boardId);

    if (!row) {
      return res.status(404).json({
        ok: false,
        message: "No se pudo crear la fila.",
      });
    }

    return res.status(201).json({ ok: true, data: row });
  } catch (error) {
    return next(error);
  }
}

export async function createBoardColumnController(req, res, next) {
  try {
    const { boardId } = req.params;
    const label = String(req.body?.label || "Nueva columna").trim();
    const key = String(req.body?.key || "").trim();
    const type = String(req.body?.type || "text").trim();
    const options = Array.isArray(req.body?.options) ? req.body.options : [];

    if (!key) {
      return res.status(400).json({
        ok: false,
        message: "La clave de la columna es obligatoria.",
      });
    }

    const allowedTypes = ["text", "number", "checkbox", "select", "file", "date"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "Tipo de columna no valido.",
      });
    }

    const column = await createBoardColumn(boardId, {
      label,
      key,
      type,
      options,
    });

    return res.status(201).json({ ok: true, data: column });
  } catch (error) {
    return next(error);
  }
}
