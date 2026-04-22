import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bold, Check, ClipboardList, Italic, List, Plus, RotateCcw, Settings, Trash2, Upload, X } from "lucide-react";
import { Modal } from "../components/Modal";
import { uploadFileToCloudinary } from "../services/upload.service";

const FALLBACK_PROCESS_TEMPLATES = [
  {
    area: "Inventario",
    process: "Revisión",
    questions: [
      { type: "yesno", text: "¿El proceso sigue el estándar vigente?", required: true },
      { type: "yesno", text: "¿La captura coincide con la evidencia física?", required: true },
      { type: "text", text: "Hallazgo principal", required: false, placeholder: "Describe la desviación o mejora" },
    ],
  },
  {
    area: "Inventario",
    process: "Acomodo",
    questions: [
      { type: "yesno", text: "¿Los pasillos están libres y señalizados?", required: true },
      { type: "yesno", text: "¿Se respeta FIFO/PEPS en el acomodo?", required: true },
      { type: "text", text: "Observación de acomodo", required: false, placeholder: "Ej. rack 4 con producto fuera de ubicación" },
    ],
  },
  {
    area: "Inventario",
    process: "Recepción",
    questions: [
      { type: "yesno", text: "¿La mercancía llegó sin daño visible?", required: true },
      { type: "yesno", text: "¿La cantidad coincide con el documento?", required: true },
      { type: "text", text: "Incidencia en recepción", required: false, placeholder: "Describe faltantes, daños o bloqueos" },
    ],
  },
  {
    area: "Inventario",
    process: "Devoluciones",
    questions: [
      { type: "yesno", text: "¿La devolución fue identificada y separada?", required: true },
      { type: "yesno", text: "¿Se registró el motivo correctamente?", required: true },
      { type: "text", text: "Detalle de devolución", required: false, placeholder: "Cliente, lote o causa" },
    ],
  },
  {
    area: "Inventario",
    process: "Reingresos",
    questions: [
      { type: "yesno", text: "¿El producto reingresado cumple condición aceptable?", required: true },
      { type: "yesno", text: "¿El reingreso quedó documentado?", required: true },
      { type: "text", text: "Observación de reingreso", required: false, placeholder: "Indica lote, ubicación o restricción" },
    ],
  },
  {
    area: "Inventario",
    process: "Traspasos",
    questions: [
      { type: "yesno", text: "¿El origen y destino están validados?", required: true },
      { type: "yesno", text: "¿La cantidad traspasada coincide?", required: true },
      { type: "text", text: "Comentario del traspaso", required: false, placeholder: "Explica diferencias o bloqueos" },
    ],
  },
  {
    area: "Limpieza",
    process: "General",
    questions: [
      { type: "yesno", text: "¿El área quedó limpia y ordenada?", required: true },
      { type: "yesno", text: "¿Se usaron los insumos correctos?", required: true },
      { type: "text", text: "Pendiente detectado", required: false, placeholder: "Zona, insumo o seguimiento" },
    ],
  },
  {
    area: "Limpieza",
    process: "Limpieza de naves",
    questions: [
      { type: "yesno", text: "¿Se limpiaron pasillos, racks y esquinas?", required: true },
      { type: "yesno", text: "¿No quedan residuos o derrames?", required: true },
      { type: "text", text: "Hallazgo en nave", required: false, placeholder: "Indica zona y acción requerida" },
    ],
  },
  {
    area: "Limpieza",
    process: "Oficinas y baños",
    questions: [
      { type: "yesno", text: "¿Se sanitizaron superficies de contacto?", required: true },
      { type: "yesno", text: "¿Hay insumos suficientes y repuestos?", required: true },
      { type: "text", text: "Observación de sanitización", required: false, placeholder: "Indica faltante o corrección" },
    ],
  },
  {
    area: "Pedidos",
    process: "Picking",
    questions: [
      { type: "yesno", text: "¿El surtido coincide contra el pedido?", required: true },
      { type: "yesno", text: "¿El empaque final es correcto?", required: true },
      { type: "text", text: "Observación de picking", required: false, placeholder: "SKU, caja o tiempo detectado" },
    ],
  },
  {
    area: "Pedidos",
    process: "Clientes",
    questions: [
      { type: "yesno", text: "¿La preparación cumple prioridad y ventana?", required: true },
      { type: "yesno", text: "¿Se validó documentación y salida?", required: true },
      { type: "text", text: "Comentario del pedido", required: false, placeholder: "Anota bloqueo o ajuste" },
    ],
  },
  {
    area: "Pedidos",
    process: "Paqueterías",
    questions: [
      { type: "yesno", text: "¿La guía y el bulto coinciden?", required: true },
      { type: "yesno", text: "¿El cierre fue registrado sin incidencias?", required: true },
      { type: "text", text: "Detalle de paquetería", required: false, placeholder: "Transportista, guía o incidencia" },
    ],
  },
];

