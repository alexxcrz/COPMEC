import * as XLSX from "xlsx";
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

export function parseImportFile(file) {
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

  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const range = XLSX.utils.decode_range(firstSheet["!ref"] || "A1:A1");
  const headerRow = range.s.r;

  const headers = [];
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const headerAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
    const headerCell = firstSheet[headerAddress];
    headers.push(cleanHeader(headerCell?.v, col - range.s.c));
  }

  const rows = [];
  const formulasByRow = [];
  const formulaLibraryMap = new Map();

  for (let rowIndex = headerRow + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const rowObject = {};
    const formulaObject = {};

    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const header = headers[col - range.s.c];
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
      const cell = firstSheet[cellAddress];

      rowObject[header] = cell?.v ?? "";

      if (cell?.f) {
        const formula = `=${cell.f}`;
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
