const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function persistCellValue(boardId, rowId, columnKey, value) {
  if (!boardId) {
    return { ok: true };
  }

  const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/cells`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rowId, columnKey, value }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo guardar la celda.");
  }

  return response.json();
}

export async function createBoardRow(boardId) {
  if (!boardId) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/rows`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo crear una nueva fila.");
  }

  const payload = await response.json();
  return payload.data;
}

export async function createBoardColumn(boardId, payload) {
  if (!boardId) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/columns`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo crear la columna.");
  }

  const result = await response.json();
  return result.data;
}