function buildQuestionDraft(question = {}) {
  return {
    id: question.id || crypto.randomUUID(),
    type: question.type === "text" ? "text" : "yesno",
    text: String(question.text || "").trim(),
    required: question.required !== false,
    placeholder: String(question.placeholder || "").trim(),
    answer: question.type === "text" ? String(question.answer || "") : question.answer ?? null,
  };
}

function buildFallbackTemplates() {
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
    .map((question) => ({
      id: question.id || crypto.randomUUID(),
      type: question.type === "text" ? "text" : "yesno",
      text: String(question.text || "").trim(),
      required: question.required !== false,
      placeholder: String(question.placeholder || "").trim(),
      answer: question.type === "text" ? String(question.answer || "") : question.answer ?? null,
    }))
    .filter((question) => question.text);
}

function buildQuickStat(label, value) {
  return { label, value };
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

function renderRichInline(text, keyPrefix) {
  const tokens = String(text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={`${keyPrefix}-strong-${index}`}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={`${keyPrefix}-em-${index}`}>{token.slice(1, -1)}</em>;
    }
    return <span key={`${keyPrefix}-text-${index}`}>{token}</span>;
  });
}

function renderRichAnswerPreview(value) {
  const lines = String(value || "").split(/\r?\n/);
  const blocks = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="audit-rich-preview-list">
        {listItems.map((item, index) => <li key={`item-${blocks.length}-${index}`}>{renderRichInline(item, `list-${blocks.length}-${index}`)}</li>)}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }
    flushList();
    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="audit-rich-preview-paragraph">
        {renderRichInline(trimmed, `paragraph-${blocks.length}`)}
      </p>,
    );
  });

  flushList();
  return blocks;
}

