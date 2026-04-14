import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  createBoardInMemory,
  createColumnInMemory,
  createRowInMemory,
  getBoard as getBoardInMemory,
  getLatestBoard,
  listBoardsInMemory,
  searchRows,
  updateRowCellInMemory,
} from "./board.store.js";

let hasLoggedDbFallback = false;

function isDbAuthError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("authentication failed against the database server") ||
    message.includes("sasl") ||
    message.includes("password")
  );
}

function logFallbackOnce(error) {
  if (hasLoggedDbFallback) return;
  hasLoggedDbFallback = true;
  console.warn("[COPMEC] DB auth failed. Using in-memory fallback.");
  console.warn(`[COPMEC] ${error?.message || "Unknown database error"}`);
}

function parseColumnSettings(settings) {
  if (!settings || typeof settings !== "object") {
    return {};
  }

  return settings;
}

function normalizeCellValueByType(type, value) {
  if (type === "number") {
    if (value === "" || value === null || value === undefined) {
      return { valueNumber: null };
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return { valueNumber: null };
    }

    return { valueNumber: new Prisma.Decimal(numeric) };
  }

  if (type === "checkbox") {
    return { valueBoolean: Boolean(value) };
  }

  if (type === "date") {
    if (!value) {
      return { valueDate: null };
    }

    const date = new Date(value);
    return { valueDate: Number.isNaN(date.valueOf()) ? null : date };
  }

  if (type === "file") {
    if (!value || typeof value !== "object") {
      return {
        valueJson: null,
        fileUrl: null,
        fileThumbUrl: null,
        filePublicId: null,
        fileMimeType: null,
      };
    }

    return {
      valueJson: value,
      fileUrl: value.url || null,
      fileThumbUrl: value.thumbUrl || null,
      filePublicId: value.publicId || null,
      fileMimeType: value.mimeType || null,
      valueText: value.name || null,
    };
  }

  return { valueText: value === undefined || value === null ? "" : String(value) };
}

function mapCellToFrontend(column, cell) {
  if (!cell) {
    if (column.type === "checkbox") return false;
    if (column.type === "file") return null;
    return "";
  }

  if (column.type === "number") {
    return cell.valueNumber !== null && cell.valueNumber !== undefined
      ? Number(cell.valueNumber)
      : "";
  }

  if (column.type === "checkbox") {
    return Boolean(cell.valueBoolean);
  }

  if (column.type === "date") {
    return cell.valueDate ? new Date(cell.valueDate).toISOString().slice(0, 10) : "";
  }

  if (column.type === "file") {
    if (!cell.fileUrl) {
      return null;
    }

    return {
      url: cell.fileUrl,
      thumbUrl: cell.fileThumbUrl,
      mimeType: cell.fileMimeType,
      name: cell.valueText,
      publicId: cell.filePublicId,
    };
  }

  return cell.valueText || "";
}

function shapeBoard(board) {
  const columns = board.columns
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((column) => {
      const settings = parseColumnSettings(column.settings);
      return {
        id: column.id,
        key: column.key,
        label: column.name,
        type: column.type,
        options: Array.isArray(settings.options) ? settings.options : undefined,
      };
    });

  const rows = board.rows
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((row) => {
      const cells = columns.reduce((acc, column) => {
        const cell = row.cells.find((item) => item.columnId === column.id);
        acc[column.key] = mapCellToFrontend(column, cell);
        return acc;
      }, {});

      return {
        id: row.id,
        cells,
      };
    });

  return {
    id: board.id,
    name: board.name,
    importedAt: board.updatedAt.toISOString(),
    columns,
    rows,
  };
}

function rowMatches(row, query) {
  return Object.values(row.cells).some((value) => {
    if (value === "" || value === null || value === undefined) {
      return false;
    }

    if (typeof value === "object") {
      return JSON.stringify(value).toLowerCase().includes(query);
    }

    return String(value).toLowerCase().includes(query);
  });
}

function getDefaultValueForType(type, settings) {
  if (type === "checkbox") return false;
  if (type === "file") return null;
  if (type === "select") {
    const options = Array.isArray(settings?.options) ? settings.options : [];
    return options[0]?.value || "";
  }
  return "";
}

