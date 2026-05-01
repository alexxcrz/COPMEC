import { useEffect, useMemo, useState } from "react";
import { buildAreaCatalog, getAreaRoot, normalizeAreaOption, normalizeSystemOperationalSettings } from "../utils/utilidades.jsx";
import { Modal } from "../components/Modal";
import { DEFAULT_AREA_OPTIONS } from "../utils/constantes.js";

const LEGACY_AREA_KEYS = new Set(["C1", "C2", "C3", "P"]);
const REQUIRED_OPERATIONAL_AREAS = ["LIMPIEZA"];
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const HOURS_24_WITH_24 = HOURS_24.concat(["24"]);
const MINUTES_60 = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function toTimeValue(hour, minute) { // eslint-disable-line no-unused-vars
  const hh = String(Math.min(24, Math.max(0, Number(hour) || 0))).padStart(2, "0");
  const mm = String(Math.min(59, Math.max(0, Number(minute) || 0))).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseTimeValue(value, fallbackHour = 0, fallbackMinute = 0) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return { hour: fallbackHour, minute: fallbackMinute };
  return {
    hour: Math.min(24, Math.max(0, Number(match[1]) || fallbackHour)),
    minute: Math.min(59, Math.max(0, Number(match[2]) || fallbackMinute)),
  };
}

function getOperationalTimeParts() {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return { hour, minute };
    }
  } catch {
    // Fallback to device time if timezone formatting fails.
  }
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

function isWithinWorkHoursWindow(workHours) {
  const source = workHours && typeof workHours === "object" ? workHours : {};
  const startHour = Math.min(23, Math.max(0, Math.round(Number(source.startHour ?? 0))));
  const startMinute = Math.min(59, Math.max(0, Math.round(Number(source.startMinute ?? 0))));
  const endHour = Math.min(24, Math.max(0, Math.round(Number(source.endHour ?? 24))));
  const endMinute = Math.min(59, Math.max(0, Math.round(Number(source.endMinute ?? 0))));
  const startTotal = (startHour * 60) + startMinute;
  const endTotal = (endHour * 60) + endMinute;
  if (startTotal === endTotal) return false;
  const now = getOperationalTimeParts();
  const nowTotal = (now.hour * 60) + now.minute;
  return nowTotal >= startTotal && nowTotal < endTotal;
}

