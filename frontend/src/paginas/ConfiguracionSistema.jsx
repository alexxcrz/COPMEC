import { useEffect, useMemo, useState } from "react";
import { buildAreaCatalog, getAreaRoot, normalizeAreaOption, normalizeSystemOperationalSettings } from "../utils/utilidades.jsx";
import { DEFAULT_AREA_OPTIONS } from "../utils/constantes.js";

const LEGACY_AREA_KEYS = new Set(["C1", "C2", "C3", "P"]);
const REQUIRED_OPERATIONAL_AREAS = ["LIMPIEZA"];
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const HOURS_24_WITH_24 = HOURS_24.concat(["24"]);
const MINUTES_60 = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const WEEKDAY_META = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miercoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sabado" },
  { key: "sun", label: "Domingo" },
];
const TIMEZONE_OPTIONS = [
  { value: "America/Mexico_City", label: "America/Mexico_City (Centro)" },
  { value: "America/Tijuana", label: "America/Tijuana (Pacífico)" },
  { value: "America/Cancun", label: "America/Cancun (Quintana Roo)" },
  { value: "UTC", label: "UTC" },
];
const DEFAULT_GLOBAL_WORK_WEEK = {
  mon: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } },
  tue: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } },
  wed: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } },
  thu: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } },
  fri: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } },
  sat: { enabled: true, workHours: { startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 } },
  sun: { enabled: false, workHours: { startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 } },
};

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

