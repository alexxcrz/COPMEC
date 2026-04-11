const boards = new Map();

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function rowMatches(row, term) {
  return Object.values(row.cells).some((value) => {
    if (value === null || value === undefined || value === "") {
      return false;
    }

    if (typeof value === "object") {
      return JSON.stringify(value).toLowerCase().includes(term);
    }

    return String(value).toLowerCase().includes(term);
  });
}

export function upsertBoard(board) {
  boards.set(board.id, board);
  return board;
}

export function getBoard(boardId) {
  return boards.get(boardId) || null;
}

export function getLatestBoard() {
  const all = Array.from(boards.values());
  return all[all.length - 1] || null;
}

export function listBoardsInMemory() {
  return Array.from(boards.values());
}

export function createBoardInMemory({ name, columns, rows }) {
  const safeColumns = (columns || []).map((column, index) => ({
    id: column.id || createId("col"),
    key: column.key || `col_${index + 1}`,
    label: column.label || `Columna ${index + 1}`,
    type: column.type || "text",
    options: column.options,
  }));

  const safeRows = (rows || []).map((row) => ({
    id: row.id || createId("row"),
    cells: row.cells || {},
    formulas: row.formulas || {},
  }));

  const board = {
    id: createId("board"),
    name,
    importedAt: new Date().toISOString(),
    columns: safeColumns,
    rows: safeRows,
  };

  boards.set(board.id, board);
  return board;
}

export function searchRows(boardId, query) {
  const board = getBoard(boardId);
  if (!board) return null;

  const term = String(query || "").trim().toLowerCase();
  if (!term) return board.rows;

  return board.rows.filter((row) => rowMatches(row, term));
}

export function updateRowCellInMemory(boardId, rowId, columnKey, value) {
  const board = getBoard(boardId);
  if (!board) return null;

  board.rows = board.rows.map((row) => {
    if (row.id !== rowId) return row;
    return {
      ...row,
      cells: {
        ...row.cells,
        [columnKey]: value,
      },
    };
  });

  boards.set(board.id, board);
  return { ok: true };
}

export function createRowInMemory(boardId) {
  const board = getBoard(boardId);
  if (!board) return null;

  const cells = board.columns.reduce((acc, column) => {
    if (column.type === "checkbox") {
      acc[column.key] = false;
      return acc;
    }

    if (column.type === "file") {
      acc[column.key] = null;
      return acc;
    }

    if (column.type === "select") {
      acc[column.key] = column.options?.[0]?.value || "";
      return acc;
    }

    acc[column.key] = "";
    return acc;
  }, {});

  const row = {
    id: createId("row"),
    cells,
  };

  board.rows.push(row);
  boards.set(board.id, board);
  return row;
}

export function createColumnInMemory(boardId, payload) {
  const board = getBoard(boardId);
  if (!board) return null;

  const column = {
    id: createId("col"),
    key: payload.key,
    label: payload.label,
    type: payload.type || "text",
    options: Array.isArray(payload.options) ? payload.options : undefined,
  };

  board.columns.push(column);

  board.rows = board.rows.map((row) => {
    const nextCells = { ...row.cells };

    if (column.type === "checkbox") {
      nextCells[column.key] = false;
    } else if (column.type === "file") {
      nextCells[column.key] = null;
    } else if (column.type === "select") {
      nextCells[column.key] = column.options?.[0]?.value || "";
    } else {
      nextCells[column.key] = "";
    }

    return {
      ...row,
      cells: nextCells,
    };
  });

  boards.set(board.id, board);
  return column;
}
