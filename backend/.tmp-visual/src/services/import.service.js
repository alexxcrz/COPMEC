import { parseImportFile } from "../utils/importParser.js";
import { createBoardWithRows } from "./board.persistence.js";

function slugify(value, index) {
  const base = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || `col_${index + 1}`;
}

function inferType(values) {
  const sample = values.filter((v) => v !== "" && v !== null && v !== undefined).slice(0, 20);
  if (sample.length === 0) return "text";

  const isBoolean = sample.every((v) => {
    const normalized = String(v).toLowerCase();
    return ["true", "false", "si", "no", "1", "0"].includes(normalized);
  });
  if (isBoolean) return "checkbox";

  const isNumber = sample.every((v) => Number.isFinite(Number(v)));
  if (isNumber) return "number";

  const isDate = sample.every((v) => !Number.isNaN(Date.parse(String(v))));
  if (isDate) return "date";

  const uniqueValues = Array.from(new Set(sample.map((v) => String(v))));
  if (uniqueValues.length <= 6) return "select";

  return "text";
}

function normalizeValue(type, value) {
  if (value === "" || value === null || value === undefined) {
    if (type === "checkbox") return false;
    return "";
  }

  if (type === "number") return Number(value);
  if (type === "checkbox") {
    const normalized = String(value).toLowerCase();
    return ["true", "si", "1"].includes(normalized);
  }
  if (type === "date") {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
  }

  return String(value);
}

export async function importBoardFromFile(file) {
  const {
    headers,
    rows,
    formulasByRow,
    formulaLibrary,
  } = await parseImportFile(file);

  if (!headers.length) {
    throw new Error("No se encontraron encabezados en el archivo importado.");
  }

  const columns = headers.map((header, index) => {
    const values = rows.map((row) => row[header]);
    const type = inferType(values);

    const selectOptions =
      type === "select"
        ? Array.from(new Set(values.filter((value) => value !== ""))).map((value) => ({
            value: String(value),
            label: String(value),
            color: "#e2f2ee",
            textColor: "#144040",
          }))
        : undefined;

    return {
      id: `col-${index + 1}`,
      key: slugify(header, index),
      label: header,
      type,
      options: selectOptions,
    };
  });

  const boardRows = rows.map((row, rowIndex) => {
    const formulasForRow = formulasByRow[rowIndex] || {};

    const cells = columns.reduce((acc, column, colIndex) => {
      const sourceHeader = headers[colIndex];
      acc[column.key] = normalizeValue(column.type, row[sourceHeader]);
      return acc;
    }, {});

    if (Object.prototype.hasOwnProperty.call(cells, "completed") === false) {
      cells.completed = false;
    }

    return {
      id: `row-${Date.now()}-${rowIndex + 1}`,
      cells,
      formulas: formulasForRow,
    };
  });

  const board = await createBoardWithRows({
    name: file.originalname.replace(/\.[^/.]+$/, ""),
    columns,
    rows: boardRows,
  });

  return {
    ...board,
    formulaLibrary,
  };
}
