const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function importBoardFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/imports`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo importar el archivo.");
  }

  const payload = await response.json();
  return payload.data;
}

export async function getCurrentBoard() {
  const response = await fetch(`${API_BASE_URL}/api/boards/current`);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data;
}

export async function getBoards() {
  const response = await fetch(`${API_BASE_URL}/api/boards`);
  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function createBoard(payload) {
  const response = await fetch(`${API_BASE_URL}/api/boards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo crear el tablero.");
  }

  const result = await response.json();
  return result.data;
}

export async function searchBoardRows(boardId, query) {
  const searchParams = new URLSearchParams({ q: query || "" });
  const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/search?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "No se pudo buscar en el tablero.");
  }

  const payload = await response.json();
  return payload.data;
}
