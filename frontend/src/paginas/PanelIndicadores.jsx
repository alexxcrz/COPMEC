import { useEffect, useRef, useState } from "react";

const DASHBOARD_WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function parseDashboardDate(value) {
  if (!value) return null;
  const next = new Date(`${value}T00:00:00`);
  return Number.isNaN(next.getTime()) ? null : next;
}

function formatDashboardDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDashboardDateLabel(date) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function isSameDashboardDay(left, right) {
  return Boolean(left && right)
    && left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function buildDashboardCalendarDays(monthDate) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + index);
    return next;
  });
}

function DashboardDateRangePicker({ startDate, endDate, onChange }) {
  const pickerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDashboardDate(startDate) || parseDashboardDate(endDate) || new Date());
  const [draftStartDate, setDraftStartDate] = useState(startDate || "");
  const [draftEndDate, setDraftEndDate] = useState(endDate || "");

  const start = parseDashboardDate(startDate);
  const end = parseDashboardDate(endDate);
  const draftStart = parseDashboardDate(draftStartDate);
  const draftEnd = parseDashboardDate(draftEndDate);
  const calendarDays = buildDashboardCalendarDays(visibleMonth);
  const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(visibleMonth);
  const buttonLabel = start && end
    ? `${formatDashboardDateLabel(start)} - ${formatDashboardDateLabel(end)}`
    : start
      ? `${formatDashboardDateLabel(start)} - Selecciona fin`
      : "Seleccionar rango de fechas";

  useEffect(() => {
    if (isOpen) return;
    setDraftStartDate(startDate || "");
    setDraftEndDate(endDate || "");
  }, [endDate, isOpen, startDate]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        applyDraftAndClose();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function applyDraftAndClose() {
    onChange({ startDate: draftStartDate, endDate: draftEndDate });
    setIsOpen(false);
  }

  function handleDaySelection(day) {
    const selectedValue = formatDashboardDateValue(day);
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStartDate(selectedValue);
      setDraftEndDate("");
      return;
    }

    if (day.getTime() < draftStart.getTime()) {
      setDraftStartDate(selectedValue);
      setDraftEndDate(formatDashboardDateValue(draftStart));
      return;
    }

    setDraftEndDate(selectedValue);
  }

  return (
    <div ref={pickerRef} className="dashboard-date-range-shell">
      <button type="button" className={`dashboard-date-range-trigger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen((current) => !current)}>
        <span>{buttonLabel}</span>
        <small>{startDate || endDate ? "Rango activo" : "Sin filtro por fecha"}</small>
      </button>
      {isOpen ? (
        <div className="dashboard-date-range-popover">
          <div className="dashboard-date-range-header">
            <button type="button" className="icon-button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>{"<"}</button>
            <strong>{monthLabel}</strong>
            <button type="button" className="icon-button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>{">"}</button>
          </div>
          <div className="dashboard-date-range-weekdays">
            {DASHBOARD_WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
          </div>
          <div className="dashboard-date-range-grid">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelectedStart = isSameDashboardDay(day, draftStart);
              const isSelectedEnd = isSameDashboardDay(day, draftEnd);
              const isInRange = draftStart && draftEnd && day.getTime() > draftStart.getTime() && day.getTime() < draftEnd.getTime();
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`dashboard-date-cell ${isCurrentMonth ? "" : "muted"} ${isSelectedStart || isSelectedEnd ? "selected" : ""} ${isInRange ? "in-range" : ""}`.trim()}
                  onClick={() => handleDaySelection(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="dashboard-date-range-footer">
            <button type="button" className="icon-button" onClick={() => { setDraftStartDate(""); setDraftEndDate(""); }}>Limpiar</button>
            <button type="button" className="icon-button" onClick={applyDraftAndClose}>Confirmar</button>
            <button type="button" className="icon-button" onClick={applyDraftAndClose}>Cerrar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PanelIndicadores({ contexto }) {
  const {
    setDashboardSectionsOpen,
    dashboardFilters,
    setDashboardFilters,
    visibleUsers,
    departmentOptions,
    DashboardSection,
    dashboardMetrics,
    Gauge,
    DashboardKpiCard,
    ClipboardList,
    CircleCheckBig,
    Play,
    PauseCircle,
    formatMetricNumber,
    Clock3,
    CalendarDays,
    Zap,
    AlertTriangle,
    Pause,
    OctagonAlert,
    Users,
    dashboardSectionsOpen,
    dashboardResponsibleRows,
    DashboardBarRow,
    DashboardRankItem,
    getResponsibleVisual,
    dashboardActivityRows,
    DashboardProgressMetric,
    PieChart,
    dashboardDistributionRows,
    DashboardPieChart,
    dashboardTrendRows,
    dashboardAreaRows,
    BarChart3,
    DashboardColumnChart,
    Search,
    dashboardParetoRows,
    DashboardParetoChart,
    DashboardParetoRow,
    dashboardIshikawaRows,
    DashboardIshikawaDiagram,
    DashboardCauseCard,
    pauseAnalysis,
    formatMinutes,
    formatPercent,
    Download,
  } = contexto;

  const areAllSectionsOpen = Object.values(dashboardSectionsOpen).every(Boolean);
  const dashboardExportRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  async function exportDashboardToPdf() {
    if (!dashboardExportRef.current || isExportingPdf) return;

    try {
      setIsExportingPdf(true);
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(dashboardExportRef.current, {
        scale: 2,
        backgroundColor: "#f3f6f4",
        useCORS: true,
        logging: false,
        windowWidth: dashboardExportRef.current.scrollWidth,
        windowHeight: dashboardExportRef.current.scrollHeight,
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;
      let remainingHeight = renderHeight;
      let offsetY = 0;

      pdf.addImage(imageData, "PNG", margin, margin, renderWidth, renderHeight, undefined, "FAST");
      remainingHeight -= pageHeight - margin * 2;

      while (remainingHeight > 0) {
        offsetY -= pageHeight - margin * 2;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, margin + offsetY, renderWidth, renderHeight, undefined, "FAST");
        remainingHeight -= pageHeight - margin * 2;
      }

      const hasDateRange = dashboardFilters.startDate || dashboardFilters.endDate;
      const fileSuffix = hasDateRange ? `${dashboardFilters.startDate || "inicio"}-${dashboardFilters.endDate || "fin"}` : "visible";
      pdf.save(`dashboard-copmec-${fileSuffix}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <section ref={dashboardExportRef} className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h3>Dashboard COPMEC</h3>
          <p>Vista ejecutiva consolidada por semana, quincena o mes, con lectura por player y por área.</p>
        </div>
        <div className="dashboard-topbar-actions">
          <button type="button" className="icon-button" onClick={exportDashboardToPdf} disabled={isExportingPdf}>
            <Download size={15} /> {isExportingPdf ? "Exportando PDF..." : "Exportar PDF"}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setDashboardSectionsOpen({
              executive: !areAllSectionsOpen,
              people: !areAllSectionsOpen,
              trends: !areAllSectionsOpen,
              causes: !areAllSectionsOpen,
              alerts: !areAllSectionsOpen,
            })}
          >
            {areAllSectionsOpen ? "Contraer todo" : "Expandir todo"}
          </button>
        </div>
        <div className="dashboard-filter-panel">
          <div className="dashboard-filter-row">
            <label className="dashboard-filter-field dashboard-filter-field-range">
              <span>Rango de fechas</span>
              <DashboardDateRangePicker
                startDate={dashboardFilters.startDate}
                endDate={dashboardFilters.endDate}
                onChange={({ startDate, endDate }) => setDashboardFilters((current) => ({ ...current, startDate, endDate }))}
              />
            </label>
            <label className="dashboard-filter-field">
              <span>Player</span>
              <select value={dashboardFilters.responsibleId} onChange={(event) => setDashboardFilters((current) => ({ ...current, responsibleId: event.target.value }))}>
                <option value="all">Todos los players</option>
                {visibleUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label className="dashboard-filter-field">
              <span>Área</span>
              <select value={dashboardFilters.area} onChange={(event) => setDashboardFilters((current) => ({ ...current, area: event.target.value }))}>
                <option value="all">Todas las áreas</option>
                {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </label>
            <label className="dashboard-filter-field">
              <span>Fuente</span>
              <select value={dashboardFilters.source} onChange={(event) => setDashboardFilters((current) => ({ ...current, source: event.target.value }))}>
                <option value="all">Todo el flujo</option>
                <option value="activity">Actividades semanales</option>
                <option value="board">Tableros operativos</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <DashboardSection title="Resumen ejecutivo" subtitle="KPIs principales para una lectura rápida del periodo filtrado." summary={`${dashboardMetrics.total} registros · ${dashboardMetrics.completed} cerrados · ${dashboardMetrics.areaCount} áreas`} icon={Gauge} open={dashboardSectionsOpen.executive} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, executive: !current.executive }))}>
        <div className="dashboard-kpi-grid dashboard-kpi-grid-main">
          <DashboardKpiCard title="Registros analizados" value={String(dashboardMetrics.total)} subtitle="actividades y filas dentro del filtro" tone="cyan" icon={ClipboardList} />
          <DashboardKpiCard title="Cerrados" value={String(dashboardMetrics.completed)} subtitle="registros terminados" tone="green" icon={CircleCheckBig} />
          <DashboardKpiCard title="En curso" value={String(dashboardMetrics.running)} subtitle="operaciones activas" tone="amber" icon={Play} />
          <DashboardKpiCard title="Pausados" value={String(dashboardMetrics.paused)} subtitle="registros detenidos" tone="red" icon={PauseCircle} />
        </div>

        <div className="dashboard-kpi-grid dashboard-kpi-grid-secondary dashboard-kpi-grid-wide">
          <DashboardKpiCard title="Tiempo promedio" value={formatMetricNumber(dashboardMetrics.averageMinutes, 2)} subtitle="minutos promedio de cierre" tone="cyan" icon={Gauge} />
          <DashboardKpiCard title="Mediana" value={formatMetricNumber(dashboardMetrics.medianMinutes, 2)} subtitle="punto medio del tiempo de ciclo" tone="slate" icon={Clock3} />
          <DashboardKpiCard title="Horas efectivas" value={formatMetricNumber(dashboardMetrics.totalHours, 1)} subtitle="tiempo completado acumulado" tone="green" icon={CalendarDays} />
          <DashboardKpiCard title="Cumplimiento SLA" value={formatMetricNumber(dashboardMetrics.withinPercent, 1)} subtitle="porcentaje dentro del límite" tone="lime" icon={Zap} />
        </div>

        <div className="dashboard-kpi-grid dashboard-kpi-grid-secondary dashboard-kpi-grid-wide">
          <DashboardKpiCard title="Fuera de SLA" value={formatMetricNumber(dashboardMetrics.outsidePercent, 1)} subtitle="proporción fuera del objetivo" tone="amber" icon={AlertTriangle} />
          <DashboardKpiCard title="Pausas registradas" value={String(dashboardMetrics.pauseCount)} subtitle="interrupciones con log" tone="slate" icon={Pause} />
          <DashboardKpiCard title="Horas en pausa" value={formatMetricNumber(dashboardMetrics.pauseHours, 1)} subtitle="tiempo no productivo" tone="red" icon={OctagonAlert} />
          <DashboardKpiCard title="Áreas activas" value={String(dashboardMetrics.areaCount)} subtitle="áreas con movimiento operativo" tone="cyan" icon={Users} />
        </div>
      </DashboardSection>

      <DashboardSection title="Análisis por player" subtitle="Desempeño individual, carga y cumplimiento por persona." summary={`${dashboardResponsibleRows.length} players con métricas`} icon={Users} open={dashboardSectionsOpen.people} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, people: !current.people }))}>
        <div className="dashboard-main-grid">
          <article className="dashboard-panel dashboard-panel-wide">
            <div className="dashboard-panel-header">
              <h3>Tiempo Promedio por Player</h3>
              <BarChart3 size={18} />
            </div>
            <div className="dashboard-bars-list">
              {dashboardResponsibleRows.map((item) => (
                <DashboardBarRow key={item.responsibleId} label={item.label} value={item.averageMinutes} max={item.max} color={item.color} trailing={`${Math.round(item.averageMinutes)} min · ${item.totalRecords} cierres`} initial={item.initial} />
              ))}
            </div>
          </article>

          <aside className="dashboard-panel dashboard-panel-rank">
            <div className="dashboard-panel-header">
              <h3>Ranking de Desempeño</h3>
              <Clock3 size={18} />
            </div>
            <ol className="dashboard-rank-list">
              {dashboardResponsibleRows.map((item, index) => (
                <DashboardRankItem key={item.responsibleId} index={index + 1} label={item.label} value={`${Math.round(item.averageMinutes)} min prom. · ${item.totalRecords} cierres`} color={getResponsibleVisual(item.label).badge} highlighted={index === 0} />
              ))}
            </ol>
          </aside>
        </div>

        <div className="dashboard-main-grid dashboard-lower-middle-grid">
          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Actividad vs. Tiempo Objetivo</h3>
              <AlertTriangle size={18} />
            </div>
            <div className="dashboard-progress-list">
              {dashboardActivityRows.map((item) => (
                <DashboardProgressMetric key={item.label} label={item.label} valueText={`${Math.round(item.averageMinutes)} / ${item.limitMinutes} min`} percent={item.percent} color={item.color} />
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Distribución de Carga</h3>
              <PieChart size={18} />
            </div>
            <DashboardPieChart rows={dashboardDistributionRows} />
            <div className="dashboard-progress-list dashboard-distribution-list">
              {dashboardDistributionRows.map((item) => (
                <DashboardProgressMetric key={item.responsibleId} label={item.label} valueText={`${item.count} registros · ${Math.round(item.percent)}%`} percent={item.percent} color={item.color} />
              ))}
            </div>
          </article>
        </div>
      </DashboardSection>

      <DashboardSection title="Tendencias y áreas" subtitle="Evolución del flujo y consolidado por área para comparar capacidad y carga." summary={`${dashboardTrendRows.length} periodos · ${dashboardAreaRows.length} áreas`} icon={BarChart3} open={dashboardSectionsOpen.trends} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, trends: !current.trends }))}>
        <div className="dashboard-main-grid dashboard-lower-middle-grid">
          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Tendencia general</h3>
              <BarChart3 size={18} />
            </div>
            <DashboardColumnChart
              rows={dashboardTrendRows.map((item) => ({
                key: item.key,
                label: item.label,
                value: item.total,
                valueLabel: `${item.completed}/${item.total}`,
                tooltip: `${item.completed}/${item.total} cierres · ${formatMetricNumber(item.totalSeconds / 3600, 1)} h`,
                color: "linear-gradient(180deg, #0ea5e9 0%, #34d399 100%)",
              }))}
              emptyLabel="No hay tendencia disponible para el periodo seleccionado."
            />
            <div className="dashboard-progress-list">
              {dashboardTrendRows.map((item) => (
                <DashboardProgressMetric key={item.key} label={item.label} valueText={`${item.completed}/${item.total} cierres · ${formatMetricNumber(item.totalSeconds / 3600, 1)} h`} percent={item.total ? (item.completed / item.total) * 100 : 0} color="linear-gradient(90deg, #0ea5e9 0%, #34d399 100%)" />
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Resumen Consolidado por Área</h3>
              <Users size={18} />
            </div>
            <DashboardColumnChart
              rows={dashboardAreaRows.slice(0, 6).map((item) => ({
                key: item.area,
                label: item.area,
                value: item.total,
                valueLabel: `${item.total}`,
                tooltip: `${item.total} registros · ${item.boardCount} tableros`,
                color: "linear-gradient(180deg, #14b8a6 0%, #84cc16 100%)",
              }))}
              emptyLabel="No hay áreas con datos para mostrar."
            />
            <div className="dashboard-bars-list">
              {dashboardAreaRows.map((item) => (
                <DashboardBarRow key={item.area} label={item.area} value={item.total} max={Math.max(...dashboardAreaRows.map((row) => row.total), 1)} color="linear-gradient(90deg, #14b8a6 0%, #84cc16 100%)" trailing={`${item.total} reg · ${item.boardCount} tableros`} initial={item.area.charAt(0).toUpperCase()} />
              ))}
            </div>
          </article>
        </div>
      </DashboardSection>

      <DashboardSection title="Incidencias y causa raíz" subtitle="Pareto de impacto y análisis Ishikawa para aislar las causas más pesadas." summary={`${dashboardParetoRows.length} incidencias priorizadas · ${dashboardIshikawaRows.length} categorías`} icon={Search} open={dashboardSectionsOpen.causes} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, causes: !current.causes }))}>
        <div className="dashboard-main-grid dashboard-lower-middle-grid">
          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Pareto de Incidencias e Impacto</h3>
              <BarChart3 size={18} />
            </div>
            <DashboardParetoChart rows={dashboardParetoRows} />
            <div className="dashboard-pareto-list">
              {dashboardParetoRows.map((item, index) => (
                <DashboardParetoRow key={item.label} label={item.label} percent={item.percent} cumulativePercent={item.cumulativePercent} impactText={`${Math.round(item.impactSeconds / 60)} min · ${item.count} evento(s)`} highlight={index < 3 || item.cumulativePercent <= 80} />
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Ishikawa Operativo</h3>
              <Search size={18} />
            </div>
            <DashboardIshikawaDiagram rows={dashboardIshikawaRows} />
            <div className="dashboard-cause-grid">
              {dashboardIshikawaRows.map((item) => (
                <DashboardCauseCard key={item.category} title={item.category} share={item.impact} count={item.count} examples={item.examples} />
              ))}
            </div>
          </article>
        </div>
      </DashboardSection>

      <DashboardSection title="Alertas y tablas ejecutivas" subtitle="Excepciones, pausas críticas y consolidado por área para revisión puntual." summary={`${dashboardMetrics.exceeded.length} alertas · ${pauseAnalysis.length} causas de pausa`} icon={OctagonAlert} open={dashboardSectionsOpen.alerts} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, alerts: !current.alerts }))}>
        <div className="dashboard-main-grid dashboard-bottom-grid">
          <article className="dashboard-panel dashboard-panel-wide">
            <div className="dashboard-panel-header with-badge">
              <div>
                <h3>Registros que Excedieron el Límite</h3>
                <p>Tiempo real vs. límite objetivo en actividades semanales</p>
              </div>
              <span className="dashboard-alert-pill">{dashboardMetrics.exceeded.length} alertas</span>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table-clean">
                <thead>
                  <tr>
                    <th>Operación</th>
                    <th>Fuente</th>
                    <th>Asociado</th>
                    <th>Tiempo Real</th>
                    <th>Límite</th>
                    <th>Exceso</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardMetrics.exceeded.map((record) => {
                    const excess = record.durationSeconds / 60 - record.limitMinutes;
                    return (
                      <tr key={record.id}>
                        <td>{record.label.toUpperCase()}</td>
                        <td>{record.sourceLabel}</td>
                        <td>{record.responsibleName}</td>
                        <td className="dashboard-number-warning">{formatMinutes(record.durationSeconds / 60)}</td>
                        <td>{record.limitMinutes} min</td>
                        <td>{Math.max(0, Math.round(excess))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="dashboard-panel dashboard-panel-rank dashboard-pause-panel">
            <div className="dashboard-panel-header">
              <div>
                <h3>Top de Pausas</h3>
                <p>Causas más frecuentes de interrupción por impacto</p>
              </div>
              <PauseCircle size={18} />
            </div>
            <div className="dashboard-pause-list">
              {pauseAnalysis.map((item) => (
                <div key={item.reason} className="dashboard-pause-card">
                  <span className="dashboard-pause-icon" />
                  <div>
                    <strong>{item.reason}</strong>
                    <small>{item.count} pausas · {Math.round(item.totalSeconds / 60)} min</small>
                  </div>
                  <span className="dashboard-pause-dot">{Math.round(item.percent)}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <article className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header with-badge">
            <div>
              <h3>Tabla Ejecutiva por Área</h3>
              <p>Resumen general consolidado aunque existan múltiples tableros y fuentes operativas.</p>
            </div>
            <span className="dashboard-alert-pill">{dashboardAreaRows.length} áreas</span>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table-clean">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Registros</th>
                  <th>Cerrados</th>
                  <th>Promedio</th>
                  <th>SLA</th>
                  <th>Tableros / Fuentes</th>
                </tr>
              </thead>
              <tbody>
                {dashboardAreaRows.map((item) => (
                  <tr key={item.area}>
                    <td>{item.area}</td>
                    <td>{item.total}</td>
                    <td>{item.completed}</td>
                    <td>{formatMinutes(item.averageMinutes)}</td>
                    <td>{formatPercent(item.slaPercent)}</td>
                    <td>{item.boardCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </DashboardSection>
    </section>
  );
}