export default function ConfiguracionSistema({ contexto }) {
  const {
    actionPermissions,
    pushAppToast,
    state,
    updateSystemOperationalSettings,
  } = contexto;

  const canManageSystemSettings = Boolean(actionPermissions?.manageSystemSettings);
  const realAreaOptions = useMemo(() => {
    const catalog = buildAreaCatalog(state?.users || [], state?.areaCatalog || []);
    const roots = catalog
      .map((area) => normalizeAreaOption(getAreaRoot(area) || area))
      .filter(Boolean);
    return Array.from(new Set(roots)).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [state?.users, state?.areaCatalog]);
  const operationalSettings = useMemo(
    () => normalizeSystemOperationalSettings(state?.system?.operational),
    [state?.system?.operational],
  );
  const areaKeys = useMemo(() => {
    const fromPause = Object.keys(operationalSettings.pauseControl?.areaPauseControls || {})
      .map((key) => normalizeAreaOption(getAreaRoot(key) || key))
      .filter((key) => key && !LEGACY_AREA_KEYS.has(key));
    const fromDefaults = [...REQUIRED_OPERATIONAL_AREAS, ...(DEFAULT_AREA_OPTIONS || [])]
      .map((area) => normalizeAreaOption(getAreaRoot(area) || area))
      .filter(Boolean);
    return Array.from(new Set([...(realAreaOptions || []), ...fromPause, ...fromDefaults])).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [operationalSettings.pauseControl?.areaPauseControls, realAreaOptions]);
  const [pauseDraft, setPauseDraft] = useState(() => operationalSettings.pauseControl);
  const [workHoursDraft, setWorkHoursDraft] = useState(() => operationalSettings.pauseControl.workHours || { startHour: 0, endHour: 24, startMinute: 0, endMinute: 0 });
  const [areaPauseControlsDraft, setAreaPauseControlsDraft] = useState(() => operationalSettings.pauseControl.areaPauseControls || {});
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [isSavingAreaPauseControls, setIsSavingAreaPauseControls] = useState(false);
  const [globalPauseDisableModal, setGlobalPauseDisableModal] = useState({ open: false, minutes: "60", error: "" });
  const [overrideNowMs, setOverrideNowMs] = useState(Date.now());

  useEffect(() => {
    setPauseDraft(operationalSettings.pauseControl);
  }, [operationalSettings.pauseControl]);
  useEffect(() => {
    const overrideIso = String(operationalSettings.pauseControl?.globalPauseAutoDisabledUntil || "").trim();
    if (!overrideIso) return undefined;
    const endMs = new Date(overrideIso).getTime();
    if (!Number.isFinite(endMs) || endMs <= Date.now()) return undefined;
    const timerId = globalThis.setInterval(() => {
      setOverrideNowMs(Date.now());
    }, 1000);
    return () => globalThis.clearInterval(timerId);
  }, [operationalSettings.pauseControl?.globalPauseAutoDisabledUntil]);
  useEffect(() => {
    setWorkHoursDraft(operationalSettings.pauseControl.workHours || { startHour: 0, endHour: 24, startMinute: 0, endMinute: 0 });
  }, [operationalSettings.pauseControl.workHours]);
  useEffect(() => {
    const source = operationalSettings.pauseControl.areaPauseControls || {};
    const normalized = {};
    areaKeys.forEach((key) => {
      const entry = source[key] || {};
      normalized[key] = {
        enabled: Boolean(entry.enabled),
        workHours: entry.workHours || { startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 },
      };
    });
    setAreaPauseControlsDraft(normalized);
  }, [operationalSettings.pauseControl.areaPauseControls, areaKeys]);

  async function handleSavePauseRules() {
    if (!canManageSystemSettings || isSavingPause) return;
    setIsSavingPause(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: pauseDraft,
      });
      pushAppToast("Configuración de pausas guardada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la configuración de pausas.", "danger");
    } finally {
      setIsSavingPause(false);
    }
  }

  function getOverrideRemainingSeconds() {
    const overrideIso = String(operationalSettings.pauseControl?.globalPauseAutoDisabledUntil || "").trim();
    if (!overrideIso) return 0;
    const endMs = new Date(overrideIso).getTime();
    if (!Number.isFinite(endMs)) return 0;
    return Math.max(0, Math.floor((endMs - overrideNowMs) / 1000));
  }

  function formatRemainingClock(seconds) {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const hh = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
    const mm = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
    const ss = String(safeSeconds % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  async function toggleGlobalPause() {
    if (!canManageSystemSettings || isSavingPause) return;
    if (pauseDraft?.globalPauseEnabled) {
      if (isWithinWorkHoursWindow(pauseDraft?.workHours)) {
        setIsSavingPause(true);
        try {
          await updateSystemOperationalSettings({
            pauseControl: {
              ...pauseDraft,
              forceGlobalPause: false,
              globalPauseEnabled: false,
              globalPauseAutoDisabledUntil: null,
            },
          });
          pushAppToast("Pausa global desactivada.", "success");
        } catch (error) {
          pushAppToast(error?.message || "No se pudo desactivar la pausa global.", "danger");
        } finally {
          setIsSavingPause(false);
        }
        return;
      }
      setGlobalPauseDisableModal({ open: true, minutes: "60", error: "" });
      return;
    }

    setIsSavingPause(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: {
          ...pauseDraft,
          globalPauseEnabled: true,
          globalPauseAutoDisabledUntil: null,
        },
      });
      pushAppToast("Pausa global activada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo activar la pausa global.", "danger");
    } finally {
      setIsSavingPause(false);
    }
  }

  async function confirmTemporaryGlobalPauseDisable() {
    if (isSavingPause) return;
    const minutes = Math.max(0, Math.round(Number(globalPauseDisableModal.minutes || 0)));
    if (!minutes) {
      setGlobalPauseDisableModal((current) => ({ ...current, error: "Indica cuántos minutos estará desactivada la pausa global." }));
      return;
    }

    const untilIso = new Date(Date.now() + (minutes * 60 * 1000)).toISOString();
    setIsSavingPause(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: {
          ...pauseDraft,
          forceGlobalPause: false,
          globalPauseEnabled: false,
          globalPauseAutoDisabledUntil: untilIso,
        },
      });
      setGlobalPauseDisableModal({ open: false, minutes: "60", error: "" });
      pushAppToast(`Pausa global desactivada temporalmente por ${minutes} min.`, "success");
    } catch (error) {
      setGlobalPauseDisableModal((current) => ({ ...current, error: error?.message || "No se pudo desactivar temporalmente." }));
    } finally {
      setIsSavingPause(false);
    }
  }

  const overrideRemainingSeconds = getOverrideRemainingSeconds();

  function addPauseReason() {
    setPauseDraft((current) => ({
      ...current,
      reasons: (current?.reasons || []).concat([
        {
          id: `reason-${Date.now()}`,
          label: "Nueva pausa",
          enabled: true,
          affectsTimer: false,
          authorizedMinutes: 0,
          dailyUsageLimit: 0,
        },
      ]),
    }));
  }

  const [isSavingWorkHours, setIsSavingWorkHours] = useState(false);

  async function handleSaveWorkHours() {
    if (!canManageSystemSettings || isSavingWorkHours) return;
    const startHour = Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.startHour) || 0)));
    const startMinute = Math.min(59, Math.max(0, Math.round(Number(workHoursDraft.startMinute) || 0)));
    const endHour = Math.min(24, Math.max(0, Math.round(Number(workHoursDraft.endHour) || 24)));
    const endMinute = Math.min(59, Math.max(0, Math.round(Number(workHoursDraft.endMinute) || 0)));
    setIsSavingWorkHours(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: { ...pauseDraft, workHours: { startHour, startMinute, endHour, endMinute } },
      });
      pushAppToast(`Horario laboral guardado: ${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")} – ${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`, "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar el horario laboral.", "danger");
    } finally {
      setIsSavingWorkHours(false);
    }
  }

  function handleGlobalTimeChange(kind, value) {
    const fallbackHour = kind === "start" ? Number(workHoursDraft.startHour) || 0 : Number(workHoursDraft.endHour) || 24;
    const fallbackMinute = kind === "start" ? Number(workHoursDraft.startMinute) || 0 : Number(workHoursDraft.endMinute) || 0;
    const { hour, minute } = parseTimeValue(value, fallbackHour, fallbackMinute);
    if (kind === "start") {
      setWorkHoursDraft((current) => ({ ...current, startHour: hour, startMinute: minute }));
      return;
    }
    setWorkHoursDraft((current) => ({ ...current, endHour: hour, endMinute: minute }));
  }

  function handleAreaTimeChange(area, kind, value) {
    const areaControl = areaPauseControlsDraft[area] || { enabled: false, workHours: {} };
    const fallbackHour = kind === "start"
      ? Number(areaControl.workHours?.startHour) || 0
      : Number(areaControl.workHours?.endHour) || 24;
    const fallbackMinute = kind === "start"
      ? Number(areaControl.workHours?.startMinute) || 0
      : Number(areaControl.workHours?.endMinute) || 0;
    const { hour, minute } = parseTimeValue(value, fallbackHour, fallbackMinute);
    setAreaPauseControlsDraft((current) => {
      const sourceControl = current[area] || { enabled: false, workHours: {} };
      const nextWorkHours = {
        ...sourceControl.workHours,
        ...(kind === "start" ? { startHour: hour, startMinute: minute } : { endHour: hour, endMinute: minute }),
      };
      return {
        ...current,
        [area]: { ...sourceControl, workHours: nextWorkHours },
      };
    });
  }

  async function handleSaveAreaPauseControls() {
    if (!canManageSystemSettings || isSavingAreaPauseControls) return;
    setIsSavingAreaPauseControls(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: { ...pauseDraft, areaPauseControls: areaPauseControlsDraft },
      });
      pushAppToast("Controles de pausa por área guardados.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar los controles por área.", "danger");
    } finally {
      setIsSavingAreaPauseControls(false);
    }
  }

  return (
    <section className="admin-page-layout">
      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Configuración del sistema</h3>
            <p className="subtle-line">Centraliza pausas globales y reglas de operación.</p>
          </div>
        </div>
      </article>

      <div className="system-config-dual-sections">
      <article className="surface-card admin-surface-card system-config-compact-surface">
        <div className="card-header-row">
          <div>
            <h3>Horario laboral global</h3>
            <p className="subtle-line">Selecciona horario con reloj. Solo dos campos: inicio y fin.</p>
          </div>
        </div>
        <div className="system-config-clock-grid system-config-clock-grid-two">
          <div className="app-modal-field system-time-field">
            <span>Reloj inicio</span>
            <div className="system-time-input-wrap">
              <div className="system-time-select-row">
                <select
                  className="system-time-select"
                  value={String(Math.min(23, Math.max(0, Number(workHoursDraft.startHour) || 0))).padStart(2, "0")}
                  onChange={(event) => handleGlobalTimeChange("start", `${event.target.value}:${String(Math.min(59, Math.max(0, Number(workHoursDraft.startMinute) || 0))).padStart(2, "0")}`)}
                  disabled={!canManageSystemSettings}
                >
                  {HOURS_24.map((hour) => <option key={`start-hour-${hour}`} value={hour}>{hour}</option>)}
                </select>
                <span>:</span>
                <select
                  className="system-time-select"
                  value={String(Math.min(59, Math.max(0, Number(workHoursDraft.startMinute) || 0))).padStart(2, "0")}
                  onChange={(event) => handleGlobalTimeChange("start", `${String(Math.min(23, Math.max(0, Number(workHoursDraft.startHour) || 0))).padStart(2, "0")}:${event.target.value}`)}
                  disabled={!canManageSystemSettings}
                >
                  {MINUTES_60.map((minute) => <option key={`start-minute-${minute}`} value={minute}>{minute}</option>)}
                </select>
              </div>
              <span className="system-time-icon" aria-hidden="true">🕒</span>
            </div>
          </div>
          <div className="app-modal-field system-time-field">
            <span>Reloj fin</span>
            <div className="system-time-input-wrap">
              <div className="system-time-select-row">
                <select
                  className="system-time-select"
                  value={String(Math.min(24, Math.max(0, Number(workHoursDraft.endHour) || 24))).padStart(2, "0")}
                  onChange={(event) => {
                    const nextHour = event.target.value;
                    const nextMinute = nextHour === "24" ? "00" : String(Math.min(59, Math.max(0, Number(workHoursDraft.endMinute) || 0))).padStart(2, "0");
                    handleGlobalTimeChange("end", `${nextHour}:${nextMinute}`);
                  }}
                  disabled={!canManageSystemSettings}
                >
                  {HOURS_24_WITH_24.map((hour) => <option key={`end-hour-${hour}`} value={hour}>{hour}</option>)}
                </select>
                <span>:</span>
                <select
                  className="system-time-select"
                  value={String(Math.min(59, Math.max(0, Number(workHoursDraft.endMinute) || 0))).padStart(2, "0")}
                  onChange={(event) => handleGlobalTimeChange("end", `${String(Math.min(24, Math.max(0, Number(workHoursDraft.endHour) || 24))).padStart(2, "0")}:${event.target.value}`)}
                  disabled={!canManageSystemSettings || Number(workHoursDraft.endHour) === 24}
                >
                  {MINUTES_60.map((minute) => <option key={`end-minute-${minute}`} value={minute}>{minute}</option>)}
                </select>
              </div>
              <span className="system-time-icon" aria-hidden="true">🕒</span>
            </div>
          </div>
        </div>
        <p className="subtle-line" style={{ marginTop: 4 }}>
          Ventana activa: <strong>{String(Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.startHour) || 0)))).padStart(2, "0")}:{String(Math.min(59, Math.max(0, Math.round(Number(workHoursDraft.startMinute) || 0)))).padStart(2, "0")}</strong> – <strong>{String(Math.min(24, Math.max(0, Math.round(Number(workHoursDraft.endHour) || 24)))).padStart(2, "0")}:{String(Math.min(59, Math.max(0, Math.round(Number(workHoursDraft.endMinute) || 0)))).padStart(2, "0")}</strong>
        </p>
        <div className="row-actions compact system-config-actions">
          <button type="button" className="primary-button" onClick={handleSaveWorkHours} disabled={!canManageSystemSettings || isSavingWorkHours}>
            {isSavingWorkHours ? "Guardando..." : "Guardar horario laboral"}
          </button>
        </div>
      </article>

      <article className="surface-card admin-surface-card system-config-compact-surface">
        <div className="card-header-row">
          <div>
            <h3>Pausa global</h3>
            <p className="subtle-line">Controla solo la pausa global del sistema.</p>
          </div>
        </div>
        <div className="modal-form-grid system-config-pause-grid system-config-pause-grid-compact">
          <div className="app-modal-field">
            <span>Pausa global activa</span>
            <button type="button" className={`switch-button system-config-switch ${pauseDraft?.globalPauseEnabled ? "on" : ""}`} onClick={toggleGlobalPause} disabled={!canManageSystemSettings || isSavingPause} aria-label="Alternar pausa global activa">
              <span className="switch-thumb" />
            </button>
            {overrideRemainingSeconds > 0 ? (
              <p className="subtle-line" style={{ marginTop: 8 }}>
                Reanudación automática en <strong>{formatRemainingClock(overrideRemainingSeconds)}</strong>
              </p>
            ) : null}
          </div>
          <div className="app-modal-field">
            <span>Pausa forzada de operación</span>
            <button type="button" className={`switch-button system-config-switch ${pauseDraft?.forceGlobalPause ? "on" : ""}`} onClick={() => setPauseDraft((current) => ({ ...current, forceGlobalPause: !current.forceGlobalPause }))} disabled={!canManageSystemSettings} aria-label="Alternar pausa forzada">
              <span className="switch-thumb" />
            </button>
          </div>
        </div>

        <div className="row-actions compact system-config-actions">
          <button type="button" className="primary-button" onClick={handleSavePauseRules} disabled={!canManageSystemSettings || isSavingPause}>
            {isSavingPause ? "Guardando..." : "Guardar pausa global"}
          </button>
        </div>
      </article>
      </div>

      <Modal
        open={globalPauseDisableModal.open}
        title="Desactivar pausa global temporalmente"
        confirmLabel={isSavingPause ? "Guardando..." : "Confirmar"}
        cancelLabel="Cancelar"
        onClose={() => setGlobalPauseDisableModal({ open: false, minutes: "60", error: "" })}
        onConfirm={confirmTemporaryGlobalPauseDisable}
        confirmDisabled={isSavingPause}
      >
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>¿Cuántos minutos se desactivará?</span>
            <input
              type="number"
              min="1"
              value={globalPauseDisableModal.minutes}
              onChange={(event) => setGlobalPauseDisableModal((current) => ({ ...current, minutes: event.target.value, error: "" }))}
            />
          </label>
          <p className="modal-footnote">Al terminar el tiempo, la pausa global se reactivará automáticamente.</p>
          {globalPauseDisableModal.error ? <p className="validation-text">{globalPauseDisableModal.error}</p> : null}
        </div>
      </Modal>

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Horario laboral por área</h3>
            <p className="subtle-line">Activa un área real para que use horario propio y quede fuera del global.</p>
          </div>
        </div>

        <div className="system-config-grid system-config-grid-three">
          {areaKeys.map((area) => {
            const areaControl = areaPauseControlsDraft[area] || { enabled: false, workHours: {} };
            return (
              <div key={area} className="system-config-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <strong>{area}</strong>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={areaControl.enabled || false}
                      onChange={(e) => setAreaPauseControlsDraft((current) => ({ ...current, [area]: { ...areaControl, enabled: e.target.checked } }))}
                      disabled={!canManageSystemSettings}
                    />
                    <span style={{ fontSize: "0.9rem" }}>Usar horario propio</span>
                  </label>
                </div>
                {areaControl.enabled && (
                  <div className="system-area-time-grid system-config-clock-grid-two">
                    <div className="app-modal-field system-time-field">
                      <span>Inicio</span>
                      <div className="system-time-input-wrap">
                        <div className="system-time-select-row">
                          <select
                            className="system-time-select"
                            value={String(Math.min(23, Math.max(0, Number(areaControl.workHours?.startHour) || 0))).padStart(2, "0")}
                            onChange={(e) => handleAreaTimeChange(area, "start", `${e.target.value}:${String(Math.min(59, Math.max(0, Number(areaControl.workHours?.startMinute) || 0))).padStart(2, "0")}`)}
                            disabled={!canManageSystemSettings}
                          >
                            {HOURS_24.map((hour) => <option key={`${area}-start-hour-${hour}`} value={hour}>{hour}</option>)}
                          </select>
                          <span>:</span>
                          <select
                            className="system-time-select"
                            value={String(Math.min(59, Math.max(0, Number(areaControl.workHours?.startMinute) || 0))).padStart(2, "0")}
                            onChange={(e) => handleAreaTimeChange(area, "start", `${String(Math.min(23, Math.max(0, Number(areaControl.workHours?.startHour) || 0))).padStart(2, "0")}:${e.target.value}`)}
                            disabled={!canManageSystemSettings}
                          >
                            {MINUTES_60.map((minute) => <option key={`${area}-start-minute-${minute}`} value={minute}>{minute}</option>)}
                          </select>
                        </div>
                        <span className="system-time-icon" aria-hidden="true">🕒</span>
                      </div>
                    </div>
                    <div className="app-modal-field system-time-field">
                      <span>Fin</span>
                      <div className="system-time-input-wrap">
                        <div className="system-time-select-row">
                          <select
                            className="system-time-select"
                            value={String(Math.min(24, Math.max(0, Number(areaControl.workHours?.endHour) || 24))).padStart(2, "0")}
                            onChange={(e) => {
                              const nextHour = e.target.value;
                              const nextMinute = nextHour === "24" ? "00" : String(Math.min(59, Math.max(0, Number(areaControl.workHours?.endMinute) || 0))).padStart(2, "0");
                              handleAreaTimeChange(area, "end", `${nextHour}:${nextMinute}`);
                            }}
                            disabled={!canManageSystemSettings}
                          >
                            {HOURS_24_WITH_24.map((hour) => <option key={`${area}-end-hour-${hour}`} value={hour}>{hour}</option>)}
                          </select>
                          <span>:</span>
                          <select
                            className="system-time-select"
                            value={String(Math.min(59, Math.max(0, Number(areaControl.workHours?.endMinute) || 0))).padStart(2, "0")}
                            onChange={(e) => handleAreaTimeChange(area, "end", `${String(Math.min(24, Math.max(0, Number(areaControl.workHours?.endHour) || 24))).padStart(2, "0")}:${e.target.value}`)}
                            disabled={!canManageSystemSettings || Number(areaControl.workHours?.endHour) === 24}
                          >
                            {MINUTES_60.map((minute) => <option key={`${area}-end-minute-${minute}`} value={minute}>{minute}</option>)}
                          </select>
                        </div>
                        <span className="system-time-icon" aria-hidden="true">🕒</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="row-actions compact system-config-actions">
          <button type="button" className="primary-button" onClick={handleSaveAreaPauseControls} disabled={!canManageSystemSettings || isSavingAreaPauseControls}>
            {isSavingAreaPauseControls ? "Guardando..." : "Guardar controles por área"}
          </button>
        </div>
      </article>

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Motivos de pausa</h3>
            <p className="subtle-line">Configura minutos autorizados y usos máximos por día para cada motivo.</p>
          </div>
        </div>

        <div className="system-config-pause-list">
          {(pauseDraft?.reasons || []).map((reason, index) => (
            <div key={reason.id || index} className="system-config-pause-row">
              <label className="app-modal-field">
                <span>Motivo</span>
                <input value={reason.label || ""} onChange={(event) => setPauseDraft((current) => ({
                  ...current,
                  reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, label: event.target.value } : entry)),
                }))} disabled={!canManageSystemSettings} />
              </label>
              <div className="app-modal-field">
                <span>Afecta contador</span>
                <button
                  type="button"
                  className={`switch-button system-config-switch ${reason.affectsTimer ? "on" : ""}`}
                  onClick={() => setPauseDraft((current) => ({
                    ...current,
                    reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, affectsTimer: !entry.affectsTimer } : entry)),
                  }))}
                  disabled={!canManageSystemSettings}
                  aria-label={`Alternar afecta contador para ${reason.label || "motivo"}`}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
              <label className="app-modal-field">
                <span>Minutos autorizados</span>
                <input type="number" min="0" value={reason.authorizedMinutes ?? 0} onChange={(event) => setPauseDraft((current) => ({
                  ...current,
                  reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, authorizedMinutes: event.target.value } : entry)),
                }))} disabled={!canManageSystemSettings} />
              </label>
              <label className="app-modal-field">
                <span>Usos por día</span>
                <select
                  value={String(Number(reason.dailyUsageLimit ?? 0))}
                  onChange={(event) => setPauseDraft((current) => ({
                    ...current,
                    reasons: (current?.reasons || []).map((entry, entryIndex) => (
                      entryIndex === index
                        ? { ...entry, dailyUsageLimit: Number(event.target.value) }
                        : entry
                    )),
                  }))}
                  disabled={!canManageSystemSettings}
                >
                  <option value="0">Varias (sin límite)</option>
                  <option value="1">1 vez al día</option>
                  <option value="2">2 veces al día</option>
                  <option value="3">3 veces al día</option>
                  <option value="5">5 veces al día</option>
                </select>
              </label>
              <div className="app-modal-field">
                <span>Habilitada</span>
                <button
                  type="button"
                  className={`switch-button system-config-switch ${reason.enabled ? "on" : ""}`}
                  onClick={() => setPauseDraft((current) => ({
                    ...current,
                    reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, enabled: !entry.enabled } : entry)),
                  }))}
                  disabled={!canManageSystemSettings}
                  aria-label={`Alternar habilitada para ${reason.label || "motivo"}`}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="subtle-line" style={{ marginTop: 6 }}>
          Definición: los <strong>Minutos autorizados</strong> congelan el acumulado al inicio de la pausa.
          Al agotarse, el acumulado vuelve a correr mientras siga pausada. <strong>Usos por día</strong> se reinicia automáticamente al siguiente día.
        </p>

        <div className="row-actions compact system-config-actions">
          <button type="button" className="icon-button" onClick={addPauseReason} disabled={!canManageSystemSettings}>
            Agregar motivo
          </button>
          <button type="button" className="primary-button" onClick={handleSavePauseRules} disabled={!canManageSystemSettings || isSavingPause}>
            {isSavingPause ? "Guardando..." : "Guardar reglas de pausas"}
          </button>
        </div>
      </article>
    </section>
  );
}
