import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Camera, Check, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Eye, EyeOff, Image as ImageIcon, Plus, RotateCcw, Settings, Trash2, Upload, X } from "lucide-react";
import { Modal } from "../components/Modal";
import { uploadFileToCloudinary } from "../services/upload.service";

const FALLBACK_PROCESS_TEMPLATES = [
  {
    area: "Inventario",
    process: "Revisión",
    questions: [
      { type: "yesno", text: "¿El proceso depende del conocimiento de una sola persona para ejecutarse correctamente?", required: true },
      { type: "yesno", text: "¿Se detectan variaciones de ejecución entre turnos para la misma revisión?", required: true },
      { type: "text", text: "¿Qué falla ocurre más y en qué punto exacto del flujo se origina?", required: false, placeholder: "Describe causa probable, impacto y propuesta inicial" },
    ],
  },
  {
    area: "Inventario",
    process: "Acomodo",
    questions: [
      { type: "yesno", text: "¿Se respeta el criterio de ubicación estándar o depende del criterio personal?", required: true },
      { type: "yesno", text: "¿Existen errores repetitivos de ubicación que obligan retrabajo?", required: true },
      { type: "text", text: "¿Qué parte del acomodo genera más errores y por qué?", required: false, placeholder: "Describe patrón, causa raíz y riesgo operativo" },
    ],
  },
  {
    area: "Inventario",
    process: "Recepción",
    questions: [
      { type: "yesno", text: "¿Se valida documento, condición física y lote antes de liberar la recepción?", required: true },
      { type: "yesno", text: "¿Hay cuellos de botella recurrentes que retrasan la recepción?", required: true },
      { type: "text", text: "¿Qué provoca recapturas o ajustes posteriores en recepción?", required: false, placeholder: "Describe en qué etapa se rompe el control" },
    ],
  },
  {
    area: "Inventario",
    process: "Devoluciones",
    questions: [
      { type: "yesno", text: "¿El criterio de aceptación/rechazo de devoluciones está estandarizado?", required: true },
      { type: "yesno", text: "¿Se identifica causa raíz de la devolución o solo se corrige el síntoma?", required: true },
      { type: "text", text: "Patrón de devoluciones", required: false, placeholder: "Indica recurrencias, causa y mejora preventiva" },
    ],
  },
  {
    area: "Inventario",
    process: "Reingresos",
    questions: [
      { type: "yesno", text: "¿Se valida trazabilidad y condición del producto antes del reingreso?", required: true },
      { type: "yesno", text: "¿Se rechazan reingresos sin evidencia suficiente?", required: true },
      { type: "text", text: "Riesgo en reingresos", required: false, placeholder: "Describe riesgos, controles faltantes y decisión recomendada" },
    ],
  },
  {
    area: "Inventario",
    process: "Traspasos",
    questions: [
      { type: "yesno", text: "¿Existe control robusto para asegurar coincidencia entre origen y destino?", required: true },
      { type: "yesno", text: "¿Hay diferencias recurrentes de inventario por fallas en traspaso?", required: true },
      { type: "text", text: "Fuga de control en traspasos", required: false, placeholder: "¿Dónde se pierde información o producto y por qué?" },
    ],
  },
  {
    area: "Limpieza",
    process: "General",
    questions: [
      { type: "yesno", text: "¿El estándar de limpieza se interpreta igual en todos los turnos?", required: true },
      { type: "yesno", text: "¿Se omiten tareas críticas cuando aumenta la carga operativa?", required: true },
      { type: "text", text: "Brecha de limpieza", required: false, placeholder: "Describe zona crítica, causa y acción de contención" },
    ],
  },
  {
    area: "Limpieza",
    process: "Limpieza de naves",
    questions: [
      { type: "yesno", text: "¿La ruta de limpieza reduce recontaminación entre zonas?", required: true },
      { type: "yesno", text: "¿Existen puntos ciegos que reinciden con hallazgos?", required: true },
      { type: "text", text: "Hallazgo crítico en nave", required: false, placeholder: "Describe zona reincidente y causa raíz" },
    ],
  },
  {
    area: "Limpieza",
    process: "Oficinas y baños",
    questions: [
      { type: "yesno", text: "¿El cumplimiento se valida con evidencia y no por percepción?", required: true },
      { type: "yesno", text: "¿Se anticipa reposición de insumos para evitar quiebres?", required: true },
      { type: "text", text: "Desviación de sanitización", required: false, placeholder: "Indica causa, impacto y propuesta" },
    ],
  },
  {
    area: "Pedidos",
    process: "Picking",
    questions: [
      { type: "yesno", text: "¿El error de picking se detecta antes del embarque en todos los casos?", required: true },
      { type: "yesno", text: "¿El proceso depende de operadores expertos para cumplir sin fallas?", required: true },
      { type: "text", text: "Punto de falla en picking", required: false, placeholder: "Indica etapa, causa raíz y costo de error" },
    ],
  },
  {
    area: "Pedidos",
    process: "Clientes",
    questions: [
      { type: "yesno", text: "¿La priorización de pedidos responde a criterios claros y medibles?", required: true },
      { type: "yesno", text: "¿Se documentan desviaciones de tiempo con causa y responsable?", required: true },
      { type: "text", text: "Riesgo en atención a clientes", required: false, placeholder: "Describe reclamo recurrente y cómo prevenirlo" },
    ],
  },
  {
    area: "Pedidos",
    process: "Paqueterías",
    questions: [
      { type: "yesno", text: "¿Se valida guía, bulto y contenido antes de cerrar embarque?", required: true },
      { type: "yesno", text: "¿Las incidencias de entrega se analizan con causa raíz?", required: true },
      { type: "text", text: "Hallazgo de paquetería", required: false, placeholder: "Describe desviación, impacto y acción correctiva" },
    ],
  },
  {
    area: "Inventario",
    process: "Almacén",
    questions: [
      { type: "yesno", text: "¿Existe control visual y digital para ubicar producto sin depender de memoria del operador?", required: true },
      { type: "yesno", text: "¿Se registran movimientos internos en tiempo real sin pendientes al cierre del turno?", required: true },
      { type: "text", text: "Principal fuga de control en almacén", required: false, placeholder: "Describe dónde se pierde trazabilidad y cómo corregirlo" },
    ],
  },
  {
    area: "Calidad",
    process: "Inspección",
    questions: [
      { type: "yesno", text: "¿El criterio de aceptación/rechazo se aplica igual por todos los inspectores?", required: true },
      { type: "yesno", text: "¿Se documenta evidencia objetiva de cada no conformidad detectada?", required: true },
      { type: "text", text: "Riesgo de calidad recurrente", required: false, placeholder: "Describe defecto, frecuencia y punto de origen" },
    ],
  },
  {
    area: "Calidad",
    process: "Liberación",
    questions: [
      { type: "yesno", text: "¿Ningún producto se libera sin checklist completo y firma responsable?", required: true },
      { type: "yesno", text: "¿Se bloquea automáticamente producto con desviación crítica?", required: true },
      { type: "text", text: "Brecha en liberación", required: false, placeholder: "Describe riesgo liberado, causa y contención" },
    ],
  },
  {
    area: "Regulatorio",
    process: "Documentación",
    questions: [
      { type: "yesno", text: "¿Los documentos críticos vigentes están controlados y accesibles en punto de uso?", required: true },
      { type: "yesno", text: "¿Se evita uso de formatos obsoletos en la operación diaria?", required: true },
      { type: "text", text: "Riesgo documental", required: false, placeholder: "Indica documento crítico, brecha y plan de corrección" },
    ],
  },
  {
    area: "Regulatorio",
    process: "Trazabilidad",
    questions: [
      { type: "yesno", text: "¿Se puede rastrear lote desde recepción hasta salida sin huecos de información?", required: true },
      { type: "yesno", text: "¿Los cambios de estatus de lote quedan registrados con usuario y hora?", required: true },
      { type: "text", text: "Pérdida de trazabilidad", required: false, placeholder: "Describe en qué etapa se rompe el rastro" },
    ],
  },
  {
    area: "Transporte",
    process: "Carga",
    questions: [
      { type: "yesno", text: "¿La unidad se valida contra pedido, ruta y condiciones antes de cargar?", required: true },
      { type: "yesno", text: "¿Existe doble verificación de estiba para evitar daño y devoluciones?", required: true },
      { type: "text", text: "Riesgo en carga", required: false, placeholder: "Describe error típico, impacto y acción preventiva" },
    ],
  },
  {
    area: "Transporte",
    process: "Entrega",
    questions: [
      { type: "yesno", text: "¿Se confirma evidencia de entrega completa y sin discrepancias?", required: true },
      { type: "yesno", text: "¿Las incidencias de última milla se documentan con causa raíz?", required: true },
      { type: "text", text: "Incidencia de entrega", required: false, placeholder: "Detalla desvío, cliente afectado y corrección" },
    ],
  },
  {
    area: "Retail",
    process: "Surtido",
    questions: [
      { type: "yesno", text: "¿El surtido en piso respeta prioridad comercial y rotación real?", required: true },
      { type: "yesno", text: "¿Se detectan quiebres de anaquel antes de afectar venta?", required: true },
      { type: "text", text: "Brecha en surtido retail", required: false, placeholder: "Describe SKU crítico, causa y plan inmediato" },
    ],
  },
  {
    area: "Retail",
    process: "Merma",
    questions: [
      { type: "yesno", text: "¿La merma se clasifica por causa real y no como categoría genérica?", required: true },
      { type: "yesno", text: "¿Se ejecutan acciones preventivas sobre las 3 causas principales?", required: true },
      { type: "text", text: "Patrón de merma", required: false, placeholder: "Indica causa predominante y control faltante" },
    ],
  },
  {
    area: "ESTO",
    process: "Operación diaria",
    questions: [
      { type: "yesno", text: "¿Las actividades críticas del área se cierran en tiempo y con evidencia?", required: true },
      { type: "yesno", text: "¿Existen desvíos repetitivos sin dueño claro de corrección?", required: true },
      { type: "text", text: "Hallazgo operativo ESTO", required: false, placeholder: "Describe desvío, responsable y fecha compromiso" },
    ],
  },
];

const QUESTION_VALID_TYPES = ["yesno", "text", "scale", "number", "date", "select", "multi"];
const IMPACT_OPTIONS = ["low", "medium", "high"];
const PROCESS_AUDIT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "in_review", label: "En revisión" },
  { value: "proposal_sent", label: "Propuesta enviada" },
  { value: "accepted", label: "Aceptada" },
  { value: "in_implementation", label: "En implementación" },
  { value: "in_validation", label: "En validación" },
  { value: "closed", label: "Cerrada" },
];
const PROPOSAL_TYPE_OPTIONS = [
  { value: "improvement", label: "Mejora" },
  { value: "correction", label: "Corrección" },
  { value: "redesign", label: "Rediseño total" },
];
const EFFORT_OPTIONS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
];

function normalizeImpactLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return IMPACT_OPTIONS.includes(normalized) ? normalized : "medium";
}

function normalizeLifecycleStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PROCESS_AUDIT_STATUS_OPTIONS.some((entry) => entry.value === normalized) ? normalized : "pending";
}

function resolveQuestionHasProblem(question = {}) {
  if (question.issueDetected === true) return true;
  if (question.issueDetected === false) return false;
  if (question.type === "yesno" && question.answer === false) return true;
  return false;
}

function resolveQuestionScoreColor(question = {}) {
  const hasProblem = resolveQuestionHasProblem(question);
  if (!hasProblem) return "green";
  return normalizeImpactLevel(question.impactLevel) === "high" ? "red" : "yellow";
}

function buildAuditScoring(questions = []) {
  const activeQuestions = (Array.isArray(questions) ? questions : []).filter((question) => question?.isActive !== false);
  const questionScores = activeQuestions.map((question) => ({
    questionId: question.id,
    category: question.category || "General",
    color: resolveQuestionScoreColor(question),
    impactLevel: normalizeImpactLevel(question.impactLevel),
    hasProblem: resolveQuestionHasProblem(question),
  }));

  const categoryMap = new Map();
  questionScores.forEach((entry) => {
    if (!categoryMap.has(entry.category)) {
      categoryMap.set(entry.category, { total: 0, red: 0, yellow: 0, green: 0 });
    }
    const bucket = categoryMap.get(entry.category);
    bucket.total += 1;
    if (entry.color === "red") bucket.red += 1;
    else if (entry.color === "yellow") bucket.yellow += 1;
    else bucket.green += 1;
  });

  const categoryScores = Array.from(categoryMap.entries()).map(([category, summary]) => ({
    category,
    ...summary,
    color: summary.red > 0 ? "red" : summary.yellow > 0 ? "yellow" : "green",
    scorePercent: summary.total > 0 ? Math.round((summary.green / summary.total) * 100) : 0,
  }));

  const global = categoryScores.reduce((acc, item) => ({
    total: acc.total + item.total,
    red: acc.red + item.red,
    yellow: acc.yellow + item.yellow,
    green: acc.green + item.green,
  }), { total: 0, red: 0, yellow: 0, green: 0 });

  return {
    questionScores,
    categoryScores,
    global: {
      ...global,
      color: global.red > 0 ? "red" : global.yellow > 0 ? "yellow" : "green",
      scorePercent: global.total > 0 ? Math.round((global.green / global.total) * 100) : 0,
    },
  };
}

function buildDetectedProblems(questions = []) {
  return (Array.isArray(questions) ? questions : [])
    .filter((question) => question?.isActive !== false)
    .filter((question) => resolveQuestionHasProblem(question))
    .map((question) => ({
      id: question.problemId || `problem-${question.id}`,
      questionId: question.id,
      category: question.category || "General",
      impactLevel: normalizeImpactLevel(question.impactLevel),
      problem: question.text || "Problema detectado",
      observations: String(question.observations || "").trim(),
    }));
}

function buildDefaultProposal(problem = {}) {
  return {
    id: crypto.randomUUID(),
    problemId: String(problem.id || "").trim(),
    problem: String(problem.problem || "").trim(),
    rootCause: "",
    proposal: "",
    type: "improvement",
    expectedImpact: "",
    effort: "medium",
    responsible: "",
    status: "pending",
  };
}

function getScoreChipLabel(color) {
  if (color === "red") return "🔴 Crítico";
  if (color === "yellow") return "🟡 Riesgo";
  return "🟢 Controlado";
}

function isQuestionVisible(question = {}, allQuestions = []) {
  if (question?.isActive === false) return false;
  const dependencyId = String(question?.conditionalQuestionId || "").trim();
  if (!dependencyId) return true;
  const dependency = (Array.isArray(allQuestions) ? allQuestions : []).find((entry) => entry.id === dependencyId);
  if (!dependency) return true;

  const expected = question?.conditionalAnswer;
  if (expected === true || expected === false) return dependency.answer === expected;
  const expectedText = String(expected || "").trim().toLowerCase();
  if (!expectedText) return true;
  if (expectedText === "true" || expectedText === "false") {
    return dependency.answer === (expectedText === "true");
  }
  if (Array.isArray(dependency.answer)) {
    return dependency.answer.some((entry) => String(entry || "").trim().toLowerCase() === expectedText);
  }
  return String(dependency.answer ?? "").trim().toLowerCase() === expectedText;
}

