/**
 * COPMEC AI — Cerebro Operativo y Guardián de Datos
 * Motor de inteligencia local: conversacional, contextual y orientado a datos reales.
 */

import { getWarehouseState, findWarehouseUserById } from "./warehouse.store.js";

// ─── Constantes ──────────────────────────────────────────────────────────────
const STATUS_PENDING  = "pending";
const STATUS_RUNNING  = "running";
const STATUS_PAUSED   = "paused";
const STATUS_FINISHED = "finished";

// ─── Utilidades ─────────────────────────────────────────────────────────────
function norm(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function has(text, keywords) {
  const n = norm(text);
  return keywords.some((kw) => n.includes(norm(kw)));
}

function fmt(n, d = 0) {
  const p = Number(n);
  if (!Number.isFinite(p)) return "—";
  return p.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function pct(n) {
  if (!Number.isFinite(Number(n))) return "—%";
  return `${Number(n).toFixed(1)}%`;
}

function timeAgo(date) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 2) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)} día(s)`;
}

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSnap() {
  const state = getWarehouseState();
  const boards      = Array.isArray(state.controlBoards)    ? state.controlBoards    : [];
  const users       = Array.isArray(state.users)             ? state.users            : [];
  const inventory   = Array.isArray(state.inventoryItems)    ? state.inventoryItems   : [];
  const incidencias = Array.isArray(state.incidencias)       ? state.incidencias      : [];
  const catalog     = Array.isArray(state.catalog)           ? state.catalog          : [];
  const weekHistory = Array.isArray(state.boardWeekHistory)  ? state.boardWeekHistory : [];

  const allRows = boards.flatMap((b) =>
    (Array.isArray(b.rows) ? b.rows : []).map((row) => ({
      ...row,
      _boardName: b.name,
      _boardId: b.id,
      _area: b.settings?.area || b.area || "",
    }))
  );

  return { state, boards, users, inventory, incidencias, catalog, weekHistory, allRows };
}

// ─── Clasificador de intención ────────────────────────────────────────────────
function classifyIntent(msg) {
  const t = norm(msg);

  if (has(t, ["hola", "buenos dias", "buenas tardes", "buenas noches", "que tal", "como estas", "hey", "ola"])) return "greeting";
  if (has(t, ["ayuda", "que puedes", "que sabes", "funciones", "comandos", "capacidades", "que haces", "para que sirves"])) return "help";

  if (has(t, ["sin stock", "stock cero", "agotado", "sin existencia", "agotados"])) return "no_stock";
  if (has(t, ["stock bajo", "bajo stock", "bajo minimo", "alerta stock", "poco stock", "escaso"])) return "low_stock";
  if (has(t, ["inventario", "stock", "productos", "articulos", "items", "insumo", "existencia", "mercancia"])) return "inventory";

  if (has(t, ["detalle", "detallado", "completo", "fila", "filas", "mostrar filas"]) &&
      has(t, ["tablero", "board", "proceso", "actividad", "informe", "reporte"])) return "boards_detail";

  if (has(t, ["pausado", "pausada", "detenido", "bloqueado", "en espera", "pausa"])) return "boards_paused";
  if (has(t, ["tablero", "tableros", "board", "proceso", "actividades"])) return "boards_status";

  if (has(t, ["usuario", "player", "players", "equipo", "quien", "personal", "operador", "team", "gente"])) return "users";
  if (has(t, ["incidencia", "problema", "falla", "issue", "novedad"])) return "incidencias";
  if (has(t, ["reporte", "resumen", "informe", "panorama", "estado general", "como vamos", "como estamos", "summary"])) return "report";
  if (has(t, ["cuello", "bottleneck", "lento", "retrasado", "demora", "tarda"])) return "bottleneck";
  if (has(t, ["prediccion", "prevenir", "riesgo", "anticipa", "alerta", "futuro", "que puede pasar"])) return "prediction";
  if (has(t, ["auditoria", "cumplimiento", "normativa", "calidad", "revision"])) return "audit";
  if (has(t, ["catalogo", "frecuencia", "tarea programada", "actividad programada"])) return "catalog";

  return "unknown";
}

// ─── Handlers conversacionales ───────────────────────────────────────────────

function handleGreeting(snap, user) {
  const hour   = new Date().getHours();
  const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const nombre = user?.name ? `, ${user.name.split(" ")[0]}` : "";

  const running   = snap.allRows.filter((r) => r.status === STATUS_RUNNING).length;
  const paused    = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;
  const openInc   = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta").length;
  const lowStock  = snap.inventory.filter((i) => Number(i.stockUnits||0) <= Number(i.minStockUnits||0) && Number(i.minStockUnits||0) > 0).length;

  const estado = [];
  if (running > 0)  estado.push(`${running} proceso(s) activo(s)`);
  if (paused  > 0)  estado.push(`**⚠️ ${paused} pausado(s) que necesitan atención**`);
  else              estado.push("sin pausas activas");
  if (openInc > 0)  estado.push(`**🔴 ${openInc} incidencia(s) abierta(s)**`);
  if (lowStock > 0) estado.push(`**📦 ${lowStock} artículo(s) con stock bajo**`);

  const intro = randomOf([
    `${saludo}${nombre}! Aquí el Cerebro Operativo de COPMEC. En este momento: ${estado.join(", ")}.`,
    `${saludo}${nombre}! Listo para ayudarte. Resumen rápido: ${estado.join(", ")}.`,
    `${saludo}${nombre}! Monitoreando el sistema. Estado actual: ${estado.join(", ")}.`,
  ]);

  return `${intro}\n\n¿Qué necesitas? Puedes preguntarme sobre tableros, inventario, equipo, incidencias o pedirme un reporte completo.`;
}

function handleHelp() {
  return `Claro, te cuento qué puedo hacer por ti:\n\n**📊 Reportes y estado**\n- *"dame un resumen"* → Panorama completo del sistema\n- *"estado de los tableros"* → Ver todos los tableros con su actividad\n- *"informe detallado de los tableros"* → Ver cada tablero con sus filas y estados\n\n**📦 Inventario**\n- *"qué tenemos en inventario"* → Resumen por categoría\n- *"qué está con stock bajo"* → Solo los artículos críticos\n- *"qué está agotado"* → Artículos con cero existencia\n\n**⏸️ Procesos**\n- *"qué está pausado"* → Procesos detenidos con detalle\n- *"hay cuellos de botella"* → Detectar tableros con flujo bloqueado\n\n**👥 Equipo**\n- *"cómo está el equipo"* → Usuarios activos y roles\n\n**⚠️ Incidencias**\n- *"qué incidencias hay"* → Las que siguen abiertas\n\n**🔮 Análisis**\n- *"qué riesgos hay"* → Alertas preventivas basadas en el estado actual\n\nTambién puedes mencionar el nombre de un tablero o artículo específico y te doy el detalle.`;
}

function handleInventoryNoStock(snap) {
  const zero = snap.inventory.filter((i) => Number(i.stockUnits || 0) === 0);
  if (zero.length === 0) return `Buenas noticias: no hay ningún artículo completamente agotado en este momento. Todos tienen al menos algo de existencia.`;

  const lines = [`Encontré **${zero.length} artículo(s) completamente agotados** — sin ninguna unidad disponible:\n`];
  zero.slice(0, 15).forEach((item) => {
    lines.push(`- **${item.name}** *(${item.code || item.id})* — Mínimo requerido: ${fmt(item.minStockUnits)} ${item.unitLabel || "uds"}`);
  });
  if (zero.length > 15) lines.push(`- *...y ${zero.length - 15} más*`);
  lines.push(`\nEsto es urgente. Gestiona el reabastecimiento desde **Inventario > Movimientos** lo antes posible.`);
  return lines.join("\n");
}

function handleLowStock(snap) {
  const low = snap.inventory.filter((i) => {
    const s = Number(i.stockUnits || 0); const m = Number(i.minStockUnits || 0);
    return m > 0 && s <= m;
  });
  if (low.length === 0) return `Todo bien con el inventario. Ningún artículo está por debajo de su mínimo. Hay ${snap.inventory.length} artículos monitoreados en total.`;

  const zero     = low.filter((i) => Number(i.stockUnits||0) === 0);
  const critical = low.filter((i) => { const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0); return s > 0 && s <= m * 0.5; });
  const warning  = low.filter((i) => { const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0); return s > m * 0.5 && s <= m; });

  const lines = [`Revisé el inventario y encontré **${low.length} artículo(s) con stock bajo**:\n`];
  if (zero.length > 0) {
    lines.push(`**🔴 Sin existencia (${zero.length}):**`);
    zero.slice(0, 6).forEach((i) => lines.push(`- **${i.name}** — 0 unidades (mín. ${fmt(i.minStockUnits)} ${i.unitLabel || "uds"})`));
    lines.push("");
  }
  if (critical.length > 0) {
    lines.push(`**🟠 Crítico — menos del 50% del mínimo (${critical.length}):**`);
    critical.slice(0, 6).forEach((i) => { const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0); lines.push(`- **${i.name}** — ${fmt(s)} / ${fmt(m)} ${i.unitLabel || "uds"} (${pct((s/m)*100)})`); });
    lines.push("");
  }
  if (warning.length > 0) {
    lines.push(`**🟡 Atención — entre 50%–100% del mínimo (${warning.length}):**`);
    warning.slice(0, 6).forEach((i) => { const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0); lines.push(`- **${i.name}** — ${fmt(s)} / ${fmt(m)} ${i.unitLabel || "uds"}`); });
  }
  lines.push(`\n💡 Gestiona el reabastecimiento desde **Inventario > Movimientos**.`);
  return lines.join("\n");
}

function handleInventory(snap) {
  if (snap.inventory.length === 0) return `El inventario está vacío — no se han registrado artículos todavía.`;

  const domains = {};
  snap.inventory.forEach((i) => {
    const d = i.domain || "base";
    if (!domains[d]) domains[d] = { total: 0, low: 0, zero: 0 };
    domains[d].total++;
    const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0);
    if (s === 0) domains[d].zero++;
    else if (m > 0 && s <= m) domains[d].low++;
  });

  const lowTotal  = snap.inventory.filter((i) => Number(i.stockUnits||0) <= Number(i.minStockUnits||0) && Number(i.minStockUnits||0) > 0).length;
  const zeroTotal = snap.inventory.filter((i) => Number(i.stockUnits||0) === 0).length;
  const domainLabel = { base: "Productos base", cleaning: "Insumos de limpieza", orders: "Insumos de pedidos" };

  const lines = [`Aquí tienes el inventario con sus **${snap.inventory.length} artículos**:\n`,
    `| Categoría | Total | Con alerta | Agotados |`,
    `|-----------|-------|------------|----------|`];

  Object.entries(domains).forEach(([key, d]) => {
    lines.push(`| ${domainLabel[key] || key} | ${d.total} | ${d.low} | ${d.zero} |`);
  });

  lines.push("");
  if (zeroTotal > 0)       lines.push(`🔴 **${zeroTotal} artículo(s) agotados** — urgente. Escríbeme *"agotados"* para el detalle.`);
  else if (lowTotal > 0)   lines.push(`🟡 **${lowTotal} artículo(s) bajo el mínimo.** Escríbeme *"stock bajo"* para ver cuáles.`);
  else                     lines.push(`✅ Todo el inventario está en niveles saludables.`);

  return lines.join("\n");
}

function handleBoardsDetail(snap, msg) {
  if (snap.boards.length === 0) return `No hay tableros creados todavía.`;

  const msgNorm = norm(msg);
  const specificBoard = snap.boards.find((b) => msgNorm.includes(norm(b.name)));
  const boardsToShow  = specificBoard ? [specificBoard] : snap.boards;
  const intro = specificBoard
    ? `Aquí el detalle completo del tablero **${specificBoard.name}**:\n`
    : `Te muestro el detalle de todos los tableros, fila por fila:\n`;

  const lines = [intro];

  boardsToShow.forEach((board) => {
    const rows     = Array.isArray(board.rows) ? board.rows : [];
    const area     = board.settings?.area || board.area || "sin área";
    const running  = rows.filter((r) => r.status === STATUS_RUNNING).length;
    const paused   = rows.filter((r) => r.status === STATUS_PAUSED).length;
    const finished = rows.filter((r) => r.status === STATUS_FINISHED).length;

    lines.push(`---`);
    lines.push(`**📋 ${board.name}** *(${area})* — ${rows.length} filas · ${running} en curso · ${paused} pausadas · ${finished} terminadas`);

    if (rows.length === 0) {
      lines.push(`*(Sin filas registradas aún)*`);
    } else {
      lines.push(`\n| # | SKU / Producto | Estado | Inicio | Pausa |`);
      lines.push(`|---|----------------|--------|--------|-------|`);
      rows.slice(0, 30).forEach((row, idx) => {
        const statusLabel = {
          [STATUS_RUNNING]:  "▶️ En curso",
          [STATUS_PAUSED]:   "⏸️ Pausada",
          [STATUS_FINISHED]: "✅ Terminada",
          [STATUS_PENDING]:  "⏳ Pendiente",
        }[row.status] || row.status || "—";
        const sku     = row.sku || row.product || row.name || row.label || `Fila ${idx+1}`;
        const started = row.startedAt ? timeAgo(row.startedAt) : "—";
        const pausedA = row.pausedAt  ? timeAgo(row.pausedAt)  : "—";
        lines.push(`| ${idx+1} | ${sku} | ${statusLabel} | ${started} | ${row.pausedAt ? pausedA : "—"} |`);
      });
      if (rows.length > 30) lines.push(`*...y ${rows.length - 30} filas más*`);
    }
    lines.push("");
  });

  const totalPaused = boardsToShow.flatMap((b) => b.rows || []).filter((r) => r.status === STATUS_PAUSED).length;
  if (totalPaused > 0) lines.push(`⚠️ Hay **${totalPaused} fila(s) pausada(s)**. Revísalas en el tablero para reanudar o cerrar.`);

  return lines.join("\n");
}

