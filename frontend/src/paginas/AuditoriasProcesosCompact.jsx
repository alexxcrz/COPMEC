import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Camera, Check, ChevronLeft, ChevronRight, ClipboardList, ExternalLink, Image as ImageIcon, Plus, RotateCcw, Settings, Trash2, Upload, X } from "lucide-react";
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

const QUESTION_VALID_TYPES = ["yesno", "text", "scale", "number", "date", "select", "multi"];

function buildQuestionDraft(question = {}) {
  const type = QUESTION_VALID_TYPES.includes(question.type) ? question.type : "yesno";
  return {
    id: question.id || crypto.randomUUID(),
    type,
    text: String(question.text || "").trim(),
    required: question.required !== false,
    placeholder: String(question.placeholder || "").trim(),
    answer: type === "text" ? String(question.answer || "") : question.answer ?? null,
    allowNote: Boolean(question.allowNote),
    options: Array.isArray(question.options) ? [...question.options] : [],
    minValue: typeof question.minValue === "number" ? question.minValue : 1,
    maxValue: typeof question.maxValue === "number" ? question.maxValue : (type === "scale" ? 5 : 10),
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
    .map((question) => {
      const type = QUESTION_VALID_TYPES.includes(question.type) ? question.type : "yesno";
      return {
        id: question.id || crypto.randomUUID(),
        type,
        text: String(question.text || "").trim(),
        required: question.required !== false,
        placeholder: String(question.placeholder || "").trim(),
        answer: type === "text" ? String(question.answer || "") : question.answer ?? null,
        allowNote: Boolean(question.allowNote),
        options: Array.isArray(question.options) ? [...question.options] : [],
        minValue: typeof question.minValue === "number" ? question.minValue : 1,
        maxValue: typeof question.maxValue === "number" ? question.maxValue : (type === "scale" ? 5 : 10),
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
  subtitle,
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
                  <input
                    type="checkbox"
                    checked={Boolean(question.allowNote)}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      questions: current.questions.map((item) => (item.id === question.id ? { ...item, allowNote: event.target.checked } : item)),
                    }))}
                    disabled={disabled}
                    style={{ width: "auto" }}
                  />
                  <span>Permitir nota opcional</span>
                </label>
              ) : null}
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
  const [resetStatsModal, setResetStatsModal] = useState({ open: false, submitting: false });
  const [auditViewerModal, setAuditViewerModal] = useState({ open: false, audit: null });
  const [auditRichEditorState, setAuditRichEditorState] = useState({});
  const [auditViewerDraft, setAuditViewerDraft] = useState(null);
  const [auditViewerDirty, setAuditViewerDirty] = useState(false);
  const [auditViewerSaving, setAuditViewerSaving] = useState(false);
  const [auditViewerRichEditorState, setAuditViewerRichEditorState] = useState({});
  const [auditShieldActive, setAuditShieldActive] = useState(false);
  const [auditShieldTick, setAuditShieldTick] = useState(() => Date.now());
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

  const closedAudits = useMemo(
    () => sortedAudits.filter((entry) => entry.status === "closed"),
    [sortedAudits],
  );

  const selectedAudit = useMemo(
    () => openAudits.find((entry) => entry.id === selectedAuditId) || openAudits[0] || null,
    [openAudits, selectedAuditId],
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
      buildQuickStat("Abiertas", openAudits.length),
    ];
  }, [newAuditArea, openAudits.length, processOptionsForArea, resolvedTemplates.length]);

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
          closedAt: selectedAudit.closedAt,
          updatedAt: selectedAudit.updatedAt,
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
                            disabled={!canManageAudits}
                          >
                            <Check size={15} /> Sí
                          </button>
                          <button
                            type="button"
                            className={question.answer === false ? "primary-button" : "icon-button"}
                            onClick={() => updateAuditAnswer(question.id, false)}
                            disabled={!canManageAudits}
                          >
                            <X size={15} /> No
                          </button>
                        </div>
                      ) : (
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
                      )}
                    </article>
                  ))}
                </div>

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
                        className={question.answer === true ? "primary-button" : "icon-button"}
                        onClick={() => handleSaveViewerBinaryAnswer(question.id, true)}
                        disabled={!canManageAudits || auditViewerSaving}
                      >
                        <Check size={15} /> Sí
                      </button>
                      <button
                        type="button"
                        className={question.answer === false ? "primary-button" : "icon-button"}
                        onClick={() => handleSaveViewerBinaryAnswer(question.id, false)}
                        disabled={!canManageAudits || auditViewerSaving}
                      >
                        <X size={15} /> No
                      </button>
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
