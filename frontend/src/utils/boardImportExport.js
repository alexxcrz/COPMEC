function sanitizeFileNamePart(value) {
  return String(value || "tablero")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export function buildBoardExportPayload(board) {
  return {
    version: "copmec-board/1",
    exportedAt: new Date().toISOString(),
    name: board?.name || "Tablero",
    description: board?.description || "",
    category: board?.category || "",
    visibilityType: board?.visibilityType || "department",
    sharedDepartments: Array.isArray(board?.sharedDepartments) ? board.sharedDepartments : [],
    accessUserIds: Array.isArray(board?.accessUserIds) ? board.accessUserIds : [],
    settings: board?.settings || {},
    fields: Array.isArray(board?.fields) ? board.fields : [],
  };
}

export function downloadBoardAsJson(board) {
  const payload = buildBoardExportPayload(board);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tablero-${sanitizeFileNamePart(payload.name)}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBoardImportJson(rawText) {
  const parsed = JSON.parse(rawText);
  const fields = Array.isArray(parsed?.fields)
    ? parsed.fields
    : (Array.isArray(parsed?.columns) ? parsed.columns : []);

  if (!fields.length) {
    throw new Error("El archivo no tiene la estructura esperada: no incluye campos del tablero.");
  }

  return {
    parsed,
    createPayload: {
      name: `${parsed?.name || "Tablero importado"} (importado)`,
      description: parsed?.description || "",
      category: parsed?.category || "Personalizada",
      visibilityType: parsed?.visibilityType || "department",
      sharedDepartments: Array.isArray(parsed?.sharedDepartments) ? parsed.sharedDepartments : [],
      accessUserIds: Array.isArray(parsed?.accessUserIds) ? parsed.accessUserIds : [],
      settings: parsed?.settings || {},
      columns: fields,
    },
  };
}
