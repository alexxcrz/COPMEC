import { useEffect, useMemo, useState } from "react";
import { normalizeSystemOperationalSettings } from "../utils/utilidades.jsx";
const TIMEZONE_OPTIONS = [
  { value: "America/Mexico_City", label: "America/Mexico_City (Centro)" },
  { value: "America/Tijuana", label: "America/Tijuana (Pacífico)" },
  { value: "America/Cancun", label: "America/Cancun (Quintana Roo)" },
  { value: "UTC", label: "UTC" },
];

export default function ConfiguracionSistema({ contexto }) {
  const {
    actionPermissions,
    pushAppToast,
    updateSystemOperationalSettings,
    state,
  } = contexto;

  const canManageSystemSettings = Boolean(actionPermissions?.manageSystemSettings);
  const operationalSettings = useMemo(
    () => normalizeSystemOperationalSettings(state?.system?.operational),
    [state?.system?.operational],
  );
  const [pauseDraft, setPauseDraft] = useState(() => operationalSettings.pauseControl);
  const [timeZoneDraft, setTimeZoneDraft] = useState(() => operationalSettings.timeZone || "America/Mexico_City");
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [isSavingTimeZone, setIsSavingTimeZone] = useState(false);

  useEffect(() => {
    setPauseDraft(operationalSettings.pauseControl);
  }, [operationalSettings.pauseControl]);
  useEffect(() => {
    setTimeZoneDraft(operationalSettings.timeZone || "America/Mexico_City");
  }, [operationalSettings.timeZone]);

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

  return (
    <section className="admin-page-layout">
      <article className="surface-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Configuración del sistema</h3>
            <p className="subtle-line">Administra reglas de operación y horarios por área.</p>
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
