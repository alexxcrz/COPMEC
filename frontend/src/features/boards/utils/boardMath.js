import { evaluateFormula } from "./formulaMath";

export function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const formulaResult = evaluateFormula(value);
  if (formulaResult !== null) {
    return formulaResult;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getNumberMetrics(rows, key) {
  const values = rows.map((row) => normalizeNumber(row.cells[key]));

  const sum = values.reduce((acc, value) => acc + value, 0);
  const average = values.length ? sum / values.length : 0;
  const subtract = values.length
    ? values.slice(1).reduce((acc, value) => acc - value, values[0])
    : 0;

  return {
    sum,
    subtract,
    average,
  };
}