function TemplateQuestionEditor({
  draft,
  setDraft,
  disabled,
  title,
  subtitle,
  addLabel,
}) {
  return (
    <div className="audit-editor-shell">
      <div className="card-header-row">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
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
                    questions: current.questions.map((item) => (
                      item.id === question.id
                        ? {
                            ...item,
                            type: event.target.value === "text" ? "text" : "yesno",
                            answer: event.target.value === "text" ? String(item.answer || "") : item.answer ?? null,
                          }
                        : item
                    )),
                  }))}
                  disabled={disabled}
                >
                  <option value="yesno">Sí / No</option>
                  <option value="text">Texto</option>
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
              {question.type === "text" ? (
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
  const [resetStatsModal, setResetStatsModal] = useState({ open: false, submitting: false });
  const [auditViewerModal, setAuditViewerModal] = useState({ open: false, audit: null });
  const textAnswerRefs = useRef(new Map());

  const resolvedTemplates = useMemo(() => {
    return (Array.isArray(processAuditTemplates) ? processAuditTemplates : []).map((template) => ({
      ...template,
      isFallback: false,
      questions: (template.questions || []).map((question) => buildQuestionDraft(question)),
    }));
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
    if (!newAuditArea) return [];
    return resolvedTemplates.filter((entry) => entry.area === newAuditArea && (!newAuditProcess || entry.process === newAuditProcess));
  }, [newAuditArea, newAuditProcess, resolvedTemplates]);

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

  const selectedAudit = useMemo(
    () => sortedAudits.find((entry) => entry.id === selectedAuditId) || sortedAudits[0] || null,
    [selectedAuditId, sortedAudits],
  );

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

    return {
      total,
      closed,
      open,
      avgDuration,
      byArea: Array.from(byAreaMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value),
    };
  }, [sortedAudits]);

  const quickStats = useMemo(() => {
    return [
      buildQuickStat("Plantillas", resolvedTemplates.length),
      buildQuickStat("Procesos", newAuditArea ? (processOptionsForArea[newAuditArea] || []).length : Object.keys(processOptionsForArea).length),
      buildQuickStat("Abiertas", sortedAudits.filter((entry) => entry.status !== "closed").length),
    ];
  }, [newAuditArea, processOptionsForArea, resolvedTemplates.length, sortedAudits]);

  useEffect(() => {
    if (!selectedAudit) {
      setAuditDraft(null);
      setSelectedAuditId("");
      return;
    }

    setSelectedAuditId(selectedAudit.id);
    setAuditDraft({
      ...selectedAudit,
      questions: (selectedAudit.questions || []).map((question) => ({ ...question })),
      evidences: [...(selectedAudit.evidences || [])],
    });
    setAuditQuestionsDraft({
      questions: (selectedAudit.questions || []).map((question) => buildQuestionDraft(question)),
    });
    setIsAuditDirty(false);
  }, [selectedAudit?.id]);

  useEffect(() => {
    if (!newAuditArea || newAuditTemplateId || !templateCandidates.length) return;
    setNewAuditTemplateId(templateCandidates[0].id);
  }, [newAuditArea, newAuditTemplateId, templateCandidates]);

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

  function applyTextAnswerFormat(questionId, formatType) {
    const textarea = textAnswerRefs.current.get(questionId);
    const question = (auditDraft?.questions || []).find((item) => item.id === questionId);
    if (!textarea || !question) return;

    const currentValue = String(question.answer || "");
    const selectionStart = textarea.selectionStart ?? currentValue.length;
    const selectionEnd = textarea.selectionEnd ?? currentValue.length;
    const formatter = formatType === "bold"
      ? wrapAnswerSelection(currentValue, selectionStart, selectionEnd, "**")
      : formatType === "italic"
        ? wrapAnswerSelection(currentValue, selectionStart, selectionEnd, "*")
        : prefixAnswerLines(currentValue, selectionStart, selectionEnd);

    updateAuditAnswer(questionId, formatter.value);
    requestAnimationFrame(() => {
      const nextTextarea = textAnswerRefs.current.get(questionId);
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(formatter.selectionStart, formatter.selectionEnd);
    });
  }

  function openDeleteAuditModal(audit) {
    setDeleteAuditModal({
      open: true,
      auditId: audit?.id || "",
      auditLabel: audit ? `${audit.area} · ${audit.process}` : "",
      leadPassword: "",
      submitting: false,
    });
  }

  function closeDeleteAuditModal() {
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
        notes: auditDraft.notes || "",
        questions: normalizeQuestionsForSave(auditDraft.questions || []),
      });
      setAuditEditorOpen(false);
      setSelectedAuditId("");
      setAuditDraft(null);
      setAuditQuestionsDraft(null);
      setNewAuditArea("");
      setNewAuditSubArea("");
      setNewAuditProcess("");
      setNewAuditTemplateId("");
      setActiveTab("history");
      pushAppToast("Auditoría cerrada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo cerrar la auditoría.", "danger");
    }
  }

  async function handleUploadEvidence(event) {
    const file = event.target.files?.[0];
    if (!file || !auditDraft || !canManageAudits) return;
    setUploadingEvidence(true);

    try {
      const uploaded = await uploadFileToCloudinary(file);
      await addProcessAuditEvidence(auditDraft.id, {
        url: uploaded.url,
        thumbnailUrl: uploaded.thumbnailUrl,
        name: uploaded.originalName || file.name,
        mimeType: uploaded.fileMimeType || file.type,
      });
      pushAppToast("Evidencia agregada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo subir la evidencia.", "danger");
    } finally {
      setUploadingEvidence(false);
      event.target.value = "";
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
          <article className="surface-card table-card audit-surface-compact">
            <div className="card-header-row">
              <div>
                <h3>Nueva auditoría</h3>
                <p>Área, proceso y plantilla.</p>
              </div>
              <ClipboardList size={18} />
            </div>
            <div className="audit-form-grid">
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
                  value={newAuditSubArea}
                  onChange={(event) => setNewAuditSubArea(event.target.value)}
                  placeholder="Ej. TURNO MAÑANA"
                />
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
                    <option key={template.id} value={template.id}>{template.process} · {template.questions?.length || 0} preg.</option>
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
                  <span>Inicio: {formatDateTime(auditDraft.startedAt)}</span>
                  <span>Auditor: {auditDraft.auditorName || currentUser?.name || "Sin auditor"}</span>
                  <span>Duración: {formatDuration(getAuditDurationSeconds(auditDraft))}</span>
                </div>

                <label className="app-modal-field audit-field-span-full">
                  <span>Notas</span>
                  <input
                    value={auditDraft.notes || ""}
                    onChange={(event) => {
                      setAuditDraft((current) => ({ ...current, notes: event.target.value }));
                      setIsAuditDirty(true);
                    }}
                    placeholder="Observación general"
                    disabled={!canManageAudits || auditDraft.status === "closed"}
                  />
                </label>

                <div className="audit-response-grid">
                  {(auditDraft.questions || []).map((question, index) => (
                    <article
                      key={question.id}
                      className={question.type === "text" ? "surface-card audit-response-card audit-response-card-text" : "surface-card audit-response-card audit-response-card-yesno"}
                    >
                      <div className="audit-response-head">
                        <span className="chip">{index + 1}</span>
                        <strong>{question.text}</strong>
                      </div>
                      {question.type === "yesno" ? (
                        <div className="audit-answer-toggle-row">
                          <button
                            type="button"
                            className={question.answer === true ? "primary-button" : "icon-button"}
                            onClick={() => updateAuditAnswer(question.id, true)}
                            disabled={!canManageAudits || auditDraft.status === "closed"}
                          >
                            <Check size={15} /> Sí
                          </button>
                          <button
                            type="button"
                            className={question.answer === false ? "primary-button" : "icon-button"}
                            onClick={() => updateAuditAnswer(question.id, false)}
                            disabled={!canManageAudits || auditDraft.status === "closed"}
                          >
                            <X size={15} /> No
                          </button>
                        </div>
                      ) : (
                        <div className="audit-text-answer-shell">
                          <div className="audit-text-toolbar" role="toolbar" aria-label={`Formato para ${question.text}`}>
                            <button type="button" className="icon-button" onClick={() => applyTextAnswerFormat(question.id, "bold")} disabled={!canManageAudits || auditDraft.status === "closed"}>
                              <Bold size={14} /> Negrita
                            </button>
                            <button type="button" className="icon-button" onClick={() => applyTextAnswerFormat(question.id, "italic")} disabled={!canManageAudits || auditDraft.status === "closed"}>
                              <Italic size={14} /> Itálica
                            </button>
                            <button type="button" className="icon-button" onClick={() => applyTextAnswerFormat(question.id, "list")} disabled={!canManageAudits || auditDraft.status === "closed"}>
                              <List size={14} /> Lista
                            </button>
                          </div>
                          <label className="app-modal-field">
                            <span>Respuesta</span>
                            <textarea
                              ref={(node) => {
                                if (node) textAnswerRefs.current.set(question.id, node);
                                else textAnswerRefs.current.delete(question.id);
                              }}
                              value={String(question.answer || "")}
                              onChange={(event) => updateAuditAnswer(question.id, event.target.value)}
                              placeholder={question.placeholder || "Escribe aquí"}
                              rows={5}
                              disabled={!canManageAudits || auditDraft.status === "closed"}
                            />
                          </label>
                          {String(question.answer || "").trim() ? (
                            <div className="audit-rich-preview">
                              <span>Vista previa</span>
                              <div className="audit-rich-preview-body">
                                {renderRichAnswerPreview(question.answer)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <div className="audit-inline-actions">
                  <label className="icon-button" style={{ cursor: uploadingEvidence ? "not-allowed" : "pointer", opacity: uploadingEvidence ? 0.6 : 1 }}>
                    <Upload size={15} /> {uploadingEvidence ? "Subiendo..." : "Evidencia"}
                    <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleUploadEvidence} disabled={uploadingEvidence || !canManageAudits || auditDraft.status === "closed"} />
                  </label>
                  <button type="button" className="icon-button danger" onClick={() => openDeleteAuditModal(auditDraft)} disabled={!canManageAudits}>Eliminar</button>
                  <button type="button" className="primary-button" onClick={handleCloseAudit} disabled={!canManageAudits || auditDraft.status === "closed"}>Cerrar</button>
                </div>

                <div className="saved-board-list permissions-preset-list">
                  {(auditDraft.evidences || []).map((evidence) => (
                    <article key={evidence.id} className="surface-card audit-evidence-card">
                      <div className="card-header-row">
                        <a href={evidence.url} target="_blank" rel="noreferrer">{evidence.name || "Evidencia"}</a>
                        <button type="button" className="icon-button danger" onClick={() => removeProcessAuditEvidence(auditDraft.id, evidence.id)} disabled={!canManageAudits}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="subtle-line">{formatDateTime(evidence.createdAt)}</p>
                    </article>
                  ))}
                </div>
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
              <p>Abre auditorías cerradas o en curso.</p>
            </div>
          </div>
          <div className="saved-board-list permissions-preset-list">
            {sortedAudits.map((audit) => (
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
                  <button type="button" className="icon-button" onClick={() => setAuditViewerModal({ open: true, audit })}>Ver</button>
                  <button type="button" className="icon-button danger" onClick={() => openDeleteAuditModal(audit)} disabled={!canManageAudits}>Eliminar</button>
                </div>
              </article>
            ))}
            {!sortedAudits.length ? <p className="subtle-line">Todavía no hay auditorías.</p> : null}
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
        confirmLabel="Abrir en captura"
        cancelLabel="Cerrar"
        onClose={() => setAuditViewerModal({ open: false, audit: null })}
        onConfirm={() => {
          if (!auditViewerModal.audit?.id) return;
          setSelectedAuditId(auditViewerModal.audit.id);
          setActiveTab("capture");
          setAuditViewerModal({ open: false, audit: null });
        }}
        confirmDisabled={!auditViewerModal.audit?.id}
      >
        {auditViewerModal.audit ? (
          <div className="modal-form-grid">
            <p><strong>{auditViewerModal.audit.area}</strong> · {auditViewerModal.audit.process}</p>
            <p className="subtle-line">Subárea: {auditViewerModal.audit.subArea || "-"}</p>
            <p className="subtle-line">Auditor: {auditViewerModal.audit.auditorName || "Sin auditor"}</p>
            <p className="subtle-line">Inicio: {formatDateTime(auditViewerModal.audit.startedAt)}</p>
            <p className="subtle-line">Duración: {formatDuration(getAuditDurationSeconds(auditViewerModal.audit))}</p>
            <div className="saved-board-list permissions-preset-list">
              {(auditViewerModal.audit.questions || []).map((question, index) => (
                <article key={question.id || `${auditViewerModal.audit.id}-${index}`} className="surface-card audit-history-card">
                  <strong>{index + 1}. {question.text}</strong>
                  <p className="subtle-line">
                    {question.type === "yesno"
                      ? (question.answer === true ? "Respuesta: Sí" : question.answer === false ? "Respuesta: No" : "Respuesta: Sin responder")
                      : `Respuesta: ${String(question.answer || "Sin respuesta")}`}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

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
          <input
            type="password"
            value={deleteAuditModal.leadPassword}
            onChange={(event) => setDeleteAuditModal((current) => ({ ...current, leadPassword: event.target.value }))}
            placeholder="Ingresa la contraseña"
          />
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