function normalizeWorkWeekSchedule(source, fallbackWorkHours) {
  const weekSource = source && typeof source === "object" ? source : {};
  return WEEKDAY_META.reduce((accumulator, day) => {
    const daySource = weekSource[day.key] && typeof weekSource[day.key] === "object" ? weekSource[day.key] : {};
    const defaultEntry = DEFAULT_GLOBAL_WORK_WEEK[day.key] || { enabled: true, workHours: fallbackWorkHours || { startHour: 8, startMinute: 0, endHour: 16, endMinute: 0 } };
    const hasOwnEnabled = Object.prototype.hasOwnProperty.call(daySource, "enabled");
    const mergedWorkHoursSource = daySource.workHours && typeof daySource.workHours === "object" ? daySource.workHours : daySource;
    accumulator[day.key] = {
      enabled: hasOwnEnabled ? Boolean(daySource.enabled) : Boolean(defaultEntry.enabled),
      workHours: {
        startHour: Math.min(23, Math.max(0, Math.round(Number(mergedWorkHoursSource.startHour ?? defaultEntry.workHours.startHour ?? 8)))),
        startMinute: Math.min(59, Math.max(0, Math.round(Number(mergedWorkHoursSource.startMinute ?? defaultEntry.workHours.startMinute ?? 0)))),
        endHour: Math.min(24, Math.max(0, Math.round(Number(mergedWorkHoursSource.endHour ?? defaultEntry.workHours.endHour ?? 16)))),
        endMinute: Math.min(59, Math.max(0, Math.round(Number(mergedWorkHoursSource.endMinute ?? defaultEntry.workHours.endMinute ?? 0)))),
      },
    };
    return accumulator;
  }, {});
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
  const [timeZoneDraft, setTimeZoneDraft] = useState(() => operationalSettings.timeZone || "America/Mexico_City");
  const [workWeekDraft, setWorkWeekDraft] = useState(() => normalizeWorkWeekSchedule(
    operationalSettings.pauseControl.workWeek,
    operationalSettings.pauseControl.workHours || { startHour: 8, endHour: 16, startMinute: 0, endMinute: 0 },
  ));
  const [areaPauseControlsDraft, setAreaPauseControlsDraft] = useState(() => operationalSettings.pauseControl.areaPauseControls || {});
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [isSavingTimeZone, setIsSavingTimeZone] = useState(false);
  const [isSavingAreaPauseControls, setIsSavingAreaPauseControls] = useState(false);

  useEffect(() => {
    setPauseDraft(operationalSettings.pauseControl);
  }, [operationalSettings.pauseControl]);
  useEffect(() => {
    setTimeZoneDraft(operationalSettings.timeZone || "America/Mexico_City");
  }, [operationalSettings.timeZone]);
  useEffect(() => {
    setWorkWeekDraft(normalizeWorkWeekSchedule(
      operationalSettings.pauseControl.workWeek,
      operationalSettings.pauseControl.workHours || { startHour: 8, endHour: 16, startMinute: 0, endMinute: 0 },
    ));
  }, [operationalSettings.pauseControl.workWeek, operationalSettings.pauseControl.workHours]);
  useEffect(() => {
    const source = operationalSettings.pauseControl.areaPauseControls || {};
    const normalized = {};
    areaKeys.forEach((key) => {
      const entry = source[key] || {};
      normalized[key] = {
        enabled: Boolean(entry.enabled),
        includeInGlobalPause: entry.includeInGlobalPause !== false,
        workHours: entry.workHours || { startHour: 0, startMinute: 0, endHour: 24, endMinute: 0 },
      };
    });
    setAreaPauseControlsDraft(normalized);
  }, [operationalSettings.pauseControl.areaPauseControls, areaKeys]);

  async function handleSaveTimeZone() {
    if (!canManageSystemSettings || isSavingTimeZone) return;
    setIsSavingTimeZone(true);
    try {
      await updateSystemOperationalSettings({ timeZone: timeZoneDraft });
      pushAppToast("Zona horaria guardada correctamente.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar la zona horaria.", "danger");
    } finally {
      setIsSavingTimeZone(false);
    }
  }

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

  async function toggleGlobalPause() {
    if (!canManageSystemSettings || isSavingPause) return;
    const nextEnabled = !Boolean(pauseDraft?.globalPauseEnabled);
    setIsSavingPause(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: {
          ...pauseDraft,
          forceGlobalPause: nextEnabled,
          globalPauseEnabled: nextEnabled,
          globalPauseAutoDisabledUntil: null,
        },
      });
      pushAppToast(nextEnabled ? "Pausa global activada." : "Pausa global desactivada.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo actualizar la pausa global.", "danger");
    } finally {
      setIsSavingPause(false);
    }
  }

  async function toggleExtraTime() {
    if (!canManageSystemSettings || isSavingPause) return;
    const nextForceGlobalPause = !Boolean(pauseDraft?.forceGlobalPause);
    setIsSavingPause(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: {
          ...pauseDraft,
          forceGlobalPause: nextForceGlobalPause,
          globalPauseEnabled: nextForceGlobalPause ? true : Boolean(pauseDraft?.globalPauseEnabled),
          globalPauseAutoDisabledUntil: null,
        },
      });
      pushAppToast(nextForceGlobalPause ? "Tiempo extra activado." : "Tiempo extra desactivado.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo actualizar el tiempo extra.", "danger");
    } finally {
      setIsSavingPause(false);
    }
  }

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
    const normalizedWorkWeek = normalizeWorkWeekSchedule(workWeekDraft, pauseDraft?.workHours || { startHour: 8, endHour: 16, startMinute: 0, endMinute: 0 });
    const fallbackLegacyEntry = normalizedWorkWeek.mon || DEFAULT_GLOBAL_WORK_WEEK.mon;
    const firstEnabledEntry = WEEKDAY_META
      .map((day) => normalizedWorkWeek[day.key])
      .find((entry) => entry?.enabled && entry?.workHours)
      || fallbackLegacyEntry;
    const nextLegacyWorkHours = {
      startHour: Number(firstEnabledEntry?.workHours?.startHour ?? 8),
      startMinute: Number(firstEnabledEntry?.workHours?.startMinute ?? 0),
      endHour: Number(firstEnabledEntry?.workHours?.endHour ?? 16),
      endMinute: Number(firstEnabledEntry?.workHours?.endMinute ?? 0),
    };
    setIsSavingWorkHours(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: {
          ...pauseDraft,
          workHours: nextLegacyWorkHours,
          workWeek: normalizedWorkWeek,
        },
      });
      pushAppToast("Horario laboral semanal guardado correctamente.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar el horario laboral.", "danger");
    } finally {
      setIsSavingWorkHours(false);
    }
  }

  function handleGlobalTimeChange(dayKey, kind, value) {
    const daySource = workWeekDraft[dayKey]?.workHours || {};
    const fallbackHour = kind === "start" ? Number(daySource.startHour) || 0 : Number(daySource.endHour) || 24;
    const fallbackMinute = kind === "start" ? Number(daySource.startMinute) || 0 : Number(daySource.endMinute) || 0;
    const { hour, minute } = parseTimeValue(value, fallbackHour, fallbackMinute);
    setWorkWeekDraft((current) => {
      const dayCurrent = current[dayKey] || DEFAULT_GLOBAL_WORK_WEEK[dayKey] || DEFAULT_GLOBAL_WORK_WEEK.mon;
      const nextWorkHours = {
        ...dayCurrent.workHours,
        ...(kind === "start" ? { startHour: hour, startMinute: minute } : { endHour: hour, endMinute: minute }),
      };
      return {
        ...current,
        [dayKey]: {
          ...dayCurrent,
          workHours: nextWorkHours,
        },
      };
    });
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

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Zona horaria operativa</h3>
            <p className="subtle-line">Controla los horarios y cortes automáticos con una sola zona horaria oficial.</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 360px) auto", gap: 12, alignItems: "end" }}>
          <label className="app-modal-field" style={{ margin: 0 }}>
            <span>Zona horaria</span>
            <select
              value={timeZoneDraft}
              onChange={(event) => setTimeZoneDraft(event.target.value)}
              disabled={!canManageSystemSettings || isSavingTimeZone}
            >
              {TIMEZONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="row-actions compact system-config-actions" style={{ margin: 0 }}>
            <button type="button" className="primary-button" onClick={handleSaveTimeZone} disabled={!canManageSystemSettings || isSavingTimeZone}>
              {isSavingTimeZone ? "Guardando..." : "Guardar zona horaria"}
            </button>
          </div>
        </div>
      </article>

      <div className="system-config-dual-sections">
      <article className="surface-card admin-surface-card system-config-compact-surface">
        <div className="card-header-row">
          <div>
            <h3>Horario laboral global</h3>
            <p className="subtle-line">Define dias laborables y su horario (L-V 08:00-16:00, Sabado 08:00-12:00, Domingo no laborable). Usa tiempo extra para forzar operacion especial.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "center", flexShrink: 0 }}>
            <div className="app-modal-field">
              <span>Pausa global</span>
              <button type="button" className={`switch-button system-config-switch ${pauseDraft?.globalPauseEnabled ? "on" : ""}`} onClick={toggleGlobalPause} disabled={!canManageSystemSettings || isSavingPause} aria-label="Alternar pausa global activa">
                <span className="switch-thumb" />
              </button>
            </div>
            <div className="app-modal-field">
              <span>Tiempo extra</span>
              <button type="button" className={`switch-button system-config-switch ${pauseDraft?.forceGlobalPause ? "on" : ""}`} onClick={toggleExtraTime} disabled={!canManageSystemSettings || isSavingPause} aria-label="Alternar tiempo extra">
                <span className="switch-thumb" />
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {WEEKDAY_META.map((day) => {
            const dayEntry = workWeekDraft[day.key] || DEFAULT_GLOBAL_WORK_WEEK[day.key];
            const dayHours = dayEntry?.workHours || DEFAULT_GLOBAL_WORK_WEEK[day.key].workHours;
            const endHourValue = String(Math.min(24, Math.max(0, Number(dayHours.endHour) || 24))).padStart(2, "0");
            return (
              <div key={day.key} className="system-config-card" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{day.label}</strong>
                  <div className="app-modal-field" style={{ display: "inline-flex", flexDirection: "row", gap: 8, alignItems: "center", margin: 0 }}>
                    <span style={{ fontSize: "0.9rem" }}>Laborable</span>
                    <button
                      type="button"
                      className={`switch-button system-config-switch ${dayEntry?.enabled ? "on" : ""}`}
                      onClick={() => setWorkWeekDraft((current) => ({
                        ...current,
                        [day.key]: {
                          ...(current[day.key] || DEFAULT_GLOBAL_WORK_WEEK[day.key]),
                          enabled: current[day.key]?.enabled !== true,
                        },
                      }))}
                      disabled={!canManageSystemSettings}
                      aria-label={`Alternar día laborable para ${day.label}`}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                </div>
                {dayEntry?.enabled ? (
                  <div className="system-config-clock-grid system-config-clock-grid-two">
                    <div className="app-modal-field system-time-field">
                      <span>Inicio</span>
                      <div className="system-time-input-wrap">
                        <div className="system-time-select-row">
                          <select
                            className="system-time-select"
                            value={String(Math.min(23, Math.max(0, Number(dayHours.startHour) || 0))).padStart(2, "0")}
                            onChange={(event) => handleGlobalTimeChange(day.key, "start", `${event.target.value}:${String(Math.min(59, Math.max(0, Number(dayHours.startMinute) || 0))).padStart(2, "0")}`)}
                            disabled={!canManageSystemSettings}
                          >
                            {HOURS_24.map((hour) => <option key={`${day.key}-start-hour-${hour}`} value={hour}>{hour}</option>)}
                          </select>
                          <span>:</span>
                          <select
                            className="system-time-select"
                            value={String(Math.min(59, Math.max(0, Number(dayHours.startMinute) || 0))).padStart(2, "0")}
                            onChange={(event) => handleGlobalTimeChange(day.key, "start", `${String(Math.min(23, Math.max(0, Number(dayHours.startHour) || 0))).padStart(2, "0")}:${event.target.value}`)}
                            disabled={!canManageSystemSettings}
                          >
                            {MINUTES_60.map((minute) => <option key={`${day.key}-start-minute-${minute}`} value={minute}>{minute}</option>)}
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
                            value={endHourValue}
                            onChange={(event) => {
                              const nextHour = event.target.value;
                              const nextMinute = nextHour === "24" ? "00" : String(Math.min(59, Math.max(0, Number(dayHours.endMinute) || 0))).padStart(2, "0");
                              handleGlobalTimeChange(day.key, "end", `${nextHour}:${nextMinute}`);
                            }}
                            disabled={!canManageSystemSettings}
                          >
                            {HOURS_24_WITH_24.map((hour) => <option key={`${day.key}-end-hour-${hour}`} value={hour}>{hour}</option>)}
                          </select>
                          <span>:</span>
                          <select
                            className="system-time-select"
                            value={String(Math.min(59, Math.max(0, Number(dayHours.endMinute) || 0))).padStart(2, "0")}
                            onChange={(event) => handleGlobalTimeChange(day.key, "end", `${endHourValue}:${event.target.value}`)}
                            disabled={!canManageSystemSettings || Number(dayHours.endHour) === 24}
                          >
                            {MINUTES_60.map((minute) => <option key={`${day.key}-end-minute-${minute}`} value={minute}>{minute}</option>)}
                          </select>
                        </div>
                        <span className="system-time-icon" aria-hidden="true">🕒</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="subtle-line" style={{ margin: 0 }}>No laborable: la pausa global automatica permanecera activa todo el dia.</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="row-actions compact system-config-actions">
          <button type="button" className="primary-button" onClick={handleSaveWorkHours} disabled={!canManageSystemSettings || isSavingWorkHours}>
            {isSavingWorkHours ? "Guardando..." : "Guardar horario laboral"}
          </button>
        </div>
      </article>

      <article className="surface-card admin-surface-card system-config-compact-surface">
        <div className="card-header-row">
          <div>
            <h3>Horario laboral por área</h3>
            <p className="subtle-line">Activa un área real para que use horario propio y quede fuera del global.</p>
          </div>
        </div>

        <div className="system-config-grid">
          {areaKeys.map((area) => {
            const areaControl = areaPauseControlsDraft[area] || { enabled: false, includeInGlobalPause: true, workHours: {} };
            return (
              <div key={area} className="system-config-card">
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <strong>{area}</strong>
                  <div className="app-modal-field" style={{ display: "inline-flex", flexDirection: "row", gap: 8, alignItems: "center", whiteSpace: "nowrap", margin: 0 }}>
                    <span>Incluye pausa global</span>
                    <button
                      type="button"
                      className={`switch-button system-config-switch ${areaControl.includeInGlobalPause === false ? "" : "on"}`}
                      onClick={() => setAreaPauseControlsDraft((current) => ({
                        ...current,
                        [area]: {
                          ...(current[area] || areaControl),
                          includeInGlobalPause: current[area]?.includeInGlobalPause === false,
                        },
                      }))}
                      disabled={!canManageSystemSettings}
                      aria-label={`Alternar inclusión de pausa global para ${area}`}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="subtle-line" style={{ margin: 0 }}>Horario propio</span>
                  <div className="app-modal-field" style={{ display: "inline-flex", flexDirection: "row", gap: 8, alignItems: "center", whiteSpace: "nowrap", margin: 0 }}>
                    <button
                      type="button"
                      className={`switch-button system-config-switch ${areaControl.enabled ? "on" : ""}`}
                      onClick={() => setAreaPauseControlsDraft((current) => ({
                        ...current,
                        [area]: {
                          ...areaControl,
                          enabled: current[area]?.enabled !== true,
                        },
                      }))}
                      disabled={!canManageSystemSettings}
                      aria-label={`Alternar horario propio para ${area}`}
                    >
                      <span className="switch-thumb" />
                    </button>
                  </div>
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
      </div>

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
