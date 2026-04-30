// ── Utilidades de Fórmulas de Excel ─────────────────────────────────────────
// Clasificación, parseo y memoria de fórmulas importadas desde Excel.
// Este módulo no tiene dependencias de React ni del estado de la app.
// ─────────────────────────────────────────────────────────────────────────────

export function excelColumnLettersToIndex(letters) {
  const normalized = String(letters || "").trim().toUpperCase();
  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    total = total * 26 + ((normalized.codePointAt(index) || 64) - 64);
  }
  return Math.max(0, total - 1);
}

export function parseSimpleExcelFormula(formula) {
  const expression = String(formula || "").trim().replace(/^=/, "").replaceAll("$", "");
  if (!expression || expression.includes("!")) return null;
  const match = /^([A-Z]+)\d+\s*([+\-*/])\s*([A-Z]+)\d+$/i.exec(expression);
  if (!match) return null;
  return {
    leftColumnIndex: excelColumnLettersToIndex(match[1]),
    operator: match[2],
    rightColumnIndex: excelColumnLettersToIndex(match[3]),
  };
}

export const EXCEL_FUNCTION_DESCRIPTIONS = {
  SUM: "Suma todos los valores de un rango.",
  SUMA: "Suma todos los valores de un rango.",
  AVERAGE: "Calcula el promedio de un rango.",
  PROMEDIO: "Calcula el promedio de un rango.",
  MIN: "Devuelve el valor mínimo de un rango.",
  MAX: "Devuelve el valor máximo de un rango.",
  COUNT: "Cuenta celdas numéricas de un rango.",
  COUNTA: "Cuenta celdas no vacías de un rango.",
  CONTAR: "Cuenta celdas numéricas de un rango.",
  CONTARA: "Cuenta celdas no vacías de un rango.",
  IF: "Condicional: devuelve un valor según si la condición es verdadera o falsa.",
  SI: "Condicional: devuelve un valor según si la condición es verdadera o falsa.",
  VLOOKUP: "Búsqueda vertical: busca un valor en una tabla y devuelve el dato de otra columna.",
  BUSCARV: "Búsqueda vertical: busca un valor en una tabla y devuelve el dato de otra columna.",
  XLOOKUP: "Búsqueda flexible: versión moderna de VLOOKUP/HLOOKUP.",
  HLOOKUP: "Búsqueda horizontal en una tabla.",
  INDEX: "Devuelve un valor por su posición (fila/columna) en un rango.",
  MATCH: "Devuelve la posición de un valor dentro de un rango.",
  IFERROR: "Devuelve un valor alternativo si la fórmula genera un error.",
  SIERROR: "Devuelve un valor alternativo si la fórmula genera un error.",
  IFNA: "Devuelve un valor alternativo si el resultado es #N/A.",
  CONCATENATE: "Une el texto de varias celdas en una sola.",
  CONCAT: "Une el texto de varias celdas en una sola.",
  TEXTJOIN: "Une texto con un separador personalizado.",
  LEFT: "Extrae caracteres desde el inicio del texto.",
  RIGHT: "Extrae caracteres desde el final del texto.",
  MID: "Extrae caracteres desde una posición intermedia.",
  LEN: "Cuenta el número de caracteres del texto.",
  LARGO: "Cuenta el número de caracteres del texto.",
  TRIM: "Elimina espacios extra del texto.",
  UPPER: "Convierte el texto a mayúsculas.",
  LOWER: "Convierte el texto a minúsculas.",
  PROPER: "Convierte la primera letra de cada palabra a mayúscula.",
  TEXT: "Formatea un número o fecha como texto con formato definido.",
  TEXTO: "Formatea un número o fecha como texto con formato definido.",
  ROUND: "Redondea un número a la cantidad de decimales indicada.",
  REDONDEAR: "Redondea un número a la cantidad de decimales indicada.",
  ROUNDUP: "Redondea hacia arriba.",
  ROUNDDOWN: "Redondea hacia abajo.",
  ABS: "Devuelve el valor absoluto (sin signo) de un número.",
  SQRT: "Devuelve la raíz cuadrada de un número.",
  POWER: "Eleva un número a una potencia.",
  MOD: "Devuelve el resto de una división.",
  RESIDUO: "Devuelve el resto de una división.",
  SUMIF: "Suma celdas que cumplen un criterio específico.",
  SUMIFS: "Suma celdas que cumplen múltiples criterios.",
  COUNTIF: "Cuenta celdas que cumplen un criterio.",
  COUNTIFS: "Cuenta celdas que cumplen múltiples criterios.",
  AVERAGEIF: "Promedia celdas que cumplen un criterio.",
  DATE: "Crea una fecha a partir de año, mes y día.",
  FECHA: "Crea una fecha a partir de año, mes y día.",
  TODAY: "Devuelve la fecha de hoy.",
  HOY: "Devuelve la fecha de hoy.",
  NOW: "Devuelve la fecha y hora actuales.",
  AHORA: "Devuelve la fecha y hora actuales.",
  YEAR: "Extrae el año de una fecha.",
  MONTH: "Extrae el mes de una fecha.",
  DAY: "Extrae el día de una fecha.",
  DATEDIF: "Calcula la diferencia entre dos fechas.",
  NETWORKDAYS: "Cuenta días laborables entre dos fechas.",
  WORKDAY: "Devuelve una fecha sumando días laborables.",
  EOMONTH: "Devuelve el último día del mes.",
  FILTER: "Filtra un rango según condiciones (función de matriz).",
  SORT: "Ordena un rango de datos (función de matriz).",
  UNIQUE: "Devuelve valores únicos de un rango (función de matriz).",
  SEQUENCE: "Genera una secuencia de números (función de matriz).",
  ISNUMBER: "Verifica si un valor es número (VERDADERO/FALSO).",
  ESNUMERO: "Verifica si un valor es número (VERDADERO/FALSO).",
  ISBLANK: "Verifica si una celda está vacía (VERDADERO/FALSO).",
  ESBLANCO: "Verifica si una celda está vacía (VERDADERO/FALSO).",
  ISTEXT: "Verifica si un valor es texto.",
  CHOOSE: "Devuelve un valor de una lista según un índice.",
  OFFSET: "Devuelve una referencia desplazada desde una celda.",
  INDIRECT: "Devuelve una referencia a partir de texto.",
  LARGE: "Devuelve el k-ésimo valor más grande de un rango.",
  SMALL: "Devuelve el k-ésimo valor más pequeño de un rango.",
  RANK: "Devuelve el rango de un número dentro de un conjunto.",
  PERCENTILE: "Devuelve el percentil k de un conjunto de datos.",
  SUBTOTAL: "Realiza cálculos ignorando filas ocultas por filtros.",
  AGGREGATE: "Realiza cálculos avanzados con opciones para ignorar errores y filas ocultas.",
};

