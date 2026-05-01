
// ── Componentes de Dashboard ─────────────────────────────────────────────────
// StatusBadge, MetricCard, InventoryStockBar, DashboardKpiCard, DashboardBarRow,
// DashboardRankItem, DashboardProgressMetric, DashboardParetoRow, DashboardCauseCard,
// DashboardSection, DashboardPieChart, DashboardColumnChart, DashboardLineChart,
// DashboardParetoChart, DashboardIshikawaDiagram, CopmecBrand, StatTile
// ─────────────────────────────────────────────────────────────────────────────

import { ArrowDown } from "lucide-react";
import copmecLogo from "../assets/copmec-logo.jpeg";

const KPI_STYLES = {
  cyan:  { iconBg: "#53dde5", iconColor: "#178e94" },
  green: { iconBg: "#58d88d", iconColor: "#20894d" },
  red:   { iconBg: "#ff5f5f", iconColor: "#bf2f2f" },
  lime:  { iconBg: "#56d97a", iconColor: "#238343" },
  amber: { iconBg: "#ffbf47", iconColor: "#b87800" },
  slate: { iconBg: "#eef1f7", iconColor: "#8a94a6" },
};

const DASHBOARD_CHART_PALETTE = ["#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];
const DASHBOARD_LINE_PALETTE  = ["#0ea5e9", "#14b8a6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

// ── Componentes simples ───────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export function MetricCard({ label, value, hint, tone = "default" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

export function InventoryStockBar({ current, minimum, unitLabel = "pzas", target = null, primaryLabel = "", secondaryLabel = "", className = "" }) {
  const safeCurrent = Math.max(0, Number(current || 0));
  const safeMinimum = Math.max(0, Number(minimum || 0));
  const safeTarget  = Math.max(0, Number(target || 0));
  const baseline = Math.max(safeTarget || (safeMinimum > 0 ? safeMinimum * 2 : safeCurrent), 1);
  const percent  = Math.min(100, (safeCurrent / baseline) * 100);
  const isLow    = safeMinimum > 0 ? safeCurrent <= safeMinimum : safeCurrent === 0;
  const resolvedPrimaryLabel   = primaryLabel   || `${safeCurrent} ${unitLabel}`;
  const resolvedSecondaryLabel = secondaryLabel || (safeMinimum > 0 ? `Mínimo ${safeMinimum} ${unitLabel}` : `Objetivo ${baseline} ${unitLabel}`);
  return (
    <div className={`progress-row ${className}`.trim()}>
      <div className="progress-row-head">
        <span>{resolvedPrimaryLabel}</span>
        <small>{resolvedSecondaryLabel}</small>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${isLow ? "danger" : ""}`} style={{ width: `${Math.max(8, percent)}%` }} />
      </div>
    </div>
  );
}

export function DashboardKpiCard({ title, value, valueMeta, _subtitle, tone, icon: Icon }) {
  const palette = KPI_STYLES[tone] || KPI_STYLES.cyan;
  return (
    <article className="dashboard-kpi-card">
      <div className="dashboard-kpi-head">
        <div className="dashboard-kpi-icon" style={{ backgroundColor: palette.iconBg, color: palette.iconColor }}>
          {Icon ? <Icon size={14} strokeWidth={2.1} /> : null}
        </div>
      </div>
      <span>{title}</span>
      <strong>
        {value}
        {valueMeta ? <span className="dashboard-kpi-value-meta">{valueMeta}</span> : null}
      </strong>
    </article>
  );
}

export function DashboardBarRow({ label, value, max, color, trailing, initial }) {
  const percent = max > 0 ? Math.max(6, Math.min(100, (value / max) * 100)) : 6;
  return (
    <div className="dashboard-bar-row">
      <div className="dashboard-bar-track" />
      <div className="dashboard-bar-fill" style={{ width: `${percent}%`, background: color }} />
      <div className="dashboard-bar-content">
        <div className="dashboard-bar-identity">
          <span className="dashboard-initial-badge" style={{ background: color }}>{initial}</span>
          <span>{label}</span>
        </div>
        <strong>{trailing}</strong>
      </div>
    </div>
  );
}

export function DashboardRankItem({ index, label, value, color, highlighted = false }) {
  return (
    <li className={`dashboard-rank-item ${highlighted ? "highlighted" : ""}`}>
      <span className="dashboard-rank-index" style={{ background: color }}>{index}</span>
      <div>
        <strong>{label}</strong>
        <small>{value}</small>
      </div>
    </li>
  );
}

export function DashboardProgressMetric({ label, valueText, percent, color }) {
  return (
    <div className="dashboard-progress-metric">
      <span>{label}</span>
      <div className="dashboard-progress-metric-main">
        <div className="dashboard-progress-metric-track">
          <div className="dashboard-progress-metric-fill" style={{ width: `${Math.max(8, Math.min(100, percent))}%`, background: color }} />
        </div>
        <strong>{valueText}</strong>
      </div>
    </div>
  );
}

export function DashboardParetoRow({ label, percent, cumulativePercent, impactText, highlight = false }) {
  return (
    <div className={`dashboard-pareto-row ${highlight ? "highlight" : ""}`}>
      <div className="dashboard-pareto-row-head">
        <strong>{label}</strong>
        <span>{impactText}</span>
      </div>
      <div className="dashboard-pareto-bars">
        <div className="dashboard-pareto-track">
          <div className="dashboard-pareto-fill" style={{ width: `${Math.max(8, Math.min(100, percent))}%` }} />
        </div>
        <div className="dashboard-pareto-track cumulative">
          <div className="dashboard-pareto-fill cumulative" style={{ width: `${Math.max(8, Math.min(100, cumulativePercent))}%` }} />
        </div>
      </div>
      <small>{percent.toFixed(1)}% impacto · {cumulativePercent.toFixed(1)}% acumulado</small>
    </div>
  );
}

export function DashboardCauseCard({ title, share, count, examples }) {
  return (
    <article className="dashboard-cause-card">
      <div className="dashboard-cause-card-head">
        <strong>{title}</strong>
        <span>{share.toFixed(1)}%</span>
      </div>
      <small>{count} hallazgo(s) o causa(s) asociada(s)</small>
      <div className="saved-board-list dashboard-cause-chip-list">
        {examples.length ? examples.map((example) => <span key={example} className="chip">{example}</span>) : <span className="chip">Sin detalle</span>}
      </div>
    </article>
  );
}

export function DashboardSection({ title, _subtitle, summary, icon: Icon, open = true, onToggle, children }) {
  return (
    <details className="dashboard-section" open={open}>
      <summary className="dashboard-section-summary" onClick={(event) => {
        event.preventDefault();
        onToggle?.();
      }}>
        <div className="dashboard-section-summary-main">
          <div className="dashboard-section-summary-icon">
            {Icon ? <Icon size={18} /> : null}
          </div>
          <div>
            <strong>{title}</strong>
          </div>
        </div>
        <div className="dashboard-section-summary-side">
          {summary ? <small>{summary}</small> : null}
          <span className="dashboard-section-chevron">
            <ArrowDown size={16} />
          </span>
        </div>
      </summary>
      <div className="dashboard-section-body">{children}</div>
    </details>
  );
}

// ── Gráficas ──────────────────────────────────────────────────────────────────

export function DashboardPieChart({ rows }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">No hay datos suficientes para la gráfica de pastel.</p>;
  }

  let start = 0;
  const segments = rows.map((item, index) => {
    const color = item.solidColor || DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length];
    const end = start + item.percent;
    const segment = `${color} ${start}% ${end}%`;
    start = end; // eslint-disable-line react-hooks/immutability
    return segment;
  });

  return (
    <div className="dashboard-pie-layout">
      <div className="dashboard-pie-shell">
        <div className="dashboard-pie-chart" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
          <div className="dashboard-pie-core">
            <strong>{rows.reduce((sum, item) => sum + item.count, 0)}</strong>
            <span>registros</span>
          </div>
        </div>
      </div>
      <div className="dashboard-chart-legend">
        {rows.map((item, index) => {
          const color = item.solidColor || DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length];
          return (
            <div key={item.responsibleId || item.label || index} className="dashboard-legend-item">
              <span className="dashboard-legend-swatch" style={{ background: color }} />
              <div>
                <strong>{item.label}</strong>
                <small>{item.count} registros · {item.percent.toFixed(1)}%</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardColumnChart({ rows, color = "linear-gradient(180deg, #0ea5e9 0%, #14b8a6 100%)", valueSuffix = "", emptyLabel = "No hay datos para la gráfica." }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((item) => item.value), 1);

  return (
    <div className="dashboard-column-chart">
      {rows.map((item, index) => {
        const height = Math.max(14, (item.value / max) * 100);
        return (
          <div key={item.key || item.label || index} className="dashboard-column-item">
            <span className="dashboard-column-value">{item.valueLabel || `${Math.round(item.value)}${valueSuffix}`}</span>
            <div className="dashboard-column-track">
              <div className="dashboard-column-bar" style={{ height: `${height}%`, background: item.color || color }} title={item.tooltip || item.valueLabel || String(item.value)} />
            </div>
            <small>{item.label}</small>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardLineChart({ series = [], emptyLabel = "No hay datos para la gráfica." }) {
  if (!series.length || series.every((s) => !s.data?.length)) {
    return <p className="dashboard-empty-state">{emptyLabel}</p>;
  }

  const width  = 520;
  const height = 220;
  const padLeft   = 36;
  const padRight  = 12;
  const padTop    = 16;
  const padBottom = 32;
  const chartW = width  - padLeft - padRight;
  const chartH = height - padTop  - padBottom;

  const allValues  = series.flatMap((s) => s.data.map((d) => d.y));
  const maxVal     = Math.max(...allValues, 1);
  const minVal     = Math.min(...allValues.filter((v) => v > 0), 0);
  const range      = Math.max(maxVal - minVal, 1);
  const xLabels    = series[0]?.data.map((d) => d.label) ?? [];
  const pointCount = xLabels.length;
  const xStep      = pointCount > 1 ? chartW / (pointCount - 1) : 0;

  function toX(index) { return pointCount === 1 ? padLeft + chartW / 2 : padLeft + index * xStep; }
  function toY(value) { return padTop + chartH - ((value - minVal) / range) * chartH; }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(minVal + t * range));

  return (
    <div className="dashboard-linechart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-line-chart" aria-label="Gráfico de líneas">
        <defs>
          {series.map((s, idx) => {
            const color = s.color || DASHBOARD_LINE_PALETTE[idx % DASHBOARD_LINE_PALETTE.length];
            return (
              <linearGradient key={`lg-${s.key || idx}`} id={`lineArea-${s.key || idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            );
          })}
        </defs>

        {yTicks.map((tick, tidx) => (
          <g key={tidx}>
            <line x1={padLeft} y1={toY(tick)} x2={width - padRight} y2={toY(tick)} className="dashboard-grid-line" />
            <text x={padLeft - 4} y={toY(tick) + 4} className="dashboard-axis-label" textAnchor="end">{tick > 999 ? `${(tick / 1000).toFixed(1)}k` : tick}</text>
          </g>
        ))}

        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} className="dashboard-axis-line" />
        <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} className="dashboard-axis-line" />

        {xLabels.map((label, idx) => (
          <text key={idx} x={toX(idx)} y={height - 8} className="dashboard-axis-label" textAnchor="middle">{label}</text>
        ))}

        {series.map((s, idx) => {
          if (!s.data?.length) return null;
          const color    = s.color || DASHBOARD_LINE_PALETTE[idx % DASHBOARD_LINE_PALETTE.length];
          const pts      = s.data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(" ");
          const fillPath = `M${toX(0)},${height - padBottom} `
            + s.data.map((d, i) => `L${toX(i)},${toY(d.y)}`).join(" ")
            + ` L${toX(s.data.length - 1)},${height - padBottom} Z`;

          return (
            <g key={s.key || idx}>
              <path d={fillPath} fill={`url(#lineArea-${s.key || idx})`} />
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {s.data.map((d, i) => (
                <circle key={i} cx={toX(i)} cy={toY(d.y)} r="4" fill={color} stroke="#fff" strokeWidth="1.8">
                  <title>{`${s.label}: ${d.y}${s.valueSuffix || ""}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      {series.length > 1 && (
        <div className="dashboard-linechart-legend">
          {series.map((s, idx) => {
            const color = s.color || DASHBOARD_LINE_PALETTE[idx % DASHBOARD_LINE_PALETTE.length];
            return (
              <span key={s.key || idx} className="dashboard-linechart-legend-item">
                <span className="dashboard-linechart-legend-dot" style={{ background: color }} />
                {s.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardParetoChart({ rows }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">No hay datos suficientes para la gráfica de Pareto.</p>;
  }

  const width      = 520;
  const height     = 220;
  const chartLeft  = 38;
  const chartBottom = 30;
  const chartTop   = 18;
  const chartHeight = height - chartBottom - chartTop;
  const chartWidth  = width - chartLeft - 16;
  const barSlot    = chartWidth / rows.length;
  const barWidth   = Math.max(18, barSlot * 0.52);
  const maxPercent = Math.max(...rows.map((item) => item.percent), 1);

  const linePoints = rows.map((item, index) => {
    const x = chartLeft + barSlot * index + barSlot / 2;
    const y = chartTop + chartHeight - (item.cumulativePercent / 100) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="dashboard-pareto-chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-pareto-chart" aria-labelledby="dashboard-pareto-chart-title">
        <title id="dashboard-pareto-chart-title">Gráfica de Pareto de incidencias e impacto</title>
        <defs>
          <linearGradient id="paretoBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={height - chartBottom} className="dashboard-axis-line" />
        <line x1={chartLeft} y1={height - chartBottom} x2={width - 8} y2={height - chartBottom} className="dashboard-axis-line" />
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = chartTop + chartHeight - (tick / 100) * chartHeight;
          return (
            <g key={tick}>
              <line x1={chartLeft} y1={y} x2={width - 8} y2={y} className="dashboard-grid-line" />
              <text x={6} y={y + 4} className="dashboard-axis-label">{tick}%</text>
            </g>
          );
        })}
        {rows.map((item, index) => {
          const x = chartLeft + barSlot * index + (barSlot - barWidth) / 2;
          const barHeight = (item.percent / maxPercent) * chartHeight;
          const y = chartTop + chartHeight - barHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" className="dashboard-pareto-bar" />
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" className="dashboard-axis-label small">{index + 1}</text>
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" className="dashboard-pareto-line" />
        {rows.map((item, index) => {
          const x = chartLeft + barSlot * index + barSlot / 2;
          const y = chartTop + chartHeight - (item.cumulativePercent / 100) * chartHeight;
          return <circle key={`${item.label}-point`} cx={x} cy={y} r="4.5" className="dashboard-pareto-point" />;
        })}
      </svg>
      <div className="dashboard-pareto-footnote">Barras = impacto individual. Línea = impacto acumulado.</div>
    </div>
  );
}

export function DashboardIshikawaDiagram({ rows }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">No hay datos suficientes para el diagrama de Ishikawa.</p>;
  }

  return (
    <div className="dashboard-fishbone-shell">
      <div className="dashboard-fishbone-spine" />
      <div className="dashboard-fishbone-head">Impacto operativo</div>
      {rows.map((item, index) => {
        const branchClass = index % 2 === 0 ? "top" : "bottom";
        return (
          <article key={item.category} className={`dashboard-fishbone-branch ${branchClass}`.trim()}>
            <span className="dashboard-fishbone-line" />
            <div className="dashboard-fishbone-card">
              <div className="dashboard-fishbone-card-head">
                <strong>{item.category}</strong>
                <span>{item.impact.toFixed(1)}%</span>
              </div>
              <small>{item.count} causas asociadas</small>
              <p>{item.examples.join(" · ") || "Sin detalle"}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── Marca e identidad ─────────────────────────────────────────────────────────

export function CopmecBrand({ headingTag = "h1", subtitle = "Centro de Operaciones para la Mejora Continua", tone = "dark", compact = false, showKicker = true, kicker = "Sistema operativo" }) {
  const HeadingTag = headingTag;
  return (
    <div className={`copmec-brand ${tone} ${compact ? "compact" : ""}`.trim()}>
      <div className="copmec-logo-mark" aria-hidden="true">
        <img src={copmecLogo} alt="" className="copmec-logo-image" />
      </div>
      <div className="copmec-brand-copy">
        {showKicker ? <span className="copmec-brand-kicker">{kicker}</span> : null}
        <HeadingTag>COPMEC</HeadingTag>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function StatTile({ label, value, tone = "default", className = "" }) {
  return (
    <article className={`stat-tile ${tone} ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