function handleBoardsStatus(snap, msg) {
  if (snap.boards.length === 0) return `No hay tableros creados todavía. Puedes crearlos desde la sección *Creador de tableros*.`;

  if (has(norm(msg), ["detalle", "detallado", "completo", "todo", "informe", "reporte", "fila", "filas"])) {
    return handleBoardsDetail(snap, msg);
  }

  const lines = [`Tienes **${snap.boards.length} tablero(s)** en el sistema. Estado actual:\n`];

  snap.boards.forEach((board) => {
    const rows     = Array.isArray(board.rows) ? board.rows : [];
    const running  = rows.filter((r) => r.status === STATUS_RUNNING).length;
    const paused   = rows.filter((r) => r.status === STATUS_PAUSED).length;
    const finished = rows.filter((r) => r.status === STATUS_FINISHED).length;
    const pending  = rows.filter((r) => r.status === STATUS_PENDING).length;
    const area     = board.settings?.area || board.area || "sin área";
    const issues   = paused > 0 ? ` ⚠️ ${paused} pausado(s)` : "";
    lines.push(`**📋 ${board.name}** *(${area})*`);
    lines.push(`  - ${rows.length} filas: ${running} en curso · ${paused} pausadas · ${finished} terminadas · ${pending} pendientes${issues}`);
  });

  const totalPaused = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;
  if (totalPaused > 0) lines.push(`\n⚠️ **${totalPaused} proceso(s) pausado(s)** en total. Escríbeme *"qué está pausado"* para el detalle.`);
  else                 lines.push(`\n✅ Sin pausas activas. Todo fluye bien.`);
  lines.push(`\n¿Quieres el detalle de un tablero específico? Dime el nombre.`);
  return lines.join("\n");
}

