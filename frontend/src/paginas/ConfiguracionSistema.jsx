import { useEffect, useMemo, useState } from "react";
import { normalizeSystemOperationalSettings } from "../utils/utilidades.jsx";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Lunes", short: "L" },
  { value: 1, label: "Martes", short: "M" },
  { value: 2, label: "Miércoles", short: "M" },
  { value: 3, label: "Jueves", short: "J" },
  { value: 4, label: "Viernes", short: "V" },
  { value: 5, label: "Sábado", short: "S" },
];

const NAVE_OPTIONS = ["C1", "C2", "C3", "P"];

function normalizeWeekOptions(state) {
  const activeWeekKey = String(state?.boardWeeklyCycle?.activeWeekKey || "").trim();
  const history = Array.isArray(state?.boardWeekHistory) ? state.boardWeekHistory : [];
  const options = [];
  if (activeWeekKey) {
    options.push({ key: activeWeekKey, label: `Semana activa (${activeWeekKey})` });
  }
  history.forEach((snapshot) => {
    const weekKey = String(snapshot?.weekKey || "").trim();
    if (!weekKey || options.some((entry) => entry.key === weekKey)) return;
    options.push({ key: weekKey, label: snapshot?.weekName || weekKey });
  });
  return options;
}

export default function ConfiguracionSistema({ contexto }) {
  const {
    actionPermissions,
    PauseCircle,
    Play,
    pushAppToast,
    state,
    updateSystemOperationalSettings,
  } = contexto;

  const canManageSystemSettings = Boolean(actionPermissions?.manageSystemSettings);
  const operationalSettings = useMemo(
    () => normalizeSystemOperationalSettings(state?.system?.operational),
    [state?.system?.operational],
  );
  const weekOptions = useMemo(() => normalizeWeekOptions(state), [state]);
  const [selectedWeekKey, setSelectedWeekKey] = useState(() => weekOptions[0]?.key || "");
  const [scheduleDraft, setScheduleDraft] = useState(() => {
    const weekKey = weekOptions[0]?.key || "";
    return operationalSettings.naveWeekSchedules[weekKey] || { C1: [], C2: [], C3: [], P: [] };
  });
  const [pauseDraft, setPauseDraft] = useState(() => operationalSettings.pauseControl);
    const [workHoursDraft, setWorkHoursDraft] = useState(() => operationalSettings.pauseControl.workHours || { startHour: 8, endHour: 16 });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isSavingPause, setIsSavingPause] = useState(false);

  useEffect(() => {
    if (!selectedWeekKey) {
      setSelectedWeekKey(weekOptions[0]?.key || "");
      return;
    }
    if (!weekOptions.some((entry) => entry.key === selectedWeekKey)) {
      setSelectedWeekKey(weekOptions[0]?.key || "");
    }
  }, [selectedWeekKey, weekOptions]);

  useEffect(() => {
    const current = operationalSettings.naveWeekSchedules[selectedWeekKey] || { C1: [], C2: [], C3: [], P: [] };
    setScheduleDraft(current);
  }, [operationalSettings.naveWeekSchedules, selectedWeekKey]);

  useEffect(() => {
    setPauseDraft(operationalSettings.pauseControl);
  }, [operationalSettings.pauseControl]);
  useEffect(() => {
    setWorkHoursDraft(operationalSettings.pauseControl.workHours || { startHour: 8, endHour: 16 });
  }, [operationalSettings.pauseControl.workHours]);

  function toggleNaveDay(nave, dayOffset) {
    setScheduleDraft((current) => {
      const currentDays = Array.isArray(current?.[nave]) ? current[nave] : [];
      const hasDay = currentDays.includes(dayOffset);
      const nextDays = hasDay ? currentDays.filter((item) => item !== dayOffset) : currentDays.concat([dayOffset]).sort((a, b) => a - b);
      return {
        ...current,
        [nave]: nextDays,
      };
    });
  }

  async function handleSaveWeekSchedule() {
    if (!selectedWeekKey || !canManageSystemSettings || isSavingSchedule) return;
    setIsSavingSchedule(true);
    try {
      const nextWeekSchedules = {
        ...operationalSettings.naveWeekSchedules,
        [selectedWeekKey]: scheduleDraft,
      };
      await updateSystemOperationalSettings({
        naveWeekSchedules: nextWeekSchedules,
      });
      pushAppToast("Horario semanal por nave actualizado.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo actualizar el horario semanal.", "danger");
    } finally {
      setIsSavingSchedule(false);
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

  async function handleQuickGlobalPauseToggle(nextValues) {
    if (!canManageSystemSettings) return;
    const previousPauseControl = pauseDraft;
    const nextPauseControl = {
      ...pauseDraft,
      ...nextValues,
    };
    setPauseDraft(nextPauseControl);
    try {
      await updateSystemOperationalSettings({ pauseControl: nextPauseControl });
      pushAppToast(nextPauseControl.globalPauseEnabled ? "Pausa global activada." : "Pausa global desactivada.", "success");
    } catch (error) {
      setPauseDraft(previousPauseControl);
      pushAppToast(error?.message || "No se pudo actualizar la pausa global.", "danger");
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
        },
      ]),
    }));
  }

  const [isSavingWorkHours, setIsSavingWorkHours] = useState(false);

  async function handleSaveWorkHours() {
    if (!canManageSystemSettings || isSavingWorkHours) return;
    const startHour = Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.startHour) || 8)));
    const endHour = Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.endHour) || 16)));
    setIsSavingWorkHours(true);
    try {
      await updateSystemOperationalSettings({
        pauseControl: { ...pauseDraft, workHours: { startHour, endHour } },
      });
      pushAppToast(`Horario laboral guardado: ${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`, "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo guardar el horario laboral.", "danger");
    } finally {
      setIsSavingWorkHours(false);
    }
  }

  return (
    <section className="admin-page-layout">
      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Configuración del sistema</h3>
            <p className="subtle-line">Centraliza pausas globales, reglas de pausa y programación semanal por nave.</p>
          </div>
        </div>
      </article>

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Horario laboral</h3>
            <p className="subtle-line">Define el rango horario en que se acumula tiempo en los tableros. Fuera de este rango el contador se congela automáticamente.</p>
          </div>
        </div>
        <div className="modal-form-grid system-config-pause-grid">
          <label className="app-modal-field">
            <span>Hora de inicio (0–23)</span>
            <input
              type="number"
              min="0"
              max="23"
              value={workHoursDraft.startHour ?? 8}
              onChange={(event) => setWorkHoursDraft((current) => ({ ...current, startHour: event.target.value === "" ? "" : Number(event.target.value) }))}
              disabled={!canManageSystemSettings}
            />
          </label>
          <label className="app-modal-field">
            <span>Hora de fin (0–23)</span>
            <input
              type="number"
              min="0"
              max="23"
              value={workHoursDraft.endHour ?? 16}
              onChange={(event) => setWorkHoursDraft((current) => ({ ...current, endHour: event.target.value === "" ? "" : Number(event.target.value) }))}
              disabled={!canManageSystemSettings}
            />
          </label>
        </div>
        <p className="subtle-line" style={{ marginTop: 4 }}>
          Ventana activa: <strong>{String(Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.startHour) || 8)))).padStart(2, "0")}:00</strong> – <strong>{String(Math.min(23, Math.max(0, Math.round(Number(workHoursDraft.endHour) || 16)))).padStart(2, "0")}:00</strong>
        </p>
        <div className="row-actions compact">
          <button type="button" className="primary-button" onClick={handleSaveWorkHours} disabled={!canManageSystemSettings || isSavingWorkHours}>
            {isSavingWorkHours ? "Guardando..." : "Guardar horario laboral"}
          </button>
        </div>
      </article>

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Horario semanal por nave</h3>
            <p className="subtle-line">Define qué días le tocan a cada nave por semana. En Mis tableros solo aparecerán actividades del día consultado.</p>
          </div>
          <label className="board-top-select min-width">
            <span>Semana</span>
            <select value={selectedWeekKey} onChange={(event) => setSelectedWeekKey(event.target.value)}>
              {weekOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <div className="system-config-grid">
          {NAVE_OPTIONS.map((nave) => (
            <div key={nave} className="system-config-card">
              <strong>{nave}</strong>
              <div className="catalog-activity-chip-row">
                {WEEKDAY_OPTIONS.map((day) => {
                  const active = Array.isArray(scheduleDraft?.[nave]) && scheduleDraft[nave].includes(day.value);
                  return (
                    <button
                      key={`${nave}-${day.value}`}
                      type="button"
                      className={`catalog-day-chip ${active ? "active" : ""}`.trim()}
                      title={day.label}
                      onClick={() => toggleNaveDay(nave, day.value)}
                      disabled={!canManageSystemSettings}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="row-actions compact">
          <button type="button" className="primary-button" onClick={handleSaveWeekSchedule} disabled={!canManageSystemSettings || isSavingSchedule}>
            {isSavingSchedule ? "Guardando..." : "Guardar horario semanal"}
          </button>
        </div>
      </article>

      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Pausas globales y reglas</h3>
            <p className="subtle-line">Marca qué pausas sí afectan el tiempo y define minutos autorizados sin penalización.</p>
          </div>
          <button type="button" className={`switch-button ${pauseDraft?.globalPauseEnabled ? "on" : ""}`} onClick={() => setPauseDraft((current) => ({ ...current, globalPauseEnabled: !current.globalPauseEnabled }))} disabled={!canManageSystemSettings} aria-label="Alternar pausa global">
            <span className="switch-thumb" />
          </button>
        </div>

        <div className="board-global-pause-top">
          <div className="saved-board-list">
            <span className="chip primary">Global</span>
            <span className="chip" style={pauseDraft?.globalPauseEnabled ? { background: "#fee2e2", color: "#991b1b" } : { background: "#ecfdf3", color: "#166534" }}>
              {pauseDraft?.globalPauseEnabled ? "Pausa global activa" : "Global activo"}
            </span>
            {pauseDraft?.forceGlobalPause ? (
              <span className="chip" style={{ background: "#fff7ed", color: "#9a3412" }}>Horas extra activas</span>
            ) : null}
          </div>
          <div className="row-actions compact board-workflow-actions" aria-label="Control global">
            <button
              type="button"
              className="board-action-button start icon-only"
              title="Quitar pausa global"
              aria-label="Quitar pausa global"
              onClick={() => void handleQuickGlobalPauseToggle({ globalPauseEnabled: false, forceGlobalPause: false })}
              disabled={!canManageSystemSettings || !pauseDraft?.globalPauseEnabled}
            >
              <Play size={13} />
            </button>
            <button
              type="button"
              className="board-action-button pause icon-only"
              title="Activar pausa global"
              aria-label="Activar pausa global"
              onClick={() => void handleQuickGlobalPauseToggle({ globalPauseEnabled: true, forceGlobalPause: false })}
              disabled={!canManageSystemSettings || pauseDraft?.globalPauseEnabled}
            >
              <PauseCircle size={13} />
            </button>
          </div>
        </div>

        <div className="modal-form-grid system-config-pause-grid">
          <label className="app-modal-field">
            <span>Pausa global activa</span>
            <button type="button" className={`switch-button ${pauseDraft?.globalPauseEnabled ? "on" : ""}`} onClick={() => setPauseDraft((current) => ({ ...current, globalPauseEnabled: !current.globalPauseEnabled }))} disabled={!canManageSystemSettings} aria-label="Alternar pausa global activa">
              <span className="switch-thumb" />
            </button>
          </label>
          <label className="app-modal-field">
            <span>Pausa forzada de operación</span>
            <button type="button" className={`switch-button ${pauseDraft?.forceGlobalPause ? "on" : ""}`} onClick={() => setPauseDraft((current) => ({ ...current, forceGlobalPause: !current.forceGlobalPause }))} disabled={!canManageSystemSettings} aria-label="Alternar pausa forzada">
              <span className="switch-thumb" />
            </button>
          </label>
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
              <label className="app-modal-field">
                <span>Afecta contador</span>
                <button
                  type="button"
                  className={`switch-button ${reason.affectsTimer ? "on" : ""}`}
                  onClick={() => setPauseDraft((current) => ({
                    ...current,
                    reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, affectsTimer: !entry.affectsTimer } : entry)),
                  }))}
                  disabled={!canManageSystemSettings}
                  aria-label={`Alternar afecta contador para ${reason.label || "motivo"}`}
                >
                  <span className="switch-thumb" />
                </button>
              </label>
              <label className="app-modal-field">
                <span>Minutos autorizados</span>
                <input type="number" min="0" value={reason.authorizedMinutes ?? 0} onChange={(event) => setPauseDraft((current) => ({
                  ...current,
                  reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, authorizedMinutes: event.target.value } : entry)),
                }))} disabled={!canManageSystemSettings} />
              </label>
              <label className="app-modal-field">
                <span>Habilitada</span>
                <button
                  type="button"
                  className={`switch-button ${reason.enabled ? "on" : ""}`}
                  onClick={() => setPauseDraft((current) => ({
                    ...current,
                    reasons: (current?.reasons || []).map((entry, entryIndex) => (entryIndex === index ? { ...entry, enabled: !entry.enabled } : entry)),
                  }))}
                  disabled={!canManageSystemSettings}
                  aria-label={`Alternar habilitada para ${reason.label || "motivo"}`}
                >
                  <span className="switch-thumb" />
                </button>
              </label>
            </div>
          ))}
        </div>

        <div className="row-actions compact">
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