// ── Formula Memory (localStorage) ────────────────────────────────────────────
export const FORMULA_MEMORY_LS_KEY = "copmec_formula_patterns_v2";

export function loadFormulasMemory() {
  try { return JSON.parse(localStorage.getItem(FORMULA_MEMORY_LS_KEY) || "{}"); } catch { return {}; }
}

export function lookupFormulaMemory(targetLabel) {
  const key = String(targetLabel || "").toLowerCase().trim();
  return loadFormulasMemory()[key] || null;
}

export function saveFormulaToMemory(targetLabel, operation, leftLabel, rightLabel, formula) {
  try {
    const mem = loadFormulasMemory();
    const key = String(targetLabel || "").toLowerCase().trim();
    if (!key || !leftLabel || !rightLabel) return;
    mem[key] = {
      operation,
      leftLabel,
      rightLabel,
      pattern: String(formula || "").replaceAll(/\d+/g, "#"),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FORMULA_MEMORY_LS_KEY, JSON.stringify(mem));
  } catch { /* storage full or blocked */ }
}
// ─────────────────────────────────────────────────────────────────────────────

export function classifyExcelFormula(formula) {
  const expr = String(formula || "").trim().replace(/^=/, "").replaceAll("$", "");
  if (!expr) return { type: "empty", label: "Sin fórmula", canConvert: false };
  if (expr.includes("!")) return {
    type: "cross_sheet", label: "Referencia entre hojas",
    description: "Esta fórmula referencia datos de otra hoja. No se puede convertir automáticamente.",
    operation: "add", canConvert: false,
  };

  const OP_MAP   = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };
  const OP_LABEL = { "+": "Suma", "-": "Resta", "*": "Multiplicación", "/": "División" };
  const AGG_OP   = { SUM: "add", SUMA: "add", AVERAGE: "average", PROMEDIO: "average", MIN: "min", MAX: "max" };

  const allCellRefs = [...expr.matchAll(/([A-Z]+)(\d+)/gi)].map((m) => ({
    col: m[1].toUpperCase(),
    row: Number.parseInt(m[2], 10),
  }));
  const rowNumbers = [...new Set(allCellRefs.map((c) => c.row))];
  const isPerRow   = rowNumbers.length === 1;

  // Colon range: SUM(C2:C116), AVERAGE(A5:B5)
  const colonRange = /^([A-Z_]+)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/i.exec(expr);
  if (colonRange) {
    const fn  = colonRange[1].toUpperCase();
    const c1  = colonRange[2].toUpperCase();
    const r1  = Number.parseInt(colonRange[3], 10);
    const c2  = colonRange[4].toUpperCase();
    const r2  = Number.parseInt(colonRange[5], 10);
    const fnDesc = EXCEL_FUNCTION_DESCRIPTIONS[fn] || `Función ${fn}.`;
    if (r1 === r2) {
      return {
        type: "range_same_row", fn, label: `${fn}(${c1}:${c2}) — misma fila`,
        description: `${fnDesc} Detectado como operación entre columna ${c1} (izq.) y columna ${c2} (der.) de la misma fila.`,
        operation: AGG_OP[fn] || "add",
        leftColLetters: c1, rightColLetters: c2, canConvert: true,
      };
    }
    if (c1 === c2) {
      return {
        type: "column_aggregate", fn, label: `${fn}(${c1}${r1}:${c2}${r2}) — columna completa`,
        description: `${fnDesc} Suma ${Math.abs(r2 - r1) + 1} filas de la columna ${c1}. Esta fórmula agrega toda la columna y no puede convertirse a una operación por fila.`,
        operation: "add", canConvert: false,
      };
    }
    return {
      type: "range_2d", fn, label: `${fn}(${c1}${r1}:${c2}${r2}) — rango 2D`,
      description: `${fnDesc} Rango bidimensional. No se puede convertir a una operación por fila.`,
      operation: "add", canConvert: false,
    };
  }

  // Two-arg function same row: SUM(C5,D5), MAX(C5,D5)
  const twoArgSame = /^([A-Z_]+)\(\s*([A-Z]+)(\d+)\s*,\s*([A-Z]+)(\d+)\s*\)$/i.exec(expr);
  if (twoArgSame) {
    const fn  = twoArgSame[1].toUpperCase();
    const c1  = twoArgSame[2].toUpperCase();
    const r1  = Number.parseInt(twoArgSame[3], 10);
    const c2  = twoArgSame[4].toUpperCase();
    const r2  = Number.parseInt(twoArgSame[5], 10);
    const fnDesc = EXCEL_FUNCTION_DESCRIPTIONS[fn] || `Función ${fn}.`;
    if (r1 === r2) {
      return {
        type: "twoarg_same_row", fn, label: `${fn}(${c1}, ${c2})`,
        description: `${fnDesc} Entre columna ${c1} (izq.) y columna ${c2} (der.) de la misma fila.`,
        operation: AGG_OP[fn] || "add",
        leftColLetters: c1, rightColLetters: c2, canConvert: true,
      };
    }
  }

  // Single cell reference: =C152
  const singleCell = /^([A-Z]+)(\d+)$/i.exec(expr);
  if (singleCell) {
    const col = singleCell[1].toUpperCase();
    return {
      type: "reference", label: `Referencia a columna ${col}`,
      description: `Copia el valor de la columna ${col} directamente. Se asignará como suma de esa columna consigo misma (resultado = valor de ${col}).`,
      operation: "add", leftColLetters: col, rightColLetters: col, canConvert: true,
    };
  }

  // Per-row arithmetic (all cell refs share the same row number)
  if (allCellRefs.length >= 2 && isPerRow) {
    const opsInExpr = expr.replaceAll(/[A-Z]+\d+/gi, "").replaceAll(/[^+\-*/]/g, "").split("").filter(Boolean);

    if (allCellRefs.length === 2 && opsInExpr.length === 1) {
      const op = opsInExpr[0];
      return {
        type: "binary",
        label: `${OP_LABEL[op] || "Operación"}: columna ${allCellRefs[0].col} ${op} columna ${allCellRefs[1].col}`,
        description: `${OP_LABEL[op] || "Operación"} entre columna ${allCellRefs[0].col} (izquierda) y columna ${allCellRefs[1].col} (derecha), por fila. Auto-configurado correctamente.`,
        operation: OP_MAP[op] || "add",
        leftColLetters: allCellRefs[0].col, rightColLetters: allCellRefs[1].col, canConvert: true,
      };
    }

    const allSameOp = opsInExpr.length > 0 && opsInExpr.every((o) => o === opsInExpr[0]);
    if (allSameOp) {
      const op = opsInExpr[0];
      return {
        type: "chained",
        label: `${OP_LABEL[op] || "Op."} encadenada: ${allCellRefs.map((r) => r.col).join(" " + op + " ")}`,
        description: `Combina ${allCellRefs.length} columnas con ${OP_LABEL[op]?.toLowerCase() || "la misma operación"} en la misma fila. Se pre-configuran automáticamente la primera (${allCellRefs[0].col}) y la segunda (${allCellRefs[1].col}); ajusta si necesitas otras.`,
        operation: OP_MAP[op] || "add",
        leftColLetters: allCellRefs[0].col, rightColLetters: allCellRefs[1].col, canConvert: true,
      };
    }

    return {
      type: "chained_mixed",
      label: `Fórmula mixta: ${allCellRefs.map((r) => r.col).join(", ")}`,
      description: `Combina ${allCellRefs.length} columnas de la misma fila con distintas operaciones. Se pre-seleccionan ${allCellRefs[0].col} y ${allCellRefs[1].col}; cambia las columnas y la operación según necesites.`,
      operation: "add",
      leftColLetters: allCellRefs[0]?.col || null,
      rightColLetters: allCellRefs[1]?.col || null,
      canConvert: true,
    };
  }

  // Multi-row cell refs (different row numbers)
  if (allCellRefs.length >= 2 && !isPerRow) {
    return {
      type: "multi_row_ref", label: "Referencias a distintas filas",
      description: `Esta fórmula mezcla referencias de filas ${rowNumbers.join(" y ")}. No es una operación por fila y no puede convertirse directamente.`,
      operation: "add", canConvert: false,
    };
  }

  // Known named function
  const fnMatch = /^([A-Z_.]+)\s*\(/i.exec(expr);
  const fn = fnMatch?.[1]?.toUpperCase();
  if (fn) {
    return {
      type: "known_function", fn, label: fn,
      description: EXCEL_FUNCTION_DESCRIPTIONS[fn] || `Función Excel "${fn}". Requiere configuración manual para equivalencia en el tablero.`,
      operation: "add", canConvert: false,
    };
  }

  return {
    type: "unknown", label: "Fórmula no reconocida",
    description: `No se pudo interpretar "${expr}". Puedes configurarla manualmente o marcarla como omitida.`,
    operation: "add", canConvert: false,
  };
}