function handlePausedBoards(snap) {
  const paused = snap.allRows.filter((r) => r.status === STATUS_PAUSED);
  if (paused.length === 0) return `No hay ningún proceso pausado ahora mismo. Todo está corriendo sin interrupciones.`;

  const byBoard = new Map();
  paused.forEach((row) => {
    const key = row._boardName || "Tablero sin nombre";
    if (!byBoard.has(key)) byBoard.set(key, []);
    byBoard.get(key).push(row);
  });

  const lines = [`Hay **${paused.length} proceso(s) pausado(s)** que necesitan atención:\n`];
  byBoard.forEach((rows, boardName) => {
    lines.push(`**📋 ${boardName}** — ${rows.length} pausado(s)`);
    rows.slice(0, 8).forEach((row) => {
      const sku    = row.sku || row.product || row.name || row.label || "(sin nombre)";
      const since  = row.pausedAt ? ` — pausado ${timeAgo(row.pausedAt)}` : "";
      const reason = row.pauseReason ? ` · Motivo: *"${row.pauseReason}"*` : "";
      lines.push(`  - **${sku}**${since}${reason}`);
    });
    if (rows.length > 8) lines.push(`  - *...y ${rows.length - 8} más*`);
    lines.push("");
  });
  lines.push(`💡 Entra al tablero correspondiente y decide si reanudas o cierras cada proceso.`);
  return lines.join("\n");
}

