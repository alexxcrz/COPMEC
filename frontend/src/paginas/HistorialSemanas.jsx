import { useEffect, useMemo, useState } from "react";
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
    getUserArea,
    StatusBadge,
    formatTime,
    formatDurationClock,
    setHistoryPauseActivityId,
    setEditWeekId,
    actionPermissions,
    deleteWeek,
    pushAppToast,
    Trash2,
  } = contexto;

  const [deleteWeekModal, setDeleteWeekModal] = useState({ open: false, weekId: "", weekName: "", isSubmitting: false });
  const [selectedAreaTab, setSelectedAreaTab] = useState("all");
  const [selectedDayFilter, setSelectedDayFilter] = useState("all");
  const [selectedNaveFilter, setSelectedNaveFilter] = useState("all");
  const [detailViewMode, setDetailViewMode] = useState("activities");
  const [fallbackHistoryWeekId, setFallbackHistoryWeekId] = useState("");

  const derivedBoardWeeks = useMemo(() => {
    const grouped = new Map();
    (state.boardWeekHistory || []).forEach((snapshot) => {
      const weekKey = String(snapshot?.weekKey || "").trim();
      if (!weekKey) return;
      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, {
          id: weekKey,
          name: String(snapshot?.weekName || `Semana ${weekKey}`).trim() || `Semana ${weekKey}`,
          startDate: snapshot?.startDate || null,
          endDate: snapshot?.endDate || null,
          isActive: weekKey === state?.boardWeeklyCycle?.activeWeekKey,
        });
      }
    });

    const activeWeekKey = String(state?.boardWeeklyCycle?.activeWeekKey || "").trim();
    const hasCurrentBoardRows = (state.controlBoards || []).some((board) => Array.isArray(board?.rows) && board.rows.length > 0);
    if (activeWeekKey && hasCurrentBoardRows && !grouped.has(activeWeekKey)) {
      grouped.set(activeWeekKey, {
        id: activeWeekKey,
        name: `Semana activa ${activeWeekKey}`,
        startDate: state?.boardWeeklyCycle?.activeWeekStartDate || null,
        endDate: state?.boardWeeklyCycle?.activeWeekEndDate || null,
        isActive: true,
      });
    }

    return Array.from(grouped.values()).sort((left, right) => String(right.startDate || right.id).localeCompare(String(left.startDate || left.id)));
  }, [state.boardWeekHistory, state.controlBoards, state?.boardWeeklyCycle?.activeWeekEndDate, state?.boardWeeklyCycle?.activeWeekKey, state?.boardWeeklyCycle?.activeWeekStartDate]);

  const useBoardHistoryFallback = (state.weeks || []).length === 0 && derivedBoardWeeks.length > 0;
  const effectiveWeeks = useBoardHistoryFallback ? derivedBoardWeeks : (state.weeks || []);
  const effectiveHistoryWeek = useBoardHistoryFallback
    ? (effectiveWeeks.find((week) => week.id === fallbackHistoryWeekId) || effectiveWeeks[0] || null)
    : historyWeek;

  function resolveHistoryActivityLabel(activity) {
    if (activity?.derivedFromBoardHistory) return String(activity.activityLabel || "Actividad").trim() || "Actividad";
    return getActivityLabel(activity, catalogMap);
  }

  function resolveHistoryTimeLimitMinutes(activity) {
    if (activity?.derivedFromBoardHistory) return 0;
    return getTimeLimitMinutes(activity, catalogMap);
  }

  const weekAreaMap = useMemo(() => {
    const map = new Map();
    effectiveWeeks.forEach((week) => {
      const areas = new Set(
        (() => {
          if (!useBoardHistoryFallback) {
            return (state.activities || []).filter((activity) => activity.weekId === week.id);
          }
          return (state.boardWeekHistory || [])
            .filter((snapshot) => String(snapshot?.weekKey || "").trim() === week.id)
            .flatMap((snapshot) => (snapshot?.rows || []))
            .concat(
              week.id === state?.boardWeeklyCycle?.activeWeekKey
                ? (state.controlBoards || []).flatMap((board) => (board?.rows || []))
                : [],
            );
        })()
          .map((activity) => {
            const areaValue = getUserArea(userMap.get(activity.responsibleId));
            return String(areaValue || "Sin area").trim() || "Sin area";
          }),
      );
      map.set(week.id, areas.size);
    });
    return map;
  }, [effectiveWeeks, getUserArea, state.activities, state.boardWeekHistory, state.controlBoards, state?.boardWeeklyCycle?.activeWeekKey, useBoardHistoryFallback, userMap]);

  const historyActivities = useMemo(() => {
    if (!effectiveHistoryWeek?.id) return [];

    if (useBoardHistoryFallback) {
      const snapshots = (state.boardWeekHistory || [])
        .filter((snapshot) => String(snapshot?.weekKey || "").trim() === effectiveHistoryWeek.id);

      const activeWeekKey = String(state?.boardWeeklyCycle?.activeWeekKey || "").trim();
      const liveBoardsForWeek = effectiveHistoryWeek.id === activeWeekKey
        ? (state.controlBoards || []).map((board) => ({
          id: `${board.id}-live`,
          boardName: board.name,
          rows: board.rows || [],
          settings: board.settings || {},
          startDate: state?.boardWeeklyCycle?.activeWeekStartDate || null,
          endDate: state?.boardWeeklyCycle?.activeWeekEndDate || null,
        }))
        : [];

      const allSources = snapshots.concat(liveBoardsForWeek);

      return allSources.flatMap((snapshot) => {
        const boardContext = String(snapshot?.settings?.operationalContextValue || "").trim();
        return (snapshot?.rows || []).map((row) => {
          const user = userMap.get(row.responsibleId);
          const areaLabel = String(getUserArea(user) || "Sin area").trim() || "Sin area";
          const areaRoot = areaLabel.split("/")[0]?.trim() || areaLabel;
          const rowDateIso = row?.endTime || row?.startTime || row?.createdAt || snapshot?.endDate || snapshot?.startDate;
          const activityDate = new Date(rowDateIso);
          const hasValidDate = !Number.isNaN(activityDate.getTime());
          const dayLabel = hasValidDate
            ? activityDate.toLocaleDateString("es-MX", { weekday: "long" })
            : "Sin dia";
          const normalizedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
          const rowValueText = Object.values(row?.values || {}).find((value) => String(value || "").trim()) || "";

          return {
            id: `${snapshot.id}-${row.id}`,
            weekId: effectiveHistoryWeek.id,
            activityDate: rowDateIso,
            responsibleId: row.responsibleId,
            status: row.status,
            startTime: row.startTime,
            endTime: row.endTime,
            accumulatedSeconds: Number(row.accumulatedSeconds || 0),
            areaLabel,
            areaRoot,
            naveLabel: boardContext || String(snapshot?.boardName || "Sin nave").trim() || "Sin nave",
            dayLabel: normalizedDayLabel,
            activityLabel: String(rowValueText || snapshot?.boardName || "Actividad").trim() || "Actividad",
            lastPauseReason: String(row?.lastPauseReason || "").trim(),
            derivedFromBoardHistory: true,
          };
        });
      });
    }

    return (state.activities || [])
      .filter((activity) => activity.weekId === effectiveHistoryWeek.id)
      .map((activity) => {
        const user = userMap.get(activity.responsibleId);
        const areaLabel = String(getUserArea(user) || "Sin area").trim() || "Sin area";
        const areaRoot = areaLabel.split("/")[0]?.trim() || areaLabel;
        const catalogItem = catalogMap.get(activity.catalogActivityId);
        const cleaningSites = Array.isArray(catalogItem?.cleaningSites)
          ? catalogItem.cleaningSites.map((site) => String(site || "").trim()).filter(Boolean)
          : [];
        const naveLabel = cleaningSites.length
          ? cleaningSites.join(", ")
          : (areaRoot || "Sin nave");

        const activityDate = new Date(activity.activityDate);
        const hasValidDate = !Number.isNaN(activityDate.getTime());
        const dayLabel = hasValidDate
          ? activityDate.toLocaleDateString("es-MX", { weekday: "long" })
          : "Sin dia";
        const normalizedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

        return {
          ...activity,
          areaLabel,
          areaRoot,
          naveLabel,
          dayLabel: normalizedDayLabel,
          derivedFromBoardHistory: false,
        };
      });
  }, [catalogMap, effectiveHistoryWeek?.id, getUserArea, state.activities, state.boardWeekHistory, state.controlBoards, state?.boardWeeklyCycle?.activeWeekEndDate, state?.boardWeeklyCycle?.activeWeekKey, state?.boardWeeklyCycle?.activeWeekStartDate, useBoardHistoryFallback, userMap]);

  const areaTabs = useMemo(() => {
    const grouped = new Map();

    (state.areaCatalog || []).forEach((areaEntry) => {
      const areaRoot = String(areaEntry || "").split("/")[0]?.trim();
      if (!areaRoot) return;
      if (!grouped.has(areaRoot)) grouped.set(areaRoot, 0);
    });

    historyActivities.forEach((activity) => {
      grouped.set(activity.areaRoot, (grouped.get(activity.areaRoot) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([area, total]) => ({ value: area, label: area, total }))
      .sort((left, right) => left.label.localeCompare(right.label, "es-MX"));
  }, [historyActivities, state.areaCatalog]);

  useEffect(() => {
    setSelectedAreaTab("all");
    setSelectedDayFilter("all");
    setSelectedNaveFilter("all");
    setDetailViewMode("activities");
  }, [effectiveHistoryWeek?.id]);

  useEffect(() => {
    if (selectedAreaTab === "all") return;
    if (!areaTabs.some((tab) => tab.value === selectedAreaTab)) {
      setSelectedAreaTab("all");
    }
  }, [areaTabs, selectedAreaTab]);

  const areaScopedActivities = useMemo(() => {
    if (selectedAreaTab === "all") return historyActivities;
    return historyActivities.filter((activity) => activity.areaRoot === selectedAreaTab);
  }, [historyActivities, selectedAreaTab]);

  const dayOptions = useMemo(() => {
    const values = new Set(areaScopedActivities.map((activity) => activity.dayLabel));
    return Array.from(values.values()).sort((left, right) => left.localeCompare(right, "es-MX"));
  }, [areaScopedActivities]);

  const naveOptions = useMemo(() => {
    const values = new Set(areaScopedActivities.map((activity) => activity.naveLabel));
    return Array.from(values.values()).sort((left, right) => left.localeCompare(right, "es-MX"));
  }, [areaScopedActivities]);

  useEffect(() => {
    if (selectedDayFilter !== "all" && !dayOptions.includes(selectedDayFilter)) {
      setSelectedDayFilter("all");
    }
  }, [dayOptions, selectedDayFilter]);

  useEffect(() => {
    if (selectedNaveFilter !== "all" && !naveOptions.includes(selectedNaveFilter)) {
      setSelectedNaveFilter("all");
    }
  }, [naveOptions, selectedNaveFilter]);

  const visibleHistoryActivities = useMemo(() => {
    const filtered = areaScopedActivities
      .filter((activity) => selectedDayFilter === "all" || activity.dayLabel === selectedDayFilter)
      .filter((activity) => selectedNaveFilter === "all" || activity.naveLabel === selectedNaveFilter);

    return [...filtered].sort((left, right) => {
      const leftTime = new Date(left.activityDate).getTime();
      const rightTime = new Date(right.activityDate).getTime();
      if (leftTime !== rightTime) return leftTime - rightTime;
      return left.naveLabel.localeCompare(right.naveLabel, "es-MX");
    });
  }, [areaScopedActivities, selectedDayFilter, selectedNaveFilter]);

  const totalEffectiveMinutes = useMemo(() => {
    const totalSeconds = visibleHistoryActivities.reduce((sum, activity) => sum + (activity.accumulatedSeconds || 0), 0);
    return totalSeconds / 60;
  }, [visibleHistoryActivities]);

  const completedCount = useMemo(() => {
    return visibleHistoryActivities.filter((activity) => activity.status === STATUS_FINISHED).length;
  }, [visibleHistoryActivities, STATUS_FINISHED]);

  const outsideLimitCount = useMemo(() => {
    return visibleHistoryActivities.filter((activity) => {
      const timeLimitMinutes = resolveHistoryTimeLimitMinutes(activity);
      if (timeLimitMinutes <= 0) return false;
      return activity.accumulatedSeconds > timeLimitMinutes * 60;
    }).length;
  }, [visibleHistoryActivities]);

  const dailyHistoryRows = useMemo(() => {
    const grouped = new Map();

    areaScopedActivities.forEach((activity) => {
      const activityDate = new Date(activity.activityDate);
      const hasValidDate = !Number.isNaN(activityDate.getTime());
      if (!hasValidDate) return;

      const dateKey = activityDate.toISOString().slice(0, 10);
      const dayLabel = activity.dayLabel || activityDate.toLocaleDateString("es-MX", { weekday: "long" });
      const current = grouped.get(dateKey) || {
        dateKey,
        dayLabel,
        total: 0,
        completed: 0,
        totalSeconds: 0,
        outsideLimit: 0,
      };

      const timeLimitMinutes = resolveHistoryTimeLimitMinutes(activity);
      current.total += 1;
      current.completed += activity.status === STATUS_FINISHED ? 1 : 0;
      current.totalSeconds += Number(activity.accumulatedSeconds || 0);
      current.outsideLimit += timeLimitMinutes > 0 && Number(activity.accumulatedSeconds || 0) > (timeLimitMinutes * 60) ? 1 : 0;

      grouped.set(dateKey, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.dateKey.localeCompare(left.dateKey));
  }, [areaScopedActivities, STATUS_FINISHED]);

  const canEditHistoricalWeekActivities = !useBoardHistoryFallback && Boolean(actionPermissions.manageWeeks || actionPermissions.deleteWeekActivity);

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
          <p>Consulta semanas cerradas y revisa sus actividades con datos reales del histórico.</p>
        </div>
        <span className="chip">{effectiveWeeks.length} semanas</span>
      </article>

      <div className="history-stat-strip">
        <StatTile label="Semanas activas" value={effectiveWeeks.filter((week) => week.isActive).length} />
        <StatTile label="Semanas cerradas" value={effectiveWeeks.filter((week) => !week.isActive).length} tone="soft" />
        <StatTile label="Actividades históricas" value={historyActivities.length} tone="success" />
      </div>

      <section className="page-grid history-grid">
        <article className="surface-card table-card history-surface-card">
          <div className="card-header-row">
            <div>
              <h3>Todas las semanas</h3>
              <p>Consulta de solo lectura del histórico operativo.</p>
            </div>
            <span className="chip">{effectiveWeeks.length} semanas registradas</span>
          </div>
          <div className="table-wrap">
            <table className="history-table-clean">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Fechas</th>
                  <th>Actividades</th>
                  <th>Completadas</th>
                  <th>Areas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {effectiveWeeks.map((week) => {
                  const weekRows = useBoardHistoryFallback
                    ? (state.boardWeekHistory || [])
                      .filter((snapshot) => String(snapshot?.weekKey || "").trim() === week.id)
                      .flatMap((snapshot) => (snapshot?.rows || []).map((row) => ({ ...row, weekId: week.id })))
                      .concat(
                        week.id === state?.boardWeeklyCycle?.activeWeekKey
                          ? (state.controlBoards || []).flatMap((board) => (board?.rows || []).map((row) => ({ ...row, weekId: week.id })))
                          : [],
                      )
                    : state.activities.filter((activity) => activity.weekId === week.id);
                  const completed = weekRows.filter((activity) => activity.status === STATUS_FINISHED).length;
                  return (
                    <tr key={week.id}>
                      <td>{week.name}</td>
                      <td>{week.startDate && week.endDate ? `${formatDate(week.startDate)} - ${formatDate(week.endDate)}` : "Sin rango"}</td>
                      <td>{weekRows.length}</td>
                      <td>{completed}</td>
                      <td>{weekAreaMap.get(week.id) || 0}</td>
                      <td><span className={week.isActive ? "chip success" : "chip"}>{week.isActive ? "Activa" : "Histórica"}</span></td>
                      <td>
                        <div className="history-week-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => {
                              setSelectedHistoryWeekId(week.id);
                              if (useBoardHistoryFallback) {
                                setFallbackHistoryWeekId(week.id);
                              }
                            }}
                          ><Search size={15} /> Ver detalle</button>
                          {!useBoardHistoryFallback && actionPermissions.deleteWeek ? (
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
              <h3>{effectiveHistoryWeek?.name || "Selecciona una semana"}</h3>
              <p>Vista de solo lectura del desempeño semanal.</p>
            </div>
            {effectiveHistoryWeek && canEditHistoricalWeekActivities ? (
              <button type="button" className="icon-button" onClick={() => setEditWeekId(effectiveHistoryWeek.id)}>
                Editar actividades
              </button>
            ) : null}
          </div>
          {effectiveHistoryWeek ? (
            <>
              <div className="history-area-tabs">
                <button
                  type="button"
                  className={`tab ${detailViewMode === "activities" ? "active" : ""}`}
                  onClick={() => setDetailViewMode("activities")}
                >
                  Actividades
                </button>
                <button
                  type="button"
                  className={`tab ${detailViewMode === "days" ? "active" : ""}`}
                  onClick={() => setDetailViewMode("days")}
                >
                  Días anteriores
                </button>
              </div>

              <div className="history-area-tabs">
                <button
                  type="button"
                  className={`tab ${selectedAreaTab === "all" ? "active" : ""}`}
                  onClick={() => setSelectedAreaTab("all")}
                >
                  Todas las areas ({historyActivities.length})
                </button>
                {areaTabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.value}
                    className={`tab ${selectedAreaTab === tab.value ? "active" : ""}`}
                    onClick={() => setSelectedAreaTab(tab.value)}
                  >
                    {tab.label} ({tab.total})
                  </button>
                ))}
              </div>

              <div className="history-detail-filters">
                <label className="board-top-select min-width">
                  <span>Dia</span>
                  <select value={selectedDayFilter} onChange={(event) => setSelectedDayFilter(event.target.value)}>
                    <option value="all">Todos</option>
                    {dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </label>

                <label className="board-top-select min-width">
                  <span>Nave</span>
                  <select value={selectedNaveFilter} onChange={(event) => setSelectedNaveFilter(event.target.value)}>
                    <option value="all">Todas</option>
                    {naveOptions.map((nave) => <option key={nave} value={nave}>{nave}</option>)}
                  </select>
                </label>
              </div>

              {detailViewMode === "activities" ? (
                <>
                  <div className="metric-grid three-up">
                    <MetricCard label="Tiempo total efectivo" value={formatMinutes(totalEffectiveMinutes)} hint="Suma total del filtro actual" />
                    <MetricCard label="Actividades completadas" value={String(completedCount)} hint="Terminadas en el filtro actual" />
                    <MetricCard label="Fuera de tiempo limite" value={String(outsideLimitCount)} hint="Desviaciones detectadas" tone="danger" />
                  </div>

                  <div className="table-wrap compact-table">
                    <table className="history-table-clean">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Dia</th>
                          <th>Area</th>
                          <th>Nave</th>
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
                        {visibleHistoryActivities.map((activity) => (
                          <tr key={activity.id}>
                            <td>{formatDate(activity.activityDate)}</td>
                            <td>{activity.dayLabel}</td>
                            <td>{activity.areaRoot}</td>
                            <td>{activity.naveLabel}</td>
                            <td>{resolveHistoryActivityLabel(activity)}</td>
                            <td title={userMap.get(activity.responsibleId)?.name || "Sin player"}>{userMap.get(activity.responsibleId)?.name || "Sin player"}</td>
                            <td><StatusBadge status={activity.status} /></td>
                            <td>{formatTime(activity.startTime)}</td>
                            <td>{formatTime(activity.endTime)}</td>
                            <td>{formatDurationClock(activity.accumulatedSeconds)}</td>
                            <td>{resolveHistoryTimeLimitMinutes(activity) > 0 ? `${resolveHistoryTimeLimitMinutes(activity)} min` : "N/A"}</td>
                            <td>
                              {activity.derivedFromBoardHistory
                                ? (activity.lastPauseReason || "Sin detalle")
                                : <button type="button" className="icon-button" onClick={() => setHistoryPauseActivityId(activity.id)}>Ver pausas</button>}
                            </td>
                          </tr>
                        ))}
                        {!visibleHistoryActivities.length ? (
                          <tr>
                            <td colSpan={12}>
                              <span className="subtle-line">No hay actividades para el area, dia o nave seleccionados.</span>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="table-wrap compact-table">
                  <table className="history-table-clean">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Dia</th>
                        <th>Actividades</th>
                        <th>Completadas</th>
                        <th>Tiempo total</th>
                        <th>Fuera de tiempo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyHistoryRows.map((dayRow) => (
                        <tr key={dayRow.dateKey}>
                          <td>{formatDate(`${dayRow.dateKey}T00:00:00.000Z`)}</td>
                          <td>{dayRow.dayLabel}</td>
                          <td>{dayRow.total}</td>
                          <td>{dayRow.completed}</td>
                          <td>{formatDurationClock(dayRow.totalSeconds)}</td>
                          <td>{dayRow.outsideLimit}</td>
                          <td>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => {
                                setSelectedDayFilter(dayRow.dayLabel);
                                setDetailViewMode("activities");
                              }}
                            >
                              Ver actividades
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!dailyHistoryRows.length ? (
                        <tr>
                          <td colSpan={7}>
                            <span className="subtle-line">No hay días históricos para el filtro seleccionado.</span>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
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
