import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function HistorialSemanas({ contexto }) {
  const {
    state,
    activeWeek,
    StatTile,
    STATUS_FINISHED,
    formatDate,
    setSelectedHistoryWeekId,
    Search,
    historyWeek,
    MetricCard,
    formatMinutes,
    getActivityLabel,
    getTimeLimitMinutes,
    catalogMap,
    userMap,
    StatusBadge,
    formatTime,
    formatDurationClock,
    setHistoryPauseActivityId,
    actionPermissions,
    deleteWeek,
    pushAppToast,
    Trash2,
  } = contexto;

  const [deleteWeekModal, setDeleteWeekModal] = useState({ open: false, weekId: "", weekName: "", isSubmitting: false });

  useEffect(() => {
    if (!deleteWeekModal.open) return undefined;

    function handleDeleteWeekHotkeys(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!deleteWeekModal.isSubmitting) {
          setDeleteWeekModal({ open: false, weekId: "", weekName: "", isSubmitting: false });
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (!deleteWeekModal.isSubmitting) {
          void confirmDeleteWeek();
        }
      }
    }

    globalThis.addEventListener("keydown", handleDeleteWeekHotkeys);
    return () => globalThis.removeEventListener("keydown", handleDeleteWeekHotkeys);
  }, [deleteWeekModal.open, deleteWeekModal.isSubmitting, deleteWeekModal.weekId]);

  async function confirmDeleteWeek() {
    if (!deleteWeekModal.weekId || deleteWeekModal.isSubmitting) return;
    setDeleteWeekModal((current) => ({ ...current, isSubmitting: true }));
    try {
      await deleteWeek(deleteWeekModal.weekId);
      pushAppToast(`Semana ${deleteWeekModal.weekName} eliminada correctamente.`, "success");
      setDeleteWeekModal({ open: false, weekId: "", weekName: "", isSubmitting: false });
    } catch (error) {
      pushAppToast(error?.message || "No se pudo eliminar la semana.", "danger");
      setDeleteWeekModal((current) => ({ ...current, isSubmitting: false }));
    }
  }

  return (
    <section className="history-page-layout">
      <article className="history-summary-card">
        <div>
          <h3>Historial de Semanas</h3>
          <p>Consulta semanas cerradas y revisa sus actividades sin editar información.</p>
        </div>
        <span className="chip">{state.weeks.length} semanas</span>
      </article>

      <div className="history-stat-strip">
        <StatTile label="Semanas activas" value={state.weeks.filter((week) => week.isActive).length} />
        <StatTile label="Semanas cerradas" value={state.weeks.filter((week) => !week.isActive).length} tone="soft" />
        <StatTile label="Actividades históricas" value={state.activities.filter((item) => item.weekId !== activeWeek?.id).length} tone="success" />
      </div>

      <section className="page-grid history-grid">
        <article className="surface-card table-card history-surface-card">
          <div className="card-header-row">
            <div>
              <h3>Todas las semanas</h3>
              <p>Consulta de solo lectura del histórico operativo.</p>
            </div>
            <span className="chip">{state.weeks.length} semanas registradas</span>
          </div>
          <div className="table-wrap">
            <table className="history-table-clean">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Fechas</th>
                  <th>Actividades</th>
                  <th>Completadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.weeks.map((week) => {
                  const weekRows = state.activities.filter((activity) => activity.weekId === week.id);
                  const completed = weekRows.filter((activity) => activity.status === STATUS_FINISHED).length;
                  return (
                    <tr key={week.id}>
                      <td>{week.name}</td>
                      <td>{formatDate(week.startDate)} - {formatDate(week.endDate)}</td>
                      <td>{weekRows.length}</td>
                      <td>{completed}</td>
                      <td><span className={week.isActive ? "chip success" : "chip"}>{week.isActive ? "Activa" : "Histórica"}</span></td>
                      <td>
                        <div className="history-week-actions">
                          <button type="button" className="icon-button" onClick={() => setSelectedHistoryWeekId(week.id)}><Search size={15} /> Ver detalle</button>
                          {actionPermissions.deleteWeek ? (
                            <button
                              type="button"
                              className="icon-button danger"
                              onClick={() => setDeleteWeekModal({ open: true, weekId: week.id, weekName: week.name, isSubmitting: false })}
                            >
                              <Trash2 size={15} /> Borrar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="surface-card table-card detail-panel history-detail-card">
          <div className="card-header-row">
            <div>
              <h3>{historyWeek?.name || "Selecciona una semana"}</h3>
              <p>Vista de solo lectura del desempeño semanal.</p>
            </div>
          </div>
          {historyWeek ? (
            <>
              <div className="metric-grid three-up">
                <MetricCard label="Tiempo total efectivo" value={formatMinutes(state.activities.filter((item) => item.weekId === historyWeek.id).reduce((sum, item) => sum + item.accumulatedSeconds, 0) / 60)} hint="Suma total de la semana" />
                <MetricCard label="Actividades completadas" value={String(state.activities.filter((item) => item.weekId === historyWeek.id && item.status === STATUS_FINISHED).length)} hint="Terminadas en la semana" />
                <MetricCard label="Fuera de tiempo límite" value={String(state.activities.filter((item) => item.weekId === historyWeek.id && item.accumulatedSeconds > getTimeLimitMinutes(item, catalogMap) * 60).length)} hint="Desviaciones detectadas" tone="danger" />
              </div>

              <div className="table-wrap compact-table">
                <table className="history-table-clean">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Actividad</th>
                      <th>Player</th>
                      <th>Estado</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Tiempo</th>
                      <th>Límite</th>
                      <th>Pausas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.activities.filter((item) => item.weekId === historyWeek.id).map((activity) => (
                      <tr key={activity.id}>
                        <td>{formatDate(activity.activityDate)}</td>
                        <td>{getActivityLabel(activity, catalogMap)}</td>
                        <td title={userMap.get(activity.responsibleId)?.name || "Sin player"}>{userMap.get(activity.responsibleId)?.name || "Sin player"}</td>
                        <td><StatusBadge status={activity.status} /></td>
                        <td>{formatTime(activity.startTime)}</td>
                        <td>{formatTime(activity.endTime)}</td>
                        <td>{formatDurationClock(activity.accumulatedSeconds)}</td>
                        <td>{getTimeLimitMinutes(activity, catalogMap)} min</td>
                        <td><button type="button" className="icon-button" onClick={() => setHistoryPauseActivityId(activity.id)}>Ver pausas</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </article>
      </section>

      {deleteWeekModal.open ? createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="delete-week-title" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.5rem", maxWidth: 460, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 id="delete-week-title" style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#032121" }}>¿Borrar semana completa?</h3>
            <p style={{ margin: "0 0 1.2rem", color: "#555", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Se eliminará {deleteWeekModal.weekName || "esta semana"} junto con todas sus actividades y pausas asociadas.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid #ddd", background: "#f3f4f6", cursor: "pointer" }}
                onClick={() => setDeleteWeekModal({ open: false, weekId: "", weekName: "", isSubmitting: false })}
                disabled={deleteWeekModal.isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "none", background: "#7f1d1d", color: "#fff", cursor: "pointer" }}
                onClick={() => { void confirmDeleteWeek(); }}
                disabled={deleteWeekModal.isSubmitting}
              >
                {deleteWeekModal.isSubmitting ? "Borrando..." : "Sí, borrar"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
