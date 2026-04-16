import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

function getDashboardDatePopoverStyle(triggerElement) {
  if (!triggerElement) return null;

  const rect = triggerElement.getBoundingClientRect();
  const viewportWidth = globalThis.innerWidth;
  const viewportHeight = globalThis.innerHeight;
  const gap = 8;
  const minWidth = 332;
  const maxWidth = viewportWidth - 16;
  const width = Math.min(Math.max(rect.width, minWidth), maxWidth);
  const left = Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - width - 8));
  const estimatedHeight = 360;
  const openUpwards = rect.bottom + gap + estimatedHeight > viewportHeight && rect.top > estimatedHeight;
  const top = openUpwards ? Math.max(8, rect.top - gap - estimatedHeight) : rect.bottom + gap;

  return {
    position: "fixed",
    top,
    left,
    width,
    zIndex: 80,
  };
}

function DashboardDateRangePicker({ startDate, endDate, onChange }) {
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDashboardDate(startDate) || parseDashboardDate(endDate) || new Date());
  const [draftStartDate, setDraftStartDate] = useState(startDate || "");
  const [draftEndDate, setDraftEndDate] = useState(endDate || "");
  const [popoverStyle, setPopoverStyle] = useState(null);

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
      const clickedTrigger = pickerRef.current?.contains(event.target);
      const clickedPopover = popoverRef.current?.contains(event.target);
      if (!clickedTrigger && !clickedPopover) {
        applyDraftAndClose();
      }
    }

    globalThis.addEventListener("pointerdown", handlePointerDown);
    return () => globalThis.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function updatePopoverPosition() {
      setPopoverStyle(getDashboardDatePopoverStyle(triggerRef.current));
    }

    updatePopoverPosition();
    globalThis.addEventListener("resize", updatePopoverPosition);
    globalThis.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      globalThis.removeEventListener("resize", updatePopoverPosition);
      globalThis.removeEventListener("scroll", updatePopoverPosition, true);
    };
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
      <button ref={triggerRef} type="button" className={`dashboard-date-range-trigger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen((current) => !current)}>
        <span>{buttonLabel}</span>
        <small>{startDate || endDate ? "Rango activo" : "Sin filtro por fecha"}</small>
      </button>
      {isOpen && popoverStyle ? createPortal(
        <div ref={popoverRef} className="dashboard-date-range-popover" style={popoverStyle}>
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
        </div>,
        globalThis.document.body,
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
    DashboardLineChart,
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
  const [trendChartType, setTrendChartType] = useState("bar");

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
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - marginX * 2;
      const BRAND_GREEN = [17, 75, 62];
      const BRAND_LIGHT = [22, 107, 87];
      const TEXT_DARK = [24, 54, 47];
      const TEXT_MID = [60, 80, 74];
      const TEXT_MUTED = [116, 128, 143];
      const COLOR_GREEN = [22, 163, 74];
      const COLOR_AMBER = [217, 119, 6];
      const COLOR_RED = [220, 38, 38];
      const COLOR_BLUE = [14, 165, 233];

      const exportDate = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());

      function addPageHeader(title, subtitle) {
        pdf.setFillColor(...BRAND_GREEN);
        pdf.rect(0, 0, pageWidth, 54, "F");
        pdf.setFillColor(...BRAND_LIGHT);
        pdf.rect(0, 48, pageWidth, 4, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(title, marginX, 24);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.text(subtitle || `Exportado: ${exportDate}`, marginX, 40);
        pdf.setFontSize(8.5);
        pdf.text(`COPMEC · ${activeAreaLabel}`, pageWidth - marginX, 40, { align: "right" });
      }

      function addPageFooter() {
        const totalPages = pdf.getNumberOfPages();
        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
          pdf.setPage(pageIndex);
          pdf.setFillColor(245, 248, 246);
          pdf.rect(0, pageHeight - 22, pageWidth, 22, "F");
          pdf.setFontSize(7.5);
          pdf.setTextColor(...TEXT_MUTED);
          pdf.text(`Dashboard COPMEC · Reporte operativo · ${exportDate}`, marginX, pageHeight - 8);
          pdf.text(`Página ${pageIndex} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
        }
      }

      function drawSectionTable(title, head, body, options = {}) {
        const startY = (pdf.lastAutoTable?.finalY || 70) + 16;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(title, marginX, startY);
        pdf.setDrawColor(...BRAND_LIGHT);
        pdf.setLineWidth(1.5);
        pdf.line(marginX, startY + 3, marginX + pdf.getTextWidth(title) + 8, startY + 3);
        autoTable(pdf, {
          startY: startY + 10,
          head: [head],
          body,
          margin: { left: marginX, right: marginX },
          tableWidth: printableWidth,
          styles: { fontSize: 7.5, cellPadding: 4.5, lineColor: [220, 228, 224], lineWidth: 0.3, textColor: [38, 48, 58] },
          headStyles: { fillColor: BRAND_LIGHT, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [247, 250, 248] },
          ...options,
        });
      }

      function drawMiniBarChart(startX, startY, chartWidth, chartHeight, rows, titleText, unit = "") {
        if (!rows.length) return;
        const max = Math.max(...rows.map((r) => r.value), 1);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(titleText, startX, startY);
        const chartTop = startY + 8;
        const barAreaHeight = chartHeight - 28;
        const barWidth = Math.min((chartWidth - 20) / rows.length, 50);
        rows.forEach((row, i) => {
          const bh = Math.max(2, (row.value / max) * barAreaHeight);
          const bx = startX + 10 + i * barWidth;
          const by = chartTop + barAreaHeight - bh;
          const color = row.color || BRAND_LIGHT;
          pdf.setFillColor(...color);
          pdf.roundedRect(bx + 1, by, barWidth - 4, bh, 1, 1, "F");
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...TEXT_MUTED);
          const labelText = String(row.label || "").substring(0, 7);
          pdf.text(labelText, bx + 1, chartTop + barAreaHeight + 10);
          pdf.setFontSize(6.5);
          pdf.setTextColor(...TEXT_DARK);
          pdf.text(`${Math.round(row.value)}${unit}`, bx + 1, by - 2);
        });
      }

      function drawKpiGrid(startY, items) {
        const cols = 4;
        const cellW = printableWidth / cols;
        const cellH = 44;
        items.forEach((item, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = marginX + col * cellW;
          const cy = startY + row * (cellH + 6);
          pdf.setFillColor(247, 250, 248);
          pdf.setDrawColor(210, 225, 218);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(cx, cy, cellW - 6, cellH, 4, 4, "FD");
          pdf.setFillColor(...(item.alert ? COLOR_RED : item.warn ? COLOR_AMBER : BRAND_LIGHT));
          pdf.roundedRect(cx, cy, 4, cellH, 2, 2, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(13);
          pdf.setTextColor(...TEXT_DARK);
          pdf.text(String(item.value), cx + 12, cy + 18);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(...TEXT_MID);
          pdf.text(item.label, cx + 12, cy + 30);
          pdf.setFontSize(6);
          pdf.setTextColor(...TEXT_MUTED);
          pdf.text(item.sub || "", cx + 12, cy + 40);
        });
        const rows = Math.ceil(items.length / cols);
        return startY + rows * (cellH + 6) + 10;
      }

      // ─── PORTADA ─────────────────────────────────────────────────────────────────
      pdf.setFillColor(...BRAND_GREEN);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setFillColor(...BRAND_LIGHT);
      pdf.rect(0, pageHeight * 0.55, pageWidth, pageHeight * 0.45, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      pdf.text("Reporte Operativo", marginX, 120);
      pdf.setFontSize(22);
      pdf.text("Dashboard COPMEC", marginX, 150);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.setTextColor(180, 230, 210);
      pdf.text(`Área: ${activeAreaLabel}`, marginX, 185);
      pdf.text(`Exportado: ${exportDate}`, marginX, 205);
      pdf.setFontSize(10);
      pdf.setTextColor(140, 200, 180);
      pdf.text("Análisis integral · Producción · Pausas · SLA · Pareto · Ishikawa", marginX, 240);
      // KPIs resumen en portada
      const coverKpis = [
        { label: "Registros", value: dashboardMetrics.total },
        { label: "Cerrados", value: dashboardMetrics.completed },
        { label: "En pausa", value: dashboardMetrics.paused },
        { label: `Eficiencia ${formatMetricNumber(dashboardMetrics.efficiency ?? 100, 0)}%`, value: null },
      ];
      coverKpis.forEach((kpi, i) => {
        const bx = marginX + i * (printableWidth / 4 + 6);
        const by = pageHeight * 0.62;
        pdf.setFillColor(255, 255, 255, 0.12);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(kpi.value !== null ? 28 : 16);
        pdf.text(kpi.value !== null ? String(kpi.value) : kpi.label, bx, by + 32);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(180, 230, 210);
        if (kpi.value !== null) pdf.text(kpi.label, bx, by + 48);
      });

      // ─── PÁGINA 2: FILTROS + RESUMEN EJECUTIVO ────────────────────────────────
      pdf.addPage();
      addPageHeader("Resumen Ejecutivo", `Análisis de ${dashboardMetrics.total} registros · ${activeAreaLabel}`);
      const filterSummaryRows = [
        ["Área", activeAreaLabel],
        ["Player", dashboardFilters.responsibleId === "all" ? "Todos los players" : visibleUsers.find((u) => u.id === dashboardFilters.responsibleId)?.name || "Player filtrado"],
        ["Fuente", dashboardFilters.source === "all" ? "Todo el flujo" : dashboardFilters.source === "activity" ? "Actividades semanales" : "Tableros operativos"],
        ["Rango", dashboardFilters.startDate || dashboardFilters.endDate ? `${dashboardFilters.startDate || "inicio"} → ${dashboardFilters.endDate || "fin"}` : "Sin filtro por fecha"],
      ];
      autoTable(pdf, {
        startY: 66,
        head: [["Filtro", "Valor"]],
        body: filterSummaryRows,
        margin: { left: marginX, right: marginX },
        tableWidth: printableWidth * 0.45,
        styles: { fontSize: 7.5, cellPadding: 4 },
        headStyles: { fillColor: BRAND_LIGHT, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [247, 250, 248] },
      });
      // KPI grid
      let currentY = (pdf.lastAutoTable?.finalY || 66) + 18;
      const kpiItems = [
        { value: dashboardMetrics.total, label: "Registros analizados", sub: "actividades y tableros" },
        { value: dashboardMetrics.completed, label: "Cerrados", sub: "terminados" },
        { value: dashboardMetrics.running, label: "En curso", sub: "operaciones activas", warn: dashboardMetrics.running > 0 },
        { value: dashboardMetrics.paused, label: "Pausados", sub: "detenidos", alert: dashboardMetrics.paused > 0 },
        { value: `${formatMetricNumber(dashboardMetrics.averageMinutes, 1)} min`, label: "Tiempo promedio", sub: "de cierre" },
        { value: `${formatMetricNumber(dashboardMetrics.medianMinutes, 1)} min`, label: "Mediana", sub: "punto medio ciclo" },
        { value: `${formatMetricNumber(dashboardMetrics.productionHours ?? dashboardMetrics.totalHours, 1)} h`, label: "Horas productivas", sub: "tiempo real de producción" },
        { value: `${formatMetricNumber(dashboardMetrics.pauseHours, 1)} h`, label: "Horas en pausa", sub: "tiempo no productivo", alert: dashboardMetrics.pauseHours > 1 },
        { value: `${formatMetricNumber(dashboardMetrics.efficiency ?? 100, 1)}%`, label: "Eficiencia operativa", sub: "producción / total", alert: (dashboardMetrics.efficiency ?? 100) < 60, warn: (dashboardMetrics.efficiency ?? 100) < 80 },
        { value: `${formatMetricNumber(dashboardMetrics.withinPercent, 1)}%`, label: "Cumplimiento SLA", sub: "dentro del límite", warn: dashboardMetrics.withinPercent < 80 },
        { value: dashboardMetrics.pauseCount, label: "Pausas registradas", sub: "con log", warn: dashboardMetrics.pauseCount > 5 },
        { value: dashboardMetrics.areaCount, label: "Áreas activas", sub: "con movimiento" },
      ];
      currentY = drawKpiGrid(currentY, kpiItems);

      // ─── PÁGINA 3: GRÁFICA PLAYER + DISTRIBUCIÓN ─────────────────────────────
      pdf.addPage();
      addPageHeader("Análisis por Player", "Tiempo promedio, carga y distribución operativa");
      const halfW = (printableWidth - 20) / 2;
      drawMiniBarChart(marginX, 76, halfW, 140, dashboardResponsibleRows.slice(0, 10).map((r) => ({ label: r.label.split(" ")[0], value: r.averageMinutes, color: BRAND_LIGHT })), "Tiempo Promedio por Player (min)", " min");
      drawMiniBarChart(marginX + halfW + 20, 76, halfW, 140, dashboardDistributionRows.slice(0, 10).map((r) => ({ label: r.label.split(" ")[0], value: r.count, color: COLOR_BLUE })), "Distribución de Carga (registros)");
      drawSectionTable("Desempeño detallado por player", ["Player", "Área", "Prom. (min)", "Cierres", "% Carga"], dashboardResponsibleRows.map((item) => [item.label, item.area || "—", formatMetricNumber(item.averageMinutes, 1), String(item.totalRecords), `${formatMetricNumber((item.totalRecords / Math.max(dashboardMetrics.completed, 1)) * 100, 1)}%`]));

      // ─── PÁGINA 4: ANÁLISIS DE TIEMPO PRODUCTIVO VS PAUSA ───────────────────
      pdf.addPage();
      addPageHeader("Tiempo Productivo vs Pausa", "Diagnóstico de eficiencia y tiempo perdido por interrupciones");
      const timeY = 76;
      const timeData = [
        { label: "Producción", value: dashboardMetrics.productionHours ?? dashboardMetrics.totalHours, color: COLOR_GREEN },
        { label: "Pausa", value: dashboardMetrics.pauseHours, color: COLOR_RED },
      ];
      drawMiniBarChart(marginX, timeY, halfW, 110, timeData, "Distribución de Tiempo Total (horas)", " h");
      // Efficiency gauge text
      const effVal = dashboardMetrics.efficiency ?? 100;
      const effColor = effVal >= 80 ? COLOR_GREEN : effVal >= 60 ? COLOR_AMBER : COLOR_RED;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT_DARK);
      pdf.text("Eficiencia operativa global", marginX + halfW + 20, timeY);
      pdf.setFontSize(36);
      pdf.setTextColor(...effColor);
      pdf.text(`${Math.round(effVal)}%`, marginX + halfW + 20, timeY + 48);
      pdf.setFontSize(8);
      pdf.setTextColor(...TEXT_MID);
      pdf.text(effVal >= 80 ? "✓ Rendimiento óptimo" : effVal >= 60 ? "⚠ Rendimiento moderado" : "✗ Atención requerida", marginX + halfW + 20, timeY + 64);
      pdf.text(`Producción: ${formatMetricNumber(dashboardMetrics.productionHours ?? dashboardMetrics.totalHours, 2)} h`, marginX + halfW + 20, timeY + 80);
      pdf.text(`Pausa: ${formatMetricNumber(dashboardMetrics.pauseHours, 2)} h · ${dashboardMetrics.pauseCount} interrupciones`, marginX + halfW + 20, timeY + 92);

      drawSectionTable("Top de pausas — Causas de tiempo perdido", ["Motivo de pausa", "Eventos", "Minutos perdidos", "% del tiempo en pausa", "Clasificación"], pauseAnalysis.map((item) => [
        item.reason || "Sin motivo registrado",
        String(item.count),
        String(Math.round(item.totalSeconds / 60)),
        `${formatMetricNumber(item.percent, 1)}%`,
        item.cumulativePercent <= 80 ? "⚠ Crítica (80%)" : "Secundaria",
      ]));

      // ─── PÁGINA 5: SLA Y ALERTAS ─────────────────────────────────────────────
      pdf.addPage();
      addPageHeader("Registro de Alertas y Cumplimiento SLA", "Detección de retrasos y operaciones fuera del objetivo");
      const slaKpis = [
        { value: `${formatMetricNumber(dashboardMetrics.withinPercent, 1)}%`, label: "Dentro de SLA", sub: "operaciones en tiempo" },
        { value: `${formatMetricNumber(dashboardMetrics.outsidePercent, 1)}%`, label: "Fuera de SLA", sub: "requieren atención", alert: dashboardMetrics.outsidePercent > 20 },
        { value: dashboardMetrics.exceeded?.length || 0, label: "Alertas activas", sub: "excedieron límite", alert: (dashboardMetrics.exceeded?.length || 0) > 0 },
        { value: `${formatMetricNumber(dashboardMetrics.averageMinutes, 1)} min`, label: "Promedio real", sub: "vs objetivo establecido" },
      ];
      let slaY = drawKpiGrid(76, slaKpis);
      drawSectionTable("Registros que excedieron el límite de tiempo", ["Operación", "Fuente", "Player", "Área", "Tiempo real", "Límite objetivo", "Exceso", "Severidad"], dashboardMetrics.exceeded.map((record) => {
        const excess = Math.max(0, Math.round(record.durationSeconds / 60 - record.limitMinutes));
        return [
          record.label,
          record.sourceLabel,
          record.responsibleName,
          record.area || "—",
          formatMinutes(record.durationSeconds / 60),
          `${record.limitMinutes} min`,
          `+${excess} min`,
          excess > record.limitMinutes ? "Crítico" : "Moderado",
        ];
      }), { columnStyles: { 6: { textColor: [220, 38, 38], fontStyle: "bold" } } });

      drawSectionTable("Actividad vs Tiempo Objetivo", ["Actividad", "Prom. real (min)", "Límite (min)", "Diferencia", "Estado"], dashboardActivityRows.map((item) => {
        const diff = item.averageMinutes - item.limitMinutes;
        return [item.label, formatMetricNumber(item.averageMinutes, 1), String(item.limitMinutes), diff >= 0 ? `+${Math.round(diff)} min` : `${Math.round(diff)} min`, item.limitMinutes > 0 && item.averageMinutes > item.limitMinutes ? "⚠ Excedido" : "✓ OK"];
      }), { columnStyles: { 4: { fontStyle: "bold" } } });

      // ─── PÁGINA 6: PARETO E ISHIKAWA ─────────────────────────────────────────
      pdf.addPage();
      addPageHeader("Análisis de Causa Raíz — Pareto + Ishikawa", "Priorización de incidencias y categorización de causas operativas");
      drawMiniBarChart(marginX, 76, printableWidth * 0.6, 130, dashboardParetoRows.slice(0, 10).map((item) => ({ label: item.label.substring(0, 10), value: item.impactSeconds / 60, color: item.cumulativePercent <= 80 ? COLOR_RED : COLOR_AMBER })), "Pareto de Incidencias — Impacto en minutos", " min");
      drawSectionTable("Pareto detallado", ["Prioridad", "Incidencia", "Eventos", "Impacto (min)", "% Individual", "% Acumulado", "Acción"], dashboardParetoRows.map((item, i) => [
        String(i + 1),
        item.label,
        String(item.count),
        String(Math.round(item.impactSeconds / 60)),
        `${formatMetricNumber(item.percent, 1)}%`,
        `${formatMetricNumber(item.cumulativePercent, 1)}%`,
        item.cumulativePercent <= 80 ? "Intervención inmediata" : "Monitoreo",
      ]), { columnStyles: { 6: { fontStyle: "bold" } } });
      drawSectionTable("Ishikawa operativo — Categorías de causa raíz", ["Categoría", "Impacto %", "Eventos", "Causa principal", "Ejemplos"], dashboardIshikawaRows.map((item) => [item.category, `${formatMetricNumber(item.impact, 1)}%`, String(item.count), item.examples?.[0] || "—", (item.examples || []).join(" · ")]));

      // ─── PÁGINA 7: TENDENCIAS Y ÁREAS ────────────────────────────────────────
      pdf.addPage();
      addPageHeader("Tendencias y Áreas Operativas", "Evolución temporal y consolidado por área");
      drawMiniBarChart(marginX, 76, halfW, 130, dashboardTrendRows.slice(0, 12).map((item) => ({ label: item.label.substring(0, 8), value: item.total, color: COLOR_BLUE })), "Tendencia de registros por periodo");
      drawMiniBarChart(marginX + halfW + 20, 76, halfW, 130, dashboardAreaRows.slice(0, 8).map((item) => ({ label: item.area.substring(0, 8), value: item.total, color: [20, 184, 166] })), "Registros por área");
      drawSectionTable("Tendencia general", ["Periodo", "Registros", "Cerrados", "En curso", "Pausados", "Horas prod."], dashboardTrendRows.map((item) => [item.label, String(item.total), String(item.completed), String(item.running || 0), String(item.paused || 0), formatMetricNumber(item.totalSeconds / 3600, 1)]));
      drawSectionTable("Consolidado por área", ["Área", "Registros", "Cerrados", "Promedio (min)", "SLA %", "Tableros / Fuentes"], dashboardAreaRows.map((item) => [item.area, String(item.total), String(item.completed), formatMetricNumber(item.averageMinutes, 1), `${formatMetricNumber(item.slaPercent, 1)}%`, String(item.boardCount)]));

      // ─── PÁGINA 8: CATÁLOGO ───────────────────────────────────────────────────
      pdf.addPage();
      addPageHeader("Catálogo de Actividades", "Tipo, frecuencia y distribución del catálogo operativo");
      drawSectionTable("Catálogo por tipo", ["Tipo", "Cantidad", "% del catálogo"], dashboardCatalogTypeRows.map((item) => [item.label, String(item.value), `${dashboardMetrics.catalogActiveCount ? formatMetricNumber((item.value / dashboardMetrics.catalogActiveCount) * 100, 1) : 0}%`]));
      drawSectionTable("Catálogo por frecuencia", ["Frecuencia", "Actividades", "% del catálogo"], dashboardCatalogFrequencyRows.map((item) => [item.label, String(item.value), `${dashboardMetrics.catalogActiveCount ? formatMetricNumber((item.value / dashboardMetrics.catalogActiveCount) * 100, 1) : 0}%`]));

      // ─── PÁGINA 9: DIAGNÓSTICO E INFORME EJECUTIVO ───────────────────────────
      pdf.addPage();
      addPageHeader("Informe de Diagnóstico Operativo", "Identificación de problemas, cuellos de botella y recomendaciones");
      let diagY = 76;
      const diagSections = [];

      if (dashboardMetrics.paused > 0) {
        diagSections.push({ title: "⚠ Operaciones pausadas activamente", detail: `Hay ${dashboardMetrics.paused} operación(es) detenida(s). Pausa acumulada: ${formatMetricNumber(dashboardMetrics.pauseHours, 1)} h.`, level: "Crítico" });
      }
      if ((dashboardMetrics.efficiency ?? 100) < 80) {
        diagSections.push({ title: "⚠ Eficiencia operativa por debajo del 80%", detail: `Eficiencia actual: ${formatMetricNumber(dashboardMetrics.efficiency ?? 100, 1)}%. El tiempo de producción real es inferior al tiempo total transcurrido.`, level: "Importante" });
      }
      if (dashboardMetrics.outsidePercent > 20) {
        diagSections.push({ title: "⚠ Alto porcentaje fuera de SLA", detail: `${formatMetricNumber(dashboardMetrics.outsidePercent, 1)}% de operaciones superaron el tiempo objetivo. Revisar capacidad y distribución.`, level: "Crítico" });
      }
      if (pauseAnalysis.length > 0) {
        const topPause = pauseAnalysis[0];
        diagSections.push({ title: `⚠ Principal causa de pausa: "${topPause.reason || "Sin motivo"}"`, detail: `${topPause.count} evento(s) · ${Math.round(topPause.totalSeconds / 60)} min perdidos · ${formatMetricNumber(topPause.percent, 1)}% del tiempo en pausa.`, level: "Importante" });
      }
      if (dashboardParetoRows.length > 0 && dashboardParetoRows[0].cumulativePercent <= 80) {
        diagSections.push({ title: `📊 Pareto: "${dashboardParetoRows[0].label}" genera ${formatMetricNumber(dashboardParetoRows[0].percent, 1)}% del impacto`, detail: "Concentrar esfuerzos en las primeras 3 causas del Pareto resolverá el 80% del tiempo perdido.", level: "Recomendación" });
      }
      if (diagSections.length === 0) {
        diagSections.push({ title: "✓ Sin alertas críticas detectadas", detail: "Los indicadores operativos están dentro de parámetros normales.", level: "OK" });
      }
      diagSections.forEach((item) => {
        const levelColor = item.level === "Crítico" ? COLOR_RED : item.level === "Importante" ? COLOR_AMBER : item.level === "Recomendación" ? COLOR_BLUE : COLOR_GREEN;
        pdf.setFillColor(...levelColor);
        pdf.roundedRect(marginX, diagY, 4, 32, 2, 2, "F");
        pdf.setFillColor(249, 250, 249);
        pdf.setDrawColor(220, 228, 220);
        pdf.roundedRect(marginX + 4, diagY, printableWidth - 4, 32, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(item.title, marginX + 12, diagY + 12);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(...TEXT_MID);
        pdf.text(item.detail, marginX + 12, diagY + 24);
        pdf.setFontSize(7);
        pdf.setTextColor(...levelColor);
        pdf.text(item.level, pageWidth - marginX, diagY + 12, { align: "right" });
        diagY += 40;
      });

      autoTable(pdf, {
        startY: diagY + 8,
        head: [["Prioridad", "Acción recomendada", "Indicador afectado", "Impacto estimado"]],
        body: [
          ["Alta", "Atender operaciones pausadas de inmediato", "Eficiencia operativa", `${formatMetricNumber(dashboardMetrics.pauseHours, 1)} h recuperables`],
          ["Alta", "Revisar causas top del Pareto", "Tiempo en pausa", `${pauseAnalysis[0] ? Math.round(pauseAnalysis[0].totalSeconds / 60) : 0} min`],
          ["Media", "Redistribuir carga entre players", "Distribución", `${dashboardResponsibleRows.length} players`],
          ["Media", "Monitorear SLA en actividades excedidas", "Cumplimiento SLA", `${formatMetricNumber(dashboardMetrics.outsidePercent, 1)}% fuera`],
          ["Baja", "Revisar frecuencia del catálogo", "Catálogo activo", `${dashboardMetrics.catalogActiveCount} actividades`],
        ],
        margin: { left: marginX, right: marginX },
        tableWidth: printableWidth,
        styles: { fontSize: 7.5, cellPadding: 5 },
        headStyles: { fillColor: BRAND_LIGHT, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [247, 250, 248] },
        columnStyles: { 0: { fontStyle: "bold", textColor: [180, 40, 40] } },
      });

      addPageFooter();
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
    { title: "Horas productivas", value: formatMetricNumber(dashboardMetrics.productionHours ?? dashboardMetrics.totalHours, 1), subtitle: "tiempo real de producción", tone: "green", icon: CalendarDays },
    { title: "Horas en pausa", value: formatMetricNumber(dashboardMetrics.pauseHours, 1), subtitle: "tiempo no productivo acumulado", tone: "red", icon: OctagonAlert },
    { title: "Eficiencia operativa", value: `${formatMetricNumber(dashboardMetrics.efficiency ?? 100, 1)}%`, subtitle: "producción / tiempo total", tone: dashboardMetrics.efficiency >= 80 ? "lime" : dashboardMetrics.efficiency >= 60 ? "amber" : "red", icon: Zap },
    { title: "Cumplimiento SLA", value: `${formatMetricNumber(dashboardMetrics.withinPercent, 1)}%`, subtitle: "porcentaje dentro del límite", tone: "lime", icon: Zap },
    { title: "Fuera de SLA", value: `${formatMetricNumber(dashboardMetrics.outsidePercent, 1)}%`, subtitle: "proporción fuera del objetivo", tone: "amber", icon: AlertTriangle },
    { title: "Pausas registradas", value: String(dashboardMetrics.pauseCount), subtitle: "interrupciones con log", tone: "slate", icon: Pause },
    { title: "Áreas activas", value: String(dashboardMetrics.areaCount), subtitle: "áreas con movimiento operativo", tone: "cyan", icon: Users },
    { title: "Catálogo activo", value: String(dashboardMetrics.catalogActiveCount), subtitle: "actividades disponibles", tone: "slate", icon: ClipboardList },
    { title: "Obligatorias", value: String(dashboardMetrics.catalogMandatoryCount), subtitle: "actividades base", tone: "green", icon: CircleCheckBig },
    { title: "Ocasionales", value: String(dashboardMetrics.catalogOptionalCount), subtitle: "actividades complementarias", tone: "amber", icon: PauseCircle },
    { title: "Horas totales", value: formatMetricNumber(dashboardMetrics.totalHours, 1), subtitle: "tiempo completado acumulado", tone: "cyan", icon: CalendarDays },
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
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  className={`icon-button${trendChartType === "bar" ? " active" : ""}`}
                  style={{ minHeight: "1.7rem", padding: "0.2rem 0.6rem", fontSize: "0.74rem" }}
                  onClick={() => setTrendChartType("bar")}
                  title="Gráfico de barras"
                  aria-pressed={trendChartType === "bar"}
                >
                  <BarChart3 size={14} />
                </button>
                <button
                  type="button"
                  className={`icon-button${trendChartType === "line" ? " active" : ""}`}
                  style={{ minHeight: "1.7rem", padding: "0.2rem 0.6rem", fontSize: "0.74rem" }}
                  onClick={() => setTrendChartType("line")}
                  title="Gráfico de líneas"
                  aria-pressed={trendChartType === "line"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </button>
              </div>
            </div>
            {trendChartType === "bar" ? (
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
            ) : (
              <DashboardLineChart
                series={[
                  {
                    key: "total",
                    label: "Registros",
                    color: "#0ea5e9",
                    data: dashboardTrendRows.map((item) => ({ label: item.label, y: item.total })),
                  },
                  {
                    key: "completed",
                    label: "Cerrados",
                    color: "#14b8a6",
                    data: dashboardTrendRows.map((item) => ({ label: item.label, y: item.completed })),
                  },
                  {
                    key: "paused",
                    label: "Pausados",
                    color: "#f59e0b",
                    data: dashboardTrendRows.map((item) => ({ label: item.label, y: item.paused || 0 })),
                  },
                ]}
                emptyLabel="No hay tendencia disponible para el periodo seleccionado."
              />
            )}
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
