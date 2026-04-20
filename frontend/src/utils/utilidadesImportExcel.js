/* eslint-disable */
// ── Utilidades de Importación de Excel ──────────────────────────────────────
// Parseo de archivos .xlsx para importar tableros y datos de inventario.
// Depende de: ./utilidadesFormulas (parseSimpleExcelFormula)
// ─────────────────────────────────────────────────────────────────────────────

import { parseSimpleExcelFormula, classifyExcelFormula, excelColumnLettersToIndex } from "./utilidadesFormulas";

/** ID único simple (no criptográfico). Evita importar makeId de App.jsx. */
function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export async function getExcelJsModule() {
  const module = await import("exceljs/dist/exceljs.min.js");
  return module.default || module;
}

export function normalizeArgbHex(colorValue) {
  const raw = String(colorValue || "").replace(/^#/, "").trim();
  if (!raw) return "";
  const normalized = raw.length === 8 ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "";
  return `#${normalized.toLowerCase()}`;
}

export function getExcelCellColors(cell) {
  const fillColor = normalizeArgbHex(cell?.fill?.fgColor?.argb || cell?.fill?.bgColor?.argb);
  const textColor = normalizeArgbHex(cell?.font?.color?.argb);
  return { fillColor, textColor };
}

export function inferImportedFieldTypeFromSamples(samples) {
  const normalized = (samples || []).map((item) => String(item || "").trim()).filter(Boolean);
  if (!normalized.length) return { type: "text", options: [] };

  const isEmail = normalized.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  if (isEmail) return { type: "email", options: [] };

  const isUrl = normalized.every((value) => /^https?:\/\//i.test(value));
  if (isUrl) return { type: "url", options: [] };

  const isTime = normalized.every((value) => /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value));
  if (isTime) return { type: "time", options: [] };

  const phoneScore = normalized.filter((value) => /^\+?[\d\s()-]{8,}$/.test(value)).length / normalized.length;
  if (phoneScore >= 0.9) return { type: "phone", options: [] };

  const boolTokens = new Set(["si", "sí", "no", "yes", "true", "false", "1", "0", "verdadero", "falso", "✓", "✗", "☑", "☐", "✔", "✘", "ok", "x"]);
  const boolScore = normalized.filter((value) => boolTokens.has(value.toLowerCase())).length / normalized.length;
  if (boolScore >= 0.9 && normalized.length >= 2) return { type: "boolean", options: [] };

  const numericSamples = normalized.map((value) => Number(String(value).replaceAll(/[,$%\s]/g, ""))).filter((item) => Number.isFinite(item));
  const numericScore = numericSamples.length / normalized.length;

  if (numericScore >= 0.9) {
    const isPercentage = normalized.some((value) => String(value).includes("%"));
    const isCurrency = normalized.some((value) => /[$€£¥]/.test(value));
    if (isPercentage) return { type: "percentage", options: [] };
    if (isCurrency) return { type: "currency", options: [] };
    const allInts = numericSamples.every((n) => Number.isInteger(n) && n >= 1 && n <= 5);
    const uniqueNums = new Set(numericSamples);
    if (allInts && uniqueNums.size <= 5 && numericSamples.length >= 3) return { type: "rating", options: [] };
    const allProgress = numericSamples.every((n) => n >= 0 && n <= 100);
    if (allProgress && numericSamples.some((n) => n > 1)) return { type: "progress", options: [] };
    return { type: "number", options: [] };
  }

  const dateScore = normalized.filter((value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(value)) return true;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && value.length >= 6;
  }).length / normalized.length;
  if (dateScore >= 0.8) return { type: "date", options: [] };

  const avgLength = normalized.reduce((sum, v) => sum + v.length, 0) / normalized.length;
  if (avgLength > 80) return { type: "textarea", options: [] };

  const uniqueValues = Array.from(new Set(normalized));
  if (uniqueValues.length >= 2 && uniqueValues.length <= 15 && normalized.length >= 3) {
    return { type: "select", options: uniqueValues };
  }

  return { type: "text", options: [] };
}

