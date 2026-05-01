import { useEffect, useRef, useState } from "react";
import { Archive, Download, Eye, FileText, Trash2, Upload } from "lucide-react";
import { Modal } from "../components/Modal";
import {
  buildEncryptedCopmecAuditPackage,
  buildEncryptedCopmecDashboardPackage,
  buildEncryptedCopmecPdfPackage,
  parseEncryptedCopmecAuditPackage,
  parseEncryptedCopmecDashboardPackage,
  parseEncryptedCopmecHistoryPackage,
  parseEncryptedCopmecPackage,
  parseEncryptedCopmecPdfPackage,
  triggerCopmecDownload,
} from "../utils/copmecFiles.js";

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizeArchiveroFiles(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e, i) => ({
      id: String(e?.id || `cop-${i + 1}`),
      fileName: String(e?.fileName || "archivo.cop"),
      importedAt: String(e?.importedAt || new Date().toISOString()),
      periodLabel: String(e?.periodLabel || "Archivo .cop"),
      records: Math.max(0, Number(e?.records || 0)),
      fileType: String(e?.fileType || "unknown"),
      packageText: String(e?.packageText || ""),
    }))
    .filter((e) => e.packageText);
}

async function universalCopParser(packageText) {
  // 1. Historial cifrado
  try {
    const p = await parseEncryptedCopmecHistoryPackage(packageText);
    return { payload: p, fileType: "history" };
  } catch {}
  // 2. Tablero cifrado (genérico)
  try {
    const p = await parseEncryptedCopmecPackage(packageText);
    return { payload: p, fileType: "board" };
  } catch {}
  // 3. Auditoría cifrada
  try {
    const p = await parseEncryptedCopmecAuditPackage(packageText);
    return { payload: p, fileType: "process-audit" };
  } catch {}
  // 4. PDF cifrado
  try {
    const p = await parseEncryptedCopmecPdfPackage(packageText);
    return { payload: p, fileType: "pdf-document" };
  } catch {}
  // 5. Dashboard cifrado
  try {
    const p = await parseEncryptedCopmecDashboardPackage(packageText);
    return { payload: p, fileType: "dashboard" };
  } catch {}
  // 6. JSON plano (legado, compatibilidad)
  try {
    const p = JSON.parse(packageText);
    if (p && typeof p === "object") return { payload: p, fileType: String(p.type || "json") };
  } catch {}
  throw new Error("El archivo no es un .cop válido de COPMEC.");
}