function buildQuestionDraft(question = {}) {
  const type = QUESTION_VALID_TYPES.includes(question.type) ? question.type : "yesno";
  return {
    id: question.id || crypto.randomUUID(),
    type,
    text: String(question.text || "").trim(),
    required: question.required !== false,
    placeholder: String(question.placeholder || "").trim(),
    answer: type === "text" ? String(question.answer || "") : type === "multi" ? (Array.isArray(question.answer) ? question.answer : []) : question.answer ?? null,
    category: String(question.category || "General").trim() || "General",
    isActive: question.isActive !== false,
    conditionalQuestionId: String(question.conditionalQuestionId || "").trim(),
    conditionalAnswer: question.conditionalAnswer ?? "",
    allowNote: Boolean(question.allowNote),
    options: Array.isArray(question.options) ? [...question.options] : [],
    minValue: typeof question.minValue === "number" ? question.minValue : 1,
    maxValue: typeof question.maxValue === "number" ? question.maxValue : (type === "scale" ? 5 : 10),
    issueDetected: question.issueDetected === true ? true : question.issueDetected === false ? false : null,
    impactLevel: normalizeImpactLevel(question.impactLevel),
    observations: String(question.observations || ""),
    evidenceRequired: Boolean(question.evidenceRequired),
  };
}

function _buildFallbackTemplates() {
  return FALLBACK_PROCESS_TEMPLATES.map((template, index) => ({
    id: `fallback-template-${index + 1}`,
    area: template.area,
    process: template.process,
    isActive: true,
    isFallback: true,
    questions: template.questions.map((question, questionIndex) => buildQuestionDraft({
      ...question,
      id: `fallback-question-${index + 1}-${questionIndex + 1}`,
    })),
  }));
}

function emptyTemplateDraft(area = "", process = "") {
  return {
    id: "",
    area,
    process,
    isFallback: false,
    questions: [buildQuestionDraft()],
  };
}

