import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";

function cleanHeader(value, index) {
  if (!value || String(value).trim() === "") {
    return `columna_${index + 1}`;
  }

  return String(value).trim();
}

function describeFormula(formula) {
  const match = formula.toUpperCase().match(/^=([A-Z0-9_]+)\(/);
  const fn = match?.[1] || "CUSTOM";

  const map = {
    SUM: "Suma valores y devuelve el total.",
    AVERAGE: "Calcula el promedio de los valores.",
    PROMEDIO: "Calcula el promedio de los valores.",
    IF: "Evalua una condicion y retorna un resultado segun verdadero/falso.",
    SI: "Evalua una condicion y retorna un resultado segun verdadero/falso.",
    VLOOKUP: "Busca un valor vertical en una tabla y devuelve coincidencia.",
    BUSCARV: "Busca un valor vertical en una tabla y devuelve coincidencia.",
    XLOOKUP: "Busca un valor flexible por fila o columna.",
    INDEX: "Devuelve valor por posicion de fila y columna.",
    MATCH: "Devuelve la posicion de un valor dentro de un rango.",
    MIN: "Devuelve el valor minimo.",
    MAX: "Devuelve el valor maximo.",
    ROUND: "Redondea un numero con precision definida.",
  };

  return {
    id: `fx-${fn}-${Math.random().toString(36).slice(2, 9)}`,
    formula,
    name: fn,
    description: map[fn] || "Formula importada desde archivo. Reutilizable en celdas numericas.",
  };
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || "").join("");
    }
    if (value.text) return String(value.text);
    if (value.hyperlink && value.text) return String(value.text);
    if (value.result !== undefined && value.formula) return normalizeCellValue(value.result);
    if (value instanceof Date) return value.toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function parseImportFile(file) {
  const ext = file.originalname.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = file.buffer.toString("utf8");
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const headers = Object.keys(records[0] || {}).map((header, index) => cleanHeader(header, index));
    return { headers, rows: records, formulasByRow: [], formulaLibrary: [] };
  }

  if (ext !== "xlsx" && ext !== "xlsm" && ext !== "xls") {
    throw new Error("Formato de archivo no compatible para importación.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const firstSheet = workbook.worksheets[0];

  if (!firstSheet || firstSheet.rowCount === 0) {
    return { headers: [], rows: [], formulasByRow: [], formulaLibrary: [] };
  }

  const headers = [];
  const headerRow = firstSheet.getRow(1);
  const columnCount = headerRow.actualCellCount || headerRow.cellCount || firstSheet.columnCount || 0;
  for (let col = 1; col <= columnCount; col += 1) {
    const headerCell = headerRow.getCell(col);
    headers.push(cleanHeader(normalizeCellValue(headerCell.value), col - 1));
  }

  const rows = [];
  const formulasByRow = [];
  const formulaLibraryMap = new Map();

  for (let rowIndex = 2; rowIndex <= firstSheet.rowCount; rowIndex += 1) {
    const row = firstSheet.getRow(rowIndex);
    const rowObject = {};
    const formulaObject = {};

    for (let col = 1; col <= headers.length; col += 1) {
      const header = headers[col - 1];
      const cell = row.getCell(col);
      const rawValue = normalizeCellValue(cell.value);

      rowObject[header] = rawValue ?? "";

      if (cell.formula) {
        const formula = `=${cell.formula}`;
        formulaObject[header] = formula;
        if (!formulaLibraryMap.has(formula)) {
          formulaLibraryMap.set(formula, describeFormula(formula));
        }
      }
    }

    const hasContent = Object.values(rowObject).some((value) => value !== "");
    if (hasContent || Object.keys(formulaObject).length > 0) {
      rows.push(rowObject);
      formulasByRow.push(formulaObject);
    }
  }

  return {
    headers,
    rows,
    formulasByRow,
    formulaLibrary: Array.from(formulaLibraryMap.values()),
  };
}