function buildArchiveroEntry({ packageText, payload, fileName, fileType }) {
  let periodLabel = "Archivo .cop";
  let records = 0;
  if (fileType === "history") {
    periodLabel = String(payload?.period?.label || "Historial").trim() || "Historial";
    records = Math.max(0, Number(payload?.summary?.records || (Array.isArray(payload?.rows) ? payload.rows.length : 0)));
  } else if (fileType === "board") {
    periodLabel = `Tablero · ${String(payload?.name || payload?.format || "").trim()}`.replace(/ · $/, "") || "Tablero Operativo";
  } else if (fileType === "process-audit") {
    const a = payload?.audit;
    periodLabel = `Auditoría · ${String(a?.area || a?.process || "").trim()}`.replace(/ · $/, "") || "Auditoría de Proceso";
    records = (a?.questions || []).length;
  } else if (fileType === "pdf-document") {
    periodLabel = `PDF · ${String(payload?.originalName || fileName).replace(/\.cop$/i, "")}`;
  } else if (fileType === "dashboard") {
    periodLabel = `Dashboard · ${String(payload?.label || payload?.period || "").trim()}`.replace(/ · $/, "") || "Snapshot Dashboard";
  } else {
    periodLabel = String(payload?.type || payload?.format || "Archivo .cop").trim() || "Archivo .cop";
  }
  return {
    id: `cop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: String(fileName || "archivo.cop"),
    importedAt: new Date().toISOString(),
    periodLabel,
    records,
    fileType,
    packageText: String(packageText || ""),
  };
}

function fileTypeChip(ft) {
  const map = {
    history: { label: "Historial", bg: "#e8f5e9", color: "#1b5e20" },
    board: { label: "Tablero", bg: "#e3f2fd", color: "#0d47a1" },
    "process-audit": { label: "Auditoría", bg: "#fff3e0", color: "#e65100" },
    "pdf-document": { label: "PDF", bg: "#fce4ec", color: "#880e4f" },
    dashboard: { label: "Dashboard", bg: "#ede7f6", color: "#311b92" },
    json: { label: "Datos", bg: "#f3f4f6", color: "#374151" },
  };
  return map[ft] || { label: "Archivo", bg: "#f3f4f6", color: "#374151" };
}

const MAX_FILES = 50;

// ── Component ─────────────────────────────────────────────────────────────

export default function Archivero({ currentUser, onUpdateCopmecFiles }) {
  const [tab, setTab] = useState("files");
  const [files, setFiles] = useState(() => normalizeArchiveroFiles(currentUser?.copmecHistoryFiles));
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfMsg, setPdfMsg] = useState("");

  const importRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    setFiles(normalizeArchiveroFiles(currentUser?.copmecHistoryFiles));
  }, [currentUser?.copmecHistoryFiles]);

  async function persistFiles(nextFiles) {
    setSaving(true);
    try {
      await onUpdateCopmecFiles(nextFiles);
      setFiles(normalizeArchiveroFiles(nextFiles));
    } finally {
      setSaving(false);
    }
  }

  // ── Importar .cop ─────────────────────────────────────────────────────

  async function handleImportChange(event) {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    try {
      const packageText = await file.text();
      const { payload, fileType } = await universalCopParser(packageText);
      const entry = buildArchiveroEntry({ packageText, payload, fileName: file.name, fileType });
      setPendingEntry(entry);
      setDecisionOpen(true);
    } catch (e) {
      setMessage(e?.message || "No se pudo abrir el archivo .cop.");
    }
  }

  async function confirmSavePending() {
    if (!pendingEntry) return;
    const nextFiles = [pendingEntry, ...files].slice(0, MAX_FILES);
    await persistFiles(nextFiles);
    setPendingEntry(null);
    setDecisionOpen(false);
    setMessage("Archivo guardado en el archivero.");
  }

  function discardPending() {
    setPendingEntry(null);
    setDecisionOpen(false);
  }

  // ── Abrir archivo guardado ────────────────────────────────────────────

  async function openFile(entry) {
    setMessage("");
    try {
      const { payload, fileType } = await universalCopParser(entry.packageText);
      setPreview({ ...entry, payload, fileType });
    } catch (e) {
      setMessage(e?.message || "No se pudo abrir el archivo.");
    }
  }

  // ── Borrar ────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    const nextFiles = files.filter((f) => f.id !== deleteTarget.id);
    await persistFiles(nextFiles);
    setDeleteTarget(null);
  }

  // ── PDF → .cop ────────────────────────────────────────────────────────

  function handlePdfFileChange(event) {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setPdfMsg("Solo se aceptan archivos PDF.");
      return;
    }
    setPdfFile(file);
    setPdfMsg("");
  }

  async function convertPdfToCop() {
    if (!pdfFile) return;
    setPdfConverting(true);
    setPdfMsg("");
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((b) => { binary += String.fromCharCode(b); });
      const base64Data = btoa(binary);
      const payload = {
        type: "pdf-document",
        originalName: pdfFile.name,
        size: pdfFile.size,
        importedAt: new Date().toISOString(),
        data: base64Data,
      };
      const packageText = await buildEncryptedCopmecPdfPackage(payload);
      const copName = pdfFile.name.replace(/\.pdf$/i, ".cop");
      const entry = buildArchiveroEntry({ packageText, payload, fileName: copName, fileType: "pdf-document" });
      const nextFiles = [entry, ...files].slice(0, MAX_FILES);
      await persistFiles(nextFiles);
      setPdfMsg("PDF convertido y guardado en el archivero.");
      setPdfFile(null);
      setTab("files");
    } catch (e) {
      setPdfMsg(e?.message || "Error al convertir el PDF.");
    } finally {
      setPdfConverting(false);
    }
  }

  function downloadOriginalPdf() {
    if (!preview?.payload?.data) return;
    try {
      const binary = atob(preview.payload.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = preview.payload.originalName || preview.fileName.replace(/\.cop$/i, ".pdf");
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("No se pudo recuperar el PDF original.");
    }
  }

  async function exportPreviewAsPdf() {
    if (!preview) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const { payload, fileType, fileName } = preview;
      const title = fileName.replace(/\.cop$/i, "");

      doc.setFontSize(14);
      doc.setTextColor(3, 33, 33);
      doc.text(title, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Exportado: ${new Date().toLocaleString("es-PE")}`, 14, 21);

      if (fileType === "history" && Array.isArray(payload?.rows) && payload.rows.length) {
        autoTable(doc, {
          startY: 26,
          head: [["Área", "Tablero", "Actividad", "Player", "Estado", "Fecha", "Inicio", "Fin", "Tiempo"]],
          body: payload.rows.map((r) => [r.area||"", r.tablero||"", r.actividad||"", r.player||"", r.estado||"", r.fecha||"", r.inicio||"", r.fin||"", r.tiempo||""]),
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [3, 33, 33], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 250, 249] },
        });
      } else if (fileType === "process-audit" && payload?.audit) {
        const a = payload.audit;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Área: ${a.area || ""} · Proceso: ${a.process || ""}`, 14, 28);
        const qs = Array.isArray(a.questions) ? a.questions : [];
        autoTable(doc, {
          startY: 34,
          head: [["#", "Pregunta", "Respuesta", "Observaciones"]],
          body: qs.map((q, i) => [i + 1, q.text || "", q.answer || "", q.observations || ""]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [3, 33, 33], textColor: 255 },
          columnStyles: { 1: { cellWidth: 80 } },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Tipo: ${fileType}`, 14, 30);
        doc.text(JSON.stringify(payload, null, 2).slice(0, 500), 14, 38, { maxWidth: 260 });
      }

      doc.save(`${title}.pdf`);
    } catch (err) {
      console.error(err);
      setMessage("No se pudo generar el PDF.");
    }
  }

  // ── Render preview ────────────────────────────────────────────────────

  function renderPreviewContent() {
    if (!preview) return null;
    const { payload, fileType } = preview;

    if (fileType === "history") {
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      return (
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
            {String(payload?.period?.label || "Historial")} · {rows.length} registros
          </p>
          {rows.length ? (
            <div className="table-wrap compact-table">
              <table className="history-table-clean">
                <thead>
                  <tr><th>Área</th><th>Tablero</th><th>Actividad</th><th>Player</th><th>Estado</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.area || "-"}</td><td>{row.tablero || "-"}</td><td>{row.actividad || "-"}</td>
                      <td>{row.player || "-"}</td><td>{row.estado || "-"}</td><td>{row.fecha || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: 0, color: "#aaa", fontSize: "0.83rem" }}>Sin registros en este historial.</p>
          )}
        </div>
      );
    }

    if (fileType === "process-audit") {
      const a = payload?.audit;
      const qs = Array.isArray(a?.questions) ? a.questions : [];
      return (
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
            Área: {a?.area || "-"} · Proceso: {a?.process || a?.subArea || "-"} · {qs.length} preguntas
          </p>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {qs.map((q, i) => (
              <div key={i} style={{ background: "#f8f9fa", borderRadius: "0.75rem", padding: "0.6rem 0.9rem" }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: "0.85rem" }}>{i + 1}. {q.text}</p>
                {q.answer !== undefined && (
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#555" }}>
                    Respuesta: {String(q.answer)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (fileType === "board") {
      return (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
            Tablero: {payload?.name || payload?.format || "-"}
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.82rem" }}>Exportado desde el Creador de Tableros.</p>
        </div>
      );
    }

    if (fileType === "pdf-document") {
      return (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>PDF: {payload?.originalName || preview.fileName}</p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.82rem" }}>
            Tamaño: {payload?.size ? `${(payload.size / 1024).toFixed(1)} KB` : "-"}
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.82rem" }}>
            Usa "Descargar PDF" para recuperar el archivo original.
          </p>
        </div>
      );
    }

    if (fileType === "dashboard") {
      return (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
            Snapshot del Dashboard · {payload?.label || payload?.period || "-"}
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "0.82rem" }}>Exportado desde el Panel de Indicadores.</p>
        </div>
      );
    }

    return <p style={{ margin: 0, color: "#aaa", fontSize: "0.85rem" }}>Tipo: {fileType}</p>;
  }

  const previewFooterActions = preview ? [
    <button key="pdf" type="button" className="ep-btn ep-btn--primary"
      onClick={preview.fileType === "pdf-document" ? downloadOriginalPdf : () => exportPreviewAsPdf()}>
      <Download size={14} style={{ marginRight: "0.3rem" }} />
      Descargar PDF
    </button>,
    <button key="cop" type="button" className="ep-btn ep-btn--ghost"
      onClick={() => triggerCopmecDownload(preview.packageText, preview.fileName)}>
      Descargar .cop
    </button>,
    <button key="close" type="button" className="ep-btn ep-btn--ghost" onClick={() => setPreview(null)}>Cerrar</button>,
  ] : [];

  // ── JSX ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#032121", borderRadius: "0.85rem", padding: "0.6rem", display: "flex", alignItems: "center" }}>
          <Archive size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#032121" }}>Archivero</h2>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#888" }}>
            Gestiona todos tus archivos .cop cifrados · {files.length} archivo{files.length !== 1 ? "s" : ""} guardado{files.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { id: "files", label: `Mis archivos (${files.length})` },
          { id: "pdf", label: "PDF → .cop" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ep-btn ${tab === t.id ? "ep-btn--primary" : "ep-btn--ghost"}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: "0.65rem 1rem", borderRadius: "0.75rem",
          background: message.toLowerCase().includes("error") || message.toLowerCase().includes("no se pudo") ? "#fff0f0" : "#f0faf0",
          color: message.toLowerCase().includes("error") || message.toLowerCase().includes("no se pudo") ? "#991b1b" : "#032121",
          fontSize: "0.84rem", marginBottom: "1rem"
        }}>
          {message}
        </div>
      )}

      {/* ── Tab: Mis archivos ─────────────────────────────────────────── */}
      {tab === "files" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button type="button" className="ep-btn ep-btn--primary" onClick={() => importRef.current?.click()}>
              <Upload size={14} style={{ marginRight: "0.4rem" }} />
              Importar .cop
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".cop,.copmec"
              style={{ display: "none" }}
              onChange={(e) => { void handleImportChange(e); }}
            />
          </div>

          {files.length ? (
            <div className="table-wrap compact-table">
              <table className="history-table-clean" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Registros</th>
                    <th>Guardado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((entry) => {
                    const chip = fileTypeChip(entry.fileType);
                    return (
                      <tr key={entry.id}>
                        <td style={{ fontSize: "0.82rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.fileName}
                        </td>
                        <td>
                          <span style={{
                            padding: "0.15rem 0.55rem", borderRadius: "999px",
                            background: chip.bg, color: chip.color,
                            fontSize: "0.76rem", fontWeight: 600,
                          }}>
                            {chip.label}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.81rem", color: "#555", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.periodLabel}
                        </td>
                        <td style={{ fontSize: "0.81rem", textAlign: "center", color: "#666" }}>
                          {entry.records || "—"}
                        </td>
                        <td style={{ fontSize: "0.77rem", color: "#888", whiteSpace: "nowrap" }}>
                          {new Date(entry.importedAt).toLocaleString("es-MX")}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            <button type="button" className="ep-btn ep-btn--ghost" style={{ padding: "0.2rem 0.55rem", fontSize: "0.78rem" }}
                              onClick={() => { void openFile(entry); }}>
                              <Eye size={13} style={{ marginRight: "0.25rem" }} />
                              Ver
                            </button>
                            <button type="button" className="ep-btn ep-btn--ghost" style={{ padding: "0.2rem 0.55rem", fontSize: "0.78rem" }}
                              onClick={() => triggerCopmecDownload(entry.packageText, entry.fileName)}>
                              <Download size={13} style={{ marginRight: "0.25rem" }} />
                              .cop
                            </button>
                            <button type="button" className="ep-btn ep-btn--danger" style={{ padding: "0.2rem 0.55rem", fontSize: "0.78rem" }}
                              onClick={() => setDeleteTarget(entry)} disabled={saving}>
                              <Trash2 size={13} style={{ marginRight: "0.25rem" }} />
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "3.5rem 1rem", color: "#bbb",
              background: "#fafafa", borderRadius: "1.25rem", border: "2px dashed #e5e7eb"
            }}>
              <Archive size={44} style={{ marginBottom: "0.85rem", opacity: 0.25 }} />
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 600, color: "#9ca3af" }}>
                No hay archivos guardados
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#d1d5db" }}>
                Importa un .cop desde cualquier módulo o convierte un PDF
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: PDF → .cop ───────────────────────────────────────────── */}
      {tab === "pdf" && (
        <div style={{ maxWidth: "520px", display: "grid", gap: "1.25rem" }}>
          <div style={{ background: "#f8f9fa", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <FileText size={20} color="#032121" />
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#032121" }}>Convertir PDF a .cop cifrado</p>
            </div>
            <p style={{ margin: "0 0 1.1rem", color: "#666", fontSize: "0.83rem", lineHeight: 1.5 }}>
              Selecciona cualquier PDF del sistema. Se cifrará con AES-GCM y se guardará como archivo
              <strong> .cop</strong> en tu archivero. Puedes recuperar el PDF original en cualquier momento.
            </p>

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: pdfFile ? "0.85rem" : 0 }}>
              <button type="button" className="ep-btn ep-btn--ghost" onClick={() => pdfRef.current?.click()}>
                <Upload size={14} style={{ marginRight: "0.4rem" }} />
                Seleccionar PDF
              </button>
              <input ref={pdfRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdfFileChange} />
              {pdfFile && (
                <span style={{ fontSize: "0.83rem", color: "#032121", fontWeight: 600 }}>
                  📄 {pdfFile.name}
                </span>
              )}
            </div>

            {pdfFile && (
              <button
                type="button"
                className="ep-btn ep-btn--primary"
                onClick={() => { void convertPdfToCop(); }}
                disabled={pdfConverting}
              >
                {pdfConverting ? "Convirtiendo y cifrando…" : "Convertir y guardar en archivero"}
              </button>
            )}
          </div>

          {pdfMsg && (
            <div style={{
              padding: "0.65rem 1rem", borderRadius: "0.75rem",
              background: pdfMsg.includes("Error") ? "#fff0f0" : "#f0faf0",
              color: pdfMsg.includes("Error") ? "#991b1b" : "#032121",
              fontSize: "0.84rem"
            }}>
              {pdfMsg}
            </div>
          )}

          <div style={{ background: "#f0f9ff", borderRadius: "0.9rem", padding: "1rem 1.1rem", fontSize: "0.8rem", color: "#0369a1" }}>
            <strong>Tipos de archivo .cop soportados para importar:</strong>
            <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.8 }}>
              <li>Historial de tableros operativos</li>
              <li>Tableros exportados desde el Creador</li>
              <li>Auditorías de proceso</li>
              <li>PDFs convertidos</li>
              <li>Snapshots del Dashboard</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Modales ───────────────────────────────────────────────────── */}

      <Modal
        open={Boolean(preview)}
        title={`Vista — ${preview?.fileName || "archivo.cop"}`}
        confirmLabel="Cerrar"
        hideCancel
        onClose={() => setPreview(null)}
        className="archivero-preview-modal"
        footerActions={previewFooterActions}
      >
        <div className="ep-body">{renderPreviewContent()}</div>
      </Modal>

      <Modal
        open={decisionOpen}
        title="Guardar en archivero"
        confirmLabel="Guardar"
        cancelLabel="Cancelar"
        onConfirm={() => { void confirmSavePending(); }}
        onCancel={discardPending}
        onClose={discardPending}
      >
        <div className="ep-body" style={{ display: "grid", gap: "0.5rem" }}>
          <p className="ep-footnote" style={{ margin: 0 }}>
            ¿Guardar <strong>{pendingEntry?.fileName}</strong> en el archivero?
          </p>
          {pendingEntry && (
            <p className="ep-footnote" style={{ margin: 0, color: "#888" }}>
              Tipo: {fileTypeChip(pendingEntry.fileType).label} · {pendingEntry.periodLabel}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Borrar archivo"
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onConfirm={() => { void confirmDelete(); }}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
      >
        <div className="ep-body">
          <p className="ep-footnote" style={{ margin: 0 }}>
            ¿Borrar <strong>{deleteTarget?.fileName}</strong> del archivero? Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
}