export function getWorksheetHeaders(worksheet) {
  const headerRow = worksheet.getRow(1);
  const columnCount = headerRow.actualCellCount || headerRow.cellCount || worksheet.columnCount || 0;
  if (!columnCount) {
    throw new Error("El archivo no tiene encabezados en la primera fila.");
  }
  const headers = [];
  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
    headers.push(String(headerRow.getCell(columnIndex).text || `Campo ${columnIndex}`).trim() || `Campo ${columnIndex}`);
  }
  return headers;
}

export function getCellTextValue(cell) {
  const raw = cell.value;
  if (raw === null || raw === undefined) return "";
  // ExcelJS exposes checkbox/boolean cells as actual JS booleans
  if (raw === true) return "TRUE";
  if (raw === false) return "FALSE";
  if (raw && typeof raw === "object" && Array.isArray(raw.richText)) {
    return raw.richText.map((segment) => segment.text || "").join("").trim();
  }
  if (raw && typeof raw === "object" && typeof raw.result !== "undefined") {
    if (raw.result === null || raw.result === undefined) return "";
    // formula result that is boolean
    if (raw.result === true) return "TRUE";
    if (raw.result === false) return "FALSE";
    return String(raw.result).trim();
  }
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return "";
    return raw.toISOString().slice(0, 10);
  }
  const text = String(cell.text || "").trim();
  return text;
}

/** Parse column letters from an Excel ref string like "C2:C151" → column index 0-based */
function excelRefFirstColumnIndex(ref) {
  const match = String(ref || "").trim().split(/[\s,]/)[0].match(/^([A-Z]+)/i);
  if (!match) return -1;
  return excelColumnLettersToIndex(match[1]);
}