function handleUsers(snap) {
  if (snap.users.length === 0) return `No hay usuarios registrados todavía.`;

  const active   = snap.users.filter((u) => u.isActive !== false);
  const inactive = snap.users.filter((u) => u.isActive === false);
  const byRole   = {};
  active.forEach((u) => { const r = u.role || "sin_rol"; if (!byRole[r]) byRole[r] = []; byRole[r].push(u); });
  const roleLabel = { lead: "Lead", sr: "SR", ssr: "SSR", jr: "JR" };

  const lines = [`El equipo tiene **${active.length} usuario(s) activo(s)** y ${inactive.length} inactivo(s).\n`];
  Object.entries(byRole).forEach(([role, list]) => {
    lines.push(`**${roleLabel[role] || role}** (${list.length}):`);
    list.forEach((u) => { const dept = u.area || u.department ? ` · ${u.area || u.department}` : ""; lines.push(`  - ${u.name}${dept}`); });
    lines.push("");
  });
  if (inactive.length > 0) lines.push(`*Inactivos: ${inactive.map((u) => u.name).slice(0,5).join(", ")}${inactive.length > 5 ? "..." : ""}*`);
  return lines.join("\n");
}

function handleIncidencias(snap) {
  if (snap.incidencias.length === 0) return `No hay incidencias registradas en el sistema. Todo tranquilo por ese lado.`;

  const open   = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta");
  const closed = snap.incidencias.filter((i) => i.status === "cerrada"  || i.status === "resuelta");

  if (open.length === 0) return `Todas las incidencias están cerradas. Se han registrado ${snap.incidencias.length} en total. Buen trabajo de seguimiento.`;

  const lines = [`Hay **${open.length} incidencia(s) abierta(s)** de ${snap.incidencias.length} registradas:\n`];
  open.slice(0, 10).forEach((inc) => {
    const fecha  = inc.createdAt ? new Date(inc.createdAt).toLocaleDateString("es-MX") : "—";
    const titulo = inc.title || inc.descripcion || "Sin título";
    const prio   = inc.priority || inc.severidad ? ` *(${inc.priority || inc.severidad})*` : "";
    const status = inc.status ? ` — *${inc.status}*` : "";
    lines.push(`- [${fecha}] **${titulo}**${prio}${status}`);
  });
  if (open.length > 10)   lines.push(`- *...y ${open.length - 10} más*`);
  if (closed.length > 0)  lines.push(`\n*${closed.length} incidencia(s) cerrada(s) en historial.*`);
  lines.push(`\n¿Quieres más detalle de alguna?`);
  return lines.join("\n");
}

