function parseArgs(raw) {
  return raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isFinite(value));
}

function evalNamedFunction(expression) {
  const normalized = expression.trim().toUpperCase();
  const match = normalized.match(/^=([A-Z]+)\((.*)\)$/);
  if (!match) return null;

  const fn = match[1];
  const args = parseArgs(match[2]);

  if (fn === "SUM") {
    return args.reduce((acc, value) => acc + value, 0);
  }

  if (fn === "AVERAGE" || fn === "PROMEDIO") {
    if (!args.length) return 0;
    return args.reduce((acc, value) => acc + value, 0) / args.length;
  }

  if (fn === "MIN") {
    return args.length ? Math.min(...args) : 0;
  }

  if (fn === "MAX") {
    return args.length ? Math.max(...args) : 0;
  }

  return null;
}

export function evaluateFormula(value) {
  if (typeof value !== "string" || !value.trim().startsWith("=")) {
    return null;
  }

  const expression = value.trim();
  const functionResult = evalNamedFunction(expression);
  if (functionResult !== null) {
    return functionResult;
  }

  const raw = expression.slice(1);
  if (!/^[0-9+\-*/().\s]+$/.test(raw)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${raw});`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
