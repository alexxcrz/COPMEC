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
  } = contexto;

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
                      <td><button type="button" className="icon-button" onClick={() => setSelectedHistoryWeekId(week.id)}><Search size={15} /> Ver detalle</button></td>
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
    </section>
  );
}