function handleReport(snap) {
  const now      = new Date();
  const running  = snap.allRows.filter((r) => r.status === STATUS_RUNNING).length;
  const paused   = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;
  const finished = snap.allRows.filter((r) => r.status === STATUS_FINISHED).length;
  const pending  = snap.allRows.filter((r) => r.status === STATUS_PENDING).length;
  const total    = snap.allRows.length;
  const closePct = total > 0 ? ((finished / total) * 100).toFixed(1) : "0.0";

  const lowStock  = snap.inventory.filter((i) => Number(i.stockUnits||0) <= Number(i.minStockUnits||0) && Number(i.minStockUnits||0) > 0).length;
  const zeroStock = snap.inventory.filter((i) => Number(i.stockUnits||0) === 0).length;
  const openInc   = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta").length;
  const activeU   = snap.users.filter((u) => u.isActive !== false).length;

  const issues = [];
  const goods  = [];
  if (paused > 0)    issues.push(`**${paused} proceso(s) pausado(s)**`);
  else               goods.push("flujo sin interrupciones");
  if (zeroStock > 0) issues.push(`**${zeroStock} artículo(s) agotado(s)**`);
  if (lowStock > 0)  issues.push(`**${lowStock} artículo(s) bajo el mínimo**`);
  else if (!zeroStock) goods.push("inventario saludable");
  if (openInc > 0)   issues.push(`**${openInc} incidencia(s) abierta(s)**`);
  else               goods.push("sin incidencias pendientes");

  const diagnostico = issues.length > 0
    ? `Hay puntos de atención: ${issues.join(", ")}.`
    : `El sistema opera sin alertas. ${goods.join(", ")}.`;

  const lines = [
    `**REPORTE GENERAL — ${now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}**\n`,
    diagnostico, "",
    `**🏭 Producción**`,
    `- ${snap.boards.length} tablero(s) en el sistema`,
    `- ${total} fila(s): ${running} en curso · ${paused} pausadas · ${finished} terminadas · ${pending} pendientes`,
    `- Tasa de cierre: **${closePct}%**`, "",
    `**📦 Inventario** (${snap.inventory.length} artículos)`,
    zeroStock > 0 ? `- 🔴 ${zeroStock} agotado(s)` : `- ✅ Sin agotados`,
    lowStock  > 0 ? `- 🟡 ${lowStock} bajo el mínimo` : `- ✅ Todos sobre el mínimo`, "",
    `**👥 Equipo** — ${activeU} de ${snap.users.length} activos`, "",
    `**⚠️ Incidencias**`,
    openInc > 0 ? `- 🔴 ${openInc} abierta(s)` : `- ✅ Sin pendientes`,
  ];

  if (issues.length > 0) {
    lines.push(`\n**¿Qué hacer?**`);
    if (paused > 0)    lines.push(`- Revisa los pausados: *"qué está pausado"*`);
    if (zeroStock > 0) lines.push(`- Reabastecimiento urgente: *"agotados"*`);
    if (lowStock > 0)  lines.push(`- Atiende el stock: *"stock bajo"*`);
    if (openInc > 0)   lines.push(`- Cierra incidencias: *"incidencias"*`);
  }

  return lines.join("\n");
}

