/**
 * COPMEC AI — Cerebro Operativo y Guardián de Datos
 * Motor de inteligencia local: analiza el estado real del sistema
 * y responde con información operativa precisa basada en los datos de COPMEC.
 */

import { getWarehouseState, findWarehouseUserById } from "./warehouse.store.js";

// ─── Constantes de estado de filas ──────────────────────────────────────────
const STATUS_PENDING  = "pending";
const STATUS_RUNNING  = "running";
const STATUS_PAUSED   = "paused";
const STATUS_FINISHED = "finished";

// ─── Utilidades ─────────────────────────────────────────────────────────────
function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesAny(text, keywords) {
  const norm = normalizeText(text);
  return keywords.some((kw) => norm.includes(kw));
}

function formatNumber(n, decimals = 0) {
  const parsed = Number(n);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPercent(n) {
  if (!Number.isFinite(Number(n))) return "—";
  return `${Number(n).toFixed(1)}%`;
}

function buildStateSnapshot() {
  const state = getWarehouseState();
  const boards = Array.isArray(state.controlBoards) ? state.controlBoards : [];
  const users  = Array.isArray(state.users) ? state.users : [];
  const inventory = Array.isArray(state.inventoryItems) ? state.inventoryItems : [];
  const incidencias = Array.isArray(state.incidencias) ? state.incidencias : [];
  const catalog = Array.isArray(state.catalog) ? state.catalog : [];
  const weekHistory = Array.isArray(state.boardWeekHistory) ? state.boardWeekHistory : [];

  // Todas las filas activas (semana actual)
  const allRows = boards.flatMap((b) =>
    (Array.isArray(b.rows) ? b.rows : []).map((row) => ({ ...row, _boardName: b.name, _boardId: b.id, _area: b.settings?.area || "" }))
  );

  return { state, boards, users, inventory, incidencias, catalog, weekHistory, allRows };
}

// ─── Detectores de intención ─────────────────────────────────────────────────
const INTENTS = [
  {
    id: "greeting",
    triggers: ["hola", "buenos dias", "buenas tardes", "buenas noches", "que tal", "como estas", "saludo"],
    handler: handleGreeting,
  },
  {
    id: "help",
    triggers: ["ayuda", "que puedes hacer", "que sabes", "funciones", "comandos", "capacidades", "como usar"],
    handler: handleHelp,
  },
  {
    id: "inventory_alert",
    triggers: ["stock bajo", "inventario critico", "sin stock", "agotado", "bajo stock", "alerta inventario", "minimo"],
    handler: handleInventoryAlerts,
  },
  {
    id: "inventory_general",
    triggers: ["inventario", "productos", "articulos", "items", "stock", "insumo", "mercancia", "existencia"],
    handler: handleInventoryGeneral,
  },
  {
    id: "boards_paused",
    triggers: ["pausa", "pausado", "detenido", "bloqueado", "en espera"],
    handler: handlePausedBoards,
  },
  {
    id: "boards_status",
    triggers: ["tablero", "tableros", "board", "estado tablero", "actividad", "proceso"],
    handler: handleBoardsStatus,
  },
  {
    id: "users_activity",
    triggers: ["usuario", "player", "players", "equipo", "quien", "personal", "operador"],
    handler: handleUsersActivity,
  },
  {
    id: "incidencias",
    triggers: ["incidencia", "problema", "falla", "reporte de problema", "issues", "novedad"],
    handler: handleIncidencias,
  },
  {
    id: "report_summary",
    triggers: ["reporte", "resumen", "informe", "summary", "panorama general", "estado general", "como vamos", "como estamos"],
    handler: handleGeneralReport,
  },
  {
    id: "bottleneck",
    triggers: ["cuello de botella", "lento", "mas lento", "bottleneck", "retrasado", "demora", "tiempo excesivo"],
    handler: handleBottlenecks,
  },
  {
    id: "prediction",
    triggers: ["prediccion", "predicción", "alerta", "prevencion", "prevenir", "riesgo", "anticipar", "futuro"],
    handler: handlePredictions,
  },
  {
    id: "audit",
    triggers: ["auditoria", "auditoria", "nom", "normativa", "cumplimiento", "revision de calidad"],
    handler: handleAuditStatus,
  },
  {
    id: "catalog",
    triggers: ["catalogo", "actividades", "frecuencia", "tarea programada"],
    handler: handleCatalog,
  },
];

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleGreeting(snap, user) {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const name = user?.name ? `, ${user.name.split(" ")[0]}` : "";
  const activeBoards = snap.boards.filter((b) => (b.rows || []).some((r) => r.status === STATUS_RUNNING)).length;
  const pausedCount = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;

  const lines = [
    `**${saludo}${name}.** Soy el Cerebro Operativo de COPMEC.`,
    ``,
    `**Estado actual del sistema:**`,
    `- 📋 **${snap.boards.length}** tableros registrados`,
    `- ▶️ **${activeBoards}** tableros con actividad en curso`,
    pausedCount > 0 ? `- ⏸️ **${pausedCount}** registros pausados — requieren atención` : `- ✅ Sin registros pausados`,
    `- 📦 **${snap.inventory.length}** artículos en inventario`,
    snap.incidencias.filter((i) => i.status !== "cerrada").length > 0
      ? `- 🔴 **${snap.incidencias.filter((i) => i.status !== "cerrada").length}** incidencias abiertas`
      : `- ✅ Sin incidencias abiertas`,
    ``,
    `¿En qué puedo ayudarte? Escribe **"ayuda"** para ver mis capacidades.`,
  ];

  return lines.join("\n");
}

function handleHelp() {
  return [
    `**Capacidades del Cerebro Operativo COPMEC:**`,
    ``,
    `📊 **Análisis Operativo**`,
    `- *"resumen"* — Panorama completo del sistema`,
    `- *"estado de tableros"* — Ver todos los tableros y sus filas`,
    `- *"tableros pausados"* — Identificar procesos detenidos`,
    `- *"cuello de botella"* — Detectar cuellos de botella y demoras`,
    ``,
    `📦 **Inventario**`,
    `- *"inventario"* — Estado del inventario actual`,
    `- *"stock bajo"* — Alertas de artículos por debajo del mínimo`,
    ``,
    `👥 **Equipo**`,
    `- *"usuarios"* — Estado del equipo y roles activos`,
    ``,
    `⚠️ **Incidencias y Calidad**`,
    `- *"incidencias"* — Incidencias abiertas y pendientes`,
    `- *"auditoría"* — Estado de cumplimiento y auditorías`,
    `- *"catálogo"* — Actividades programadas`,
    ``,
    `🔮 **Predicciones**`,
    `- *"predicciones"* — Alertas preventivas y riesgos detectados`,
    ``,
    `💡 También puedo responder preguntas específicas sobre cualquier tablero, usuario o artículo.`,
  ].join("\n");
}

function handleInventoryAlerts(snap) {
  const lowStock = snap.inventory.filter((item) => {
    const stock = Number(item.stockUnits || 0);
    const min = Number(item.minStockUnits || 0);
    return min > 0 && stock <= min;
  });

  const critical = snap.inventory.filter((item) => {
    const stock = Number(item.stockUnits || 0);
    return stock === 0;
  });

  if (lowStock.length === 0) {
    return `✅ **Sin alertas de stock bajo.** Todos los artículos están por encima de sus mínimos configurados.\n\n*Inventario total: ${snap.inventory.length} artículos monitoreados.*`;
  }

  const lines = [
    `⚠️ **ALERTA DE INVENTARIO — ${lowStock.length} artículo(s) en nivel crítico:**`,
    ``,
  ];

  if (critical.length > 0) {
    lines.push(`**🔴 Sin existencia (0 unidades):**`);
    critical.slice(0, 8).forEach((item) => {
      lines.push(`- **${item.code || item.id}** · ${item.name} *(mínimo: ${item.minStockUnits} ${item.unitLabel || "uds"})*`);
    });
    lines.push(``);
  }

  const lowButNotZero = lowStock.filter((i) => Number(i.stockUnits) > 0);
  if (lowButNotZero.length > 0) {
    lines.push(`**🟡 Por debajo del mínimo:**`);
    lowButNotZero.slice(0, 10).forEach((item) => {
      const stock = Number(item.stockUnits || 0);
      const min = Number(item.minStockUnits || 0);
      const coverage = min > 0 ? Math.round((stock / min) * 100) : 0;
      lines.push(`- **${item.code || item.id}** · ${item.name} — Stock: ${formatNumber(stock)} / Mín: ${formatNumber(min)} ${item.unitLabel || "uds"} *(${coverage}% del mínimo)*`);
    });
  }

  lines.push(``);
  lines.push(`💡 **Recomendación:** Gestiona el reabastecimiento desde la sección **Inventario > Movimientos**.`);

  return lines.join("\n");
}

function handleInventoryGeneral(snap) {
  const byDomain = { base: [], cleaning: [], orders: [] };
  snap.inventory.forEach((item) => {
    const domain = item.domain || "base";
    if (byDomain[domain]) byDomain[domain].push(item);
    else byDomain.base.push(item);
  });

  const lowStock = snap.inventory.filter((i) => {
    const s = Number(i.stockUnits || 0); const m = Number(i.minStockUnits || 0);
    return m > 0 && s <= m;
  }).length;

  const lines = [
    `📦 **ESTADO DEL INVENTARIO**`,
    ``,
    `| Categoría | Artículos | Con alerta |`,
    `|-----------|-----------|------------|`,
    `| Productos base | ${byDomain.base.length} | ${byDomain.base.filter((i) => Number(i.stockUnits) <= Number(i.minStockUnits) && Number(i.minStockUnits) > 0).length} |`,
    `| Insumos de limpieza | ${byDomain.cleaning.length} | ${byDomain.cleaning.filter((i) => Number(i.stockUnits) <= Number(i.minStockUnits) && Number(i.minStockUnits) > 0).length} |`,
    `| Insumos de pedidos | ${byDomain.orders.length} | ${byDomain.orders.filter((i) => Number(i.stockUnits) <= Number(i.minStockUnits) && Number(i.minStockUnits) > 0).length} |`,
    `| **TOTAL** | **${snap.inventory.length}** | **${lowStock}** |`,
    ``,
    lowStock > 0
      ? `⚠️ ${lowStock} artículo(s) con stock por debajo del mínimo. Escribe **"stock bajo"** para ver el detalle.`
      : `✅ Todos los artículos están sobre sus mínimos configurados.`,
  ];

  return lines.join("\n");
}

function handlePausedBoards(snap) {
  const paused = snap.allRows.filter((r) => r.status === STATUS_PAUSED);

  if (paused.length === 0) {
    return `✅ **Sin registros pausados.** Todos los procesos activos están en curso sin interrupciones.`;
  }

  const lines = [
    `⏸️ **PROCESOS PAUSADOS — ${paused.length} registro(s) detenidos:**`,
    ``,
  ];

  const byBoard = new Map();
  paused.forEach((row) => {
    const key = row._boardName || "Tablero sin nombre";
    if (!byBoard.has(key)) byBoard.set(key, []);
    byBoard.get(key).push(row);
  });

  byBoard.forEach((rows, boardName) => {
    lines.push(`**📋 ${boardName}** — ${rows.length} pausado(s)`);
    rows.slice(0, 5).forEach((row) => {
      const pauseInfo = row.pausedAt ? ` *(desde ${new Date(row.pausedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })})*` : "";
      const pauseReason = row.pauseReason ? ` — Motivo: *${row.pauseReason}*` : "";
      lines.push(`  - Fila ${row.id?.slice(-6) || "?"}${pauseInfo}${pauseReason}`);
    });
    lines.push(``);
  });

  lines.push(`💡 **Acción requerida:** Revisa cada tablero pausado y reanuda o finaliza los procesos detenidos.`);

  return lines.join("\n");
}

function handleBoardsStatus(snap) {
  if (snap.boards.length === 0) {
    return `📋 **Sin tableros registrados.** Crea tableros desde la sección *Creador de tableros*.`;
  }

  const lines = [
    `📋 **ESTADO DE TABLEROS (${snap.boards.length} total)**`,
    ``,
    `| Tablero | Área | Total filas | En curso | Pausados | Terminados |`,
    `|---------|------|-------------|----------|----------|------------|`,
  ];

  snap.boards.slice(0, 20).forEach((board) => {
    const rows = Array.isArray(board.rows) ? board.rows : [];
    const running = rows.filter((r) => r.status === STATUS_RUNNING).length;
    const paused = rows.filter((r) => r.status === STATUS_PAUSED).length;
    const finished = rows.filter((r) => r.status === STATUS_FINISHED).length;
    const area = board.settings?.area || board.area || "—";
    lines.push(`| ${board.name} | ${area} | ${rows.length} | ${running} | ${paused} | ${finished} |`);
  });

  const totalRows = snap.allRows.length;
  const totalRunning = snap.allRows.filter((r) => r.status === STATUS_RUNNING).length;
  const totalPaused  = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;
  const totalFinished = snap.allRows.filter((r) => r.status === STATUS_FINISHED).length;

  lines.push(``);
  lines.push(`**Totales:** ${totalRows} filas — ${totalRunning} en curso · ${totalPaused} pausadas · ${totalFinished} terminadas`);

  if (totalPaused > 0) {
    lines.push(``);
    lines.push(`⚠️ Tienes **${totalPaused} registro(s) pausado(s)**. Escribe *"tableros pausados"* para más detalle.`);
  }

  return lines.join("\n");
}

function handleUsersActivity(snap) {
  const active = snap.users.filter((u) => u.isActive);
  const inactive = snap.users.filter((u) => !u.isActive);

  const byRole = {};
  active.forEach((u) => {
    const role = u.role || "Sin rol";
    if (!byRole[role]) byRole[role] = 0;
    byRole[role]++;
  });

  const lines = [
    `👥 **ESTADO DEL EQUIPO**`,
    ``,
    `- Usuarios activos: **${active.length}**`,
    `- Usuarios inactivos: **${inactive.length}**`,
    ``,
    `**Distribución por rol:**`,
  ];

  Object.entries(byRole).forEach(([role, count]) => {
    const roleLabel = { lead: "Lead", sr: "SR", ssr: "SSR", jr: "JR" }[role] || role;
    lines.push(`- ${roleLabel}: **${count}** jugador(es)`);
  });

  if (active.length > 0) {
    lines.push(``);
    lines.push(`**Equipo activo:**`);
    active.slice(0, 15).forEach((u) => {
      const role = { lead: "Lead", sr: "SR", ssr: "SSR", jr: "JR" }[u.role] || u.role;
      const dept = u.area || u.department ? ` · ${u.area || u.department}` : "";
      lines.push(`- **${u.name}** *(${role}${dept})*`);
    });
    if (active.length > 15) lines.push(`- *... y ${active.length - 15} más*`);
  }

  return lines.join("\n");
}

function handleIncidencias(snap) {
  const open = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta");
  const resolved = snap.incidencias.filter((i) => i.status === "cerrada" || i.status === "resuelta");

  if (snap.incidencias.length === 0) {
    return `✅ **Sin incidencias registradas.** El sistema opera sin novedades reportadas.`;
  }

  const lines = [
    `⚠️ **INCIDENCIAS — ${snap.incidencias.length} total**`,
    ``,
    `- Abiertas/pendientes: **${open.length}**`,
    `- Resueltas/cerradas: **${resolved.length}**`,
    ``,
  ];

  if (open.length > 0) {
    lines.push(`**🔴 Incidencias abiertas:**`);
    open.slice(0, 8).forEach((inc) => {
      const date = inc.createdAt ? new Date(inc.createdAt).toLocaleDateString("es-MX") : "—";
      const priority = inc.priority || inc.severidad || "";
      lines.push(`- [${date}] **${inc.title || inc.descripcion || "Sin título"}** ${priority ? `*(${priority})*` : ""} — Estado: *${inc.status || "abierta"}*`);
    });
  }

  if (open.length === 0) {
    lines.push(`✅ Todas las incidencias están resueltas.`);
  }

  return lines.join("\n");
}

function handleGeneralReport(snap) {
  const now = new Date();
  const allRows = snap.allRows;
  const totalRows = allRows.length;
  const running  = allRows.filter((r) => r.status === STATUS_RUNNING).length;
  const paused   = allRows.filter((r) => r.status === STATUS_PAUSED).length;
  const finished = allRows.filter((r) => r.status === STATUS_FINISHED).length;
  const pending  = allRows.filter((r) => r.status === STATUS_PENDING).length;
  const completionRate = totalRows > 0 ? ((finished / totalRows) * 100).toFixed(1) : 0;

  const lowStock = snap.inventory.filter((i) => {
    const s = Number(i.stockUnits || 0); const m = Number(i.minStockUnits || 0);
    return m > 0 && s <= m;
  }).length;

  const openIncidencias = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta").length;
  const activeUsers = snap.users.filter((u) => u.isActive).length;

  const lines = [
    `📊 **REPORTE GENERAL — ${now.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}**`,
    ``,
    `**🏭 PRODUCCIÓN**`,
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Tableros activos | ${snap.boards.length} |`,
    `| Total de registros | ${totalRows} |`,
    `| En curso ▶️ | ${running} |`,
    `| Pausados ⏸️ | ${paused} |`,
    `| Terminados ✅ | ${finished} |`,
    `| Pendientes ⏳ | ${pending} |`,
    `| Tasa de cierre | ${completionRate}% |`,
    ``,
    `**📦 INVENTARIO**`,
    `- Artículos totales: **${snap.inventory.length}**`,
    lowStock > 0
      ? `- ⚠️ Alertas de stock bajo: **${lowStock}** artículo(s)`
      : `- ✅ Inventario en niveles saludables`,
    ``,
    `**👥 EQUIPO**`,
    `- Usuarios activos: **${activeUsers}** de ${snap.users.length} totales`,
    ``,
    `**⚠️ INCIDENCIAS**`,
    openIncidencias > 0
      ? `- 🔴 **${openIncidencias}** incidencia(s) abiertas — requieren seguimiento`
      : `- ✅ Sin incidencias abiertas`,
    ``,
  ];

  // Alertas prioritarias
  const alerts = [];
  if (paused > 0) alerts.push(`⏸️ ${paused} proceso(s) pausado(s) sin resolver`);
  if (lowStock > 0) alerts.push(`📦 ${lowStock} artículo(s) con stock bajo del mínimo`);
  if (openIncidencias > 0) alerts.push(`⚠️ ${openIncidencias} incidencia(s) pendiente(s) de cierre`);

  if (alerts.length > 0) {
    lines.push(`**🚨 PUNTOS DE ATENCIÓN INMEDIATA:**`);
    alerts.forEach((a) => lines.push(`- ${a}`));
  } else {
    lines.push(`✅ **El sistema opera sin alertas críticas detectadas.**`);
  }

  return lines.join("\n");
}

function handleBottlenecks(snap) {
  // Detectar tableros con alta proporción de pausas
  const boardMetrics = snap.boards.map((board) => {
    const rows = Array.isArray(board.rows) ? board.rows : [];
    const paused = rows.filter((r) => r.status === STATUS_PAUSED).length;
    const total = rows.length;
    const pauseRate = total > 0 ? (paused / total) : 0;
    return { name: board.name, area: board.settings?.area || "—", total, paused, pauseRate };
  }).filter((m) => m.total > 0).sort((a, b) => b.pauseRate - a.pauseRate);

  if (boardMetrics.length === 0) {
    return `✅ **Sin cuellos de botella detectados.** No hay suficientes datos de actividad para análisis predictivo.`;
  }

  const criticalBoards = boardMetrics.filter((m) => m.pauseRate > 0.3);

  const lines = [
    `🔍 **ANÁLISIS DE CUELLOS DE BOTELLA**`,
    ``,
  ];

  if (criticalBoards.length > 0) {
    lines.push(`**⚠️ Tableros con alta tasa de pausa (>30%):**`);
    criticalBoards.forEach((m) => {
      lines.push(`- **${m.name}** *(${m.area})* — ${formatPercent(m.pauseRate * 100)} pausado (${m.paused}/${m.total} registros)`);
    });
    lines.push(``);
  }

  lines.push(`**Ranking de tableros por actividad:**`);
  lines.push(`| Tablero | Área | Total | Pausados | Tasa pausa |`);
  lines.push(`|---------|------|-------|----------|------------|`);
  boardMetrics.slice(0, 10).forEach((m) => {
    lines.push(`| ${m.name} | ${m.area} | ${m.total} | ${m.paused} | ${formatPercent(m.pauseRate * 100)} |`);
  });

  lines.push(``);
  lines.push(`💡 **Recomendación:** Los tableros con mayor tasa de pausa requieren revisión inmediata del flujo operativo.`);

  return lines.join("\n");
}

function handlePredictions(snap) {
  const predictions = [];

  // Predicción de stockout
  const criticalStock = snap.inventory.filter((i) => {
    const s = Number(i.stockUnits || 0); const m = Number(i.minStockUnits || 0);
    return m > 0 && s <= m * 0.5;
  });
  if (criticalStock.length > 0) {
    predictions.push({
      level: "alta",
      icon: "🔴",
      title: `Riesgo de desabasto — ${criticalStock.length} artículo(s)`,
      detail: criticalStock.slice(0, 3).map((i) => `${i.code} · ${i.name}`).join(", "),
      action: "Gestionar reabastecimiento de inmediato en Inventario",
    });
  }

  // Predicción de procesos estancados
  const stuckBoards = snap.boards.filter((board) => {
    const rows = Array.isArray(board.rows) ? board.rows : [];
    const paused = rows.filter((r) => r.status === STATUS_PAUSED).length;
    return rows.length > 0 && paused / rows.length > 0.5;
  });
  if (stuckBoards.length > 0) {
    predictions.push({
      level: "media",
      icon: "🟡",
      title: `Procesos estancados — ${stuckBoards.length} tablero(s)`,
      detail: stuckBoards.map((b) => b.name).join(", "),
      action: "Revisar y reanudar procesos pausados",
    });
  }

  // Incidencias sin resolver prolongadas
  const openIncidencias = snap.incidencias.filter((i) => {
    if (i.status === "cerrada" || i.status === "resuelta") return false;
    const created = i.createdAt ? new Date(i.createdAt) : null;
    if (!created) return true;
    const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 3;
  });
  if (openIncidencias.length > 0) {
    predictions.push({
      level: "media",
      icon: "🟡",
      title: `Incidencias sin resolver por más de 3 días — ${openIncidencias.length}`,
      detail: openIncidencias.slice(0, 3).map((i) => i.title || i.descripcion || "Sin título").join(", "),
      action: "Dar seguimiento y cerrar incidencias pendientes",
    });
  }

  if (predictions.length === 0) {
    return `🟢 **Sin riesgos operativos detectados.** El sistema no muestra patrones de riesgo inminente basados en los datos actuales.`;
  }

  const lines = [
    `🔮 **ANÁLISIS PREDICTIVO — ${predictions.length} alerta(s) identificada(s):**`,
    ``,
  ];

  predictions.forEach((p) => {
    lines.push(`${p.icon} **[Riesgo ${p.level.toUpperCase()}] ${p.title}**`);
    if (p.detail) lines.push(`   *${p.detail}*`);
    lines.push(`   💡 Acción: ${p.action}`);
    lines.push(``);
  });

  return lines.join("\n");
}

function handleAuditStatus(snap) {
  const lines = [
    `📋 **ESTADO DE AUDITORÍA Y CUMPLIMIENTO**`,
    ``,
    `*Marco normativo de referencia: NOM-059-SSA1-2015 · NOM-251-SSA1-2009*`,
    ``,
    `**Indicadores de cumplimiento operativo:**`,
  ];

  const totalRows = snap.allRows.length;
  const finished = snap.allRows.filter((r) => r.status === STATUS_FINISHED).length;
  const completionRate = totalRows > 0 ? ((finished / totalRows) * 100).toFixed(1) : 0;

  lines.push(`- Tasa de cierre de procesos: **${completionRate}%** *(objetivo: ≥85%)*`);

  const lowStock = snap.inventory.filter((i) => Number(i.stockUnits) < Number(i.minStockUnits) && Number(i.minStockUnits) > 0).length;
  if (lowStock > 0) {
    lines.push(`- ⚠️ Inventario bajo mínimos: **${lowStock}** artículo(s) — incumplimiento en disponibilidad de insumos`);
  } else {
    lines.push(`- ✅ Inventario dentro de mínimos requeridos`);
  }

  const openInc = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta").length;
  if (openInc > 0) {
    lines.push(`- ⚠️ Incidencias sin cierre: **${openInc}** — impacto en trazabilidad de calidad`);
  } else {
    lines.push(`- ✅ Sin incidencias pendientes de cierre`);
  }

  lines.push(``);
  lines.push(`📁 Para generar un reporte ejecutivo detallado, dirígete a la sección **Auditorías** del sistema.`);

  return lines.join("\n");
}

function handleCatalog(snap) {
  if (snap.catalog.length === 0) {
    return `📋 **Catálogo vacío.** No se han registrado actividades en el catálogo. Configúralo desde la sección *Creador de tableros > Catálogo de actividades*.`;
  }

  const byFrequency = {};
  snap.catalog.forEach((item) => {
    const freq = item.frequency || "Sin frecuencia";
    if (!byFrequency[freq]) byFrequency[freq] = [];
    byFrequency[freq].push(item);
  });

  const lines = [
    `📋 **CATÁLOGO DE ACTIVIDADES — ${snap.catalog.length} elementos**`,
    ``,
    `| Frecuencia | Actividades |`,
    `|------------|-------------|`,
  ];

  Object.entries(byFrequency).forEach(([freq, items]) => {
    lines.push(`| ${freq} | ${items.length} |`);
  });

  lines.push(``);
  lines.push(`**Primeras actividades:**`);
  snap.catalog.slice(0, 8).forEach((item) => {
    const freq = item.frequency ? ` *(${item.frequency})*` : "";
    lines.push(`- **${item.name || item.label || "Sin nombre"}**${freq}`);
  });

  if (snap.catalog.length > 8) lines.push(`- *... y ${snap.catalog.length - 8} más*`);

  return lines.join("\n");
}

function handleUnknown(message) {
  return [
    `No encontré información específica para tu consulta: *"${message.slice(0, 60)}${message.length > 60 ? "..." : ""}"*`,
    ``,
    `Puedo ayudarte con:`,
    `- **"resumen"** — Estado general del sistema`,
    `- **"inventario"** o **"stock bajo"** — Estado del inventario`,
    `- **"tableros"** — Estado de los tableros operativos`,
    `- **"incidencias"** — Novedades y problemas reportados`,
    `- **"usuarios"** — Estado del equipo`,
    `- **"predicciones"** — Alertas preventivas`,
    ``,
    `Escribe **"ayuda"** para ver todas mis capacidades.`,
  ].join("\n");
}

// ─── Motor principal ─────────────────────────────────────────────────────────

export function processCopmecAIMessage(auth, message) {
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return { ok: false, message: "Mensaje vacío." };
  }

  const user = auth?.userId ? findWarehouseUserById(auth.userId) : null;
  const snap = buildStateSnapshot();
  const trimmed = message.trim();

  // Buscar intent que coincida
  for (const intent of INTENTS) {
    if (matchesAny(trimmed, intent.triggers)) {
      const response = intent.handler(snap, user, trimmed);
      return { ok: true, response, intent: intent.id };
    }
  }

  // Sin intent detectado — respuesta contextual de desconocido
  return { ok: true, response: handleUnknown(trimmed), intent: "unknown" };
}
