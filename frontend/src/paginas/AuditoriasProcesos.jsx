import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { uploadFileToCloudinary } from "../services/upload.service";

function emptyTemplateDraft() {
  return {
    id: "",
    area: "",
    process: "",
    questions: [
      { id: crypto.randomUUID(), type: "yesno", text: "", required: true, placeholder: "" },
    ],
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

export default function AuditoriasProcesos({ contexto }) {
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
    addProcessAuditEvidence,
    removeProcessAuditEvidence,
    pushAppToast,
    auditShortcutPreset,
  } = contexto;

  const canManageAudits = Boolean(actionPermissions?.manageProcessAudits);
  const canManageTemplates = Boolean(actionPermissions?.manageProcessAuditTemplates);

  const [activeTab, setActiveTab] = useState("auditoria");
  const [templateDraft, setTemplateDraft] = useState(() => emptyTemplateDraft());
  const [newAuditArea, setNewAuditArea] = useState("");
  const [newAuditProcess, setNewAuditProcess] = useState("");
  const [newAuditTemplateId, setNewAuditTemplateId] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [auditDraft, setAuditDraft] = useState(null);
  const [isAuditDirty, setIsAuditDirty] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const areaOptions = useMemo(() => {
    const fromCatalog = Array.isArray(rootAreaOptions) ? rootAreaOptions : [];
    const fromTemplates = (processAuditTemplates || []).map((item) => item.area);
    const merged = Array.from(new Set([...fromCatalog, ...fromTemplates].filter(Boolean)));
    return merged.sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [processAuditTemplates, rootAreaOptions]);

  const processOptionsForArea = useMemo(() => {
    const byArea = new Map();
    (processAuditTemplates || []).forEach((item) => {
      const area = String(item.area || "").trim();
      const process = String(item.process || "").trim();
      if (!area || !process) return;
      if (!byArea.has(area)) byArea.set(area, new Set());
      byArea.get(area).add(process);
    });

    return Object.fromEntries(Array.from(byArea.entries()).map(([area, values]) => [area, Array.from(values).sort((a, b) => a.localeCompare(b, "es-MX"))]));
  }, [processAuditTemplates]);

  const templateCandidates = useMemo(() => {
    if (!newAuditArea) return [];
    return (processAuditTemplates || []).filter((entry) => entry.area === newAuditArea && (!newAuditProcess || entry.process === newAuditProcess));
  }, [newAuditArea, newAuditProcess, processAuditTemplates]);

  const sortedAudits = useMemo(
    () => [...(processAudits || [])].sort((left, right) => Date.parse(right.startedAt || right.updatedAt || "") - Date.parse(left.startedAt || left.updatedAt || "")),
    [processAudits],
  );

  const selectedAudit = useMemo(
    () => sortedAudits.find((entry) => entry.id === selectedAuditId) || sortedAudits[0] || null,
    [selectedAuditId, sortedAudits],
  );

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
    setIsAuditDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudit?.id]);

  useEffect(() => {
    const requestedTab = String(auditShortcutPreset?.tab || "").trim();
    if (!requestedTab) return;
    if (["auditoria", "problemas", "propuestas", "seguimiento"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [auditShortcutPreset]);

  useEffect(() => {
    if (!auditShortcutPreset?.tab) return;
    const timer = setTimeout(() => {
      if (typeof contexto.setAuditShortcutPreset === "function") {
        contexto.setAuditShortcutPreset(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [auditShortcutPreset, contexto]);

  useEffect(() => {
    if (!auditDraft || !isAuditDirty || !canManageAudits) return undefined;

    const timer = setTimeout(async () => {
      try {
        await updateProcessAudit(auditDraft.id, {
          area: auditDraft.area,
          process: auditDraft.process,
          notes: auditDraft.notes || "",
          status: auditDraft.status,
          questions: (auditDraft.questions || []).map((question) => ({
            id: question.id,
            type: question.type,
            text: question.text,
            required: question.required,
            placeholder: question.placeholder,
            answer: question.answer,
          })),
        });
        setIsAuditDirty(false);
      } catch {
        // El usuario todavía puede guardar de forma manual; evita ruido en cada tecleo.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [auditDraft, canManageAudits, isAuditDirty, updateProcessAudit]);

  const dashboardStats = useMemo(() => {
    const total = sortedAudits.length;
    const closed = sortedAudits.filter((entry) => entry.status === "closed").length;
    const open = total - closed;
    const totalDuration = sortedAudits.reduce((sum, entry) => sum + getAuditDurationSeconds(entry), 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    const byAreaMap = new Map();
    sortedAudits.forEach((entry) => {
      const area = entry.area || "Sin área";
      byAreaMap.set(area, (byAreaMap.get(area) || 0) + 1);
    });

    const byArea = Array.from(byAreaMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);

    return { total, closed, open, avgDuration, byArea };
  }, [sortedAudits]);

  async function handleSaveTemplate() {
    if (!canManageTemplates) return;

    const normalizedQuestions = (templateDraft.questions || [])
      .map((question) => ({
        ...question,
        text: String(question.text || "").trim(),
        placeholder: String(question.placeholder || "").trim(),
      }))
      .filter((question) => question.text);

    if (!templateDraft.area.trim() || !templateDraft.process.trim() || !normalizedQuestions.length) {
      pushAppToast("Completa área, proceso y al menos una pregunta para guardar la plantilla.", "warning");
      return;
    }

    try {
      await upsertProcessAuditTemplate({
        id: templateDraft.id || undefined,
        area: templateDraft.area.trim(),
        process: templateDraft.process.trim(),
        questions: normalizedQuestions,
      });
      setTemplateDraft(emptyTemplateDraft());
      pushAppToast("Plantilla guardada correctamente.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la plantilla.", "danger");
    }
  }

  async function handleCreateAudit() {
    if (!canManageAudits) return;
    if (!newAuditArea.trim() || !newAuditProcess.trim()) {
      pushAppToast("Selecciona área y proceso para crear la auditoría.", "warning");
      return;
    }

    const template = (processAuditTemplates || []).find((entry) => entry.id === newAuditTemplateId) || null;

    try {
      const createdAuditId = await createProcessAudit({
        area: newAuditArea.trim(),
        process: newAuditProcess.trim(),
        templateId: template?.id || null,
        questions: template ? undefined : [{ type: "yesno", text: "¿Cumple con el estándar definido?", required: true }],
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
        questions: auditDraft.questions || [],
      });
      pushAppToast("Auditoría cerrada correctamente.", "success");
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

  return (
    <section className="page-grid">
      <article className="surface-card full-width table-card">
        <div className="card-header-row">
          <div>
            <h3>
              {activeTab === "auditoria" ? "Auditoría" : activeTab === "problemas" ? "Problemas" : activeTab === "propuestas" ? "Propuestas" : "Seguimiento"}
            </h3>
            <p>
              {activeTab === "auditoria"
                ? "Captura y edición de auditorías de proceso."
                : activeTab === "problemas"
                  ? "Hallazgos y problemas detectados en auditorías."
                  : activeTab === "propuestas"
                    ? "Propuestas de mejora y plantillas asociadas."
                    : "Seguimiento y métricas consolidadas de auditorías."}
            </p>
          </div>
        </div>
      </article>

      {activeTab === "auditoria" ? (
        <>
          <article className="surface-card table-card">
            <div className="card-header-row">
              <div>
                <h3>Crear auditoría de proceso</h3>
                <p>Selecciona área, proceso y plantilla para iniciar una nueva auditoría.</p>
              </div>
            </div>
            <div className="modal-form-grid">
              <label className="app-modal-field">
                <span>Área</span>
                <select value={newAuditArea} onChange={(event) => { setNewAuditArea(event.target.value); setNewAuditProcess(""); setNewAuditTemplateId(""); }}>
                  <option value="">Selecciona área</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <label className="app-modal-field">
                <span>Proceso</span>
                <input
                  list="audit-process-options"
                  value={newAuditProcess}
                  onChange={(event) => { setNewAuditProcess(event.target.value); setNewAuditTemplateId(""); }}
                  placeholder="Ej: Recepción"
                />
                <datalist id="audit-process-options">
                  {(processOptionsForArea[newAuditArea] || []).map((process) => <option key={process} value={process} />)}
                </datalist>
              </label>
              <label className="app-modal-field">
                <span>Plantilla</span>
                <select value={newAuditTemplateId} onChange={(event) => setNewAuditTemplateId(event.target.value)}>
                  <option value="">Sin plantilla (manual)</option>
                  {templateCandidates.map((template) => <option key={template.id} value={template.id}>{template.process} · {template.questions?.length || 0} preguntas</option>)}
                </select>
              </label>
              <div className="saved-board-list board-builder-launch-list">
                <button type="button" className="primary-button" onClick={handleCreateAudit} disabled={!canManageAudits}><Plus size={16} /> Iniciar auditoría</button>
              </div>
            </div>
          </article>

          <article className="surface-card table-card">
            <div className="card-header-row">
              <div>
                <h3>Plantillas por proceso</h3>
                <p>Puedes crear, mejorar o eliminar preguntas según el proceso auditado.</p>
              </div>
            </div>
            <div className="modal-form-grid">
              <label className="app-modal-field">
                <span>Área</span>
                <input value={templateDraft.area} onChange={(event) => setTemplateDraft((current) => ({ ...current, area: event.target.value }))} placeholder="Ej: Inventario" />
              </label>
              <label className="app-modal-field">
                <span>Proceso</span>
                <input value={templateDraft.process} onChange={(event) => setTemplateDraft((current) => ({ ...current, process: event.target.value }))} placeholder="Ej: Acomodo" />
              </label>
              {(templateDraft.questions || []).map((question, index) => (
                <article key={question.id} className="surface-card">
                  <div className="card-header-row">
                    <strong>Pregunta {index + 1}</strong>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => setTemplateDraft((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }))}
                      disabled={!canManageTemplates || templateDraft.questions.length <= 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="modal-form-grid">
                    <label className="app-modal-field">
                      <span>Tipo</span>
                      <select
                        value={question.type}
                        onChange={(event) => setTemplateDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) => (item.id === question.id ? { ...item, type: event.target.value === "text" ? "text" : "yesno" } : item)),
                        }))}
                      >
                        <option value="yesno">Sí / No</option>
                        <option value="text">Texto</option>
                      </select>
                    </label>
                    <label className="app-modal-field">
                      <span>Pregunta</span>
                      <input
                        value={question.text}
                        onChange={(event) => setTemplateDraft((current) => ({
                          ...current,
                          questions: current.questions.map((item) => (item.id === question.id ? { ...item, text: event.target.value } : item)),
                        }))}
                        placeholder="Escribe la pregunta"
                      />
                    </label>
                    {question.type === "text" ? (
                      <label className="app-modal-field">
                        <span>Placeholder</span>
                        <input
                          value={question.placeholder || ""}
                          onChange={(event) => setTemplateDraft((current) => ({
                            ...current,
                            questions: current.questions.map((item) => (item.id === question.id ? { ...item, placeholder: event.target.value } : item)),
                          }))}
                          placeholder="Texto de ayuda"
                        />
                      </label>
                    ) : null}
                  </div>
                </article>
              ))}
              <div className="saved-board-list board-builder-launch-list">
                <button type="button" className="icon-button" onClick={() => setTemplateDraft((current) => ({ ...current, questions: [...current.questions, { id: crypto.randomUUID(), type: "yesno", text: "", required: true, placeholder: "" }] }))} disabled={!canManageTemplates}>
                  <Plus size={15} /> Agregar pregunta
                </button>
                <button type="button" className="primary-button" onClick={handleSaveTemplate} disabled={!canManageTemplates}><Save size={16} /> Guardar plantilla</button>
              </div>
              <div className="saved-board-list permissions-preset-list">
                {(processAuditTemplates || []).map((template) => (
                  <article key={template.id} className="surface-card" style={{ minWidth: "min(100%, 280px)", flex: "1 1 280px" }}>
                    <div className="card-header-row">
                      <div>
                        <strong>{template.area} · {template.process}</strong>
                        <p>{template.questions?.length || 0} preguntas</p>
                      </div>
                      <div className="saved-board-list board-builder-launch-list">
                        <button type="button" className="icon-button" onClick={() => setTemplateDraft({ ...template, questions: (template.questions || []).map((question) => ({ ...question })) })} disabled={!canManageTemplates}><Check size={15} /></button>
                        <button type="button" className="icon-button danger" onClick={() => deleteProcessAuditTemplate(template.id)} disabled={!canManageTemplates}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </article>

          <article className="surface-card table-card full-width">
            <div className="card-header-row">
              <div>
                <h3>Auditoría activa</h3>
                <p>Todo cambio se guarda automáticamente en la auditoría seleccionada.</p>
              </div>
            </div>
            {!auditDraft ? (
              <p className="subtle-line">No hay auditorías registradas todavía.</p>
            ) : (
              <div className="modal-form-grid">
                <label className="app-modal-field">
                  <span>Notas generales</span>
                  <input value={auditDraft.notes || ""} onChange={(event) => { setAuditDraft((current) => ({ ...current, notes: event.target.value })); setIsAuditDirty(true); }} placeholder="Observaciones globales" />
                </label>
                {(auditDraft.questions || []).map((question, index) => (
                  <article key={question.id} className="surface-card">
                    <div className="card-header-row">
                      <strong>{index + 1}. {question.text}</strong>
                    </div>
                    {question.type === "yesno" ? (
                      <div className="saved-board-list board-builder-launch-list">
                        <button
                          type="button"
                          className={question.answer === true ? "primary-button" : "icon-button"}
                          onClick={() => {
                            setAuditDraft((current) => ({
                              ...current,
                              questions: current.questions.map((item) => (item.id === question.id ? { ...item, answer: true } : item)),
                            }));
                            setIsAuditDirty(true);
                          }}
                        >
                          <Check size={15} /> Sí
                        </button>
                        <button
                          type="button"
                          className={question.answer === false ? "primary-button" : "icon-button"}
                          onClick={() => {
                            setAuditDraft((current) => ({
                              ...current,
                              questions: current.questions.map((item) => (item.id === question.id ? { ...item, answer: false } : item)),
                            }));
                            setIsAuditDirty(true);
                          }}
                        >
                          <X size={15} /> No
                        </button>
                      </div>
                    ) : (
                      <label className="app-modal-field">
                        <span>Respuesta</span>
                        <input
                          value={String(question.answer || "")}
                          onChange={(event) => {
                            setAuditDraft((current) => ({
                              ...current,
                              questions: current.questions.map((item) => (item.id === question.id ? { ...item, answer: event.target.value } : item)),
                            }));
                            setIsAuditDirty(true);
                          }}
                          placeholder={question.placeholder || "Escribe tu respuesta"}
                        />
                      </label>
                    )}
                  </article>
                ))}
                <div className="saved-board-list board-builder-launch-list">
                  <label className="icon-button" style={{ cursor: uploadingEvidence ? "not-allowed" : "pointer", opacity: uploadingEvidence ? 0.6 : 1 }}>
                    <Upload size={15} /> {uploadingEvidence ? "Subiendo..." : "Agregar evidencia"}
                    <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleUploadEvidence} disabled={uploadingEvidence || !canManageAudits} />
                  </label>
                  <button type="button" className="primary-button" onClick={handleCloseAudit} disabled={!canManageAudits || auditDraft.status === "closed"}>Cerrar auditoría</button>
                </div>
                <div className="saved-board-list permissions-preset-list">
                  {(auditDraft.evidences || []).map((evidence) => (
                    <article key={evidence.id} className="surface-card" style={{ minWidth: "min(100%, 240px)", flex: "1 1 240px" }}>
                      <div className="card-header-row">
                        <a href={evidence.url} target="_blank" rel="noreferrer">{evidence.name || "Evidencia"}</a>
                        <button type="button" className="icon-button danger" onClick={() => removeProcessAuditEvidence(auditDraft.id, evidence.id)} disabled={!canManageAudits}><Trash2 size={14} /></button>
                      </div>
                      <p className="subtle-line">{formatDateTime(evidence.createdAt)}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </article>
        </>
      ) : null}

      {activeTab === "problemas" ? (
        <article className="surface-card table-card full-width">
          <div className="card-header-row">
            <div>
              <h3>Problemas detectados</h3>
              <p>Consulta auditorías realizadas y reabre cualquiera para revisar hallazgos, respuestas y evidencias.</p>
            </div>
          </div>
          <div className="saved-board-list permissions-preset-list">
            {sortedAudits.map((audit) => (
              <article key={audit.id} className="surface-card" style={{ minWidth: "min(100%, 280px)", flex: "1 1 320px" }}>
                <div className="card-header-row">
                  <div>
                    <strong>{audit.area} · {audit.process}</strong>
                    <p>{audit.auditorName || currentUser?.name || "Sin auditor"}</p>
                  </div>
                  <span className={audit.status === "closed" ? "chip success" : "chip warning"}>{audit.status === "closed" ? "Cerrada" : "Abierta"}</span>
                </div>
                <p className="subtle-line">Inicio: {formatDateTime(audit.startedAt)}</p>
                <p className="subtle-line">Duración: {formatDuration(getAuditDurationSeconds(audit))}</p>
                <p className="subtle-line">Preguntas: {(audit.questions || []).length} · Evidencias: {(audit.evidences || []).length}</p>
                <div className="saved-board-list board-builder-launch-list">
                  <button type="button" className="icon-button" onClick={() => { setSelectedAuditId(audit.id); setActiveTab("auditoria"); }}>Abrir</button>
                </div>
              </article>
            ))}
            {!sortedAudits.length ? <p className="subtle-line">Todavía no hay auditorías en historial.</p> : null}
          </div>
        </article>
      ) : null}

      {activeTab === "seguimiento" ? (
        <article className="surface-card table-card full-width">
          <div className="card-header-row">
            <div>
              <h3>Seguimiento</h3>
              <p>Métrica por auditoría y consolidado general de procesos auditados.</p>
            </div>
            <BarChart3 size={18} />
          </div>
          <div className="inventory-stat-grid inventory-stat-grid-collapsed">
            <article className="surface-card"><strong>{dashboardStats.total}</strong><p>Total auditorías</p></article>
            <article className="surface-card"><strong>{dashboardStats.closed}</strong><p>Auditorías cerradas</p></article>
            <article className="surface-card"><strong>{dashboardStats.open}</strong><p>Auditorías abiertas</p></article>
            <article className="surface-card"><strong>{formatDuration(dashboardStats.avgDuration)}</strong><p>Tiempo promedio</p></article>
          </div>
          <div className="saved-board-list permissions-preset-list">
            {dashboardStats.byArea.map((row) => {
              const pct = dashboardStats.total > 0 ? Math.round((row.value / dashboardStats.total) * 100) : 0;
              return (
                <article key={row.label} className="surface-card" style={{ minWidth: "min(100%, 260px)", flex: "1 1 280px" }}>
                  <div className="card-header-row">
                    <strong>{row.label}</strong>
                    <span className="chip primary">{row.value}</span>
                  </div>
                  <div className="inventory-stock-bar">
                    <div className="inventory-stock-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="subtle-line">{pct}% del total de auditorías</p>
                </article>
              );
            })}
            {!dashboardStats.byArea.length ? <p className="subtle-line">No hay datos para mostrar en el dashboard.</p> : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