function cloneTemplateIntoDraft(template = null, area = "", process = "") {
  if (!template) return emptyTemplateDraft(area, process);
  return {
    id: template.isFallback ? "" : template.id || "",
    area: template.area || area,
    process: template.process || process,
    isFallback: Boolean(template.isFallback),
    questions: (template.questions || []).map((question) => buildQuestionDraft(question)),
  };
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getAuditDurationSeconds(audit) {
  const startMs = Date.parse(audit?.startedAt || "");
  const endMs = Date.parse((audit?.status === "closed" ? audit?.closedAt : audit?.updatedAt) || "");
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 0;
  return Math.round((endMs - startMs) / 1000);
}

function formatDuration(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function normalizeQuestionsForSave(questions = []) {
  return questions
    .map((question) => {
      const type = QUESTION_VALID_TYPES.includes(question.type) ? question.type : "yesno";
      return {
        id: question.id || crypto.randomUUID(),
        type,
        text: String(question.text || "").trim(),
        required: question.required !== false,
        placeholder: String(question.placeholder || "").trim(),
        answer: type === "text" ? String(question.answer || "") : type === "multi" ? (Array.isArray(question.answer) ? question.answer : []) : question.answer ?? null,
        category: String(question.category || "General").trim() || "General",
        isActive: question.isActive !== false,
        conditionalQuestionId: String(question.conditionalQuestionId || "").trim(),
        conditionalAnswer: question.conditionalAnswer ?? "",
        allowNote: Boolean(question.allowNote),
        options: Array.isArray(question.options) ? [...question.options] : [],
        minValue: typeof question.minValue === "number" ? question.minValue : 1,
        maxValue: typeof question.maxValue === "number" ? question.maxValue : (type === "scale" ? 5 : 10),
        issueDetected: question.issueDetected === true ? true : question.issueDetected === false ? false : null,
        impactLevel: normalizeImpactLevel(question.impactLevel),
        observations: String(question.observations || ""),
        evidenceRequired: Boolean(question.evidenceRequired),
      };
    })
    .filter((question) => question.text);
}

function buildQuickStat(label, value) {
  return { label, value };
}

function cloneAuditRecord(audit = null) {
  if (!audit) return null;
  return {
    ...audit,
    questions: (audit.questions || []).map((question) => ({ ...question })),
    evidences: [...(audit.evidences || [])],
    proposals: (audit.proposals || []).map((proposal) => ({ ...proposal })),
    followUp: (audit.followUp || []).map((entry) => ({ ...entry })),
    implementationPlan: { ...(audit.implementationPlan || {}) },
  };
}

function buildRichEditorState(audit = null) {
  return {
    notes: !String(audit?.notes || "").trim(),
    ...Object.fromEntries(
      (audit?.questions || [])
        .filter((question) => question.type === "text")
        .map((question) => [question.id, !String(question.answer || "").trim()]),
    ),
  };
}

function wrapAnswerSelection(value, selectionStart, selectionEnd, prefix, suffix = prefix) {
  const safeValue = String(value || "");
  const start = Math.max(0, Number(selectionStart ?? 0));
  const end = Math.max(start, Number(selectionEnd ?? start));
  const selectedText = safeValue.slice(start, end);
  const insertion = `${prefix}${selectedText}${suffix}`;
  const nextValue = `${safeValue.slice(0, start)}${insertion}${safeValue.slice(end)}`;
  const cursorOffset = selectedText ? insertion.length : prefix.length;

  return {
    value: nextValue,
    selectionStart: start + prefix.length,
    selectionEnd: start + cursorOffset,
  };
}

function prefixAnswerLines(value, selectionStart, selectionEnd, prefix = "- ") {
  const safeValue = String(value || "");
  const start = Math.max(0, Number(selectionStart ?? 0));
  const end = Math.max(start, Number(selectionEnd ?? start));
  const blockStart = safeValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineBreakIndex = safeValue.indexOf("\n", end);
  const blockEnd = lineBreakIndex >= 0 ? lineBreakIndex : safeValue.length;
  const block = safeValue.slice(blockStart, blockEnd) || "";
  const nextBlock = block
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
    .join("\n");
  const nextValue = `${safeValue.slice(0, blockStart)}${nextBlock}${safeValue.slice(blockEnd)}`;

  return {
    value: nextValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}

function insertAnswerText(value, selectionStart, selectionEnd, text) {
  const safeValue = String(value || "");
  const start = Math.max(0, Number(selectionStart ?? 0));
  const end = Math.max(start, Number(selectionEnd ?? start));
  const nextValue = `${safeValue.slice(0, start)}${text}${safeValue.slice(end)}`;
  const cursor = start + text.length;

  return {
    value: nextValue,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

function getCurrentAnswerLineMeta(value, cursorPosition) {
  const safeValue = String(value || "");
  const cursor = Math.max(0, Number(cursorPosition ?? 0));
  const lineStart = safeValue.lastIndexOf("\n", Math.max(0, cursor - 1)) + 1;
  const nextBreak = safeValue.indexOf("\n", cursor);
  const lineEnd = nextBreak >= 0 ? nextBreak : safeValue.length;
  const line = safeValue.slice(lineStart, lineEnd);

  return { line, lineStart, lineEnd, cursor };
}

function continueAnswerStructuredLine(value, cursorPosition) {
  const { line, lineStart, lineEnd, cursor } = getCurrentAnswerLineMeta(value, cursorPosition);
  const unorderedMatch = line.match(/^(\s*-\s)(.*)$/);
  if (unorderedMatch) {
    const prefix = unorderedMatch[1];
    const content = unorderedMatch[2] || "";
    if (!content.trim()) {
      const nextValue = `${value.slice(0, lineStart)}${value.slice(lineEnd)}`;
      return { value: nextValue, selectionStart: lineStart, selectionEnd: lineStart };
    }
    return insertAnswerText(value, cursor, cursor, `\n${prefix}`);
  }

  const orderedMatch = line.match(/^(\s*)(\d+)\.\s(.*)$/);
  if (orderedMatch) {
    const indentation = orderedMatch[1] || "";
    const currentNumber = Number(orderedMatch[2] || "1");
    const content = orderedMatch[3] || "";
    if (!content.trim()) {
      const nextValue = `${value.slice(0, lineStart)}${value.slice(lineEnd)}`;
      return { value: nextValue, selectionStart: lineStart, selectionEnd: lineStart };
    }
    return insertAnswerText(value, cursor, cursor, `\n${indentation}${currentNumber + 1}. `);
  }

  const quoteMatch = line.match(/^(\s*>\s?)(.*)$/);
  if (quoteMatch) {
    const prefix = quoteMatch[1];
    const content = quoteMatch[2] || "";
    if (!content.trim()) {
      const nextValue = `${value.slice(0, lineStart)}${value.slice(lineEnd)}`;
      return { value: nextValue, selectionStart: lineStart, selectionEnd: lineStart };
    }
    return insertAnswerText(value, cursor, cursor, `\n${prefix}`);
  }

  return null;
}

function prefixOrderedAnswerLines(value, selectionStart, selectionEnd) {
  const safeValue = String(value || "");
  const start = Math.max(0, Number(selectionStart ?? 0));
  const end = Math.max(start, Number(selectionEnd ?? start));
  const blockStart = safeValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineBreakIndex = safeValue.indexOf("\n", end);
  const blockEnd = lineBreakIndex >= 0 ? lineBreakIndex : safeValue.length;
  const block = safeValue.slice(blockStart, blockEnd) || "";
  const nextBlock = block
    .split("\n")
    .map((line, index) => {
      const content = line.replace(/^\d+\.\s+/, "").trim();
      return `${index + 1}. ${content}`;
    })
    .join("\n");
  const nextValue = `${safeValue.slice(0, blockStart)}${nextBlock}${safeValue.slice(blockEnd)}`;

  return {
    value: nextValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + nextBlock.length,
  };
}

function insertAnswerLink(value, selectionStart, selectionEnd) {
  const safeValue = String(value || "");
  const start = Math.max(0, Number(selectionStart ?? 0));
  const end = Math.max(start, Number(selectionEnd ?? start));
  const selectedText = safeValue.slice(start, end).trim() || "enlace";
  const insertion = `[${selectedText}](https://)`;
  const nextValue = `${safeValue.slice(0, start)}${insertion}${safeValue.slice(end)}`;
  const urlStart = start + selectedText.length + 3;
  const urlEnd = urlStart + "https://".length;

  return {
    value: nextValue,
    selectionStart: urlStart,
    selectionEnd: urlEnd,
  };
}

function escapeRichTextHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function applyInlineRichFormats(text = "") {
  let html = escapeRichTextHtml(text);
  html = html.replace(/(🔴\s*Problema)/gi, '<span class="audit-tag-problem">$1</span>');
  html = html.replace(/(⚠️\s*Riesgo)/gi, '<span class="audit-tag-risk">$1</span>');
  html = html.replace(/(🟢\s*Mejora)/gi, '<span class="audit-tag-improvement">$1</span>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<u>$1</u>");
  html = html.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return html;
}

function formatRichTextToHtml(value) {
  const lines = String(value || "").split(/\r?\n/);
  const blocks = [];
  let listState = null;

  const flushList = () => {
    if (!listState?.items?.length) return;
    blocks.push(`<${listState.type} class="audit-rich-response-list">${listState.items.map((item) => `<li>${item}</li>`).join("")}</${listState.type}>`);
    listState = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push(`<blockquote class="audit-rich-response-quote">${applyInlineRichFormats(trimmed.slice(2))}</blockquote>`);
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const content = applyInlineRichFormats(trimmed.replace(/^\d+\.\s+/, ""));
      if (!listState || listState.type !== "ol") {
        flushList();
        listState = { type: "ol", items: [] };
      }
      listState.items.push(content);
      return;
    }

    if (trimmed.startsWith("- ")) {
      const content = applyInlineRichFormats(trimmed.slice(2));
      if (!listState || listState.type !== "ul") {
        flushList();
        listState = { type: "ul", items: [] };
      }
      listState.items.push(content);
      return;
    }

    flushList();
    blocks.push(`<p class="audit-rich-response-paragraph">${applyInlineRichFormats(trimmed)}</p>`);
  });

  flushList();
  return blocks.join("") || '<p class="audit-rich-response-empty">Sin respuesta.</p>';
}

function isImageEvidence(evidence = {}) {
  return String(evidence.mimeType || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(evidence.name || evidence.url || ""));
}

function isVideoEvidence(evidence = {}) {
  return String(evidence.mimeType || "").startsWith("video/") || /\.(mp4|mov|webm|ogg)$/i.test(String(evidence.name || evidence.url || ""));
}

const PREWARMED_AUDIT_MEDIA_URLS = new Set();
const PREWARMED_AUDIT_MEDIA_POOL = [];

function prewarmAuditEvidenceMedia(evidences = [], limit = 24) {
  (Array.isArray(evidences) ? evidences : []).slice(0, limit).forEach((evidence) => {
    const imageLike = isImageEvidence(evidence);
    const videoLike = isVideoEvidence(evidence);
    const mediaUrl = String((imageLike ? (evidence?.thumbnailUrl || evidence?.url) : evidence?.url) || "").trim();
    if (!mediaUrl || PREWARMED_AUDIT_MEDIA_URLS.has(mediaUrl)) return;
    PREWARMED_AUDIT_MEDIA_URLS.add(mediaUrl);

    if (imageLike) {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = "high";
      image.src = mediaUrl;
      PREWARMED_AUDIT_MEDIA_POOL.push(image);
      return;
    }

    if (videoLike) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = mediaUrl;
      video.load();
      PREWARMED_AUDIT_MEDIA_POOL.push(video);
    }
  });

  if (PREWARMED_AUDIT_MEDIA_POOL.length > 60) {
    PREWARMED_AUDIT_MEDIA_POOL.splice(0, PREWARMED_AUDIT_MEDIA_POOL.length - 60);
  }
}

function EvidenceLightbox({ evidences, startIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const total = evidences.length;
  const current = evidences[currentIndex] || null;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setCurrentIndex((index) => (index + 1) % total);
      if (event.key === "ArrowLeft") setCurrentIndex((index) => (index - 1 + total) % total);
    }
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onClose, total]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!current) return null;

  return createPortal(
    <div
      className="audit-lightbox-backdrop"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="audit-lightbox-shell" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="audit-lightbox-close" onClick={onClose} aria-label="Cerrar vista previa">
          <X size={18} />
        </button>
        {total > 1 ? (
          <button type="button" className="audit-lightbox-nav prev" onClick={() => setCurrentIndex((index) => (index - 1 + total) % total)} aria-label="Evidencia anterior">
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <img src={current.url} alt={current.name || "Evidencia"} className="audit-lightbox-image" />
        {total > 1 ? (
          <button type="button" className="audit-lightbox-nav next" onClick={() => setCurrentIndex((index) => (index + 1) % total)} aria-label="Siguiente evidencia">
            <ChevronRight size={22} />
          </button>
        ) : null}
        <div className="audit-lightbox-caption">
          <span>{current.name || "Evidencia"}</span>
          {total > 1 ? <small>{currentIndex + 1} / {total}</small> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CameraCaptureModal({ open, onClose, onCapture, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let disposed = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La cámara no está disponible en este navegador.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setCameraError("");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (error) {
        setCameraError(error?.message || "No se pudo abrir la cámara.");
      }
    }

    startCamera();
    return () => {
      disposed = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  async function handleCapture() {
    if (disabled || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    const file = new File([blob], `auditoria-${Date.now()}.jpg`, { type: "image/jpeg" });
    await onCapture(file);
  }

  return (
    <Modal
      open={open}
      title="Capturar evidencia"
      confirmLabel={disabled ? "Subiendo..." : "Tomar foto"}
      cancelLabel="Cerrar"
      onClose={onClose}
      onConfirm={handleCapture}
      confirmDisabled={disabled || Boolean(cameraError)}
    >
      <div className="audit-camera-shell">
        {cameraError ? <p className="validation-text">{cameraError}</p> : null}
        <div className="audit-camera-preview">
          <video ref={videoRef} autoPlay playsInline muted className="audit-camera-video" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
        <p className="modal-footnote">La imagen se sube inmediatamente a la auditoría activa cuando confirmas.</p>
      </div>
    </Modal>
  );
}

function AuditEvidenceGrid({ evidences, canEdit, canUpload, uploading, onOpenGallery, onOpenCamera, onDelete }) {
  const [lightbox, setLightbox] = useState(null);
  const imageEvidences = useMemo(() => evidences.filter((evidence) => isImageEvidence(evidence)), [evidences]);

  useEffect(() => {
    prewarmAuditEvidenceMedia(evidences, canUpload ? 8 : 20);
  }, [canUpload, evidences]);

  function openLightbox(evidence) {
    const index = imageEvidences.findIndex((item) => item.id === evidence.id);
    setLightbox({ evidences: imageEvidences, startIndex: index >= 0 ? index : 0 });
  }

  return (
    <div className="audit-evidence-section">
      {canUpload ? (
        <div className="audit-inline-actions audit-evidence-actions">
          <button type="button" className="icon-button" onClick={onOpenGallery} disabled={uploading || !canEdit}>
            <Upload size={15} /> {uploading ? "Subiendo..." : "Galería"}
          </button>
          <button type="button" className="icon-button" onClick={onOpenCamera} disabled={uploading || !canEdit}>
            <Camera size={15} /> Cámara
          </button>
        </div>
      ) : null}

      {!evidences.length ? <p className="subtle-line">No hay evidencias adjuntas.</p> : null}

      <div className="audit-evidence-grid">
        {evidences.map((evidence) => (
          <article key={evidence.id} className="surface-card audit-evidence-card audit-evidence-card-rich">
            <div className="audit-evidence-preview-shell">
              {isImageEvidence(evidence) ? (
                <button type="button" className="audit-evidence-preview-button" onClick={() => openLightbox(evidence)}>
                  <img
                    src={evidence.thumbnailUrl || evidence.url}
                    alt={evidence.name || "Evidencia"}
                    className="audit-evidence-preview-image"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </button>
              ) : isVideoEvidence(evidence) ? (
                <a href={evidence.url} target="_blank" rel="noreferrer" className="audit-evidence-preview-button audit-evidence-preview-video-link">
                  <video src={evidence.url} poster={evidence.thumbnailUrl || undefined} className="audit-evidence-preview-video" muted playsInline preload="metadata" />
                </a>
              ) : (
                <a href={evidence.url} target="_blank" rel="noreferrer" className="audit-evidence-preview-file">
                  <ImageIcon size={28} />
                </a>
              )}
              {evidence.isPending ? <span className="chip warning audit-evidence-pending-chip">Subiendo</span> : null}
            </div>
            <div className="card-header-row">
              <div>
                <strong>{evidence.name || "Evidencia"}</strong>
                <p className="subtle-line">{formatDateTime(evidence.createdAt)}</p>
                {evidence.uploadedByName ? <p className="subtle-line">Por {evidence.uploadedByName}</p> : null}
              </div>
              <div className="audit-inline-actions">
                <a href={evidence.url} target="_blank" rel="noreferrer" className="icon-button" title="Abrir evidencia">
                  <ExternalLink size={14} />
                </a>
                {canEdit && !evidence.isPending ? (
                  <button type="button" className="icon-button danger" onClick={() => onDelete(evidence.id)}>
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {lightbox ? <EvidenceLightbox evidences={lightbox.evidences} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} /> : null}
    </div>
  );
}

function RichTextResponseField({
  label,
  value,
  placeholder,
  canEdit,
  isEditing,
  onChange,
  onEdit,
  onSave,
  saveLabel = "Guardar respuesta",
  editLabel = "Editar respuesta",
}) {
  const textareaRef = useRef(null);

  function applySelectionTransform(transformer) {
    const textarea = textareaRef.current;
    if (!textarea || !canEdit) return;
    const next = transformer(
      value,
      textarea.selectionStart ?? String(value || "").length,
      textarea.selectionEnd ?? String(value || "").length,
    );
    onChange(next.value);
    requestAnimationFrame(() => {
      const nextTextarea = textareaRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  function handleTextareaKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const next = continueAnswerStructuredLine(value, textarea.selectionStart ?? String(value || "").length);
    if (!next) return;
    event.preventDefault();
    onChange(next.value);
    requestAnimationFrame(() => {
      const nextTextarea = textareaRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  return (
    <div className="audit-rich-response-shell">
      <div className="audit-rich-response-head">
        <span>{label}</span>
        {canEdit ? (
          isEditing ? (
            <button type="button" className="primary-button" onClick={onSave}>
              {saveLabel}
            </button>
          ) : (
            <button type="button" className="icon-button" onClick={onEdit}>
              {editLabel}
            </button>
          )
        ) : null}
      </div>

      {isEditing ? (
        <div className="audit-text-answer-shell">
          <div className="chat-input-toolbar audit-rich-toolbar" role="toolbar" aria-label={`Formato para ${label}`}>
            <div className="chat-toolbar-left">
              <button type="button" className="chat-btn-tool" title="Negrita" onClick={() => applySelectionTransform((current, start, end) => wrapAnswerSelection(current, start, end, "**"))}>
                <strong>B</strong>
              </button>
              <button type="button" className="chat-btn-tool" title="Itálica" onClick={() => applySelectionTransform((current, start, end) => wrapAnswerSelection(current, start, end, "*"))}>
                <em>I</em>
              </button>
              <button type="button" className="chat-btn-tool" title="Subrayado" onClick={() => applySelectionTransform((current, start, end) => wrapAnswerSelection(current, start, end, "__"))}>
                <u>U</u>
              </button>
              <button type="button" className="chat-btn-tool" title="Tachado" onClick={() => applySelectionTransform((current, start, end) => wrapAnswerSelection(current, start, end, "~~"))}>
                <s>S</s>
              </button>
              <button type="button" className="chat-btn-tool" title="Código" onClick={() => applySelectionTransform((current, start, end) => wrapAnswerSelection(current, start, end, "`"))}>
                {"</>"}
              </button>
              <button type="button" className="chat-btn-tool" title="Link" onClick={() => applySelectionTransform((current, start, end) => insertAnswerLink(current, start, end))}>
                🔗
              </button>
              <button type="button" className="chat-btn-tool" title="Lista" onClick={() => applySelectionTransform((current, start, end) => prefixAnswerLines(current, start, end, "- "))}>
                •
              </button>
              <button type="button" className="chat-btn-tool" title="Lista numerada" onClick={() => applySelectionTransform((current, start, end) => prefixOrderedAnswerLines(current, start, end))}>
                1.
              </button>
              <button type="button" className="chat-btn-tool" title="Cita" onClick={() => applySelectionTransform((current, start, end) => prefixAnswerLines(current, start, end, "> "))}>
                ""
              </button>
              <button type="button" className="chat-btn-tool" title="Etiqueta problema" onClick={() => applySelectionTransform((current, start, end) => insertAnswerText(current, start, end, "🔴 Problema: "))}>
                🔴
              </button>
              <button type="button" className="chat-btn-tool" title="Etiqueta riesgo" onClick={() => applySelectionTransform((current, start, end) => insertAnswerText(current, start, end, "⚠️ Riesgo: "))}>
                ⚠️
              </button>
              <button type="button" className="chat-btn-tool" title="Etiqueta mejora" onClick={() => applySelectionTransform((current, start, end) => insertAnswerText(current, start, end, "🟢 Mejora: "))}>
                🟢
              </button>
            </div>
          </div>

          <label className="app-modal-field">
            <span>{label}</span>
            <textarea
              ref={textareaRef}
              value={String(value || "")}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={placeholder || "Escribe aquí"}
              rows={6}
              className="audit-rich-textarea"
            />
          </label>
        </div>
      ) : (
        <div className="audit-rich-response-display" dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(value) }} />
      )}
    </div>
  );
}

function TemplateQuestionEditor({
  draft,
  setDraft,
  disabled,
  title,
  _subtitle,
  addLabel,
}) {
  return (
    <div className="audit-editor-shell">
      <div className="card-header-row">
        <div>
          <h3>{title}</h3>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setDraft((current) => ({
            ...current,
            questions: [...(current.questions || []), buildQuestionDraft()],
          }))}
          disabled={disabled}
        >
          <Plus size={15} />
          {addLabel}
        </button>
      </div>

      <div className="audit-question-editor-list">
        {(draft.questions || []).map((question, index) => (
          <article key={question.id} className="surface-card audit-question-editor-card">
            <div className="card-header-row">
              <strong>Pregunta {index + 1}</strong>
              <button
                type="button"
                className="icon-button danger"
                onClick={() => setDraft((current) => ({
                  ...current,
                  questions: current.questions.length > 1
                    ? current.questions.filter((item) => item.id !== question.id)
                    : current.questions,
                }))}
                disabled={disabled || (draft.questions || []).length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="audit-question-editor-grid">
              <label className="app-modal-field">
                <span>Tipo</span>
                <select
                  value={question.type}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => {
                      if (item.id !== question.id) return item;
                      const newType = QUESTION_VALID_TYPES.includes(event.target.value) ? event.target.value : "yesno";
                      return {
                        ...item,
                        type: newType,
                        answer: newType === "text" ? String(item.answer || "") : null,
                      };
                    }),
                  }))}
                  disabled={disabled}
                >
                  <option value="yesno">Sí / No</option>
                  <option value="text">Texto libre</option>
                  <option value="scale">Escala numérica</option>
                  <option value="number">Número</option>
                  <option value="date">Fecha</option>
                  <option value="select">Selección (lista)</option>
                  <option value="multi">Opción múltiple</option>
                </select>
              </label>
              <label className="app-modal-field audit-field-span-2">
                <span>Pregunta</span>
                <input
                  value={question.text}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => (item.id === question.id ? { ...item, text: event.target.value } : item)),
                  }))}
                  placeholder="Escribe la pregunta"
                  disabled={disabled}
                />
              </label>
              <label className="app-modal-field">
                <span>Categoría</span>
                <input
                  value={question.category || "General"}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => (item.id === question.id ? { ...item, category: event.target.value } : item)),
                  }))}
                  placeholder="Ej. Estándar / Riesgos / Variabilidad"
                  disabled={disabled}
                />
              </label>
              <label className="app-modal-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`switch-button ${question.isActive !== false ? "on" : ""}`}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => (item.id === question.id ? { ...item, isActive: !(question.isActive !== false) } : item)),
                  }))}
                  disabled={disabled}
                  aria-pressed={question.isActive !== false}
                  aria-label="Alternar pregunta activa"
                >
                  <span className="switch-thumb" />
                </button>
                <span>{question.isActive !== false ? "Activa" : "Inactiva"}</span>
              </label>
              <label className="app-modal-field">
                <span>Mostrar si</span>
                <select
                  value={question.conditionalQuestionId || ""}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => {
                      if (item.id !== question.id) return item;
                      return { ...item, conditionalQuestionId: event.target.value, conditionalAnswer: "" };
                    }),
                  }))}
                  disabled={disabled}
                >
                  <option value="">Siempre visible</option>
                  {(draft.questions || []).filter((entry) => entry.id !== question.id).map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.text || `Pregunta ${entry.id.slice(0, 4)}`}</option>
                  ))}
                </select>
              </label>
              <label className="app-modal-field">
                <span>Valor esperado</span>
                <input
                  value={question.conditionalAnswer ?? ""}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => (item.id === question.id ? { ...item, conditionalAnswer: event.target.value } : item)),
                  }))}
                  placeholder="true / false / texto"
                  disabled={disabled || !question.conditionalQuestionId}
                />
              </label>
              {(question.type === "text" || question.type === "number" || question.type === "date") ? (
                <label className="app-modal-field audit-field-span-2">
                  <span>Placeholder</span>
                  <input
                    value={question.placeholder || ""}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      questions: current.questions.map((item) => (item.id === question.id ? { ...item, placeholder: event.target.value } : item)),
                    }))}
                    placeholder="Texto de ayuda"
                    disabled={disabled}
                  />
                </label>
              ) : null}
              {question.type === "yesno" ? (
                <label className="app-modal-field audit-field-span-2" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className={`switch-button ${Boolean(question.allowNote) ? "on" : ""}`}
                    onClick={() => setDraft((current) => ({
                      ...current,
                      questions: current.questions.map((item) => (item.id === question.id ? { ...item, allowNote: !Boolean(question.allowNote) } : item)),
                    }))}
                    disabled={disabled}
                    aria-pressed={Boolean(question.allowNote)}
                    aria-label="Permitir nota opcional"
                  >
                    <span className="switch-thumb" />
                  </button>
                  <span>{Boolean(question.allowNote) ? "Nota opcional activada" : "Nota opcional desactivada"}</span>
                </label>
              ) : null}
              <label className="app-modal-field audit-field-span-2" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`switch-button ${Boolean(question.evidenceRequired) ? "on" : ""}`}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    questions: current.questions.map((item) => (item.id === question.id ? { ...item, evidenceRequired: !Boolean(question.evidenceRequired) } : item)),
                  }))}
                  disabled={disabled}
                  aria-pressed={Boolean(question.evidenceRequired)}
                  aria-label="Requerir evidencia"
                >
                  <span className="switch-thumb" />
                </button>
                <span>{Boolean(question.evidenceRequired) ? "Evidencia requerida" : "Evidencia opcional"}</span>
              </label>
              {question.type === "scale" ? (
                <>
                  <label className="app-modal-field">
                    <span>Mínimo</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={question.minValue ?? 1}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        questions: current.questions.map((item) => (item.id === question.id ? { ...item, minValue: Number(event.target.value) } : item)),
                      }))}
                      disabled={disabled}
                    />
                  </label>
                  <label className="app-modal-field">
                    <span>Máximo</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={question.maxValue ?? 5}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        questions: current.questions.map((item) => (item.id === question.id ? { ...item, maxValue: Number(event.target.value) } : item)),
                      }))}
                      disabled={disabled}
                    />
                  </label>
                </>
              ) : null}
              {(question.type === "select" || question.type === "multi") ? (
                <div className="app-modal-field audit-field-span-2">
                  <span style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600, fontSize: "0.8rem" }}>Opciones</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {(question.options || []).map((opt, optIndex) => (
                      <div key={optIndex} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <input
                          value={opt}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) => {
                              if (item.id !== question.id) return item;
                              const newOpts = [...(item.options || [])];
                              newOpts[optIndex] = event.target.value;
                              return { ...item, options: newOpts };
                            }),
                          }))}
                          placeholder={`Opción ${optIndex + 1}`}
                          disabled={disabled}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => setDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) => {
                              if (item.id !== question.id) return item;
                              const newOpts = (item.options || []).filter((_, i) => i !== optIndex);
                              return { ...item, options: newOpts };
                            }),
                          }))}
                          disabled={disabled}
                        ><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="icon-button"
                      style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
                      onClick={() => setDraft((current) => ({
                        ...current,
                        questions: current.questions.map((item) => {
                          if (item.id !== question.id) return item;
                          return { ...item, options: [...(item.options || []), ""] };
                        }),
                      }))}
                      disabled={disabled}
                    ><Plus size={12} /> Agregar opción</button>
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function AuditoriasProcesosCompact({ contexto }) {
  const {
    rootAreaOptions,
    processAuditTemplates,
    processAudits,
    actionPermissions,
    currentUser,
    upsertProcessAuditTemplate,
    deleteProcessAuditTemplate,
    createProcessAudit,
    updateProcessAudit,
    deleteProcessAudit,
    resetProcessAuditStats,
    addProcessAuditEvidence,
    removeProcessAuditEvidence,
    pushAppToast,
  } = contexto;

  const canManageAudits = Boolean(actionPermissions?.manageProcessAudits);
  const canManageTemplates = Boolean(actionPermissions?.manageProcessAuditTemplates);

  const [activeTab, setActiveTab] = useState("capture");
  const [templateDraft, setTemplateDraft] = useState(() => emptyTemplateDraft());
  const [newAuditArea, setNewAuditArea] = useState("");
  const [newAuditSubArea, setNewAuditSubArea] = useState("");
  const [newAuditProcess, setNewAuditProcess] = useState("");
  const [newAuditTemplateId, setNewAuditTemplateId] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [auditDraft, setAuditDraft] = useState(null);
  const [auditQuestionsDraft, setAuditQuestionsDraft] = useState(null);
  const [isAuditDirty, setIsAuditDirty] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [pendingEvidences, setPendingEvidences] = useState([]);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [templateManagerTab, setTemplateManagerTab] = useState("library");
  const [auditEditorOpen, setAuditEditorOpen] = useState(false);
  const [templateFilterArea, setTemplateFilterArea] = useState("");
  const [templateFilterProcess, setTemplateFilterProcess] = useState("");
  const [deleteAuditModal, setDeleteAuditModal] = useState({
    open: false,
    auditId: "",
    auditLabel: "",
    leadPassword: "",
    submitting: false,
  });
  const [showDeleteAuditLeadPassword, setShowDeleteAuditLeadPassword] = useState(false);
  const [resetStatsModal, setResetStatsModal] = useState({ open: false, submitting: false });
  const [auditViewerModal, setAuditViewerModal] = useState({ open: false, audit: null });
  const [auditRichEditorState, setAuditRichEditorState] = useState({});
  const [auditViewerDraft, setAuditViewerDraft] = useState(null);
  const [auditViewerDirty, setAuditViewerDirty] = useState(false);
  const [auditViewerSaving, setAuditViewerSaving] = useState(false);
  const [auditViewerRichEditorState, setAuditViewerRichEditorState] = useState({});
  const [auditShieldActive, setAuditShieldActive] = useState(false);
  const [auditShieldTick, setAuditShieldTick] = useState(() => Date.now());
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const galleryEvidenceInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const watermarkTiles = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);

  const auditShieldWatermark = useMemo(() => {
    const stamp = formatDateTime(new Date(auditShieldTick).toISOString());
    return `${currentUser?.name || "Usuario"} · ${stamp} · Confidencial`;
  }, [auditShieldTick, currentUser?.name]);

  function openAuditViewer(audit) {
    prewarmAuditEvidenceMedia(audit?.evidences || [], 30);
    setAuditViewerModal({ open: true, audit });
  }

  const resolvedTemplates = useMemo(() => {
    const normalizedTemplates = (Array.isArray(processAuditTemplates) ? processAuditTemplates : []).map((template) => ({
      ...template,
      isFallback: false,
      questions: (template.questions || []).map((question) => buildQuestionDraft(question)),
    }));
    if (normalizedTemplates.length > 0) {
      return normalizedTemplates;
    }
    return _buildFallbackTemplates();
  }, [processAuditTemplates]);

  const areaOptions = useMemo(() => {
    return Array.from(new Set((Array.isArray(rootAreaOptions) ? rootAreaOptions : []).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [rootAreaOptions]);

  const processOptionsForArea = useMemo(() => {
    const byArea = new Map();
    resolvedTemplates.forEach((item) => {
      const area = String(item.area || "").trim();
      const process = String(item.process || "").trim();
      if (!area || !process) return;
      if (!byArea.has(area)) byArea.set(area, new Set());
      byArea.get(area).add(process);
    });

    return Object.fromEntries(Array.from(byArea.entries()).map(([area, values]) => [area, Array.from(values).sort((a, b) => a.localeCompare(b, "es-MX"))]));
  }, [resolvedTemplates]);

  const templateCandidates = useMemo(() => {
    return resolvedTemplates.filter((entry) => {
      if (!newAuditProcess) return true;
      return entry.process.toLowerCase().includes(newAuditProcess.toLowerCase());
    });
  }, [newAuditProcess, resolvedTemplates]);

  const filteredTemplateLibrary = useMemo(() => {
    return resolvedTemplates.filter((template) => {
      if (templateFilterArea && template.area !== templateFilterArea) return false;
      if (templateFilterProcess && !template.process.toLowerCase().includes(templateFilterProcess.toLowerCase())) return false;
      return true;
    });
  }, [resolvedTemplates, templateFilterArea, templateFilterProcess]);

  const sortedAudits = useMemo(
    () => [...(processAudits || [])].sort((left, right) => Date.parse(right.startedAt || right.updatedAt || "") - Date.parse(left.startedAt || left.updatedAt || "")),
    [processAudits],
  );

  const openAudits = useMemo(
    () => sortedAudits.filter((entry) => entry.status !== "closed"),
    [sortedAudits],
  );

  const actionableAudits = useMemo(
    () => sortedAudits.filter((entry) => entry.status !== "closed" || normalizeLifecycleStatus(entry.lifecycleStatus) !== "closed"),
    [sortedAudits],
  );

  const closedAudits = useMemo(
    () => sortedAudits.filter((entry) => entry.status === "closed" && normalizeLifecycleStatus(entry.lifecycleStatus) === "closed"),
    [sortedAudits],
  );

  const selectedAudit = useMemo(
    () => actionableAudits.find((entry) => entry.id === selectedAuditId) || actionableAudits[0] || null,
    [actionableAudits, selectedAuditId],
  );

  const visibleAuditEvidences = useMemo(() => {
    if (!auditDraft) return [];
    const localPending = pendingEvidences.filter((item) => item.auditId === auditDraft.id);
    return localPending.concat(auditDraft.evidences || []);
  }, [auditDraft, pendingEvidences]);

  const dashboardStats = useMemo(() => {
    const total = sortedAudits.length;
    const closed = sortedAudits.filter((entry) => entry.status === "closed").length;
    const open = total - closed;
    const avgDuration = total > 0
      ? Math.round(sortedAudits.reduce((sum, entry) => sum + getAuditDurationSeconds(entry), 0) / total)
      : 0;

    const byAreaMap = new Map();
    sortedAudits.forEach((entry) => {
      const area = entry.area || "Sin área";
      byAreaMap.set(area, (byAreaMap.get(area) || 0) + 1);
    });

    const severity = { red: 0, yellow: 0, green: 0 };
    const criticalAreaMap = new Map();
    sortedAudits.forEach((entry) => {
      const color = entry?.scoring?.global?.color || buildAuditScoring(entry?.questions || []).global.color;
      if (color === "red") {
        severity.red += 1;
      } else if (color === "yellow") {
        severity.yellow += 1;
      } else {
        severity.green += 1;
      }
      const area = entry.area || "Sin área";
      if (color === "red" || color === "yellow") {
        criticalAreaMap.set(area, (criticalAreaMap.get(area) || 0) + 1);
      }
    });

    return {
      total,
      closed,
      open,
      avgDuration,
      severity,
      criticalAreas: Array.from(criticalAreaMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      byArea: Array.from(byAreaMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value),
    };
  }, [sortedAudits]);

  const quickStats = useMemo(() => {
    return [
      buildQuickStat("Plantillas", resolvedTemplates.length),
      buildQuickStat("Procesos", newAuditArea ? (processOptionsForArea[newAuditArea] || []).length : Object.keys(processOptionsForArea).length),
      buildQuickStat("Abiertas", openAudits.length),
    ];
  }, [newAuditArea, openAudits.length, processOptionsForArea, resolvedTemplates.length]);

  const subAreaOptionsForSelectedArea = useMemo(() => {
    if (!newAuditArea) return [];
    const values = new Set();
    sortedAudits.forEach((audit) => {
      if (String(audit?.area || "").trim() !== String(newAuditArea || "").trim()) return;
      const subArea = String(audit?.subArea || "").trim();
      if (subArea) values.add(subArea);
    });
    resolvedTemplates.forEach((template) => {
      if (String(template?.area || "").trim() !== String(newAuditArea || "").trim()) return;
      const subArea = String(template?.subArea || "").trim();
      if (subArea) values.add(subArea);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [newAuditArea, resolvedTemplates, sortedAudits]);

  const activeAuditQuestions = useMemo(() => {
    if (!auditDraft) return [];
    const allQuestions = Array.isArray(auditDraft.questions) ? auditDraft.questions : [];
    return allQuestions.filter((question) => isQuestionVisible(question, allQuestions));
  }, [auditDraft]);

  const auditScoring = useMemo(() => buildAuditScoring(activeAuditQuestions), [activeAuditQuestions]);

  const detectedProblems = useMemo(() => buildDetectedProblems(activeAuditQuestions), [activeAuditQuestions]);

  const detectedProblemsById = useMemo(() => {
    return new Set(detectedProblems.map((problem) => String(problem.id || "").trim()).filter(Boolean));
  }, [detectedProblems]);

  const proposalCoverage = useMemo(() => {
    const proposals = Array.isArray(auditDraft?.proposals) ? auditDraft.proposals : [];
    const linked = proposals.filter((proposal) => detectedProblemsById.has(String(proposal.problemId || "").trim()));
    return {
      totalProblems: detectedProblems.length,
      linkedProposals: linked.length,
      withoutProposal: Math.max(0, detectedProblems.length - linked.length),
    };
  }, [auditDraft?.proposals, detectedProblems.length, detectedProblemsById]);

  const isAuditClosed = auditDraft?.status === "closed";
  const lifecycleStatus = normalizeLifecycleStatus(auditDraft?.lifecycleStatus || "pending");
  const canWorkProblemsStep = isAuditClosed && ["in_review", "proposal_sent", "accepted", "in_implementation", "in_validation", "closed"].includes(lifecycleStatus);
  const canWorkProposalsStep = isAuditClosed && ["proposal_sent", "accepted", "in_implementation", "in_validation", "closed"].includes(lifecycleStatus);
  const canWorkFollowUpStep = isAuditClosed && ["in_implementation", "in_validation", "closed"].includes(lifecycleStatus);

  async function handleAdvancePostCloseStep(nextLifecycleStatus) {
    if (!canManageAudits || !auditDraft) return;
    try {
      await updateProcessAudit(auditDraft.id, {
        lifecycleStatus: normalizeLifecycleStatus(nextLifecycleStatus),
      });
      pushAppToast("Paso actualizado.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo avanzar el paso.", "danger");
    }
  }

  function handleExportAuditCopmec(audit = auditDraft) {
    if (!audit) return;
    const data = JSON.stringify({ version: "1.0", type: "process-audit", exportedAt: new Date().toISOString(), audit }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = String(audit.subArea || audit.area || "auditoria").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.download = `auditoria_${safeName}_${audit.id.slice(-6)}.copmec`;
    link.click();
    URL.revokeObjectURL(url);
    pushAppToast("Archivo .copmec exportado.", "success");
  }

  async function handleExportAuditPdf(audit = auditDraft) {
    if (!audit || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const brandColor = [3, 33, 33];
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(...brandColor);
      pdf.rect(0, 0, pageWidth, 54, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(15);
      pdf.text("COPMEC — Auditoría de Proceso", 36, 32);
      pdf.setFontSize(9);
      pdf.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 36, 46);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.text(`Área: ${audit.area || "-"}  ·  Proceso: ${audit.process || "-"}  ·  Subárea: ${audit.subArea || "-"}`, 36, 74);
      pdf.setFontSize(9);
      pdf.text(`Auditor: ${audit.auditorName || "-"}  ·  Inicio: ${formatDateTime(audit.startedAt)}  ·  Cierre: ${audit.closedAt ? formatDateTime(audit.closedAt) : "-"}`, 36, 88);
      const lcLabel = PROCESS_AUDIT_STATUS_OPTIONS.find((opt) => opt.value === normalizeLifecycleStatus(audit.lifecycleStatus))?.label || "-";
      pdf.text(`Ciclo: ${lcLabel}  ·  Duración: ${formatDuration(getAuditDurationSeconds(audit))}`, 36, 102);

      const problems = buildDetectedProblems(audit.questions || []);
      const scoring = buildAuditScoring(audit.questions || []);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("Semáforo", 36, 120);
      pdf.setFont(undefined, "normal");
      pdf.text(`Global: ${scoring.global.scorePercent}% OK  ·  🔴 ${scoring.global.red}  🟡 ${scoring.global.yellow}  🟢 ${scoring.global.green}`, 36, 133);

      let yPos = 148;

      // Preguntas
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");
      pdf.text("Preguntas capturadas", 36, yPos);
      yPos += 6;
      pdf.setFont(undefined, "normal");
      const activeQs = (audit.questions || []).filter((q) => q?.isActive !== false);
      const qBody = activeQs.map((q) => {
        let answerStr = "";
        if (q.type === "yesno") answerStr = q.answer === true ? "Sí" : q.answer === false ? "No" : "-";
        else if (q.type === "multi") answerStr = Array.isArray(q.answer) ? q.answer.join(", ") : "-";
        else answerStr = q.answer != null ? String(q.answer) : "-";
        const problem = resolveQuestionHasProblem(q);
        return [q.text || "-", answerStr, problem ? "Sí" : "No", q.observations || ""];
      });
      autoTable(pdf, {
        startY: yPos,
        head: [["Pregunta", "Respuesta", "Problema", "Observaciones"]],
        body: qBody,
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: brandColor, textColor: [255, 255, 255] },
        columnStyles: { 0: { cellWidth: 200 }, 3: { cellWidth: 120 } },
        theme: "grid",
        margin: { left: 36, right: 36 },
      });
      yPos = pdf.lastAutoTable.finalY + 14;

      // Problemas detectados
      if (problems.length) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text(`Problemas detectados (${problems.length})`, 36, yPos);
        yPos += 6;
        pdf.setFont(undefined, "normal");
        const probBody = problems.map((p) => [p.problem, p.category, p.impactLevel === "high" ? "Alto" : p.impactLevel === "medium" ? "Medio" : "Bajo", p.observations || ""]);
        autoTable(pdf, {
          startY: yPos,
          head: [["Problema", "Categoría", "Impacto", "Observaciones"]],
          body: probBody,
          styles: { fontSize: 7, cellPadding: 3 },
          headStyles: { fillColor: [150, 0, 0], textColor: [255, 255, 255] },
          theme: "grid",
          margin: { left: 36, right: 36 },
        });
        yPos = pdf.lastAutoTable.finalY + 14;
      }

      // Propuestas
      const proposals = Array.isArray(audit.proposals) ? audit.proposals : [];
      if (proposals.length) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text(`Propuestas de mejora (${proposals.length})`, 36, yPos);
        yPos += 6;
        pdf.setFont(undefined, "normal");
        const propBody = proposals.map((p) => [
          p.problem || "-",
          PROPOSAL_TYPE_OPTIONS.find((o) => o.value === p.type)?.label || p.type || "-",
          p.rootCause ? String(p.rootCause).replace(/<[^>]+>/g, " ").trim() : "-",
          p.proposal ? String(p.proposal).replace(/<[^>]+>/g, " ").trim() : "-",
          p.responsible || "-",
          EFFORT_OPTIONS.find((o) => o.value === p.effort)?.label || p.effort || "-",
        ]);
        autoTable(pdf, {
          startY: yPos,
          head: [["Problema", "Tipo", "Causa raíz", "Propuesta", "Responsable", "Esfuerzo"]],
          body: propBody,
          styles: { fontSize: 7, cellPadding: 3 },
          headStyles: { fillColor: [0, 80, 80], textColor: [255, 255, 255] },
          columnStyles: { 2: { cellWidth: 80 }, 3: { cellWidth: 90 } },
          theme: "grid",
          margin: { left: 36, right: 36 },
        });
        yPos = pdf.lastAutoTable.finalY + 14;
      }

      // Plan de implementación
      const plan = audit.implementationPlan || {};
      if (plan.processDefinition || plan.instructions || plan.deadline) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text("Plan de implementación", 36, yPos);
        yPos += 6;
        pdf.setFont(undefined, "normal");
        const planBody = [
          ["Fecha límite", plan.deadline || "-"],
          ["Nuevo proceso", plan.processDefinition ? String(plan.processDefinition).replace(/<[^>]+>/g, " ").trim() : "-"],
          ["Instrucciones", plan.instructions ? String(plan.instructions).replace(/<[^>]+>/g, " ").trim() : "-"],
        ];
        autoTable(pdf, {
          startY: yPos,
          body: planBody,
          styles: { fontSize: 7, cellPadding: 3 },
          theme: "grid",
          margin: { left: 36, right: 36 },
        });
        yPos = pdf.lastAutoTable.finalY + 14;
      }

      const safeName = String(audit.subArea || audit.area || "auditoria").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      pdf.save(`auditoria_${safeName}_${audit.id.slice(-6)}.pdf`);
      pushAppToast("PDF exportado correctamente.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo exportar el PDF.", "danger");
    } finally {
      setIsExportingPdf(false);
    }
  }

  useEffect(() => {
    if (!selectedAudit) {
      setAuditDraft(null);
      setSelectedAuditId("");
      return;
    }

    setSelectedAuditId(selectedAudit.id);
    setAuditDraft((current) => {
      if (current?.id === selectedAudit.id) {
        return {
          ...current,
          status: selectedAudit.status,
          lifecycleStatus: selectedAudit.lifecycleStatus || current.lifecycleStatus || "pending",
          closedAt: selectedAudit.closedAt,
          updatedAt: selectedAudit.updatedAt,
          reAuditAt: selectedAudit.reAuditAt || current.reAuditAt || "",
          executiveSummary: selectedAudit.executiveSummary || current.executiveSummary || "",
          proposals: Array.isArray(selectedAudit.proposals) ? selectedAudit.proposals : (current.proposals || []),
          followUp: Array.isArray(selectedAudit.followUp) ? selectedAudit.followUp : (current.followUp || []),
          implementationPlan: selectedAudit.implementationPlan || current.implementationPlan || {},
          boardLinks: Array.isArray(selectedAudit.boardLinks) ? selectedAudit.boardLinks : (current.boardLinks || []),
          evidences: [...(selectedAudit.evidences || [])],
          notes: current.notes,
          questions: current.questions,
        };
      }
      return {
        ...selectedAudit,
        questions: (selectedAudit.questions || []).map((question) => ({ ...question })),
        evidences: [...(selectedAudit.evidences || [])],
      };
    });
    setAuditQuestionsDraft((current) => {
      if (current && auditDraft?.id === selectedAudit.id) return current;
      return {
        questions: (selectedAudit.questions || []).map((question) => buildQuestionDraft(question)),
      };
    });
    if (auditDraft?.id !== selectedAudit.id) {
      setIsAuditDirty(false);
      setAuditRichEditorState(buildRichEditorState(selectedAudit));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudit?.id, selectedAudit?.updatedAt, selectedAudit?.status, selectedAudit?.evidences?.length]);

  useEffect(() => {
    if (!auditViewerModal.open || !auditViewerModal.audit?.id) return;
    const nextAudit = sortedAudits.find((entry) => entry.id === auditViewerModal.audit.id) || null;
    if (nextAudit) {
      setAuditViewerModal((current) => ({ ...current, audit: nextAudit }));
    }
  }, [auditViewerModal.audit?.id, auditViewerModal.open, sortedAudits]);

  useEffect(() => {
    if (!auditViewerModal.open || !auditViewerModal.audit?.id) {
      setAuditViewerDraft(null);
      setAuditViewerDirty(false);
      setAuditViewerRichEditorState({});
      setAuditShieldActive(false);
      return;
    }
    if (auditViewerDirty && auditViewerDraft?.id === auditViewerModal.audit.id) return;
    prewarmAuditEvidenceMedia(auditViewerModal.audit.evidences || [], 30);
    setAuditViewerDraft(cloneAuditRecord(auditViewerModal.audit));
    setAuditViewerRichEditorState(buildRichEditorState(auditViewerModal.audit));
    setAuditViewerDirty(false);
  }, [auditViewerDirty, auditViewerDraft?.id, auditViewerModal.audit, auditViewerModal.open]);

  useEffect(() => {
    if (!auditViewerModal.open) return undefined;

    const tickTimer = globalThis.setInterval(() => setAuditShieldTick(Date.now()), 30000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAuditShieldActive(true);
        return;
      }
      setAuditShieldActive(false);
    };

    const handleWindowBlur = () => setAuditShieldActive(true);
    const handleWindowFocus = () => setAuditShieldActive(false);

    const handleKeyUp = (event) => {
      if (event.key !== "PrintScreen") return;
      setAuditShieldActive(true);
      pushAppToast("Captura detectada. Contenido protegido temporalmente.", "warning");
      globalThis.setTimeout(() => {
        if (!document.hidden) setAuditShieldActive(false);
      }, 1400);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    globalThis.addEventListener("blur", handleWindowBlur);
    globalThis.addEventListener("focus", handleWindowFocus);
    globalThis.addEventListener("keyup", handleKeyUp);

    return () => {
      globalThis.clearInterval(tickTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("blur", handleWindowBlur);
      globalThis.removeEventListener("focus", handleWindowFocus);
      globalThis.removeEventListener("keyup", handleKeyUp);
    };
  }, [auditViewerModal.open, pushAppToast]);

  useEffect(() => {
    if (newAuditTemplateId || !templateCandidates.length) return;
    setNewAuditTemplateId(templateCandidates[0].id);
  }, [newAuditTemplateId, templateCandidates]);

  useEffect(() => {
    if (!auditDraft || !isAuditDirty || !canManageAudits) return undefined;

    const timer = setTimeout(async () => {
      try {
        await updateProcessAudit(auditDraft.id, {
          area: auditDraft.area,
          subArea: auditDraft.subArea || "",
          process: auditDraft.process,
          notes: auditDraft.notes || "",
          status: auditDraft.status,
          lifecycleStatus: auditDraft.lifecycleStatus || "pending",
          reAuditAt: auditDraft.reAuditAt || "",
          executiveSummary: auditDraft.executiveSummary || "",
          proposals: auditDraft.proposals || [],
          followUp: auditDraft.followUp || [],
          implementationPlan: auditDraft.implementationPlan || {},
          boardLinks: auditDraft.boardLinks || [],
          questions: normalizeQuestionsForSave(auditDraft.questions || []),
        });
        setIsAuditDirty(false);
      } catch {
        // La auditoría se mantiene editable localmente si falla el autosave.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [auditDraft, canManageAudits, isAuditDirty, updateProcessAudit]);

  function updateAuditAnswer(questionId, nextAnswer) {
    setAuditDraft((current) => ({
      ...current,
      questions: current.questions.map((item) => (item.id === questionId ? { ...item, answer: nextAnswer } : item)),
    }));
    setIsAuditDirty(true);
  }

  function updateAuditNotes(nextNotes) {
    setAuditDraft((current) => ({ ...current, notes: nextNotes }));
    setIsAuditDirty(true);
  }

  function updateViewerAnswer(questionId, nextAnswer) {
    setAuditViewerDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((item) => (item.id === questionId ? { ...item, answer: nextAnswer } : item)),
      };
    });
    setAuditViewerDirty(true);
  }

  function updateViewerNotes(nextNotes) {
    setAuditViewerDraft((current) => (current ? { ...current, notes: nextNotes } : current));
    setAuditViewerDirty(true);
  }

  async function persistAuditChanges(targetAudit, successMessage) {
    if (!targetAudit || !canManageAudits) return false;
    await updateProcessAudit(targetAudit.id, {
      area: targetAudit.area,
      subArea: targetAudit.subArea || "",
      process: targetAudit.process,
      notes: targetAudit.notes || "",
      status: targetAudit.status,
      lifecycleStatus: targetAudit.lifecycleStatus || "pending",
      reAuditAt: targetAudit.reAuditAt || "",
      executiveSummary: targetAudit.executiveSummary || "",
      proposals: targetAudit.proposals || [],
      followUp: targetAudit.followUp || [],
      implementationPlan: targetAudit.implementationPlan || {},
      boardLinks: targetAudit.boardLinks || [],
      questions: normalizeQuestionsForSave(targetAudit.questions || []),
    });
    if (successMessage) pushAppToast(successMessage, "success");
    return true;
  }

  async function handleSaveActiveTextField(fieldKey, successMessage) {
    if (!auditDraft) return;
    try {
      await persistAuditChanges(auditDraft, successMessage);
      setIsAuditDirty(false);
      setAuditRichEditorState((current) => ({ ...current, [fieldKey]: false }));
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la respuesta.", "danger");
    }
  }

  async function handleSaveViewerTextField(fieldKey, successMessage) {
    if (!auditViewerDraft) return;
    setAuditViewerSaving(true);
    try {
      const saved = await persistAuditChanges(auditViewerDraft, successMessage);
      if (!saved) return;
      setAuditViewerDirty(false);
      setAuditViewerRichEditorState((current) => ({ ...current, [fieldKey]: false }));
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la respuesta.", "danger");
    } finally {
      setAuditViewerSaving(false);
    }
  }

  async function handleSaveViewerBinaryAnswer(questionId, nextAnswer) {
    if (!auditViewerDraft) return;
    const nextDraft = {
      ...auditViewerDraft,
      questions: auditViewerDraft.questions.map((item) => (item.id === questionId ? { ...item, answer: nextAnswer } : item)),
    };
    setAuditViewerDraft(nextDraft);
    setAuditViewerDirty(true);
    setAuditViewerSaving(true);
    try {
      const saved = await persistAuditChanges(nextDraft, "Respuesta guardada.");
      if (saved) setAuditViewerDirty(false);
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la respuesta.", "danger");
    } finally {
      setAuditViewerSaving(false);
    }
  }

  function openDeleteAuditModal(audit) {
    setShowDeleteAuditLeadPassword(false);
    setDeleteAuditModal({
      open: true,
      auditId: audit?.id || "",
      auditLabel: audit ? `${audit.area} · ${audit.process}` : "",
      leadPassword: "",
      submitting: false,
    });
  }

  function closeDeleteAuditModal() {
    setShowDeleteAuditLeadPassword(false);
    setDeleteAuditModal({
      open: false,
      auditId: "",
      auditLabel: "",
      leadPassword: "",
      submitting: false,
    });
  }

  async function confirmDeleteAudit() {
    if (!deleteAuditModal.auditId || !deleteAuditModal.leadPassword.trim()) {
      pushAppToast("Captura la contraseña de un Lead.", "warning");
      return;
    }

    setDeleteAuditModal((current) => ({ ...current, submitting: true }));
    try {
      await deleteProcessAudit(deleteAuditModal.auditId, deleteAuditModal.leadPassword.trim());
      if (selectedAuditId === deleteAuditModal.auditId) {
        setSelectedAuditId("");
        setAuditEditorOpen(false);
      }
      setActiveTab("history");
      closeDeleteAuditModal();
      pushAppToast("Auditoría eliminada.", "success");
    } catch (error) {
      setDeleteAuditModal((current) => ({ ...current, submitting: false }));
      pushAppToast(error?.message || "No se pudo eliminar la auditoría.", "danger");
    }
  }

  async function handleSaveTemplate() {
    if (!canManageTemplates) return;

    const normalizedQuestions = normalizeQuestionsForSave(templateDraft.questions || []);
    if (!templateDraft.area.trim() || !templateDraft.process.trim() || !normalizedQuestions.length) {
      pushAppToast("Completa área, proceso y al menos una pregunta.", "warning");
      return;
    }

    try {
      await upsertProcessAuditTemplate({
        id: templateDraft.id || undefined,
        area: templateDraft.area.trim(),
        process: templateDraft.process.trim(),
        questions: normalizedQuestions,
      });
      setTemplateManagerOpen(false);
      setTemplateDraft(emptyTemplateDraft(templateDraft.area.trim(), ""));
      pushAppToast("Plantilla guardada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la plantilla.", "danger");
    }
  }

  function pullTemplateToArea(template, targetArea) {
    const resolvedArea = String(targetArea || "").trim() || String(template?.area || "").trim();
    if (!template || !resolvedArea) return;
    setTemplateDraft({
      ...cloneTemplateIntoDraft(template, resolvedArea, template.process),
      id: "",
      area: resolvedArea,
      isFallback: false,
    });
    setTemplateManagerTab("editor");
  }

  async function handleDeleteTemplate(template) {
    if (!canManageTemplates || !template?.id || template.isFallback) return;
    try {
      await deleteProcessAuditTemplate(template.id);
      if (templateDraft.id === template.id) {
        setTemplateDraft(emptyTemplateDraft(template.area, template.process));
      }
      pushAppToast("Plantilla eliminada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo eliminar la plantilla.", "danger");
    }
  }

  async function handleCreateAudit() {
    if (!canManageAudits) return;
    if (!newAuditArea.trim() || !newAuditProcess.trim()) {
      pushAppToast("Selecciona área y proceso.", "warning");
      return;
    }

    const template = resolvedTemplates.find((entry) => entry.id === newAuditTemplateId) || null;

    try {
      const createdAuditId = await createProcessAudit({
        area: newAuditArea.trim(),
        subArea: newAuditSubArea.trim(),
        process: newAuditProcess.trim(),
        templateId: template && !template.isFallback ? template.id : null,
        questions: template
          ? normalizeQuestionsForSave(template.questions || []).map(({ answer: _answer, ...question }) => question)
          : [{ type: "yesno", text: "¿Cumple con el estándar definido?", required: true }],
      });
      if (createdAuditId) setSelectedAuditId(createdAuditId);
      pushAppToast("Auditoría creada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo crear la auditoría.", "danger");
    }
  }

  async function handleCloseAudit() {
    if (!canManageAudits || !auditDraft) return;
    try {
      await updateProcessAudit(auditDraft.id, {
        status: "closed",
        lifecycleStatus: "in_review",
        notes: auditDraft.notes || "",
        questions: normalizeQuestionsForSave(auditDraft.questions || []),
      });
      setAuditEditorOpen(false);
      setAuditQuestionsDraft(null);
      setSelectedAuditId(auditDraft.id);
      setActiveTab("capture");
      pushAppToast("Paso 1 completado. Continúa con problemas, propuestas y seguimiento.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo cerrar la auditoría.", "danger");
    }
  }

  async function uploadEvidenceFiles(files = []) {
    const normalizedFiles = Array.from(files).filter(Boolean);
    if (!normalizedFiles.length || !auditDraft || !canManageAudits) return;
    setUploadingEvidence(true);

    try {
      for (const file of normalizedFiles) {
        const previewId = `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const previewUrl = URL.createObjectURL(file);
        setPendingEvidences((current) => [{
          id: previewId,
          auditId: auditDraft.id,
          url: previewUrl,
          thumbnailUrl: previewUrl,
          name: file.name,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
          uploadedByName: currentUser?.name || "",
          isPending: true,
        }, ...current]);

        try {
          const uploaded = await uploadFileToCloudinary(file);
          await addProcessAuditEvidence(auditDraft.id, {
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl,
            name: uploaded.originalName || file.name,
            mimeType: uploaded.fileMimeType || file.type,
          });
          pushAppToast("Evidencia agregada.", "success");
        } finally {
          URL.revokeObjectURL(previewUrl);
          setPendingEvidences((current) => current.filter((item) => item.id !== previewId));
        }
      }
    } catch (error) {
      pushAppToast(error?.message || "No se pudo subir la evidencia.", "danger");
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function handleUploadEvidence(event) {
    const files = Array.from(event.target.files || []);
    await uploadEvidenceFiles(files);
    event.target.value = "";
  }

  async function handleCaptureEvidence(file) {
    await uploadEvidenceFiles([file]);
    setCameraModalOpen(false);
  }

  function openCameraCapture() {
    if (!auditDraft || !canManageAudits || auditDraft.status === "closed") return;
    if (navigator.mediaDevices?.getUserMedia) {
      setCameraModalOpen(true);
      return;
    }
    mobileCameraInputRef.current?.click();
  }

  async function handleDeleteEvidence(evidenceId) {
    if (!auditDraft?.id || !evidenceId || !canManageAudits || auditDraft.status === "closed") return;
    try {
      await removeProcessAuditEvidence(auditDraft.id, evidenceId);
      pushAppToast("Evidencia eliminada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo eliminar la evidencia.", "danger");
    }
  }

  function applyAuditQuestionChanges() {
    if (!auditDraft || !auditQuestionsDraft) return;
    const nextQuestions = normalizeQuestionsForSave(auditQuestionsDraft.questions || []);
    if (!nextQuestions.length) {
      pushAppToast("La auditoría necesita al menos una pregunta.", "warning");
      return;
    }
    setAuditDraft((current) => ({ ...current, questions: nextQuestions }));
    setIsAuditDirty(true);
    setAuditEditorOpen(false);
  }

  async function handleResetStats() {
    setResetStatsModal((s) => ({ ...s, submitting: true }));
    try {
      await resetProcessAuditStats();
      setResetStatsModal({ open: false, submitting: false });
      pushAppToast?.({ type: "success", message: "Contadores del dashboard reiniciados." });
    } catch (err) {
      pushAppToast?.({ type: "error", message: err?.message || "No fue posible reiniciar los contadores." });
      setResetStatsModal((s) => ({ ...s, submitting: false }));
    }
  }

  return (
    <section className="page-grid audit-shell">
      <article className="surface-card full-width table-card audit-topbar-card">
        <div className="card-header-row">
          <div>
            <h3>Auditorías</h3>
            <p>Captura rápida, plantillas editables y seguimiento por proceso.</p>
          </div>
          <div className="audit-topbar-actions">
            {quickStats.map((item) => (
              <span key={item.label} className="chip primary">{item.label}: {item.value}</span>
            ))}
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setTemplateFilterArea(newAuditArea || "");
                setTemplateFilterProcess(newAuditProcess || "");
                setTemplateDraft(emptyTemplateDraft(newAuditArea || "", newAuditProcess || ""));
                setTemplateManagerTab("library");
                setTemplateManagerOpen(true);
              }}
              disabled={!canManageTemplates}
            >
              <Settings size={15} /> Plantillas
            </button>
          </div>
        </div>
        <div className="tab-strip">
          <button type="button" className={activeTab === "capture" ? "tab active" : "tab"} onClick={() => setActiveTab("capture")}>Captura</button>
          <button type="button" className={activeTab === "history" ? "tab active" : "tab"} onClick={() => setActiveTab("history")}>Historial</button>
          <button type="button" className={activeTab === "dashboard" ? "tab active" : "tab"} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        </div>
      </article>

      {activeTab === "capture" ? (
        <>
          <article className="surface-card table-card full-width audit-surface-compact audit-capture-card">
            <div className="card-header-row">
              <div>
                <h3>Nueva auditoría</h3>
                <p>Área, proceso y plantilla.</p>
              </div>
              <ClipboardList size={18} />
            </div>
            <div className="audit-form-grid audit-form-grid-capture">
              <label className="app-modal-field">
                <span>Área</span>
                <select
                  value={newAuditArea}
                  onChange={(event) => {
                    setNewAuditArea(event.target.value);
                    setNewAuditSubArea("");
                    setNewAuditProcess("");
                    setNewAuditTemplateId("");
                  }}
                >
                  <option value="">Selecciona</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <label className="app-modal-field">
                <span>Subárea (opcional)</span>
                <input
                  list="audit-subarea-options"
                  value={newAuditSubArea}
                  onChange={(event) => setNewAuditSubArea(event.target.value)}
                  placeholder="Ej. TURNO MAÑANA"
                />
                <datalist id="audit-subarea-options">
                  {subAreaOptionsForSelectedArea.map((subArea) => <option key={subArea} value={subArea} />)}
                </datalist>
              </label>
              <label className="app-modal-field">
                <span>Proceso</span>
                <input
                  list="audit-process-options"
                  value={newAuditProcess}
                  onChange={(event) => {
                    setNewAuditProcess(event.target.value);
                    setNewAuditTemplateId("");
                  }}
                  placeholder="Ej. Revisión"
                />
                <datalist id="audit-process-options">
                  {(processOptionsForArea[newAuditArea] || []).map((process) => <option key={process} value={process} />)}
                </datalist>
              </label>
              <label className="app-modal-field">
                <span>Plantilla</span>
                <select value={newAuditTemplateId} onChange={(event) => setNewAuditTemplateId(event.target.value)}>
                  <option value="">Manual</option>
                  {templateCandidates.map((template) => (
                    <option key={template.id} value={template.id}>{template.area} · {template.process} · {template.questions?.length || 0} preg.</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="audit-inline-actions">
              <button type="button" className="primary-button" onClick={handleCreateAudit} disabled={!canManageAudits}>
                <Plus size={16} /> Iniciar
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setTemplateFilterArea(newAuditArea || "");
                  setTemplateFilterProcess(newAuditProcess || "");
                  setTemplateManagerTab("library");
                  setTemplateManagerOpen(true);
                }}
                disabled={!canManageTemplates}
              >
                <Settings size={15} /> Editar plantillas
              </button>
            </div>
          </article>

          <article className="surface-card table-card full-width audit-surface-compact">
            <div className="card-header-row">
              <div>
                <h3>Auditoría activa</h3>
                <p>Guardado automático en la auditoría abierta.</p>
              </div>
              {auditDraft ? (
                <div className="audit-topbar-actions">
                  <span className={auditDraft.status === "closed" ? "chip success" : "chip warning"}>{auditDraft.status === "closed" ? "Cerrada" : "Abierta"}</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      const quickQuestion = buildQuestionDraft({ type: "yesno", text: "", category: "General" });
                      setAuditDraft((current) => ({
                        ...current,
                        questions: [...(current?.questions || []), quickQuestion],
                      }));
                      setAuditQuestionsDraft((current) => ({
                        questions: [...(current?.questions || []), quickQuestion],
                      }));
                      setIsAuditDirty(true);
                      setAuditEditorOpen(true);
                    }}
                    disabled={!canManageAudits}
                  >
                    <Plus size={15} /> Agregar pregunta
                  </button>
                  <button type="button" className="icon-button" onClick={() => setAuditEditorOpen(true)} disabled={!canManageAudits}>
                    <Settings size={15} /> Preguntas
                  </button>
                </div>
              ) : null}
            </div>

            {!auditDraft ? (
              <p className="subtle-line">No hay auditorías registradas todavía.</p>
            ) : (
              <>
                <div className="audit-active-tabs" role="tablist" aria-label="Auditorías activas">
                  {openAudits.map((audit) => (
                    <button
                      key={audit.id}
                      type="button"
                      className={audit.id === auditDraft.id ? "audit-active-tab active" : "audit-active-tab"}
                      onClick={() => setSelectedAuditId(audit.id)}
                    >
                      <span>{audit.area} · {audit.process}</span>
                      <small>{(audit.evidences || []).length} ev.</small>
                    </button>
                  ))}
                </div>

                <div className="audit-active-meta-grid">
                  <article className="surface-card audit-mini-stat">
                    <p>Área</p>
                    <strong>{auditDraft.area}</strong>
                  </article>
                  <article className="surface-card audit-mini-stat">
                    <p>Subárea</p>
                    <strong>{auditDraft.subArea || "-"}</strong>
                  </article>
                  <article className="surface-card audit-mini-stat">
                    <p>Proceso</p>
                    <strong>{auditDraft.process}</strong>
                  </article>
                  <article className="surface-card audit-mini-stat">
                    <p>Preguntas</p>
                    <strong>{(auditDraft.questions || []).length}</strong>
                  </article>
                  <article className="surface-card audit-mini-stat">
                    <p>Evidencias</p>
                    <strong>{(auditDraft.evidences || []).length}</strong>
                  </article>
                </div>

                <div className="audit-active-subline subtle-line">
                  <label className="app-modal-field" style={{ maxWidth: "260px" }}>
                    <span>Estatus de seguimiento</span>
                    <select
                      value={auditDraft.lifecycleStatus || "pending"}
                      onChange={(event) => {
                        setAuditDraft((current) => ({ ...current, lifecycleStatus: normalizeLifecycleStatus(event.target.value) }));
                        setIsAuditDirty(true);
                      }}
                      disabled={!canManageAudits}
                    >
                      {PROCESS_AUDIT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field" style={{ maxWidth: "220px" }}>
                    <span>Fecha re-auditar</span>
                    <input
                      type="date"
                      value={auditDraft.reAuditAt || ""}
                      onChange={(event) => {
                        setAuditDraft((current) => ({ ...current, reAuditAt: event.target.value }));
                        setIsAuditDirty(true);
                      }}
                      disabled={!canManageAudits}
                    />
                  </label>
                </div>

                <div className="audit-active-subline subtle-line">
                  <span>Inicio: {formatDateTime(auditDraft.startedAt)}</span>
                  <span>Auditor: {auditDraft.auditorName || currentUser?.name || "Sin auditor"}</span>
                  <span>Duración: {formatDuration(getAuditDurationSeconds(auditDraft))}</span>
                </div>

                <RichTextResponseField
                  label="Notas"
                  value={auditDraft.notes || ""}
                  placeholder="Observación general"
                  canEdit={canManageAudits}
                  isEditing={Boolean(auditRichEditorState.notes)}
                  onChange={updateAuditNotes}
                  onEdit={() => setAuditRichEditorState((current) => ({ ...current, notes: true }))}
                  onSave={() => handleSaveActiveTextField("notes", "Notas guardadas.")}
                  saveLabel="Guardar notas"
                  editLabel="Editar notas"
                />

                <div className="audit-response-grid">
                  {activeAuditQuestions.map((question, index) => (
                    <article
                      key={question.id}
                      className={question.type === "text" ? "surface-card audit-response-card audit-response-card-text" : "surface-card audit-response-card audit-response-card-yesno"}
                    >
                      <div className="audit-response-head">
                        <span className="chip">{index + 1}</span>
                        <strong>{question.text}</strong>
                        <span className="chip">{question.category || "General"}</span>
                        <span className={`chip ${resolveQuestionScoreColor(question) === "red" ? "danger" : resolveQuestionScoreColor(question) === "yellow" ? "warning" : "success"}`}>{getScoreChipLabel(resolveQuestionScoreColor(question))}</span>
                      </div>
                      {question.type === "yesno" ? (
                        <div className="audit-answer-toggle-row">
                          <button
                            type="button"
                            className={`switch-button ${question.answer === true ? "on" : ""}`}
                            onClick={() => updateAuditAnswer(question.id, question.answer === true ? false : true)}
                            disabled={!canManageAudits}
                            aria-pressed={question.answer === true}
                            aria-label="Alternar respuesta Sí/No"
                          >
                            <span className="switch-thumb" />
                          </button>
                          <strong>{question.answer === true ? "Sí" : "No"}</strong>
                        </div>
                      ) : null}

                      {question.type === "text" ? (
                        <RichTextResponseField
                          label="Respuesta"
                          value={String(question.answer || "")}
                          placeholder={question.placeholder || "Escribe aquí"}
                          canEdit={canManageAudits}
                          isEditing={Boolean(auditRichEditorState[question.id])}
                          onChange={(nextValue) => updateAuditAnswer(question.id, nextValue)}
                          onEdit={() => setAuditRichEditorState((current) => ({ ...current, [question.id]: true }))}
                          onSave={() => handleSaveActiveTextField(question.id, "Respuesta guardada.")}
                        />
                      ) : null}

                      {question.type === "number" ? (
                        <label className="app-modal-field">
                          <span>Respuesta numérica</span>
                          <input
                            type="number"
                            value={question.answer ?? ""}
                            onChange={(event) => updateAuditAnswer(question.id, event.target.value === "" ? null : Number(event.target.value))}
                            placeholder={question.placeholder || "Escribe un número"}
                            disabled={!canManageAudits}
                          />
                        </label>
                      ) : null}

                      {question.type === "scale" ? (
                        <label className="app-modal-field">
                          <span>Escala ({question.minValue ?? 1} - {question.maxValue ?? 5})</span>
                          <input
                            type="range"
                            min={question.minValue ?? 1}
                            max={question.maxValue ?? 5}
                            step={1}
                            value={question.answer ?? question.minValue ?? 1}
                            onChange={(event) => updateAuditAnswer(question.id, Number(event.target.value))}
                            disabled={!canManageAudits}
                          />
                          <strong>{question.answer ?? "Sin valor"}</strong>
                        </label>
                      ) : null}

                      {question.type === "date" ? (
                        <label className="app-modal-field">
                          <span>Fecha</span>
                          <input
                            type="date"
                            value={String(question.answer || "")}
                            onChange={(event) => updateAuditAnswer(question.id, event.target.value)}
                            disabled={!canManageAudits}
                          />
                        </label>
                      ) : null}

                      {question.type === "select" ? (
                        <label className="app-modal-field">
                          <span>Selección</span>
                          <select
                            value={String(question.answer || "")}
                            onChange={(event) => updateAuditAnswer(question.id, event.target.value)}
                            disabled={!canManageAudits}
                          >
                            <option value="">Selecciona</option>
                            {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                      ) : null}

                      {question.type === "multi" ? (
                        <div className="app-modal-field">
                          <span>Opciones múltiples</span>
                          <div className="audit-multi-options-grid">
                            {(question.options || []).map((option) => {
                              const currentAnswer = Array.isArray(question.answer) ? question.answer : [];
                              const checked = currentAnswer.includes(option);
                              return (
                                <label key={option} className="audit-multi-option-item">
                                  <button
                                    type="button"
                                    className={`switch-button ${checked ? "on" : ""}`}
                                    onClick={() => {
                                      const next = checked
                                        ? currentAnswer.filter((entry) => entry !== option)
                                        : [...currentAnswer, option];
                                      updateAuditAnswer(question.id, next);
                                    }}
                                    disabled={!canManageAudits}
                                    aria-pressed={checked}
                                    aria-label={`Alternar opción ${option}`}
                                  >
                                    <span className="switch-thumb" />
                                  </button>
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="audit-question-evaluation-grid">
                        <label className="app-modal-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                          <span>¿Se detecta problema?</span>
                          <button
                            type="button"
                            className={`switch-button ${question.issueDetected === true ? "on" : ""}`}
                            onClick={() => {
                              const issueDetected = question.issueDetected === true ? false : true;
                              setAuditDraft((current) => ({
                                ...current,
                                questions: current.questions.map((item) => (item.id === question.id ? { ...item, issueDetected } : item)),
                              }));
                              setIsAuditDirty(true);
                            }}
                            disabled={!canManageAudits}
                            aria-pressed={question.issueDetected === true}
                            aria-label="Alternar detección de problema"
                          >
                            <span className="switch-thumb" />
                          </button>
                          <strong>{question.issueDetected === true ? "Sí" : "No"}</strong>
                        </label>

                        <label className="app-modal-field">
                          <span>Impacto</span>
                          <select
                            value={question.impactLevel || "medium"}
                            onChange={(event) => {
                              setAuditDraft((current) => ({
                                ...current,
                                questions: current.questions.map((item) => (item.id === question.id ? { ...item, impactLevel: normalizeImpactLevel(event.target.value) } : item)),
                              }));
                              setIsAuditDirty(true);
                            }}
                            disabled={!canManageAudits}
                          >
                            <option value="high">Alto</option>
                            <option value="medium">Medio</option>
                            <option value="low">Bajo</option>
                          </select>
                        </label>
                      </div>

                      <RichTextResponseField
                        label="Observaciones"
                        value={String(question.observations || "")}
                        placeholder="Describe riesgo, causa o mejora observada"
                        canEdit={canManageAudits}
                        isEditing={Boolean(auditRichEditorState[`obs-${question.id}`])}
                        onChange={(nextValue) => {
                          setAuditDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) => (item.id === question.id ? { ...item, observations: nextValue } : item)),
                          }));
                          setIsAuditDirty(true);
                        }}
                        onEdit={() => setAuditRichEditorState((current) => ({ ...current, [`obs-${question.id}`]: true }))}
                        onSave={() => handleSaveActiveTextField(`obs-${question.id}`, "Observaciones guardadas.")}
                        saveLabel="Guardar observaciones"
                        editLabel="Editar observaciones"
                      />
                    </article>
                  ))}
                </div>

                {isAuditClosed ? (
                  <>
                    <section className="surface-card audit-analysis-card">
                      <div className="card-header-row">
                        <div>
                          <h3>Flujo posterior al cierre</h3>
                          <p>Paso actual: {PROCESS_AUDIT_STATUS_OPTIONS.find((option) => option.value === lifecycleStatus)?.label || "Pendiente"}</p>
                        </div>
                        <div className="audit-inline-actions">
                          <button type="button" className="icon-button" onClick={() => handleExportAuditPdf(auditDraft)} disabled={isExportingPdf} title="Exportar PDF">
                            <Upload size={14} /> {isExportingPdf ? "Generando…" : "PDF"}
                          </button>
                          <button type="button" className="icon-button" onClick={() => handleExportAuditCopmec(auditDraft)} title="Exportar .copmec">
                            <ExternalLink size={14} /> .copmec
                          </button>
                          {lifecycleStatus === "in_review" ? (
                            <button type="button" className="primary-button" onClick={() => handleAdvancePostCloseStep("proposal_sent")} disabled={!canManageAudits}>Continuar a Propuestas</button>
                          ) : null}
                          {lifecycleStatus === "proposal_sent" || lifecycleStatus === "accepted" ? (
                            <button type="button" className="primary-button" onClick={() => handleAdvancePostCloseStep("in_implementation")} disabled={!canManageAudits}>Continuar a Seguimiento</button>
                          ) : null}
                          {lifecycleStatus === "in_implementation" || lifecycleStatus === "in_validation" ? (
                            <button type="button" className="primary-button" onClick={() => handleAdvancePostCloseStep("closed")} disabled={!canManageAudits}>Cerrar ciclo completo</button>
                          ) : null}
                        </div>
                      </div>
                    </section>

                    {canWorkProblemsStep ? (
                    <section className="surface-card audit-analysis-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Problemas detectados</h3>
                      <p>Generado automáticamente desde respuestas e impacto.</p>
                    </div>
                    <span className="chip primary">{detectedProblems.length}</span>
                  </div>
                  {!detectedProblems.length ? <p className="subtle-line">Sin problemas críticos por ahora.</p> : null}
                  <div className="saved-board-list permissions-preset-list">
                    {detectedProblems.map((problem) => (
                      <article key={problem.id} className="surface-card audit-history-card">
                        <div className="card-header-row">
                          <strong>{problem.problem}</strong>
                          <span className={`chip ${problem.impactLevel === "high" ? "danger" : problem.impactLevel === "medium" ? "warning" : "success"}`}>
                            {problem.impactLevel === "high" ? "Alto" : problem.impactLevel === "medium" ? "Medio" : "Bajo"}
                          </span>
                        </div>
                        <p className="subtle-line">Categoría: {problem.category}</p>
                        {problem.observations ? <div className="audit-rich-response-display" dangerouslySetInnerHTML={{ __html: formatRichTextToHtml(problem.observations) }} /> : null}
                      </article>
                    ))}
                  </div>
                </section>
                    ) : null}

                    {canWorkProposalsStep ? (
                    <section className="surface-card audit-analysis-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Propuestas de mejora</h3>
                      <p>Causa raíz, solución y esfuerzo por problema.</p>
                    </div>
                    <div className="audit-inline-actions">
                      <span className="chip">Sin propuesta: {proposalCoverage.withoutProposal}</span>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          const firstUnlinked = detectedProblems.find((problem) => !(auditDraft.proposals || []).some((proposal) => proposal.problemId === problem.id));
                          const nextProposal = buildDefaultProposal(firstUnlinked || {});
                          setAuditDraft((current) => ({ ...current, proposals: [...(current.proposals || []), nextProposal] }));
                          setIsAuditDirty(true);
                        }}
                        disabled={!canManageAudits}
                      >
                        <Plus size={14} /> Agregar propuesta
                      </button>
                    </div>
                  </div>
                  <div className="saved-board-list permissions-preset-list">
                    {(auditDraft.proposals || []).map((proposal) => (
                      <article key={proposal.id} className="surface-card audit-history-card">
                        <div className="audit-form-grid">
                          <label className="app-modal-field audit-field-span-2">
                            <span>Problema asociado</span>
                            <select
                              value={proposal.problemId || ""}
                              onChange={(event) => {
                                const selected = detectedProblems.find((item) => item.id === event.target.value);
                                setAuditDraft((current) => ({
                                  ...current,
                                  proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? {
                                    ...item,
                                    problemId: event.target.value,
                                    problem: selected?.problem || item.problem || "",
                                  } : item)),
                                }));
                                setIsAuditDirty(true);
                              }}
                              disabled={!canManageAudits}
                            >
                              <option value="">Sin vínculo</option>
                              {detectedProblems.map((item) => <option key={item.id} value={item.id}>{item.problem}</option>)}
                            </select>
                          </label>
                          <label className="app-modal-field">
                            <span>Tipo</span>
                            <select
                              value={proposal.type || "improvement"}
                              onChange={(event) => {
                                setAuditDraft((current) => ({
                                  ...current,
                                  proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, type: event.target.value } : item)),
                                }));
                                setIsAuditDirty(true);
                              }}
                              disabled={!canManageAudits}
                            >
                              {PROPOSAL_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </label>
                          <label className="app-modal-field">
                            <span>Esfuerzo</span>
                            <select
                              value={proposal.effort || "medium"}
                              onChange={(event) => {
                                setAuditDraft((current) => ({
                                  ...current,
                                  proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, effort: event.target.value } : item)),
                                }));
                                setIsAuditDirty(true);
                              }}
                              disabled={!canManageAudits}
                            >
                              {EFFORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </label>
                          <label className="app-modal-field">
                            <span>Responsable</span>
                            <input
                              type="text"
                              value={proposal.responsible || ""}
                              placeholder="Nombre del responsable"
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setAuditDraft((current) => ({
                                  ...current,
                                  proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, responsible: nextValue } : item)),
                                }));
                                setIsAuditDirty(true);
                              }}
                              disabled={!canManageAudits}
                            />
                          </label>
                          <RichTextResponseField
                            label="Causa raíz"
                            value={proposal.rootCause || ""}
                            placeholder="Describe la causa raíz"
                            canEdit={canManageAudits}
                            isEditing={Boolean(auditRichEditorState[`proposal-root-${proposal.id}`])}
                            onChange={(nextValue) => {
                              setAuditDraft((current) => ({
                                ...current,
                                proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, rootCause: nextValue } : item)),
                              }));
                              setIsAuditDirty(true);
                            }}
                            onEdit={() => setAuditRichEditorState((current) => ({ ...current, [`proposal-root-${proposal.id}`]: true }))}
                            onSave={() => handleSaveActiveTextField(`proposal-root-${proposal.id}`, "Causa raíz guardada.")}
                          />
                          <RichTextResponseField
                            label="Propuesta"
                            value={proposal.proposal || ""}
                            placeholder="Describe la mejora/corrección/rediseño"
                            canEdit={canManageAudits}
                            isEditing={Boolean(auditRichEditorState[`proposal-body-${proposal.id}`])}
                            onChange={(nextValue) => {
                              setAuditDraft((current) => ({
                                ...current,
                                proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, proposal: nextValue } : item)),
                              }));
                              setIsAuditDirty(true);
                            }}
                            onEdit={() => setAuditRichEditorState((current) => ({ ...current, [`proposal-body-${proposal.id}`]: true }))}
                            onSave={() => handleSaveActiveTextField(`proposal-body-${proposal.id}`, "Propuesta guardada.")}
                          />
                          <RichTextResponseField
                            label="Impacto esperado"
                            value={proposal.expectedImpact || ""}
                            placeholder="Qué mejora se espera y cómo se medirá"
                            canEdit={canManageAudits}
                            isEditing={Boolean(auditRichEditorState[`proposal-impact-${proposal.id}`])}
                            onChange={(nextValue) => {
                              setAuditDraft((current) => ({
                                ...current,
                                proposals: (current.proposals || []).map((item) => (item.id === proposal.id ? { ...item, expectedImpact: nextValue } : item)),
                              }));
                              setIsAuditDirty(true);
                            }}
                            onEdit={() => setAuditRichEditorState((current) => ({ ...current, [`proposal-impact-${proposal.id}`]: true }))}
                            onSave={() => handleSaveActiveTextField(`proposal-impact-${proposal.id}`, "Impacto esperado guardado.")}
                          />
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => {
                              setAuditDraft((current) => ({
                                ...current,
                                proposals: (current.proposals || []).filter((item) => item.id !== proposal.id),
                              }));
                              setIsAuditDirty(true);
                            }}
                            disabled={!canManageAudits}
                          >
                            <Trash2 size={14} /> Eliminar propuesta
                          </button>
                        </div>
                      </article>
                    ))}
                    {!auditDraft.proposals?.length ? <p className="subtle-line">Aún no hay propuestas registradas.</p> : null}
                  </div>
                </section>
                    ) : null}

                    {canWorkFollowUpStep ? (
                    <section className="surface-card audit-analysis-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Seguimiento e implementación</h3>
                      <p>Define el nuevo proceso, responsables e instrucciones.</p>
                    </div>
                    {auditDraft.implementationPlan?.deadline ? (
                      <span className={`chip ${new Date(auditDraft.implementationPlan.deadline) < new Date() && lifecycleStatus !== "closed" ? "danger" : "success"}`}>
                        Límite: {auditDraft.implementationPlan.deadline}
                        {new Date(auditDraft.implementationPlan.deadline) < new Date() && lifecycleStatus !== "closed" ? " ⚠ Vencido" : ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="audit-form-grid">
                    <label className="app-modal-field">
                      <span>Fecha límite de implementación</span>
                      <input
                        type="date"
                        value={auditDraft.implementationPlan?.deadline || ""}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setAuditDraft((current) => ({
                            ...current,
                            implementationPlan: { ...(current.implementationPlan || {}), deadline: nextValue },
                          }));
                          setIsAuditDirty(true);
                        }}
                        disabled={!canManageAudits}
                      />
                    </label>
                    <RichTextResponseField
                      label="Resumen ejecutivo"
                      value={auditDraft.executiveSummary || ""}
                      placeholder="Resumen ejecutivo automático/curado"
                      canEdit={canManageAudits}
                      isEditing={Boolean(auditRichEditorState.executiveSummary)}
                      onChange={(nextValue) => {
                        setAuditDraft((current) => ({ ...current, executiveSummary: nextValue }));
                        setIsAuditDirty(true);
                      }}
                      onEdit={() => setAuditRichEditorState((current) => ({ ...current, executiveSummary: true }))}
                      onSave={() => handleSaveActiveTextField("executiveSummary", "Resumen guardado.")}
                    />
                    <RichTextResponseField
                      label="Nuevo proceso definido"
                      value={auditDraft.implementationPlan?.processDefinition || ""}
                      placeholder="Describe el proceso objetivo"
                      canEdit={canManageAudits}
                      isEditing={Boolean(auditRichEditorState.processDefinition)}
                      onChange={(nextValue) => {
                        setAuditDraft((current) => ({
                          ...current,
                          implementationPlan: { ...(current.implementationPlan || {}), processDefinition: nextValue },
                        }));
                        setIsAuditDirty(true);
                      }}
                      onEdit={() => setAuditRichEditorState((current) => ({ ...current, processDefinition: true }))}
                      onSave={() => handleSaveActiveTextField("processDefinition", "Proceso objetivo guardado.")}
                    />
                    <RichTextResponseField
                      label="Instrucciones de implementación"
                      value={auditDraft.implementationPlan?.instructions || ""}
                      placeholder="Pasos claros de ejecución"
                      canEdit={canManageAudits}
                      isEditing={Boolean(auditRichEditorState.implementationInstructions)}
                      onChange={(nextValue) => {
                        setAuditDraft((current) => ({
                          ...current,
                          implementationPlan: { ...(current.implementationPlan || {}), instructions: nextValue },
                        }));
                        setIsAuditDirty(true);
                      }}
                      onEdit={() => setAuditRichEditorState((current) => ({ ...current, implementationInstructions: true }))}
                      onSave={() => handleSaveActiveTextField("implementationInstructions", "Instrucciones guardadas.")}
                    />
                  </div>
                </section>
                    ) : null}
                  </>
                ) : null}

                <div className="audit-inline-actions">
                  <button type="button" className="icon-button danger" onClick={() => openDeleteAuditModal(auditDraft)} disabled={!canManageAudits}>Eliminar</button>
                  <button type="button" className="primary-button" onClick={handleCloseAudit} disabled={!canManageAudits || auditDraft.status === "closed"}>Cerrar</button>
                </div>

                <input ref={galleryEvidenceInputRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleUploadEvidence} disabled={uploadingEvidence || !canManageAudits || auditDraft.status === "closed"} />
                <input ref={mobileCameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleUploadEvidence} disabled={uploadingEvidence || !canManageAudits || auditDraft.status === "closed"} />

                <AuditEvidenceGrid
                  evidences={visibleAuditEvidences}
                  canEdit={canManageAudits && auditDraft.status !== "closed"}
                  canUpload
                  uploading={uploadingEvidence}
                  onOpenGallery={() => galleryEvidenceInputRef.current?.click()}
                  onOpenCamera={openCameraCapture}
                  onDelete={handleDeleteEvidence}
                />
              </>
            )}
          </article>
        </>
      ) : null}

      {activeTab === "history" ? (
        <article className="surface-card table-card full-width audit-surface-compact">
          <div className="card-header-row">
            <div>
              <h3>Historial</h3>
                <p>Solo auditorías cerradas.</p>
            </div>
          </div>
          <div className="saved-board-list permissions-preset-list">
              {closedAudits.map((audit) => (
              <article key={audit.id} className="surface-card audit-history-card">
                <div className="card-header-row">
                  <div>
                    <strong>{audit.area} · {audit.process}</strong>
                    <p>{audit.auditorName || currentUser?.name || "Sin auditor"}</p>
                  </div>
                  <span className={audit.status === "closed" ? "chip success" : "chip warning"}>{audit.status === "closed" ? "Cerrada" : "Abierta"}</span>
                </div>
                <p className="subtle-line">Inicio: {formatDateTime(audit.startedAt)}</p>
                <p className="subtle-line">Subárea: {audit.subArea || "-"}</p>
                <p className="subtle-line">Duración: {formatDuration(getAuditDurationSeconds(audit))}</p>
                <p className="subtle-line">Preguntas: {(audit.questions || []).length} · Evidencias: {(audit.evidences || []).length}</p>
                <div className="audit-inline-actions">
                  <button type="button" className="icon-button" onClick={() => openAuditViewer(audit)}>Ver</button>
                  <button type="button" className="icon-button danger" onClick={() => openDeleteAuditModal(audit)} disabled={!canManageAudits}>Eliminar</button>
                </div>
              </article>
            ))}
            {!closedAudits.length ? <p className="subtle-line">Todavía no hay auditorías cerradas.</p> : null}
          </div>
        </article>
      ) : null}

      {activeTab === "dashboard" ? (
        <article className="surface-card table-card full-width audit-surface-compact">
          <div className="card-header-row">
            <div>
              <h3>Dashboard</h3>
              <p>Vista general de auditorías por área.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {currentUser?.role === "Lead" && (
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => setResetStatsModal({ open: true, submitting: false })}
                  title="Reiniciar todos los contadores"
                >
                  <RotateCcw size={15} /> Reiniciar
                </button>
              )}
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="inventory-stat-grid inventory-stat-grid-collapsed">
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.total}</strong><p>Total</p></article>
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.closed}</strong><p>Cerradas</p></article>
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.open}</strong><p>Abiertas</p></article>
            <article className="surface-card audit-mini-stat"><strong>{formatDuration(dashboardStats.avgDuration)}</strong><p>Promedio</p></article>
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.severity.red}</strong><p>🔴 Críticas</p></article>
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.severity.yellow}</strong><p>🟡 Riesgo</p></article>
            <article className="surface-card audit-mini-stat"><strong>{dashboardStats.severity.green}</strong><p>🟢 Controladas</p></article>
          </div>
          <div className="saved-board-list permissions-preset-list">
            <article className="surface-card audit-area-stat-card">
              <div className="card-header-row">
                <strong>Áreas críticas</strong>
                <span className="chip warning">{dashboardStats.criticalAreas.length}</span>
              </div>
              {!dashboardStats.criticalAreas.length ? <p className="subtle-line">Sin áreas críticas activas.</p> : null}
              {dashboardStats.criticalAreas.map((row) => (
                <p key={row.label} className="subtle-line" style={{ margin: 0 }}>{row.label}: {row.value}</p>
              ))}
            </article>
          </div>
          <div className="saved-board-list permissions-preset-list">
            {dashboardStats.byArea.map((row) => {
              const pct = dashboardStats.total > 0 ? Math.round((row.value / dashboardStats.total) * 100) : 0;
              return (
                <article key={row.label} className="surface-card audit-area-stat-card">
                  <div className="card-header-row">
                    <strong>{row.label}</strong>
                    <span className="chip primary">{row.value}</span>
                  </div>
                  <div className="inventory-stock-bar">
                    <div className="inventory-stock-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="subtle-line">{pct}% del total</p>
                </article>
              );
            })}
            {!dashboardStats.byArea.length ? <p className="subtle-line">No hay datos para mostrar.</p> : null}
          </div>
        </article>
      ) : null}

      <Modal
        open={auditViewerModal.open}
        title="Detalle de auditoría"
        confirmLabel="Cerrar"
        hideCancel
        className="audit-viewer-modal"
        onClose={() => setAuditViewerModal({ open: false, audit: null })}
        onConfirm={() => setAuditViewerModal({ open: false, audit: null })}
      >
        {auditViewerDraft ? (
          <div
            className={auditShieldActive ? "audit-viewer-secure-shell shielded" : "audit-viewer-secure-shell"}
            onContextMenu={(event) => event.preventDefault()}
            onCopy={(event) => event.preventDefault()}
            onCut={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
          >
            <div className="audit-viewer-watermark-layer" aria-hidden="true">
              {watermarkTiles.map((tileId) => <span key={`wm-${tileId}`}>{auditShieldWatermark}</span>)}
            </div>
            {auditShieldActive ? (
              <div className="audit-viewer-shield" aria-live="polite">
                <strong>Contenido protegido</strong>
                <p>Regresa a esta ventana para continuar.</p>
              </div>
            ) : null}
            <div className="modal-form-grid">
            <p><strong>{auditViewerDraft.area}</strong> · {auditViewerDraft.process}</p>
            <p className="subtle-line">Subárea: {auditViewerDraft.subArea || "-"}</p>
            <p className="subtle-line">Auditor: {auditViewerDraft.auditorName || "Sin auditor"}</p>
            <p className="subtle-line">Inicio: {formatDateTime(auditViewerDraft.startedAt)}</p>
            <p className="subtle-line">Duración: {formatDuration(getAuditDurationSeconds(auditViewerDraft))}</p>

            <RichTextResponseField
              label="Notas"
              value={auditViewerDraft.notes || ""}
              placeholder="Observación general"
              canEdit={canManageAudits && !auditViewerSaving}
              isEditing={Boolean(auditViewerRichEditorState.notes)}
              onChange={updateViewerNotes}
              onEdit={() => setAuditViewerRichEditorState((current) => ({ ...current, notes: true }))}
              onSave={() => handleSaveViewerTextField("notes", "Notas guardadas.")}
              saveLabel="Guardar notas"
              editLabel="Editar notas"
            />

            <div className="saved-board-list permissions-preset-list">
              {(auditViewerDraft.questions || []).map((question, index) => (
                <article key={question.id || `${auditViewerDraft.id}-${index}`} className="surface-card audit-history-card">
                  <strong>{index + 1}. {question.text}</strong>
                  {question.type === "yesno" ? (
                    <div className="audit-answer-toggle-row">
                      <button
                        type="button"
                        className={`switch-button ${question.answer === true ? "on" : ""}`}
                        onClick={() => handleSaveViewerBinaryAnswer(question.id, question.answer === true ? false : true)}
                        disabled={!canManageAudits || auditViewerSaving}
                        aria-pressed={question.answer === true}
                        aria-label="Alternar respuesta Sí/No"
                      >
                        <span className="switch-thumb" />
                      </button>
                      <strong>{question.answer === true ? "Sí" : "No"}</strong>
                    </div>
                  ) : (
                    <RichTextResponseField
                      label="Respuesta"
                      value={String(question.answer || "")}
                      placeholder={question.placeholder || "Escribe aquí"}
                      canEdit={canManageAudits && !auditViewerSaving}
                      isEditing={Boolean(auditViewerRichEditorState[question.id])}
                      onChange={(nextValue) => updateViewerAnswer(question.id, nextValue)}
                      onEdit={() => setAuditViewerRichEditorState((current) => ({ ...current, [question.id]: true }))}
                      onSave={() => handleSaveViewerTextField(question.id, "Respuesta guardada.")}
                    />
                  )}
                </article>
              ))}
            </div>
            <div className="audit-viewer-evidence-block">
              <h3>Evidencias</h3>
              <AuditEvidenceGrid
                evidences={auditViewerDraft.evidences || []}
                canEdit={false}
                canUpload={false}
                uploading={false}
                onOpenGallery={() => {}}
                onOpenCamera={() => {}}
                onDelete={() => {}}
              />
            </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <CameraCaptureModal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCaptureEvidence}
        disabled={uploadingEvidence}
      />

      <Modal
        open={templateManagerOpen}
        title="Plantillas de auditoría"
        confirmLabel="Guardar plantilla"
        cancelLabel="Cerrar"
        onClose={() => setTemplateManagerOpen(false)}
        onConfirm={handleSaveTemplate}
        confirmDisabled={!canManageTemplates}
        className="audit-template-modal"
      >
        <div className="audit-template-mobile-tabs" role="tablist" aria-label="Secciones de plantillas">
          <button
            type="button"
            className={templateManagerTab === "library" ? "audit-template-mobile-tab active" : "audit-template-mobile-tab"}
            onClick={() => setTemplateManagerTab("library")}
          >
            Biblioteca
          </button>
          <button
            type="button"
            className={templateManagerTab === "editor" ? "audit-template-mobile-tab active" : "audit-template-mobile-tab"}
            onClick={() => setTemplateManagerTab("editor")}
          >
            Editor
          </button>
        </div>
        <div className="audit-template-modal-grid">
          <section className={templateManagerTab === "library" ? "surface-card audit-surface-compact audit-template-library-card" : "surface-card audit-surface-compact audit-template-library-card audit-panel-hidden-mobile"}>
            <div className="card-header-row">
              <div>
                <h3>Biblioteca</h3>
                <p>Precargadas y editables.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setTemplateDraft(emptyTemplateDraft(templateFilterArea || newAuditArea || "", templateFilterProcess || newAuditProcess || ""))}
                disabled={!canManageTemplates}
              >
                <Plus size={15} /> Nueva
              </button>
            </div>
            <div className="audit-form-grid">
              <label className="app-modal-field">
                <span>Área</span>
                <select value={templateFilterArea} onChange={(event) => setTemplateFilterArea(event.target.value)}>
                  <option value="">Todas</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <label className="app-modal-field">
                <span>Proceso</span>
                <input value={templateFilterProcess} onChange={(event) => setTemplateFilterProcess(event.target.value)} placeholder="Filtrar proceso" />
              </label>
            </div>
            <div className="audit-template-library-list">
              {filteredTemplateLibrary.map((template) => (
                <article key={template.id} className="surface-card audit-template-library-item">
                  <div className="card-header-row">
                    <div>
                      <strong>{template.area} · {template.process}</strong>
                      <p>{template.questions?.length || 0} preguntas</p>
                    </div>
                    <div className="audit-inline-actions">
                      <button type="button" className="icon-button" onClick={() => setTemplateDraft(cloneTemplateIntoDraft(template))} disabled={!canManageTemplates}>
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => pullTemplateToArea(template, newAuditArea || templateFilterArea || template.area)}
                        disabled={!canManageTemplates}
                        title={newAuditArea || templateFilterArea ? `Jalar a ${newAuditArea || templateFilterArea}` : "Jalar a otra área"}
                      >
                        <Plus size={14} />
                      </button>
                      {!template.isFallback ? (
                        <button type="button" className="icon-button danger" onClick={() => handleDeleteTemplate(template)} disabled={!canManageTemplates}>
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {!filteredTemplateLibrary.length ? <p className="subtle-line">No hay plantillas para ese filtro.</p> : null}
            </div>
          </section>

          <section className={templateManagerTab === "editor" ? "surface-card audit-surface-compact audit-template-editor-card" : "surface-card audit-surface-compact audit-template-editor-card audit-panel-hidden-mobile"}>
            <div className="audit-form-grid">
              <label className="app-modal-field">
                <span>Área</span>
                <input value={templateDraft.area} onChange={(event) => setTemplateDraft((current) => ({ ...current, area: event.target.value }))} placeholder="Ej. Inventario" disabled={!canManageTemplates} />
              </label>
              <label className="app-modal-field">
                <span>Proceso</span>
                <input value={templateDraft.process} onChange={(event) => setTemplateDraft((current) => ({ ...current, process: event.target.value }))} placeholder="Ej. Revisión" disabled={!canManageTemplates} />
              </label>
            </div>
            <p className="subtle-line">
              Las plantillas ya se pueden usar en cualquier área. Si quieres copiar una a otra área, usa el botón + de la biblioteca y luego guárdala.
            </p>
            <TemplateQuestionEditor
              draft={templateDraft}
              setDraft={setTemplateDraft}
              disabled={!canManageTemplates}
              title="Editor"
              subtitle="Agrega, quita o mejora preguntas sin alargar la captura principal."
              addLabel="Agregar"
            />
          </section>
        </div>
      </Modal>

      <Modal
        open={deleteAuditModal.open}
        title="Eliminar auditoría"
        confirmLabel={deleteAuditModal.submitting ? "Eliminando..." : "Eliminar auditoría"}
        cancelLabel="Cancelar"
        onClose={closeDeleteAuditModal}
        onConfirm={confirmDeleteAudit}
        confirmDisabled={deleteAuditModal.submitting || !deleteAuditModal.auditId || !deleteAuditModal.leadPassword.trim()}
      >
        <div className="audit-delete-modal-copy">
          <p>Esta acción borra por completo la auditoría <strong>{deleteAuditModal.auditLabel || "seleccionada"}</strong>.</p>
          <p className="subtle-line">Confirma con la contraseña de un Lead para continuar.</p>
        </div>
        <label className="app-modal-field">
          <span>Contraseña del Lead</span>
          <div className="password-visibility-field">
            <input
              type={showDeleteAuditLeadPassword ? "text" : "password"}
              value={deleteAuditModal.leadPassword}
              onChange={(event) => setDeleteAuditModal((current) => ({ ...current, leadPassword: event.target.value }))}
              placeholder="Ingresa la contraseña"
            />
            <button
              type="button"
              className="password-visibility-toggle"
              aria-label={showDeleteAuditLeadPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setShowDeleteAuditLeadPassword((current) => !current)}
            >
              {showDeleteAuditLeadPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
      </Modal>

      <Modal
        open={resetStatsModal.open}
        title="Reiniciar contadores del dashboard"
        confirmLabel={resetStatsModal.submitting ? "Reiniciando..." : "Sí, reiniciar todo"}
        cancelLabel="Cancelar"
        onClose={() => setResetStatsModal({ open: false, submitting: false })}
        onConfirm={handleResetStats}
        confirmDisabled={resetStatsModal.submitting}
      >
        <div className="audit-delete-modal-copy">
          <p>Esta acción eliminará <strong>todas las auditorías registradas</strong> y reiniciará los contadores del dashboard a cero.</p>
          <p className="subtle-line">Solo el Lead principal puede hacer esto. No se puede deshacer.</p>
        </div>
      </Modal>

      <Modal
        open={auditEditorOpen}
        title="Preguntas de la auditoría"
        confirmLabel="Aplicar cambios"
        cancelLabel="Cerrar"
        onClose={() => setAuditEditorOpen(false)}
        onConfirm={applyAuditQuestionChanges}
        confirmDisabled={!canManageAudits}
        className="audit-template-modal"
      >
        <section className="surface-card audit-surface-compact">
          {auditQuestionsDraft ? (
            <TemplateQuestionEditor
              draft={auditQuestionsDraft}
              setDraft={setAuditQuestionsDraft}
              disabled={!canManageAudits}
              title="Personaliza esta auditoría"
              subtitle="Estos cambios solo afectan la auditoría abierta."
              addLabel="Agregar"
            />
          ) : (
            <p className="subtle-line">No hay auditoría activa.</p>
          )}
        </section>
      </Modal>
    </section>
  );
}
