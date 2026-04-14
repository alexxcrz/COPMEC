import { useEffect, useMemo, useRef, useState } from "react";

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
    dashboardCatalogFrequencyRows,
    dashboardCatalogTypeRows,
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
    getActivityFrequencyLabel,
    Download,
  } = contexto;

  const areAllSectionsOpen = Object.values(dashboardSectionsOpen).every(Boolean);
  const dashboardExportRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const dashboardAreaTabOptions = useMemo(() => {
    const uniqueAreas = Array.from(new Set(
      departmentOptions
        .concat(dashboardAreaRows.map((item) => item.area))
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ));

    return [{ value: "all", label: "General" }].concat(
      uniqueAreas.sort((left, right) => left.localeCompare(right, "es-MX")).map((area) => ({ value: area, label: area })),
    );
  }, [dashboardAreaRows, departmentOptions]);

  const activeAreaLabel = dashboardFilters.area === "all" ? "General" : dashboardFilters.area;

  async function exportDashboardToPdf() {
    if (isExportingPdf) return;

    try {
      setIsExportingPdf(true);
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const marginX = 28;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const printableWidth = pageWidth - marginX * 2;
      const filterSummaryRows = [
        ["Área", activeAreaLabel],
        ["Player", dashboardFilters.responsibleId === "all" ? "Todos los players" : visibleUsers.find((user) => user.id === dashboardFilters.responsibleId)?.name || "Player filtrado"],
        ["Fuente", dashboardFilters.source === "all" ? "Todo el flujo" : dashboardFilters.source === "activity" ? "Actividades semanales" : "Tableros operativos"],
        ["Periodo", dashboardFilters.periodKey === "all" ? "Todos los periodos" : dashboardFilters.periodKey],
        ["Rango", dashboardFilters.startDate || dashboardFilters.endDate ? `${dashboardFilters.startDate || "inicio"} a ${dashboardFilters.endDate || "fin"}` : "Sin filtro por fecha"],
      ];
      const executiveRows = [
        ["Registros analizados", String(dashboardMetrics.total), "actividades y filas dentro del filtro"],
        ["Cerrados", String(dashboardMetrics.completed), "registros terminados"],
        ["En curso", String(dashboardMetrics.running), "operaciones activas"],
        ["Pausados", String(dashboardMetrics.paused), "registros detenidos"],
        ["Tiempo promedio", formatMetricNumber(dashboardMetrics.averageMinutes, 2), "minutos promedio de cierre"],
        ["Mediana", formatMetricNumber(dashboardMetrics.medianMinutes, 2), "punto medio del tiempo de ciclo"],
        ["Horas efectivas", formatMetricNumber(dashboardMetrics.totalHours, 1), "tiempo completado acumulado"],
        ["Cumplimiento SLA", `${formatMetricNumber(dashboardMetrics.withinPercent, 1)}%`, "porcentaje dentro del límite"],
        ["Fuera de SLA", `${formatMetricNumber(dashboardMetrics.outsidePercent, 1)}%`, "proporción fuera del objetivo"],
        ["Pausas registradas", String(dashboardMetrics.pauseCount), "interrupciones con log"],
        ["Horas en pausa", formatMetricNumber(dashboardMetrics.pauseHours, 1), "tiempo no productivo"],
        ["Áreas activas", String(dashboardMetrics.areaCount), "áreas con movimiento operativo"],
        ["Catálogo activo", String(dashboardMetrics.catalogActiveCount), "actividades disponibles"],
        ["Obligatorias", String(dashboardMetrics.catalogMandatoryCount), "actividades base"],
        ["Ocasionales", String(dashboardMetrics.catalogOptionalCount), "actividades complementarias"],
        ["Frecuencias activas", String(dashboardMetrics.catalogFrequencyTypes), "tipos de periodicidad en uso"],
      ];

      const drawSectionTable = (title, head, body, options = {}) => {
        const startY = (pdf.lastAutoTable?.finalY || 92) + 18;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(24, 54, 47);
        pdf.text(title, marginX, startY);
        autoTable(pdf, {
          startY: startY + 8,
          head: [head],
          body,
          margin: { left: marginX, right: marginX },
          tableWidth: printableWidth,
          styles: { fontSize: 8, cellPadding: 5, lineColor: [220, 228, 224], lineWidth: 0.4, textColor: [38, 48, 58] },
          headStyles: { fillColor: [22, 107, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          alternateRowStyles: { fillColor: [247, 250, 248] },
          ...options,
        });
      };

      pdf.setFillColor(17, 75, 62);
      pdf.rect(0, 0, pageWidth, 62, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(`Dashboard COPMEC · ${activeAreaLabel}`, marginX, 28);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("Reporte exportado con datos estructurados del dashboard filtrado.", marginX, 46);

      drawSectionTable("Filtros aplicados", ["Filtro", "Valor"], filterSummaryRows, { columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: printableWidth - 120 } } });
      drawSectionTable("Resumen ejecutivo", ["Indicador", "Valor", "Detalle"], executiveRows);
      drawSectionTable("Desempeño por player", ["Player", "Promedio (min)", "Cierres"], dashboardResponsibleRows.map((item) => [item.label, formatMetricNumber(item.averageMinutes, 2), String(item.totalRecords)]));
      drawSectionTable("Actividad vs tiempo objetivo", ["Actividad", "Promedio", "Límite", "Cumplimiento"], dashboardActivityRows.map((item) => [item.label, `${formatMetricNumber(item.averageMinutes, 1)} min`, `${item.limitMinutes} min`, item.exceeded ? "Excedido" : "Dentro de límite"]));
      drawSectionTable("Distribución de carga", ["Player", "Registros", "Participación"], dashboardDistributionRows.map((item) => [item.label, String(item.count), `${formatMetricNumber(item.percent, 1)}%`]));
      drawSectionTable("Catálogo por tipo", ["Tipo", "Actividades"], dashboardCatalogTypeRows.map((item) => [item.label, String(item.value)]));
      drawSectionTable("Catálogo por frecuencia", ["Frecuencia", "Actividades"], dashboardCatalogFrequencyRows.map((item) => [item.label, String(item.value)]));
      drawSectionTable("Tendencia", ["Periodo", "Registros", "Cerrados", "Horas"], dashboardTrendRows.map((item) => [item.label, String(item.total), String(item.completed), formatMetricNumber(item.totalSeconds / 3600, 1)]));
      drawSectionTable("Resumen por área", ["Área", "Registros", "Cerrados", "Promedio", "SLA", "Tableros"], dashboardAreaRows.map((item) => [item.area, String(item.total), String(item.completed), `${formatMetricNumber(item.averageMinutes, 1)} min`, `${formatMetricNumber(item.slaPercent, 1)}%`, String(item.boardCount)]));
      drawSectionTable("Pareto de incidencias", ["Incidencia", "Impacto", "Eventos", "%", "% acumulado"], dashboardParetoRows.map((item) => [item.label, `${Math.round(item.impactSeconds / 60)} min`, String(item.count), `${formatMetricNumber(item.percent, 1)}%`, `${formatMetricNumber(item.cumulativePercent, 1)}%`]));
      drawSectionTable("Ishikawa operativo", ["Categoría", "Impacto", "Eventos", "Ejemplos"], dashboardIshikawaRows.map((item) => [item.category, `${formatMetricNumber(item.impact, 1)}%`, String(item.count), (item.examples || []).join(" · ")]));
      drawSectionTable("Registros fuera de SLA", ["Operación", "Fuente", "Player", "Tiempo real", "Límite", "Exceso"], dashboardMetrics.exceeded.map((record) => [record.label, record.sourceLabel, record.responsibleName, formatMinutes(record.durationSeconds / 60), `${record.limitMinutes} min`, `${Math.max(0, Math.round(record.durationSeconds / 60 - record.limitMinutes))} min`]));
      drawSectionTable("Top de pausas", ["Motivo", "Pausas", "Minutos", "Impacto"], pauseAnalysis.map((item) => [item.reason || "Sin motivo", String(item.count), String(Math.round(item.totalSeconds / 60)), `${formatMetricNumber(item.percent, 1)}%`]));

      const totalPages = pdf.getNumberOfPages();
      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        pdf.setPage(pageIndex);
        pdf.setFontSize(8);
        pdf.setTextColor(116, 128, 143);
        pdf.text(`Página ${pageIndex} de ${totalPages}`, pageWidth - marginX - 58, pdf.internal.pageSize.getHeight() - 16);
      }

      const hasDateRange = dashboardFilters.startDate || dashboardFilters.endDate;
      const fileSuffix = hasDateRange ? `${dashboardFilters.startDate || "inicio"}-${dashboardFilters.endDate || "fin"}` : activeAreaLabel.toLowerCase().replaceAll(/\s+/g, "-");
      pdf.save(`dashboard-copmec-${fileSuffix}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  const executiveKpiCards = [
    { title: "Registros analizados", value: String(dashboardMetrics.total), subtitle: "actividades y filas dentro del filtro", tone: "cyan", icon: ClipboardList },
    { title: "Cerrados", value: String(dashboardMetrics.completed), subtitle: "registros terminados", tone: "green", icon: CircleCheckBig },
    { title: "En curso", value: String(dashboardMetrics.running), subtitle: "operaciones activas", tone: "amber", icon: Play },
    { title: "Pausados", value: String(dashboardMetrics.paused), subtitle: "registros detenidos", tone: "red", icon: PauseCircle },
    { title: "Tiempo promedio", value: formatMetricNumber(dashboardMetrics.averageMinutes, 2), subtitle: "minutos promedio de cierre", tone: "cyan", icon: Gauge },
    { title: "Mediana", value: formatMetricNumber(dashboardMetrics.medianMinutes, 2), subtitle: "punto medio del tiempo de ciclo", tone: "slate", icon: Clock3 },
    { title: "Horas efectivas", value: formatMetricNumber(dashboardMetrics.totalHours, 1), subtitle: "tiempo completado acumulado", tone: "green", icon: CalendarDays },
    { title: "Cumplimiento SLA", value: formatMetricNumber(dashboardMetrics.withinPercent, 1), subtitle: "porcentaje dentro del límite", tone: "lime", icon: Zap },
    { title: "Fuera de SLA", value: formatMetricNumber(dashboardMetrics.outsidePercent, 1), subtitle: "proporción fuera del objetivo", tone: "amber", icon: AlertTriangle },
    { title: "Pausas registradas", value: String(dashboardMetrics.pauseCount), subtitle: "interrupciones con log", tone: "slate", icon: Pause },
    { title: "Horas en pausa", value: formatMetricNumber(dashboardMetrics.pauseHours, 1), subtitle: "tiempo no productivo", tone: "red", icon: OctagonAlert },
    { title: "Áreas activas", value: String(dashboardMetrics.areaCount), subtitle: "áreas con movimiento operativo", tone: "cyan", icon: Users },
    { title: "Catálogo activo", value: String(dashboardMetrics.catalogActiveCount), subtitle: "actividades disponibles", tone: "slate", icon: ClipboardList },
    { title: "Obligatorias", value: String(dashboardMetrics.catalogMandatoryCount), subtitle: "actividades base", tone: "green", icon: CircleCheckBig },
    { title: "Ocasionales", value: String(dashboardMetrics.catalogOptionalCount), subtitle: "actividades complementarias", tone: "amber", icon: PauseCircle },
    { title: "Frecuencias activas", value: String(dashboardMetrics.catalogFrequencyTypes), subtitle: "tipos de periodicidad en uso", tone: "cyan", icon: CalendarDays },
  ];

  return (
    <section ref={dashboardExportRef} className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <h3>Dashboard COPMEC</h3>
          <p>Vista ejecutiva consolidada por semana, quincena o mes, con lectura por player y por área.</p>
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
              <select value={dashboardFilters.area} onChange={(event) => setDashboardFilters((current) => ({ ...current, area: event.target.value, responsibleId: "all" }))}>
                <option value="all">Todas las áreas</option>
                {dashboardAreaTabOptions.filter((item) => item.value !== "all").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
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
            <div className="dashboard-filter-actions" role="group" aria-label="Acciones del dashboard">
              <button
                type="button"
                className="icon-button dashboard-filter-icon-button"
                onClick={exportDashboardToPdf}
                disabled={isExportingPdf}
                title={isExportingPdf ? "Exportando PDF de datos" : "Exportar PDF"}
                aria-label={isExportingPdf ? "Exportando PDF de datos" : "Exportar PDF"}
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                className="icon-button dashboard-filter-icon-button"
                onClick={() => setDashboardSectionsOpen({
                  executive: !areAllSectionsOpen,
                  people: !areAllSectionsOpen,
                  trends: !areAllSectionsOpen,
                  causes: !areAllSectionsOpen,
                  alerts: !areAllSectionsOpen,
                })}
                title={areAllSectionsOpen ? "Contraer todo" : "Expandir todo"}
                aria-label={areAllSectionsOpen ? "Contraer todo" : "Expandir todo"}
                aria-pressed={areAllSectionsOpen}
              >
                {areAllSectionsOpen ? <PauseCircle size={16} /> : <Play size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DashboardSection title="Resumen ejecutivo" subtitle="KPIs principales para una lectura rápida del periodo filtrado." summary={`${dashboardMetrics.total} registros · ${dashboardMetrics.completed} cerrados · ${dashboardMetrics.areaCount} áreas`} icon={Gauge} open={dashboardSectionsOpen.executive} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, executive: !current.executive }))}>
        <div className="dashboard-kpi-grid dashboard-kpi-grid-executive">
          {executiveKpiCards.map((item) => (
            <DashboardKpiCard
              key={item.title}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              tone={item.tone}
              icon={item.icon}
            />
          ))}
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

        <div className="dashboard-main-grid dashboard-lower-middle-grid">
          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Tipo de Actividades (Catálogo)</h3>
              <PieChart size={18} />
            </div>
            <DashboardColumnChart
              rows={dashboardCatalogTypeRows.map((item) => ({
                key: item.id,
                label: item.label,
                value: item.value,
                valueLabel: `${item.value}`,
                tooltip: `${item.value} actividades ${item.label.toLowerCase()}`,
                color: item.id === "mandatory"
                  ? "linear-gradient(180deg, #16a34a 0%, #86efac 100%)"
                  : "linear-gradient(180deg, #f59e0b 0%, #fde68a 100%)",
              }))}
              emptyLabel="No hay actividades en catálogo para este análisis."
            />
            <div className="dashboard-progress-list">
              {dashboardCatalogTypeRows.map((item) => (
                <DashboardProgressMetric
                  key={item.id}
                  label={item.label}
                  valueText={`${item.value} actividades`}
                  percent={dashboardMetrics.catalogActiveCount ? (item.value / dashboardMetrics.catalogActiveCount) * 100 : 0}
                  color={item.id === "mandatory" ? "linear-gradient(90deg, #16a34a 0%, #86efac 100%)" : "linear-gradient(90deg, #f59e0b 0%, #fde68a 100%)"}
                />
              ))}
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel-half">
            <div className="dashboard-panel-header">
              <h3>Frecuencia de Actividades (Catálogo)</h3>
              <Clock3 size={18} />
            </div>
            <DashboardColumnChart
              rows={dashboardCatalogFrequencyRows.map((item) => ({
                key: item.id,
                label: item.label,
                value: item.value,
                valueLabel: `${item.value}`,
                tooltip: `${item.value} actividades con frecuencia ${item.label.toLowerCase()}`,
                color: "linear-gradient(180deg, #0ea5e9 0%, #22d3ee 100%)",
              }))}
              emptyLabel="No hay frecuencias registradas en el catálogo."
            />
            <div className="dashboard-bars-list">
              {dashboardCatalogFrequencyRows.map((item) => (
                <DashboardBarRow
                  key={item.id}
                  label={getActivityFrequencyLabel(item.id)}
                  value={item.value}
                  max={Math.max(...dashboardCatalogFrequencyRows.map((row) => row.value), 1)}
                  color="linear-gradient(90deg, #0ea5e9 0%, #22d3ee 100%)"
                  trailing={`${item.value} actividades`}
                  initial={item.label.charAt(0).toUpperCase()}
                />
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
                    <th>Player</th>
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