export async function createBoardWithRows({ name, columns, rows }) {
  try {
    const board = await prisma.board.create({
      data: { name },
    });

    const createdColumns = [];
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const created = await prisma.column.create({
        data: {
          boardId: board.id,
          name: column.label,
          key: column.key,
          type: column.type,
          position: index,
          settings: column.options ? { options: column.options } : undefined,
        },
      });
      createdColumns.push(created);
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const createdRow = await prisma.row.create({
        data: {
          boardId: board.id,
          position: rowIndex,
        },
      });

      for (const column of createdColumns) {
        const rawValue = row.cells[column.key];
        const typedValues = normalizeCellValueByType(column.type, rawValue);

        await prisma.cell.create({
          data: {
            rowId: createdRow.id,
            columnId: column.id,
            ...typedValues,
          },
        });
      }
    }

    return getBoardById(board.id);
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return createBoardInMemory({ name, columns, rows });
  }
}

export async function getBoardById(boardId) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });

    return board ? shapeBoard(board) : null;
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return getBoardInMemory(boardId);
  }
}

export async function getCurrentBoard() {
  try {
    const board = await prisma.board.findFirst({
      orderBy: { updatedAt: "desc" },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });

    return board ? shapeBoard(board) : null;
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return getLatestBoard();
  }
}

export async function getAllBoards() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });

    return boards.map((board) => shapeBoard(board));
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return listBoardsInMemory();
  }
}

export async function createBoard({ name, columns, rows }) {
  return createBoardWithRows({ name, columns, rows });
}

export async function searchBoardRows(boardId, term) {
  try {
    const board = await getBoardById(boardId);
    if (!board) {
      return null;
    }

    const query = String(term || "").trim().toLowerCase();
    if (!query) {
      return board.rows;
    }

    return board.rows.filter((row) => rowMatches(row, query));
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return searchRows(boardId, term);
  }
}

export async function updateBoardCell({ boardId, rowId, columnKey, value }) {
  try {
    const column = await prisma.column.findFirst({
      where: {
        boardId,
        key: columnKey,
      },
    });

    if (!column) {
      throw new Error("Columna no encontrada para este tablero.");
    }

    const row = await prisma.row.findFirst({
      where: {
        id: rowId,
        boardId,
      },
    });

    if (!row) {
      throw new Error("Fila no encontrada para este tablero.");
    }

    const typedValues = normalizeCellValueByType(column.type, value);

    await prisma.cell.upsert({
      where: {
        rowId_columnId: {
          rowId,
          columnId: column.id,
        },
      },
      create: {
        rowId,
        columnId: column.id,
        ...typedValues,
      },
      update: {
        valueText: null,
        valueNumber: null,
        valueBoolean: null,
        valueDate: null,
        valueJson: null,
        fileUrl: null,
        fileThumbUrl: null,
        filePublicId: null,
        fileMimeType: null,
        ...typedValues,
      },
    });

    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    });

    return { ok: true };
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return updateRowCellInMemory(boardId, rowId, columnKey, value);
  }
}

export async function createBoardRow(boardId) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!board) {
      throw new Error("Tablero no encontrado.");
    }

    const maxRow = await prisma.row.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
    });

    const newPosition = maxRow ? maxRow.position + 1 : 0;

    const row = await prisma.row.create({
      data: {
        boardId,
        position: newPosition,
      },
    });

    for (const column of board.columns) {
      const settings = parseColumnSettings(column.settings);
      const defaultValue = getDefaultValueForType(column.type, settings);
      const typedValues = normalizeCellValueByType(column.type, defaultValue);

      await prisma.cell.create({
        data: {
          rowId: row.id,
          columnId: column.id,
          ...typedValues,
        },
      });
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    });

    const shapedBoard = await getBoardById(boardId);
    const createdRow = shapedBoard?.rows?.find((item) => item.id === row.id);

    return createdRow || null;
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return createRowInMemory(boardId);
  }
}

export async function createBoardColumn(boardId, payload) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        rows: true,
      },
    });

    if (!board) {
      throw new Error("Tablero no encontrado.");
    }

    const maxColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
    });

    const position = maxColumn ? maxColumn.position + 1 : 0;

    const column = await prisma.column.create({
      data: {
        boardId,
        name: payload.label,
        key: payload.key,
        type: payload.type,
        position,
        settings: payload.options?.length ? { options: payload.options } : undefined,
      },
    });

    for (const row of board.rows) {
      const typedValues = normalizeCellValueByType(column.type, getDefaultValueForType(column.type, { options: payload.options }));

      await prisma.cell.create({
        data: {
          rowId: row.id,
          columnId: column.id,
          ...typedValues,
        },
      });
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    });

    return {
      id: column.id,
      key: column.key,
      label: column.name,
      type: column.type,
      options: payload.options,
    };
  } catch (error) {
    if (!isDbAuthError(error)) {
      throw error;
    }

    logFallbackOnce(error);
    return createColumnInMemory(boardId, payload);
  }
}