function handleBottleneck(snap) {
  const metrics = snap.boards.map((board) => {
    const rows     = Array.isArray(board.rows) ? board.rows : [];
    const paused   = rows.filter((r) => r.status === STATUS_PAUSED).length;
    const running  = rows.filter((r) => r.status === STATUS_RUNNING).length;
    const finished = rows.filter((r) => r.status === STATUS_FINISHED).length;
    const total    = rows.length;
    return { name: board.name, area: board.settings?.area || "—", total, paused, running, finished, pauseRate: total > 0 ? paused/total : 0 };
  }).filter((m) => m.total > 0).sort((a, b) => b.pauseRate - a.pauseRate);

  if (metrics.length === 0) return `No hay datos suficientes para detectar cuellos de botella. Los tableros no tienen filas registradas.`;

  const problematic = metrics.filter((m) => m.pauseRate > 0.25);
  const lines = [];

  if (problematic.length === 0) {
    lines.push(`No detecto cuellos de botella significativos. El flujo operativo se ve bien.\n`);
  } else {
    lines.push(`Detecté **${problematic.length} tablero(s) con flujo bloqueado** (más del 25% de sus procesos pausados):\n`);
    problematic.forEach((m) => {
      lines.push(`- **${m.name}** *(${m.area})* — ${pct(m.pauseRate * 100)} pausado (${m.paused} de ${m.total} filas)`);
    });
    lines.push(`\nEsto bloquea el flujo. Te recomiendo revisarlos con *"qué está pausado"*.\n`);
  }

  lines.push(`**Ranking de tableros:**\n`);
  lines.push(`| Tablero | Área | Pausados | Total | % Pausa |`);
  lines.push(`|---------|------|----------|-------|---------|`);
  metrics.forEach((m) => {
    const flag = m.pauseRate > 0.5 ? " 🔴" : m.pauseRate > 0.25 ? " 🟡" : "";
    lines.push(`| ${m.name}${flag} | ${m.area} | ${m.paused} | ${m.total} | ${pct(m.pauseRate * 100)} |`);
  });

  return lines.join("\n");
}

