import { useEffect, useMemo, useRef, useState } from "react";
import { uploadFileToCloudinary } from "../services/upload.service";
import { FileText, Trash2, Plus, X } from "lucide-react";

function isImageEvidence(evidence) {
  const type = String(evidence?.type || "").toLowerCase();
  return type.startsWith("image");
}

function isVideoEvidence(evidence) {
  const type = String(evidence?.type || "").toLowerCase();
  return type.startsWith("video");
}

function createTransportModalState(areaId = "") {
  return {
    open: false,
    mode: "create",
    recordId: "",
    areaId,
    destination: "",
    boxes: "",
    pieces: "",
    notes: "",
    evidence: null,
  };
}

function createDocModalState() {
  return {
    open: false,
    mode: "create",
    recordId: "",
    ubicacion: "SONATA",
    area: "",
    dirigidoA: "",
    notas: "",
    document: null,
    evidence: null,
  };
}

export default function GestionTransporte({ contexto }) {
  const {
    transportState,
    createTransportRecord,
    updateTransportRecord,
    actionPermissions,
    Modal,
    formatDateTime,
    documentacionState,
    createDocumentacionRecord,
    updateDocumentacionRecord,
    addDocumentacionArea,
    deleteDocumentacionArea,
  } = contexto;

  const getTransportPermissionIds = (areaId) => {
    const normalizedAreaId = String(areaId || "").trim();
    if (normalizedAreaId === "foraneas" || normalizedAreaId === "locales") {
      return { view: "viewTransportRetail", manage: "manageTransportRetail" };
    }
    if (normalizedAreaId === "pedidos") {
      return { view: "viewTransportPedidos", manage: "manageTransportPedidos" };
    }
    if (normalizedAreaId === "inventarioTraslados") {
      return { view: "viewTransportInventario", manage: "manageTransportInventario" };
    }
    return { view: "", manage: "" };
  };

  const canViewTransportArea = (areaId) => {
    const ids = getTransportPermissionIds(areaId);
    if (!ids.view) return false;
    return Boolean(actionPermissions?.[ids.view]);
  };

  const canManageTransportArea = (areaId) => {
    const ids = getTransportPermissionIds(areaId);
    if (!ids.manage) return false;
    return Boolean(actionPermissions?.[ids.manage]);
  };

  const areaConfig = (Array.isArray(transportState?.config) ? transportState.config : []).filter((area) => canViewTransportArea(area.id));
  const areaGroups = useMemo(() => {
    const groupMap = new Map();
    areaConfig.forEach((area) => {
      const groupId = String(area?.groupId || area?.id || "").trim();
      if (!groupId) return;
      const groupLabel = String(area?.groupLabel || area?.label || groupId).trim();
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, { id: groupId, label: groupLabel, areas: [] });
      }
      groupMap.get(groupId).areas.push(area);
    });
    return Array.from(groupMap.values());
  }, [areaConfig]);
  const firstGroupId = areaGroups[0]?.id || "";
  const firstAreaId = areaGroups[0]?.areas?.[0]?.id || "";
  const [selectedGroupId, setSelectedGroupId] = useState(firstGroupId);
  const [selectedAreaId, setSelectedAreaId] = useState(firstAreaId);
  const [selectedViewTab, setSelectedViewTab] = useState("active");
  const [selectedMainTab, setSelectedMainTab] = useState("transporte");
  const [transportModal, setTransportModal] = useState(createTransportModalState(firstAreaId));
  const [evidenceViewer, setEvidenceViewer] = useState({ open: false, evidence: null, title: "" });
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Documentación state
  const [docModal, setDocModal] = useState(createDocModalState());
  const [docEvidenceViewer, setDocEvidenceViewer] = useState({ open: false, evidence: null, title: "" });
  const [uploadingDocFile, setUploadingDocFile] = useState(false);
  const [uploadingDocEvidence, setUploadingDocEvidence] = useState(false);
  const docFileInputRef = useRef(null);
  const docEvidenceInputRef = useRef(null);
  const docEvidenceCameraRef = useRef(null);
  const [newAreaDraft, setNewAreaDraft] = useState("");
  const [docFilterUbicacion, setDocFilterUbicacion] = useState("ALL");
  const [docFilterArea, setDocFilterArea] = useState("ALL");

  const selectedGroup = useMemo(
    () => areaGroups.find((group) => group.id === selectedGroupId) || areaGroups[0] || null,
    [areaGroups, selectedGroupId],
  );
  const selectedAreaOptions = selectedGroup?.areas || [];

  const selectedArea = useMemo(
    () => selectedAreaOptions.find((item) => item.id === selectedAreaId) || selectedAreaOptions[0] || areaConfig[0] || null,
    [areaConfig, selectedAreaId, selectedAreaOptions],
  );
  const canManageSelectedArea = canManageTransportArea(selectedArea?.id);

  useEffect(() => {
    if (selectedGroupId) return;
    if (!firstGroupId) return;
    setSelectedGroupId(firstGroupId);
  }, [firstGroupId, selectedGroupId]);

  useEffect(() => {
    if (!selectedAreaOptions.length) return;
    if (selectedAreaOptions.some((entry) => entry.id === selectedAreaId)) return;
    setSelectedAreaId(selectedAreaOptions[0].id);
  }, [selectedAreaId, selectedAreaOptions]);

  const activeRecords = useMemo(
    () => (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => record.areaId === selectedArea?.id),
    [selectedArea?.id, transportState?.activeRecords],
  );

  const historyRecords = useMemo(
    () => (Array.isArray(transportState?.historyRecords) ? transportState.historyRecords : [])
      .filter((record) => record.areaId === selectedArea?.id),
    [selectedArea?.id, transportState?.historyRecords],
  );

  function openCreateModal() {
    setTransportModal({
      ...createTransportModalState(selectedArea?.id || ""),
      open: true,
      destination: selectedArea?.destinations?.[0] || "",
    });
  }

  function openEditModal(record) {
    setTransportModal({
      open: true,
      mode: "edit",
      recordId: String(record?.id || "").trim(),
      areaId: String(record?.areaId || selectedArea?.id || "").trim(),
      destination: String(record?.destination || "").trim(),
      boxes: String(record?.boxes ?? ""),
      pieces: String(record?.pieces ?? ""),
      notes: String(record?.notes || "").trim(),
      evidence: record?.evidence || null,
    });
  }

  function openEvidenceViewer(record) {
    if (!record?.evidence?.url) return;
    setEvidenceViewer({
      open: true,
      evidence: record.evidence,
      title: record.destination || "Evidencia del envio",
    });
  }

  function closeEvidenceViewer() {
    setEvidenceViewer({ open: false, evidence: null, title: "" });
  }

  async function handleUploadEvidence(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    try {
      const uploaded = await uploadFileToCloudinary(file);
      setTransportModal((current) => ({
        ...current,
        evidence: {
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
          name: uploaded.originalName || file.name,
          type: uploaded.resourceType || file.type || "image",
        },
      }));
    } finally {
      setUploadingEvidence(false);
      event.target.value = "";
    }
  }

  async function submitTransportModal() {
    if (!canManageTransportArea(transportModal.areaId)) return;
    const payload = {
      areaId: transportModal.areaId,
      destination: transportModal.destination,
      boxes: Number(transportModal.boxes || 0),
      pieces: Number(transportModal.pieces || 0),
      notes: transportModal.notes.trim(),
      evidence: transportModal.evidence,
    };

    if (!payload.areaId || !payload.destination || !payload.evidence?.url) return;

    if (transportModal.mode === "create") {
      await createTransportRecord(payload);
    } else {
      await updateTransportRecord(transportModal.recordId, payload);
    }

    setTransportModal(createTransportModalState(selectedArea?.id || ""));
  }

  function renderEvidenceCell(record) {
    const evidence = record?.evidence;
    if (!evidence?.url) return <span className="subtle-line">Sin evidencia</span>;

    if (isImageEvidence(evidence)) {
      return (
        <button type="button" className="transport-evidence-thumb" onClick={() => openEvidenceViewer(record)}>
          <img src={evidence.thumbnailUrl || evidence.url} alt={evidence.name || `Evidencia ${record.destination || ""}`.trim()} />
        </button>
      );
    }

    if (isVideoEvidence(evidence)) {
      return (
        <button type="button" className="transport-evidence-thumb transport-evidence-thumb-video" onClick={() => openEvidenceViewer(record)}>
          <video src={evidence.url} poster={evidence.thumbnailUrl || undefined} muted playsInline preload="metadata" />
          <span>Video</span>
        </button>
      );
    }

    return (
      <a href={evidence.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
        {evidence.name || "Abrir archivo"}
      </a>
    );
  }

  // ── Documentación helpers ─────────────────────────────────────────
  const docRecords = useMemo(() => {
    const all = Array.isArray(documentacionState?.records) ? documentacionState.records : [];
    return all
      .filter((r) => docFilterUbicacion === "ALL" || r.ubicacion === docFilterUbicacion)
      .filter((r) => docFilterArea === "ALL" || r.area === docFilterArea);
  }, [documentacionState, docFilterUbicacion, docFilterArea]);

  const customAreas = Array.isArray(documentacionState?.customAreas) ? documentacionState.customAreas : [];

  function openCreateDocModal() {
    setDocModal({ ...createDocModalState(), open: true });
  }

  function openEditDocModal(record) {
    setDocModal({
      open: true,
      mode: "edit",
      recordId: record.id,
      ubicacion: record.ubicacion || "SONATA",
      area: record.area || "",
      dirigidoA: record.dirigidoA || "",
      notas: record.notas || "",
      document: record.document || null,
      evidence: record.evidence || null,
    });
  }

  async function handleUploadDocFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingDocFile(true);
    try {
      const uploaded = await uploadFileToCloudinary(file);
      setDocModal((prev) => ({
        ...prev,
        document: {
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
          name: uploaded.originalName || file.name,
          type: uploaded.resourceType || file.type || "application",
        },
      }));
    } finally {
      setUploadingDocFile(false);
      event.target.value = "";
    }
  }

  async function handleUploadDocEvidence(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingDocEvidence(true);
    try {
      const uploaded = await uploadFileToCloudinary(file);
      setDocModal((prev) => ({
        ...prev,
        evidence: {
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
          name: uploaded.originalName || file.name,
          type: uploaded.resourceType || file.type || "image",
        },
      }));
    } finally {
      setUploadingDocEvidence(false);
      event.target.value = "";
    }
  }

  async function submitDocModal() {
    const payload = {
      ubicacion: docModal.ubicacion,
      area: docModal.area.trim(),
      dirigidoA: docModal.dirigidoA.trim(),
      notas: docModal.notas.trim(),
      document: docModal.document,
      evidence: docModal.evidence,
    };
    if (!payload.area || !payload.dirigidoA || !payload.document?.url) return;
    if (docModal.mode === "create") {
      await createDocumentacionRecord(payload);
    } else {
      await updateDocumentacionRecord(docModal.recordId, payload);
    }
    setDocModal(createDocModalState());
  }

  async function handleAddArea() {
    const name = newAreaDraft.trim();
    if (!name) return;
    await addDocumentacionArea(name);
    setNewAreaDraft("");
  }

  function renderDocFileCell(record, field = "document") {
    const file = record?.[field];
    if (!file?.url) return <span className="subtle-line">—</span>;
    if (isImageEvidence(file)) {
      return (
        <button type="button" className="transport-evidence-thumb" onClick={() => setDocEvidenceViewer({ open: true, evidence: file, title: field === "document" ? "Documento" : "Evidencia" })}>
          <img src={file.thumbnailUrl || file.url} alt={file.name || ""} />
        </button>
      );
    }
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
        <FileText size={14} style={{ marginRight: "0.25rem" }} />{file.name || "Abrir"}
      </a>
    );
  }

  return (
    <section className="page-shell inventory-page-shell">
      <section className="inventory-stack">
        <article className="surface-card inventory-surface-card full-width">
          <div className="card-header-row" style={{ alignItems: "center" }}>
            <div>
              <h3>Control de Transporte</h3>
              <p>Captura diaria por area. Al cambiar de dia, los registros pasan automaticamente al historial.</p>
            </div>
            <span className="chip">Dia activo: {transportState?.activeDateKey || "-"}</span>
          </div>

          {/* Main tabs: Transporte / Documentación */}
          <div className="transport-view-tabs" style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className={`transport-view-tab ${selectedMainTab === "transporte" ? "is-active" : ""}`}
              onClick={() => setSelectedMainTab("transporte")}
            >
              Transporte
            </button>
            <button
              type="button"
              className={`transport-view-tab ${selectedMainTab === "documentacion" ? "is-active" : ""}`}
              onClick={() => setSelectedMainTab("documentacion")}
            >
              Documentación
            </button>
          </div>

          {/* ── TRANSPORTE TAB ── */}
          {selectedMainTab === "transporte" ? (
            <>
              <div className="saved-board-list board-builder-launch-list" style={{ marginBottom: "0.45rem" }}>
                {areaGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className="chip"
                    onClick={() => setSelectedGroupId(group.id)}
                    style={{
                      border: group.id === selectedGroup?.id ? "1px solid rgba(3,33,33,0.36)" : "1px solid rgba(162,170,181,0.25)",
                      background: group.id === selectedGroup?.id ? "rgba(3,33,33,0.08)" : "#fff",
                      color: "#032121",
                      cursor: "pointer",
                    }}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {selectedAreaOptions.length > 1 ? (
                <div className="saved-board-list board-builder-launch-list" style={{ marginBottom: "0.8rem" }}>
                  {selectedAreaOptions.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="chip"
                      onClick={() => setSelectedAreaId(area.id)}
                      style={{
                        border: area.id === selectedArea?.id ? "1px solid rgba(3,33,33,0.36)" : "1px solid rgba(162,170,181,0.25)",
                        background: area.id === selectedArea?.id ? "rgba(3,33,33,0.08)" : "#fff",
                        color: "#032121",
                        cursor: "pointer",
                      }}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="card-header-row" style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>{selectedArea?.label || "Area"}</h3>
                <button type="button" className="primary-button" onClick={openCreateModal} disabled={!canManageSelectedArea || !selectedArea}>Crear registro de envio</button>
              </div>

              <div className="transport-view-tabs" style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedViewTab === "active" ? "is-active" : ""}`}
                  onClick={() => setSelectedViewTab("active")}
                >
                  Registros de hoy
                </button>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedViewTab === "history" ? "is-active" : ""}`}
                  onClick={() => setSelectedViewTab("history")}
                >
                  Historial
                </button>
              </div>

              <div className="table-wrap">
                <table className="inventory-table-clean">
                  <thead>
                    <tr>
                      {selectedViewTab === "history" ? <th>Fecha</th> : null}
                      <th>Destino</th>
                      <th>Cajas</th>
                      <th>Piezas</th>
                      <th>Evidencia</th>
                      <th>{selectedViewTab === "history" ? "Ultima actualizacion" : "Capturado"}</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedViewTab === "history" ? historyRecords : activeRecords).map((record) => (
                      <tr key={record.id}>
                        {selectedViewTab === "history" ? <td>{record.dateKey || "-"}</td> : null}
                        <td>{record.destination}</td>
                        <td>{record.boxes}</td>
                        <td>{record.pieces}</td>
                        <td>{renderEvidenceCell(record)}</td>
                        <td>{formatDateTime(record.updatedAt || record.createdAt)}</td>
                        <td>
                          <button type="button" className="icon-button" onClick={() => openEditModal(record)} disabled={!canManageSelectedArea}>Editar</button>
                        </td>
                      </tr>
                    ))}
                    {!(selectedViewTab === "history" ? historyRecords : activeRecords).length ? (
                      <tr>
                        <td colSpan={selectedViewTab === "history" ? 7 : 6} className="subtle-line">
                          {selectedViewTab === "history" ? "Sin historial para esta area." : "Sin registros capturados hoy para esta area."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {/* ── DOCUMENTACIÓN TAB ── */}
          {selectedMainTab === "documentacion" ? (
            <>
              {/* Area management */}
              <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", background: "rgba(3,33,33,0.04)", borderRadius: "1rem" }}>
                <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>Áreas guardadas</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.55rem" }}>
                  {customAreas.length === 0 && <span className="subtle-line" style={{ fontSize: "0.8rem" }}>Sin áreas configuradas.</span>}
                  {customAreas.map((area) => (
                    <span key={area} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#fff", border: "1px solid rgba(3,33,33,0.18)", borderRadius: "1rem", padding: "0.18rem 0.6rem", fontSize: "0.8rem" }}>
                      {area}
                      <button
                        type="button"
                        aria-label={`Eliminar área ${area}`}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#b05050", padding: 0, display: "flex", alignItems: "center" }}
                        onClick={() => deleteDocumentacionArea(area)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    value={newAreaDraft}
                    onChange={(e) => setNewAreaDraft(e.target.value)}
                    placeholder="Nueva área..."
                    style={{ flex: 1, maxWidth: "220px" }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddArea(); } }}
                  />
                  <button type="button" className="icon-button sm-button" onClick={handleAddArea} disabled={!newAreaDraft.trim()}>
                    <Plus size={13} /> Agregar
                  </button>
                </div>
              </div>

              {/* Filters + action */}
              <div className="card-header-row" style={{ marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <select value={docFilterUbicacion} onChange={(e) => setDocFilterUbicacion(e.target.value)} style={{ minWidth: "120px" }}>
                    <option value="ALL">Todas las ubicaciones</option>
                    <option value="SONATA">SONATA</option>
                    <option value="CEDIS">CEDIS</option>
                  </select>
                  <select value={docFilterArea} onChange={(e) => setDocFilterArea(e.target.value)} style={{ minWidth: "120px" }}>
                    <option value="ALL">Todas las áreas</option>
                    {customAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <button type="button" className="primary-button" onClick={openCreateDocModal}>
                  + Nuevo documento
                </button>
              </div>

              {/* Table */}
              <div className="table-wrap">
                <table className="inventory-table-clean">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ubicación</th>
                      <th>Área</th>
                      <th>Dirigido a</th>
                      <th>Documento</th>
                      <th>Evidencia</th>
                      <th>Notas</th>
                      <th>Registrado por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.dateKey || "-"}</td>
                        <td><span className="chip" style={{ fontSize: "0.75rem" }}>{record.ubicacion}</span></td>
                        <td>{record.area}</td>
                        <td>{record.dirigidoA}</td>
                        <td>{renderDocFileCell(record, "document")}</td>
                        <td>{renderDocFileCell(record, "evidence")}</td>
                        <td style={{ maxWidth: "160px", whiteSpace: "normal", fontSize: "0.78rem" }}>{record.notas || "—"}</td>
                        <td style={{ fontSize: "0.78rem" }}>{record.createdByName || "—"}</td>
                        <td>
                          <button type="button" className="icon-button" onClick={() => openEditDocModal(record)}>Editar</button>
                        </td>
                      </tr>
                    ))}
                    {docRecords.length === 0 ? (
                      <tr><td colSpan={9} className="subtle-line">Sin registros de documentación.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </article>
      </section>

      <Modal
        className="transport-record-modal"
        open={transportModal.open}
        title={transportModal.mode === "create" ? "Agregar registro de envio" : "Editar registro de envio"}
        confirmLabel={transportModal.mode === "create" ? "Guardar registro" : "Guardar cambios"}
        cancelLabel="Cancelar"
        onClose={() => setTransportModal(createTransportModalState(selectedArea?.id || ""))}
        onConfirm={submitTransportModal}
      >
        <div className="modal-form-grid transport-record-grid">
          <div className="app-modal-field transport-field-span-2">
            <span>Area</span>
            <div className="transport-readonly-field">{selectedArea?.label || "Area"}</div>
          </div>

          <label className="app-modal-field transport-field-span-2">
            <span>Destino</span>
            <select
              value={transportModal.destination}
              onChange={(event) => setTransportModal((current) => ({ ...current, destination: event.target.value }))}
            >
              {(areaConfig.find((area) => area.id === transportModal.areaId)?.destinations || []).map((destination) => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>
          </label>

          <label className="app-modal-field">
            <span>Cajas a mandar</span>
            <input
              type="number"
              min="0"
              value={transportModal.boxes}
              onChange={(event) => setTransportModal((current) => ({ ...current, boxes: event.target.value }))}
              placeholder="0"
            />
          </label>

          <label className="app-modal-field">
            <span>Piezas a mandar</span>
            <input
              type="number"
              min="0"
              value={transportModal.pieces}
              onChange={(event) => setTransportModal((current) => ({ ...current, pieces: event.target.value }))}
              placeholder="0"
            />
          </label>

          <label className="app-modal-field transport-field-full">
            <span>Notas</span>
            <textarea
              value={transportModal.notes}
              onChange={(event) => setTransportModal((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Detalle opcional del envio"
              rows={2}
            />
          </label>

          <div className="app-modal-field transport-field-full">
            <span>Evidencia</span>
            <div className="transport-upload-actions">
              <button type="button" className="icon-button sm-button" onClick={() => cameraInputRef.current?.click()} disabled={uploadingEvidence}>
                {uploadingEvidence ? "Subiendo evidencia..." : "Tomar foto"}
              </button>
              <button type="button" className="icon-button sm-button" onClick={() => fileInputRef.current?.click()} disabled={uploadingEvidence}>
                {uploadingEvidence ? "Subiendo evidencia..." : "Subir desde dispositivo"}
              </button>
              {transportModal.evidence?.url ? (
                <button type="button" className="transport-upload-preview" onClick={() => openEvidenceViewer({ destination: transportModal.destination, evidence: transportModal.evidence })}>
                  {isImageEvidence(transportModal.evidence) ? (
                    <img src={transportModal.evidence.thumbnailUrl || transportModal.evidence.url} alt={transportModal.evidence.name || "Evidencia subida"} />
                  ) : isVideoEvidence(transportModal.evidence) ? (
                    <video src={transportModal.evidence.url} poster={transportModal.evidence.thumbnailUrl || undefined} muted playsInline preload="metadata" />
                  ) : (
                    <span>{transportModal.evidence.name || "Archivo cargado"}</span>
                  )}
                </button>
              ) : (
                <span className="subtle-line">Debes adjuntar una evidencia para guardar.</span>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleUploadEvidence}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf"
              style={{ display: "none" }}
              onChange={handleUploadEvidence}
            />
          </div>
        </div>
      </Modal>

      <Modal
        className="modal-wide transport-evidence-viewer-modal"
        open={evidenceViewer.open}
        title={evidenceViewer.title || "Vista previa de evidencia"}
        confirmLabel="Cerrar"
        hideCancel
        onClose={closeEvidenceViewer}
      >
        <div className="transport-evidence-viewer-body">
          {isImageEvidence(evidenceViewer.evidence) ? (
            <img src={evidenceViewer.evidence?.url} alt={evidenceViewer.evidence?.name || evidenceViewer.title || "Evidencia"} className="transport-evidence-viewer-media" />
          ) : isVideoEvidence(evidenceViewer.evidence) ? (
            <video src={evidenceViewer.evidence?.url} poster={evidenceViewer.evidence?.thumbnailUrl || undefined} className="transport-evidence-viewer-media" controls autoPlay />
          ) : (
            <a href={evidenceViewer.evidence?.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
              {evidenceViewer.evidence?.name || "Abrir archivo"}
            </a>
          )}
        </div>
      </Modal>

      {/* ── Documentación: Create/Edit Modal ── */}
      <Modal
        className="transport-record-modal"
        open={docModal.open}
        title={docModal.mode === "create" ? "Nuevo registro de documentación" : "Editar registro de documentación"}
        confirmLabel={docModal.mode === "create" ? "Guardar registro" : "Guardar cambios"}
        cancelLabel="Cancelar"
        onClose={() => setDocModal(createDocModalState())}
        onConfirm={submitDocModal}
      >
        <div className="modal-form-grid transport-record-grid">
          {/* Ubicación */}
          <label className="app-modal-field transport-field-span-2">
            <span>Ubicación</span>
            <select
              value={docModal.ubicacion}
              onChange={(e) => setDocModal((prev) => ({ ...prev, ubicacion: e.target.value }))}
            >
              <option value="SONATA">SONATA</option>
              <option value="CEDIS">CEDIS</option>
            </select>
          </label>

          {/* Área */}
          <label className="app-modal-field transport-field-span-2">
            <span>Área</span>
            {customAreas.length > 0 ? (
              <select
                value={docModal.area}
                onChange={(e) => setDocModal((prev) => ({ ...prev, area: e.target.value }))}
              >
                <option value="">Seleccionar área...</option>
                {customAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={docModal.area}
                onChange={(e) => setDocModal((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Escribe el área"
              />
            )}
          </label>

          {/* Dirigido a */}
          <label className="app-modal-field transport-field-span-2">
            <span>Dirigido a</span>
            <input
              type="text"
              value={docModal.dirigidoA}
              onChange={(e) => setDocModal((prev) => ({ ...prev, dirigidoA: e.target.value }))}
              placeholder="Nombre del destinatario"
            />
          </label>

          {/* Notas */}
          <label className="app-modal-field transport-field-full">
            <span>Notas</span>
            <textarea
              value={docModal.notas}
              onChange={(e) => setDocModal((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Descripción del documento o paquete (opcional)"
              rows={2}
            />
          </label>

          {/* Documento */}
          <div className="app-modal-field transport-field-full">
            <span>Documento <span style={{ color: "#b05050" }}>*</span></span>
            <div className="transport-upload-actions">
              <button type="button" className="icon-button sm-button" onClick={() => docFileInputRef.current?.click()} disabled={uploadingDocFile}>
                {uploadingDocFile ? "Subiendo..." : "Adjuntar documento"}
              </button>
              {docModal.document?.url ? (
                <a href={docModal.document.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <FileText size={15} />
                  {docModal.document.name || "Ver documento"}
                </a>
              ) : (
                <span className="subtle-line">Debes adjuntar el documento para guardar.</span>
              )}
            </div>
            <input
              ref={docFileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={handleUploadDocFile}
            />
          </div>

          {/* Evidencia */}
          <div className="app-modal-field transport-field-full">
            <span>Evidencia del documento / paquete (opcional)</span>
            <div className="transport-upload-actions">
              <button type="button" className="icon-button sm-button" onClick={() => docEvidenceCameraRef.current?.click()} disabled={uploadingDocEvidence}>
                {uploadingDocEvidence ? "Subiendo..." : "Tomar foto"}
              </button>
              <button type="button" className="icon-button sm-button" onClick={() => docEvidenceInputRef.current?.click()} disabled={uploadingDocEvidence}>
                {uploadingDocEvidence ? "Subiendo..." : "Subir archivo"}
              </button>
              {docModal.evidence?.url ? (
                <button type="button" className="transport-upload-preview" onClick={() => setDocEvidenceViewer({ open: true, evidence: docModal.evidence, title: "Evidencia" })}>
                  {isImageEvidence(docModal.evidence) ? (
                    <img src={docModal.evidence.thumbnailUrl || docModal.evidence.url} alt={docModal.evidence.name || "Evidencia"} />
                  ) : (
                    <span>{docModal.evidence.name || "Archivo cargado"}</span>
                  )}
                </button>
              ) : null}
            </div>
            <input ref={docEvidenceCameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleUploadDocEvidence} />
            <input ref={docEvidenceInputRef} type="file" accept="image/*,video/*,.pdf" style={{ display: "none" }} onChange={handleUploadDocEvidence} />
          </div>
        </div>
      </Modal>

      {/* ── Documentación: evidence viewer ── */}
      <Modal
        className="modal-wide transport-evidence-viewer-modal"
        open={docEvidenceViewer.open}
        title={docEvidenceViewer.title || "Vista previa"}
        confirmLabel="Cerrar"
        hideCancel
        onClose={() => setDocEvidenceViewer({ open: false, evidence: null, title: "" })}
      >
        <div className="transport-evidence-viewer-body">
          {isImageEvidence(docEvidenceViewer.evidence) ? (
            <img src={docEvidenceViewer.evidence?.url} alt={docEvidenceViewer.evidence?.name || "Evidencia"} className="transport-evidence-viewer-media" />
          ) : isVideoEvidence(docEvidenceViewer.evidence) ? (
            <video src={docEvidenceViewer.evidence?.url} poster={docEvidenceViewer.evidence?.thumbnailUrl || undefined} className="transport-evidence-viewer-media" controls autoPlay />
          ) : (
            <a href={docEvidenceViewer.evidence?.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
              {docEvidenceViewer.evidence?.name || "Abrir archivo"}
            </a>
          )}
        </div>
      </Modal>
    </section>
  );
}