/** Extract color rules from worksheet conditional formatting for a given column index */
function extractCFColorRules(worksheet, columnIndex) {
  const rules = [];
  try {
    const cfList = worksheet.conditionalFormattings;
    if (!cfList || !cfList.length) return rules;
    for (const cf of cfList) {
      if (excelRefFirstColumnIndex(cf.ref) !== columnIndex) continue;
      for (const rule of (cf.rules || [])) {
        const fillColor = normalizeArgbHex(
          rule.dxf?.fill?.fgColor?.argb || rule.dxf?.fill?.bgColor?.argb ||
          rule.dxf?.fill?.fgColor?.theme || ""
        );
        const textColor = normalizeArgbHex(rule.dxf?.font?.color?.argb || "");
        if (!fillColor && !textColor) continue;
        // cellIs equal → value rule
        if (rule.type === "cellIs" && rule.operator === "equal" && rule.formulae?.[0] !== undefined) {
          const val = String(rule.formulae[0]).replace(/^"(.*)"$/, "$1");
          rules.push({ operator: "equals", value: val, color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "cellIs" && rule.operator === "greaterThan" && rule.formulae?.[0] !== undefined) {
          rules.push({ operator: ">", value: String(rule.formulae[0]), color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "cellIs" && rule.operator === "lessThan" && rule.formulae?.[0] !== undefined) {
          rules.push({ operator: "<", value: String(rule.formulae[0]), color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "cellIs" && rule.operator === "greaterThanOrEqual" && rule.formulae?.[0] !== undefined) {
          rules.push({ operator: ">=", value: String(rule.formulae[0]), color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "cellIs" && rule.operator === "lessThanOrEqual" && rule.formulae?.[0] !== undefined) {
          rules.push({ operator: "<=", value: String(rule.formulae[0]), color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "containsText" && rule.text) {
          rules.push({ operator: "contains", value: rule.text, color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "beginsWith" && rule.text) {
          rules.push({ operator: "startsWith", value: rule.text, color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        } else if (rule.type === "endsWith" && rule.text) {
          rules.push({ operator: "endsWith", value: rule.text, color: fillColor || "#fee2e2", textColor: textColor || "#111827" });
        }
        // colorScale / iconSet / expression → skip (too complex to translate directly)
      }
    }
  } catch (_) { /* CF not always available depending on ExcelJS version */ }
  return rules;
}

/** Infer COPMEC field type from Excel number format string */
function inferTypeFromNumFmt(numFmt) {
  if (!numFmt || numFmt === "General" || numFmt === "@") return null;
  const fmt = String(numFmt).toLowerCase();
  // Date patterns: yy, yyyy, dd, mmm
  if (/yyyy|yy/.test(fmt) || (fmt.includes("dd") && fmt.includes("mm"))) return "date";
  if (/mmm|ddd/.test(fmt)) return "date";
  // Time: h:mm, h:mm:ss, am/pm
  if (fmt.includes("h:mm") || fmt.includes("am/pm") || fmt.includes("hh:mm")) return "time";
  // Percentage
  if (fmt.endsWith("%") || fmt.includes("0%") || fmt.includes("0.0%") || fmt.includes("0.00%")) return "percentage";
  // Currency
  if (fmt.includes("$") || fmt.includes("€") || fmt.includes("£") || fmt.includes("¥")) return "currency";
  return null;
}

export function collectBoardStructureCellData(cell, targetIndex, headers, rowByHeader, sampleValuesByColumn, formulaByColumn, styleHintsByColumn) {
  const raw = cell.value;
  const textValue = getCellTextValue(cell);
  const { fillColor, textColor } = getExcelCellColors(cell);

  if (!formulaByColumn[targetIndex] && raw && typeof raw === "object" && typeof raw.formula === "string") {
    formulaByColumn[targetIndex] = raw.formula;
  } else if (!formulaByColumn[targetIndex] && raw && typeof raw === "object" && typeof raw.sharedFormula === "string") {
    formulaByColumn[targetIndex] = raw.sharedFormula;
  }
  if (textValue) sampleValuesByColumn[targetIndex].push(textValue);
  // Collect all distinct (value, fillColor) combinations
  if (textValue && (fillColor || textColor)) {
    const hints = Array.isArray(styleHintsByColumn[targetIndex]) ? styleHintsByColumn[targetIndex] : [];
    if (hints.length < 15 && !hints.some((h) => h.value === textValue && h.fillColor === fillColor)) {
      hints.push({ value: textValue, fillColor, textColor });
    }
    styleHintsByColumn[targetIndex] = hints;
  }
  rowByHeader[headers[targetIndex]] = textValue;
}

export function collectBoardStructureSheetData(worksheet, headers) {
  const sampleValuesByColumn = headers.map(() => []);
  const formulaByColumn = headers.map(() => "");
  const styleHintsByColumn = headers.map(() => []); // array of { value, fillColor, textColor }
  const numFmtByColumn = headers.map(() => "");
  const dataValidationByColumn = headers.map(() => null);
  const importedRows = [];
  const maxRows = Math.min(worksheet.rowCount, 500);
  const maxSampleRows = Math.min(worksheet.rowCount, 200);

  for (let rowIndex = 2; rowIndex <= maxRows; rowIndex += 1) {
    const worksheetRow = worksheet.getRow(rowIndex);
    const rowByHeader = {};
    const isSampleRow = rowIndex <= maxSampleRows;

    for (let columnIndex = 1; columnIndex <= headers.length; columnIndex += 1) {
      const cell = worksheetRow.getCell(columnIndex);
      const targetIndex = columnIndex - 1;
      const raw = cell.value;
      const textValue = getCellTextValue(cell);
      const { fillColor, textColor } = getExcelCellColors(cell);

      // Formula extraction (first formula found wins)
      if (!formulaByColumn[targetIndex]) {
        if (raw && typeof raw === "object" && typeof raw.formula === "string") {
          formulaByColumn[targetIndex] = raw.formula;
        } else if (raw && typeof raw === "object" && typeof raw.sharedFormula === "string") {
          formulaByColumn[targetIndex] = raw.sharedFormula;
        }
      }

      // Sample values
      if (isSampleRow && textValue) sampleValuesByColumn[targetIndex].push(textValue);

      // Collect all distinct color/value combos (up to 15 per column)
      if (textValue && (fillColor || textColor)) {
        const hints = styleHintsByColumn[targetIndex];
        if (hints.length < 15 && !hints.some((h) => h.value === textValue && h.fillColor === fillColor)) {
          hints.push({ value: textValue, fillColor, textColor });
        }
      }

      // Number format (first non-generic found wins)
      if (!numFmtByColumn[targetIndex] && cell.numFmt && cell.numFmt !== "General" && cell.numFmt !== "@") {
        numFmtByColumn[targetIndex] = cell.numFmt;
      }

      // Data validation (first found wins)
      if (!dataValidationByColumn[targetIndex] && cell.dataValidation?.type) {
        dataValidationByColumn[targetIndex] = cell.dataValidation;
      }

      rowByHeader[headers[targetIndex]] = textValue;
    }

    if (Object.values(rowByHeader).some((value) => String(value || "").trim() !== "")) {
      importedRows.push(rowByHeader);
    }
  }

  // Extract conditional formatting color rules per column
  const cfColorRulesByColumn = headers.map((_, i) => extractCFColorRules(worksheet, i));

  return { sampleValuesByColumn, formulaByColumn, styleHintsByColumn, numFmtByColumn, dataValidationByColumn, cfColorRulesByColumn, importedRows };
}

export function buildImportedColorRules(styleHints, cfColorRules = []) {
  const rules = [];
  // From cell fill colors (collected from actual data cells)
  if (Array.isArray(styleHints)) {
    for (const hint of styleHints) {
      if (hint.value && (hint.fillColor || hint.textColor)) {
        rules.push({
          operator: "equals",
          value: hint.value,
          color: hint.fillColor || "#fee2e2",
          textColor: hint.textColor || "#111827",
        });
      }
    }
  } else if (styleHints?.value && (styleHints?.fillColor || styleHints?.textColor)) {
    // Legacy single-object form
    rules.push({ operator: "equals", value: styleHints.value, color: styleHints.fillColor || "#fee2e2", textColor: styleHints.textColor || "#111827" });
  }
  // From conditional formatting rules (more authoritative — prepend)
  for (const cfRule of (cfColorRules || [])) {
    if (!rules.some((r) => r.operator === cfRule.operator && r.value === cfRule.value)) {
      rules.unshift(cfRule);
    }
  }
  return rules;
}

export function buildImportedBoardFields(headers, formulaByColumn, sampleValuesByColumn, styleHintsByColumn, sheetName, numFmtByColumn = [], dataValidationByColumn = [], cfColorRulesByColumn = []) {
  const formulaOperationMap = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };
  // Maps fieldId → { leftColumnIndex, rightColumnIndex, operation } for post-pass field ID resolution
  const pendingFormulaMetaByFieldId = new Map();
  const unsupportedFormulaColumns = [];
  const unsupportedFormulaDetails = [];
  let supportedFormulaCount = 0;

  // These produce aggregate totals or truly external refs — import computed values, no wizard
  const SILENT_NON_CONVERTIBLE = new Set(["column_aggregate", "multi_row_ref", "empty"]);

  // Lookup function names that suggest inventoryLookup field type
  const LOOKUP_FUNCTIONS = new Set([
    "VLOOKUP", "BUSCARV", "XLOOKUP", "BUSCARX",
    "HLOOKUP", "BUSCARH", "INDEX", "MATCH", "COINCIDIR",
  ]);

  // Detect suggested field type for cross-sheet / lookup formulas
  function suggestFieldTypeForFormula(sourceFormula) {
    const upper = String(sourceFormula || "").toUpperCase().replace(/\s/g, "");
    for (const fn of LOOKUP_FUNCTIONS) {
      if (upper.includes(`${fn}(`)) return "inventoryLookup";
    }
    if (upper.includes("IF(") || upper.includes("SI(")) return "text";
    if (upper.includes("IFERROR(") || upper.includes("SIERROR(")) return "text";
    if (upper.includes("FILTER(") || upper.includes("FILTRAR(")) return "text";
    if (upper.includes("SORT(") || upper.includes("ORDENAR(")) return "text";
    if (upper.includes("UNIQUE(") || upper.includes("\u00daNICOS(")) return "text";
    return "text";
  }

  const fields = headers.map((header, index) => {
    const sourceFormula = String(formulaByColumn[index] || "").trim();
    const fieldId = makeId("fld");
    const styleHints = styleHintsByColumn[index] || [];
    const cfColorRules = cfColorRulesByColumn[index] || [];
    const colorRules = buildImportedColorRules(styleHints, cfColorRules);
    const numFmtType = inferTypeFromNumFmt(numFmtByColumn[index]);
    const dataValidation = dataValidationByColumn[index];
    const baseField = {
      id: fieldId,
      label: header,
      optionSource: "manual",
      optionCatalogCategory: "",
      options: [],
      inventoryProperty: "code",
      sourceFieldId: null,
      formulaOperation: "add",
      formulaLeftFieldId: null,
      formulaRightFieldId: null,
      placeholder: "",
      defaultValue: "",
      required: false,
      groupName: "Importado",
      groupColor: "#dbeafe",
      colorRules,
    };

    if (!sourceFormula) {
      const inferred = inferImportedFieldTypeFromSamples(sampleValuesByColumn[index]);
      // numFmt overrides sample inference for numeric/date/time/percentage/currency columns
      const resolvedType = numFmtType || inferred.type;
      // Data validation: list → select
      const dvType = dataValidation?.type;
      const finalType = dvType === "list" ? "select"
        : dvType === "whole" || dvType === "decimal" ? "number"
        : resolvedType;
      const dvOptions = dvType === "list" && dataValidation?.formulae?.[0]
        ? String(dataValidation.formulae[0]).replace(/^"(.*)"$/, "$1").split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const finalOptions = dvOptions.length ? dvOptions : (finalType === "select" ? inferred.options : []);
      return {
        ...baseField,
        type: finalType,
        options: finalOptions,
        width: finalType === "textarea" ? "lg" : "md",
        helpText: `Importado desde Excel (${sheetName}).`,
      };
    }

    // ── Step 1: fast binary parser (=A1+B1, =C2-D2, =A1*B1, etc.) ─────────────
    const simpleMeta = parseSimpleExcelFormula(sourceFormula);
    if (simpleMeta) {
      supportedFormulaCount++;
      pendingFormulaMetaByFieldId.set(fieldId, {
        leftColumnIndex: simpleMeta.leftColumnIndex,
        rightColumnIndex: simpleMeta.rightColumnIndex,
        operation: formulaOperationMap[simpleMeta.operator] || "add",
      });
      return {
        ...baseField,
        type: "formula",
        width: "md",
        helpText: `Importado desde Excel (${sheetName}). Fórmula aritmética convertida automáticamente.`,
      };
    }

    // ── Step 2: full classification ────────────────────────────────────────────
    const classification = classifyExcelFormula(sourceFormula);

    // Auto-wire: classifyExcelFormula found column letters it can map to fields
    if (classification.canConvert && classification.leftColLetters && classification.rightColLetters) {
      supportedFormulaCount++;
      pendingFormulaMetaByFieldId.set(fieldId, {
        leftColumnIndex: excelColumnLettersToIndex(classification.leftColLetters),
        rightColumnIndex: excelColumnLettersToIndex(classification.rightColLetters),
        operation: classification.operation || "add",
      });
      return {
        ...baseField,
        type: "formula",
        width: "md",
        helpText: `Importado desde Excel (${sheetName}). ${classification.description || "Fórmula convertida automáticamente."}`,
      };
    }

    // ── Step 3: silently import aggregate/multi-row as computed values ─────────
    if (SILENT_NON_CONVERTIBLE.has(classification.type)) {
      const inferred = inferImportedFieldTypeFromSamples(sampleValuesByColumn[index]);
      return {
        ...baseField,
        type: inferred.type,
        options: inferred.options,
        width: inferred.type === "textarea" ? "lg" : "md",
        helpText: `Importado desde Excel (${sheetName}). ${classification.description || ""} Valores importados tal como Excel los calculó.`,
      };
    }

    // ── Step 4: wizard-required — cross_sheet lookups, IF, unknown functions ───
    const suggestedFieldType = suggestFieldTypeForFormula(sourceFormula);
    unsupportedFormulaColumns.push(header);
    unsupportedFormulaDetails.push({
      header,
      formula: sourceFormula,
      columnIndex: index,
      classification,
      suggestedFieldType,
      autoLeftColumnIndex: classification.leftColLetters ? excelColumnLettersToIndex(classification.leftColLetters) : null,
      autoRightColumnIndex: classification.rightColLetters ? excelColumnLettersToIndex(classification.rightColLetters) : null,
      autoOperation: classification.operation || "add",
    });

    const inferred = inferImportedFieldTypeFromSamples(sampleValuesByColumn[index]);
    return {
      ...baseField,
      type: inferred.type,
      options: inferred.options,
      width: inferred.type === "textarea" ? "lg" : "md",
      helpText: `Importado desde Excel (${sheetName}). ${classification.description || ""} Configura este campo en el asistente.`,
    };
  });

  // ── Resolve pending formula field IDs (left/right column index → field ID) ──
  fields.forEach((field) => {
    if (field.type !== "formula") return;
    const meta = pendingFormulaMetaByFieldId.get(field.id);
    if (!meta) return;
    const leftField = fields[meta.leftColumnIndex];
    const rightField = fields[meta.rightColumnIndex];
    if (!leftField || !rightField) {
      field.type = "number";
      field.helpText += " (Columna referenciada fuera de rango; convertida a número.)";
      return;
    }
    field.formulaOperation = meta.operation;
    field.formulaLeftFieldId = leftField.id;
    field.formulaRightFieldId = rightField.id;
  });

  return { fields, supportedFormulaCount, unsupportedFormulaColumns, unsupportedFormulaDetails };
}

/** Parse a single worksheet and return all importable data for that sheet */
export function parseWorksheet(worksheet, sheetName) {
  const headers = getWorksheetHeaders(worksheet);
  const { sampleValuesByColumn, formulaByColumn, styleHintsByColumn, numFmtByColumn, dataValidationByColumn, cfColorRulesByColumn, importedRows } =
    collectBoardStructureSheetData(worksheet, headers);
  const { fields, supportedFormulaCount, unsupportedFormulaColumns, unsupportedFormulaDetails } =
    buildImportedBoardFields(headers, formulaByColumn, sampleValuesByColumn, styleHintsByColumn, sheetName, numFmtByColumn, dataValidationByColumn, cfColorRulesByColumn);

  return {
    name: sheetName,
    fields,
    rows: importedRows,
    supportedFormulaCount,
    unsupportedFormulaColumns,
    unsupportedFormulaDetails,
    columnCount: headers.length,
    rowCount: importedRows.length,
  };
}

export async function parseBoardStructureImportFile(file) {
  const buffer = await file.arrayBuffer();
  const ExcelJS = await getExcelJsModule();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheets = workbook.worksheets.filter((ws) => ws.rowCount > 0);
  if (!worksheets.length) throw new Error("No se encontró ninguna hoja con datos en el archivo.");

  // Return all sheets so the caller can show a picker if needed
  const sheets = worksheets.map((ws) => parseWorksheet(ws, ws.name || `Hoja ${ws.id}`));
  const fileName = String(file.name || "").replace(/\.[^.]+$/, "").trim() || "Tablero importado";

  // Convenience: first sheet also exposed at the top level for backwards-compatible callers
  const first = sheets[0];
  return {
    boardName: first.name || fileName,
    fields: first.fields,
    rows: first.rows,
    supportedFormulaCount: first.supportedFormulaCount,
    unsupportedFormulaColumns: first.unsupportedFormulaColumns,
    unsupportedFormulaDetails: first.unsupportedFormulaDetails,
    sheets,
    fileName,
  };
}