function handlePrediction(snap) {
  const alerts = [];

  const stockRisk = snap.inventory.filter((i) => { const s = Number(i.stockUnits||0); const m = Number(i.minStockUnits||0); return m > 0 && s <= m * 0.5; });
  if (stockRisk.length > 0) alerts.push({ level: "🔴 ALTA", titulo: `Riesgo de desabasto — ${stockRisk.length} artículo(s)`, detalle: stockRisk.slice(0,3).map((i) => i.name).join(", ") + (stockRisk.length > 3 ? `... y ${stockRisk.length-3} más` : ""), accion: "Gestiona reabastecimiento en Inventario de inmediato" });

  const stuckBoards = snap.boards.filter((b) => { const rows = b.rows||[]; return rows.length > 0 && rows.filter((r) => r.status === STATUS_PAUSED).length / rows.length > 0.5; });
  if (stuckBoards.length > 0) alerts.push({ level: "🟡 MEDIA", titulo: `Procesos estancados — ${stuckBoards.length} tablero(s)`, detalle: stuckBoards.map((b) => b.name).join(", "), accion: "Revisa y reanuda los procesos pausados" });

  const oldInc = snap.incidencias.filter((i) => { if (i.status === "cerrada" || i.status === "resuelta") return false; return i.createdAt && (Date.now() - new Date(i.createdAt).getTime()) > 3*86400000; });
  if (oldInc.length > 0) alerts.push({ level: "🟡 MEDIA", titulo: `Incidencias sin resolver >3 días — ${oldInc.length}`, detalle: oldInc.slice(0,2).map((i) => i.title||"Sin título").join(", "), accion: "Dar seguimiento y cerrar incidencias pendientes" });

  if (alerts.length === 0) return `No detecto riesgos operativos inminentes. Sin stock crítico, sin procesos muy estancados, sin incidencias antiguas. El sistema está bien.`;

  const lines = [`Analicé el sistema y encontré **${alerts.length} alerta(s) preventiva(s)**:\n`];
  alerts.forEach((a) => {
    lines.push(`**${a.level} — ${a.titulo}**`);
    if (a.detalle) lines.push(`*Afecta: ${a.detalle}*`);
    lines.push(`💡 ${a.accion}`);
    lines.push("");
  });
  lines.push(`¿Profundizo en alguno?`);
  return lines.join("\n");
}

function handleAudit(snap) {
  const total    = snap.allRows.length;
  const finished = snap.allRows.filter((r) => r.status === STATUS_FINISHED).length;
  const paused   = snap.allRows.filter((r) => r.status === STATUS_PAUSED).length;
  const closePct = total > 0 ? (finished/total*100).toFixed(1) : "0.0";
  const lowStock = snap.inventory.filter((i) => Number(i.stockUnits||0) < Number(i.minStockUnits||0) && Number(i.minStockUnits||0)>0).length;
  const openInc  = snap.incidencias.filter((i) => i.status !== "cerrada" && i.status !== "resuelta").length;
  const cumple   = Number(closePct) >= 85;

  const lines = [
    `**CUMPLIMIENTO OPERATIVO**\n`,
    `- Tasa de cierre: **${closePct}%** ${cumple ? "✅ *(≥85% — cumple)*" : "⚠️ *(por debajo de 85%)*"}`,
    `- Procesos pausados: ${paused > 0 ? `⚠️ ${paused}` : "✅ Ninguno"}`,
    `- Inventario bajo mínimos: ${lowStock > 0 ? `⚠️ ${lowStock} artículo(s)` : "✅ Dentro de mínimos"}`,
    `- Incidencias abiertas: ${openInc > 0 ? `🔴 ${openInc}` : "✅ Sin pendientes"}`, "",
    cumple && openInc === 0 && lowStock === 0
      ? `Los indicadores muestran buen cumplimiento operativo. Sigan así.`
      : `Hay áreas de mejora. Prioriza cerrar pausas y atender alertas de inventario.`,
    `\n*Para reporte formal: sección **Auditorías** del sistema.*`,
  ];
  return lines.join("\n");
}

