import { useEffect, useMemo, useRef, useState } from "react";
import { uploadFileToCloudinary } from "../services/upload.service";

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

export default function GestionTransporte({ contexto }) {
  const {
    transportState,
    createTransportRecord,
    updateTransportRecord,
    actionPermissions,
    Modal,
    formatDateTime,
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
  const [transportModal, setTransportModal] = useState(createTransportModalState(firstAreaId));
  const [evidenceViewer, setEvidenceViewer] = useState({ open: false, evidence: null, title: "" });
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    </section>
  );
}
