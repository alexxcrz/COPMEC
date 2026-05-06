import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { uploadFileToCloudinary } from "../services/upload.service";
import {
  OPERATIONAL_INSPECTION_TEMPLATE,
  createOperationalInspectionDraft,
  validateOperationalInspection,
  buildIncidenciasFromOperationalInspection,
} from "../utils/operationalInspectionTemplate";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "ok", label: "OK" },
  { value: "no_ok", label: "NO OK" },
  { value: "na", label: "N/A" },
];

const SEVERITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Critica" },
];

function buildInitialDraft(currentUser, defaultArea, defaultProcess, requireIncidentSiteSelection = false) {
  const base = createOperationalInspectionDraft(OPERATIONAL_INSPECTION_TEMPLATE);
  return {
    ...base,
    metadata: {
      ...base.metadata,
      area: String(defaultArea || "").trim(),
      process: String(defaultProcess || "").trim(),
      responsable: String(currentUser?.name || "").trim(),
      requireIncidentSiteSelection: Boolean(requireIncidentSiteSelection),
    },
  };
}

export default function OperationalInspectionStartModal({
  open,
  activityLabel,
  currentUser,
  defaultArea,
  defaultProcess,
  onClose,
  onConfirm,
  confirmBusy = false,
  requireIncidentSiteSelection = false,
  incidentSiteOptions = [],
}) {
  const [draft, setDraft] = useState(() => buildInitialDraft(currentUser, defaultArea, defaultProcess, requireIncidentSiteSelection));
  const [savingEvidenceByCheckId, setSavingEvidenceByCheckId] = useState({});
  const [formError, setFormError] = useState("");
  const normalizedIncidentSiteOptions = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(incidentSiteOptions) ? incidentSiteOptions : [])
      .map((entry) => String(entry || "").trim().toUpperCase())
      .filter((entry) => {
        if (!entry || seen.has(entry)) return false;
        seen.add(entry);
        return true;
      });
  }, [incidentSiteOptions]);

  useEffect(() => {
    if (!open) return;
    setDraft(buildInitialDraft(currentUser, defaultArea, defaultProcess, requireIncidentSiteSelection));
    setSavingEvidenceByCheckId({});
    setFormError("");
  }, [open, currentUser, defaultArea, defaultProcess, requireIncidentSiteSelection]);

  const totalNoOk = useMemo(() => {
    return Object.values(draft.checks || {}).filter((entry) => entry?.status === "no_ok").length;
  }, [draft.checks]);

  function updateMetadata(key, value) {
    setDraft((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  }

  function updateCheck(checkId, patch) {
    setDraft((prev) => ({
      ...prev,
      checks: {
        ...prev.checks,
        [checkId]: {
          ...(prev.checks?.[checkId] || { status: "pending", notes: "", severity: "media", photos: [], site: "" }),
          ...patch,
        },
      },
    }));
  }

  async function handleUploadEvidence(checkId, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setSavingEvidenceByCheckId((prev) => ({ ...prev, [checkId]: true }));
    setFormError("");

    try {
      const uploaded = [];
      for (const file of files) {
        const result = await uploadFileToCloudinary(file);
        uploaded.push({
          id: result.publicId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: result.originalName || file.name,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl || result.url,
          type: file.type,
        });
      }
      setDraft((prev) => {
        const previousPhotos = Array.isArray(prev.checks?.[checkId]?.photos) ? prev.checks[checkId].photos : [];
        return {
          ...prev,
          checks: {
            ...prev.checks,
            [checkId]: {
              ...(prev.checks?.[checkId] || { status: "pending", notes: "", severity: "media", photos: [], site: "" }),
              photos: [...previousPhotos, ...uploaded],
            },
          },
        };
      });
    } catch (error) {
      setFormError(error?.message || "No se pudo subir una evidencia.");
    } finally {
      setSavingEvidenceByCheckId((prev) => ({ ...prev, [checkId]: false }));
    }
  }

  async function handleConfirm() {
    const validation = validateOperationalInspection(draft, OPERATIONAL_INSPECTION_TEMPLATE);
    if (!validation.ok) {
      setFormError(validation.errors[0] || "Completa la inspeccion antes de continuar.");
      return;
    }

    const incidencias = buildIncidenciasFromOperationalInspection({
      draft,
      template: OPERATIONAL_INSPECTION_TEMPLATE,
      currentUser,
    });

    await onConfirm?.({ draft, incidencias });
  }

  return (
    <Modal
      open={open}
      title={`Checklist de inicio${activityLabel ? ` · ${activityLabel}` : ""}`}
      onClose={confirmBusy ? undefined : onClose}
      onConfirm={handleConfirm}
      confirmLabel={confirmBusy ? "Guardando..." : "Guardar e iniciar"}
      cancelLabel="Cancelar"
      confirmDisabled={confirmBusy}
      className="operational-inspection-modal"
    >
      <div style={{ display: "grid", gap: "0.85rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.55rem" }}>
          <label style={{ display: "grid", gap: "0.2rem" }}>
            <span>Area</span>
            <input value={draft.metadata.area} onChange={(event) => updateMetadata("area", event.target.value)} placeholder="Area" />
          </label>
          <label style={{ display: "grid", gap: "0.2rem" }}>
            <span>Fecha</span>
            <input type="date" value={draft.metadata.date} onChange={(event) => updateMetadata("date", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: "0.2rem" }}>
            <span>Responsable</span>
            <input value={draft.metadata.responsable} onChange={(event) => updateMetadata("responsable", event.target.value)} placeholder="Responsable" />
          </label>
        </div>

        {OPERATIONAL_INSPECTION_TEMPLATE.sections.map((section) => (
          <article key={section.id} style={{ border: "1px solid rgba(3,33,33,0.14)", borderRadius: "0.9rem", padding: "0.7rem", display: "grid", gap: "0.6rem" }}>
            <strong>{section.title}</strong>
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {section.checks.map((check) => {
                const current = draft.checks?.[check.id] || { status: "pending", notes: "", severity: "media", photos: [], site: "" };
                const isNoOk = current.status === "no_ok";
                const photos = Array.isArray(current.photos) ? current.photos : [];
                return (
                  <div key={check.id} style={{ border: "1px solid rgba(3,33,33,0.08)", borderRadius: "0.75rem", padding: "0.55rem", display: "grid", gap: "0.45rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span>{check.label}</span>
                      <select value={current.status} onChange={(event) => updateCheck(check.id, { status: event.target.value })} style={{ minWidth: "110px" }}>
                        {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>

                    {isNoOk ? (
                      <>
                        <label style={{ display: "grid", gap: "0.2rem" }}>
                          <span>Detalle de incidencia</span>
                          <textarea
                            value={current.notes}
                            onChange={(event) => updateCheck(check.id, { notes: event.target.value })}
                            rows={2}
                            placeholder="Describe el hallazgo"
                          />
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "0.45rem", alignItems: "center" }}>
                          <label style={{ display: "grid", gap: "0.2rem" }}>
                            <span>Prioridad</span>
                            <select value={current.severity} onChange={(event) => updateCheck(check.id, { severity: event.target.value })}>
                              {SEVERITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </label>

                          <label style={{ display: "grid", gap: "0.2rem" }}>
                            <span>Evidencia (obligatoria)</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => handleUploadEvidence(check.id, event.target.files)}
                              disabled={savingEvidenceByCheckId[check.id]}
                            />
                          </label>
                        </div>

                        {normalizedIncidentSiteOptions.length ? (
                          <label style={{ display: "grid", gap: "0.2rem" }}>
                            <span>{requireIncidentSiteSelection ? "Nave afectada (obligatoria)" : "Nave afectada (opcional)"}</span>
                            <select
                              value={current.site || ""}
                              onChange={(event) => updateCheck(check.id, { site: event.target.value })}
                            >
                              <option value="">Seleccionar nave</option>
                              {normalizedIncidentSiteOptions.map((siteOption) => (
                                <option key={siteOption} value={siteOption}>{siteOption}</option>
                              ))}
                            </select>
                          </label>
                        ) : null}

                        {photos.length ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.35rem" }}>
                            {photos.map((photo) => (
                              <a
                                key={photo.id}
                                href={photo.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "grid", gap: "0.2rem", border: "1px solid rgba(3,33,33,0.14)", borderRadius: "0.6rem", padding: "0.3rem", textDecoration: "none", color: "inherit" }}
                              >
                                <img src={photo.thumbnailUrl || photo.url} alt={photo.name} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.45rem" }} />
                                <small style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{photo.name}</small>
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ))}

        <label style={{ display: "grid", gap: "0.2rem" }}>
          <span>Observaciones generales</span>
          <textarea value={draft.observations} onChange={(event) => setDraft((prev) => ({ ...prev, observations: event.target.value }))} rows={3} placeholder="Opcional" />
        </label>

        <p className="subtle-line" style={{ margin: 0 }}>
          Se generaran {totalNoOk} incidencia(s) en el modulo de incidencias, autoasignadas a quien inicia la actividad.
        </p>
        {formError ? <p className="validation-text" style={{ margin: 0 }}>{formError}</p> : null}
      </div>
    </Modal>
  );
}