function handleCatalog(snap) {
  if (snap.catalog.length === 0) return `El catálogo está vacío. Configúralo desde *Creador de tableros > Catálogo de actividades*.`;

  const byFreq = {};
  snap.catalog.forEach((item) => { const f = item.frequency||"Sin frecuencia"; if (!byFreq[f]) byFreq[f]=[]; byFreq[f].push(item.name||item.label||"Sin nombre"); });

  const lines = [`El catálogo tiene **${snap.catalog.length} actividad(es)**:\n`];
  Object.entries(byFreq).forEach(([freq, names]) => {
    lines.push(`**${freq}** (${names.length}):`);
    names.slice(0,6).forEach((n) => lines.push(`  - ${n}`));
    if (names.length > 6) lines.push(`  - *...y ${names.length-6} más*`);
    lines.push("");
  });
  return lines.join("\n");
}

function handleUnknown(snap, msg) {
  const t = norm(msg);

  // Tablero específico mencionado
  const board = snap.boards.find((b) => t.includes(norm(b.name)));
  if (board) return handleBoardsDetail(snap, msg);

  // Artículo específico mencionado
  const item = snap.inventory.find((i) => t.includes(norm(i.name)) || (i.code && t.includes(norm(i.code))));
  if (item) {
    const s = Number(item.stockUnits||0); const m = Number(item.minStockUnits||0);
    const status = s === 0 ? "🔴 Agotado" : (m > 0 && s <= m ? "🟡 Bajo mínimo" : "✅ En stock");
    return `Encontré **${item.name}** *(${item.code||item.id})*:\n\n- Stock actual: **${fmt(s)} ${item.unitLabel||"uds"}**\n- Mínimo requerido: **${fmt(m)} ${item.unitLabel||"uds"}**\n- Estado: **${status}**${item.domain ? `\n- Categoría: *${item.domain}*` : ""}`;
  }

  return `No entendí bien tu pregunta: *"${msg.slice(0,80)}${msg.length>80?"...":""}"*\n\nPuedes preguntarme:\n- *"cómo están los tableros"*\n- *"informe detallado de tableros"*\n- *"qué tenemos en stock"*\n- *"qué está pausado"*\n- *"dame un resumen"*\n\nEscríbeme **"ayuda"** para ver todo lo que puedo hacer.`;
}

// ─── Punto de entrada ─────────────────────────────────────────────────────────

export function processCopmecAIMessage(auth, message) {
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return { ok: false, message: "Mensaje vacío." };
  }

  const user    = auth?.userId ? findWarehouseUserById(auth.userId) : null;
  const snap    = buildSnap();
  const trimmed = message.trim();
  const intent  = classifyIntent(trimmed);

  const handlers = {
    greeting:     () => handleGreeting(snap, user),
    help:         () => handleHelp(),
    no_stock:     () => handleInventoryNoStock(snap),
    low_stock:    () => handleLowStock(snap),
    inventory:    () => handleInventory(snap),
    boards_status:() => handleBoardsStatus(snap, trimmed),
    boards_detail:() => handleBoardsDetail(snap, trimmed),
    boards_paused:() => handlePausedBoards(snap),
    users:        () => handleUsers(snap),
    incidencias:  () => handleIncidencias(snap),
    report:       () => handleReport(snap),
    bottleneck:   () => handleBottleneck(snap),
    prediction:   () => handlePrediction(snap),
    audit:        () => handleAudit(snap),
    catalog:      () => handleCatalog(snap),
    unknown:      () => handleUnknown(snap, trimmed),
  };

  const handler  = handlers[intent] || handlers.unknown;
  const response = handler();

  return { ok: true, response, intent };
}
