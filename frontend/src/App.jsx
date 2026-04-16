/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  CalendarDays,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  Gauge,
  LayoutDashboard,
  Menu,
  OctagonAlert,
  Package,
  Pause,
  PauseCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  PieChart,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Square,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  X,
  Users,
  Zap,
} from "lucide-react";
import { Modal } from "./components/Modal";
import { BoardBuilderModal, BoardComponentStudioModal } from "./components/ModalesConstructorTableros";
import GestionInventario from "./paginas/GestionInventario";
import GestionUsuarios from "./paginas/GestionUsuarios";
import HistorialSemanas from "./paginas/HistorialSemanas";
import MisTableros from "./paginas/MisTableros";
import PaginaNoEncontrada from "./paginas/PaginaNoEncontrada";
import PanelIndicadores from "./paginas/PanelIndicadores";
import TablerosCreados from "./paginas/TablerosCreados";
import copmecLogo from "./assets/copmec-logo.jpeg";
import "./App.css";

const STORAGE_KEY = "sicfla.almacen.state.v1";
const SIDEBAR_COLLAPSED_KEY = "sicfla.almacen.sidebarCollapsed.v1";
const DASHBOARD_SECTIONS_KEY = "sicfla.almacen.dashboardSections.v1";
const NOTIFICATION_READ_KEY = "sicfla.almacen.notifications.read.v1";
const NOTIFICATION_DELETED_KEY = "sicfla.almacen.notifications.deleted.v1";
const NOTIFICATION_INBOX_KEY = "sicfla.almacen.notifications.inbox.v1";
const EMPTY_OBJECT = Object.freeze({});
const BOOTSTRAP_MASTER_ID = "bootstrap-master";
const MASTER_USERNAME = "Maestro";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";
const ENABLE_LEGACY_WHOLE_STATE_SYNC = false;
const PAGE_BOARD = "index";
const PAGE_CUSTOM_BOARDS = "customBoards";
const PAGE_ADMIN = "admin";
const PAGE_DASHBOARD = "dashboard";
const PAGE_HISTORY = "history";
const PAGE_INVENTORY = "inventory";
const PAGE_USERS = "users";
const PAGE_NOT_FOUND = "404";

const PAGE_ROUTE_SLUGS = {
  [PAGE_DASHBOARD]: "dashboard",
  [PAGE_CUSTOM_BOARDS]: "mis-tableros",
  [PAGE_BOARD]: "creador-de-tableros",
  [PAGE_ADMIN]: "creador-de-tableros",
  [PAGE_HISTORY]: "historial",
  [PAGE_INVENTORY]: "inventario",
  [PAGE_USERS]: "administrador",
  [PAGE_NOT_FOUND]: "404",
};

const PAGE_ROUTE_ALIASES = {
  dashboard: PAGE_DASHBOARD,
  [PAGE_DASHBOARD]: PAGE_DASHBOARD,
  "mis-tableros": PAGE_CUSTOM_BOARDS,
  [PAGE_CUSTOM_BOARDS]: PAGE_CUSTOM_BOARDS,
  "creador-de-tableros": PAGE_BOARD,
  "tableros-creados": PAGE_BOARD,
  [PAGE_BOARD]: PAGE_BOARD,
  constructor: PAGE_BOARD,
  [PAGE_ADMIN]: PAGE_BOARD,
  historial: PAGE_HISTORY,
  [PAGE_HISTORY]: PAGE_HISTORY,
  inventario: PAGE_INVENTORY,
  [PAGE_INVENTORY]: PAGE_INVENTORY,
  administrador: PAGE_USERS,
  [PAGE_USERS]: PAGE_USERS,
  [PAGE_NOT_FOUND]: PAGE_NOT_FOUND,
};

const EMPTY_LOGIN_DIRECTORY = {
  system: {
    masterBootstrapEnabled: false,
    masterUsername: null,
    showBootstrapMasterHint: false,
  },
  demoUsers: [],
};

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";
const ROLE_SSR = "Semi-Senior (Ssr)";
const ROLE_JR = "Junior (Jr)";

const STATUS_PENDING = "Pendiente";
const STATUS_RUNNING = "En curso";
const STATUS_PAUSED = "Pausado";
const STATUS_FINISHED = "Terminado";
const INVENTORY_DOMAIN_BASE = "base";
const INVENTORY_DOMAIN_CLEANING = "cleaning";
const INVENTORY_DOMAIN_ORDERS = "orders";
const INVENTORY_MOVEMENT_RESTOCK = "restock";
const INVENTORY_MOVEMENT_CONSUME = "consume";
const INVENTORY_MOVEMENT_TRANSFER = "transfer";

const CONTROL_STATUS_OPTIONS = ["Pendiente", "En curso", "Completado", "Bloqueado"];
const USER_ROLES = [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR];
const PERMISSION_SCHEMA_VERSION = 2;
const ROLE_LEVEL = {
  [ROLE_JR]: 1,
  [ROLE_SSR]: 2,
  [ROLE_SR]: 3,
  [ROLE_LEAD]: 4,
};
const TEMPORARY_PASSWORD_MIN_LENGTH = 4;
const PROFILE_SELF_EDIT_LIMIT = 1;
const DEFAULT_AREA_OPTIONS = ["ESTO", "TRANSPORTE", "REGULATORIO", "CALIDAD", "INVENTARIO", "PEDIDOS", "RETAIL"];
const DEFAULT_BOARD_SECTION_OPTIONS = [
  "General",
  "Base",
  "Captura",
  "Producto",
  "Inventario",
  "Operación",
  "Control",
  "Validación",
  "Calidad",
  "Seguimiento",
  "Tiempos",
  "Logística",
  "Evidencia",
  "Observaciones",
  "Autorización",
  "Cierre",
];
const INVENTORY_LOOKUP_LOGISTICS_FIELD = "inventoryLookupLogistics";
const BOARD_ACTIVITY_LIST_FIELD = "activityList";
const DEFAULT_JOB_TITLE_BY_ROLE = {
  [ROLE_LEAD]: "Encargado de área",
  [ROLE_SR]: "Supervisor senior",
  [ROLE_SSR]: "Coordinador de operación",
  [ROLE_JR]: "Player operativo",
};
const DASHBOARD_CHART_PALETTE = ["#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];
const DEFAULT_DASHBOARD_SECTION_STATE = {
  executive: true,
  people: true,
  trends: false,
  causes: false,
  alerts: false,
};
const DEFAULT_ADMIN_TAB = "catalog";
const ACTIVITY_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "every2days", label: "Cada 2 días" },
  { value: "every3days", label: "Cada 3 días" },
  { value: "weekdays", label: "Lunes a viernes" },
  { value: "twiceWeek", label: "2 veces por semana" },
  { value: "threeTimesWeek", label: "3 veces por semana" },
  { value: "fourTimesWeek", label: "4 veces por semana" },
  { value: "fiveTimesWeek", label: "5 veces por semana" },
  { value: "sixTimesWeek", label: "6 veces por semana" },
  { value: "weekly", label: "Semanal" },
];
const ACTIVITY_FREQUENCY_LABELS = Object.fromEntries(ACTIVITY_FREQUENCY_OPTIONS.map((item) => [item.value, item.label]));
const ACTIVITY_FREQUENCY_DAY_OFFSETS = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  every2days: [0, 2, 4, 6],
  every3days: [0, 3, 6],
  weekdays: [0, 1, 2, 3, 4],
  twiceWeek: [0, 3],
  threeTimesWeek: [0, 2, 4],
  fourTimesWeek: [0, 1, 3, 5],
  fiveTimesWeek: [0, 1, 2, 3, 4],
  sixTimesWeek: [0, 1, 2, 3, 4, 5],
  weekly: [0],
};

function getInitialRouteState() {
  const pathPage = String(globalThis.location.pathname.split("/").find(Boolean) || "").trim().toLowerCase();
  const params = new URLSearchParams(globalThis.location.search);
  const routePage = String(params.get("page") || "").trim();
  return {
    page: PAGE_ROUTE_ALIASES[pathPage] || PAGE_ROUTE_ALIASES[routePage] || PAGE_DASHBOARD,
    adminTab: normalizeAdminTab(params.get("tab") || DEFAULT_ADMIN_TAB),
    selectedBoardId: params.get("board") || "",
    selectedWeekId: params.get("week") || "",
    selectedHistoryWeekId: params.get("history") || "",
  };
}

const INITIAL_ROUTE_STATE = getInitialRouteState();

const BOARD_FIELD_TYPES = [
  { value: "text", label: "Texto libre" },
  { value: "email", label: "Correo electrónico" },
  { value: "phone", label: "Teléfono" },
  { value: "url", label: "Enlace / URL" },
  { value: "number", label: "Número medible" },
  { value: "currency", label: "Monto ($)" },
  { value: "percentage", label: "Porcentaje (%)" },
  { value: "time", label: "Hora" },
  { value: "inventoryLookup", label: "Buscador de inventario" },
  { value: INVENTORY_LOOKUP_LOGISTICS_FIELD, label: "Buscador de inventario + empaque" },
  { value: "inventoryProperty", label: "Dato derivado de inventario" },
  { value: BOARD_ACTIVITY_LIST_FIELD, label: "Lista de actividades" },
  { value: "select", label: "Menú desplegable" },
  { value: "formula", label: "Fórmula" },
  { value: "user", label: "Player" },
  { value: "status", label: "Estado" },
  { value: "date", label: "Fecha" },
  { value: "textarea", label: "Notas" },
  { value: "boolean", label: "Sí / No" },
];

const BOARD_FIELD_TYPE_DETAILS = {
  text: "Captura texto corto como SKU, folio o nombre interno.",
  email: "Guarda correos electrónicos con validación de formato.",
  phone: "Captura números telefónicos para contacto operativo.",
  url: "Guarda enlaces de referencia, evidencias o documentos.",
  number: "Guarda cantidades, cajas, piezas, pesos o métricas.",
  currency: "Registra montos monetarios para costos, gastos o ventas.",
  percentage: "Captura porcentajes como avance, merma o cumplimiento.",
  time: "Registra horas específicas dentro de la operación.",
  inventoryLookup: "Busca un artículo del inventario y lo vincula a la fila.",
  [INVENTORY_LOOKUP_LOGISTICS_FIELD]: "Duplica el buscador de inventario y agrega piezas por caja y cajas por tarima como campos editables.",
  inventoryProperty: "Trae un dato automático del inventario ya vinculado.",
  [BOARD_ACTIVITY_LIST_FIELD]: "Toma una lista de actividades y genera una fila por cada actividad dentro del tablero.",
  select: "Muestra un menú desplegable real con opciones manuales o conectadas a otros datos.",
  formula: "Calcula un resultado con otros campos del tablero.",
  user: "Asigna un player sin escribirlo manualmente.",
  status: "Controla el estado operativo de la fila.",
  date: "Guarda fechas clave como entrega, turno o corte.",
  textarea: "Sirve para observaciones o instrucciones más largas.",
  boolean: "Marca algo como Sí o No en un clic.",
};

const BOARD_FIELD_WIDTHS = [
  { value: "sm", label: "Compacto" },
  { value: "md", label: "Medio" },
  { value: "lg", label: "Amplio" },
];

const COLOR_RULE_OPERATORS = [
  { value: ">=", label: "Mayor o igual" },
  { value: "<=", label: "Menor o igual" },
  { value: ">", label: "Mayor" },
  { value: "<", label: "Menor" },
  { value: "equals", label: "Igual a" },
  { value: "notEquals", label: "Diferente de" },
  { value: "contains", label: "Contiene" },
  { value: "notContains", label: "No contiene" },
  { value: "startsWith", label: "Empieza con" },
  { value: "endsWith", label: "Termina con" },
  { value: "inList", label: "Está en lista" },
  { value: "notInList", label: "No está en lista" },
  { value: "isEmpty", label: "Está vacío" },
  { value: "isNotEmpty", label: "No está vacío" },
  { value: "isTrue", label: "Es verdadero / Sí" },
  { value: "isFalse", label: "Es falso / No" },
];

const BOARD_FIELD_WIDTH_STYLES = {
  sm: { minWidth: "120px" },
  md: { minWidth: "180px" },
  lg: { minWidth: "240px" },
};

const BOARD_FIELD_MIN_WIDTH_BY_TYPE = {
  inventoryLookup: 210,
  inventoryLookupLogistics: 210,
  select: 190,
  user: 190,
  status: 150,
  time: 130,
  date: 140,
};

const DEFAULT_BOARD_AUX_COLUMNS_ORDER = ["status", "time", "workflow", "assignee"];
const BOARD_AUX_COLUMN_DEFINITIONS = {
  status: {
    id: "status",
    label: "Estado",
    sectionName: "Estado",
    sectionColor: "#eef5ef",
    defaultWidth: 150,
    minWidth: 140,
  },
  time: {
    id: "time",
    label: "Tiempo",
    sectionName: "Tiempo",
    sectionColor: "#f3f5f8",
    defaultWidth: 130,
    minWidth: 120,
  },
  workflow: {
    id: "workflow",
    label: "Acciones",
    sectionName: "Acciones",
    sectionColor: "#f7f1e8",
    defaultWidth: 190,
    minWidth: 160,
  },
  assignee: {
    id: "assignee",
    label: "Player",
    sectionName: "Player",
    sectionColor: "#eef2ff",
    defaultWidth: 220,
    minWidth: 190,
  },
};
const BOARD_AUX_COLUMN_IDS = Object.keys(BOARD_AUX_COLUMN_DEFINITIONS);

function toBoardAuxColumnToken(auxId) {
  return `aux:${auxId}`;
}

function isBoardAuxColumnToken(token) {
  return String(token || "").startsWith("aux:");
}

function getBoardAuxColumnIdFromToken(token) {
  return isBoardAuxColumnToken(token) ? String(token).slice(4) : "";
}

function getBoardFields(board) {
  if (Array.isArray(board?.fields)) return board.fields;
  if (Array.isArray(board?.columns)) return board.columns;
  return [];
}

function getBoardVisibleAuxColumnIds(settings = {}) {
  const visible = [];
  if (settings?.showWorkflow !== false) visible.push("status");
  if (settings?.showDates !== false) visible.push("time");
  if (settings?.showWorkflow !== false) visible.push("workflow");
  if (settings?.showAssignee !== false) visible.push("assignee");
  return visible;
}

function getBoardAuxColumnOrder(settings = {}) {
  const configured = Array.isArray(settings?.auxColumnsOrder) && settings.auxColumnsOrder.length
    ? settings.auxColumnsOrder.filter((auxId) => BOARD_AUX_COLUMN_DEFINITIONS[auxId])
    : DEFAULT_BOARD_AUX_COLUMNS_ORDER.filter((auxId) => BOARD_AUX_COLUMN_DEFINITIONS[auxId]);
  return configured.concat(BOARD_AUX_COLUMN_IDS.filter((auxId) => !configured.includes(auxId)));
}

function getNormalizedBoardColumnOrder(board) {
  const fields = getBoardFields(board);
  const settings = board?.settings ?? EMPTY_OBJECT;
  const fieldIds = fields.map((field) => field.id).filter(Boolean);
  const validFieldIds = new Set(fieldIds);
  const fallbackOrder = fieldIds.concat(getBoardAuxColumnOrder(settings).map((auxId) => toBoardAuxColumnToken(auxId)));
  const storedOrder = Array.isArray(settings?.columnOrder) ? settings.columnOrder : [];
  const normalizedStoredOrder = storedOrder.filter((token) => {
    if (isBoardAuxColumnToken(token)) {
      return BOARD_AUX_COLUMN_DEFINITIONS[getBoardAuxColumnIdFromToken(token)];
    }
    return validFieldIds.has(token);
  });
  return normalizedStoredOrder.concat(fallbackOrder.filter((token) => !normalizedStoredOrder.includes(token)));
}

function sortBoardFieldsByColumnOrder(fields = [], columnOrder = []) {
  const safeColumnOrder = Array.isArray(columnOrder) ? columnOrder : [];
  const fieldOrder = safeColumnOrder.filter((token) => !isBoardAuxColumnToken(token));
  const indexByFieldId = new Map(fieldOrder.map((fieldId, index) => [fieldId, index]));
  return [...fields].sort((left, right) => {
    const leftIndex = indexByFieldId.get(left.id);
    const rightIndex = indexByFieldId.get(right.id);
    if (leftIndex === undefined && rightIndex === undefined) return 0;
    if (leftIndex === undefined) return 1;
    if (rightIndex === undefined) return -1;
    return leftIndex - rightIndex;
  });
}

function syncBoardFieldOrderIntoColumnOrder(fields = [], settings = {}) {
  const normalizedOrder = getNormalizedBoardColumnOrder({ fields, settings });
  const fieldIds = fields.map((field) => field.id).filter(Boolean);
  let fieldCursor = 0;
  return normalizedOrder.map((token) => {
    if (isBoardAuxColumnToken(token)) return token;
    const nextFieldId = fieldIds[fieldCursor];
    fieldCursor += 1;
    return nextFieldId || token;
  });
}

function reorderBoardColumnOrderTokens(sourceToken, targetToken, columnOrder = []) {
  if (!sourceToken || !targetToken || sourceToken === targetToken) return columnOrder;
  const nextOrder = [...columnOrder];
  const sourceIndex = nextOrder.indexOf(sourceToken);
  const targetIndex = nextOrder.indexOf(targetToken);
  if (sourceIndex === -1 || targetIndex === -1) return columnOrder;
  const [movedToken] = nextOrder.splice(sourceIndex, 1);
  nextOrder.splice(targetIndex, 0, movedToken);
  return nextOrder;
}

function getOrderedBoardColumns(board) {
  const fields = getBoardFields(board);
  const fieldMap = new Map(fields.map((field) => [field.id, field]));
  const visibleAuxIds = new Set(getBoardVisibleAuxColumnIds(board?.settings ?? EMPTY_OBJECT));

  return getNormalizedBoardColumnOrder(board).flatMap((token) => {
    if (isBoardAuxColumnToken(token)) {
      const auxId = getBoardAuxColumnIdFromToken(token);
      if (!visibleAuxIds.has(auxId)) return [];
      const meta = BOARD_AUX_COLUMN_DEFINITIONS[auxId];
      if (!meta) return [];
      return [{
        token,
        kind: "aux",
        id: auxId,
        label: meta.label,
        sectionName: meta.sectionName,
        sectionColor: meta.sectionColor,
        defaultWidth: meta.defaultWidth,
        minWidth: meta.minWidth,
      }];
    }

    const field = fieldMap.get(token);
    if (!field) return [];
    return [{
      token,
      kind: "field",
      id: field.id,
      field,
      label: field.label,
      sectionName: field.groupName || "General",
      sectionColor: field.groupColor || "#e2f4ec",
    }];
  });
}

const BOARD_TEMPLATES = [
  {
    id: "limpieza-c1",
    name: "Limpieza semanal C1",
    category: "Limpieza",
    description: "Plantilla semanal para limpieza con descuento automático concentrado en C1.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "cleaningSite",
      operationalContextLabel: "Sede de limpieza",
      operationalContextOptions: ["C1", "C2", "C3"],
      operationalContextValue: "C1",
    },
    columns: [
      { templateKey: "actividadLimpiezaC1", label: "Actividad", type: BOARD_ACTIVITY_LIST_FIELD, optionCatalogCategory: "Limpieza", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Cada actividad del catálogo de limpieza genera una fila operativa para la semana." },
      { label: "Zona específica", type: "text", width: "md", groupName: "Ubicación", groupColor: "#fee2e2", helpText: "Detalle interno dentro de C1, por ejemplo oficinas, baños o pasillo." },
      { label: "Frecuencia objetivo", type: "text", width: "sm", groupName: "Control", groupColor: "#dcfce7", helpText: "Frecuencia o turno esperado para ejecutar la limpieza." },
      { label: "Observación", type: "textarea", width: "lg", groupName: "Cierre", groupColor: "#fef3c7", helpText: "Comentarios, incidencias o necesidades detectadas durante la limpieza." },
    ],
  },
  {
    id: "limpieza-c2",
    name: "Limpieza semanal C2",
    category: "Limpieza",
    description: "Plantilla semanal para limpieza con descuento automático concentrado en C2.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "cleaningSite",
      operationalContextLabel: "Sede de limpieza",
      operationalContextOptions: ["C1", "C2", "C3"],
      operationalContextValue: "C2",
    },
    columns: [
      { templateKey: "actividadLimpiezaC2", label: "Actividad", type: BOARD_ACTIVITY_LIST_FIELD, optionCatalogCategory: "Limpieza", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Cada actividad del catálogo de limpieza genera una fila operativa para la semana." },
      { label: "Zona específica", type: "text", width: "md", groupName: "Ubicación", groupColor: "#fee2e2", helpText: "Detalle interno dentro de C2, por ejemplo oficinas, baños o pasillo." },
      { label: "Frecuencia objetivo", type: "text", width: "sm", groupName: "Control", groupColor: "#dcfce7", helpText: "Frecuencia o turno esperado para ejecutar la limpieza." },
      { label: "Observación", type: "textarea", width: "lg", groupName: "Cierre", groupColor: "#fef3c7", helpText: "Comentarios, incidencias o necesidades detectadas durante la limpieza." },
    ],
  },
  {
    id: "limpieza-c3",
    name: "Limpieza semanal C3",
    category: "Limpieza",
    description: "Plantilla semanal para limpieza con descuento automático concentrado en C3.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "cleaningSite",
      operationalContextLabel: "Sede de limpieza",
      operationalContextOptions: ["C1", "C2", "C3"],
      operationalContextValue: "C3",
    },
    columns: [
      { templateKey: "actividadLimpiezaC3", label: "Actividad", type: BOARD_ACTIVITY_LIST_FIELD, optionCatalogCategory: "Limpieza", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Cada actividad del catálogo de limpieza genera una fila operativa para la semana." },
      { label: "Zona específica", type: "text", width: "md", groupName: "Ubicación", groupColor: "#fee2e2", helpText: "Detalle interno dentro de C3, por ejemplo oficinas, baños o pasillo." },
      { label: "Frecuencia objetivo", type: "text", width: "sm", groupName: "Control", groupColor: "#dcfce7", helpText: "Frecuencia o turno esperado para ejecutar la limpieza." },
      { label: "Observación", type: "textarea", width: "lg", groupName: "Cierre", groupColor: "#fef3c7", helpText: "Comentarios, incidencias o necesidades detectadas durante la limpieza." },
    ],
  },
  {
    id: "operacion-nave",
    name: "Operación semanal por nave",
    category: "Operación semanal",
    description: "Deja listo un tablero semanal con selector manual por nave para mover la operación sin reconfigurar el tablero.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Nave",
      operationalContextOptions: ["Nave 1", "Nave 2", "Nave 3"],
      operationalContextValue: "Nave 1",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o rutina principal que se ejecutará en la nave seleccionada." },
      { label: "Objetivo", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Resultado esperado para la semana en esa nave." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha de revisión o cierre de la actividad." },
      { label: "Observación", type: "textarea", width: "lg", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Notas operativas, hallazgos o bloqueos detectados." },
    ],
  },
  {
    id: "operacion-estacion",
    name: "Operación semanal por estación",
    category: "Operación semanal",
    description: "Plantilla semanal con selector manual por estación para cambiar el contexto activo desde el tablero.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Estación",
      operationalContextOptions: ["Estación A", "Estación B", "Estación C"],
      operationalContextValue: "Estación A",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o pendiente que se atenderá en la estación elegida." },
      { label: "Checklist", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Lista corta de puntos a validar durante la semana." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha objetivo para terminar o validar la actividad." },
      { label: "Resultado", type: "status", defaultValue: STATUS_PENDING, width: "sm", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Estado operativo de la actividad dentro de la estación." },
    ],
  },
  {
    id: "operacion-nave-1-jaula-2",
    name: "Operación semanal Nave 1 · Jaula 2",
    category: "Operación semanal",
    description: "Deja fija la semana operativa sobre la ubicación real Nave 1 · Jaula 2.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Ubicación operativa",
      operationalContextOptions: ["Nave 1 · Jaula 2"],
      operationalContextValue: "Nave 1 · Jaula 2",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o pendiente que se atenderá en esta ubicación fija durante la semana." },
      { label: "Checklist", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Lista corta de puntos a validar dentro de la ubicación seleccionada." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha objetivo para terminar o validar la actividad." },
      { label: "Resultado", type: "status", defaultValue: STATUS_PENDING, width: "sm", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Estado operativo de la actividad en la ubicación fija." },
    ],
  },
  {
    id: "operacion-nave-2-estante-4",
    name: "Operación semanal Nave 2 · Estante 4",
    category: "Operación semanal",
    description: "Deja fija la semana operativa sobre la ubicación real Nave 2 · Estante 4.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Ubicación operativa",
      operationalContextOptions: ["Nave 2 · Estante 4"],
      operationalContextValue: "Nave 2 · Estante 4",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o pendiente que se atenderá en esta ubicación fija durante la semana." },
      { label: "Checklist", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Lista corta de puntos a validar dentro de la ubicación seleccionada." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha objetivo para terminar o validar la actividad." },
      { label: "Resultado", type: "status", defaultValue: STATUS_PENDING, width: "sm", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Estado operativo de la actividad en la ubicación fija." },
    ],
  },
  {
    id: "operacion-racks-a2",
    name: "Operación semanal Racks A-2",
    category: "Operación semanal",
    description: "Preset fijo para seguimiento semanal sobre Racks A-2.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Ubicación operativa",
      operationalContextOptions: ["Racks A-2"],
      operationalContextValue: "Racks A-2",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o pendiente que se atenderá en esta ubicación fija durante la semana." },
      { label: "Checklist", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Lista corta de puntos a validar dentro de la ubicación seleccionada." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha objetivo para terminar o validar la actividad." },
      { label: "Resultado", type: "status", defaultValue: STATUS_PENDING, width: "sm", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Estado operativo de la actividad en la ubicación fija." },
    ],
  },
  {
    id: "operacion-racks-b1",
    name: "Operación semanal Racks B-1",
    category: "Operación semanal",
    description: "Preset fijo para seguimiento semanal sobre Racks B-1.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Ubicación operativa",
      operationalContextOptions: ["Racks B-1"],
      operationalContextValue: "Racks B-1",
    },
    columns: [
      { label: "Actividad", type: "text", required: true, width: "lg", groupName: "Semana", groupColor: "#e0f2fe", helpText: "Actividad o pendiente que se atenderá en esta ubicación fija durante la semana." },
      { label: "Checklist", type: "textarea", width: "lg", groupName: "Planeación", groupColor: "#ecfccb", helpText: "Lista corta de puntos a validar dentro de la ubicación seleccionada." },
      { label: "Fecha compromiso", type: "date", width: "sm", groupName: "Control", groupColor: "#fef3c7", helpText: "Fecha objetivo para terminar o validar la actividad." },
      { label: "Resultado", type: "status", defaultValue: STATUS_PENDING, width: "sm", groupName: "Cierre", groupColor: "#fee2e2", helpText: "Estado operativo de la actividad en la ubicación fija." },
    ],
  },
  {
    id: "embarques",
    name: "Embarques",
    description: "Controla surtido, revisión y liberación de pedidos por embarque.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { templateKey: "pedido", label: "Pedido", type: "text", helpText: "Número o folio del pedido a surtir.", required: true, width: "sm", placeholder: "Ej: PED-1045", groupName: "Identificación", groupColor: "#e0f2fe" },
      { label: "Cliente", type: "text", helpText: "Nombre corto del cliente o ruta.", width: "md", groupName: "Identificación", groupColor: "#e0f2fe" },
      { templateKey: "producto", label: "Producto", type: "inventoryLookup", helpText: "Busca el producto en inventario para autocompletar datos.", required: true, width: "lg", groupName: "Producto", groupColor: "#ecfccb" },
      { label: "Presentación", type: "inventoryProperty", sourceFieldId: "producto", inventoryProperty: "presentation", helpText: "Trae automáticamente la presentación del producto seleccionado.", width: "md", groupName: "Producto", groupColor: "#ecfccb" },
      { label: "Cajas surtidas", type: "number", defaultValue: 0, helpText: "Cantidad real de cajas preparadas para salida.", width: "sm", groupName: "Volumen", groupColor: "#fef3c7" },
      { label: "Revisión final", type: "boolean", defaultValue: "No", helpText: "Marca si el embarque ya fue revisado antes de salir.", width: "sm", groupName: "Validación", groupColor: "#fee2e2" },
      { label: "Observaciones", type: "textarea", placeholder: "Incidencias, faltantes o comentarios", helpText: "Notas rápidas del embarque.", width: "lg", groupName: "Validación", groupColor: "#fee2e2" },
    ],
  },
  {
    id: "produccion",
    name: "Producción",
    description: "Da seguimiento a lotes, players, cantidades y estatus de operación.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Lote", type: "text", helpText: "Identificador del lote o corrida.", required: true, width: "sm", groupName: "Base", groupColor: "#ede9fe" },
      { label: "SKU", type: "inventoryLookup", helpText: "Selecciona el producto del lote.", required: true, width: "md", groupName: "Base", groupColor: "#ede9fe" },
      { templateKey: "piezasObjetivo", label: "Piezas objetivo", type: "number", defaultValue: 0, helpText: "Meta total de piezas a producir.", width: "sm", groupName: "Meta", groupColor: "#dcfce7" },
      { templateKey: "piezasReales", label: "Piezas reales", type: "number", defaultValue: 0, helpText: "Cantidad real alcanzada en la producción.", width: "sm", groupName: "Meta", groupColor: "#dcfce7" },
      { label: "Desviación", type: "formula", formulaLeftFieldId: "piezasReales", formulaOperation: "subtract", formulaRightFieldId: "piezasObjetivo", helpText: "Diferencia entre lo real y lo planeado.", width: "sm", groupName: "Meta", groupColor: "#dcfce7" },
      { label: "Fecha de corte", type: "date", helpText: "Fecha límite o corte del lote.", width: "sm", groupName: "Seguimiento", groupColor: "#fef3c7" },
      { label: "Estado interno", type: "status", defaultValue: STATUS_PENDING, helpText: "Estado operativo del lote dentro del proceso.", width: "sm", groupName: "Seguimiento", groupColor: "#fef3c7" },
    ],
  },
  {
    id: "calidad",
    name: "Calidad e inspección",
    description: "Registra revisión visual, hallazgos, decisión y liberación del producto.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Folio inspección", type: "text", helpText: "Consecutivo de la revisión.", required: true, width: "sm", groupName: "Registro", groupColor: "#e0f2fe" },
      { label: "Artículo", type: "inventoryLookup", helpText: "Producto que será inspeccionado.", width: "lg", groupName: "Registro", groupColor: "#e0f2fe" },
      { label: "Resultado", type: "select", optionSource: "manual", options: ["Aprobado", "Condicionado", "Rechazado"], helpText: "Decisión final de calidad.", required: true, width: "sm", groupName: "Resultado", groupColor: "#fee2e2" },
      { label: "Liberado", type: "boolean", defaultValue: "No", helpText: "Indica si el lote ya puede continuar el flujo.", width: "sm", groupName: "Resultado", groupColor: "#fee2e2" },
      { label: "Inspector", type: "user", helpText: "Persona que ejecuta la revisión.", width: "md", groupName: "Resultado", groupColor: "#fee2e2" },
      { label: "Hallazgo", type: "textarea", placeholder: "Detalle breve del hallazgo", helpText: "Notas o desviaciones detectadas en la inspección.", width: "lg", groupName: "Detalle", groupColor: "#ecfccb" },
    ],
  },
  {
    id: "surtido",
    name: "Surtido de pedidos",
    description: "Da seguimiento al armado de pedidos por prioridad, ruta y avance de surtido.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Prioridad", type: "select", optionSource: "manual", options: ["Alta", "Media", "Baja"], required: true, width: "sm", groupName: "Planeación", groupColor: "#fee2e2", helpText: "Ordena el surtido según urgencia operativa." },
      { label: "Ruta", type: "text", width: "sm", groupName: "Planeación", groupColor: "#fee2e2", helpText: "Ruta o andén asignado." },
      { templateKey: "skuSurtido", label: "SKU", type: "inventoryLookup", required: true, width: "md", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Artículo a surtir." },
      { label: "Nombre producto", type: "inventoryProperty", sourceFieldId: "skuSurtido", inventoryProperty: "name", width: "lg", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Nombre automático del artículo." },
      { label: "Cajas pedidas", type: "number", defaultValue: 0, width: "sm", groupName: "Cantidad", groupColor: "#ecfccb", helpText: "Cantidad solicitada por el cliente." },
      { label: "Cajas surtidas", type: "number", defaultValue: 0, width: "sm", groupName: "Cantidad", groupColor: "#ecfccb", helpText: "Cantidad ya preparada." },
      { label: "Faltante", type: "textarea", width: "lg", groupName: "Cierre", groupColor: "#fef3c7", helpText: "Describe faltantes o incidencias del surtido." },
    ],
  },
  {
    id: "devoluciones",
    name: "Devoluciones",
    description: "Registra entradas devueltas, motivo, decisión y reubicación en almacén.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Folio devolución", type: "text", required: true, width: "sm", groupName: "Registro", groupColor: "#ede9fe", helpText: "Número de devolución recibido." },
      { templateKey: "skuDevolucion", label: "Producto", type: "inventoryLookup", width: "lg", groupName: "Registro", groupColor: "#ede9fe", helpText: "Artículo devuelto por el cliente o ruta." },
      { label: "Motivo", type: "select", optionSource: "manual", options: ["Dañado", "Caducado", "Error de surtido", "Cliente rechazó"], width: "md", groupName: "Diagnóstico", groupColor: "#fee2e2", helpText: "Razón principal de la devolución." },
      { label: "Piezas devueltas", type: "number", defaultValue: 0, width: "sm", groupName: "Diagnóstico", groupColor: "#fee2e2", helpText: "Cantidad exacta recibida en devolución." },
      { label: "Decisión", type: "select", optionSource: "manual", options: ["Reingresar", "Rechazar", "Cuarentena"], width: "sm", groupName: "Resolución", groupColor: "#dcfce7", helpText: "Acción que tomará almacén con el material." },
      { label: "Ubicación final", type: "text", width: "md", groupName: "Resolución", groupColor: "#dcfce7", helpText: "Rack, zona o área donde quedará el material." },
    ],
  },
  {
    id: "maquila",
    name: "Maquila y reacondicionado",
    description: "Controla armado, reproceso, cambios de presentación y salida de maquila.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Orden maquila", type: "text", required: true, width: "sm", groupName: "Orden", groupColor: "#e0f2fe", helpText: "Número interno de la orden de trabajo." },
      { templateKey: "skuMaquila", label: "Producto base", type: "inventoryLookup", required: true, width: "md", groupName: "Orden", groupColor: "#e0f2fe", helpText: "Producto que será reacondicionado." },
      { label: "Presentación final", type: "text", width: "md", groupName: "Configuración", groupColor: "#ecfccb", helpText: "Nueva presentación o configuración esperada." },
      { label: "Unidades objetivo", type: "number", defaultValue: 0, width: "sm", groupName: "Configuración", groupColor: "#ecfccb", helpText: "Meta a acondicionar." },
      { label: "Unidades terminadas", type: "number", defaultValue: 0, width: "sm", groupName: "Avance", groupColor: "#fef3c7", helpText: "Total ya terminado en maquila." },
      { label: "Incidencia", type: "textarea", width: "lg", groupName: "Avance", groupColor: "#fef3c7", helpText: "Notas sobre daños, mermas o ajustes." },
    ],
  },
  {
    id: "auditoria",
    name: "Auditoría de almacén",
    description: "Registra revisión de ubicación, conteo y desviaciones detectadas en piso.",
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
    columns: [
      { label: "Zona", type: "text", required: true, width: "sm", groupName: "Ubicación", groupColor: "#fee2e2", helpText: "Pasillo, rack o zona auditada." },
      { templateKey: "skuAuditoria", label: "SKU auditado", type: "inventoryLookup", width: "md", groupName: "Ubicación", groupColor: "#fee2e2", helpText: "Artículo revisado en esa ubicación." },
      { templateKey: "conteoSistema", label: "Conteo sistema", type: "number", defaultValue: 0, width: "sm", groupName: "Comparativo", groupColor: "#dcfce7", helpText: "Existencia registrada en el sistema." },
      { templateKey: "conteoFisico", label: "Conteo físico", type: "number", defaultValue: 0, width: "sm", groupName: "Comparativo", groupColor: "#dcfce7", helpText: "Existencia encontrada físicamente." },
      { label: "Diferencia", type: "formula", formulaLeftFieldId: "conteoFisico", formulaOperation: "subtract", formulaRightFieldId: "conteoSistema", width: "sm", groupName: "Comparativo", groupColor: "#dcfce7", helpText: "Brecha entre sistema y físico." },
      { label: "Observación", type: "textarea", width: "lg", groupName: "Hallazgo", groupColor: "#e0f2fe", helpText: "Detalle de la desviación o corrección requerida." },
    ],
  },
];

const FORMULA_OPERATIONS = [
  { value: "add", label: "Sumar" },
  { value: "subtract", label: "Restar" },
  { value: "multiply", label: "Multiplicar" },
  { value: "divide", label: "Dividir" },
];

const OPTION_SOURCE_TYPES = [
  { value: "manual", label: "Opciones manuales" },
  { value: "users", label: "Players existentes" },
  { value: "inventory", label: "Inventario" },
  { value: "catalog", label: "Catálogo de actividades" },
  { value: "status", label: "Estados estándar" },
];

const INVENTORY_PROPERTIES = [
  { value: "code", label: "Código" },
  { value: "name", label: "Nombre" },
  { value: "presentation", label: "Presentación" },
  { value: "piecesPerBox", label: "Piezas por caja" },
  { value: "boxesPerPallet", label: "Cajas por tarima" },
];

const INVENTORY_IMPORT_FIELD_ALIASES = {
  code: "code",
  codigo: "code",
  sku: "code",
  clave: "code",
  dominio: "domain",
  domain: "domain",
  tipoinventario: "domain",
  nombre: "name",
  producto: "name",
  descripcion: "name",
  name: "name",
  presentacion: "presentation",
  presentacionproducto: "presentation",
  presentation: "presentation",
  piezasporcaja: "piecesPerBox",
  piezasxcaja: "piecesPerBox",
  piezas_caja: "piecesPerBox",
  piecesperbox: "piecesPerBox",
  cajasportarima: "boxesPerPallet",
  cajasxtarima: "boxesPerPallet",
  cajas_tarima: "boxesPerPallet",
  boxesperpallet: "boxesPerPallet",
  stockactual: "stockUnits",
  existencias: "stockUnits",
  stock: "stockUnits",
  stockunits: "stockUnits",
  stockminimo: "minStockUnits",
  minimoreorden: "minStockUnits",
  minstockunits: "minStockUnits",
  ubicacion: "storageLocation",
  storagelocation: "storageLocation",
  unidad: "unitLabel",
  unitlabel: "unitLabel",
  actividadcatalogo: "activityCatalogIds",
  actividadcatalogoids: "activityCatalogIds",
  consumoporinicio: "consumptionPerStart",
  consumptionperstart: "consumptionPerStart",
  sedelimpieza: "cleaningSite",
  limpiezasede: "cleaningSite",
  cleaningsite: "cleaningSite",
  consumosporactividad: "activityConsumptions",
  consumosactividad: "activityConsumptions",
  activityconsumptions: "activityConsumptions",
};

const INVENTORY_DOMAIN_OPTIONS = [
  { value: INVENTORY_DOMAIN_BASE, label: "Base" },
  { value: INVENTORY_DOMAIN_CLEANING, label: "Insumos de limpieza" },
  { value: INVENTORY_DOMAIN_ORDERS, label: "Insumos para pedidos" },
];

const INVENTORY_MOVEMENT_OPTIONS = [
  { value: INVENTORY_MOVEMENT_RESTOCK, label: "Entrada / reabasto" },
  { value: INVENTORY_MOVEMENT_CONSUME, label: "Consumo" },
  { value: INVENTORY_MOVEMENT_TRANSFER, label: "Transferencia" },
];

const CLEANING_SITE_OPTIONS = [
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "C3", label: "C3 principal" },
];

const DEFAULT_CLEANING_SITE = "C3";
const BOARD_OPERATIONAL_CONTEXT_NONE = "none";
const BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE = "cleaningSite";
const BOARD_OPERATIONAL_CONTEXT_CUSTOM = "custom";
const BOARD_OPERATIONAL_CONTEXT_OPTIONS = [
  { value: BOARD_OPERATIONAL_CONTEXT_NONE, label: "Sin contexto operativo" },
  { value: BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE, label: "Sede de limpieza C1/C2/C3" },
  { value: BOARD_OPERATIONAL_CONTEXT_CUSTOM, label: "Estación, nave u opciones manuales" },
];

function normalizeInventoryDomain(value) {
  const key = normalizeKey(value);
  if (["cleaning", "limpieza", "clean"].includes(key)) return INVENTORY_DOMAIN_CLEANING;
  if (["orders", "order", "pedidos", "pedido"].includes(key)) return INVENTORY_DOMAIN_ORDERS;
  return INVENTORY_DOMAIN_BASE;
}

function inventoryDomainUsesPresentation(domain) {
  return normalizeInventoryDomain(domain) !== INVENTORY_DOMAIN_ORDERS;
}

function inventoryDomainUsesPackagingMetrics(domain) {
  return normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_BASE;
}

function getInventoryPresentationLabel(domain) {
  return normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_CLEANING ? "Formato / contenido" : "Presentación";
}

function getInventoryPresentationPlaceholder(domain) {
  return normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_CLEANING
    ? "Ej: Bidón 20 L · dilución 1:40"
    : "Ej: Caja master, paquete, rollo";
}

function getInventoryUnitPlaceholder(domain) {
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_CLEANING) {
    return "Ej: bidones, rollos, bolsas";
  }
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_ORDERS) {
    return "Ej: pzas, rollos, paquetes";
  }
  return "Ej: pzas, rollos";
}

function getInventoryStoragePlaceholder(domain) {
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_CLEANING) {
    return "Ej: Cuarto de limpieza · anaquel 2";
  }
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_ORDERS) {
    return "Ej: Nave 2 · rack de surtido";
  }
  return "Ej: Nave 2 · Estante 4";
}

function getInventoryEntityLabel(domain) {
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_CLEANING) return "insumo de limpieza";
  if (normalizeInventoryDomain(domain) === INVENTORY_DOMAIN_ORDERS) return "insumo para pedidos";
  return "producto";
}

function normalizeCleaningSite(value, fallback = DEFAULT_CLEANING_SITE) {
  const key = normalizeKey(value).replaceAll(" ", "");
  if (key === "c1") return "C1";
  if (key === "c2") return "C2";
  if (["c3", "principal", "main", "default"].includes(key)) return "C3";
  return fallback;
}

function normalizeBoardOperationalContextType(value) {
  const normalizedValue = normalizeKey(value).replaceAll(" ", "");
  if (["cleaningsite", "cleaning", "sedelimpieza"].includes(normalizedValue)) {
    return BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE;
  }
  if (["custom", "manual", "station", "estacion", "nave", "ubicacionoperativa"].includes(normalizedValue)) {
    return BOARD_OPERATIONAL_CONTEXT_CUSTOM;
  }
  return BOARD_OPERATIONAL_CONTEXT_NONE;
}

function normalizeBoardOperationalContextOptions(value, contextType = BOARD_OPERATIONAL_CONTEXT_NONE) {
  if (contextType === BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE) {
    return CLEANING_SITE_OPTIONS.map((option) => option.value);
  }

  let sourceValues = [];
  if (Array.isArray(value)) {
    sourceValues = value;
  } else if (typeof value === "string") {
    sourceValues = value.split(/[;,]/);
  }
  const seen = new Set();

  return sourceValues
    .map((entry) => String(entry || "").trim())
    .filter((entry) => {
      const normalizedEntry = normalizeKey(entry);
      if (!normalizedEntry || seen.has(normalizedEntry)) return false;
      seen.add(normalizedEntry);
      return true;
    });
}

function normalizeBoardOperationalContextLabel(value, contextType = BOARD_OPERATIONAL_CONTEXT_NONE) {
  let fallbackLabel = "";
  if (contextType === BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE) {
    fallbackLabel = "Sede de limpieza";
  } else if (contextType === BOARD_OPERATIONAL_CONTEXT_CUSTOM) {
    fallbackLabel = "Ubicación operativa";
  }
  return String(value || "").trim() || fallbackLabel;
}

function normalizeBoardOperationalContextValue(value, contextType = BOARD_OPERATIONAL_CONTEXT_NONE, contextOptions = []) {
  if (contextType === BOARD_OPERATIONAL_CONTEXT_NONE) return "";
  if (contextType === BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE) {
    return normalizeCleaningSite(value, DEFAULT_CLEANING_SITE);
  }

  const trimmedValue = String(value || "").trim();
  if (!contextOptions.length) return trimmedValue;
  return contextOptions.includes(trimmedValue) ? trimmedValue : contextOptions[0] || "";
}

function normalizeInventoryActivityConsumptions(value, fallbackActivityIds = [], fallbackConsumptionPerStart = 0) {
  const normalizedFallbackQuantity = Math.max(0, Number(fallbackConsumptionPerStart || 0));
  const consumptionMap = new Map();

  function rememberConsumption(rawCatalogActivityId, rawQuantity = 0) {
    const catalogActivityId = String(rawCatalogActivityId || "").trim();
    if (!catalogActivityId) return;

    const quantity = Math.max(0, Number(rawQuantity || 0));
    const currentEntry = consumptionMap.get(catalogActivityId);
    if (!currentEntry || quantity >= currentEntry.quantity) {
      consumptionMap.set(catalogActivityId, { catalogActivityId, quantity });
    }
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry && typeof entry === "object") {
        rememberConsumption(entry.catalogActivityId || entry.activityCatalogId || entry.id, entry.quantity);
        return;
      }
      rememberConsumption(entry, normalizedFallbackQuantity);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([catalogActivityId, quantity]) => rememberConsumption(catalogActivityId, quantity));
  } else if (typeof value === "string") {
    value.split(/[;,]/).forEach((entry) => {
      const trimmedEntry = String(entry || "").trim();
      if (!trimmedEntry) return;
      const [catalogActivityId, rawQuantity] = trimmedEntry.split(":");
      rememberConsumption(catalogActivityId, rawQuantity === undefined ? normalizedFallbackQuantity : rawQuantity);
    });
  }

  let fallbackActivityIdsList = [];
  if (Array.isArray(fallbackActivityIds)) {
    fallbackActivityIdsList = fallbackActivityIds;
  } else if (typeof fallbackActivityIds === "string") {
    fallbackActivityIdsList = fallbackActivityIds.split(/[;,]/).map((entry) => entry.trim()).filter(Boolean);
  }

  Array.from(new Set(fallbackActivityIdsList)).forEach((catalogActivityId) => {
    if (!consumptionMap.has(catalogActivityId)) {
      rememberConsumption(catalogActivityId, normalizedFallbackQuantity);
    }
  });

  return Array.from(consumptionMap.values());
}

function normalizeInventoryMovementType(value) {
  const key = normalizeKey(value);
  if (["consume", "consumo", "usage", "uso"].includes(key)) return INVENTORY_MOVEMENT_CONSUME;
  if (["transfer", "transferencia", "traslado"].includes(key)) return INVENTORY_MOVEMENT_TRANSFER;
  return INVENTORY_MOVEMENT_RESTOCK;
}

function buildInventoryTransferTargetKey(warehouse = "", storageLocation = "") {
  const normalizedWarehouse = normalizeKey(warehouse) || "sin-destino";
  const normalizedStorage = normalizeKey(storageLocation) || "sin-resguardo";
  return `${normalizedWarehouse}::${normalizedStorage}`;
}

function normalizeInventoryTransferTargetRecord(target, fallbackUnitLabel = "pzas") {
  const warehouse = String(target?.warehouse || "").trim();
  const storageLocation = String(target?.storageLocation || "").trim();
  return {
    destinationKey: buildInventoryTransferTargetKey(warehouse, storageLocation),
    warehouse,
    storageLocation,
    recipientName: String(target?.recipientName || "").trim(),
    unitLabel: String(target?.unitLabel || fallbackUnitLabel || "pzas").trim() || "pzas",
    availableUnits: Math.max(0, Number(target?.availableUnits ?? target?.stockUnits ?? 0)),
    updatedAt: target?.updatedAt || target?.createdAt || "",
  };
}

function resolveInventorySourceStockUnits(domain, rawStockUnits, transferTargets, stockTrackingMode) {
  if (domain !== INVENTORY_DOMAIN_ORDERS) {
    return rawStockUnits;
  }

  if (normalizeKey(stockTrackingMode) === "source") {
    return rawStockUnits;
  }

  return Math.max(0, rawStockUnits - sumInventoryTransferTargetUnits(transferTargets));
}

function normalizeInventoryItemRecord(item) {
  const domain = normalizeInventoryDomain(item?.domain);
  const usesPresentation = inventoryDomainUsesPresentation(domain);
  const usesPackagingMetrics = inventoryDomainUsesPackagingMetrics(domain);
  const transferTargets = Array.isArray(item?.transferTargets)
    ? item.transferTargets
    : [];
  const normalizedTransferTargets = domain === INVENTORY_DOMAIN_ORDERS
    ? transferTargets.map((target) => normalizeInventoryTransferTargetRecord(target, item?.unitLabel || "pzas")).filter((target) => target.warehouse || target.storageLocation || target.availableUnits > 0)
    : [];
  const rawStockUnits = domain === INVENTORY_DOMAIN_BASE ? 0 : Math.max(0, Number(item?.stockUnits || 0));
  const fallbackConsumptionPerStart = Math.max(0, Number(item?.consumptionPerStart || 0));
  const activityConsumptions = domain === INVENTORY_DOMAIN_CLEANING
    ? normalizeInventoryActivityConsumptions(item?.activityConsumptions, item?.activityCatalogIds, fallbackConsumptionPerStart)
    : [];

  return {
    ...item,
    domain,
    presentation: usesPresentation ? String(item?.presentation || "").trim() : "",
    piecesPerBox: usesPackagingMetrics ? Number(item?.piecesPerBox || 0) : 0,
    boxesPerPallet: usesPackagingMetrics ? Number(item?.boxesPerPallet || 0) : 0,
    stockUnits: resolveInventorySourceStockUnits(domain, rawStockUnits, normalizedTransferTargets, item?.stockTrackingMode),
    minStockUnits: domain === INVENTORY_DOMAIN_BASE ? 0 : Math.max(0, Number(item?.minStockUnits || 0)),
    storageLocation: domain === INVENTORY_DOMAIN_BASE ? "" : String(item?.storageLocation || "").trim(),
    cleaningSite: domain === INVENTORY_DOMAIN_CLEANING ? normalizeCleaningSite(item?.cleaningSite) : "",
    unitLabel: String(item?.unitLabel || "pzas").trim() || "pzas",
    stockTrackingMode: domain === INVENTORY_DOMAIN_ORDERS ? "source" : "",
    transferTargets: normalizedTransferTargets,
    activityCatalogIds: activityConsumptions.map((entry) => entry.catalogActivityId),
    activityConsumptions,
    consumptionPerStart: domain === INVENTORY_DOMAIN_CLEANING ? fallbackConsumptionPerStart : 0,
  };
}

function normalizeInventoryMovementRecord(movement) {
  const warehouse = String(movement?.warehouse || "").trim();
  const storageLocation = String(movement?.storageLocation || "").trim();
  const remainingUnits = movement?.remainingUnits;
  const destinationBalanceUnits = movement?.destinationBalanceUnits;
  const destinationKey = warehouse || storageLocation
    ? buildInventoryTransferTargetKey(warehouse, storageLocation)
    : String(movement?.destinationKey || "").trim() || buildInventoryTransferTargetKey(warehouse, storageLocation);
  return {
    ...movement,
    domain: normalizeInventoryDomain(movement?.domain),
    movementType: normalizeInventoryMovementType(movement?.movementType),
    quantity: Math.max(0, Number(movement?.quantity || 0)),
    warehouse,
    recipientName: String(movement?.recipientName || "").trim(),
    storageLocation,
    cleaningSite: normalizeInventoryDomain(movement?.domain) === INVENTORY_DOMAIN_CLEANING ? normalizeCleaningSite(movement?.cleaningSite) : "",
    unitLabel: String(movement?.unitLabel || "pzas").trim() || "pzas",
    remainingUnits: remainingUnits === undefined || remainingUnits === null || String(remainingUnits).trim() === "" ? null : Math.max(0, Number(remainingUnits || 0)),
    destinationBalanceUnits: destinationBalanceUnits === undefined || destinationBalanceUnits === null || String(destinationBalanceUnits).trim() === "" ? null : Math.max(0, Number(destinationBalanceUnits || 0)),
    destinationKey,
  };
}

function findInventoryTransferTarget(item, warehouse = "", storageLocation = "") {
  const destinationKey = buildInventoryTransferTargetKey(warehouse, storageLocation);
  return (item?.transferTargets || []).find((target) => target.destinationKey === destinationKey) || null;
}

function sumInventoryTransferTargetUnits(targets = []) {
  return (Array.isArray(targets) ? targets : []).reduce((sum, target) => sum + Math.max(0, Number(target?.availableUnits || 0)), 0);
}

function hasInventoryBalanceInput(value) {
  return !(value === undefined || value === null || String(value).trim() === "");
}

function getInventoryAllocatedUnits(item) {
  return sumInventoryTransferTargetUnits(item?.transferTargets || []);
}

function getInventoryAvailableToTransfer(item, remainingUnits = null, destinationKey = "") {
  const normalizedItem = normalizeInventoryItemRecord(item);
  return Math.max(0, Number(normalizedItem.stockUnits || 0));
}

function getComparableDateMs(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatInventoryTransferDestinationLabel(destination) {
  const parts = [destination?.warehouse || "Sin nave", destination?.storageLocation || "Sin resguardo"];
  if (destination?.recipientName) {
    parts.push(destination.recipientName);
  }
  return parts.join(" · ");
}

function getInventorySavedStorageLocations(item, movements = []) {
  const locationMap = new Map();

  function rememberLocation(location, updatedAt = "") {
    const trimmedLocation = String(location || "").trim();
    if (!trimmedLocation) return;

    const locationKey = normalizeKey(trimmedLocation);
    const currentRecord = locationMap.get(locationKey);
    const nextRecord = { key: locationKey, label: trimmedLocation, updatedAt };
    if (!currentRecord || getComparableDateMs(updatedAt) >= getComparableDateMs(currentRecord.updatedAt)) {
      locationMap.set(locationKey, nextRecord);
    }
  }

  rememberLocation(item?.storageLocation);
  (movements || [])
    .filter((movement) => movement.itemId === item?.id)
    .forEach((movement) => rememberLocation(movement.storageLocation, movement.createdAt || movement.updatedAt || ""));

  return Array.from(locationMap.values()).sort((left, right) => {
    const byDate = getComparableDateMs(right.updatedAt) - getComparableDateMs(left.updatedAt);
    if (byDate !== 0) return byDate;
    return left.label.localeCompare(right.label, "es-MX");
  });
}

function getInventorySavedTransferDestinations(item, movements = []) {
  const destinationMap = new Map();

  function rememberDestination(destination, updatedAt = "") {
    const normalizedDestination = normalizeInventoryTransferTargetRecord({
      ...destination,
      updatedAt: destination?.updatedAt || updatedAt,
    }, item?.unitLabel || "pzas");

    if (!normalizedDestination.warehouse && !normalizedDestination.storageLocation) {
      return;
    }

    const currentRecord = destinationMap.get(normalizedDestination.destinationKey);
    if (!currentRecord || getComparableDateMs(normalizedDestination.updatedAt) >= getComparableDateMs(currentRecord.updatedAt)) {
      destinationMap.set(normalizedDestination.destinationKey, normalizedDestination);
      return;
    }

    if (normalizedDestination.recipientName && !currentRecord.recipientName) {
      destinationMap.set(normalizedDestination.destinationKey, {
        ...currentRecord,
        recipientName: normalizedDestination.recipientName,
      });
    }
  }

  (item?.transferTargets || []).forEach((target) => rememberDestination(target, target?.updatedAt || ""));
  (movements || [])
    .filter((movement) => movement.itemId === item?.id && movement.movementType === INVENTORY_MOVEMENT_TRANSFER)
    .forEach((movement) => rememberDestination(movement, movement.createdAt || movement.updatedAt || ""));

  return Array.from(destinationMap.values()).sort((left, right) => {
    const byDate = getComparableDateMs(right.updatedAt) - getComparableDateMs(left.updatedAt);
    if (byDate !== 0) return byDate;
    return formatInventoryTransferDestinationLabel(left).localeCompare(formatInventoryTransferDestinationLabel(right), "es-MX");
  });
}

function getInventoryDefaultTransferDestination(item, movements = []) {
  return getInventorySavedTransferDestinations(item, movements)[0] || null;
}

function getInventoryManageActionId(domain) {
  if (domain === INVENTORY_DOMAIN_CLEANING) return "manageCleaningInventory";
  if (domain === INVENTORY_DOMAIN_ORDERS) return "manageOrderInventory";
  return "manageInventory";
}

function getInventoryImportActionId(domain) {
  if (domain === INVENTORY_DOMAIN_CLEANING) return "importCleaningInventory";
  if (domain === INVENTORY_DOMAIN_ORDERS) return "importOrderInventory";
  return "importInventory";
}

function createInventoryModalState(mode = "create", item = {}, fallbackDomain = INVENTORY_DOMAIN_BASE) {
  const normalized = normalizeInventoryItemRecord(item);
  return {
    open: false,
    mode,
    id: normalized.id || null,
    domain: normalized.domain || fallbackDomain,
    code: normalized.code || "",
    name: normalized.name || "",
    presentation: normalized.presentation || "",
    piecesPerBox: normalized.piecesPerBox ? String(normalized.piecesPerBox) : "",
    boxesPerPallet: normalized.boxesPerPallet ? String(normalized.boxesPerPallet) : "",
    stockUnits: normalized.stockUnits ? String(normalized.stockUnits) : "",
    minStockUnits: normalized.minStockUnits ? String(normalized.minStockUnits) : "",
    storageLocation: normalized.storageLocation || "",
    cleaningSite: normalized.cleaningSite || DEFAULT_CLEANING_SITE,
    unitLabel: normalized.unitLabel || "pzas",
    activityCatalogIds: normalized.activityCatalogIds || [],
    activityConsumptions: (normalized.activityConsumptions || []).map((entry) => ({
      catalogActivityId: entry.catalogActivityId,
      quantity: entry.quantity ? String(entry.quantity) : "",
    })),
  };
}

function createInventoryMovementModalState(item = null, movementType = INVENTORY_MOVEMENT_RESTOCK, fallbackDomain = INVENTORY_DOMAIN_BASE, options = EMPTY_OBJECT) {
  const normalizedItem = item ? normalizeInventoryItemRecord(item) : null;
  const isTransferContext = normalizedItem?.domain === INVENTORY_DOMAIN_ORDERS || fallbackDomain === INVENTORY_DOMAIN_ORDERS || movementType === INVENTORY_MOVEMENT_TRANSFER;
  const defaultDestination = isTransferContext ? options.defaultDestination || null : null;
  return {
    open: false,
    itemId: normalizedItem?.id || null,
    itemCode: normalizedItem?.code || "",
    itemName: normalizedItem?.name || "",
    domain: normalizedItem?.domain || fallbackDomain,
    movementType,
    quantity: "",
    notes: "",
    warehouse: defaultDestination?.warehouse || "",
    recipientName: defaultDestination?.recipientName || "",
    storageLocation: isTransferContext ? defaultDestination?.storageLocation || "" : normalizedItem?.storageLocation || "",
    remainingUnits: "",
    transferTargetKey: defaultDestination?.destinationKey || "",
    unitLabel: normalizedItem?.unitLabel || "pzas",
  };
}

function createInventoryTransferConfirmModalState() {
  return {
    open: false,
    itemId: null,
    itemName: "",
    warehouse: "",
    storageLocation: "",
    recipientName: "",
    quantity: 0,
    unitLabel: "pzas",
    remainingUnits: "",
    lastKnownUnits: null,
    pendingPayload: null,
    draftMovementModal: null,
  };
}

function readNotificationReadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readNotificationDeletedState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_DELETED_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readNotificationInboxState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_INBOX_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatNotificationTimestamp(value) {
  if (!value) return "Sin fecha";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(parsed));
}

function createInventoryRestockModalState(domain = INVENTORY_DOMAIN_CLEANING, itemIds = []) {
  const safeItemIds = Array.isArray(itemIds) ? itemIds.filter(Boolean) : [];
  return {
    open: false,
    domain,
    itemIds: safeItemIds,
    quantities: Object.fromEntries(safeItemIds.map((itemId) => [itemId, ""])),
  };
}

function inferFeedbackToneFromMessage(message) {
  const normalizedMessage = normalizeKey(message);
  if (!normalizedMessage) return "success";
  if (["no se pudo", "error", "completa", "define", "agrega", "escribe", "selecciona", "inval", "obligatoria", "obligatorio"].some((term) => normalizedMessage.includes(term))) {
    return "danger";
  }
  return "success";
}

function AppToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`app-toast ${toast.tone === "danger" ? "danger" : "success"} ${toast.isClosing ? "closing" : ""}`.trim()}>
          <p>{toast.message}</p>
          <button type="button" className="app-toast-close" onClick={() => onDismiss(toast.id)} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </article>
      ))}
    </div>
  );
}

function AppNotificationCenter({ unreadNotifications, readNotifications, unreadCount, activeTab, isOpen, onToggle, onTabChange, onDeleteAllRead, onDeleteNotification, onOpenNotification }) {
  const visibleNotifications = activeTab === "read" ? readNotifications : unreadNotifications;

  return (
    <div className={`app-notification-center${isOpen ? " open" : ""}`}>
      <button type="button" className={`app-notification-trigger ${unreadCount ? "has-unread" : ""}`.trim()} onClick={onToggle} aria-label="Abrir alertas" aria-expanded={isOpen}>
        <Bell size={18} />
        {unreadCount ? <span className="app-notification-badge">{Math.min(unreadCount, 99)}</span> : null}
      </button>
      {isOpen ? (
        <section className="app-notification-panel" aria-label="Centro de alertas">
          <div className="app-notification-panel-header">
            <strong>Alertas</strong>
            {activeTab === "read" && readNotifications.length ? <button type="button" className="app-notification-action" onClick={onDeleteAllRead}>Borrar todo</button> : null}
          </div>
          <div className="app-notification-tabs" role="tablist" aria-label="Filtros de alertas">
            <button type="button" role="tab" aria-selected={activeTab === "unread"} className={activeTab === "unread" ? "app-notification-tab active" : "app-notification-tab"} onClick={() => onTabChange("unread")}>Sin leer</button>
            <button type="button" role="tab" aria-selected={activeTab === "read"} className={activeTab === "read" ? "app-notification-tab active" : "app-notification-tab"} onClick={() => onTabChange("read")}>Leidas</button>
          </div>
          <div className="app-notification-list">
            {visibleNotifications.map((notification) => (
              <article key={notification.id} className={`app-notification-item ${notification.tone === "danger" ? "danger" : "success"} ${notification.isUnread ? "unread" : ""} ${notification.isLocked ? "locked" : ""} ${activeTab === "read" && !notification.isLocked ? "deletable" : ""}`.trim()}>
                <button type="button" className="app-notification-open" onClick={() => onOpenNotification(notification)}>
                  <div className="app-notification-item-header">
                    <strong>{notification.title}</strong>
                    <span>{formatNotificationTimestamp(notification.timestamp)}</span>
                  </div>
                  <p>{notification.message}</p>
                  {notification.meta ? <small>{notification.meta}</small> : null}
                </button>
                {activeTab === "read" && !notification.isLocked ? (
                  <div className="app-notification-delete-wrap">
                    <button type="button" className="app-notification-delete" onClick={() => onDeleteNotification(notification.id)} aria-label="Eliminar notificación">
                      <X size={14} />
                    </button>
                  </div>
                  
                ) : null}
              </article>
            ))}
            {visibleNotifications.length ? null : <p className="subtle-line app-notification-empty">{activeTab === "read" ? "No hay notificaciones leidas guardadas." : "No hay alertas sin leer."}</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}

const NAV_ITEMS = [
  { id: PAGE_DASHBOARD, label: "Dashboard", icon: BarChart3, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_CUSTOM_BOARDS, label: "Mis tableros", icon: LayoutDashboard, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_BOARD, label: "Creador de tableros", icon: ClipboardList, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_HISTORY, label: "Historial", icon: CalendarDays, roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_INVENTORY, label: "Inventario", icon: Package, roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_USERS, label: "Players", icon: Users, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

const ACTION_DEFINITIONS = [
  { id: "createWeek", label: "Crear nueva semana", category: "Operación semanal", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageCatalog", label: "Crear y editar catálogo", category: "Administración", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageWeeks", label: "Editar semanas", category: "Administración", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "managePermissions", label: "Editar permisos", category: "Permisos", defaultRoles: [ROLE_LEAD] },
  { id: "manageUsers", label: "Crear y editar players", category: "Players", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "deleteUsers", label: "Eliminar players", category: "Players", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "resetPasswords", label: "Restablecer contraseñas", category: "Players", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageInventory", label: "Crear y editar inventario base", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importInventory", label: "Importar inventario base", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageCleaningInventory", label: "Crear y editar insumos de limpieza", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importCleaningInventory", label: "Importar insumos de limpieza", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageOrderInventory", label: "Crear y editar insumos para pedidos", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importOrderInventory", label: "Importar insumos para pedidos", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveBoard", label: "Crear y editar tableros", category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBoard", label: "Eliminar tableros", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveTemplate", label: "Guardar plantillas", category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editTemplate", label: "Editar plantillas", category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteTemplate", label: "Eliminar plantillas", category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createBoardRow", label: "Agregar filas en Mis tableros", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "editFinishedBoardRow", label: "Editar filas terminadas", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "boardWorkflow", label: "Ejecutar flujo del tablero", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "duplicateBoard", label: "Duplicar tablero vacío", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "duplicateBoardWithRows", label: "Duplicar tablero con filas", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "exportBoardExcel", label: "Exportar tablero a Excel", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "previewBoardPdf", label: "Vista previa PDF", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "exportBoardPdf", label: "Exportar tablero a PDF", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

const BOARD_PERMISSION_ACTION_IDS = new Set([
  "createBoardRow",
  "editFinishedBoardRow",
  "boardWorkflow",
  "exportBoardExcel",
  "previewBoardPdf",
  "exportBoardPdf",
]);

const BOARD_PERMISSION_ACTIONS = ACTION_DEFINITIONS.filter((item) => BOARD_PERMISSION_ACTION_IDS.has(item.id));

const PAGE_ACTION_GROUPS = {
  [PAGE_CUSTOM_BOARDS]: ["createBoardRow", "editFinishedBoardRow", "boardWorkflow", "exportBoardExcel", "previewBoardPdf", "exportBoardPdf"],
  [PAGE_DASHBOARD]: [],
  [PAGE_BOARD]: ["manageCatalog", "saveBoard", "saveTemplate", "editTemplate", "deleteTemplate", "duplicateBoard", "duplicateBoardWithRows", "deleteBoard"],
  [PAGE_ADMIN]: [],
  [PAGE_HISTORY]: [],
  [PAGE_INVENTORY]: ["manageInventory", "importInventory", "manageCleaningInventory", "importCleaningInventory", "manageOrderInventory", "importOrderInventory"],
  [PAGE_USERS]: ["manageUsers", "deleteUsers", "resetPasswords", "managePermissions"],
};

const PERMISSION_PRESETS = [
  {
    id: "standard",
    label: "Operación estándar",
    description: "Mantiene el flujo normal con líderes y seniors administrando, y el resto operando tableros.",
  },
  {
    id: "supervised",
    label: "Supervisión controlada",
    description: "Deja la administración pesada en Lead, y acota a Senior y Ssr a seguimiento y ejecución.",
  },
  {
    id: "readonly",
    label: "Consulta supervisada",
    description: "Conserva lectura operativa y bloquea casi todas las acciones sensibles o de captura.",
  },
];

const RESPONSIBLE_VISUALS = {
  edith: { accent: "#2dd4df", soft: "#1fb9c5", badge: "#1f9bb3" },
  alejandro: { accent: "#25b8c8", soft: "#1c99b8", badge: "#2d7fb8" },
  jesus: { accent: "#4ade80", soft: "#34c759", badge: "#34a853" },
  barbara: { accent: "#ffb020", soft: "#f59e0b", badge: "#d68f00" },
  anahi: { accent: "#ef4444", soft: "#dc2626", badge: "#cf3d3d" },
  default: { accent: "#60a5fa", soft: "#3b82f6", badge: "#4f8adf" },
};

const ROLE_PERMISSION_MATRIX = {
  [ROLE_LEAD]: {
    pages: [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_HISTORY, PAGE_INVENTORY, PAGE_USERS],
    actions: ACTION_DEFINITIONS.map((item) => item.id),
  },
  [ROLE_SR]: {
    pages: [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_HISTORY, PAGE_INVENTORY, PAGE_USERS],
    actions: [
      "createWeek",
      "manageCatalog",
      "manageWeeks",
      "manageUsers",
      "deleteUsers",
      "resetPasswords",
      "manageInventory",
      "importInventory",
      "manageCleaningInventory",
      "importCleaningInventory",
      "manageOrderInventory",
      "importOrderInventory",
      "saveBoard",
      "deleteBoard",
      "saveTemplate",
      "editTemplate",
      "deleteTemplate",
      "createBoardRow",
      "editFinishedBoardRow",
      "boardWorkflow",
      "duplicateBoard",
      "duplicateBoardWithRows",
      "exportBoardExcel",
      "previewBoardPdf",
      "exportBoardPdf",
    ],
  },
  [ROLE_SSR]: {
    pages: [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_USERS],
    actions: [
      "manageUsers",
      "createBoardRow",
      "editFinishedBoardRow",
      "boardWorkflow",
      "exportBoardExcel",
      "previewBoardPdf",
      "exportBoardPdf",
    ],
  },
  [ROLE_JR]: {
    pages: [PAGE_CUSTOM_BOARDS],
    actions: ["createBoardRow", "boardWorkflow"],
  },
};

const KPI_STYLES = {
  cyan: { iconBg: "#53dde5", iconColor: "#178e94" },
  green: { iconBg: "#58d88d", iconColor: "#20894d" },
  red: { iconBg: "#ff5f5f", iconColor: "#bf2f2f" },
  lime: { iconBg: "#56d97a", iconColor: "#238343" },
  amber: { iconBg: "#ffbf47", iconColor: "#b87800" },
  slate: { iconBg: "#eef1f7", iconColor: "#8a94a6" },
};

function buildDefaultPermissions() {
  return {
    version: PERMISSION_SCHEMA_VERSION,
    pages: Object.fromEntries(NAV_ITEMS.map((item) => [
      item.id,
      {
        roles: USER_ROLES.filter((role) => (ROLE_PERMISSION_MATRIX[role]?.pages || []).includes(item.id)),
        userIds: [],
        departments: [],
      },
    ])),
    actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [
      item.id,
      {
        roles: USER_ROLES.filter((role) => (ROLE_PERMISSION_MATRIX[role]?.actions || []).includes(item.id)),
        userIds: [],
        departments: [],
      },
    ])),
  };
}

function hasExplicitOverrideValues(override) {
  if (!override) return false;
  const pageValues = Object.values(override.pages ?? EMPTY_OBJECT);
  const actionValues = Object.values(override.actions ?? EMPTY_OBJECT);
  return pageValues.concat(actionValues).some((value) => typeof value === "boolean");
}

function remapPermissionsModel(permissions, users = []) {
  const defaults = buildDefaultPermissions();
  const knownUserIds = new Set((users || []).map((user) => user.id));
  const userById = new Map((users || []).map((user) => [user.id, user]));
  const nextOverrides = Object.fromEntries(Object.entries(permissions?.userOverrides ?? EMPTY_OBJECT)
    .filter(([userId]) => knownUserIds.has(userId))
    .filter(([userId]) => supportsManagedPermissionOverrides(userById.get(userId)?.role))
    .map(([userId, override]) => {
      const normalizedOverride = {
        pages: Object.fromEntries(NAV_ITEMS.map((item) => [item.id, typeof override?.pages?.[item.id] === "boolean" ? override.pages[item.id] : null])),
        actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, typeof override?.actions?.[item.id] === "boolean" ? override.actions[item.id] : null])),
      };
      return [userId, normalizedOverride];
    })
    .filter(([, override]) => hasExplicitOverrideValues(override)));

  return {
    version: PERMISSION_SCHEMA_VERSION,
    pages: Object.fromEntries(NAV_ITEMS.map((item) => [
      item.id,
      {
        roles: defaults.pages[item.id].roles,
        userIds: Array.isArray(permissions?.pages?.[item.id]?.userIds) ? permissions.pages[item.id].userIds.filter((userId) => knownUserIds.has(userId)) : [],
        departments: Array.isArray(permissions?.pages?.[item.id]?.departments) ? permissions.pages[item.id].departments.filter(Boolean) : [],
      },
    ])),
    actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [
      item.id,
      {
        roles: defaults.actions[item.id].roles,
        userIds: Array.isArray(permissions?.actions?.[item.id]?.userIds) ? permissions.actions[item.id].userIds.filter((userId) => knownUserIds.has(userId)) : [],
        departments: Array.isArray(permissions?.actions?.[item.id]?.departments) ? permissions.actions[item.id].departments.filter(Boolean) : [],
      },
    ])),
    userOverrides: nextOverrides,
  };
}

function normalizePermissionEntry(entry, fallbackRoles = []) {
  return {
    roles: Array.isArray(entry?.roles) ? entry.roles : fallbackRoles,
    userIds: Array.isArray(entry?.userIds) ? entry.userIds : [],
    departments: Array.isArray(entry?.departments) ? entry.departments : [],
  };
}

function normalizePermissions(permissions) {
  const defaults = buildDefaultPermissions();
  return {
    pages: Object.fromEntries(NAV_ITEMS.map((item) => [
      item.id,
      normalizePermissionEntry(permissions?.pages?.[item.id], defaults.pages[item.id].roles),
    ])),
    actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [
      item.id,
      normalizePermissionEntry(permissions?.actions?.[item.id], defaults.actions[item.id].roles),
    ])),
    userOverrides: Object.fromEntries(Object.entries(permissions?.userOverrides ?? EMPTY_OBJECT).map(([userId, override]) => [
      userId,
      {
        pages: Object.fromEntries(NAV_ITEMS.map((item) => [item.id, typeof override?.pages?.[item.id] === "boolean" ? override.pages[item.id] : null])),
        actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, typeof override?.actions?.[item.id] === "boolean" ? override.actions[item.id] : null])),
      },
    ])),
  };
}

function buildBoardPermissions(basePermissions, board = null) {
  const visibility = getNormalizedBoardVisibility(board);
  const visibilityUserIds = visibility.visibilityType === "all"
    ? []
    : Array.from(new Set([visibility.ownerId, ...visibility.accessUserIds].filter(Boolean)));
  return {
    isEnabled: false,
    visibility: {
      roles: [],
      userIds: visibilityUserIds,
      departments: visibility.visibilityType === "department" ? visibility.sharedDepartments : [],
    },
    actions: Object.fromEntries(BOARD_PERMISSION_ACTIONS.map((item) => [
      item.id,
      normalizePermissionEntry(basePermissions?.actions?.[item.id], item.defaultRoles),
    ])),
  };
}

function normalizeBoardPermissions(permissions, basePermissions, board = null) {
  const defaults = buildBoardPermissions(basePermissions, board);
  return {
    isEnabled: Boolean(permissions?.isEnabled),
    visibility: normalizePermissionEntry(permissions?.visibility, defaults.visibility.roles),
    actions: Object.fromEntries(BOARD_PERMISSION_ACTIONS.map((item) => [
      item.id,
      normalizePermissionEntry(permissions?.actions?.[item.id], defaults.actions[item.id].roles),
    ])),
  };
}

function buildPermissionsFromPreset(presetId) {
  const permissions = buildDefaultPermissions();

  if (presetId === "supervised") {
    permissions.pages[PAGE_USERS].roles = [ROLE_LEAD, ROLE_SR];
    permissions.pages[PAGE_INVENTORY].roles = [ROLE_LEAD, ROLE_SR];

    permissions.actions.manageCatalog.roles = [ROLE_LEAD];
    permissions.actions.manageWeeks.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.manageUsers.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.deleteUsers.roles = [ROLE_LEAD];
    permissions.actions.resetPasswords.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.manageInventory.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.importInventory.roles = [ROLE_LEAD];
    permissions.actions.manageCleaningInventory.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.importCleaningInventory.roles = [ROLE_LEAD];
    permissions.actions.manageOrderInventory.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.importOrderInventory.roles = [ROLE_LEAD];
    permissions.actions.saveBoard.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.deleteBoard.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.saveTemplate.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.editTemplate.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.deleteTemplate.roles = [ROLE_LEAD];
    permissions.actions.duplicateBoard.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.duplicateBoardWithRows.roles = [ROLE_LEAD];
    permissions.actions.exportBoardExcel.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.previewBoardPdf.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.exportBoardPdf.roles = [ROLE_LEAD, ROLE_SR];
  }

  if (presetId === "readonly") {
    permissions.pages[PAGE_USERS].roles = [ROLE_LEAD];
    permissions.pages[PAGE_INVENTORY].roles = [ROLE_LEAD, ROLE_SR];

    Object.keys(permissions.actions).forEach((actionId) => {
      permissions.actions[actionId].roles = [];
    });

    permissions.actions.previewBoardPdf.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.exportBoardExcel.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.exportBoardPdf.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.managePermissions.roles = [ROLE_LEAD];
  }

  return permissions;
}

function buildAuditEntry(currentUser, scope, message) {
  return {
    id: makeId("audit"),
    scope,
    message,
    userId: currentUser?.id || null,
    userName: currentUser?.name || "Sistema",
    createdAt: new Date().toISOString(),
  };
}

function appendAuditLog(currentState, entry) {
  return {
    ...currentState,
    auditLog: [entry].concat(currentState.auditLog || []).slice(0, 120),
  };
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? EMPTY_OBJECT),
    },
    ...options,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const error = new Error(errorPayload.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function isSessionRequiredError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.status === 401 || (error?.status === 400 && message.includes("sesi"));
}

function applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus) {
  skipNextSyncRef.current = true;
  const normalizedState = normalizeWarehouseState(remoteState);
  setState(normalizedState);
  setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
  setSyncStatus("Sincronizado");
  return normalizedState;
}

function createWarehouseEventSource() {
  return new EventSource(`${API_BASE_URL}/warehouse/events`, { withCredentials: true });
}

function buildLoginDirectoryFromState(state) {
  return {
    system: {
      masterBootstrapEnabled: Boolean(state?.system?.masterBootstrapEnabled),
      masterUsername: null,
      showBootstrapMasterHint: false,
    },
    demoUsers: [],
  };
}

function buildRouteQuery({ page, adminTab, selectedBoardId, selectedWeekId, selectedHistoryWeekId }) {
  const params = new URLSearchParams();
  if (adminTab && adminTab !== DEFAULT_ADMIN_TAB && page === PAGE_ADMIN) params.set("tab", adminTab);
  if (selectedBoardId && page === PAGE_CUSTOM_BOARDS) params.set("board", selectedBoardId);
  if (selectedHistoryWeekId && page === PAGE_HISTORY) params.set("history", selectedHistoryWeekId);
  return params.toString();
}

function buildRoutePath(page) {
  const pageSlug = PAGE_ROUTE_SLUGS[page] || PAGE_ROUTE_SLUGS[PAGE_DASHBOARD];
  return `/${pageSlug}`;
}

function normalizeAdminTab(value) {
  return value === "weeks" ? "weeks" : DEFAULT_ADMIN_TAB;
}

function normalizeActivityFrequency(value) {
  const normalizedValue = String(value || "").trim();
  return ACTIVITY_FREQUENCY_LABELS[normalizedValue] ? normalizedValue : "weekly";
}

function getActivityFrequencyLabel(value) {
  return ACTIVITY_FREQUENCY_LABELS[normalizeActivityFrequency(value)] || ACTIVITY_FREQUENCY_LABELS.weekly;
}

function normalizeCatalogItemRecord(item = {}) {
  return {
    ...item,
    frequency: normalizeActivityFrequency(item.frequency),
    category: String(item.category || "General").trim() || "General",
  };
}

function buildWeekActivitiesFromCatalogItem(weekId, item, weekStart, responsibleId) {
  const offsets = ACTIVITY_FREQUENCY_DAY_OFFSETS[normalizeActivityFrequency(item.frequency)] || ACTIVITY_FREQUENCY_DAY_OFFSETS.weekly;
  return offsets.map((dayOffset) => ({
    id: makeId("act"),
    weekId,
    catalogActivityId: item.id,
    responsibleId: responsibleId || null,
    status: STATUS_PENDING,
    activityDate: isoAt(addDays(weekStart, dayOffset), 8, 0),
    startTime: null,
    endTime: null,
    accumulatedSeconds: 0,
    lastResumedAt: null,
    customName: item.name,
  }));
}

function isoAt(date, hours, minutes) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function isStrongPassword(value) {
  const password = String(value || "");
  return password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function isTemporaryPassword(value) {
  return String(value || "").trim().length >= TEMPORARY_PASSWORD_MIN_LENGTH;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

function getBoardWeekStart(date) {
  const base = startOfWeek(date);
  return new Date(date).getDay() === 0 ? addDays(base, 7) : base;
}

function getBoardWeekEnd(date) {
  return addDays(getBoardWeekStart(date), 5);
}

function formatBoardWeekKey(date) {
  const target = getBoardWeekStart(date);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function parseBoardWeekKey(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : getBoardWeekStart(parsed);
}

function getBoardWeekLabel(value) {
  const weekStart = parseBoardWeekKey(value) || getBoardWeekStart(new Date(value || Date.now()));
  return `Semana ${formatDate(weekStart)} - ${formatDate(getBoardWeekEnd(weekStart))}`;
}

function normalizeBoardWeeklyCycle(cycle, referenceDate = new Date()) {
  const weekStart = getBoardWeekStart(referenceDate);
  const activeWeekKey = String(cycle?.activeWeekKey || "").trim() || formatBoardWeekKey(weekStart);
  const parsedStart = parseBoardWeekKey(activeWeekKey) || weekStart;
  return {
    activeWeekKey: formatBoardWeekKey(parsedStart),
    activeWeekStartDate: cycle?.activeWeekStartDate || parsedStart.toISOString(),
    activeWeekEndDate: cycle?.activeWeekEndDate || getBoardWeekEnd(parsedStart).toISOString(),
    updatedAt: cycle?.updatedAt || new Date().toISOString(),
  };
}

function withDefaultBoardSettings(settings) {
  const resolvedSettings = settings && typeof settings === "object" ? settings : undefined;
  const operationalContextType = normalizeBoardOperationalContextType(resolvedSettings?.operationalContextType);
  const operationalContextOptions = normalizeBoardOperationalContextOptions(resolvedSettings?.operationalContextOptions, operationalContextType);
  return {
    showWorkflow: true,
    showMetrics: true,
    showAssignee: true,
    showDates: true,
    ...resolvedSettings,
    operationalContextType,
    operationalContextLabel: normalizeBoardOperationalContextLabel(resolvedSettings?.operationalContextLabel, operationalContextType),
    operationalContextOptions,
    operationalContextValue: normalizeBoardOperationalContextValue(resolvedSettings?.operationalContextValue, operationalContextType, operationalContextOptions),
  };
}

function cloneBoardRowSnapshot(row) {
  return {
    ...row,
    values: { ...(row?.values ?? EMPTY_OBJECT) },
  };
}

function normalizeBoardHistorySnapshot(snapshot) {
  const weekKey = String(snapshot?.weekKey || "").trim() || formatBoardWeekKey(new Date(snapshot?.startDate || Date.now()));
  const weekStart = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date(snapshot?.startDate || Date.now()));
  const visibility = getNormalizedBoardVisibility(snapshot);
  return {
    id: snapshot?.id || makeId("boardhist"),
    boardId: String(snapshot?.boardId || "").trim(),
    boardName: String(snapshot?.boardName || snapshot?.name || "Tablero").trim() || "Tablero",
    description: String(snapshot?.description || "").trim(),
    createdById: snapshot?.createdById ?? snapshot?.ownerId ?? null,
    ownerId: visibility.ownerId || snapshot?.createdById || null,
    visibilityType: visibility.visibilityType,
    sharedDepartments: visibility.sharedDepartments,
    accessUserIds: visibility.accessUserIds,
    weekKey,
    weekName: String(snapshot?.weekName || "").trim() || getBoardWeekLabel(weekKey),
    startDate: snapshot?.startDate || weekStart.toISOString(),
    endDate: snapshot?.endDate || getBoardWeekEnd(weekStart).toISOString(),
    archivedAt: snapshot?.archivedAt || new Date().toISOString(),
    settings: withDefaultBoardSettings(snapshot?.settings),
    fields: Array.isArray(snapshot?.fields)
      ? snapshot.fields.map((field) => ({ ...field, colorRules: field.colorRules || [] }))
      : [],
    rows: Array.isArray(snapshot?.rows) ? snapshot.rows.map((row) => cloneBoardRowSnapshot(row)) : [],
  };
}

function buildBoardHistorySnapshot(board, weekKey, archivedAt = new Date().toISOString()) {
  const weekStart = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date());
  return normalizeBoardHistorySnapshot({
    id: makeId("boardhist"),
    boardId: board.id,
    boardName: board.name,
    description: board.description || "",
    createdById: board.createdById,
    ownerId: board.ownerId,
    visibilityType: board.visibilityType,
    sharedDepartments: board.sharedDepartments || [],
    accessUserIds: board.accessUserIds || [],
    weekKey,
    weekName: getBoardWeekLabel(weekKey),
    startDate: weekStart.toISOString(),
    endDate: getBoardWeekEnd(weekStart).toISOString(),
    archivedAt,
    settings: { ...(board.settings ?? EMPTY_OBJECT) },
    fields: (board.fields || []).map((field) => ({ ...field, colorRules: field.colorRules || [] })),
    rows: (board.rows || []).map((row) => cloneBoardRowSnapshot(row)),
  });
}

function advanceBoardWeekKey(weekKey) {
  const current = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date());
  return formatBoardWeekKey(addDays(current, 7));
}

function applyBoardWeeklyCutToState(state, referenceDate = new Date()) {
  const currentWeekStart = getBoardWeekStart(referenceDate);
  const currentWeekKey = formatBoardWeekKey(currentWeekStart);
  const normalizedCycle = normalizeBoardWeeklyCycle(state?.boardWeeklyCycle, referenceDate);
  let activeWeekKey = normalizedCycle.activeWeekKey;
  let nextBoards = (state?.controlBoards || []).map((board) => ({ ...board, rows: Array.isArray(board.rows) ? board.rows : [] }));
  let nextHistory = Array.isArray(state?.boardWeekHistory) ? [...state.boardWeekHistory] : [];
  let changed = false;

  while (activeWeekKey < currentWeekKey) {
    const archivedAt = new Date().toISOString();
    const existingKeys = new Set(nextHistory.map((snapshot) => `${snapshot.boardId}|${snapshot.weekKey}`));
    nextBoards.forEach((board) => {
      const snapshotKey = `${board.id}|${activeWeekKey}`;
      if (existingKeys.has(snapshotKey)) return;
      nextHistory.push(buildBoardHistorySnapshot(board, activeWeekKey, archivedAt));
      existingKeys.add(snapshotKey);
      changed = true;
    });
    nextBoards = nextBoards.map((board) => ({ ...board, rows: [] }));
    activeWeekKey = advanceBoardWeekKey(activeWeekKey);
  }

  const nextCycle = {
    activeWeekKey: currentWeekKey,
    activeWeekStartDate: currentWeekStart.toISOString(),
    activeWeekEndDate: getBoardWeekEnd(currentWeekStart).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!changed && normalizedCycle.activeWeekKey === nextCycle.activeWeekKey) {
    return { state, changed: false };
  }

  return {
    changed: true,
    state: {
      ...state,
      controlBoards: nextBoards,
      boardWeekHistory: nextHistory,
      boardWeeklyCycle: nextCycle,
    },
  };
}

function startOfMonth(date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfMonth(date) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + 1, 0);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfFortnight(date) {
  const next = new Date(date);
  next.setDate(next.getDate() <= 15 ? 1 : 16);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfFortnight(date) {
  const next = startOfFortnight(date);
  if (next.getDate() === 1) {
    next.setDate(15);
  } else {
    next.setMonth(next.getMonth() + 1, 0);
  }
  next.setHours(23, 59, 59, 999);
  return next;
}

function getDashboardPeriodTypeLabel(periodType) {
  if (periodType === "fortnight") return "Quincena";
  if (periodType === "month") return "Mes";
  return "Semana";
}

function getDashboardPeriodRange(dateValue, periodType) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  if (periodType === "month") {
    return { start: startOfMonth(date), end: endOfMonth(date) };
  }
  if (periodType === "fortnight") {
    return { start: startOfFortnight(date), end: endOfFortnight(date) };
  }
  return { start: startOfWeek(date), end: endOfWeek(date) };
}

function getDashboardPeriodKey(dateValue, periodType) {
  const range = getDashboardPeriodRange(dateValue, periodType);
  if (!range) return "";
  return range.start.toISOString().slice(0, 10);
}

function formatDateRangeCompact(start, end) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDashboardPeriodLabel(periodKey, periodType) {
  if (!periodKey) return "Sin periodo";
  const range = getDashboardPeriodRange(periodKey, periodType);
  if (!range) return "Sin periodo";
  if (periodType === "month") {
    return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(range.start);
  }
  if (periodType === "fortnight") {
    const halfLabel = range.start.getDate() === 1 ? "1ra quincena" : "2da quincena";
    return `${halfLabel} · ${new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(range.start)}`;
  }
  return `Semana · ${formatDateRangeCompact(range.start, range.end)}`;
}

function getDashboardFilterStartDate(dateValue) {
  if (!dateValue) return null;
  const next = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(next.getTime()) ? null : next;
}

function getDashboardFilterEndDate(dateValue) {
  if (!dateValue) return null;
  const next = new Date(`${dateValue}T23:59:59.999`);
  return Number.isNaN(next.getTime()) ? null : next;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return `${formatDate(value)} · ${formatTime(value)}`;
}

function formatDurationClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${remainder}`;
}

function formatMinutes(value) {
  if (!Number.isFinite(value)) return "0 min";
  return `${value.toFixed(1)} min`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function formatMetricNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

function getAuditPeriodMs(period) {
  if (period === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (period === "30d") return 30 * 24 * 60 * 60 * 1000;
  return null;
}

function normalizeKey(value) {
  return (value || "")
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildPlayerAccessBase(value, fallback = "player") {
  const normalized = normalizeKey(value)
    .replaceAll(/[^a-z0-9\s._-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(".")
    .replaceAll(/\.+/g, ".")
    .replaceAll(/^\.+|\.+$/g, "");

  return normalized || fallback;
}

function buildUniquePlayerAccess(value, existingUsers = [], excludedUserId = null, fallback = "player") {
  const base = buildPlayerAccessBase(value, fallback);
  const usedValues = new Set(
    (existingUsers || [])
      .filter((user) => user?.id !== excludedUserId)
      .map((user) => normalizeKey(user?.email || user?.username || ""))
      .filter(Boolean),
  );

  let candidate = base;
  let suffix = 2;
  while (usedValues.has(normalizeKey(candidate))) {
    candidate = `${base}.${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function getIshikawaCategory(label) {
  const normalizedLabel = normalizeKey(label);

  if (!normalizedLabel) {
    return "Gestion";
  }

  if (["material", "insumo", "inventario", "stock", "surtido", "faltante", "abasto", "consumible", "refaccion"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Materiales";
  }

  if (["equipo", "maquina", "montacarga", "herramienta", "impresora", "sistema", "software", "tablet", "scanner", "mantenimiento"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Maquinaria y sistemas";
  }

  if (["operador", "player", "usuario", "personal", "ausencia", "turno", "capacitacion", "mano de obra", "responsable"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Mano de obra";
  }

  if (["proceso", "metodo", "flujo", "arranque", "espera", "autorizacion", "configuracion", "cambio", "prioridad", "planeacion"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Metodo";
  }

  if (["calidad", "medicion", "registro", "validacion", "conteo", "auditoria", "captura", "revision", "inspeccion"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Medicion y control";
  }

  if (["area", "ruta", "rampa", "trafico", "espacio", "seguridad", "limpieza", "ambiente", "entorno", "clima", "nave"].some((keyword) => normalizedLabel.includes(keyword))) {
    return "Entorno";
  }

  return "Gestion";
}

function normalizeImportHeader(value) {
  return normalizeKey(value).replaceAll(/[^a-z0-9]/g, "");
}

function normalizeMeridiemHour(hourValue, meridiem) {
  if (meridiem === "pm") {
    return hourValue === 12 ? 12 : hourValue + 12;
  }

  return hourValue === 12 ? 0 : hourValue;
}

function normalizeTimeValue24h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;

  const compact = raw.toLowerCase().replaceAll(/\s+/g, "").replaceAll(".", "");
  const ampmMatch = /^(\d{1,2}):(\d{2})(am|pm)$/.exec(compact);
  if (ampmMatch) {
    const hourValue = Number.parseInt(ampmMatch[1], 10);
    const minuteValue = Number.parseInt(ampmMatch[2], 10);
    if (Number.isFinite(hourValue) && Number.isFinite(minuteValue)) {
      const normalizedHour = normalizeMeridiemHour(hourValue, ampmMatch[3]);
      return `${String(Math.max(0, Math.min(23, normalizedHour))).padStart(2, "0")}:${String(Math.max(0, Math.min(59, minuteValue))).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  return raw;
}

function isEmptyRuleValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function parseComparableNumber(value) {
  if (isEmptyRuleValue(value)) return null;
  const parsed = Number(String(value).replaceAll(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseComparableDate(value) {
  if (isEmptyRuleValue(value)) return null;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function compareRuleValues(left, right) {
  const leftNumber = parseComparableNumber(left);
  const rightNumber = parseComparableNumber(right);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber - rightNumber;
  }

  const leftDate = parseComparableDate(left);
  const rightDate = parseComparableDate(right);
  if (leftDate !== null && rightDate !== null) {
    return leftDate - rightDate;
  }

  return normalizeKey(left).localeCompare(normalizeKey(right), "es", { numeric: true, sensitivity: "base" });
}

function parseRuleValueList(value) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeKey(item))
    .filter(Boolean);
}

function isTruthyRuleValue(value) {
  const normalized = normalizeKey(value);
  return ["si", "sí", "true", "1", "verdadero", "activo"].includes(normalized);
}

function isFalsyRuleValue(value) {
  const normalized = normalizeKey(value);
  return ["no", "false", "0", "falso", "inactivo"].includes(normalized);
}

function doesFieldColorRuleMatch(rule, value) {
  const normalizedValue = normalizeKey(value);
  const normalizedRuleValue = normalizeKey(rule.value);
  const valueList = parseRuleValueList(rule.value);

  switch (rule.operator) {
    case "isEmpty":
      return isEmptyRuleValue(value);
    case "isNotEmpty":
      return !isEmptyRuleValue(value);
    case "isTrue":
      return isTruthyRuleValue(value);
    case "isFalse":
      return isFalsyRuleValue(value);
    case "equals":
      return normalizedValue === normalizedRuleValue;
    case "notEquals":
      return normalizedValue !== normalizedRuleValue;
    case ">=":
      return compareRuleValues(value, rule.value) >= 0;
    case "<=":
      return compareRuleValues(value, rule.value) <= 0;
    case ">":
      return compareRuleValues(value, rule.value) > 0;
    case "<":
      return compareRuleValues(value, rule.value) < 0;
    case "contains":
      return normalizedValue.includes(normalizedRuleValue);
    case "notContains":
      return !normalizedValue.includes(normalizedRuleValue);
    case "startsWith":
      return normalizedValue.startsWith(normalizedRuleValue);
    case "endsWith":
      return normalizedValue.endsWith(normalizedRuleValue);
    case "inList":
      return valueList.includes(normalizedValue);
    case "notInList":
      return !valueList.includes(normalizedValue);
    default:
      return false;
  }
}

function getFieldColorRule(field, value) {
  return (field.colorRules || []).find((rule) => doesFieldColorRuleMatch(rule, value)) || null;
}

function formatInventoryLookupLabel(item) {
  if (!item) return "";
  return `${item.name} · ${item.presentation}`;
}

function isInventoryLookupFieldType(type) {
  return ["inventoryLookup", INVENTORY_LOOKUP_LOGISTICS_FIELD].includes(type);
}

function getInventoryLookupSourceFields(fields = [], excludedFieldIds = []) {
  const blockedIds = new Set((Array.isArray(excludedFieldIds) ? excludedFieldIds : [excludedFieldIds]).filter(Boolean));
  return (fields || []).filter((field) => field && isInventoryLookupFieldType(field.type) && !blockedIds.has(field.id));
}

function resolveInventoryPropertySourceFieldId(fields = [], preferredSourceFieldId = "", excludedFieldIds = []) {
  const sourceFields = getInventoryLookupSourceFields(fields, excludedFieldIds);
  if (!sourceFields.length) return "";
  if (preferredSourceFieldId && sourceFields.some((field) => field.id === preferredSourceFieldId)) {
    return preferredSourceFieldId;
  }
  return sourceFields.at(-1)?.id || "";
}

function getInventoryBundleEditableFields(fields, lookupFieldId) {
  return (fields || []).filter((field) => field.bundleParentId === lookupFieldId && field.bundleType === INVENTORY_LOOKUP_LOGISTICS_FIELD);
}

function inferInventoryBundleFieldType(fields, column) {
  if (column?.type !== "inventoryLookup") return column?.type ?? "text";
  const editableFields = getInventoryBundleEditableFields(fields, column.id);
  const editableRoles = new Set(editableFields.map((field) => field.bundleRole));
  if (editableRoles.has("piecesPerBox") && editableRoles.has("boxesPerPallet")) {
    return INVENTORY_LOOKUP_LOGISTICS_FIELD;
  }
  return column.type || "text";
}

function isBoardActivityListField(field) {
  return field?.type === BOARD_ACTIVITY_LIST_FIELD || (field?.type === "select" && field?.optionSource === "catalogByCategory");
}

function getBoardFieldDisplayType(fields, column) {
  if (isBoardActivityListField(column)) return BOARD_ACTIVITY_LIST_FIELD;
  return inferInventoryBundleFieldType(fields, column);
}

function buildInventoryBundleFields(draft, preservedLookupId = null) {
  const baseLabel = draft.fieldLabel.trim() || "Producto";
  const groupName = draft.groupName.trim() || "General";
  const colorRules = draft.colorValue
    ? [{ operator: draft.colorOperator, value: draft.colorValue, color: draft.colorBg, textColor: draft.colorText }]
    : [];
  const lookupId = preservedLookupId || makeId("fld");
  const lookupField = {
    id: lookupId,
    label: baseLabel,
    type: "inventoryLookup",
    optionSource: "manual",
    optionCatalogCategory: "",
    options: [],
    inventoryProperty: "code",
    sourceFieldId: null,
    formulaOperation: "add",
    formulaLeftFieldId: null,
    formulaRightFieldId: null,
    helpText: draft.fieldHelp.trim() || "Busca el artículo y deja listos los campos de piezas por caja y cajas por tarima para captura manual.",
    placeholder: draft.placeholder.trim() || "Buscar por nombre o presentación",
    defaultValue: "",
    width: draft.fieldWidth,
    widthPx: draft.fieldWidthPx ? Number(draft.fieldWidthPx) : null,
    required: draft.isRequired === "true",
    groupName,
    groupColor: draft.groupColor,
    colorRules,
  };

  if (draft.fieldType !== INVENTORY_LOOKUP_LOGISTICS_FIELD) {
    return [lookupField];
  }

  return [
    lookupField,
    {
      id: makeId("fld"),
      label: `${baseLabel} · Piezas por caja`,
      type: "number",
      optionSource: "manual",
      optionCatalogCategory: "",
      options: [],
      inventoryProperty: "code",
      sourceFieldId: null,
      formulaOperation: "add",
      formulaLeftFieldId: null,
      formulaRightFieldId: null,
      helpText: "Campo editable para capturar o ajustar cuántas piezas tiene cada caja.",
      placeholder: "Ej: 24",
      defaultValue: "",
      width: "sm",
      required: false,
      groupName,
      groupColor: draft.groupColor,
      colorRules: [],
      bundleParentId: lookupId,
      bundleType: INVENTORY_LOOKUP_LOGISTICS_FIELD,
      bundleRole: "piecesPerBox",
    },
    {
      id: makeId("fld"),
      label: `${baseLabel} · Cajas por tarima`,
      type: "number",
      optionSource: "manual",
      optionCatalogCategory: "",
      options: [],
      inventoryProperty: "code",
      sourceFieldId: null,
      formulaOperation: "add",
      formulaLeftFieldId: null,
      formulaRightFieldId: null,
      helpText: "Campo editable para capturar o ajustar cuántas cajas caben por tarima.",
      placeholder: "Ej: 30",
      defaultValue: "",
      width: "sm",
      required: false,
      groupName,
      groupColor: draft.groupColor,
      colorRules: [],
      bundleParentId: lookupId,
      bundleType: INVENTORY_LOOKUP_LOGISTICS_FIELD,
      bundleRole: "boxesPerPallet",
    },
  ];
}

function buildUpdatedDraftColumns(currentColumns, editingDraftColumnId, isBundleField, fieldsToInsert) {
  if (!editingDraftColumnId) {
    return currentColumns.concat(fieldsToInsert);
  }

  return currentColumns.flatMap((column) => {
    if (!isBundleField) {
      return column.id === editingDraftColumnId ? fieldsToInsert : [column];
    }

    const derivedIds = new Set(getInventoryBundleEditableFields(currentColumns, editingDraftColumnId).map((item) => item.id));
    if (column.id === editingDraftColumnId) return fieldsToInsert;
    if (derivedIds.has(column.id)) return [];
    return [column];
  });
}

function findInventoryItemByQuery(items, query) {
  const normalizedQuery = normalizeKey(query);
  if (!normalizedQuery) return null;

  return (items || []).find((item) => {
    const code = normalizeKey(item.code);
    const name = normalizeKey(item.name);
    const combined = normalizeKey(`${item.code} ${item.name}`);
    return code === normalizedQuery || name === normalizedQuery || combined === normalizedQuery;
  }) || null;
}

function createEmptyFieldDraft() {
  return {
    fieldLabel: "",
    fieldType: "text",
    optionSource: "manual",
    optionCatalogCategory: "",
    optionsText: "",
    inventoryProperty: "code",
    sourceFieldId: "",
    formulaOperation: "add",
    formulaLeftFieldId: "",
    formulaRightFieldId: "",
    colorOperator: ">=",
    colorValue: "",
    colorBg: "#dbeafe",
    colorText: "#1d4ed8",
    fieldHelp: "",
    placeholder: "",
    defaultValue: "",
    fieldWidth: "md",
    fieldWidthPx: "",
    isRequired: "false",
    groupName: "General",
    groupColor: "#e2f4ec",
  };
}

function createEmptyBoardDraft() {
  return {
    name: "",
    description: "",
    ownerId: "",
    visibilityType: "users",
    sharedDepartments: [],
    accessUserIds: [],
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      auxColumnsOrder: [...DEFAULT_BOARD_AUX_COLUMNS_ORDER],
      columnOrder: [],
      auxColumnWidths: {},
      operationalContextType: BOARD_OPERATIONAL_CONTEXT_NONE,
      operationalContextLabel: "",
      operationalContextOptions: [],
      operationalContextValue: "",
    },
    columns: [],
    ...createEmptyFieldDraft(),
  };
}

function cloneDraftColumns(fields) {
  return (fields || []).map((field) => ({
    ...field,
    options: Array.isArray(field.options) ? [...field.options] : [],
    colorRules: (field.colorRules || []).map((rule) => ({ ...rule })),
  }));
}

function createBoardDraftFromBoard(board) {
  return {
    name: board?.name || "",
    description: board?.description || "",
    ownerId: board?.ownerId || "",
    visibilityType: normalizeBoardVisibilityType(board?.visibilityType),
    sharedDepartments: normalizeBoardSharedDepartments(board?.sharedDepartments),
    accessUserIds: [...(board?.accessUserIds || [])],
    settings: {
      ...withDefaultBoardSettings(board?.settings),
      auxColumnsOrder: [...DEFAULT_BOARD_AUX_COLUMNS_ORDER],
    },
    columns: cloneDraftColumns(board?.fields || []),
    ...createEmptyFieldDraft(),
  };
}

function hasFieldDefaultValue(field) {
  return field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== "";
}

function getFieldDefaultPreviewValue(field) {
  if (!hasFieldDefaultValue(field)) return undefined;
  if (["number", "currency", "percentage"].includes(field.type)) return Number(field.defaultValue || 0);
  if (field.type === "boolean") return String(field.defaultValue).toLowerCase() === "si" ? "Si" : field.defaultValue;
  return field.defaultValue;
}

function getPreviewDateValue(variant) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + variant);
  return nextDate.toISOString().slice(0, 10);
}

function getDirectPreviewSeedValue(fieldType, currentUserId, variant) {
  const directPreviewValueByType = {
    status: variant === 0 ? STATUS_PENDING : STATUS_RUNNING,
    date: getPreviewDateValue(variant),
    time: variant === 0 ? "08:00" : "09:30",
    boolean: variant === 0 ? "Si" : "No",
    user: currentUserId || "",
  };
  return Object.hasOwn(directPreviewValueByType, fieldType) ? directPreviewValueByType[fieldType] : undefined;
}

function getTextPreviewSeedValue(field, variant) {
  if (field.type === "textarea") {
    return variant === 0 ? (field.placeholder || "Notas rápidas de ejemplo") : "Seguimiento validado en vista previa";
  }
  if (["text", "email", "phone", "url"].includes(field.type)) {
    return variant === 0 ? (field.placeholder || field.label || "Dato") : `${field.label || "Dato"} 2`;
  }
  return undefined;
}

function getTypedPreviewSeedValue(field, currentUserId, sampleInventory, variant) {
  if (isBoardActivityListField(field)) return variant === 0 ? "Actividad 1" : "Actividad 2";
  if (isInventoryLookupFieldType(field.type)) return sampleInventory?.id || "preview-inventory";

  if (["number", "currency", "percentage"].includes(field.type)) {
    return variant === 0 ? 12 : 18;
  }
  if (field.type === "select") {
    return field.options?.[variant] || field.options?.[0] || "Opción";
  }

  const directPreviewValue = getDirectPreviewSeedValue(field.type, currentUserId, variant);
  if (directPreviewValue !== undefined) return directPreviewValue;

  const textPreviewValue = getTextPreviewSeedValue(field, variant);
  if (textPreviewValue !== undefined) return textPreviewValue;

  return field.placeholder || field.label || "Dato";
}

function getPreviewFieldSeedValue(field, currentUserId, sampleInventory, variant = 0) {
  const defaultValue = getFieldDefaultPreviewValue(field);
  if (defaultValue !== undefined) return defaultValue;
  return getTypedPreviewSeedValue(field, currentUserId, sampleInventory, variant);
}

function buildPreviewRowValues(fields, currentUserId, inventoryItems, variant = 0) {
  const sampleInventory = (inventoryItems || [])[variant] || (inventoryItems || [])[0] || null;
  const values = {};

  fields.forEach((field) => {
    if (field.type === "inventoryProperty" || field.type === "formula") return;
    values[field.id] = getPreviewFieldSeedValue(field, currentUserId, sampleInventory, variant);
  });

  fields.forEach((field) => {
    if (field.type !== "inventoryProperty") return;
    const resolvedSourceFieldId = resolveInventoryPropertySourceFieldId(fields, field.sourceFieldId, field.id);
    const lookupId = values[resolvedSourceFieldId];
    const selectedInventory = (inventoryItems || []).find((item) => item.id === lookupId) || sampleInventory;
    values[field.id] = selectedInventory?.[field.inventoryProperty] ?? "Auto";
  });

  fields.forEach((field) => {
    if (field.type !== "formula") return;
    const left = Number(values[field.formulaLeftFieldId] || 0);
    const right = Number(values[field.formulaRightFieldId] || 0);
    if (field.formulaOperation === "subtract") {
      values[field.id] = left - right;
      return;
    }
    if (field.formulaOperation === "multiply") {
      values[field.id] = left * right;
      return;
    }
    if (field.formulaOperation === "divide") {
      values[field.id] = right === 0 ? 0 : Number((left / right).toFixed(2));
      return;
    }
    values[field.id] = left + right;
  });

  return values;
}

function buildBoardPreviewModel(baseBoard, currentUserId, inventoryItems) {
  const fields = cloneDraftColumns(baseBoard?.fields || []);
  const previewRows = fields.length
    ? [0, 1].map((variant) => ({
        id: `preview-row-${variant + 1}`,
        values: buildPreviewRowValues(fields, currentUserId, inventoryItems, variant),
        responsibleId: baseBoard?.ownerId || currentUserId || "",
        status: variant === 0 ? STATUS_PENDING : STATUS_RUNNING,
        startTime: null,
        endTime: null,
        accumulatedSeconds: variant === 0 ? 0 : 18 * 60,
        lastResumedAt: null,
        createdAt: new Date().toISOString(),
      }))
    : [];

  return {
    id: baseBoard?.id || "preview-board",
    name: baseBoard?.name || "Nuevo tablero",
    description: baseBoard?.description || "La vista previa se actualiza en tiempo real conforme agregas o ajustas componentes.",
    createdById: currentUserId || null,
    ownerId: baseBoard?.ownerId || currentUserId || "",
    visibilityType: normalizeBoardVisibilityType(baseBoard?.visibilityType),
    sharedDepartments: normalizeBoardSharedDepartments(baseBoard?.sharedDepartments),
    accessUserIds: [...(baseBoard?.accessUserIds || [])],
    settings: {
      ...withDefaultBoardSettings(baseBoard?.settings),
      auxColumnsOrder: [...DEFAULT_BOARD_AUX_COLUMNS_ORDER],
    },
    fields,
    rows: previewRows,
  };
}

function buildDraftPreviewBoard(draft, currentUserId, inventoryItems) {
  return buildBoardPreviewModel({
    name: draft?.name,
    description: draft?.description,
    ownerId: draft?.ownerId,
    visibilityType: draft?.visibilityType,
    sharedDepartments: draft?.sharedDepartments,
    accessUserIds: draft?.accessUserIds,
    settings: draft?.settings,
    fields: draft?.columns,
  }, currentUserId, inventoryItems);
}

function buildTemplatePreviewBoard(template, currentUserId, inventoryItems) {
  const fields = cloneBoardFields(getTemplateFields(template)).fields;
  return buildBoardPreviewModel({
    name: template?.name,
    description: template?.description,
    ownerId: currentUserId,
    settings: template?.settings,
    fields,
  }, currentUserId, inventoryItems);
}

function getTypedBoardPreviewValue(value, field, userMap, inventoryItems) {
  if (isInventoryLookupFieldType(field.type)) {
    const inventoryItem = (inventoryItems || []).find((item) => item.id === value);
    return inventoryItem ? `${inventoryItem.name} · ${inventoryItem.presentation}` : "Producto vinculado";
  }

  switch (field.type) {
    case "user":
      return userMap.get(value)?.name || "Player";
    case "date":
      return value ? formatDate(value) : null;
    case "currency":
      return value ? `$${Number(value).toFixed(2)}` : "$0.00";
    case "percentage":
      return value ? `${Number(value)}%` : "0%";
    case "boolean":
      return value === "Si" ? "Sí" : "No";
    default:
      return null;
  }
}

function formatBoardPreviewValue(value, field, userMap, inventoryItems) {
  const typedValue = getTypedBoardPreviewValue(value, field, userMap, inventoryItems);
  if (typedValue !== null) return typedValue;
  if (value === "" || value === null || value === undefined) {
    return field.placeholder || "Sin captura";
  }
  return String(value);
}

function getBoardFieldTypeDescription(type) {
  return BOARD_FIELD_TYPE_DETAILS[type] || "Componente flexible para construir tableros operativos.";
}

function renderBoardFieldLabel(label, required = false) {
  return (
    <>
      {label}
      {required ? <span className="required-mark" aria-hidden="true"> *</span> : null}
    </>
  );
}

function getProfileEditAvailabilityMessage(canBypassEditLimit, hasSelfEditAvailable) {
  if (canBypassEditLimit) return "Edición libre por nivel interno.";
  if (hasSelfEditAvailable) return "Disponible 1 corrección personal del perfil.";
  return "La siguiente corrección requiere apoyo de Senior o Lead.";
}

function getHeaderEyebrowText(page) {
  if (page === PAGE_DASHBOARD) return "Panel principal";
  if (page === PAGE_USERS) return "Players y permisos";
  return "Operación diaria";
}

function buildTemplateColumns(template) {
  const keyToId = new Map();
  const columns = (template.columns || []).map((column) => {
    const id = makeId("fld");
    keyToId.set(column.templateKey || column.id || column.label, id);
    return {
      id,
      label: column.label,
      type: column.type,
      optionSource: column.optionSource || "manual",
      optionCatalogCategory: column.optionCatalogCategory || "",
      options: column.options || [],
      inventoryProperty: column.inventoryProperty || "code",
      sourceFieldId: column.sourceFieldId || null,
      formulaOperation: column.formulaOperation || "add",
      formulaLeftFieldId: column.formulaLeftFieldId || null,
      formulaRightFieldId: column.formulaRightFieldId || null,
      helpText: column.helpText || "",
      placeholder: column.placeholder || "",
      defaultValue: column.defaultValue ?? "",
      width: column.width || "md",
      widthPx: column.widthPx ? Number(column.widthPx) : null,
      required: Boolean(column.required),
      groupName: column.groupName || "General",
      groupColor: column.groupColor || "#e2f4ec",
      colorRules: column.colorRules || [],
    };
  });

  return columns.map((column) => ({
    ...column,
    sourceFieldId: keyToId.get(column.sourceFieldId) || column.sourceFieldId,
    formulaLeftFieldId: keyToId.get(column.formulaLeftFieldId) || column.formulaLeftFieldId,
    formulaRightFieldId: keyToId.get(column.formulaRightFieldId) || column.formulaRightFieldId,
  }));
}

function cloneBoardFields(fields) {
  const keyToId = new Map();
  const clonedFields = (fields || []).map((field) => {
    const id = makeId("fld");
    keyToId.set(field.id, id);
    keyToId.set(field.templateKey || field.label, id);
    return {
      ...field,
      id,
      colorRules: field.colorRules || [],
    };
  });

  return clonedFields.map((field) => ({
    ...field,
    sourceFieldId: keyToId.get(field.sourceFieldId) || field.sourceFieldId,
    formulaLeftFieldId: keyToId.get(field.formulaLeftFieldId) || field.formulaLeftFieldId,
    formulaRightFieldId: keyToId.get(field.formulaRightFieldId) || field.formulaRightFieldId,
  }));
}

function cloneBoardFieldBundle(fields) {
  const keyToId = new Map();
  const clonedFields = (fields || []).map((field) => {
    const id = makeId("fld");
    keyToId.set(field.id, id);
    keyToId.set(field.templateKey || field.label, id);
    return {
      ...field,
      id,
      colorRules: field.colorRules || [],
    };
  });

  return {
    idMap: keyToId,
    fields: clonedFields.map((field) => ({
      ...field,
      sourceFieldId: keyToId.get(field.sourceFieldId) || field.sourceFieldId,
      formulaLeftFieldId: keyToId.get(field.formulaLeftFieldId) || field.formulaLeftFieldId,
      formulaRightFieldId: keyToId.get(field.formulaRightFieldId) || field.formulaRightFieldId,
    })),
  };
}

function getBoardTemplateCategory(template) {
  return template?.category || template?.columns?.[0]?.groupName || template?.fields?.[0]?.groupName || "Operación";
}

function getTemplateFields(template) {
  return template?.columns || template?.fields || [];
}

function getTemplateFieldGroups(template) {
  const groups = new Map();
  getTemplateFields(template).forEach((field) => {
    const key = field.groupName || "General";
    if (!groups.has(key)) {
      groups.set(key, {
        name: key,
        color: field.groupColor || "#e2f4ec",
        fields: [],
      });
    }
    groups.get(key).fields.push(field);
  });
  return Array.from(groups.values());
}

function getTemplateFieldDetail(field) {
  if (isBoardActivityListField(field)) {
    return `Lista: ${field.optionCatalogCategory || "Sin definir"} · cada actividad genera una fila del tablero`;
  }
  if (field.type === "select") {
    return field.optionSource === "manual"
      ? `Opciones: ${(field.options || []).join(", ") || "Sin opciones"}`
      : `Fuente: ${OPTION_SOURCE_TYPES.find((item) => item.value === field.optionSource)?.label || "Catálogo"}`;
  }
  if (field.type === "inventoryProperty") {
    return `Dato: ${INVENTORY_PROPERTIES.find((item) => item.value === field.inventoryProperty)?.label || field.inventoryProperty}`;
  }
  if (field.type === "formula") {
    return `Operación: ${FORMULA_OPERATIONS.find((item) => item.value === field.formulaOperation)?.label || field.formulaOperation}`;
  }
  if (field.type === "boolean") {
    return "Valores: Sí / No";
  }
  if (field.type === "status") {
    return "Estados: Pendiente, En curso, Pausado, Terminado";
  }
  return field.placeholder || field.helpText || "Configuración lista para capturar.";
}

function isBoardFieldValueFilled(value, fieldType) {
  if (["number", "currency", "percentage"].includes(fieldType)) return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
  if (fieldType === "boolean") return value === "Si" || value === "No";
  if (fieldType === "formula") return value !== null && value !== undefined;
  return String(value ?? "").trim() !== "";
}

function getBoardSectionGroups(board) {
  const groups = [];
  let current = null;

  getOrderedBoardColumns(board).forEach((column) => {
    const name = column.sectionName || "General";
    const color = column.sectionColor || "#e2f4ec";
    if (!current || current.name !== name || current.color !== color) {
      current = { name, color, span: 0 };
      groups.push(current);
    }
    current.span += 1;
  });

  return groups;
}

function mapColumnToFieldDraft(column, columns = []) {
  const primaryRule = column.colorRules?.[0] || {};
  return {
    ...createEmptyFieldDraft(),
    fieldLabel: column.label || "",
    fieldType: getBoardFieldDisplayType(columns, column),
    optionSource: column.optionSource || "manual",
    optionCatalogCategory: column.optionCatalogCategory || "",
    optionsText: Array.isArray(column.options) ? column.options.join(", ") : "",
    inventoryProperty: column.inventoryProperty || "code",
    sourceFieldId: column.sourceFieldId || "",
    formulaOperation: column.formulaOperation || "add",
    formulaLeftFieldId: column.formulaLeftFieldId || "",
    formulaRightFieldId: column.formulaRightFieldId || "",
    colorOperator: primaryRule.operator || ">=",
    colorValue: primaryRule.value || "",
    colorBg: primaryRule.color || "#dbeafe",
    colorText: primaryRule.textColor || "#1d4ed8",
    fieldHelp: column.helpText || "",
    placeholder: column.placeholder || "",
    defaultValue: column.defaultValue ?? "",
    fieldWidth: column.width || "md",
    fieldWidthPx: column.widthPx ? String(column.widthPx) : "",
    isRequired: column.required ? "true" : "false",
    groupName: column.groupName || "General",
    groupColor: column.groupColor || "#e2f4ec",
  };
}

function getBoardFieldDefaultValue(field, currentUserId) {
  if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== "") {
    if (["number", "currency", "percentage"].includes(field.type)) return Number(field.defaultValue || 0);
    if (field.type === "boolean") return String(field.defaultValue).toLowerCase() === "si" ? "Si" : field.defaultValue;
    return field.defaultValue;
  }

  if (field.type === "status") return STATUS_PENDING;
  if (field.type === "user") return currentUserId || "";
  if (field.type === "boolean") return "No";
  if (field.type === "date") return new Date().toISOString().slice(0, 10);
  if (field.type === "time") return "08:00";
  return "";
}

function toInventoryNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value || "")
    .trim()
    .replaceAll(",", ".")
    .replaceAll(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decodeCsvBuffer(buffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const hasReplacementChars = utf8.includes("\uFFFD");
  const hasMojibake = /Ã.|Â.|â./.test(utf8);

  if (!hasReplacementChars && !hasMojibake) {
    return utf8;
  }

  return new TextDecoder("windows-1252", { fatal: false }).decode(buffer);
}

function pushCsvRowIfNotEmpty(rows, currentRow, currentValue) {
  const nextRow = currentRow.concat(currentValue);
  if (nextRow.some((value) => String(value).trim() !== "")) {
    rows.push(nextRow);
  }
}

function isCsvRowBreak(character, isInsideQuotes) {
  return !isInsideQuotes && (character === "\n" || character === "\r");
}

function isCsvColumnBreak(character, isInsideQuotes) {
  return !isInsideQuotes && character === ",";
}

function consumeCsvCharacter(parserState, rows, character, nextCharacter) {
  if (character === '"') {
    if (parserState.isInsideQuotes && nextCharacter === '"') {
      parserState.currentValue += '"';
      return true;
    }
    parserState.isInsideQuotes = !parserState.isInsideQuotes;
    return false;
  }

  if (isCsvColumnBreak(character, parserState.isInsideQuotes)) {
    parserState.currentRow.push(parserState.currentValue);
    parserState.currentValue = "";
    return false;
  }

  if (isCsvRowBreak(character, parserState.isInsideQuotes)) {
    pushCsvRowIfNotEmpty(rows, parserState.currentRow, parserState.currentValue);
    parserState.currentRow = [];
    parserState.currentValue = "";
    return character === "\r" && nextCharacter === "\n";
  }

  parserState.currentValue += character;
  return false;
}

function parseCsvTextToObjects(text) {
  const rows = [];
  const parserState = {
    currentRow: [],
    currentValue: "",
    isInsideQuotes: false,
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    const shouldSkipNext = consumeCsvCharacter(parserState, rows, character, nextCharacter);
    if (shouldSkipNext) {
      index += 1;
    }
  }

  pushCsvRowIfNotEmpty(rows, parserState.currentRow, parserState.currentValue);

  if (!rows.length) return [];

  const headers = rows[0].map((header, index) => String(header || `columna_${index + 1}`).trim());
  return rows.slice(1).map((row) =>
    headers.reduce((accumulator, header, index) => {
      accumulator[header] = row[index] ?? "";
      return accumulator;
    }, {}),
  );
}

async function getExcelJsModule() {
  const module = await import("exceljs/dist/exceljs.min.js");
  return module.default || module;
}

function triggerBrowserDownload(buffer, fileName, mimeType) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeImportedText(value) {
  if (typeof value !== "string") return value;

  if (/Ã.|Â.|â./.test(value)) {
    try {
      const bytes = Uint8Array.from(value, (character) => character.codePointAt(0) || 0);
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return value;
    }
  }

  return value;
}

function mapInventoryImportRow(row, index) {
  const normalizedRow = Object.entries(row ?? EMPTY_OBJECT).reduce((accumulator, [key, value]) => {
    const alias = INVENTORY_IMPORT_FIELD_ALIASES[normalizeImportHeader(key)];
    if (alias) accumulator[alias] = sanitizeImportedText(value);
    return accumulator;
  }, {});

  const code = String(normalizedRow.code || "").trim();
  const name = String(normalizedRow.name || "").trim();
  const domain = normalizeInventoryDomain(normalizedRow.domain);
  const usesPresentation = inventoryDomainUsesPresentation(domain);
  const usesPackagingMetrics = inventoryDomainUsesPackagingMetrics(domain);

  if (!code || !name) return null;

  return {
    id: `import-${index + 1}`,
    code,
    name,
    domain,
    presentation: usesPresentation ? String(normalizedRow.presentation || "").trim() : "",
    piecesPerBox: usesPackagingMetrics ? toInventoryNumber(normalizedRow.piecesPerBox) : 0,
    boxesPerPallet: usesPackagingMetrics ? toInventoryNumber(normalizedRow.boxesPerPallet) : 0,
    stockUnits: toInventoryNumber(normalizedRow.stockUnits),
    minStockUnits: toInventoryNumber(normalizedRow.minStockUnits),
    storageLocation: String(normalizedRow.storageLocation || "").trim(),
    cleaningSite: normalizeCleaningSite(normalizedRow.cleaningSite),
    unitLabel: String(normalizedRow.unitLabel || "pzas").trim() || "pzas",
    activityCatalogIds: String(normalizedRow.activityCatalogIds || "").split(/[;,]/).map((entry) => entry.trim()).filter(Boolean),
    activityConsumptions: normalizeInventoryActivityConsumptions(normalizedRow.activityConsumptions, normalizedRow.activityCatalogIds, toInventoryNumber(normalizedRow.consumptionPerStart)),
    consumptionPerStart: toInventoryNumber(normalizedRow.consumptionPerStart),
  };
}

async function parseInventoryImportFile(file) {
  const buffer = await file.arrayBuffer();
  const isCsv = /\.csv$/i.test(file.name);
  let rows = [];

  if (isCsv) {
    rows = parseCsvTextToObjects(decodeCsvBuffer(buffer));
  } else {
    const ExcelJS = await getExcelJsModule();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const firstSheet = workbook.worksheets[0];

    if (!firstSheet) {
      throw new Error("No se encontró ninguna hoja en el archivo.");
    }

    const headerRow = firstSheet.getRow(1);
    const headers = [];
    const columnCount = headerRow.actualCellCount || headerRow.cellCount || firstSheet.columnCount || 0;

    for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
      headers.push(String(headerRow.getCell(columnIndex).text || `columna_${columnIndex}`).trim());
    }

    rows = [];
    for (let rowIndex = 2; rowIndex <= firstSheet.rowCount; rowIndex += 1) {
      const worksheetRow = firstSheet.getRow(rowIndex);
      const row = headers.reduce((accumulator, header, columnIndex) => {
        accumulator[header] = worksheetRow.getCell(columnIndex + 1).text || "";
        return accumulator;
      }, {});

      if (Object.values(row).some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }
    }
  }

  return rows
    .map((row, index) => mapInventoryImportRow(row, index))
    .filter(Boolean);
}

function excelColumnLettersToIndex(letters) {
  const normalized = String(letters || "").trim().toUpperCase();
  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    total = total * 26 + ((normalized.codePointAt(index) || 64) - 64);
  }
  return Math.max(0, total - 1);
}

function parseSimpleExcelFormula(formula) {
  const expression = String(formula || "").trim().replace(/^=/, "").replaceAll("$", "");
  if (!expression || expression.includes("!")) return null;
  const match = /^([A-Z]+)\d+\s*([+\-*/])\s*([A-Z]+)\d+$/i.exec(expression);
  if (!match) return null;
  return {
    leftColumnIndex: excelColumnLettersToIndex(match[1]),
    operator: match[2],
    rightColumnIndex: excelColumnLettersToIndex(match[3]),
  };
}

function normalizeArgbHex(colorValue) {
  const raw = String(colorValue || "").replace(/^#/, "").trim();
  if (!raw) return "";
  const normalized = raw.length === 8 ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "";
  return `#${normalized.toLowerCase()}`;
}

function getExcelCellColors(cell) {
  const fillColor = normalizeArgbHex(cell?.fill?.fgColor?.argb || cell?.fill?.bgColor?.argb);
  const textColor = normalizeArgbHex(cell?.font?.color?.argb);
  return {
    fillColor,
    textColor,
  };
}

function inferImportedFieldTypeFromSamples(samples) {
  const normalized = (samples || []).map((item) => String(item || "").trim()).filter(Boolean);
  if (!normalized.length) return { type: "text", options: [] };

  const isEmail = normalized.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  if (isEmail) return { type: "email", options: [] };

  const isUrl = normalized.every((value) => /^https?:\/\//i.test(value));
  if (isUrl) return { type: "url", options: [] };

  const isTime = normalized.every((value) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value));
  if (isTime) return { type: "time", options: [] };

  const phoneScore = normalized.filter((value) => /^\+?[\d\s()-]{8,}$/.test(value)).length / normalized.length;
  if (phoneScore >= 0.9) return { type: "phone", options: [] };

  const numericSamples = normalized.map((value) => Number(String(value).replaceAll(/[,$%\s]/g, ""))).filter((item) => Number.isFinite(item));
  const numericScore = numericSamples.length / normalized.length;

  if (numericScore >= 0.9) {
    const isPercentage = normalized.some((value) => String(value).includes("%"));
    const isCurrency = normalized.some((value) => /[$€£]/.test(value));
    if (isPercentage) return { type: "percentage", options: [] };
    if (isCurrency) return { type: "currency", options: [] };
    return { type: "number", options: [] };
  }

  const dateScore = normalized.filter((value) => !Number.isNaN(new Date(value).getTime())).length / normalized.length;
  if (dateScore >= 0.8) return { type: "date", options: [] };

  const uniqueValues = Array.from(new Set(normalized));
  if (uniqueValues.length >= 2 && uniqueValues.length <= 12 && normalized.length >= 3) {
    return { type: "select", options: uniqueValues };
  }

  return { type: "text", options: [] };
}

function getWorksheetHeaders(worksheet) {
  const headerRow = worksheet.getRow(1);
  const columnCount = headerRow.actualCellCount || headerRow.cellCount || worksheet.columnCount || 0;
  if (!columnCount) {
    throw new Error("El archivo no tiene encabezados en la primera fila.");
  }

  const headers = [];
  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
    headers.push(String(headerRow.getCell(columnIndex).text || `Campo ${columnIndex}`).trim() || `Campo ${columnIndex}`);
  }

  return headers;
}

function collectBoardStructureCellData(cell, targetIndex, headers, rowByHeader, sampleValuesByColumn, formulaByColumn, styleHintByColumn) {
  const raw = cell.value;
  const textValue = String(cell.text || "").trim();
  const { fillColor, textColor } = getExcelCellColors(cell);

  if (!formulaByColumn[targetIndex] && raw && typeof raw === "object" && typeof raw.formula === "string") {
    formulaByColumn[targetIndex] = raw.formula;
  }
  if (textValue) {
    sampleValuesByColumn[targetIndex].push(textValue);
  }
  if (!styleHintByColumn[targetIndex].value && textValue && (fillColor || textColor)) {
    styleHintByColumn[targetIndex] = { value: textValue, fillColor, textColor };
  }

  rowByHeader[headers[targetIndex]] = textValue;
}

function collectBoardStructureSheetData(worksheet, headers) {
  const sampleValuesByColumn = headers.map(() => []);
  const formulaByColumn = headers.map(() => "");
  const styleHintByColumn = headers.map(() => ({ value: "", fillColor: "", textColor: "" }));
  const importedRows = [];

  for (let rowIndex = 2; rowIndex <= Math.min(worksheet.rowCount, 60); rowIndex += 1) {
    const worksheetRow = worksheet.getRow(rowIndex);
    const rowByHeader = {};

    for (let columnIndex = 1; columnIndex <= headers.length; columnIndex += 1) {
      const cell = worksheetRow.getCell(columnIndex);
      const targetIndex = columnIndex - 1;
      collectBoardStructureCellData(cell, targetIndex, headers, rowByHeader, sampleValuesByColumn, formulaByColumn, styleHintByColumn);
    }

    if (Object.values(rowByHeader).some((value) => String(value || "").trim() !== "")) {
      importedRows.push(rowByHeader);
    }
  }

  return { sampleValuesByColumn, formulaByColumn, styleHintByColumn, importedRows };
}

function buildImportedColorRules(styleHint) {
  if (!styleHint?.value || !(styleHint?.fillColor || styleHint?.textColor)) {
    return [];
  }

  return [{
    operator: "equals",
    value: styleHint.value,
    color: styleHint.fillColor || "#fee2e2",
    textColor: styleHint.textColor || "#111827",
  }];
}

function buildImportedBoardFields(headers, formulaByColumn, sampleValuesByColumn, styleHintByColumn, sheetName) {
  const formulaOperationMap = { "+": "add", "-": "subtract", "*": "multiply", "/": "divide" };
  const pendingFormulaMetaByFieldId = new Map();
  const unsupportedFormulaColumns = [];
  const unsupportedFormulaDetails = [];
  let supportedFormulaCount = 0;

  const fields = headers.map((header, index) => {
    const sourceFormula = String(formulaByColumn[index] || "").trim();
    const formulaMeta = parseSimpleExcelFormula(sourceFormula);
    const hasUnsupportedFormula = Boolean(sourceFormula) && !formulaMeta;
    const inferred = formulaMeta ? { type: "formula", options: [] } : inferImportedFieldTypeFromSamples(sampleValuesByColumn[index]);
    const fieldId = makeId("fld");

    if (formulaMeta) {
      supportedFormulaCount += 1;
      pendingFormulaMetaByFieldId.set(fieldId, {
        leftColumnIndex: formulaMeta.leftColumnIndex,
        rightColumnIndex: formulaMeta.rightColumnIndex,
        operation: formulaOperationMap[formulaMeta.operator] || "add",
      });
    } else if (hasUnsupportedFormula) {
      unsupportedFormulaColumns.push(header);
      unsupportedFormulaDetails.push({ header, formula: sourceFormula, columnIndex: index });
    }

    return {
      id: fieldId,
      label: header,
      type: inferred.type,
      optionSource: "manual",
      optionCatalogCategory: "",
      options: inferred.options,
      inventoryProperty: "code",
      sourceFieldId: null,
      formulaOperation: "add",
      formulaLeftFieldId: null,
      formulaRightFieldId: null,
      helpText: hasUnsupportedFormula
        ? `Importado desde Excel (${sheetName}). La fórmula original no es compatible para conversión automática; configúrala manualmente en el Studio.`
        : `Importado desde Excel (${sheetName}).`,
      placeholder: "",
      defaultValue: "",
      width: inferred.type === "textarea" ? "lg" : "md",
      required: false,
      groupName: "Importado",
      groupColor: "#dbeafe",
      colorRules: buildImportedColorRules(styleHintByColumn[index]),
    };
  });

  fields.forEach((field) => {
    if (field.type !== "formula") return;
    const meta = pendingFormulaMetaByFieldId.get(field.id);
    if (!meta) return;
    field.formulaOperation = meta.operation;
    field.formulaLeftFieldId = fields[meta.leftColumnIndex]?.id || null;
    field.formulaRightFieldId = fields[meta.rightColumnIndex]?.id || null;
  });

  return { fields, supportedFormulaCount, unsupportedFormulaColumns, unsupportedFormulaDetails };
}

async function parseBoardStructureImportFile(file) {
  const buffer = await file.arrayBuffer();
  const ExcelJS = await getExcelJsModule();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const firstSheet = workbook.worksheets[0];

  if (!firstSheet) {
    throw new Error("No se encontró ninguna hoja en el archivo.");
  }

  const headers = getWorksheetHeaders(firstSheet);
  const { sampleValuesByColumn, formulaByColumn, styleHintByColumn, importedRows } = collectBoardStructureSheetData(firstSheet, headers);
  const {
    fields: importedFields,
    supportedFormulaCount,
    unsupportedFormulaColumns,
    unsupportedFormulaDetails,
  } = buildImportedBoardFields(headers, formulaByColumn, sampleValuesByColumn, styleHintByColumn, firstSheet.name);

  return {
    boardName: String(firstSheet.name || file.name.replace(/\.[^.]+$/, "")).trim() || "Tablero importado",
    fields: importedFields,
    rows: importedRows,
    supportedFormulaCount,
    unsupportedFormulaColumns,
    unsupportedFormulaDetails,
    notes: [
      "El formato condicional de Excel (por ejemplo, celdas en rojo) no se importa automáticamente.",
      "Las fórmulas entre hojas o funciones avanzadas deben reconfigurarse manualmente en el Studio.",
    ],
  };
}

function buildImportedBoardRowValuesPatch(importedRow, columns, visibleUsers, inventoryItems, yesValues) {
  const valuesPatch = {};

  (columns || []).forEach((field) => {
    const raw = importedRow?.[field.label];
    if (raw === undefined || raw === null || String(raw).trim() === "") return;

    if (["number", "currency", "percentage", "formula"].includes(field.type)) {
      const parsed = Number(String(raw).replaceAll(/[,$%\s]/g, ""));
      valuesPatch[field.id] = Number.isFinite(parsed) ? parsed : 0;
      return;
    }

    if (field.type === "boolean") {
      valuesPatch[field.id] = yesValues.has(String(raw).trim().toLowerCase()) ? "Si" : "No";
      return;
    }

    if (field.type === "user") {
      const match = visibleUsers.find((user) => normalizeKey(user.name) === normalizeKey(raw));
      valuesPatch[field.id] = match?.id || "";
      return;
    }

    if (isInventoryLookupFieldType(field.type)) {
      const item = findInventoryItemByQuery(inventoryItems || [], raw);
      valuesPatch[field.id] = item?.id || "";
      return;
    }

    valuesPatch[field.id] = String(raw);
  });

  return valuesPatch;
}

function buildBoardSavePayload(controlBoardDraft, ownerId) {
  const normalizedColumnOrder = getNormalizedBoardColumnOrder({
    fields: controlBoardDraft.columns || [],
    settings: controlBoardDraft.settings ?? EMPTY_OBJECT,
  });
  const visibilityType = normalizeBoardVisibilityType(controlBoardDraft.visibilityType);

  return {
    normalizedColumnOrder,
    payload: {
      name: controlBoardDraft.name.trim(),
      description: controlBoardDraft.description.trim(),
      ownerId,
      visibilityType,
      sharedDepartments: visibilityType === "department" ? normalizeBoardSharedDepartments(controlBoardDraft.sharedDepartments) : [],
      accessUserIds: visibilityType === "users" ? normalizeBoardAccessUserIds(controlBoardDraft.accessUserIds, ownerId) : [],
      settings: {
        ...withDefaultBoardSettings(controlBoardDraft.settings),
        columnOrder: normalizedColumnOrder,
      },
      columns: sortBoardFieldsByColumnOrder(cloneDraftColumns(controlBoardDraft.columns || []), normalizedColumnOrder),
    },
  };
}

function formatBoardExportFieldValue(field, value, inventoryItems, userMap) {
  if (field.type === "inventoryLookup") {
    const inventoryItem = (inventoryItems || []).find((item) => item.id === value);
    return inventoryItem ? `${inventoryItem.name} · ${inventoryItem.presentation}` : "";
  }
  if (field.type === "user") {
    return userMap.get(value)?.name || "";
  }
  return value;
}

async function downloadInventoryTemplateFile() {
  const ExcelJS = await getExcelJsModule();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inventario");

  worksheet.columns = [
    { header: "codigo", key: "codigo", width: 18 },
    { header: "dominio", key: "dominio", width: 18 },
    { header: "nombre", key: "nombre", width: 28 },
    { header: "presentacion", key: "presentacion", width: 20 },
    { header: "piezas_por_caja", key: "piezas_por_caja", width: 18 },
    { header: "cajas_por_tarima", key: "cajas_por_tarima", width: 18 },
    { header: "stock_actual", key: "stock_actual", width: 18 },
    { header: "stock_minimo", key: "stock_minimo", width: 18 },
    { header: "sede_limpieza", key: "sede_limpieza", width: 18 },
    { header: "ubicacion", key: "ubicacion", width: 24 },
    { header: "unidad", key: "unidad", width: 14 },
    { header: "actividad_catalogo_ids", key: "actividad_catalogo_ids", width: 28 },
    { header: "consumo_por_inicio", key: "consumo_por_inicio", width: 20 },
    { header: "consumos_por_actividad", key: "consumos_por_actividad", width: 32 },
  ];
  worksheet.addRow({
    codigo: "LIMP-001",
    dominio: "cleaning",
    nombre: "Detergente industrial",
    presentacion: "Bidon 20L",
    piezas_por_caja: 4,
    cajas_por_tarima: 30,
    stock_actual: 18,
    stock_minimo: 8,
    sede_limpieza: "C3",
    ubicacion: "Cuarto de limpieza",
    unidad: "bidones",
    actividad_catalogo_ids: "cat-piso;cat-oficinas",
    consumo_por_inicio: 1,
    consumos_por_actividad: "cat-piso:1;cat-oficinas:2",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerBrowserDownload(buffer, "plantilla-inventario.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function getResponsibleVisual(userName) {
  const firstName = normalizeKey(userName).split(" ")[0];
  return RESPONSIBLE_VISUALS[firstName] || RESPONSIBLE_VISUALS.default;
}

function getRoleBadgeClass(role) {
  const key = normalizeKey(role);
  if (key.includes("lead")) return "master";
  if (key.includes("senior") && key.includes("semi")) return "soft";
  if (key.includes("senior")) return "admin";
  return "standard";
}

function normalizeRole(role) {
  const key = normalizeKey(role);
  if (key.includes("lead") || key.includes("maestro")) return ROLE_LEAD;
  if (key.includes("semi") || key.includes("ssr")) return ROLE_SSR;
  if (key.includes("senior") || key.includes("administrador")) return ROLE_SR;
  return ROLE_JR;
}

function canCreateRole(actorRole, targetRole) {
  if (actorRole === ROLE_LEAD) return true;
  if (actorRole === ROLE_SR) return [ROLE_SSR, ROLE_JR].includes(targetRole);
  if (actorRole === ROLE_SSR) return targetRole === ROLE_JR;
  return false;
}

function supportsManagedPermissionOverrides(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === ROLE_LEAD || normalizedRole === ROLE_SR;
}

function createUserModalState(overrides = {}) {
  const permissionOverrides = overrides.permissionOverrides ?? EMPTY_OBJECT;
  return {
    open: false,
    mode: "create",
    id: null,
    name: "",
    username: "",
    role: ROLE_JR,
    area: "",
    jobTitle: "",
    isActive: "true",
    password: "",
    managerId: "",
    permissionPageId: "",
    ...overrides,
    permissionOverrides: {
      pages: { ...(permissionOverrides.pages ?? EMPTY_OBJECT) },
      actions: { ...(permissionOverrides.actions ?? EMPTY_OBJECT) },
    },
  };
}

function getManagedUserIds(users, userId) {
  const descendants = new Set();
  let changed = true;

  while (changed) {
    changed = false;
    users.forEach((user) => {
      if (user.id === userId) return;
      if (user.managerId === userId || descendants.has(user.managerId)) {
        if (!descendants.has(user.id)) {
          descendants.add(user.id);
          changed = true;
        }
      }
    });
  }

  return descendants;
}

function normalizeAreaOption(area) {
  return String(area || "").trim().toUpperCase();
}

function normalizeBoardVisibilityType(value) {
  const normalizedValue = String(value || "").trim();
  return ["all", "department", "users"].includes(normalizedValue) ? normalizedValue : "users";
}

function normalizeBoardSharedDepartments(entries = []) {
  return Array.from(new Set((Array.isArray(entries) ? entries : [])
    .map((entry) => normalizeAreaOption(entry))
    .filter(Boolean)));
}

function normalizeBoardAccessUserIds(entries = [], ownerId = "") {
  return Array.from(new Set((Array.isArray(entries) ? entries : [])
    .map((entry) => String(entry || "").trim())
    .filter((entry) => entry && entry !== ownerId)));
}

function getNormalizedBoardVisibility(board) {
  const ownerId = String(board?.ownerId || "").trim();
  const visibilityType = normalizeBoardVisibilityType(board?.visibilityType);
  return {
    ownerId,
    visibilityType,
    sharedDepartments: visibilityType === "department" ? normalizeBoardSharedDepartments(board?.sharedDepartments) : [],
    accessUserIds: visibilityType === "users" ? normalizeBoardAccessUserIds(board?.accessUserIds, ownerId) : [],
  };
}

function getBoardAssignmentSummary(board, userMap) {
  const visibility = getNormalizedBoardVisibility(board);
  if (visibility.visibilityType === "all") {
    return "Visible para todos";
  }

  if (visibility.visibilityType === "department") {
    return visibility.sharedDepartments.length
      ? `Áreas · ${visibility.sharedDepartments.join(", ")}`
      : "Áreas · Sin área configurada";
  }

  const ownerName = userMap?.get?.(visibility.ownerId)?.name || "Sin player principal";
  const extraNames = visibility.accessUserIds.map((userId) => userMap?.get?.(userId)?.name || "N/A").filter(Boolean);
  return extraNames.length
    ? `Players · ${[ownerName].concat(extraNames).join(", ")}`
    : `Player asignado · ${ownerName}`;
}

function buildAreaCatalog(users = [], catalog = []) {
  return Array.from(new Set(DEFAULT_AREA_OPTIONS.concat(catalog || []).concat((users || []).map((user) => normalizeAreaOption(getUserArea(user))))).values())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function getUserArea(user) {
  return String(user?.area || user?.department || "").trim();
}

function getUserJobTitle(user) {
  return String(user?.jobTitle || DEFAULT_JOB_TITLE_BY_ROLE[user?.role] || "").trim();
}

function hasLeadUser(users) {
  return (users || []).some((user) => normalizeRole(user.role) === ROLE_LEAD);
}

function normalizeUserRecord(user, fallbackManagerId = null) {
  const role = normalizeRole(user.role);
  const area = String(user.area ?? user.department ?? "").trim();
  const selfIdentityEditCount = Number(user.selfIdentityEditCount ?? 0);
  const username = String(user.email ?? user.username ?? "").trim();
  return {
    ...user,
    email: username,
    role,
    area,
    department: area,
    jobTitle: String(user.jobTitle ?? DEFAULT_JOB_TITLE_BY_ROLE[role] ?? "").trim(),
    password: String(user.password || ""),
    mustChangePassword: Boolean(user.mustChangePassword),
    temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || null,
    managerId: user.managerId ?? fallbackManagerId,
    createdById: user.createdById ?? fallbackManagerId,
    selfIdentityEditCount: Number.isFinite(selfIdentityEditCount) ? Math.max(0, selfIdentityEditCount) : 0,
  };
}

function canBypassSelfProfileEditLimit(user) {
  return (ROLE_LEVEL[normalizeRole(user?.role)] || 0) >= ROLE_LEVEL[ROLE_SR];
}

function canViewUserByAreaScope(actor, target) {
  if (!actor || !target) return false;
  if (actor.role === ROLE_LEAD) return true;
  if (actor.id === target.id) return true;
  if ([ROLE_SR, ROLE_SSR].includes(actor.role)) {
    return Boolean(getUserArea(actor)) && getUserArea(actor) === getUserArea(target);
  }
  return false;
}

function userMatchesPermissionEntry(user, entry) {
  if (!user || !entry) return false;
  if ((entry.roles || []).includes(user.role)) return true;
  if ((entry.userIds || []).includes(user.id)) return true;
  if ((entry.departments || []).includes(getUserArea(user))) return true;
  return false;
}

function canAccessPage(user, pageId, permissions) {
  const override = permissions?.userOverrides?.[user?.id]?.pages?.[pageId];
  if (typeof override === "boolean") return override;
  if (user?.role === ROLE_LEAD) return true;
  return userMatchesPermissionEntry(user, permissions?.pages?.[pageId]);
}

function canDoAction(user, actionId, permissions) {
  const override = permissions?.userOverrides?.[user?.id]?.actions?.[actionId];
  if (typeof override === "boolean") return override;
  if (user?.role === ROLE_LEAD) return true;
  return userMatchesPermissionEntry(user, permissions?.actions?.[actionId]);
}

function canUserAccessTemplate(template, user) {
  if (!template || !user) return false;
  if (!template.isCustom) return true;
  if (user.role === ROLE_LEAD) return true;
  if (template.createdById === user.id) return true;
  if (template.visibilityType === "all") return true;
  if (template.visibilityType === "department" && (template.sharedDepartments || []).includes(user.department || "")) return true;
  if (template.visibilityType === "users" && (template.sharedUserIds || []).includes(user.id)) return true;
  return false;
}

function canManageBoard(user, board) {
  if (!user || !board) return false;
  if (user.role === ROLE_LEAD) return true;
  if (board.createdById === user.id || board.ownerId === user.id) return true;
  if (board.visibilityType === "users" && (board.accessUserIds || []).includes(user.id)) return true;
  if (board.visibilityType === "all") return true;
  if (board.visibilityType === "department") {
    const userArea = normalizeAreaOption(getUserArea(user));
    return Boolean(userArea) && (board.sharedDepartments || []).includes(userArea);
  }
  return false;
}

function canEditBoard(user, board) {
  if (!user || !board) return false;
  if (user.role === ROLE_LEAD) return true;
  return board.createdById === user.id;
}

function getBoardVisibleToUser(board, user) {
  return canManageBoard(user, board);
}

function canDoBoardAction(user, board) {
  return canManageBoard(user, board);
}

function canEditBoardRowRecord(user, board, row, permissions, actionId = "createBoardRow") {
  if (!user || !board || !row) return false;
  if (!canDoBoardAction(user, board)) return false;
  if (!canDoAction(user, actionId, permissions)) return false;
  return row.status !== STATUS_FINISHED;
}

function canOperateBoardRowRecord(user, board, row, permissions) {
  return canEditBoardRowRecord(user, board, row, permissions, "boardWorkflow");
}

function toSelectOption(value, group = "") {
  const normalized = String(value || "").trim();
  return {
    value: normalized,
    label: normalized,
    group,
  };
}

function buildSelectOptions(field, state) {
  if (field.optionSource === "users") {
    return state.users
      .filter((user) => user.isActive)
      .map((user) => ({ value: user.name, label: user.name, group: "Players" }));
  }
  if (field.optionSource === "inventory") {
    return (state.inventoryItems || []).map((item) => ({ value: item.name, label: item.name, group: item.domain || "Inventario" }));
  }
  if (field.optionSource === "catalog") {
    return state.catalog
      .filter((item) => !item.isDeleted)
      .map((item) => ({ value: item.name, label: item.name, group: item.category || "General" }));
  }
  if (field.optionSource === "catalogByCategory") {
    const selectedCategory = String(field.optionCatalogCategory || "").trim();
    const candidates = state.catalog.filter((item) => !item.isDeleted);
    const filtered = selectedCategory
      ? candidates.filter((item) => String(item.category || "General").trim() === selectedCategory)
      : candidates;
    return filtered.map((item) => ({ value: item.name, label: item.name, group: item.category || "General" }));
  }
  if (field.optionSource === "status") {
    return [STATUS_PENDING, STATUS_RUNNING, STATUS_PAUSED, STATUS_FINISHED].map((value) => toSelectOption(value, "Estados"));
  }
  return (field.options || []).map((value) => toSelectOption(value, "Manual"));
}

function getWeekName(date) {
  const week = startOfWeek(date);
  const start = formatDate(week);
  const end = formatDate(endOfWeek(date));
  return `Semana ${start} - ${end}`;
}

function getActivityLabel(activity, catalogMap) {
  return activity.customName || catalogMap.get(activity.catalogActivityId)?.name || "Actividad sin nombre";
}

function getTimeLimitMinutes(activity, catalogMap) {
  return catalogMap.get(activity.catalogActivityId)?.timeLimitMinutes || 0;
}

function getElapsedSeconds(activity, now) {
  if (!activity) return 0;
  if (activity.status !== STATUS_RUNNING || !activity.lastResumedAt) {
    return activity.accumulatedSeconds || 0;
  }
  const delta = Math.max(0, Math.floor((now - new Date(activity.lastResumedAt).getTime()) / 1000));
  return (activity.accumulatedSeconds || 0) + delta;
}

function buildDemoUsers() {
  const leadId = makeId("usr-demo-lead");
  return [
    {
      id: leadId,
      name: "Demo Lead",
      email: "lead@copmec.local",
      area: "INVENTARIO",
      department: "INVENTARIO",
      jobTitle: "Encargado de area",
      role: ROLE_LEAD,
      isActive: true,
      managerId: null,
      createdById: BOOTSTRAP_MASTER_ID,
    },
    {
      id: makeId("usr-demo-sr"),
      name: "Demo Senior",
      email: "senior@copmec.local",
      area: "PEDIDOS",
      department: "PEDIDOS",
      jobTitle: "Supervisor senior",
      role: ROLE_SR,
      isActive: true,
      managerId: leadId,
      createdById: leadId,
    },
    {
      id: makeId("usr-demo-jr"),
      name: "Demo Player",
      email: "demo@copmec.local",
      area: "INVENTARIO",
      department: "INVENTARIO",
      jobTitle: "Player operativo",
      role: ROLE_JR,
      isActive: true,
      managerId: leadId,
      createdById: leadId,
    },
  ];
}

function buildSampleState() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const previousWeekStart = addDays(weekStart, -7);
  const oldWeekStart = addDays(weekStart, -14);
  const users = buildDemoUsers();

  const catalog = [
    normalizeCatalogItemRecord({ id: "cat-piso", name: "Piso producción", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "daily", category: "Limpieza" }),
    normalizeCatalogItemRecord({ id: "cat-banos", name: "Lavado de baños", timeLimitMinutes: 40, isMandatory: true, isDeleted: false, frequency: "daily", category: "Limpieza" }),
    normalizeCatalogItemRecord({ id: "cat-inspeccion", name: "Inspección nave", timeLimitMinutes: 75, isMandatory: true, isDeleted: false, frequency: "threeTimesWeek", category: "Seguridad" }),
    normalizeCatalogItemRecord({ id: "cat-oficinas", name: "Limpieza oficinas", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "weekdays", category: "Limpieza" }),
    normalizeCatalogItemRecord({ id: "cat-comedor", name: "Comedor", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "daily", category: "Servicios" }),
    normalizeCatalogItemRecord({ id: "cat-vidrios", name: "Limpieza vidrios", timeLimitMinutes: 50, isMandatory: false, isDeleted: false, frequency: "twiceWeek", category: "Limpieza" }),
    normalizeCatalogItemRecord({ id: "cat-rampas", name: "Revisión de rampas", timeLimitMinutes: 35, isMandatory: false, isDeleted: false, frequency: "weekly", category: "Seguridad" }),
  ];

  const inventoryItems = [
    normalizeInventoryItemRecord({ id: "inv-1", code: "ALM-001", name: "Tarima estándar", presentation: "Tarima", piecesPerBox: 1, boxesPerPallet: 1, domain: INVENTORY_DOMAIN_BASE, stockUnits: 36, minStockUnits: 10, storageLocation: "Almacén central", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-2", code: "ALM-002", name: "Caja master", presentation: "Paquete", piecesPerBox: 20, boxesPerPallet: 48, domain: INVENTORY_DOMAIN_BASE, stockUnits: 240, minStockUnits: 80, storageLocation: "Racks A-2", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-3", code: "ALM-003", name: "Playo transparente", presentation: "Rollo", piecesPerBox: 6, boxesPerPallet: 40, domain: INVENTORY_DOMAIN_BASE, stockUnits: 120, minStockUnits: 36, storageLocation: "Racks B-1", unitLabel: "rollos" }),
    normalizeInventoryItemRecord({ id: "inv-4", code: "LIMP-001", name: "Detergente neutro multiusos", presentation: "Bidón 20 L · dilución 1:40", piecesPerBox: 0, boxesPerPallet: 0, domain: INVENTORY_DOMAIN_CLEANING, stockUnits: 12, minStockUnits: 4, cleaningSite: "C3", storageLocation: "Cuarto de limpieza · anaquel 1", unitLabel: "bidones", activityConsumptions: [{ catalogActivityId: "cat-piso", quantity: 1 }, { catalogActivityId: "cat-oficinas", quantity: 1 }] }),
    normalizeInventoryItemRecord({ id: "inv-5", code: "LIMP-002", name: "Papel higiénico jumbo", presentation: "Rollo jumbo 400 m", piecesPerBox: 0, boxesPerPallet: 0, domain: INVENTORY_DOMAIN_CLEANING, stockUnits: 96, minStockUnits: 24, cleaningSite: "C3", storageLocation: "Cuarto de limpieza · rack baños", unitLabel: "rollos", activityConsumptions: [{ catalogActivityId: "cat-banos", quantity: 2 }] }),
    normalizeInventoryItemRecord({ id: "inv-6", code: "PED-001", name: "Esquinero de cartón 2 x 2 x 48", presentation: "", piecesPerBox: 0, boxesPerPallet: 0, domain: INVENTORY_DOMAIN_ORDERS, stockUnits: 150, minStockUnits: 70, storageLocation: "Nave 1 · rack empaque", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-7", code: "PED-002", name: "Etiqueta térmica 4 x 6", presentation: "", piecesPerBox: 0, boxesPerPallet: 0, domain: INVENTORY_DOMAIN_ORDERS, stockUnits: 28, minStockUnits: 10, storageLocation: "Mesa de surtido · gaveta 2", unitLabel: "rollos" }),
  ];

  const weeks = [
    {
      id: "week-active",
      name: getWeekName(weekStart),
      startDate: weekStart.toISOString(),
      endDate: endOfWeek(weekStart).toISOString(),
      isActive: true,
    },
    {
      id: "week-prev",
      name: getWeekName(previousWeekStart),
      startDate: previousWeekStart.toISOString(),
      endDate: endOfWeek(previousWeekStart).toISOString(),
      isActive: false,
    },
    {
      id: "week-old",
      name: getWeekName(oldWeekStart),
      startDate: oldWeekStart.toISOString(),
      endDate: endOfWeek(oldWeekStart).toISOString(),
      isActive: false,
    },
  ];

  const activities = [];
  const pauseLogs = [];
  const controlRows = [];
  const controlBoards = [];
  const demoLeadUser = users.find((user) => user.role === ROLE_LEAD) || users[0] || null;
  const starterWorkspace = demoLeadUser ? buildStarterWorkspace(demoLeadUser, catalog, inventoryItems, buildDefaultPermissions(), users) : null;

  return {
    system: {
      masterBootstrapEnabled: false,
      masterUsername: MASTER_USERNAME,
    },
    currentUserId: null,
    areaCatalog: [...DEFAULT_AREA_OPTIONS],
    users,
    weeks: starterWorkspace?.weeks || weeks,
    catalog,
    inventoryItems,
    inventoryMovements: [],
    activities: starterWorkspace?.activities || activities,
    pauseLogs: starterWorkspace?.pauseLogs || pauseLogs,
    controlRows: starterWorkspace?.controlRows || controlRows,
    controlBoards: starterWorkspace?.controlBoards || controlBoards,
    boardWeeklyCycle: normalizeBoardWeeklyCycle(null, now),
    boardWeekHistory: [],
    boardTemplates: [],
    permissions: buildDefaultPermissions(),
    auditLog: [],
  };
}

function normalizeBoardRowValues(row, timeFieldIds) {
  return Object.entries(row.values || {}).reduce((accumulator, [fieldId, fieldValue]) => {
    accumulator[fieldId] = timeFieldIds.has(fieldId) ? normalizeTimeValue24h(fieldValue) : fieldValue;
    return accumulator;
  }, {});
}

function normalizeControlBoard(board, users, normalizedPermissions) {
  const timeFieldIds = new Set((board.fields || []).filter((field) => field.type === "time").map((field) => field.id));
  const ownerId = board.ownerId ?? board.createdById ?? users[0]?.id ?? null;
  const visibility = getNormalizedBoardVisibility({
    ...board,
    ownerId,
  });
  const normalizedBoard = {
    ...board,
    createdById: board.createdById ?? users[0]?.id ?? null,
    ownerId,
    visibilityType: visibility.visibilityType,
    sharedDepartments: visibility.sharedDepartments,
    accessUserIds: visibility.accessUserIds,
    settings: withDefaultBoardSettings(board.settings),
    rows: Array.isArray(board.rows)
      ? board.rows.map((row) => ({
          ...row,
          values: normalizeBoardRowValues(row, timeFieldIds),
        }))
      : [],
  };

  return {
    ...normalizedBoard,
    permissions: normalizeBoardPermissions(board.permissions, normalizedPermissions, normalizedBoard),
  };
}

function getNormalizedControlBoards(controlBoards, users, normalizedPermissions, sampleState) {
  if (!Array.isArray(controlBoards)) {
    return sampleState.controlBoards;
  }
  return controlBoards.map((board) => normalizeControlBoard(board, users, normalizedPermissions));
}

function resolveHydratedWorkspaceCollection(parsedCollection, sampleCollection, shouldHydrateDemoWorkspace, requireNonEmpty = false) {
  if (!shouldHydrateDemoWorkspace) return parsedCollection;
  if (!Array.isArray(parsedCollection)) return sampleCollection;
  if (requireNonEmpty && parsedCollection.length === 0) return sampleCollection;
  return parsedCollection;
}

function buildNormalizedWarehouseState(parsed, sampleState, users, normalizedPermissions, shouldHydrateDemoWorkspace) {
  return {
    ...parsed,
    system: {
      masterBootstrapEnabled: parsed.system?.masterBootstrapEnabled ?? !hasLeadUser(users),
      masterUsername: MASTER_USERNAME,
    },
    users,
    areaCatalog: buildAreaCatalog(users, parsed.areaCatalog),
    weeks: resolveHydratedWorkspaceCollection(parsed.weeks, sampleState.weeks, shouldHydrateDemoWorkspace, true),
    catalog: Array.isArray(parsed.catalog) && parsed.catalog.length ? parsed.catalog.map((item) => normalizeCatalogItemRecord(item)) : sampleState.catalog,
    activities: resolveHydratedWorkspaceCollection(parsed.activities, sampleState.activities, shouldHydrateDemoWorkspace, true),
    pauseLogs: resolveHydratedWorkspaceCollection(parsed.pauseLogs, sampleState.pauseLogs, shouldHydrateDemoWorkspace),
    controlRows: resolveHydratedWorkspaceCollection(parsed.controlRows, sampleState.controlRows, shouldHydrateDemoWorkspace, true),
    boardWeeklyCycle: normalizeBoardWeeklyCycle(parsed.boardWeeklyCycle),
    boardWeekHistory: Array.isArray(parsed.boardWeekHistory)
      ? parsed.boardWeekHistory.map((snapshot) => normalizeBoardHistorySnapshot(snapshot))
      : sampleState.boardWeekHistory,
    controlBoards: getNormalizedControlBoards(parsed.controlBoards, users, normalizedPermissions, sampleState),
    inventoryItems: Array.isArray(parsed.inventoryItems) && parsed.inventoryItems.length ? parsed.inventoryItems.map((item) => normalizeInventoryItemRecord(item)) : sampleState.inventoryItems,
    inventoryMovements: Array.isArray(parsed.inventoryMovements) ? parsed.inventoryMovements : sampleState.inventoryMovements,
    boardTemplates: Array.isArray(parsed.boardTemplates) ? parsed.boardTemplates : [],
    permissions: normalizedPermissions,
    auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
  };
}

function normalizeWarehouseState(parsed) {
  if (!parsed) return buildSampleState();
  const sampleState = buildSampleState();
  const shouldHydrateDemoWorkspace = !Array.isArray(parsed.users) || parsed.users.length === 0;
  const sourceUsers = shouldHydrateDemoWorkspace ? sampleState.users : parsed.users;
  const users = sourceUsers.map((user) => normalizeUserRecord(user, user.managerId ?? parsed.currentUserId ?? null));
  const normalizedPermissions = normalizePermissions(remapPermissionsModel(parsed.permissions, users));
  const normalizedState = buildNormalizedWarehouseState(parsed, sampleState, users, normalizedPermissions, shouldHydrateDemoWorkspace);

  return applyBoardWeeklyCutToState(normalizedState).state;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSampleState();
    const parsed = JSON.parse(raw);
    if (!parsed) return buildSampleState();
    return normalizeWarehouseState(parsed);
  } catch {
    return buildSampleState();
  }
}

function buildWeekActivities(weekId, catalog, users) {
  const activeUsers = users.filter((user) => user.isActive);
  const baseDate = startOfWeek(new Date());
  let assigneeIndex = 0;

  return catalog
    .filter((item) => !item.isDeleted)
    .flatMap((item) => {
      const responsible = activeUsers[assigneeIndex % activeUsers.length] || users[0] || null;
      assigneeIndex += 1;
      return buildWeekActivitiesFromCatalogItem(weekId, item, baseDate, responsible?.id || null);
    })
    .sort((left, right) => new Date(left.activityDate) - new Date(right.activityDate));
}

function buildStarterWorkspace(leadUser, catalog, inventoryItems, permissions, workspaceUsers = [leadUser]) {
  const now = new Date();
  const activeWeekStart = startOfWeek(now);
  const previousWeekStart = addDays(activeWeekStart, -7);
  const activityUsers = Array.isArray(workspaceUsers) && workspaceUsers.length ? workspaceUsers : [leadUser];
  const weeks = [
    {
      id: makeId("week"),
      name: getWeekName(activeWeekStart),
      startDate: activeWeekStart.toISOString(),
      endDate: endOfWeek(activeWeekStart).toISOString(),
      isActive: true,
    },
    {
      id: makeId("week"),
      name: getWeekName(previousWeekStart),
      startDate: previousWeekStart.toISOString(),
      endDate: endOfWeek(previousWeekStart).toISOString(),
      isActive: false,
    },
  ];

  const activeActivities = buildWeekActivities(weeks[0].id, catalog, activityUsers).map((activity, index) => {
    const startTime = isoAt(addDays(activeWeekStart, index % 5), 8 + (index % 3), 0);
    const durationSeconds = [32, 46, 18, 64, 27, 41, 53][index % 7] * 60;
    if (index === 1) {
      return {
        ...activity,
        status: STATUS_RUNNING,
        startTime,
        lastResumedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        accumulatedSeconds: 12 * 60,
      };
    }
    if (index === 2) {
      return {
        ...activity,
        status: STATUS_PAUSED,
        startTime,
        accumulatedSeconds: 28 * 60,
        lastResumedAt: null,
      };
    }
    return {
      ...activity,
      status: STATUS_FINISHED,
      startTime,
      endTime: new Date(new Date(startTime).getTime() + durationSeconds * 1000).toISOString(),
      accumulatedSeconds: durationSeconds,
      lastResumedAt: null,
    };
  });

  const previousActivities = buildWeekActivities(weeks[1].id, catalog, activityUsers).map((activity, index) => {
    const startTime = isoAt(addDays(previousWeekStart, index % 5), 7 + (index % 2), 30);
    const durationSeconds = [38, 55, 43, 62, 34, 48, 58][index % 7] * 60;
    return {
      ...activity,
      status: STATUS_FINISHED,
      startTime,
      endTime: new Date(new Date(startTime).getTime() + durationSeconds * 1000).toISOString(),
      accumulatedSeconds: durationSeconds,
      lastResumedAt: null,
    };
  });

  const pauseLogs = [
    {
      id: makeId("pause"),
      weekActivityId: activeActivities[1]?.id,
      pauseReason: "Faltante de material",
      pausedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      resumedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      pauseDurationSeconds: 6 * 60,
    },
    {
      id: makeId("pause"),
      weekActivityId: activeActivities[2]?.id,
      pauseReason: "Ajuste de proceso",
      pausedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      resumedAt: null,
      pauseDurationSeconds: 8 * 60,
    },
  ].filter((entry) => entry.weekActivityId);

  const sampleBoardTemplate = BOARD_TEMPLATES.find((template) => template.id === "surtido") || BOARD_TEMPLATES[0];
  const sampleFields = buildTemplateColumns(sampleBoardTemplate);
  const inventoryIds = (inventoryItems || []).map((item) => item.id);
  const skuField = sampleFields.find((field) => field.type === "inventoryLookup");
  const askedField = sampleFields.find((field) => normalizeKey(field.label).includes("pedidas") || normalizeKey(field.label).includes("objetivo"));
  const suppliedField = sampleFields.find((field) => normalizeKey(field.label).includes("surtidas") || normalizeKey(field.label).includes("reales"));
  const routeField = sampleFields.find((field) => normalizeKey(field.label).includes("ruta"));
  const priorityField = sampleFields.find((field) => normalizeKey(field.label).includes("prioridad"));

  const boardRows = [
    { status: STATUS_FINISHED, asked: 12, supplied: 12, route: "Ruta Norte", priority: "Alta", inventoryId: inventoryIds[0], accumulatedSeconds: 54 * 60 },
    { status: STATUS_RUNNING, asked: 8, supplied: 5, route: "Ruta Centro", priority: "Media", inventoryId: inventoryIds[1] || inventoryIds[0], accumulatedSeconds: 26 * 60 },
    { status: STATUS_PENDING, asked: 14, supplied: 0, route: "Ruta Sur", priority: "Alta", inventoryId: inventoryIds[2] || inventoryIds[0], accumulatedSeconds: 0 },
  ].map((sample, index) => {
    const values = sampleFields.reduce((accumulator, field) => {
      accumulator[field.id] = getBoardFieldDefaultValue(field, leadUser.id);
      return accumulator;
    }, {});

    if (skuField) values[skuField.id] = sample.inventoryId || "";
    if (askedField) values[askedField.id] = sample.asked;
    if (suppliedField) values[suppliedField.id] = sample.supplied;
    if (routeField) values[routeField.id] = sample.route;
    if (priorityField) values[priorityField.id] = sample.priority;

    return {
      id: makeId("row"),
      values,
      responsibleId: leadUser.id,
      status: sample.status,
      startTime: sample.status === STATUS_PENDING ? null : isoAt(addDays(activeWeekStart, index), 9, 0),
      endTime: sample.status === STATUS_FINISHED ? isoAt(addDays(activeWeekStart, index), 9, 54) : null,
      accumulatedSeconds: sample.accumulatedSeconds,
      lastResumedAt: sample.status === STATUS_RUNNING ? new Date(Date.now() - 12 * 60 * 1000).toISOString() : null,
      createdAt: isoAt(addDays(activeWeekStart, index), 8, 40),
    };
  });

  const board = {
    id: makeId("board"),
    name: sampleBoardTemplate?.name || "Surtido inicial",
    description: sampleBoardTemplate?.description || "Tablero inicial de operación para COPMEC.",
    createdById: leadUser.id,
    ownerId: leadUser.id,
    accessUserIds: [],
    settings: {
      ...withDefaultBoardSettings(sampleBoardTemplate?.settings),
      auxColumnsOrder: [...DEFAULT_BOARD_AUX_COLUMNS_ORDER],
    },
    fields: sampleFields,
    rows: boardRows,
  };

  const controlRows = [
    { id: makeId("ctrl"), product: "200 Billion Probiotics", pallets: 2, boxes: 10, responsibleId: leadUser.id, status: "Terminado" },
    { id: makeId("ctrl"), product: "3 Mag Blend", pallets: 1, boxes: 5, responsibleId: leadUser.id, status: "En curso" },
    { id: makeId("ctrl"), product: "60 Billion Probiotics", pallets: 0, boxes: 0, responsibleId: leadUser.id, status: "Pendiente" },
  ];

  return {
    weeks,
    activities: activeActivities.concat(previousActivities),
    pauseLogs,
    controlRows,
    controlBoards: [{ ...board, permissions: buildBoardPermissions(permissions, board) }],
  };
}

function updateElapsedForFinish(activity, nowIso) {
  if (activity.status !== STATUS_RUNNING || !activity.lastResumedAt) {
    return activity.accumulatedSeconds || 0;
  }
  const delta = Math.max(0, Math.floor((new Date(nowIso) - new Date(activity.lastResumedAt)) / 1000));
  return (activity.accumulatedSeconds || 0) + delta;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function MetricCard({ label, value, hint, tone = "default" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function InventoryStockBar({ current, minimum, unitLabel = "pzas", target = null, primaryLabel = "", secondaryLabel = "", className = "" }) {
  const safeCurrent = Math.max(0, Number(current || 0));
  const safeMinimum = Math.max(0, Number(minimum || 0));
  const safeTarget = Math.max(0, Number(target || 0));
  const baseline = Math.max(safeTarget || (safeMinimum > 0 ? safeMinimum * 2 : safeCurrent), 1);
  const percent = Math.min(100, (safeCurrent / baseline) * 100);
  const isLow = safeMinimum > 0 ? safeCurrent <= safeMinimum : safeCurrent === 0;
  const resolvedPrimaryLabel = primaryLabel || `${safeCurrent} ${unitLabel}`;
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

function DashboardKpiCard({ title, value, subtitle, tone, icon: Icon }) {
  const palette = KPI_STYLES[tone] || KPI_STYLES.cyan;
  return (
    <article className="dashboard-kpi-card">
      <div className="dashboard-kpi-head">
        <div className="dashboard-kpi-icon" style={{ backgroundColor: palette.iconBg, color: palette.iconColor }}>
          <Icon size={18} strokeWidth={2.1} />
        </div>
      </div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </article>
  );
}

function DashboardBarRow({ label, value, max, color, trailing, initial }) {
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

function DashboardRankItem({ index, label, value, color, highlighted = false }) {
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

function DashboardProgressMetric({ label, valueText, percent, color }) {
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

function DashboardParetoRow({ label, percent, cumulativePercent, impactText, highlight = false }) {
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

function DashboardCauseCard({ title, share, count, examples }) {
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

function DashboardSection({ title, subtitle, summary, icon: Icon, open = true, onToggle, children }) {
  return (
    <details className="dashboard-section" open={open}>
      <summary className="dashboard-section-summary" onClick={(event) => {
        event.preventDefault();
        onToggle?.();
      }}>
        <div className="dashboard-section-summary-main">
          <div className="dashboard-section-summary-icon">
            <Icon size={18} />
          </div>
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
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

function DashboardPieChart({ rows }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">No hay datos suficientes para la gráfica de pastel.</p>;
  }

  let start = 0;
  const segments = rows.map((item, index) => {
    const color = item.solidColor || DASHBOARD_CHART_PALETTE[index % DASHBOARD_CHART_PALETTE.length];
    const end = start + item.percent;
    const segment = `${color} ${start}% ${end}%`;
    start = end;
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

function DashboardColumnChart({ rows, color = "linear-gradient(180deg, #0ea5e9 0%, #14b8a6 100%)", valueSuffix = "", emptyLabel = "No hay datos para la gráfica." }) {
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

function DashboardParetoChart({ rows }) {
  if (!rows.length) {
    return <p className="dashboard-empty-state">No hay datos suficientes para la gráfica de Pareto.</p>;
  }

  const width = 520;
  const height = 220;
  const chartLeft = 38;
  const chartBottom = 30;
  const chartTop = 18;
  const chartHeight = height - chartBottom - chartTop;
  const chartWidth = width - chartLeft - 16;
  const barSlot = chartWidth / rows.length;
  const barWidth = Math.max(18, barSlot * 0.52);
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
            <stop offset="0%" stopColor="#0ea5e9" />
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

function DashboardIshikawaDiagram({ rows }) {
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

function CopmecBrand({ headingTag = "h1", subtitle = "Centro de Operaciones para la Mejora Continua", tone = "dark", compact = false, showKicker = true, kicker = "Sistema operativo" }) {
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

function StatTile({ label, value, tone = "default", className = "" }) {
  return (
    <article className={`stat-tile ${tone} ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function InventoryLookupInput({ inventoryItems, value, onChange, placeholder, disabled, style, title }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const selectedItem = useMemo(
    () => (inventoryItems || []).find((item) => item.id === value) || null,
    [inventoryItems, value],
  );

  useEffect(() => {
    if (selectedItem) {
      setQuery(formatInventoryLookupLabel(selectedItem));
      return;
    }
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen, selectedItem]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeKey(query);
    if (!normalizedQuery) return [];

    return (inventoryItems || [])
      .filter((item) => {
        const haystack = [item.code, item.name, item.presentation]
          .map((part) => normalizeKey(part))
          .join(" ");
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [inventoryItems, query]);

  useEffect(() => {
    if (!isOpen || !shellRef.current) return undefined;

    function updateDropdownPosition() {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;

      const estimatedHeight = Math.min(260, Math.max(56, filteredItems.length * 58 + 12));
      const viewportSpaceBelow = globalThis.innerHeight - rect.bottom;
      const shouldOpenAbove = viewportSpaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: shouldOpenAbove ? Math.max(12, rect.top - estimatedHeight - 4) : rect.bottom + 4,
      });
    }

    updateDropdownPosition();
    globalThis.addEventListener("resize", updateDropdownPosition);
    globalThis.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      globalThis.removeEventListener("resize", updateDropdownPosition);
      globalThis.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [filteredItems.length, isOpen]);

  function commitItem(item) {
    setQuery(formatInventoryLookupLabel(item));
    onChange(item.id);
    setIsOpen(false);
  }

  function clearSelection() {
    setQuery("");
    onChange("");
    setIsOpen(false);
    globalThis.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function resolveQuery() {
    const nextQuery = query.trim();
    if (!nextQuery) {
      onChange("");
      setIsOpen(false);
      return;
    }

    const exactMatch = findInventoryItemByQuery(inventoryItems, nextQuery);
    if (exactMatch) {
      commitItem(exactMatch);
      return;
    }

    if (filteredItems.length === 1 && normalizeKey(filteredItems[0].code).startsWith(normalizeKey(nextQuery))) {
      commitItem(filteredItems[0]);
      return;
    }

    onChange("");
    setIsOpen(false);
  }

  return (
    <div ref={shellRef} className="inventory-lookup-shell" style={style} title={title}>
      {selectedItem ? (
        <div className={`inventory-lookup-selected ${disabled ? "disabled" : ""}`.trim()}>
          <div className="inventory-lookup-selected-copy">
            <strong>{selectedItem.code}</strong>
            <span>{selectedItem.name}</span>
            <small>{selectedItem.presentation}</small>
          </div>
          {disabled ? null : (
            <button type="button" className="inventory-lookup-clear" onClick={clearSelection} aria-label="Quitar producto seleccionado" title="Quitar producto seleccionado">
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <input
          ref={inputRef}
          className="inventory-lookup-input"
          value={query}
          onFocus={() => setIsOpen(Boolean(query.trim()))}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);

            if (!nextValue.trim()) {
              onChange("");
              setIsOpen(false);
              return;
            }

            const exactMatch = findInventoryItemByQuery(inventoryItems, nextValue);
            if (exactMatch) {
              commitItem(exactMatch);
              return;
            }

            setIsOpen(true);
          }}
          onBlur={() => globalThis.setTimeout(resolveQuery, 120)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              resolveQuery();
            }
          }}
          placeholder={placeholder || "Buscar por código o nombre"}
          disabled={disabled}
        />
      )}
      {!selectedItem && isOpen && filteredItems.length && dropdownStyle ? createPortal(
        <div className="inventory-lookup-dropdown inventory-lookup-dropdown-floating" style={dropdownStyle}>
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="inventory-lookup-option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitItem(item)}
            >
              <strong>{item.code}</strong>
              <span>{item.name}</span>
              <small>{item.presentation}</small>
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function LoginScreen({ loginForm, onChange, onSubmit, error, demoUsers }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-shell">
      <div className="login-aurora login-aurora-one" />
      <div className="login-aurora login-aurora-two" />
      <section className="login-panel">
        <article className="login-hero-panel">
          <div className="login-brand-block">
            <CopmecBrand headingTag="h1" tone="light" subtitle="" kicker="Sistema" />
          </div>

          <div className="login-visual-scene" aria-hidden="true">
            <div className="login-scene-grid" />
            <div className="login-scene-scanline" />
            <div className="login-scene-data-flow">
              <span className="login-scene-data-line line-a" />
              <span className="login-scene-data-line line-b" />
              <span className="login-scene-data-line line-c" />
            </div>
            <div className="login-scene-status-board">
              <span className="login-scene-status-chip live">Inventario</span>
              <span className="login-scene-status-chip">Players</span>
              <span className="login-scene-status-chip alert">Alertas</span>
            </div>
            <span className="login-scene-particle particle-a" />
            <span className="login-scene-particle particle-b" />
            <span className="login-scene-particle particle-c" />
            <div className="login-scene-ring login-scene-ring-one" />
            <div className="login-scene-ring login-scene-ring-two" />
            <div className="login-scene-card login-scene-card-main">
              <div className="login-scene-card-head">
                <span className="login-scene-dot" />
                <span className="login-scene-dot" />
                <span className="login-scene-dot accent" />
              </div>
              <div className="login-scene-bars">
                <span className="login-scene-bar bar-a" />
                <span className="login-scene-bar bar-b" />
                <span className="login-scene-bar bar-c" />
              </div>
              <div className="login-scene-track">
                <span className="login-scene-track-fill" />
              </div>
            </div>
            <div className="login-scene-card login-scene-card-side">
              <div className="login-scene-stack">
                <span className="login-scene-box" />
                <span className="login-scene-box" />
                <span className="login-scene-box" />
              </div>
            </div>
            <div className="login-scene-card login-scene-card-pie">
              <div className="login-scene-pie-chart">
                <span className="login-scene-pie-core" />
              </div>
              <div className="login-scene-pie-legend">
                <span><i className="login-scene-legend-tone tone-green" /> Operación</span>
                <span><i className="login-scene-legend-tone tone-gold" /> Cumplido</span>
                <span><i className="login-scene-legend-tone tone-blue" /> Calidad</span>
              </div>
            </div>
            <div className="login-scene-card login-scene-card-bottom">
              <div className="login-scene-timeline">
                <span className="login-scene-node active" />
                <span className="login-scene-node" />
                <span className="login-scene-node" />
                <span className="login-scene-node success" />
              </div>
            </div>
          </div>
        </article>

        <article className="login-form-panel">
          <div className="login-form-panel-head">
            <h2>Ingresar a COPMEC</h2>
            <p>Acceso seguro</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="app-modal-field login-field">
              <span>Player de acceso</span>
              <input value={loginForm.login} onChange={(event) => onChange("login", event.target.value)} placeholder="Tu acceso" />
            </label>
            <label className="app-modal-field login-field">
              <span>Contraseña</span>
              <div className="login-password-field">
                <input type={showPassword ? "text" : "password"} value={loginForm.password} onChange={(event) => onChange("password", event.target.value)} placeholder="Contraseña" />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error ? <p className="validation-text">{error}</p> : null}
            <button type="submit" className="primary-button login-submit-button">Continuar</button>
          </form>

          {demoUsers.length ? (
            <div className="login-demo-users">
              <h3>Accesos disponibles</h3>
              <div className="login-demo-list">
                {demoUsers.map((user) => (
                  <button key={user.id} type="button" className="chip login-demo-chip" onClick={() => {
                    onChange("login", user.login || user.email);
                  }}>
                    {user.role} · {user.login || user.email}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}

function BootstrapLeadSetup({ setupForm, onChange, onSubmit, error, areaOptions, onAddArea }) {
  return (
    <main className="login-shell">
      <div className="login-aurora login-aurora-one" />
      <div className="login-aurora login-aurora-two" />
      <section className="login-panel">
        <article className="login-hero-panel setup-hero-panel">
          <div className="login-brand-block">
            <span className="login-badge">Configuración inicial</span>
            <h1>Crear primer Lead</h1>
          </div>

          <div className="login-visual-scene setup-scene" aria-hidden="true">
            <div className="login-scene-grid" />
            <div className="login-scene-scanline" />
            <div className="login-scene-ring login-scene-ring-one" />
            <div className="login-scene-card login-scene-card-main setup-card-main">
              <div className="login-scene-lock-core" />
              <div className="login-scene-lock-shackle" />
            </div>
            <div className="login-scene-card login-scene-card-side setup-card-side">
              <div className="login-scene-status-pill" />
              <div className="login-scene-status-pill short" />
            </div>
          </div>
        </article>

        <article className="login-form-panel">
          <div className="login-form-panel-head">
            <h2>Configuración inicial del player principal</h2>
            <p>Primer acceso del sistema</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="app-modal-field login-field">
              <span>Nombre del player principal</span>
              <input value={setupForm.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Nombre completo" />
            </label>
            <label className="app-modal-field login-field">
              <span>Player de acceso del player principal (opcional)</span>
              <input value={setupForm.username} onChange={(event) => onChange("username", event.target.value)} placeholder="Ej: alejandro.cruz" />
            </label>
            <label className="app-modal-field login-field">
              <span>Área</span>
              <div className="area-selector-row">
                <select value={setupForm.area} onChange={(event) => onChange("area", event.target.value)}>
                  <option value="">Seleccionar área...</option>
                  {areaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <button type="button" className="icon-button area-add-button" onClick={onAddArea} aria-label="Agregar nueva área"><Plus size={16} /></button>
              </div>
            </label>
            <label className="app-modal-field login-field">
              <span>Cargo</span>
              <input value={setupForm.jobTitle} onChange={(event) => onChange("jobTitle", event.target.value)} placeholder="Ej: Encargado de Mejora Continua" />
            </label>
            <label className="app-modal-field login-field">
              <span>Contraseña inicial</span>
              <input type="password" value={setupForm.password} onChange={(event) => onChange("password", event.target.value)} placeholder="Contraseña segura" />
            </label>
            {error ? <p className="validation-text">{error}</p> : null}
            <button type="submit" className="primary-button login-submit-button">Crear player principal y cerrar acceso maestro</button>
          </form>
        </article>
      </section>
    </main>
  );
}

function Sidebar({ currentUser, page, onPageChange, isOpen, isCollapsed, onClose, onOpenProfile, onToggleCollapsed, allowedNavItems }) {
  return (
    <aside className={`sidebar-shell ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-mobile-actions">
        <button type="button" className="sidebar-close-button" onClick={onClose} aria-label="Cerrar menú">
          <X size={18} />
        </button>
      </div>
      <div className="sidebar-desktop-toggle">
        <button type="button" className="sidebar-collapse-button" onClick={onToggleCollapsed} aria-label={isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"} title={isCollapsed ? "Expandir menú" : "Contraer menú"}>
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <div className="brand-block">
        <CopmecBrand headingTag="h1" compact={isCollapsed} />
      </div>

      <nav className="sidebar-nav">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" className={`nav-item ${page === item.id ? "active" : ""}`} title={item.label} aria-label={item.label} onClick={() => {
              onPageChange(item.id);
              onClose?.();
            }}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" className="sidebar-profile-card" onClick={onOpenProfile} title={currentUser.name}>
        <span className="avatar-circle sidebar-profile-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
        <div className="sidebar-profile-meta">
          <strong>{currentUser.name}</strong>
          <span>{getUserJobTitle(currentUser) || currentUser.role}</span>
        </div>
      </button>
    </aside>
  );
}

function InventoryActivityConsumptionEditor({ activeCatalogItems, activityConsumptions, onToggle, onQuantityChange }) {
  if (!activeCatalogItems.length) {
    return <p className="inventory-activity-consumption-empty">Primero agrega actividades activas al catalogo para definir el consumo automatico por inicio.</p>;
  }

  return (
    <div className="inventory-activity-consumption-editor">
      {activeCatalogItems.map((item) => {
        const currentConsumption = activityConsumptions.find((entry) => entry.catalogActivityId === item.id);
        const isEnabled = Boolean(currentConsumption);
        return (
          <article key={item.id} className={`inventory-activity-consumption-row ${isEnabled ? "active" : ""}`.trim()}>
            <div className="inventory-activity-consumption-main">
              <div className="inventory-activity-consumption-copy">
                <strong>{item.name}</strong>
              </div>
              <button
                type="button"
                className={`switch-button ${isEnabled ? "on" : ""}`}
                onClick={() => onToggle(item.id, !isEnabled)}
                aria-pressed={isEnabled}
                aria-label={`${isEnabled ? "Desactivar" : "Activar"} consumo para ${item.name}`}
              >
                <span className="switch-thumb" />
              </button>
            </div>
            <label className="inventory-activity-consumption-quantity">
              <span>Cantidad por inicio</span>
              <input
                type="number"
                min="0"
                value={currentConsumption?.quantity || ""}
                onChange={(event) => onQuantityChange(item.id, event.target.value)}
                disabled={!isEnabled}
                placeholder={isEnabled ? "0" : "Activa la actividad"}
              />
            </label>
          </article>
        );
      })}
    </div>
  );
}

function createIdentityFormFromUser(currentUser) {
  return {
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    area: getUserArea(currentUser),
    jobTitle: getUserJobTitle(currentUser),
  };
}

function EmployeeProfileSummarySection({ currentUser, identityForm, isEditMode, editAvailabilityMessage, onIdentityFieldChange }) {
  return (
    <div className="profile-summary-card">
      <span className="avatar-circle profile-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
      <div className="profile-summary-body">
        <div className="profile-summary-topline">
          <strong>Datos principales</strong>
          <span className={`profile-status-pill ${currentUser.isActive ? "active" : "inactive"}`.trim()}>{currentUser.isActive ? "Activo" : "Inactivo"}</span>
        </div>
        {isEditMode ? (
          <>
            <label className="profile-summary-field">
              <span>Nombre</span>
              <input value={identityForm.name} onChange={(event) => onIdentityFieldChange("name", event.target.value)} placeholder="Nombre del player" />
            </label>
            <label className="profile-summary-field">
              <span>Player de acceso</span>
              <input value={identityForm.email} onChange={(event) => onIdentityFieldChange("email", event.target.value)} placeholder="Tu acceso" />
            </label>
          </>
        ) : (
          <div className="profile-summary-readonly-grid">
            <article className="profile-static-field">
              <span>Nombre</span>
              <strong>{currentUser.name}</strong>
            </article>
            <article className="profile-static-field">
              <span>Player de acceso</span>
              <strong>{currentUser.email}</strong>
            </article>
          </div>
        )}
        <div className="profile-summary-meta">
          <span>{(isEditMode ? identityForm.area : getUserArea(currentUser)).trim() || "Sin área asignada"}</span>
          <small>{editAvailabilityMessage}</small>
        </div>
      </div>
    </div>
  );
}

function EmployeeProfileDetailsSection({ currentUser, identityForm, isEditMode, onIdentityFieldChange }) {
  return (
    <div className="profile-detail-grid">
      {isEditMode ? (
        <>
          <label className="profile-detail-item profile-detail-item-editable profile-detail-item-wide">
            <span>Cargo</span>
            <input value={identityForm.jobTitle} onChange={(event) => onIdentityFieldChange("jobTitle", event.target.value)} placeholder="Ej: Encargado de Mejora Continua" />
          </label>
          <label className="profile-detail-item profile-detail-item-editable">
            <span>Área</span>
            <input value={identityForm.area} onChange={(event) => onIdentityFieldChange("area", event.target.value)} placeholder="Ej: Área de Mejora Continua" />
          </label>
        </>
      ) : (
        <article className="profile-detail-item profile-detail-item-wide">
          <span>Cargo</span>
          <strong>{getUserJobTitle(currentUser) || "Sin cargo asignado"}</strong>
        </article>
      )}
      {isEditMode ? null : (
        <article className="profile-detail-item">
          <span>Área</span>
          <strong>{getUserArea(currentUser) || "Sin área asignada"}</strong>
        </article>
      )}
      <article className="profile-detail-item">
        <span>Rol interno</span>
        <strong>{currentUser.role}</strong>
      </article>
    </div>
  );
}

function EmployeeProfilePasswordSection({ passwordPanelOpen, onToggle, passwordForm, onPasswordChange, onSubmit }) {
  return (
    <div className={`profile-password-shell ${passwordPanelOpen ? "open" : "collapsed"}`.trim()}>
      <button type="button" className="profile-password-toggle" onClick={onToggle} aria-expanded={passwordPanelOpen}>
        <div>
          <strong>Contraseña</strong>
          <span>{passwordPanelOpen ? "Ocultar cambio de contraseña" : "Presiona la flecha para cambiar la contraseña"}</span>
        </div>
        <span className={`profile-password-toggle-icon ${passwordPanelOpen ? "open" : ""}`.trim()}>
          <ArrowDown size={16} />
        </span>
      </button>
      {passwordPanelOpen ? (
        <div className="profile-password-body">
          <label className="app-modal-field">
            <span>Nueva contraseña</span>
            <input type="password" value={passwordForm.password} onChange={(event) => onPasswordChange((current) => ({ ...current, password: event.target.value, message: "" }))} />
          </label>
          <label className="app-modal-field">
            <span>Confirmar nueva contraseña</span>
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => onPasswordChange((current) => ({ ...current, confirmPassword: event.target.value, message: "" }))} />
          </label>
          <button type="button" className="primary-button profile-password-submit" onClick={onSubmit}>Guardar contraseña</button>
          {passwordForm.message ? <p className="inline-message">{passwordForm.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function EmployeeProfileMessages({ identityMessage, passwordMessage }) {
  if (!identityMessage && !passwordMessage) {
    return null;
  }

  return (
    <div className="profile-action-messages">
      {identityMessage ? <p className={identityMessage.includes("actualizados") ? "inline-success-message" : "validation-text"}>{identityMessage}</p> : null}
      {passwordMessage ? <p className="inline-message">{passwordMessage}</p> : null}
    </div>
  );
}

function EmployeeProfileModal({ currentUser, passwordForm, onPasswordChange, onSubmit, onClose, onLogout, onUpdateIdentity }) {
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [identityForm, setIdentityForm] = useState(() => createIdentityFormFromUser(currentUser));
  const [identityMessage, setIdentityMessage] = useState("");
  const canBypassEditLimit = canBypassSelfProfileEditLimit(currentUser);
  const selfEditCount = Number(currentUser?.selfIdentityEditCount ?? 0);
  const hasSelfEditAvailable = canBypassEditLimit || selfEditCount < PROFILE_SELF_EDIT_LIMIT;
  const editAvailabilityMessage = getProfileEditAvailabilityMessage(canBypassEditLimit, hasSelfEditAvailable);

  useEffect(() => {
    setIdentityForm(createIdentityFormFromUser(currentUser));
    setIdentityMessage("");
    setIsEditMode(false);
  }, [currentUser]);

  function handleIdentityFieldChange(key, value) {
    setIdentityForm((current) => ({ ...current, [key]: value }));
    setIdentityMessage("");
  }

  function handleStartEditing() {
    if (!hasSelfEditAvailable) {
      setIdentityMessage("La autoedición del perfil ya fue utilizada. Desde ahora sólo un Senior o Lead puede corregir estos datos.");
      return;
    }
    setIdentityForm(createIdentityFormFromUser(currentUser));
    setIsEditMode(true);
    setIdentityMessage("");
  }

  function handleCancelEditing() {
    setIdentityForm(createIdentityFormFromUser(currentUser));
    setIsEditMode(false);
    setIdentityMessage("");
  }

  function handleSaveIdentity() {
    if (!identityForm.name.trim() || !identityForm.email.trim() || !identityForm.area.trim() || !identityForm.jobTitle.trim()) {
      setIdentityMessage("Captura nombre, player de acceso, área y cargo para guardar el perfil del player.");
      return;
    }
    const result = onUpdateIdentity({
      name: identityForm.name.trim(),
      username: identityForm.email.trim(),
      area: identityForm.area.trim(),
      jobTitle: identityForm.jobTitle.trim(),
    });
    setIdentityMessage(result?.message || "");
    if (result?.ok) {
      setIsEditMode(false);
    }
  }

  const footerActions = isEditMode
    ? [
        <button key="save-profile" type="button" className="primary-button" onClick={handleSaveIdentity}>Guardar datos</button>,
        <button key="cancel-edit" type="button" className="icon-button" onClick={handleCancelEditing}>Cancelar edición</button>,
        <button key="logout-profile" type="button" className="icon-button danger" onClick={onLogout}>Cerrar sesión</button>,
      ]
    : [
        <button key="edit-profile" type="button" className="primary-button" onClick={handleStartEditing}>Editar</button>,
        <button key="logout-profile" type="button" className="icon-button danger" onClick={onLogout}>Cerrar sesión</button>,
      ];

  return (
    <Modal
      open
      className="profile-modal"
      title="Perfil de player"
      confirmLabel="Cerrar"
      hideCancel
      onClose={onClose}
      footerActions={footerActions}
    >
      <div className="modal-form-grid">
        <EmployeeProfileSummarySection
          currentUser={currentUser}
          identityForm={identityForm}
          isEditMode={isEditMode}
          editAvailabilityMessage={editAvailabilityMessage}
          onIdentityFieldChange={handleIdentityFieldChange}
        />
        <EmployeeProfileDetailsSection
          currentUser={currentUser}
          identityForm={identityForm}
          isEditMode={isEditMode}
          onIdentityFieldChange={handleIdentityFieldChange}
        />
        <EmployeeProfilePasswordSection
          passwordPanelOpen={passwordPanelOpen}
          onToggle={() => setPasswordPanelOpen((current) => !current)}
          passwordForm={passwordForm}
          onPasswordChange={onPasswordChange}
          onSubmit={onSubmit}
        />
        <EmployeeProfileMessages identityMessage={identityMessage} passwordMessage={passwordForm.message} />
      </div>
    </Modal>
  );
}

function ForcedPasswordChangeModal({ passwordForm, onPasswordChange, onSubmit }) {
  return (
    <Modal
      open
      title="Actualiza tu contraseña temporal"
      confirmLabel="Guardar mi nueva contraseña"
      hideCancel
      onClose={() => {}}
      onConfirm={onSubmit}
      className="profile-modal"
    >
      <div className="modal-form-grid">
        <p className="modal-footnote">Tu contraseña fue restablecida. Para continuar debes crear una contraseña nueva que solo tú conozcas.</p>
        <label className="app-modal-field">
          <span>Nueva contraseña</span>
          <input type="password" value={passwordForm.password} onChange={(event) => onPasswordChange((current) => ({ ...current, password: event.target.value, message: "" }))} />
        </label>
        <label className="app-modal-field">
          <span>Confirmar nueva contraseña</span>
          <input type="password" value={passwordForm.confirmPassword} onChange={(event) => onPasswordChange((current) => ({ ...current, confirmPassword: event.target.value, message: "" }))} />
        </label>
        <p className="modal-footnote">La nueva contraseña definitiva sí debe incluir mayúscula, minúscula, número, símbolo y al menos 10 caracteres.</p>
        {passwordForm.message ? <p className="validation-text">{passwordForm.message}</p> : null}
      </div>
    </Modal>
  );
}

function App() { // NOSONAR
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState(INITIAL_ROUTE_STATE.page);
  const [dashboardSectionsOpen, setDashboardSectionsOpen] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DASHBOARD_SECTIONS_KEY) || "null");
      const storedSections = saved && typeof saved === "object" ? saved : EMPTY_OBJECT;
      return { ...DEFAULT_DASHBOARD_SECTION_STATE, ...storedSections };
    } catch {
      return DEFAULT_DASHBOARD_SECTION_STATE;
    }
  });
  const [adminTab, setAdminTab] = useState(() => normalizeAdminTab(INITIAL_ROUTE_STATE.adminTab));
  const [selectedWeekId] = useState(() => {
    const initial = loadState();
    return INITIAL_ROUTE_STATE.selectedWeekId || initial.weeks.find((week) => week.isActive)?.id || initial.weeks[0]?.id || "";
  });
  const [selectedHistoryWeekId, setSelectedHistoryWeekId] = useState(() => {
    const initial = loadState();
    return INITIAL_ROUTE_STATE.selectedHistoryWeekId || initial.weeks[0]?.id || "";
  });
  const [inventoryTab, setInventoryTab] = useState(INVENTORY_DOMAIN_BASE);
  const [inventoryCleaningSite, setInventoryCleaningSite] = useState(DEFAULT_CLEANING_SITE);
  const [inventoryActionsMenuOpen, setInventoryActionsMenuOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [dashboardFilters, setDashboardFilters] = useState({ periodType: "week", periodKey: "all", responsibleId: "all", area: "all", source: "all", startDate: "", endDate: "" });
  const [pauseState, setPauseState] = useState({ open: false, activityId: null, reason: "", error: "" });
  const [boardPauseState, setBoardPauseState] = useState({ open: false, boardId: null, rowId: null, reason: "", error: "" });
  const [catalogModal, setCatalogModal] = useState({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: "General" });
  const [editWeekId, setEditWeekId] = useState(null);
  const [editWeekActivityId, setEditWeekActivityId] = useState("");
  const [historyPauseActivityId, setHistoryPauseActivityId] = useState(null);
  const [userModal, setUserModal] = useState(() => createUserModalState());
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [resetUserPasswordModal, setResetUserPasswordModal] = useState({ open: false, userId: null, userName: "", password: "", message: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("Todos los roles");
  const [usersViewTab, setUsersViewTab] = useState("table");
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "", message: "" });
  const [areaModal, setAreaModal] = useState({ open: false, target: "user", name: "", error: "" });
  const [controlBoardDraft, setControlBoardDraft] = useState(createEmptyBoardDraft);
  const [controlBoardFeedback, setControlBoardFeedback] = useState("");
  const [boardImportedRowsDraft, setBoardImportedRowsDraft] = useState([]);
  const [excelFormulaWizard, setExcelFormulaWizard] = useState({ open: false, items: [] });
  const [boardBuilderModal, setBoardBuilderModal] = useState({ open: false, mode: "create", boardId: null });
  const [customBoardSearch, setCustomBoardSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("Todas");
  const [templateEditorModal, setTemplateEditorModal] = useState({ open: false, id: null, name: "", description: "", category: "", visibilityType: "department", sharedDepartments: [], sharedUserIds: [] });
  const [templatePreviewId, setTemplatePreviewId] = useState(null);
  const [componentStudioOpen, setComponentStudioOpen] = useState(false);
  const [editingDraftColumnId, setEditingDraftColumnId] = useState(null);
  const [boardRuntimeFeedback, setBoardRuntimeFeedback] = useState({ tone: "", message: "" });
  const [boardFinishConfirm, setBoardFinishConfirm] = useState({ open: false, boardId: null, rowId: null, message: "" });
  const [deleteBoardRowState, setDeleteBoardRowState] = useState({ open: false, boardId: null, rowId: null });
  const [inventoryModal, setInventoryModal] = useState(() => createInventoryModalState());
  const [inventoryMovementModal, setInventoryMovementModal] = useState(() => createInventoryMovementModalState());
  const [inventoryTransferViewerState, setInventoryTransferViewerState] = useState({ open: false, itemId: null });
  const [inventoryTransferConfirmModal, setInventoryTransferConfirmModal] = useState(() => createInventoryTransferConfirmModalState());
  const [inventoryRestockModal, setInventoryRestockModal] = useState(() => createInventoryRestockModalState());
  const [inventoryImportFeedback, setInventoryImportFeedback] = useState({ tone: "", message: "" });
  const [permissionsFeedback, setPermissionsFeedback] = useState({ tone: "", message: "" });
  const [appToasts, setAppToasts] = useState([]);
  const [notificationInboxState, setNotificationInboxState] = useState(() => readNotificationInboxState());
  const [notificationReadState, setNotificationReadState] = useState(() => readNotificationReadState());
  const [notificationDeletedState, setNotificationDeletedState] = useState(() => readNotificationDeletedState());
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationPanelTab, setNotificationPanelTab] = useState("unread");
  const [selectedPermissionUserId, setSelectedPermissionUserId] = useState("");
  const [deleteInventoryId, setDeleteInventoryId] = useState(null);
  const [deleteBoardId, setDeleteBoardId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  const [selectedCustomBoardId, setSelectedCustomBoardId] = useState(INITIAL_ROUTE_STATE.selectedBoardId);
  const [selectedCustomBoardViewId, setSelectedCustomBoardViewId] = useState("current");
  const [customBoardActionsMenuOpen, setCustomBoardActionsMenuOpen] = useState(false);
  const [selectedPermissionBoardId, setSelectedPermissionBoardId] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginDirectory, setLoginDirectory] = useState(EMPTY_LOGIN_DIRECTORY);
  const [bootstrapLeadForm, setBootstrapLeadForm] = useState({ name: "", username: "", area: "", jobTitle: "", password: "" });
  const [bootstrapLeadError, setBootstrapLeadError] = useState("");
  const [auditFilters, setAuditFilters] = useState({ scope: "all", userId: "all", period: "all", search: "" });
  const [sessionUserId, setSessionUserId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState("Conectando");
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securityEventsStatus, setSecurityEventsStatus] = useState("idle");
  const isHydratedRef = useRef(false);
  const skipNextSyncRef = useRef(false);
  const contentShellRef = useRef(null);
  const notificationCenterRef = useRef(null);
  const inventoryFileInputRef = useRef(null);
  const boardExcelFileInputRef = useRef(null);
  const permissionFileInputRef = useRef(null);
  const customBoardActionsMenuRef = useRef(null);
  const inventoryActionsMenuRef = useRef(null);
  const sessionSnapshotRef = useRef({ userId: "", sessionVersion: 0 });

  function dismissAppToast(toastId) {
    setAppToasts((current) => current.map((toast) => (toast.id === toastId ? { ...toast, isClosing: true } : toast)));
    globalThis.setTimeout(() => {
      setAppToasts((current) => current.filter((toast) => toast.id !== toastId));
    }, 180);
  }

  function pushAppToast(message, tone = "success") {
    const trimmedMessage = String(message || "").trim();
    if (!trimmedMessage) return;

    const nextToastId = makeId("toast");
    setAppToasts((current) => current.concat({ id: nextToastId, message: trimmedMessage, tone, isClosing: false }).slice(-4));
    globalThis.setTimeout(() => {
      dismissAppToast(nextToastId);
    }, 3400);
  }

  function markNotificationIdsAsRead(notificationIds = []) {
    if (!sessionUserId || !notificationIds.length) return;
    setNotificationReadState((current) => {
      const knownIds = new Set(Array.isArray(current[sessionUserId]) ? current[sessionUserId] : []);
      notificationIds.forEach((notificationId) => {
        if (notificationId) knownIds.add(notificationId);
      });
      return {
        ...current,
        [sessionUserId]: Array.from(knownIds).slice(-300),
      };
    });
  }

  function handleToggleNotificationPanel() {
    setNotificationPanelOpen((current) => !current);
  }

  function deleteNotificationIds(notificationIds = []) {
    if (!sessionUserId || !notificationIds.length) return;
    setNotificationDeletedState((current) => {
      const knownIds = new Set(Array.isArray(current[sessionUserId]) ? current[sessionUserId] : []);
      notificationIds.forEach((notificationId) => {
        if (notificationId) knownIds.add(notificationId);
      });
      return {
        ...current,
        [sessionUserId]: Array.from(knownIds).slice(-500),
      };
    });
  }

  function handleDeleteNotification(notificationId) {
    deleteNotificationIds([notificationId]);
  }

  function handleDeleteAllReadNotifications() {
    deleteNotificationIds(readNotifications.map((notification) => notification.id));
  }

  function handleOpenNotification(notification) {
    if (!notification) return;
    if (!notification.isLocked) {
      markNotificationIdsAsRead([notification.id]);
    }
    setNotificationPanelOpen(false);

    if (notification.targetAction === "profile") {
      setProfileModalOpen(true);
    }

    if (notification.targetDomain) {
      setInventoryTab(notification.targetDomain);
    }
    if (notification.targetPage) {
      setPage(notification.targetPage);
    }
  }

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(notificationReadState));
  }, [notificationReadState]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_DELETED_KEY, JSON.stringify(notificationDeletedState));
  }, [notificationDeletedState]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_INBOX_KEY, JSON.stringify(notificationInboxState));
  }, [notificationInboxState]);

  useEffect(() => {
    if (!notificationPanelOpen) return undefined;

    function handleDocumentPointerDown(event) {
      if (!notificationCenterRef.current?.contains(event.target)) {
        setNotificationPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentPointerDown);
    return () => document.removeEventListener("mousedown", handleDocumentPointerDown);
  }, [notificationPanelOpen]);

  useEffect(() => {
    if (!boardRuntimeFeedback.message) return;
    pushAppToast(boardRuntimeFeedback.message, boardRuntimeFeedback.tone || "success");
    setBoardRuntimeFeedback({ tone: "", message: "" });
  }, [boardRuntimeFeedback]);

  useEffect(() => {
    if (!inventoryImportFeedback.message) return;
    pushAppToast(inventoryImportFeedback.message, inventoryImportFeedback.tone || "success");
    setInventoryImportFeedback({ tone: "", message: "" });
  }, [inventoryImportFeedback]);

  useEffect(() => {
    if (!permissionsFeedback.message) return;
    pushAppToast(permissionsFeedback.message, permissionsFeedback.tone || "success");
    setPermissionsFeedback({ tone: "", message: "" });
  }, [permissionsFeedback]);

  useEffect(() => {
    if (!controlBoardFeedback) return;
    pushAppToast(controlBoardFeedback, inferFeedbackToneFromMessage(controlBoardFeedback));
    setControlBoardFeedback("");
  }, [controlBoardFeedback]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    globalThis.scrollTo({ top: 0, left: 0, behavior: "instant" });
    contentShellRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    if (!customBoardActionsMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!customBoardActionsMenuRef.current?.contains(event.target)) {
        setCustomBoardActionsMenuOpen(false);
      }
    }

    globalThis.addEventListener("pointerdown", handlePointerDown);
    return () => globalThis.removeEventListener("pointerdown", handlePointerDown);
  }, [customBoardActionsMenuOpen]);

  useEffect(() => {
    if (!inventoryActionsMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!inventoryActionsMenuRef.current?.contains(event.target)) {
        setInventoryActionsMenuOpen(false);
      }
    }

    globalThis.addEventListener("pointerdown", handlePointerDown);
    return () => globalThis.removeEventListener("pointerdown", handlePointerDown);
  }, [inventoryActionsMenuOpen]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_SECTIONS_KEY, JSON.stringify(dashboardSectionsOpen));
  }, [dashboardSectionsOpen]);

  useEffect(() => {
    document.title = "COPMEC";
  }, []);

  useEffect(() => {
    const shouldPersistRoute = Boolean(sessionUserId && sessionUserId !== BOOTSTRAP_MASTER_ID);
    const nextQuery = shouldPersistRoute
      ? buildRouteQuery({
          page,
          adminTab,
          selectedBoardId: selectedCustomBoardId,
          selectedWeekId,
          selectedHistoryWeekId,
        })
      : "";
    const nextPath = shouldPersistRoute ? buildRoutePath(page) : "/";
    const queryPrefix = nextQuery ? `?${nextQuery}` : "";
    const nextUrl = `${nextPath}${queryPrefix}${globalThis.location.hash || ""}`;
    globalThis.history.replaceState(null, "", nextUrl);
  }, [adminTab, page, selectedCustomBoardId, selectedHistoryWeekId, selectedWeekId, sessionUserId]);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        const directory = await requestJson("/auth/login-options");
        if (active) {
          setLoginDirectory({
            system: {
              masterBootstrapEnabled: Boolean(directory?.system?.masterBootstrapEnabled),
              masterUsername: directory?.system?.masterUsername || null,
              showBootstrapMasterHint: Boolean(directory?.system?.showBootstrapMasterHint),
            },
            demoUsers: Array.isArray(directory?.demoUsers) ? directory.demoUsers : [],
          });
        }
      } catch {
        if (active) {
          setLoginDirectory(EMPTY_LOGIN_DIRECTORY);
        }
      }

      try {
        const session = await requestJson("/auth/session");
        if (!active) return;
        setSessionUserId(session.userId || "");
      } catch {
        if (active) {
          setSessionUserId("");
          isHydratedRef.current = true;
          setSyncStatus("Modo local");
        }
      }
    }

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionUserId || sessionUserId === BOOTSTRAP_MASTER_ID) {
      if (!sessionUserId) {
        setSyncStatus("Modo local");
      }
      isHydratedRef.current = true;
      return undefined;
    }

    let active = true;
    const events = createWarehouseEventSource();

    async function hydrate() {
      try {
        const remoteState = await requestJson("/warehouse/state");
        if (!active) return;
        const normalizedState = normalizeWarehouseState(remoteState);
        skipNextSyncRef.current = true;
        setState(normalizedState);
        setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
        setSyncStatus("Sincronizado");
      } catch (error) {
        if (!active) return;
        if (isSessionRequiredError(error)) {
          invalidateClientSession("Tu sesión terminó. Vuelve a iniciar sesión.");
        }
        setSyncStatus("Modo local");
      } finally {
        isHydratedRef.current = true;
      }
    }

    hydrate();

    events.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== "state" || !payload.state) return;
        const normalizedState = normalizeWarehouseState(payload.state);
        const nextSessionUser = normalizedState.users.find((user) => user.id === sessionUserId) || null;
        const shouldRevalidateSession = Boolean(
          sessionUserId
          && sessionUserId !== BOOTSTRAP_MASTER_ID
          && (!nextSessionUser || Number(nextSessionUser.sessionVersion || 0) !== Number(sessionSnapshotRef.current.sessionVersion || 0)),
        );
        skipNextSyncRef.current = true;
        setState(normalizedState);
        setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
        setSyncStatus("Sincronizado");
        if (shouldRevalidateSession) {
          requestJson("/auth/session").catch((error) => {
            if (error?.status === 401) {
              invalidateClientSession("Tu sesión se cerró porque tu acceso cambió. Si te restablecieron la contraseña, entra con la clave temporal.");
            }
          });
        }
      } catch {
        setSyncStatus("Sincronizado");
      }
    };

    events.onerror = () => {
      if (active) {
        setSyncStatus((current) => (current === "Modo local" ? current : "Reconectando"));
      }
    };

    return () => {
      active = false;
      events.close();
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (!ENABLE_LEGACY_WHOLE_STATE_SYNC) return;
    if (!sessionUserId) return;
    if (!isHydratedRef.current) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const timer = globalThis.setTimeout(async () => {
      try {
        const nextState = await requestJson("/warehouse/state", {
          method: "PUT",
          body: JSON.stringify(state),
        });
        skipNextSyncRef.current = true;
        const normalizedState = normalizeWarehouseState(nextState);
        setState(normalizedState);
        setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
        setSyncStatus("Sincronizado");
      } catch (error) {
        if (isSessionRequiredError(error)) {
          invalidateClientSession("Tu sesión terminó. Vuelve a iniciar sesión.");
        } else if (error?.status === 409) {
          try {
            const remoteState = await requestJson("/warehouse/state");
            skipNextSyncRef.current = true;
            const normalizedState = normalizeWarehouseState(remoteState);
            setState(normalizedState);
            setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
            setSyncStatus("Sincronizado");
            return;
          } catch {
            // Ignore and fall back to local mode.
          }
        }
        setSyncStatus("Modo local");
      }
    }, 250);

    return () => globalThis.clearTimeout(timer);
  }, [sessionUserId, state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === sessionUserId) || null,
    [sessionUserId, state.users],
  );
  const managedUserIds = useMemo(
    () => (currentUser ? getManagedUserIds(state.users, currentUser.id) : new Set()),
    [currentUser, state.users],
  );
  const isBootstrapMasterSession = sessionUserId === BOOTSTRAP_MASTER_ID && loginDirectory.system?.masterBootstrapEnabled;
  const isForcedPasswordChange = Boolean(currentUser?.mustChangePassword && sessionUserId && !isBootstrapMasterSession);
  const catalogMap = useMemo(() => new Map(state.catalog.map((item) => [item.id, item])), [state.catalog]);
  const userMap = useMemo(() => new Map(state.users.map((item) => [item.id, item])), [state.users]);
  const activeWeek = useMemo(
    () => state.weeks.find((week) => week.id === selectedWeekId) || state.weeks.find((week) => week.isActive) || state.weeks[0] || null,
    [selectedWeekId, state.weeks],
  );
  const historyWeek = useMemo(
    () => state.weeks.find((week) => week.id === selectedHistoryWeekId) || state.weeks[0] || null,
    [selectedHistoryWeekId, state.weeks],
  );
  const visibleDashboardActivities = useMemo(() => {
    const scopedIds = currentUser ? getManagedUserIds(state.users, currentUser.id) : new Set();
    return state.activities.filter((activity) => !currentUser || currentUser.role === ROLE_LEAD || activity.responsibleId === currentUser.id || scopedIds.has(activity.responsibleId));
  }, [currentUser, state.activities, state.users]);

  const completedActivities = useMemo(
    () => visibleDashboardActivities.filter((activity) => activity.status === STATUS_FINISHED),
    [visibleDashboardActivities],
  );

  const dashboardVisibleControlBoards = useMemo(() => {
    if (!currentUser) return [];
    return (state.controlBoards || []).filter((board) => getBoardVisibleToUser(board, currentUser));
  }, [currentUser, state.controlBoards]);

  const dashboardVisibleBoardHistorySnapshots = useMemo(() => {
    if (!currentUser) return [];
    return (state.boardWeekHistory || []).filter((snapshot) => getBoardVisibleToUser(snapshot, currentUser));
  }, [currentUser, state.boardWeekHistory]);

  const activityPauseSummaryMap = useMemo(() => {
    const summary = new Map();
    (state.pauseLogs || []).forEach((log) => {
      if (!summary.has(log.weekActivityId)) {
        summary.set(log.weekActivityId, { count: 0, totalSeconds: 0, reasons: [] });
      }
      const current = summary.get(log.weekActivityId);
      current.count += 1;
      current.totalSeconds += log.pauseDurationSeconds || 0;
      if (log.pauseReason) current.reasons.push(log.pauseReason);
    });
    return summary;
  }, [state.pauseLogs]);

  const dashboardRecords = useMemo(() => {
    const activityRecords = visibleDashboardActivities.map((activity) => {
      const responsibleUser = userMap.get(activity.responsibleId);
      const pauseSummary = activityPauseSummaryMap.get(activity.id) || { count: 0, totalSeconds: 0, reasons: [] };
      const durationSeconds = getElapsedSeconds(activity, now);
      const limitMinutes = getTimeLimitMinutes(activity, catalogMap);
      return {
        id: `activity-${activity.id}`,
        rawId: activity.id,
        source: "activity",
        sourceLabel: "Actividad semanal",
        label: getActivityLabel(activity, catalogMap),
        boardName: "Actividades semanales",
        responsibleId: activity.responsibleId || "",
        responsibleName: responsibleUser?.name || "Sin player",
        area: getUserArea(responsibleUser) || "Sin área",
        occurredAt: activity.endTime || activity.activityDate || activity.startTime || activity.lastResumedAt,
        status: activity.status || STATUS_PENDING,
        durationSeconds,
        limitMinutes,
        excessSeconds: limitMinutes > 0 ? Math.max(0, durationSeconds - limitMinutes * 60) : 0,
        pauseCount: pauseSummary.count,
        pauseSeconds: pauseSummary.totalSeconds,
        pauseReasons: pauseSummary.reasons,
      };
    });

    const boardRecords = dashboardVisibleControlBoards.flatMap((board) => (board.rows || []).map((row) => {
      const responsibleUser = userMap.get(row.responsibleId || board.ownerId);
      const durationSeconds = getElapsedSeconds(row, now);
      return {
        id: `board-${board.id}-${row.id}`,
        rawId: row.id,
        source: "board",
        sourceLabel: "Tablero operativo",
        label: board.name,
        boardName: board.name,
        responsibleId: row.responsibleId || board.ownerId || "",
        responsibleName: responsibleUser?.name || userMap.get(board.ownerId)?.name || "Sin player",
        area: getUserArea(responsibleUser) || getUserArea(userMap.get(board.ownerId)) || "Sin área",
        occurredAt: row.endTime || row.createdAt || row.startTime || row.lastResumedAt,
        status: row.status || STATUS_PENDING,
        durationSeconds,
        limitMinutes: 0,
        excessSeconds: 0,
        pauseCount: 0,
        pauseSeconds: 0,
        pauseReasons: [],
      };
    }));

    const historicalBoardRecords = dashboardVisibleBoardHistorySnapshots.flatMap((snapshot) => (snapshot.rows || []).map((row) => {
      const responsibleUser = userMap.get(row.responsibleId || snapshot.ownerId);
      const durationSeconds = getElapsedSeconds(row, now);
      return {
        id: `board-history-${snapshot.id}-${row.id}`,
        rawId: `${snapshot.id}-${row.id}`,
        source: "board",
        sourceLabel: "Histórico de tablero",
        label: snapshot.boardName,
        boardName: snapshot.boardName,
        responsibleId: row.responsibleId || snapshot.ownerId || "",
        responsibleName: responsibleUser?.name || userMap.get(snapshot.ownerId)?.name || "Sin player",
        area: getUserArea(responsibleUser) || getUserArea(userMap.get(snapshot.ownerId)) || "Sin área",
        occurredAt: row.endTime || row.createdAt || row.startTime || row.lastResumedAt || snapshot.archivedAt,
        status: row.status || STATUS_PENDING,
        durationSeconds,
        limitMinutes: 0,
        excessSeconds: 0,
        pauseCount: 0,
        pauseSeconds: 0,
        pauseReasons: [],
      };
    }));

    return activityRecords.concat(boardRecords, historicalBoardRecords).filter((record) => Boolean(record.occurredAt));
  }, [activityPauseSummaryMap, catalogMap, dashboardVisibleBoardHistorySnapshots, dashboardVisibleControlBoards, now, state.activities, userMap, visibleDashboardActivities]);

  const dateFilteredDashboardRecords = useMemo(() => {
    const startDate = getDashboardFilterStartDate(dashboardFilters.startDate);
    const endDate = getDashboardFilterEndDate(dashboardFilters.endDate);
    return dashboardRecords.filter((record) => {
      const occurredAt = new Date(record.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) return false;
      const startOk = !startDate || occurredAt >= startDate;
      const endOk = !endDate || occurredAt <= endDate;
      return startOk && endOk;
    });
  }, [dashboardFilters.endDate, dashboardFilters.startDate, dashboardRecords]);

  const dashboardPeriodOptions = useMemo(() => {
    const optionsMap = new Map();
    dateFilteredDashboardRecords.forEach((record) => {
      const key = getDashboardPeriodKey(record.occurredAt, dashboardFilters.periodType);
      if (!key || optionsMap.has(key)) return;
      const range = getDashboardPeriodRange(record.occurredAt, dashboardFilters.periodType);
      optionsMap.set(key, {
        value: key,
        label: formatDashboardPeriodLabel(key, dashboardFilters.periodType),
        sortTime: range?.start?.getTime() || 0,
      });
    });

    return [{ value: "all", label: `Todos los ${getDashboardPeriodTypeLabel(dashboardFilters.periodType).toLowerCase()}s` }].concat(
      Array.from(optionsMap.values()).sort((a, b) => b.sortTime - a.sortTime).map(({ value, label }) => ({ value, label })),
    );
  }, [dashboardFilters.periodType, dateFilteredDashboardRecords]);

  useEffect(() => {
    if (dashboardFilters.periodKey === "all") return;
    if (!dashboardPeriodOptions.some((option) => option.value === dashboardFilters.periodKey)) {
      setDashboardFilters((current) => ({ ...current, periodKey: "all" }));
    }
  }, [dashboardFilters.periodKey, dashboardPeriodOptions]);

  const filteredDashboardRecords = useMemo(() => {
    return dateFilteredDashboardRecords.filter((record) => {
      const periodOk = dashboardFilters.periodKey === "all" || getDashboardPeriodKey(record.occurredAt, dashboardFilters.periodType) === dashboardFilters.periodKey;
      const responsibleOk = dashboardFilters.responsibleId === "all" || record.responsibleId === dashboardFilters.responsibleId;
      const areaOk = dashboardFilters.area === "all" || record.area === dashboardFilters.area;
      const sourceOk = dashboardFilters.source === "all" || record.source === dashboardFilters.source;
      return periodOk && responsibleOk && areaOk && sourceOk;
    });
  }, [dashboardFilters, dateFilteredDashboardRecords]);

  const filteredDashboardActivities = useMemo(
    () => filteredDashboardRecords.filter((record) => record.source === "activity"),
    [filteredDashboardRecords],
  );

  const filteredDashboardCompleted = useMemo(
    () => filteredDashboardRecords.filter((record) => record.status === STATUS_FINISHED),
    [filteredDashboardRecords],
  );

  const dashboardPauseLogs = useMemo(() => {
    const ids = new Set(filteredDashboardActivities.map((record) => record.rawId));
    return state.pauseLogs.filter((log) => ids.has(log.weekActivityId));
  }, [filteredDashboardActivities, state.pauseLogs]);

  const dashboardMetrics = useMemo(() => {
    const catalogItemsSnapshot = (state.catalog || []).filter((item) => !item.isDeleted);
    const total = filteredDashboardRecords.length;
    const completed = filteredDashboardRecords.filter((record) => record.status === STATUS_FINISHED).length;
    const running = filteredDashboardRecords.filter((record) => record.status === STATUS_RUNNING).length;
    const paused = filteredDashboardRecords.filter((record) => record.status === STATUS_PAUSED).length;
    const totalSeconds = filteredDashboardCompleted.reduce((sum, record) => sum + record.durationSeconds, 0);
    const averageMinutes = filteredDashboardCompleted.length ? totalSeconds / filteredDashboardCompleted.length / 60 : 0;
    const medianMinutes = filteredDashboardCompleted.length
      ? [...filteredDashboardCompleted].sort((a, b) => a.durationSeconds - b.durationSeconds)[Math.floor(filteredDashboardCompleted.length / 2)].durationSeconds / 60
      : 0;
    const sorted = [...filteredDashboardCompleted].sort((a, b) => a.durationSeconds - b.durationSeconds);
    const slaScoped = filteredDashboardRecords.filter((record) => record.limitMinutes > 0);
    const within = slaScoped.filter((record) => record.durationSeconds <= record.limitMinutes * 60).length;
    const exceeded = slaScoped.filter((record) => record.durationSeconds > record.limitMinutes * 60);
    const totalPauseSeconds = dashboardPauseLogs.reduce((sum, log) => sum + (log.pauseDurationSeconds || 0), 0);
    const catalogMandatoryCount = catalogItemsSnapshot.filter((item) => item.isMandatory).length;
    const catalogOptionalCount = Math.max(0, catalogItemsSnapshot.length - catalogMandatoryCount);
    const catalogFrequencyTypes = new Set(catalogItemsSnapshot.map((item) => String(item.frequency || "daily"))).size;
    return {
      total,
      completed,
      running,
      paused,
      totalHours: totalSeconds / 3600,
      averageMinutes,
      medianMinutes,
      fastest: sorted[0] || null,
      slowest: sorted.at(-1) || null,
      withinPercent: slaScoped.length ? (within / slaScoped.length) * 100 : 0,
      outsidePercent: slaScoped.length ? (exceeded.length / slaScoped.length) * 100 : 0,
      exceeded,
      pauseCount: dashboardPauseLogs.length,
      pauseHours: totalPauseSeconds / 3600,
      areaCount: new Set(filteredDashboardRecords.map((record) => record.area)).size,
      boardCount: new Set(filteredDashboardRecords.map((record) => record.boardName)).size,
      catalogActiveCount: catalogItemsSnapshot.length,
      catalogMandatoryCount,
      catalogOptionalCount,
      catalogFrequencyTypes,
    };
  }, [
    dashboardPauseLogs,
    filteredDashboardCompleted,
    filteredDashboardRecords,
    state.catalog,
  ]);

  const rankingByUser = useMemo(() => {
    const groups = new Map();
    filteredDashboardCompleted.forEach((record) => {
      if (!groups.has(record.responsibleId)) groups.set(record.responsibleId, []);
      groups.get(record.responsibleId).push(record.durationSeconds || 0);
    });
    return Array.from(groups.entries())
      .map(([responsibleId, values]) => ({
        responsibleId,
        averageMinutes: values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1) / 60,
        totalRecords: values.length,
      }))
      .sort((a, b) => a.averageMinutes - b.averageMinutes);
  }, [filteredDashboardCompleted]);

  const distributionByUser = useMemo(() => {
    const total = filteredDashboardRecords.length;
    if (!total) return [];
    const groups = new Map();
    filteredDashboardRecords.forEach((record) => {
      groups.set(record.responsibleId, (groups.get(record.responsibleId) || 0) + 1);
    });
    return Array.from(groups.entries()).map(([responsibleId, count]) => ({
      responsibleId,
      percent: (count / total) * 100,
      count,
    }));
  }, [filteredDashboardRecords]);

  const activityVsLimit = useMemo(() => {
    const groups = new Map();
    filteredDashboardActivities.forEach((record) => {
      if (!record.limitMinutes) return;
      const key = record.label;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record.durationSeconds || 0);
    });
    return Array.from(groups.entries()).map(([label, values]) => ({
      label,
      averageMinutes: values.reduce((sum, value) => sum + value, 0) / values.length / 60,
      limitMinutes: filteredDashboardActivities.find((record) => record.label === label)?.limitMinutes || 0,
    }));
  }, [filteredDashboardActivities]);

  const pauseAnalysis = useMemo(() => {
    const totalActivitySeconds = filteredDashboardActivities.reduce((sum, record) => sum + (record.durationSeconds || 0), 0);
    const groups = new Map();
    dashboardPauseLogs.forEach((log) => {
      if (!groups.has(log.pauseReason)) {
        groups.set(log.pauseReason, { reason: log.pauseReason, count: 0, totalSeconds: 0 });
      }
      const item = groups.get(log.pauseReason);
      item.count += 1;
      item.totalSeconds += log.pauseDurationSeconds || 0;
    });

    return Array.from(groups.values())
      .map((item) => ({
        ...item,
        percent: totalActivitySeconds ? (item.totalSeconds / totalActivitySeconds) * 100 : 0,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [dashboardPauseLogs, filteredDashboardActivities]);

  const dashboardAreaRows = useMemo(() => {
    const groups = new Map();
    filteredDashboardRecords.forEach((record) => {
      if (!groups.has(record.area)) {
        groups.set(record.area, { area: record.area, total: 0, completed: 0, totalSeconds: 0, slaTotal: 0, slaWithin: 0, boards: new Set() });
      }
      const item = groups.get(record.area);
      item.total += 1;
      item.boards.add(record.boardName);
      if (record.status === STATUS_FINISHED) {
        item.completed += 1;
        item.totalSeconds += record.durationSeconds || 0;
      }
      if (record.limitMinutes > 0) {
        item.slaTotal += 1;
        if (record.durationSeconds <= record.limitMinutes * 60) item.slaWithin += 1;
      }
    });
    return Array.from(groups.values())
      .map((item) => ({
        area: item.area,
        total: item.total,
        completed: item.completed,
        averageMinutes: item.completed ? item.totalSeconds / item.completed / 60 : 0,
        slaPercent: item.slaTotal ? (item.slaWithin / item.slaTotal) * 100 : 0,
        boardCount: item.boards.size,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredDashboardRecords]);

  const dashboardTrendRows = useMemo(() => {
    const groups = new Map();
    dashboardRecords
      .filter((record) => {
        const responsibleOk = dashboardFilters.responsibleId === "all" || record.responsibleId === dashboardFilters.responsibleId;
        const areaOk = dashboardFilters.area === "all" || record.area === dashboardFilters.area;
        const sourceOk = dashboardFilters.source === "all" || record.source === dashboardFilters.source;
        return responsibleOk && areaOk && sourceOk;
      })
      .forEach((record) => {
        const key = getDashboardPeriodKey(record.occurredAt, dashboardFilters.periodType);
        if (!groups.has(key)) {
          groups.set(key, { key, label: formatDashboardPeriodLabel(key, dashboardFilters.periodType), total: 0, completed: 0, totalSeconds: 0, sortTime: getDashboardPeriodRange(record.occurredAt, dashboardFilters.periodType)?.start?.getTime() || 0 });
        }
        const item = groups.get(key);
        item.total += 1;
        if (record.status === STATUS_FINISHED) {
          item.completed += 1;
          item.totalSeconds += record.durationSeconds || 0;
        }
      });

    return Array.from(groups.values())
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 6)
      .reverse();
  }, [dashboardFilters.area, dashboardFilters.periodType, dashboardFilters.responsibleId, dashboardFilters.source, dashboardRecords]);

  const dashboardParetoRows = useMemo(() => {
    const reasonMap = new Map();
    pauseAnalysis.forEach((item) => {
      reasonMap.set(`pause-${item.reason}`, {
        label: item.reason || "Pausa sin motivo",
        impactSeconds: item.totalSeconds,
        count: item.count,
      });
    });

    const excessGroups = new Map();
    dashboardMetrics.exceeded.forEach((record) => {
      if (!excessGroups.has(record.label)) {
        excessGroups.set(record.label, { label: `Exceso en ${record.label}`, impactSeconds: 0, count: 0 });
      }
      const item = excessGroups.get(record.label);
      item.impactSeconds += record.excessSeconds || 0;
      item.count += 1;
    });

    const combined = Array.from(reasonMap.values()).concat(Array.from(excessGroups.values())).sort((a, b) => b.impactSeconds - a.impactSeconds);
    const totalImpact = combined.reduce((sum, item) => sum + item.impactSeconds, 0);
    let cumulative = 0;

    return combined.slice(0, 8).map((item) => {
      const percent = totalImpact ? (item.impactSeconds / totalImpact) * 100 : 0;
      cumulative += percent;
      return {
        ...item,
        percent,
        cumulativePercent: cumulative,
      };
    });
  }, [dashboardMetrics.exceeded, pauseAnalysis]);

  const dashboardIshikawaRows = useMemo(() => {
    const groups = new Map();
    dashboardParetoRows.forEach((item) => {
      const category = getIshikawaCategory(item.label);
      if (!groups.has(category)) {
        groups.set(category, { category, impact: 0, count: 0, examples: [] });
      }
      const current = groups.get(category);
      current.impact += item.percent;
      current.count += item.count;
      if (current.examples.length < 3) current.examples.push(item.label);
    });
    return Array.from(groups.values()).sort((a, b) => b.impact - a.impact);
  }, [dashboardParetoRows]);

  const adminReportRows = useMemo(() => {
    return state.catalog
      .filter((item) => !item.isDeleted)
      .map((item) => {
        const exceeded = completedActivities.filter(
          (activity) => activity.catalogActivityId === item.id && activity.accumulatedSeconds > item.timeLimitMinutes * 60,
        );
        const averageExcessMinutes = exceeded.length
          ? exceeded.reduce((sum, activity) => sum + (activity.accumulatedSeconds - item.timeLimitMinutes * 60), 0) / exceeded.length / 60
          : 0;
        return {
          ...item,
          excessCount: exceeded.length,
          averageExcessMinutes,
        };
      })
      .sort((a, b) => b.excessCount - a.excessCount);
  }, [completedActivities, state.catalog]);

  const historyPauseLogs = useMemo(() => {
    if (!historyPauseActivityId) return [];
    return state.pauseLogs.filter((log) => log.weekActivityId === historyPauseActivityId);
  }, [historyPauseActivityId, state.pauseLogs]);

  const visibleUsers = useMemo(() => {
    if (!currentUser) return [];
    return state.users.filter((user) => canViewUserByAreaScope(currentUser, user));
  }, [currentUser, state.users]);
  const activeAssignableUsers = useMemo(() => visibleUsers.filter((user) => user.isActive), [visibleUsers]);

  const creatableRoles = useMemo(() => USER_ROLES.filter((role) => currentUser ? canCreateRole(currentUser.role, role) : false), [currentUser]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((user) => {
      const matchesSearch = !userSearch.trim() || user.name.toLowerCase().includes(userSearch.trim().toLowerCase());
      const matchesRole = userRoleFilter === "Todos los roles" || user.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [userRoleFilter, userSearch, visibleUsers]);

  const userStats = useMemo(
    () => ({
      total: visibleUsers.length,
      active: visibleUsers.filter((user) => user.isActive).length,
      admins: visibleUsers.filter((user) => user.role === ROLE_SR || user.role === ROLE_SSR).length,
      inactive: visibleUsers.filter((user) => !user.isActive).length,
    }),
    [visibleUsers],
  );

  const boardAssignmentsByUser = useMemo(() => {
    const counts = new Map();
    (state.controlBoards || []).forEach((board) => {
      const relatedUserIds = new Set([board.createdById, board.ownerId, ...(board.accessUserIds || [])].filter(Boolean));
      relatedUserIds.forEach((userId) => {
        counts.set(userId, (counts.get(userId) || 0) + 1);
      });
    });
    return counts;
  }, [state.controlBoards]);

  const usersCreatedByMap = useMemo(() => {
    const counts = new Map();
    (state.users || []).forEach((user) => {
      if (!user.createdById) return;
      counts.set(user.createdById, (counts.get(user.createdById) || 0) + 1);
    });
    return counts;
  }, [state.users]);

  const usersByAreaGroups = useMemo(() => {
    const groups = new Map();
    filteredUsers.forEach((user) => {
      const area = getUserArea(user) || "Sin área";
      if (!groups.has(area)) groups.set(area, []);
      groups.get(area).push(user);
    });

    return Array.from(groups.entries())
      .map(([area, users]) => ({ area, users: users.sort((left, right) => left.name.localeCompare(right.name)) }))
      .sort((left, right) => left.area.localeCompare(right.area));
  }, [filteredUsers]);

  const usersByCreatorGroups = useMemo(() => {
    const groups = new Map();
    filteredUsers.forEach((user) => {
      const creatorId = user.createdById || "unassigned";
      if (!groups.has(creatorId)) groups.set(creatorId, []);
      groups.get(creatorId).push(user);
    });

    return Array.from(groups.entries())
      .map(([creatorId, users]) => ({
        creatorId,
        creatorName: creatorId === "unassigned" ? "Sin creador registrado" : userMap.get(creatorId)?.name || creatorId,
        creatorArea: creatorId === "unassigned" ? "Sin área" : getUserArea(userMap.get(creatorId)) || "Sin área",
        users: users.sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => left.creatorName.localeCompare(right.creatorName));
  }, [filteredUsers, userMap]);

  const canResetOtherPasswords = currentUser?.role === ROLE_LEAD || currentUser?.role === ROLE_SR;

  const allInventoryItems = useMemo(
    () => (state.inventoryItems || []).map((item) => normalizeInventoryItemRecord(item)),
    [state.inventoryItems],
  );

  const inventoryItems = useMemo(() => {
    return allInventoryItems.filter((item) => {
      const term = inventorySearch.trim().toLowerCase();
      if (!term) return true;
      return [item.code, item.name, item.presentation, item.storageLocation, item.cleaningSite].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [allInventoryItems, inventorySearch]);

  const allInventoryItemsByDomain = useMemo(() => ({
    [INVENTORY_DOMAIN_BASE]: allInventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_BASE),
    [INVENTORY_DOMAIN_CLEANING]: allInventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_CLEANING),
    [INVENTORY_DOMAIN_ORDERS]: allInventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_ORDERS),
  }), [allInventoryItems]);

  const inventoryItemsByDomain = useMemo(() => ({
    [INVENTORY_DOMAIN_BASE]: inventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_BASE),
    [INVENTORY_DOMAIN_CLEANING]: inventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_CLEANING),
    [INVENTORY_DOMAIN_ORDERS]: inventoryItems.filter((item) => item.domain === INVENTORY_DOMAIN_ORDERS),
  }), [inventoryItems]);

  const inventoryItemsById = useMemo(
    () => new Map(allInventoryItems.map((item) => [item.id, item])),
    [allInventoryItems],
  );

  const currentInventoryDomainItems = useMemo(() => {
    const items = allInventoryItemsByDomain[inventoryTab] || [];
    if (inventoryTab !== INVENTORY_DOMAIN_CLEANING) {
      return items;
    }
    return items.filter((item) => item.cleaningSite === inventoryCleaningSite);
  }, [allInventoryItemsByDomain, inventoryCleaningSite, inventoryTab]);

  const currentInventoryItems = useMemo(() => {
    const items = inventoryItemsByDomain[inventoryTab] || [];
    if (inventoryTab !== INVENTORY_DOMAIN_CLEANING) {
      return items;
    }
    return items.filter((item) => item.cleaningSite === inventoryCleaningSite);
  }, [inventoryItemsByDomain, inventoryCleaningSite, inventoryTab]);

  const inventoryMovements = useMemo(
    () => (state.inventoryMovements || []).map((movement) => normalizeInventoryMovementRecord(movement)).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [state.inventoryMovements],
  );

  const currentInventoryMovements = useMemo(
    () => inventoryMovements.filter((movement) => {
      if (normalizeInventoryDomain(movement.domain) !== inventoryTab) {
        return false;
      }
      if (inventoryTab !== INVENTORY_DOMAIN_CLEANING) {
        return true;
      }
      const movementItem = inventoryItemsById.get(movement.itemId);
      return normalizeCleaningSite(movementItem?.cleaningSite || movement.cleaningSite) === inventoryCleaningSite;
    }),
    [inventoryCleaningSite, inventoryItemsById, inventoryMovements, inventoryTab],
  );

  const actionableLowStockInventoryItems = useMemo(
    () => allInventoryItems.filter((item) => item.domain !== INVENTORY_DOMAIN_BASE && Number(item.stockUnits || 0) <= Number(item.minStockUnits || 0)),
    [allInventoryItems],
  );

  const lowStockInventoryItems = useMemo(
    () => currentInventoryItems.filter((item) => Number(item.stockUnits || 0) <= Number(item.minStockUnits || 0)).sort((left, right) => (left.stockUnits - left.minStockUnits) - (right.stockUnits - right.minStockUnits)),
    [currentInventoryItems],
  );

  const inventoryLinkedCleaningRows = useMemo(
    () => currentInventoryDomainItems.filter((item) => item.domain === INVENTORY_DOMAIN_CLEANING && item.activityCatalogIds.length > 0),
    [currentInventoryDomainItems],
  );

  const orderInventoryItems = inventoryItemsByDomain[INVENTORY_DOMAIN_ORDERS] || [];

  const orderInventoryTransferMovements = useMemo(
    () => inventoryMovements.filter((movement) => movement.domain === INVENTORY_DOMAIN_ORDERS && movement.movementType === INVENTORY_MOVEMENT_TRANSFER),
    [inventoryMovements],
  );

  const orderInventoryTransferSummary = useMemo(
    () => orderInventoryItems
      .map((item) => ({
        ...item,
        allocatedUnits: getInventoryAllocatedUnits(item),
        availableToTransferUnits: getInventoryAvailableToTransfer(item),
      }))
      .sort((left, right) => {
        const balanceGap = right.allocatedUnits - left.allocatedUnits;
        if (balanceGap !== 0) return balanceGap;
        return left.name.localeCompare(right.name, "es-MX");
      }),
    [orderInventoryItems],
  );

  const inventoryMovementSelectedItem = useMemo(
    () => (inventoryMovementModal.itemId ? inventoryItemsById.get(inventoryMovementModal.itemId) || null : null),
    [inventoryItemsById, inventoryMovementModal.itemId],
  );

  const inventoryMovementSavedLocations = useMemo(
    () => (inventoryMovementSelectedItem ? getInventorySavedStorageLocations(inventoryMovementSelectedItem, inventoryMovements) : []),
    [inventoryMovementSelectedItem, inventoryMovements],
  );

  const inventoryMovementSavedDestinations = useMemo(
    () => (inventoryMovementSelectedItem ? getInventorySavedTransferDestinations(inventoryMovementSelectedItem, inventoryMovements) : []),
    [inventoryMovementSelectedItem, inventoryMovements],
  );

  const inventoryMovementSelectedSavedLocation = useMemo(() => {
    const normalizedStorageLocation = normalizeKey(inventoryMovementModal.storageLocation);
    return inventoryMovementSavedLocations.some((entry) => entry.key === normalizedStorageLocation)
      ? normalizedStorageLocation
      : "";
  }, [inventoryMovementModal.storageLocation, inventoryMovementSavedLocations]);

  const inventoryMovementSelectedSavedDestinationKey = useMemo(() => {
    const destinationKey = buildInventoryTransferTargetKey(inventoryMovementModal.warehouse, inventoryMovementModal.storageLocation);
    return inventoryMovementSavedDestinations.some((destination) => destination.destinationKey === destinationKey)
      ? destinationKey
      : "";
  }, [inventoryMovementModal.storageLocation, inventoryMovementModal.warehouse, inventoryMovementSavedDestinations]);

  const inventoryMovementTransferTarget = useMemo(
    () => inventoryMovementModal.movementType === INVENTORY_MOVEMENT_TRANSFER && inventoryMovementSelectedItem?.domain === INVENTORY_DOMAIN_ORDERS
      ? findInventoryTransferTarget(inventoryMovementSelectedItem, inventoryMovementModal.warehouse, inventoryMovementModal.storageLocation)
      : null,
    [inventoryMovementModal.movementType, inventoryMovementSelectedItem, inventoryMovementModal.warehouse, inventoryMovementModal.storageLocation],
  );

  const inventoryMovementAvailableUnits = useMemo(
    () => inventoryMovementSelectedItem
      ? getInventoryAvailableToTransfer(
          inventoryMovementSelectedItem,
          inventoryMovementModal.remainingUnits,
          inventoryMovementTransferTarget?.destinationKey || "",
        )
      : 0,
    [inventoryMovementModal.remainingUnits, inventoryMovementSelectedItem, inventoryMovementTransferTarget],
  );

  const isOrderTransferMovementModal = inventoryMovementModal.movementType === INVENTORY_MOVEMENT_TRANSFER && inventoryMovementModal.domain === INVENTORY_DOMAIN_ORDERS;
  const inventoryMovementModalTitle = isOrderTransferMovementModal ? "Registrar transferencia" : "Registrar movimiento";
  const hasOrderTransferTargets = orderInventoryTransferSummary.some((item) => item.transferTargets.length > 0);
  const inventoryTransferViewerItem = useMemo(
    () => (inventoryTransferViewerState.itemId ? inventoryItemsById.get(inventoryTransferViewerState.itemId) || null : null),
    [inventoryItemsById, inventoryTransferViewerState.itemId],
  );

  const viewedOrderInventoryTransferSummary = useMemo(
    () => inventoryTransferViewerState.itemId
      ? orderInventoryTransferSummary.filter((item) => item.id === inventoryTransferViewerState.itemId)
      : orderInventoryTransferSummary,
    [inventoryTransferViewerState.itemId, orderInventoryTransferSummary],
  );

  const viewedOrderInventoryTransferMovements = useMemo(
    () => inventoryTransferViewerState.itemId
      ? orderInventoryTransferMovements.filter((movement) => movement.itemId === inventoryTransferViewerState.itemId)
      : orderInventoryTransferMovements,
    [inventoryTransferViewerState.itemId, orderInventoryTransferMovements],
  );

  const currentInventorySupplyableItems = useMemo(
    () => inventoryTab === INVENTORY_DOMAIN_BASE ? [] : currentInventoryDomainItems,
    [currentInventoryDomainItems, inventoryTab],
  );

  const inventoryRestockModalItems = useMemo(
    () => inventoryRestockModal.itemIds.map((itemId) => inventoryItemsById.get(itemId) || null).filter(Boolean),
    [inventoryItemsById, inventoryRestockModal.itemIds],
  );

  const inventoryRestockModalTitle = inventoryRestockModal.itemIds.length === 1 ? "Surtir insumo" : "Surtido general";

  const inventoryMovementTypeOptions = useMemo(() => {
    if (inventoryMovementSelectedItem?.domain === INVENTORY_DOMAIN_CLEANING) {
      return INVENTORY_MOVEMENT_OPTIONS.filter((option) => option.value === INVENTORY_MOVEMENT_CONSUME);
    }

    return INVENTORY_MOVEMENT_OPTIONS;
  }, [inventoryMovementSelectedItem]);

  const viewedOrderInventoryTransferTargets = useMemo(
    () => viewedOrderInventoryTransferSummary.flatMap((item) => item.transferTargets.map((target) => ({
      ...target,
      itemId: item.id,
      itemCode: item.code,
      itemName: item.name,
      itemUnitLabel: item.unitLabel || "pzas",
    }))),
    [viewedOrderInventoryTransferSummary],
  );

  const currentUserReadNotificationIds = useMemo(
    () => new Set(Array.isArray(notificationReadState[sessionUserId]) ? notificationReadState[sessionUserId] : []),
    [notificationReadState, sessionUserId],
  );

  const currentUserDeletedNotificationIds = useMemo(
    () => new Set(Array.isArray(notificationDeletedState[sessionUserId]) ? notificationDeletedState[sessionUserId] : []),
    [notificationDeletedState, sessionUserId],
  );

  const inventoryTransferViewerTitle = inventoryTransferViewerItem
    ? `Historial de transferencias · ${inventoryTransferViewerItem.name}`
    : "Transferencias por destino";

  const inventoryStats = useMemo(() => ({
    total: currentInventoryItems.length,
    totalPiecesPerBox: currentInventoryItems.reduce((sum, item) => sum + Number(item.piecesPerBox || 0), 0),
    totalBoxesPerPallet: currentInventoryItems.reduce((sum, item) => sum + Number(item.boxesPerPallet || 0), 0),
    totalStockUnits: currentInventoryItems.reduce((sum, item) => sum + Number(item.stockUnits || 0), 0),
    lowStockCount: lowStockInventoryItems.length,
    movementCount: currentInventoryMovements.length,
  }), [currentInventoryItems, currentInventoryMovements.length, lowStockInventoryItems.length]);

  const departmentOptions = useMemo(
    () => buildAreaCatalog(state.users, state.areaCatalog),
    [state.areaCatalog, state.users],
  );
  const userAreaOptions = useMemo(() => {
    if (!currentUser || currentUser.role === ROLE_LEAD) return departmentOptions;
    const actorArea = normalizeAreaOption(getUserArea(currentUser));
    return departmentOptions.filter((area) => area === actorArea);
  }, [currentUser, departmentOptions]);

  const activeCatalogItems = useMemo(
    () => (state.catalog || []).filter((item) => !item.isDeleted),
    [state.catalog],
  );

  const dashboardCatalogTypeRows = useMemo(() => {
    const mandatory = activeCatalogItems.filter((item) => item.isMandatory).length;
    const optional = Math.max(0, activeCatalogItems.length - mandatory);
    return [
      { id: "mandatory", label: "Obligatorias", value: mandatory },
      { id: "optional", label: "Ocasionales", value: optional },
    ];
  }, [activeCatalogItems]);

  const dashboardCatalogFrequencyRows = useMemo(() => {
    const grouped = new Map();
    activeCatalogItems.forEach((item) => {
      const frequency = String(item.frequency || "daily");
      grouped.set(frequency, (grouped.get(frequency) || 0) + 1);
    });
    return Array.from(grouped.entries())
      .map(([id, value]) => ({ id, label: getActivityFrequencyLabel(id), value }))
      .sort((a, b) => b.value - a.value);
  }, [activeCatalogItems]);

  const catalogWeekGroups = useMemo(() => ([
    {
      key: "mandatory",
      label: "Obligatorias",
      description: "Actividades base que deberían estar presentes en la operación semanal.",
      items: activeCatalogItems.filter((item) => item.isMandatory),
    },
    {
      key: "optional",
      label: "Ocasionales",
      description: "Actividades de apoyo que puedes sumar según la carga de la semana.",
      items: activeCatalogItems.filter((item) => !item.isMandatory),
    },
  ]), [activeCatalogItems]);

  const weeklyAreaCoverageRows = useMemo(() => {
    return (state.weeks || []).map((week) => {
      const areaCounts = new Map();
      (state.activities || [])
        .filter((activity) => activity.weekId === week.id)
        .forEach((activity) => {
          const area = getUserArea(userMap.get(activity.responsibleId)) || "Sin área";
          areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
        });

      return {
        ...week,
        areas: Array.from(areaCounts.entries())
          .map(([area, total]) => ({ area, total }))
          .sort((left, right) => right.total - left.total),
      };
    });
  }, [state.activities, state.weeks, userMap]);

  function handleAddAreaOption() {
    if (currentUser && currentUser.role !== ROLE_LEAD) {
      return;
    }
    setAreaModal({ open: true, target: "user", name: "", error: "" });
  }

  function handleAddAreaToBootstrap() {
    setAreaModal({ open: true, target: "bootstrap", name: "", error: "" });
  }

  async function confirmAddArea() {
    const nextArea = normalizeAreaOption(areaModal.name);
    if (!nextArea) {
      setAreaModal((current) => ({ ...current, error: "Escribe el nombre del área." }));
      return;
    }
    if (departmentOptions.includes(nextArea)) {
      setAreaModal((current) => ({ ...current, error: "Esa área ya existe." }));
      return;
    }

    try {
      const result = await requestJson("/warehouse/areas", {
        method: "POST",
        body: JSON.stringify({ name: nextArea }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch (error) {
      setAreaModal((current) => ({ ...current, error: error?.message || "No se pudo agregar el área." }));
      return;
    }

    if (areaModal.target === "bootstrap") {
      setBootstrapLeadForm((current) => ({ ...current, area: nextArea }));
    } else {
      setUserModal((current) => ({ ...current, area: nextArea }));
    }

    setAreaModal({ open: false, target: "user", name: "", error: "" });
  }

  const normalizedPermissions = useMemo(
    () => normalizePermissions(state.permissions),
    [state.permissions],
  );

  const allowedPages = useMemo(
    () => currentUser ? NAV_ITEMS.filter((item) => canAccessPage(currentUser, item.id, normalizedPermissions)).map((item) => item.id) : [],
    [currentUser, normalizedPermissions],
  );

  const allowedPagesKey = useMemo(() => allowedPages.join("|"), [allowedPages]);

  useEffect(() => {
    if (!allowedPages.includes(page) && page !== PAGE_NOT_FOUND) {
      const fallbackPage = allowedPages[0] || PAGE_DASHBOARD;
      setPage(fallbackPage);
    }
  }, [allowedPagesKey, currentUser?.role, page]);

  useEffect(() => {
    if (adminTab === "permissions" || adminTab === "reports") {
      setAdminTab("catalog");
    }
  }, [adminTab]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [page]);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    if (syncStatus === "Conectando") return;
    if (sessionUserId && !currentUser) {
      if (!isBootstrapMasterSession) {
        setSessionUserId("");
      }
    }
  }, [currentUser, isBootstrapMasterSession, sessionUserId, syncStatus]);

  useEffect(() => {
    if (!currentUser || (ROLE_LEVEL[currentUser.role] || 0) < ROLE_LEVEL[ROLE_SR]) {
      setSecurityEvents([]);
      setSecurityEventsStatus("idle");
      return;
    }

    let active = true;
    setSecurityEventsStatus("loading");

    requestJson("/auth/security-events?limit=150")
      .then((payload) => {
        if (!active) return;
        setSecurityEvents(Array.isArray(payload.data) ? payload.data : []);
        setSecurityEventsStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setSecurityEvents([]);
        setSecurityEventsStatus("error");
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.role]);

  const actionPermissions = useMemo(
    () => Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, canDoAction(currentUser, item.id, normalizedPermissions)])),
    [currentUser, normalizedPermissions],
  );

  const currentInventoryManagePermission = actionPermissions[getInventoryManageActionId(inventoryTab)];
  const currentInventoryImportPermission = actionPermissions[getInventoryImportActionId(inventoryTab)];

  const derivedNotifications = useMemo(() => {
    if (!currentUser) return [];

    const visibleResponsibleIds = new Set([currentUser.id]);
    if ((ROLE_LEVEL[currentUser.role] || 0) >= ROLE_LEVEL[ROLE_SR]) {
      managedUserIds.forEach((userId) => visibleResponsibleIds.add(userId));
    }

    const notifications = [];
    const isOwnRecord = (responsibleId) => responsibleId === currentUser.id;

    if (isForcedPasswordChange) {
      notifications.push({
        id: `security-password-${currentUser.id}`,
        title: "Actualiza tu contraseña",
        message: "Tu cuenta requiere cambio de contraseña antes de seguir operando con normalidad.",
        tone: "danger",
        timestamp: new Date(now).toISOString(),
        targetAction: "profile",
      });
    }

    dashboardRecords
      .filter((record) => !String(record.id).startsWith("board-history-") && visibleResponsibleIds.has(record.responsibleId) && record.status === STATUS_PAUSED)
      .slice(0, 6)
      .forEach((record) => {
        notifications.push({
          id: `paused-${record.id}`,
          title: isOwnRecord(record.responsibleId) ? "Tienes una actividad pausada" : `${record.responsibleName} tiene una actividad pausada`,
          message: `${record.label} sigue en pausa dentro de ${record.sourceLabel.toLowerCase()}.`,
          meta: record.boardName,
          tone: "danger",
          timestamp: record.occurredAt || new Date(now).toISOString(),
          targetPage: PAGE_DASHBOARD,
        });
      });

    dashboardRecords
      .filter((record) => !String(record.id).startsWith("board-history-") && visibleResponsibleIds.has(record.responsibleId) && record.status !== STATUS_FINISHED && record.excessSeconds > 0)
      .sort((left, right) => right.excessSeconds - left.excessSeconds)
      .slice(0, 6)
      .forEach((record) => {
        notifications.push({
          id: `overdue-${record.id}`,
          title: isOwnRecord(record.responsibleId) ? "Tu actividad excedió el tiempo" : `${record.responsibleName} tiene retraso`,
          message: `${record.label} acumula ${formatDurationClock(record.excessSeconds)} extra sobre el tiempo esperado.`,
          meta: record.boardName,
          tone: "danger",
          timestamp: record.occurredAt || new Date(now).toISOString(),
          targetPage: PAGE_DASHBOARD,
        });
      });

    actionableLowStockInventoryItems
      .filter((item) => actionPermissions[getInventoryManageActionId(item.domain)])
      .slice(0, 8)
      .forEach((item) => {
        notifications.push({
          id: `inventory-low-${item.id}`,
          title: "Stock bajo en inventario",
          message: `${item.name} quedó en ${item.stockUnits} ${item.unitLabel || "pzas"} y su mínimo es ${item.minStockUnits}.`,
          meta: item.domain === INVENTORY_DOMAIN_ORDERS ? "Insumos para pedidos" : "Insumos de limpieza",
          tone: "danger",
          timestamp: item.updatedAt || item.createdAt || new Date(now).toISOString(),
          targetPage: PAGE_INVENTORY,
          targetDomain: item.domain,
          isLocked: true,
          keepUntilResolved: true,
        });
      });

    if ((ROLE_LEVEL[currentUser.role] || 0) >= ROLE_LEVEL[ROLE_SR]) {
      securityEvents
        .slice(0, 5)
        .forEach((event, index) => {
          notifications.push({
            id: `security-event-${event.timestamp || index}-${event.eventType || "audit"}`,
            title: "Evento de seguridad",
            message: `${event.eventType || "Evento"} en ${event.path || "ruta no disponible"}.`,
            meta: event.details?.login || event.details?.reason || event.ip || "Revisar detalle en backend",
            tone: "danger",
            timestamp: event.timestamp || new Date(now).toISOString(),
          });
        });
    }

    return notifications.toSorted((left, right) => getComparableDateMs(right.timestamp) - getComparableDateMs(left.timestamp));
  }, [
    actionableLowStockInventoryItems,
    actionPermissions,
    currentUser,
    dashboardRecords,
    isForcedPasswordChange,
    managedUserIds,
    now,
    securityEvents,
  ]);

  useEffect(() => {
    if (!sessionUserId) return;

    setNotificationInboxState((current) => {
      const currentInbox = Array.isArray(current[sessionUserId]) ? current[sessionUserId] : [];
      const mergedById = new Map(currentInbox.map((notification) => [notification.id, notification]));

      derivedNotifications.forEach((notification) => {
        mergedById.set(notification.id, {
          ...mergedById.get(notification.id),
          ...notification,
        });
      });

      const activeIds = new Set(derivedNotifications.map((notification) => notification.id));
      const nextInbox = Array.from(mergedById.values())
        .filter((notification) => !notification.keepUntilResolved || activeIds.has(notification.id))
        .toSorted((left, right) => getComparableDateMs(right.timestamp) - getComparableDateMs(left.timestamp))
        .slice(0, 400);

      const previousSerialized = JSON.stringify(currentInbox);
      const nextSerialized = JSON.stringify(nextInbox);
      if (previousSerialized === nextSerialized) {
        return current;
      }

      return {
        ...current,
        [sessionUserId]: nextInbox,
      };
    });
  }, [derivedNotifications, sessionUserId]);

  const currentUserInboxNotifications = useMemo(
    () => Array.isArray(notificationInboxState[sessionUserId]) ? notificationInboxState[sessionUserId] : [],
    [notificationInboxState, sessionUserId],
  );

  const appNotifications = useMemo(
    () => currentUserInboxNotifications
      .filter((notification) => notification.isLocked || !currentUserDeletedNotificationIds.has(notification.id))
      .map((notification) => ({
        ...notification,
        isLocked: Boolean(notification.isLocked),
        isUnread: notification.isLocked ? true : !currentUserReadNotificationIds.has(notification.id),
      }))
      .toSorted((left, right) => getComparableDateMs(right.timestamp) - getComparableDateMs(left.timestamp)),
    [currentUserDeletedNotificationIds, currentUserInboxNotifications, currentUserReadNotificationIds],
  );

  const unreadNotificationsCount = useMemo(
    () => appNotifications.filter((notification) => notification.isUnread).length,
    [appNotifications],
  );

  const unreadNotifications = useMemo(
    () => appNotifications.filter((notification) => notification.isUnread),
    [appNotifications],
  );

  const readNotifications = useMemo(
    () => appNotifications.filter((notification) => !notification.isUnread),
    [appNotifications],
  );

  const visibleControlBoards = useMemo(() => {
    if (!currentUser) return [];
    return (state.controlBoards || []).filter((board) => getBoardVisibleToUser(board, currentUser));
  }, [currentUser, state.controlBoards]);

  const filteredVisibleControlBoards = useMemo(() => {
    const term = customBoardSearch.trim().toLowerCase();
    if (!term) return visibleControlBoards;
    return visibleControlBoards.filter((board) => [board.name, board.description, userMap.get(board.ownerId)?.name, ...(board.sharedDepartments || [])]
      .some((value) => String(value || "").toLowerCase().includes(term)));
  }, [customBoardSearch, userMap, visibleControlBoards]);

  const selectedCustomBoard = useMemo(() => {
    return filteredVisibleControlBoards.find((board) => board.id === selectedCustomBoardId) || filteredVisibleControlBoards[0] || null;
  }, [selectedCustomBoardId, filteredVisibleControlBoards]);

  const visibleBoardHistorySnapshots = useMemo(() => {
    if (!currentUser) return [];
    return (state.boardWeekHistory || []).filter((snapshot) => getBoardVisibleToUser(snapshot, currentUser));
  }, [currentUser, state.boardWeekHistory]);

  const selectedCustomBoardHistoryOptions = useMemo(() => {
    if (!selectedCustomBoard) return [];
    return visibleBoardHistorySnapshots
      .filter((snapshot) => snapshot.boardId === selectedCustomBoard.id)
      .sort((left, right) => new Date(right.startDate) - new Date(left.startDate));
  }, [selectedCustomBoard, visibleBoardHistorySnapshots]);

  const selectedCustomBoardSnapshot = useMemo(
    () => selectedCustomBoardHistoryOptions.find((snapshot) => snapshot.id === selectedCustomBoardViewId) || null,
    [selectedCustomBoardHistoryOptions, selectedCustomBoardViewId],
  );

  const isHistoricalCustomBoardView = Boolean(selectedCustomBoardSnapshot);

  const selectedCustomBoardDisplay = useMemo(
    () => selectedCustomBoardSnapshot || selectedCustomBoard,
    [selectedCustomBoard, selectedCustomBoardSnapshot],
  );

  const selectedPermissionBoard = useMemo(
    () => (state.controlBoards || []).find((board) => board.id === selectedPermissionBoardId) || state.controlBoards?.[0] || null,
    [selectedPermissionBoardId, state.controlBoards],
  );

  const selectedBoardActionPermissions = useMemo(
    () => Object.fromEntries(BOARD_PERMISSION_ACTIONS.map((item) => [item.id, canDoBoardAction(currentUser, selectedCustomBoard) && canDoAction(currentUser, item.id, normalizedPermissions)])),
    [currentUser, normalizedPermissions, selectedCustomBoard],
  );

  const canChangeSelectedBoardOperationalContext = useMemo(() => {
    if (!currentUser || !selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) {
      return false;
    }

    return canDoAction(currentUser, "boardWorkflow", normalizedPermissions)
      || canDoAction(currentUser, "saveBoard", normalizedPermissions);
  }, [currentUser, normalizedPermissions, selectedCustomBoard]);

  const availableBoardTemplates = useMemo(() => {
    if (!currentUser) return BOARD_TEMPLATES;
    const sharedTemplates = (state.boardTemplates || []).filter((template) => canUserAccessTemplate(template, currentUser));
    return BOARD_TEMPLATES.concat(sharedTemplates);
  }, [currentUser, state.boardTemplates]);

  const allowedNavItems = useMemo(
    () => currentUser ? NAV_ITEMS.filter((item) => canAccessPage(currentUser, item.id, normalizedPermissions)) : [],
    [currentUser, normalizedPermissions],
  );

  const permissionManagedUsers = useMemo(
    () => visibleUsers.filter((user) => user.isActive),
    [visibleUsers],
  );

  const permissionPages = useMemo(() => NAV_ITEMS, []);

  const userModalRoleOptions = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === ROLE_LEAD) return USER_ROLES;
    const allowedRoles = new Set(creatableRoles);
    if (userModal.mode === "edit" && userModal.role) {
      allowedRoles.add(userModal.role);
    }
    return USER_ROLES.filter((role) => allowedRoles.has(role));
  }, [creatableRoles, currentUser, userModal.mode, userModal.role]);

  const templateCategories = useMemo(() => {
    const categories = availableBoardTemplates.map((template) => getBoardTemplateCategory(template));
    return ["Todas"].concat(Array.from(new Set(categories)));
  }, [availableBoardTemplates]);

  const filteredBoardTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    return availableBoardTemplates.filter((template) => {
      const category = getBoardTemplateCategory(template);
      const matchesCategory = templateCategoryFilter === "Todas" || category === templateCategoryFilter;
      const matchesSearch = !term || [template.name, template.description, category].some((value) => String(value || "").toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [availableBoardTemplates, templateCategoryFilter, templateSearch]);

  const selectedPreviewTemplate = useMemo(
    () => availableBoardTemplates.find((template) => template.id === templatePreviewId) || null,
    [availableBoardTemplates, templatePreviewId],
  );

  const editableVisibleBoards = useMemo(
    () => visibleControlBoards.filter((board) => canEditBoard(currentUser, board)),
    [currentUser, visibleControlBoards],
  );

  const boardBuilderPreview = useMemo(
    () => selectedPreviewTemplate
      ? buildTemplatePreviewBoard(selectedPreviewTemplate, currentUser?.id || "", state.inventoryItems || [])
      : buildDraftPreviewBoard(controlBoardDraft, currentUser?.id || "", state.inventoryItems || []),
    [controlBoardDraft, currentUser, selectedPreviewTemplate, state.inventoryItems],
  );

  const selectedCustomBoardSections = useMemo(
    () => getBoardSectionGroups(selectedCustomBoardDisplay),
    [selectedCustomBoardDisplay],
  );

  useEffect(() => {
    if (selectedCustomBoardViewId === "current") return;
    if (!selectedCustomBoardHistoryOptions.some((snapshot) => snapshot.id === selectedCustomBoardViewId)) {
      setSelectedCustomBoardViewId("current");
    }
  }, [selectedCustomBoardHistoryOptions, selectedCustomBoardViewId]);

  const filteredAuditLog = useMemo(() => {
    const nowMs = Date.now();
    const periodMs = getAuditPeriodMs(auditFilters.period);
    const searchTerm = auditFilters.search.trim().toLowerCase();

    return (state.auditLog || []).filter((entry) => {
      const matchesScope = auditFilters.scope === "all" || entry.scope === auditFilters.scope;
      const matchesUser = auditFilters.userId === "all" || entry.userId === auditFilters.userId;
      const matchesPeriod = !periodMs || (entry.createdAt && nowMs - new Date(entry.createdAt).getTime() <= periodMs);
      const matchesSearch = !searchTerm || [entry.message, entry.scope, entry.userName].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      return matchesScope && matchesUser && matchesPeriod && matchesSearch;
    });
  }, [auditFilters, state.auditLog]);

  useEffect(() => {
    if (!state.controlBoards?.length) {
      if (selectedPermissionBoardId) setSelectedPermissionBoardId("");
      return;
    }
    const exists = state.controlBoards.some((board) => board.id === selectedPermissionBoardId);
    if (!exists) {
      setSelectedPermissionBoardId(state.controlBoards[0].id);
    }
  }, [selectedPermissionBoardId, state.controlBoards]);

  useEffect(() => {
    if (!permissionManagedUsers.length) {
      if (selectedPermissionUserId) setSelectedPermissionUserId("");
      return;
    }

    if (!permissionManagedUsers.some((user) => user.id === selectedPermissionUserId)) {
      setSelectedPermissionUserId(permissionManagedUsers[0].id);
    }
  }, [permissionManagedUsers, selectedPermissionUserId]);

  const draftColumnGroups = useMemo(() => {
    const groups = new Map();
    (controlBoardDraft.columns || []).forEach((column) => {
      const key = column.groupName || "General";
      if (!groups.has(key)) {
        groups.set(key, {
          name: key,
          color: column.groupColor || "#e2f4ec",
          columns: [],
        });
      }
      groups.get(key).columns.push(column);
    });
    return Array.from(groups.values());
  }, [controlBoardDraft.columns]);

  const customBoardMetrics = useMemo(() => {
    if (!selectedCustomBoardDisplay) return null;
    const rows = selectedCustomBoardDisplay.rows || [];
    const completed = rows.filter((row) => row.status === STATUS_FINISHED).length;
    const running = rows.filter((row) => row.status === STATUS_RUNNING).length;
    const paused = rows.filter((row) => row.status === STATUS_PAUSED).length;
    const totalSeconds = rows.reduce((sum, row) => sum + getElapsedSeconds(row, now), 0);
    return {
      totalRows: rows.length,
      completed,
      running,
      paused,
      averageMinutes: rows.length ? totalSeconds / rows.length / 60 : 0,
    };
  }, [now, selectedCustomBoardDisplay]);

  const dashboardResponsibleRows = useMemo(() => {
    const max = Math.max(...rankingByUser.map((item) => item.averageMinutes), 1);
    return rankingByUser.map((item) => {
      const label = userMap.get(item.responsibleId)?.name || "N/A";
      const visual = getResponsibleVisual(label);
      return {
        ...item,
        label,
        initial: label.charAt(0).toUpperCase(),
        color: `linear-gradient(90deg, ${visual.accent} 0%, ${visual.soft} 100%)`,
        max,
      };
    });
  }, [rankingByUser, userMap]);

  const dashboardActivityRows = useMemo(() => {
    return activityVsLimit.map((item) => {
      const label = item.label?.toUpperCase() || "ACTIVIDAD";
      const exceeded = item.limitMinutes > 0 && item.averageMinutes > item.limitMinutes;
      const color = exceeded
        ? "linear-gradient(90deg, #fbbf24 0%, #ef4444 100%)"
        : "linear-gradient(90deg, #4ade80 0%, #34c759 100%)";
      return {
        ...item,
        label,
        exceeded,
        color,
        percent: item.limitMinutes > 0 ? (item.averageMinutes / item.limitMinutes) * 100 : 0,
      };
    });
  }, [activityVsLimit]);

  const dashboardDistributionRows = useMemo(() => {
    return distributionByUser.map((item) => {
      const label = userMap.get(item.responsibleId)?.name || "N/A";
      const visual = getResponsibleVisual(label);
      return {
        ...item,
        label,
        color: `linear-gradient(90deg, ${visual.accent} 0%, ${visual.soft} 100%)`,
        solidColor: visual.accent,
      };
    });
  }, [distributionByUser, userMap]);

  useEffect(() => {
    sessionSnapshotRef.current = {
      userId: currentUser?.id || "",
      sessionVersion: Number(currentUser?.sessionVersion || 0),
    };
  }, [currentUser?.id, currentUser?.sessionVersion]);

  useEffect(() => {
    if (!isForcedPasswordChange) return;
    setProfileModalOpen(false);
  }, [isForcedPasswordChange]);

  function invalidateClientSession(message) {
    setSessionUserId("");
    setProfileModalOpen(false);
    setPasswordForm({ password: "", confirmPassword: "", message: "" });
    setLoginError(message || "");
  }

  function handleConfirmPause() {
    if (!pauseState.reason.trim()) {
      setPauseState((current) => ({ ...current, error: "El motivo es obligatorio para poder pausar." }));
      return;
    }

    const nowIso = new Date().toISOString();

    setState((current) => ({
      ...current,
      activities: current.activities.map((activity) => {
        if (activity.id !== pauseState.activityId) return activity;
        return {
          ...activity,
          status: STATUS_PAUSED,
          accumulatedSeconds: updateElapsedForFinish(activity, nowIso),
          lastResumedAt: null,
        };
      }),
      pauseLogs: current.pauseLogs.concat({
        id: makeId("pause"),
        weekActivityId: pauseState.activityId,
        pauseReason: pauseState.reason.trim(),
        pausedAt: nowIso,
        resumedAt: null,
        pauseDurationSeconds: 0,
      }),
    }));

    setPauseState({ open: false, activityId: null, reason: "", error: "" });
  }

  function openBoardPauseModal(boardId, rowId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || !canOperateBoardRowRecord(currentUser, board, row, normalizedPermissions) || row.status !== STATUS_RUNNING) return;
    setBoardPauseState({ open: true, boardId, rowId, reason: "", error: "" });
  }

  function handleConfirmBoardPause() {
    if (!boardPauseState.reason.trim()) {
      setBoardPauseState((current) => ({ ...current, error: "El motivo es obligatorio para poder pausar." }));
      return;
    }

    requestJson(`/warehouse/boards/${boardPauseState.boardId}/rows/${boardPauseState.rowId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: STATUS_PAUSED,
        lastPauseReason: boardPauseState.reason.trim(),
      }),
    }).then((remoteState) => {
      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setBoardPauseState({ open: false, boardId: null, rowId: null, reason: "", error: "" });
    }).catch((error) => {
      setBoardPauseState((current) => ({ ...current, error: error?.message || "No se pudo pausar la fila." }));
    });
  }

  function openCatalogCreate(preferredCategory = "General") {
    const normalizedCategory = String(preferredCategory || "General").trim() || "General";
    setCatalogModal({ open: true, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: normalizedCategory });
  }

  function openCatalogEdit(item) {
    setCatalogModal({
      open: true,
      mode: "edit",
      id: item.id,
      name: item.name,
      limit: String(item.timeLimitMinutes),
      mandatory: String(item.isMandatory),
      frequency: normalizeActivityFrequency(item.frequency),
      category: String(item.category || "General").trim() || "General",
    });
  }

  async function submitCatalogModal() {
    const payload = {
      name: catalogModal.name.trim(),
      timeLimitMinutes: Number(catalogModal.limit || 0),
      isMandatory: catalogModal.mandatory === "true",
      frequency: normalizeActivityFrequency(catalogModal.frequency),
      category: String(catalogModal.category || "General").trim() || "General",
      isDeleted: false,
    };

    if (!payload.name || payload.timeLimitMinutes <= 0) return;

    try {
      const result = await requestJson(
        catalogModal.mode === "create" ? "/warehouse/catalog" : `/warehouse/catalog/${catalogModal.id}`,
        {
          method: catalogModal.mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setCatalogModal({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: "General" });
    } catch {
      // Keep modal open if the save fails.
    }
  }

  async function softDeleteCatalog(id) {
    try {
      const result = await requestJson(`/warehouse/catalog/${id}`, {
        method: "DELETE",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch {
      // Ignore delete failures silently for now.
    }
  }

  function addActivityToWeek() {
    if (!editWeekId || !editWeekActivityId) return;
    const targetWeek = state.weeks.find((week) => week.id === editWeekId);
    const catalogItem = state.catalog.find((item) => item.id === editWeekActivityId);
    const defaultResponsible = state.users.find((user) => user.isActive) || state.users[0] || null;
    if (!targetWeek || !catalogItem) return;
    const generatedActivities = buildWeekActivitiesFromCatalogItem(editWeekId, catalogItem, new Date(targetWeek.startDate), defaultResponsible?.id || null);

    setState((current) => ({
      ...current,
      activities: current.activities.concat(generatedActivities),
    }));

    setEditWeekActivityId("");
  }

  function removeWeekActivity(activityId) {
    setState((current) => ({
      ...current,
      activities: current.activities.filter((activity) => activity.id !== activityId),
      pauseLogs: current.pauseLogs.filter((log) => log.weekActivityId !== activityId),
    }));
  }

  function buildUserRecordFromModalDraft(draft, fallbackId = "user-modal-preview") {
    const fallbackAccess = buildUniquePlayerAccess(draft.name || draft.role || "player", state.users || [], draft.id || null);
    return normalizeUserRecord({
      id: draft.id || fallbackId,
      name: draft.name || "Nuevo player",
      email: draft.username || draft.email || fallbackAccess,
      role: draft.role,
      area: draft.area || getUserArea(currentUser),
      department: draft.area || getUserArea(currentUser),
      jobTitle: draft.jobTitle || DEFAULT_JOB_TITLE_BY_ROLE[normalizeRole(draft.role)] || "",
      isActive: draft.isActive !== "false",
      password: draft.password || "",
      managerId: draft.managerId || currentUser?.id || null,
      createdById: currentUser?.id || null,
    });
  }

  function buildPermissionSelectionForUser(user, permissionsModel = normalizedPermissions) {
    return {
      pages: Object.fromEntries(permissionPages.map((item) => [item.id, canAccessPage(user, item.id, permissionsModel)])),
      actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, canDoAction(user, item.id, permissionsModel)])),
    };
  }

  function buildPermissionSelectionFromModalDraft(draft, permissionsModel = normalizedPermissions) {
    if (!supportsManagedPermissionOverrides(draft.role)) {
      return { pages: {}, actions: {} };
    }
    return buildPermissionSelectionForUser(buildUserRecordFromModalDraft(draft), permissionsModel);
  }

  function closeUserModal() {
    setUserModal(createUserModalState());
  }

  function toggleUserModalPermissionSection(pageId) {
    setUserModal((current) => ({
      ...current,
      permissionPageId: current.permissionPageId === pageId ? "" : pageId,
    }));
  }

  function toggleUserModalPermission(kind, key) {
    setUserModal((current) => ({
      ...current,
      permissionOverrides: {
        ...current.permissionOverrides,
        [kind]: {
          ...current.permissionOverrides[kind],
          [key]: !current.permissionOverrides[kind]?.[key],
        },
      },
    }));
  }

  function updateUserModalRole(nextRole) {
    setUserModal((current) => {
      const shouldRefreshJobTitle = current.mode === "create" || current.jobTitle === (DEFAULT_JOB_TITLE_BY_ROLE[current.role] || "");
      const nextDraft = {
        ...current,
        role: nextRole,
        jobTitle: shouldRefreshJobTitle ? (DEFAULT_JOB_TITLE_BY_ROLE[nextRole] || "") : current.jobTitle,
        permissionPageId: "",
      };

      return {
        ...nextDraft,
        permissionOverrides: buildPermissionSelectionFromModalDraft(nextDraft),
      };
    });
  }

  function openCreateUser() {
    if (!actionPermissions.manageUsers) return;
    const defaultRole = creatableRoles[0] || ROLE_JR;
    const nextModal = createUserModalState({
      open: true,
      mode: "create",
      id: null,
      name: "",
      username: "",
      role: defaultRole,
      area: getUserArea(currentUser),
      jobTitle: DEFAULT_JOB_TITLE_BY_ROLE[defaultRole] || "",
      isActive: "true",
      password: "",
      managerId: currentUser?.id || "",
    });
    setUserModal({
      ...nextModal,
      permissionOverrides: buildPermissionSelectionFromModalDraft(nextModal),
    });
  }

  function openEditUser(user) {
    if (!actionPermissions.manageUsers) return;
    const nextModal = createUserModalState({
      open: true,
      mode: "edit",
      id: user.id,
      name: user.name,
      username: user.email,
      role: user.role,
      area: getUserArea(user),
      jobTitle: getUserJobTitle(user),
      isActive: String(user.isActive),
      password: "",
      managerId: user.managerId || "",
    });
    setUserModal({
      ...nextModal,
      permissionOverrides: buildPermissionSelectionFromModalDraft(nextModal),
    });
  }

  async function submitUserModal() {
    if (!currentUser || !actionPermissions.manageUsers || !canCreateRole(currentUser.role, userModal.role) && userModal.mode === "create") return;
    const trimmedPassword = userModal.password.trim();
    const resolvedPlayerAccess = userModal.username.trim() || buildUniquePlayerAccess(
      userModal.name || userModal.role || "player",
      state.users || [],
      userModal.mode === "edit" ? userModal.id : null,
    );
    const payload = {
      name: userModal.name.trim(),
      username: resolvedPlayerAccess,
      role: userModal.role,
      area: userModal.area.trim(),
      department: userModal.area.trim(),
      jobTitle: userModal.jobTitle.trim(),
      isActive: userModal.isActive === "true",
      managerId: userModal.managerId || currentUser?.id || null,
      createdById: userModal.mode === "create" ? currentUser?.id || null : userModal.managerId || currentUser?.id || null,
      ...(userModal.mode === "create" ? { selfIdentityEditCount: 0 } : {}),
      permissionOverrides: userModal.permissionOverrides,
    };

    if (!payload.name || !payload.area || !payload.jobTitle) return;
    if (userModal.mode === "create") {
      if (!isTemporaryPassword(trimmedPassword)) return;
      payload.password = trimmedPassword;
    } else if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    try {
      const result = await requestJson(
        userModal.mode === "create" ? "/warehouse/users" : `/warehouse/users/${userModal.id}`,
        {
          method: userModal.mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      closeUserModal();
    } catch {
      // The modal already exposes validation context; keep it open on failure.
    }
  }

  async function updateCurrentUserIdentity(identityPatch) {
    if (!currentUser) return;
    const resolvedPlayerAccess = String((identityPatch.username ?? identityPatch.email) || "").trim() || buildUniquePlayerAccess(
      identityPatch.name || currentUser.name || "player",
      state.users || [],
      currentUser.id,
    );
    const trimmedPatch = {
      name: String(identityPatch.name || "").trim(),
      email: resolvedPlayerAccess,
      area: String(identityPatch.area || "").trim(),
      jobTitle: String(identityPatch.jobTitle || "").trim(),
    };
    if (!trimmedPatch.name || !trimmedPatch.area || !trimmedPatch.jobTitle) {
      return { ok: false, message: "Captura nombre, área y cargo para guardar el perfil del player." };
    }
    const hasChanges = [
      trimmedPatch.name !== String(currentUser.name || "").trim(),
      trimmedPatch.email !== String(currentUser.email || "").trim(),
      trimmedPatch.area !== getUserArea(currentUser),
      trimmedPatch.jobTitle !== getUserJobTitle(currentUser),
    ].some(Boolean);
    if (!hasChanges) {
      return { ok: false, message: "No hay cambios nuevos por guardar." };
    }
    const canBypassEditLimit = canBypassSelfProfileEditLimit(currentUser);
    const selfIdentityEditCount = Number(currentUser.selfIdentityEditCount ?? 0);
    if (!canBypassEditLimit && selfIdentityEditCount >= PROFILE_SELF_EDIT_LIMIT) {
      return { ok: false, message: "La autoedición ya fue utilizada. Pide apoyo a un Senior o Lead para corregir estos datos." };
    }
    try {
      const result = await requestJson("/warehouse/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(trimmedPatch),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      return { ok: true, message: "Datos del player actualizados." };
    } catch (error) {
      return { ok: false, message: error?.message || "No se pudieron actualizar los datos del player." };
    }
  }

  async function deleteUser(userId) {
    if (!userId || userId === currentUser?.id || !actionPermissions.deleteUsers) return;
    try {
      const result = await requestJson(`/warehouse/users/${userId}`, {
        method: "DELETE",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setDeleteUserId(null);
    } catch {
      // Keep confirmation state unchanged on failure.
    }
  }

  async function toggleUserActive(userId) {
    try {
      const result = await requestJson(`/warehouse/users/${userId}/active`, {
        method: "PATCH",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch {
      // Ignore UI toggle failures silently for now.
    }
  }

  function addDraftColumn() {
    if (!controlBoardDraft.fieldLabel.trim()) {
      setControlBoardFeedback("Escribe una etiqueta para el campo antes de agregarlo.");
      return;
    }
    const resolvedInventorySourceFieldId = controlBoardDraft.fieldType === "inventoryProperty"
      ? resolveInventoryPropertySourceFieldId(controlBoardDraft.columns, controlBoardDraft.sourceFieldId)
      : controlBoardDraft.sourceFieldId || null;
    if (controlBoardDraft.fieldType === "inventoryProperty" && !resolvedInventorySourceFieldId) {
      setControlBoardFeedback("Agrega primero un Buscador de inventario y luego enlaza este dato derivado.");
      return;
    }
    const isActivityListField = controlBoardDraft.fieldType === BOARD_ACTIVITY_LIST_FIELD;
    const colorRules = controlBoardDraft.colorValue
      ? [{ operator: controlBoardDraft.colorOperator, value: controlBoardDraft.colorValue, color: controlBoardDraft.colorBg, textColor: controlBoardDraft.colorText }]
      : [];
    const normalizedWidthPx = Number(controlBoardDraft.fieldWidthPx || 0);
    const widthPx = Number.isFinite(normalizedWidthPx) && normalizedWidthPx >= 90 ? Math.round(normalizedWidthPx) : null;
    const field = {
      id: makeId("fld"),
      label: controlBoardDraft.fieldLabel.trim(),
      type: isActivityListField ? "select" : controlBoardDraft.fieldType,
      optionSource: isActivityListField ? "catalogByCategory" : controlBoardDraft.optionSource,
      optionCatalogCategory: controlBoardDraft.optionCatalogCategory,
      options: isActivityListField ? [] : controlBoardDraft.optionsText.split(",").map((item) => item.trim()).filter(Boolean),
      inventoryProperty: controlBoardDraft.inventoryProperty,
      sourceFieldId: resolvedInventorySourceFieldId,
      formulaOperation: controlBoardDraft.formulaOperation,
      formulaLeftFieldId: controlBoardDraft.formulaLeftFieldId || null,
      formulaRightFieldId: controlBoardDraft.formulaRightFieldId || null,
      helpText: controlBoardDraft.fieldHelp.trim(),
      placeholder: controlBoardDraft.placeholder.trim(),
      defaultValue: controlBoardDraft.defaultValue,
      width: controlBoardDraft.fieldWidth,
      widthPx,
      required: controlBoardDraft.isRequired === "true",
      groupName: controlBoardDraft.groupName.trim() || "General",
      groupColor: controlBoardDraft.groupColor,
      colorRules,
    };
    const isBundleField = controlBoardDraft.fieldType === INVENTORY_LOOKUP_LOGISTICS_FIELD;
    const fieldsToInsert = controlBoardDraft.fieldType === INVENTORY_LOOKUP_LOGISTICS_FIELD
      ? buildInventoryBundleFields(controlBoardDraft, editingDraftColumnId || null)
      : [field];
    setControlBoardDraft((current) => {
      const nextColumns = buildUpdatedDraftColumns(current.columns, editingDraftColumnId, isBundleField, fieldsToInsert);
      const currentSettings = current.settings ?? EMPTY_OBJECT;
      const nextColumnOrder = syncBoardFieldOrderIntoColumnOrder(nextColumns, currentSettings);
      return {
        ...current,
        columns: nextColumns,
        settings: {
          ...currentSettings,
          columnOrder: nextColumnOrder,
        },
        ...createEmptyFieldDraft(),
      };
    });
    setEditingDraftColumnId(null);
    setComponentStudioOpen(false);
    let feedbackMessage = "Componente agregado al tablero borrador.";
    if (editingDraftColumnId) {
      feedbackMessage = "Componente actualizado correctamente.";
    } else if (fieldsToInsert.length > 1) {
      feedbackMessage = "Buscador agregado con sus columnas automáticas.";
    }
    setControlBoardFeedback(feedbackMessage);
  }

  function removeDraftColumn(columnId) {
    setControlBoardDraft((current) => {
      const nextColumns = current.columns.filter((column) => column.id !== columnId);
      const currentSettings = current.settings ?? EMPTY_OBJECT;
      return {
        ...current,
        columns: nextColumns,
        settings: {
          ...currentSettings,
          columnOrder: getNormalizedBoardColumnOrder({ fields: nextColumns, settings: currentSettings }),
        },
      };
    });
    setControlBoardFeedback("Columna eliminada del borrador.");
  }

  function editDraftColumn(columnId) {
    const column = controlBoardDraft.columns.find((item) => item.id === columnId);
    if (!column) return;
    setControlBoardDraft((current) => ({
      ...current,
      ...mapColumnToFieldDraft(column, current.columns),
    }));
    setEditingDraftColumnId(columnId);
    setComponentStudioOpen(true);
    setControlBoardFeedback("");
  }

  function duplicateDraftColumn(columnId) {
    setControlBoardDraft((current) => {
      const index = current.columns.findIndex((item) => item.id === columnId);
      if (index === -1) return current;
      const currentSettings = current.settings ?? EMPTY_OBJECT;
      const source = current.columns[index];
      const duplicate = {
        ...source,
        id: makeId("fld"),
        label: `${source.label} copia`,
      };
      const nextColumns = [...current.columns];
      nextColumns.splice(index + 1, 0, duplicate);
      return {
        ...current,
        columns: nextColumns,
        settings: {
          ...currentSettings,
          columnOrder: syncBoardFieldOrderIntoColumnOrder(nextColumns, currentSettings),
        },
      };
    });
    setControlBoardFeedback("Componente duplicado.");
  }

  function moveDraftColumn(columnId, direction) {
    setControlBoardDraft((current) => {
      const index = current.columns.findIndex((item) => item.id === columnId);
      if (index === -1) return current;
      const currentSettings = current.settings ?? EMPTY_OBJECT;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.columns.length) return current;
      const nextColumns = [...current.columns];
      const [moved] = nextColumns.splice(index, 1);
      nextColumns.splice(targetIndex, 0, moved);
      return {
        ...current,
        columns: nextColumns,
        settings: {
          ...currentSettings,
          columnOrder: syncBoardFieldOrderIntoColumnOrder(nextColumns, currentSettings),
        },
      };
    });
  }

  function reorderDraftColumn(sourceColumnId, targetColumnId) {
    if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) return;
    setControlBoardDraft((current) => {
      const sourceIndex = current.columns.findIndex((item) => item.id === sourceColumnId);
      const targetIndex = current.columns.findIndex((item) => item.id === targetColumnId);
      if (sourceIndex === -1 || targetIndex === -1) return current;
      const currentSettings = current.settings ?? EMPTY_OBJECT;
      const nextColumns = [...current.columns];
      const [moved] = nextColumns.splice(sourceIndex, 1);
      nextColumns.splice(targetIndex, 0, moved);
      return {
        ...current,
        columns: nextColumns,
        settings: {
          ...currentSettings,
          columnOrder: syncBoardFieldOrderIntoColumnOrder(nextColumns, currentSettings),
        },
      };
    });
  }

  function applyBoardTemplate(templateId) {
    const template = availableBoardTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setControlBoardDraft((current) => {
      const templateSettings = template.settings && typeof template.settings === "object" ? template.settings : undefined;
      return {
        ...current,
        name: template.name,
        description: template.description,
        settings: withDefaultBoardSettings({ ...current.settings, ...templateSettings, columnOrder: [] }),
        columns: buildTemplateColumns(template),
        ...createEmptyFieldDraft(),
      };
    });
    setEditingDraftColumnId(null);
    setTemplatePreviewId(null);
    setControlBoardFeedback(`Plantilla ${template.name} cargada al borrador. Puedes agregar, cambiar o quitar componentes antes de guardar.`);
  }

  function previewBoardTemplate(templateId) {
    setTemplatePreviewId(templateId);
  }

  function getPagePermissionActions(pageId) {
    return ACTION_DEFINITIONS.filter((item) => (PAGE_ACTION_GROUPS[pageId] || []).includes(item.id));
  }

  async function updatePermissionEntry(scope, key, field, value) {
    if (!actionPermissions.managePermissions) return;
    const nextPermissions = {
      ...state.permissions,
      [scope]: {
        ...state.permissions[scope],
        [key]: {
          ...(state.permissions[scope]?.[key] || { roles: [], userIds: [], departments: [] }),
          [field]: value,
        },
      },
    };
    try {
      const result = await requestJson("/warehouse/permissions", {
        method: "PATCH",
        body: JSON.stringify({ permissions: nextPermissions }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch (error) {
      setPermissionsFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar la regla de permisos." });
    }
  }

  async function updateBoardAssignment(boardId, field, value) {
    if (!actionPermissions.managePermissions) return;
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    if (!board) return;
    const ownerId = field === "ownerId" ? value : board.ownerId;
    const visibilityType = field === "visibilityType" ? normalizeBoardVisibilityType(value) : normalizeBoardVisibilityType(board.visibilityType);
    const accessUserIds = visibilityType === "users"
      ? (field === "accessUserIds"
          ? normalizeBoardAccessUserIds(value || [], ownerId)
          : normalizeBoardAccessUserIds(board.accessUserIds || [], ownerId))
      : [];
    const sharedDepartments = field === "sharedDepartments"
      ? normalizeBoardSharedDepartments(value || [])
      : normalizeBoardSharedDepartments(board.sharedDepartments || []);
    try {
      const result = await requestJson(`/warehouse/boards/${boardId}/assignment`, {
        method: "PATCH",
        body: JSON.stringify({ ownerId, visibilityType, sharedDepartments, accessUserIds }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch (error) {
      setPermissionsFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar la asignación del tablero." });
    }
  }

  async function updateBoardOperationalContext(boardId, operationalContextValue) {
    if (!currentUser || !boardId) return;

    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    if (!board || !canDoBoardAction(currentUser, board)) return;

    const canUpdateContext = canDoAction(currentUser, "boardWorkflow", normalizedPermissions)
      || canDoAction(currentUser, "saveBoard", normalizedPermissions);
    if (!canUpdateContext) return;

    const normalizedSettings = withDefaultBoardSettings(board.settings);
    try {
      const result = await requestJson(`/warehouse/boards/${boardId}/context`, {
        method: "PATCH",
        body: JSON.stringify({
          operationalContextValue: normalizeBoardOperationalContextValue(
            operationalContextValue,
            normalizedSettings.operationalContextType,
            normalizedSettings.operationalContextOptions,
          ),
        }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setBoardRuntimeFeedback({
        tone: "success",
        message: `${normalizedSettings.operationalContextLabel || "Contexto operativo"} actualizado a ${result.data.operationalContextValue || operationalContextValue}.`,
      });
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar el contexto del tablero." });
    }
  }

  async function applyPermissionPreset(presetId) {
    if (!actionPermissions.managePermissions) return;
    const preset = PERMISSION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const nextPermissions = buildPermissionsFromPreset(presetId);
    try {
      const result = await requestJson("/warehouse/permissions", {
        method: "PATCH",
        body: JSON.stringify({ permissions: nextPermissions }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setPermissionsFeedback({ tone: "success", message: `Se aplicó el preset ${preset.label}.` });
    } catch (error) {
      setPermissionsFeedback({ tone: "danger", message: error?.message || "No se pudo aplicar el preset de permisos." });
    }
  }

  function exportPermissionRules() {
    if (!actionPermissions.managePermissions) return;

    const payload = {
      type: "copmec-permissions",
      version: 1,
      exportedAt: new Date().toISOString(),
      permissions: state.permissions,
      boardPermissions: (state.controlBoards || []).map((board) => ({
        boardId: board.id,
        boardName: board.name,
        permissions: normalizeBoardPermissions(board.permissions, state.permissions, board),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `permisos-copmec-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setPermissionsFeedback({ tone: "success", message: "Se exportó el respaldo de permisos en formato JSON." });
    setState((current) => appendAuditLog(current, buildAuditEntry(currentUser, "permissions", "Exportó un respaldo de reglas de permisos.")));
  }

  async function handlePermissionImport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !actionPermissions.managePermissions) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const nextPermissions = normalizePermissions(parsed.permissions || parsed.rules || parsed);
      const boardPermissionsMap = new Map(
        Array.isArray(parsed.boardPermissions)
          ? parsed.boardPermissions.map((entry) => [entry.boardId, entry.permissions || entry])
          : [],
      );

      const result = await requestJson("/warehouse/permissions", {
        method: "PATCH",
        body: JSON.stringify({
          permissions: nextPermissions,
          boardPermissions: Array.from(boardPermissionsMap.entries()).map(([boardId, permissions]) => ({ boardId, permissions })),
        }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setPermissionsFeedback({ tone: "success", message: `Se importaron permisos desde ${file.name}.` });
    } catch {
      setPermissionsFeedback({ tone: "danger", message: "El archivo no es válido. Usa un JSON exportado desde el módulo de permisos." });
    }
  }

  function togglePermissionRole(scope, key, role) {
    const currentRoles = state.permissions?.[scope]?.[key]?.roles || [];
    const nextRoles = currentRoles.includes(role)
      ? currentRoles.filter((item) => item !== role)
      : currentRoles.concat(role);
    updatePermissionEntry(scope, key, "roles", nextRoles);
  }

  async function saveDraftAsBoardTemplate() {
    if (!controlBoardDraft.name.trim() || !controlBoardDraft.columns.length || !actionPermissions.saveTemplate) {
      setControlBoardFeedback("Define nombre y al menos un componente antes de guardar una plantilla reutilizable.");
      return;
    }

    const templateName = controlBoardDraft.name.trim();
    const templatePayload = {
      name: templateName,
      description: controlBoardDraft.description.trim() || `Plantilla reutilizable para ${templateName}.`,
      category: "Personalizada",
      visibilityType: currentUser?.department ? "department" : "users",
      sharedDepartments: currentUser?.department ? [currentUser.department] : [],
      sharedUserIds: currentUser ? [currentUser.id] : [],
      settings: { ...controlBoardDraft.settings },
      columns: (controlBoardDraft.columns || []).map((column) => ({
        ...column,
        templateKey: column.templateKey || column.id,
      })),
    };

    try {
      const result = await requestJson("/warehouse/templates", {
        method: "POST",
        body: JSON.stringify(templatePayload),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setControlBoardFeedback(`Plantilla ${templateName} guardada para reutilizarla cuando quieras.`);
    } catch (error) {
      setControlBoardFeedback(error?.message || "No se pudo guardar la plantilla.");
    }
  }

  async function submitBoardTemplateEdit() {
    if (!templateEditorModal.id || !templateEditorModal.name.trim() || !actionPermissions.editTemplate) {
      setControlBoardFeedback("La plantilla debe tener nombre para guardar los cambios.");
      return;
    }

    try {
      const result = await requestJson(`/warehouse/templates/${templateEditorModal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: templateEditorModal.name.trim(),
          description: templateEditorModal.description.trim(),
          category: templateEditorModal.category.trim() || "Personalizada",
          visibilityType: templateEditorModal.visibilityType,
          sharedDepartments: templateEditorModal.sharedDepartments,
          sharedUserIds: templateEditorModal.sharedUserIds,
        }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setTemplateEditorModal({ open: false, id: null, name: "", description: "", category: "", visibilityType: "department", sharedDepartments: [], sharedUserIds: [] });
      setControlBoardFeedback("Plantilla actualizada correctamente.");
    } catch (error) {
      setControlBoardFeedback(error?.message || "No se pudo actualizar la plantilla.");
    }
  }

  async function importDraftRowsIntoBoard(createdBoardId, payload, initialState) {
    let latestRemoteState = initialState;
    const rowsToImport = boardImportedRowsDraft.slice(0, 200);
    const yesValues = new Set(["si", "sí", "true", "1", "yes", "y"]);

    for (const importedRow of rowsToImport) {
      const createdRowState = await requestJson(`/warehouse/boards/${createdBoardId}/rows`, {
        method: "POST",
      });

      const boardAfterCreate = (createdRowState.controlBoards || []).find((item) => item.id === createdBoardId);
      const rowId = boardAfterCreate?.rows?.[boardAfterCreate.rows.length - 1]?.id;
      if (!rowId) {
        latestRemoteState = createdRowState;
        continue;
      }

      const valuesPatch = buildImportedBoardRowValuesPatch(importedRow, payload.columns, visibleUsers, state.inventoryItems || [], yesValues);
      if (!Object.keys(valuesPatch).length) {
        latestRemoteState = createdRowState;
        continue;
      }

      latestRemoteState = await requestJson(`/warehouse/boards/${createdBoardId}/rows/${rowId}`, {
        method: "PATCH",
        body: JSON.stringify({ values: valuesPatch }),
      });
    }

    return latestRemoteState;
  }

  async function saveControlBoard() {
    if (!currentUser || !actionPermissions.saveBoard || !controlBoardDraft.name.trim() || !controlBoardDraft.columns.length) {
      setControlBoardFeedback("Agrega nombre, dueño y al menos un campo para guardar el tablero.");
      return;
    }
    const isEditing = boardBuilderModal.mode === "edit" && boardBuilderModal.boardId;

    const ownerId = controlBoardDraft.ownerId || currentUser.id;
    const { payload } = buildBoardSavePayload(controlBoardDraft, ownerId);

    try {
      const result = await requestJson(
        isEditing ? `/warehouse/boards/${boardBuilderModal.boardId}` : "/warehouse/boards",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      const createdBoardId = result.data.boardId || boardBuilderModal.boardId || "";

      if (!isEditing && createdBoardId && boardImportedRowsDraft.length) {
        const latestRemoteState = await importDraftRowsIntoBoard(createdBoardId, payload, result.data.state);
        applyRemoteWarehouseState(latestRemoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        setBoardRuntimeFeedback({
          tone: "success",
          message: `Se creó ${payload.name} y se importaron ${Math.min(boardImportedRowsDraft.length, 200)} fila(s) desde Excel.${boardImportedRowsDraft.length > 200 ? " Solo se importaron las primeras 200 por rendimiento." : ""}`,
        });
      }

      setSelectedCustomBoardId(createdBoardId);
      setSelectedCustomBoardViewId("current");
      if (!isEditing) {
        setPage(PAGE_CUSTOM_BOARDS);
      }
      setBoardBuilderModal({ open: false, mode: "create", boardId: null });
      setTemplatePreviewId(null);
      setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser.id });
      setBoardImportedRowsDraft([]);
      setExcelFormulaWizard({ open: false, items: [] });
      setControlBoardFeedback("");
      if (isEditing || !boardImportedRowsDraft.length) {
        setBoardRuntimeFeedback({
          tone: "success",
          message: isEditing
            ? `Se actualizó ${payload.name} sin cambiarte de pantalla.`
            : `Se creó ${payload.name} y ya aparece en Mis tableros.`,
        });
      }
    } catch (error) {
      setControlBoardFeedback(error?.message || "No se pudo guardar el tablero.");
    }
  }

  function clearControlBoardDraft() {
    setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser?.id || "" });
    setBoardImportedRowsDraft([]);
    setExcelFormulaWizard({ open: false, items: [] });
    setEditingDraftColumnId(null);
    setTemplatePreviewId(null);
    setControlBoardFeedback("Borrador limpiado.");
  }

  function openCreateBoardBuilder() {
    setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser?.id || "" });
    setBoardImportedRowsDraft([]);
    setExcelFormulaWizard({ open: false, items: [] });
    setBoardBuilderModal({ open: true, mode: "create", boardId: null });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  function openEditBoardBuilder(board) {
    if (!actionPermissions.saveBoard || !canEditBoard(currentUser, board)) return;
    setControlBoardDraft(createBoardDraftFromBoard(board));
    setBoardImportedRowsDraft([]);
    setExcelFormulaWizard({ open: false, items: [] });
    setBoardBuilderModal({ open: true, mode: "edit", boardId: board.id });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  async function deleteControlBoard(boardId) {
    if (!currentUser || !boardId) return;
    const boardToDelete = (state.controlBoards || []).find((board) => board.id === boardId);
    if (!actionPermissions.deleteBoard || !boardToDelete || !canEditBoard(currentUser, boardToDelete)) return;

    try {
      const result = await requestJson(`/warehouse/boards/${boardId}`, {
        method: "DELETE",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      const nextVisibleBoard = (result.data.state?.controlBoards || []).find((board) => getBoardVisibleToUser(board, currentUser));
      setDeleteBoardId(null);
      setCustomBoardActionsMenuOpen(false);
      setSelectedCustomBoardId(nextVisibleBoard?.id || "");
      setBoardRuntimeFeedback({ tone: "success", message: `Se eliminó el tablero ${boardToDelete.name}.` });
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo eliminar el tablero." });
    }
  }

  function closeBoardBuilderModal() {
    setBoardBuilderModal({ open: false, mode: "create", boardId: null });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  function openCreateInventoryItem(domain = inventoryTab) {
    if (!actionPermissions[getInventoryManageActionId(domain)]) return;
    setInventoryImportFeedback({ tone: "", message: "" });
    setInventoryModal({
      ...createInventoryModalState("create", {}, domain),
      cleaningSite: domain === INVENTORY_DOMAIN_CLEANING ? inventoryCleaningSite : DEFAULT_CLEANING_SITE,
      open: true,
    });
  }

  function openEditInventoryItem(item) {
    if (!actionPermissions[getInventoryManageActionId(item?.domain)]) return;
    setInventoryModal({ ...createInventoryModalState("edit", item, item.domain), open: true });
  }

  function toggleInventoryModalActivityCatalog(itemId, isChecked) {
    setInventoryModal((current) => {
      const nextActivityCatalogIds = isChecked
        ? Array.from(new Set(current.activityCatalogIds.concat(itemId)))
        : current.activityCatalogIds.filter((catalogId) => catalogId !== itemId);
      const nextActivityConsumptions = isChecked
        ? current.activityConsumptions.some((entry) => entry.catalogActivityId === itemId)
          ? current.activityConsumptions
          : current.activityConsumptions.concat({ catalogActivityId: itemId, quantity: "" })
        : current.activityConsumptions.filter((entry) => entry.catalogActivityId !== itemId);

      return {
        ...current,
        activityCatalogIds: nextActivityCatalogIds,
        activityConsumptions: nextActivityConsumptions,
      };
    });
  }

  function updateInventoryModalActivityConsumption(itemId, value) {
    setInventoryModal((current) => ({
      ...current,
      activityConsumptions: current.activityConsumptions.map((entry) => (
        entry.catalogActivityId === itemId ? { ...entry, quantity: value } : entry
      )),
    }));
  }

  function closeInventoryMovementModal() {
    setInventoryMovementModal(createInventoryMovementModalState());
  }

  function closeInventoryTransferConfirmModal(shouldReopenMovementModal = false) {
    if (shouldReopenMovementModal && inventoryTransferConfirmModal.draftMovementModal) {
      setInventoryMovementModal(inventoryTransferConfirmModal.draftMovementModal);
    }
    setInventoryTransferConfirmModal(createInventoryTransferConfirmModalState());
  }

  function updateInventoryMovementModal(updates) {
    setInventoryMovementModal((current) => {
      const next = { ...current, ...updates };
      const hasItemChange = Object.hasOwn(updates, "itemId");
      const hasWarehouseChange = Object.hasOwn(updates, "warehouse");
      const hasStorageChange = Object.hasOwn(updates, "storageLocation");
      const hasMovementTypeChange = Object.hasOwn(updates, "movementType");
      const selectedItem = next.itemId ? inventoryItemsById.get(next.itemId) || null : null;
      const defaultTransferDestination = next.movementType === INVENTORY_MOVEMENT_TRANSFER && selectedItem?.domain === INVENTORY_DOMAIN_ORDERS
        ? getInventoryDefaultTransferDestination(selectedItem, inventoryMovements)
        : null;

      if (hasItemChange) {
        next.itemCode = selectedItem?.code || "";
        next.itemName = selectedItem?.name || "";
        next.unitLabel = selectedItem?.unitLabel || "pzas";
        next.domain = selectedItem?.domain || current.domain;
        if (next.movementType === INVENTORY_MOVEMENT_TRANSFER && selectedItem?.domain === INVENTORY_DOMAIN_ORDERS) {
          next.warehouse = defaultTransferDestination?.warehouse || "";
          next.storageLocation = defaultTransferDestination?.storageLocation || "";
          next.recipientName = defaultTransferDestination?.recipientName || "";
          next.transferTargetKey = defaultTransferDestination?.destinationKey || "";
        } else {
          next.storageLocation = selectedItem?.storageLocation || "";
        }
      }

      if (hasMovementTypeChange && next.movementType !== INVENTORY_MOVEMENT_TRANSFER) {
        next.warehouse = "";
        next.recipientName = "";
        next.remainingUnits = "";
        next.transferTargetKey = "";
        next.storageLocation = selectedItem?.storageLocation || next.storageLocation;
      }

      if (next.movementType === INVENTORY_MOVEMENT_TRANSFER && selectedItem?.domain === INVENTORY_DOMAIN_ORDERS) {
        const matchedTarget = findInventoryTransferTarget(selectedItem, next.warehouse, next.storageLocation);
        const nextTargetKey = matchedTarget?.destinationKey || "";
        const shouldResetRemaining = (hasItemChange || hasWarehouseChange || hasStorageChange) && current.transferTargetKey !== nextTargetKey;
        next.transferTargetKey = nextTargetKey;
        if (shouldResetRemaining) {
          next.remainingUnits = "";
        }
      } else {
        next.transferTargetKey = "";
        if (next.movementType !== INVENTORY_MOVEMENT_TRANSFER) {
          next.remainingUnits = "";
        }
      }

      return next;
    });
  }

  function openInventoryMovement(item, movementType = INVENTORY_MOVEMENT_RESTOCK) {
    if (!actionPermissions[getInventoryManageActionId(item?.domain)]) return;
    setInventoryImportFeedback({ tone: "", message: "" });
    const defaultTransferDestination = movementType === INVENTORY_MOVEMENT_TRANSFER && item?.domain === INVENTORY_DOMAIN_ORDERS
      ? getInventoryDefaultTransferDestination(item, inventoryMovements)
      : null;
    setInventoryMovementModal({ ...createInventoryMovementModalState(item, movementType, item?.domain || inventoryTab, { defaultDestination: defaultTransferDestination }), open: true });
  }

  function openOrderInventoryTransfer(item = null) {
    if (!actionPermissions[getInventoryManageActionId(INVENTORY_DOMAIN_ORDERS)]) return;
    setInventoryImportFeedback({ tone: "", message: "" });
    const defaultTransferDestination = item ? getInventoryDefaultTransferDestination(item, inventoryMovements) : null;
    setInventoryMovementModal({ ...createInventoryMovementModalState(item, INVENTORY_MOVEMENT_TRANSFER, INVENTORY_DOMAIN_ORDERS, { defaultDestination: defaultTransferDestination }), open: true });
  }

  function openInventoryTransferViewer() {
    if (!actionPermissions[getInventoryManageActionId(INVENTORY_DOMAIN_ORDERS)]) return;
    setInventoryTransferViewerState({ open: true, itemId: null });
  }

  function openInventoryTransferHistory(item = null) {
    if (!actionPermissions[getInventoryManageActionId(INVENTORY_DOMAIN_ORDERS)]) return;
    setInventoryTransferViewerState({ open: true, itemId: item?.id || null });
  }

  function closeInventoryRestockModal() {
    setInventoryRestockModal(createInventoryRestockModalState(inventoryTab));
  }

  function openInventoryRestockModal(item) {
    if (!item || item.domain === INVENTORY_DOMAIN_BASE || !actionPermissions[getInventoryManageActionId(item.domain)]) return;
    setInventoryImportFeedback({ tone: "", message: "" });
    setInventoryRestockModal({
      ...createInventoryRestockModalState(item.domain, [item.id]),
      open: true,
    });
  }

  function openInventoryBulkRestockModal(domain = inventoryTab) {
    if (domain === INVENTORY_DOMAIN_BASE || !actionPermissions[getInventoryManageActionId(domain)]) return;
    const items = domain === INVENTORY_DOMAIN_CLEANING
      ? currentInventoryDomainItems
      : allInventoryItemsByDomain[domain] || [];
    if (!items.length) {
      setInventoryImportFeedback({ tone: "danger", message: "No hay insumos disponibles para surtir en esta sección." });
      return;
    }
    setInventoryImportFeedback({ tone: "", message: "" });
    setInventoryRestockModal({
      ...createInventoryRestockModalState(domain, items.map((item) => item.id)),
      open: true,
    });
  }

  function updateInventoryRestockQuantity(itemId, value) {
    setInventoryRestockModal((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        [itemId]: value,
      },
    }));
  }

  function applySavedInventoryLocation(locationKey) {
    const selectedLocation = inventoryMovementSavedLocations.find((entry) => entry.key === locationKey);
    if (!selectedLocation) return;
    updateInventoryMovementModal({ storageLocation: selectedLocation.label });
  }

  function applySavedInventoryDestination(destinationKey) {
    if (!destinationKey) {
      updateInventoryMovementModal({
        warehouse: "",
        storageLocation: "",
        recipientName: "",
      });
      return;
    }
    const selectedDestination = inventoryMovementSavedDestinations.find((entry) => entry.destinationKey === destinationKey);
    if (!selectedDestination) return;
    updateInventoryMovementModal({
      warehouse: selectedDestination.warehouse,
      storageLocation: selectedDestination.storageLocation,
      recipientName: selectedDestination.recipientName,
    });
  }

  async function requestInventoryMovement(payload) {
    const result = await requestJson("/warehouse/inventory/movements", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    return result;
  }

  async function persistInventoryMovement(payload, successMessage) {
    try {
      await requestInventoryMovement(payload);
      setInventoryTransferConfirmModal(createInventoryTransferConfirmModalState());
      closeInventoryMovementModal();
      setInventoryImportFeedback({ tone: "success", message: successMessage });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: error?.message || "No se pudo registrar el movimiento." });
    }
  }

  async function submitInventoryRestockModal() {
    if (!actionPermissions[getInventoryManageActionId(inventoryRestockModal.domain)]) return;

    const pendingRestocks = inventoryRestockModalItems
      .map((item) => ({
        item,
        quantity: Number(inventoryRestockModal.quantities[item.id] || 0),
      }))
      .filter(({ quantity }) => quantity > 0 && !Number.isNaN(quantity));

    if (!pendingRestocks.length) {
      closeInventoryRestockModal();
      setInventoryImportFeedback({ tone: "success", message: "No se agregó surtido porque todas las cantidades quedaron en 0." });
      return;
    }

    try {
      for (const { item, quantity } of pendingRestocks) {
        await requestInventoryMovement({
          itemId: item.id,
          movementType: INVENTORY_MOVEMENT_RESTOCK,
          quantity,
          notes: inventoryRestockModal.itemIds.length === 1 ? "Surtido por insumo" : "Surtido general",
          warehouse: "",
          recipientName: "",
          storageLocation: item.storageLocation || "",
          unitLabel: item.unitLabel || "pzas",
          remainingUnits: null,
        });
      }

      closeInventoryRestockModal();
      setInventoryImportFeedback({
        tone: "success",
        message: pendingRestocks.length === 1
          ? `Surtido registrado para ${pendingRestocks[0].item.name}.`
          : `Surtido general aplicado a ${pendingRestocks.length} insumos.`,
      });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: error?.message || "No se pudo registrar el surtido." });
    }
  }

  async function submitInventoryModal() {
    if (!actionPermissions[getInventoryManageActionId(inventoryModal.domain)]) return;
    const usesPresentation = inventoryDomainUsesPresentation(inventoryModal.domain);
    const usesPackagingMetrics = inventoryDomainUsesPackagingMetrics(inventoryModal.domain);
    const normalizedActivityConsumptions = inventoryModal.domain === INVENTORY_DOMAIN_CLEANING
      ? inventoryModal.activityConsumptions
        .map((entry) => ({
          catalogActivityId: entry.catalogActivityId,
          quantity: Number(entry.quantity || 0),
        }))
        .filter((entry) => entry.catalogActivityId)
      : [];
    const payload = {
      domain: inventoryModal.domain,
      code: inventoryModal.code.trim(),
      name: inventoryModal.name.trim(),
      presentation: usesPresentation ? inventoryModal.presentation.trim() : "",
      piecesPerBox: usesPackagingMetrics ? Number(inventoryModal.piecesPerBox || 0) : 0,
      boxesPerPallet: usesPackagingMetrics ? Number(inventoryModal.boxesPerPallet || 0) : 0,
      stockUnits: inventoryModal.domain === INVENTORY_DOMAIN_BASE ? 0 : Number(inventoryModal.stockUnits || 0),
      minStockUnits: inventoryModal.domain === INVENTORY_DOMAIN_BASE ? 0 : Number(inventoryModal.minStockUnits || 0),
      storageLocation: inventoryModal.domain === INVENTORY_DOMAIN_BASE ? "" : inventoryModal.storageLocation.trim(),
      cleaningSite: inventoryModal.domain === INVENTORY_DOMAIN_CLEANING ? normalizeCleaningSite(inventoryModal.cleaningSite) : "",
      unitLabel: inventoryModal.unitLabel.trim() || "pzas",
      activityCatalogIds: inventoryModal.domain === INVENTORY_DOMAIN_CLEANING ? normalizedActivityConsumptions.map((entry) => entry.catalogActivityId) : [],
      activityConsumptions: normalizedActivityConsumptions,
      consumptionPerStart: inventoryModal.domain === INVENTORY_DOMAIN_CLEANING ? Number(normalizedActivityConsumptions[0]?.quantity || 0) : 0,
    };

    if (!payload.code || !payload.name) return;

    try {
      const result = await requestJson(
        inventoryModal.mode === "create" ? "/warehouse/inventory" : `/warehouse/inventory/${inventoryModal.id}`,
        {
          method: inventoryModal.mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setInventoryModal(createInventoryModalState());
      setInventoryImportFeedback({ tone: "success", message: inventoryModal.mode === "create" ? "Artículo agregado al inventario." : "Artículo actualizado correctamente." });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: error?.message || "No se pudo guardar el artículo de inventario." });
    }
  }

  async function submitInventoryMovementModal() {
    if (!actionPermissions[getInventoryManageActionId(inventoryMovementModal.domain)] || !inventoryMovementModal.itemId) return;

    const selectedItem = inventoryItemsById.get(inventoryMovementModal.itemId) || null;
    const quantity = Number(inventoryMovementModal.quantity || 0);
    const isOrderTransfer = inventoryMovementModal.movementType === INVENTORY_MOVEMENT_TRANSFER && selectedItem?.domain === INVENTORY_DOMAIN_ORDERS;

    if (!selectedItem || !quantity || Number.isNaN(quantity)) {
      setInventoryImportFeedback({ tone: "danger", message: "Define el artículo y una cantidad válida para continuar." });
      return;
    }

    if (isOrderTransfer) {
      if (!inventoryMovementModal.warehouse.trim() && !inventoryMovementModal.storageLocation.trim()) {
        setInventoryImportFeedback({ tone: "danger", message: "Define una nave destino o un punto de entrega destino para registrar la transferencia." });
        return;
      }
      if (quantity > inventoryMovementAvailableUnits) {
        setInventoryImportFeedback({ tone: "danger", message: `Solo hay ${inventoryMovementAvailableUnits} ${selectedItem.unitLabel || "pzas"} disponibles para transferir con el saldo actual.` });
        return;
      }
    }

    const payload = {
      itemId: selectedItem.id,
      movementType: inventoryMovementModal.movementType,
      quantity,
      notes: inventoryMovementModal.notes.trim(),
      warehouse: inventoryMovementModal.warehouse.trim(),
      recipientName: inventoryMovementModal.recipientName.trim(),
      storageLocation: inventoryMovementModal.storageLocation.trim(),
      unitLabel: inventoryMovementModal.unitLabel.trim() || "pzas",
      remainingUnits: hasInventoryBalanceInput(inventoryMovementModal.remainingUnits) ? Number(inventoryMovementModal.remainingUnits || 0) : null,
    };

    if (isOrderTransfer && inventoryMovementTransferTarget && !hasInventoryBalanceInput(inventoryMovementModal.remainingUnits)) {
      setInventoryTransferConfirmModal({
        open: true,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        warehouse: payload.warehouse,
        storageLocation: payload.storageLocation,
        recipientName: payload.recipientName,
        quantity,
        unitLabel: payload.unitLabel,
        remainingUnits: "",
        lastKnownUnits: inventoryMovementTransferTarget.availableUnits,
        pendingPayload: payload,
        draftMovementModal: { ...inventoryMovementModal, open: true },
      });
      setInventoryMovementModal((current) => ({ ...current, open: false }));
      return;
    }

    await persistInventoryMovement(payload, isOrderTransfer ? "Transferencia registrada." : "Movimiento de inventario registrado.");
  }

  async function submitInventoryTransferConfirmModal() {
    const quantity = Number(inventoryTransferConfirmModal.quantity || 0);
    const remainingUnits = Number(inventoryTransferConfirmModal.remainingUnits || 0);

    if (!inventoryTransferConfirmModal.pendingPayload || !quantity || Number.isNaN(quantity)) {
      setInventoryImportFeedback({ tone: "danger", message: "No se encontró la transferencia pendiente para confirmar." });
      return;
    }

    if (!hasInventoryBalanceInput(inventoryTransferConfirmModal.remainingUnits) || Number.isNaN(remainingUnits)) {
      setInventoryImportFeedback({ tone: "danger", message: "Indica cuántas piezas quedan actualmente en ese destino para completar la transferencia." });
      return;
    }

    await persistInventoryMovement({
      ...inventoryTransferConfirmModal.pendingPayload,
      remainingUnits,
    }, "Transferencia registrada y saldo destino actualizado.");
  }

  async function handleInventoryImport(event) {
    if (!currentInventoryImportPermission) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedItems = await parseInventoryImportFile(file);

      if (!importedItems.length) {
        setInventoryImportFeedback({ tone: "danger", message: "No se encontraron filas válidas. Usa columnas como codigo, dominio, nombre, stock_actual y stock_minimo." });
        return;
      }

      const result = await requestJson("/warehouse/inventory/import", {
        method: "POST",
        body: JSON.stringify({ items: importedItems }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setInventoryImportFeedback({
        tone: "success",
        message: `Importacion completada. ${result.data.createdCount} nuevos y ${result.data.updatedCount} actualizados.`,
      });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: `No se pudo importar el archivo. ${error instanceof Error ? error.message : "Revisa el formato del CSV o Excel."}` });
    } finally {
      event.target.value = "";
    }
  }

  async function downloadInventoryTemplate() {
    if (!currentInventoryImportPermission) return;
    try {
      await downloadInventoryTemplateFile();
    } catch {
      setInventoryImportFeedback({ tone: "danger", message: "No se pudo generar la plantilla de inventario." });
    }
  }

  async function deleteInventoryItem(itemId) {
    const item = (state.inventoryItems || []).find((entry) => entry.id === itemId);
    if (!itemId || !actionPermissions[getInventoryManageActionId(item?.domain)]) return;
    try {
      const result = await requestJson(`/warehouse/inventory/${itemId}`, {
        method: "DELETE",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setDeleteInventoryId(null);
      setInventoryImportFeedback({ tone: "success", message: "Artículo eliminado del inventario." });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: error?.message || "No se pudo eliminar el artículo de inventario." });
    }
  }

  function updateLoginField(key, value) {
    setLoginForm((current) => ({ ...current, [key]: value }));
    setLoginError("");
  }

  function updateBootstrapLeadField(key, value) {
    setBootstrapLeadForm((current) => ({ ...current, [key]: value }));
    setBootstrapLeadError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    let authResult = null;
    try {
      authResult = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: loginForm.login, password: loginForm.password }),
      });
    } catch (error) {
      setLoginError(error?.message || "Credenciales inválidas.");
      return;
    }

    setSessionUserId(authResult.userId || "");
    if (authResult.isBootstrapMaster) {
      setPage(PAGE_DASHBOARD);
      return;
    }

    try {
      const remoteState = await requestJson("/warehouse/state");
      const normalizedState = normalizeWarehouseState(remoteState);
      skipNextSyncRef.current = true;
      setState(normalizedState);
      setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
      setPasswordForm({ password: "", confirmPassword: "", message: "" });
      const nextUser = normalizedState.users.find((user) => user.id === authResult.userId) || authResult.user;
      setPage(nextUser?.role === ROLE_JR ? PAGE_CUSTOM_BOARDS : PAGE_DASHBOARD);
      setSyncStatus("Sincronizado");
    } catch (error) {
      if (isSessionRequiredError(error)) {
        setLoginError("Se validaron tus credenciales, pero no se pudo guardar la sesión. Revisa CORS_ALLOWED_ORIGINS y SESSION_COOKIE_SAMESITE en Render.");
        return;
      }
      setLoginError(error?.message || "No se pudo iniciar sesión.");
    }
  }

  async function handleLogout() {
    try {
      await requestJson("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout transport errors and clear client session anyway.
    }
    setSessionUserId("");
    setLoginForm({ login: "", password: "" });
    setLoginError("");
    setLoginDirectory(EMPTY_LOGIN_DIRECTORY);
    setPasswordForm({ password: "", confirmPassword: "", message: "" });
  }

  async function handleCreateFirstLead(event) {
    event.preventDefault();
    if (!bootstrapLeadForm.name.trim() || !bootstrapLeadForm.area.trim() || !bootstrapLeadForm.jobTitle.trim() || !bootstrapLeadForm.password.trim()) {
      setBootstrapLeadError("Completa nombre, área, cargo y contraseña para crear el primer Lead.");
      return;
    }
    if (!isStrongPassword(bootstrapLeadForm.password)) {
      setBootstrapLeadError("Usa una contraseña de al menos 10 caracteres con mayúscula, minúscula, número y símbolo.");
      return;
    }

    const resolvedEmail = bootstrapLeadForm.username.trim() || buildUniquePlayerAccess(
      bootstrapLeadForm.name,
      state.users || [],
      null,
      "lead",
    );

    try {
      const result = await requestJson("/auth/bootstrap-lead", {
        method: "POST",
        body: JSON.stringify({
          name: bootstrapLeadForm.name.trim(),
          email: resolvedEmail,
          area: bootstrapLeadForm.area.trim(),
          jobTitle: bootstrapLeadForm.jobTitle.trim(),
          password: bootstrapLeadForm.password,
        }),
      });
      setBootstrapLeadForm({ name: "", username: "", area: "", jobTitle: "", password: "" });
      setSessionUserId(result.userId);
      applyRemoteWarehouseState(result.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setPage(PAGE_DASHBOARD);
    } catch (error) {
      setBootstrapLeadError(error?.message || "No fue posible crear el primer Lead. Intenta de nuevo.");
    }
  }

  function createBoardRow(boardId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    if (!canDoBoardAction(currentUser, board)) return;
    if (!board || !currentUser) return;
    requestJson(`/warehouse/boards/${boardId}/rows`, {
      method: "POST",
    }).then((remoteState) => {
      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setBoardRuntimeFeedback({ tone: "", message: "" });
    }).catch((error) => {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo crear la fila." });
    });
  }

  function deleteBoardRow(boardId, rowId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || row.status === STATUS_FINISHED || !canEditBoardRowRecord(currentUser, board, row, normalizedPermissions)) {
      setDeleteBoardRowState({ open: false, boardId: null, rowId: null });
      return;
    }

    requestJson(`/warehouse/boards/${boardId}/rows/${rowId}`, {
      method: "DELETE",
    }).then((remoteState) => {
      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setDeleteBoardRowState({ open: false, boardId: null, rowId: null });
      setBoardRuntimeFeedback({ tone: "success", message: "La fila fue eliminada del tablero." });
    }).catch((error) => {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo eliminar la fila." });
    });
  }

  function updateBoardRowValue(boardId, rowId, field, rawValue) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!canEditBoardRowRecord(currentUser, board, row, normalizedPermissions)) return;
    requestJson(`/warehouse/boards/${boardId}/rows/${rowId}`, {
      method: "PATCH",
      body: JSON.stringify({
        values: {
          [field.id]: rawValue,
        },
      }),
    }).then((remoteState) => {
      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    }).catch((error) => {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar la fila." });
    });
  }

  function getBoardExportRows(board) {
    return (board?.rows || []).map((row) => {
      const exportRow = {};

      (board.fields || []).forEach((field) => {
        const rawValue = getBoardFieldValue(board, row, field);
        const value = formatBoardExportFieldValue(field, rawValue, state.inventoryItems || [], userMap);
        exportRow[field.label] = value;
      });

      if (board.settings?.showAssignee !== false) {
        exportRow.Player = userMap.get(row.responsibleId)?.name || "";
      }

      exportRow.Estado = row.status || STATUS_PENDING;

      if (board.settings?.showDates !== false) {
        exportRow["Tiempo acumulado"] = formatDurationClock(getElapsedSeconds(row, Date.now()));
        exportRow["Creado el"] = formatDateTime(row.createdAt);
      }

      return exportRow;
    });
  }

  async function duplicateBoardRecord(board, includeRows = false) {
    if (!board || !currentUser) return;
    if (!canDoBoardAction(currentUser, board)) return;
    if (includeRows && !actionPermissions.duplicateBoardWithRows) return;
    if (!includeRows && !actionPermissions.duplicateBoard) return;

    try {
      const result = await requestJson(`/warehouse/boards/${board.id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ includeRows }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setSelectedCustomBoardId(result.data.boardId || "");
      setBoardRuntimeFeedback({ tone: "success", message: `Se duplicó ${board.name} y ya quedó listo como ${result.data.boardName || "la copia"}.` });
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo duplicar el tablero." });
    }
  }

  function changeBoardRowStatus(boardId, rowId, status) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || !canOperateBoardRowRecord(currentUser, board, row, normalizedPermissions)) return;

    const nowTime = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    const autoTimeValues = (board.fields || []).reduce((accumulator, field) => {
      if (field.type !== "time") return accumulator;
      const normalizedLabel = normalizeKey(field.label || "");
      const currentValue = String(row.values?.[field.id] || "").trim();
      if (status === STATUS_RUNNING && (normalizedLabel.includes("inicio") || normalizedLabel.includes("start")) && !currentValue) {
        accumulator[field.id] = nowTime;
      }
      if (status === STATUS_FINISHED && (normalizedLabel.includes("fin") || normalizedLabel.includes("final") || normalizedLabel.includes("end"))) {
        accumulator[field.id] = nowTime;
      }
      return accumulator;
    }, {});

    if (status === STATUS_FINISHED) {
      const missingFields = (board.fields || []).filter((field) => {
        if (!field.required) return false;
        const effectiveValue = Object.hasOwn(autoTimeValues, field.id)
          ? autoTimeValues[field.id]
          : getBoardFieldValue(board, row, field);
        return !isBoardFieldValueFilled(effectiveValue, field.type);
      });

      if (missingFields.length) {
        setBoardRuntimeFeedback({
          tone: "danger",
          message: `Completa los campos obligatorios antes de terminar: ${missingFields.map((field) => field.label).join(", ")}.`,
        });
        return;
      }
    }

    setBoardRuntimeFeedback({ tone: "", message: "" });
    requestJson(`/warehouse/boards/${boardId}/rows/${rowId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        ...(Object.keys(autoTimeValues).length ? { values: autoTimeValues } : {}),
      }),
    }).then((remoteState) => {
      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    }).catch((error) => {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo cambiar el estado de la fila." });
    });
  }

  function openFinishBoardRowConfirm(boardId, rowId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || !canOperateBoardRowRecord(currentUser, board, row, normalizedPermissions)) return;
    setBoardFinishConfirm({
      open: true,
      boardId,
      rowId,
      message: "Al finalizar esta fila, su información quedará bloqueada para mantener la trazabilidad del registro.",
    });
  }

  function confirmFinishBoardRow() {
    if (!boardFinishConfirm.boardId || !boardFinishConfirm.rowId) return;
    changeBoardRowStatus(boardFinishConfirm.boardId, boardFinishConfirm.rowId, STATUS_FINISHED);
    setBoardFinishConfirm({ open: false, boardId: null, rowId: null, message: "" });
  }

  async function exportSelectedBoardToExcel() {
    if (!selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) return;

    try {
      const ExcelJS = await getExcelJsModule();
      const rows = getBoardExportRows(selectedCustomBoard);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tablero");
      const exportRows = rows.length ? rows : [{ Estado: "Sin filas registradas" }];
      const headers = Object.keys(exportRows[0] ?? EMPTY_OBJECT);

      worksheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(header.length + 4, 18) }));
      exportRows.forEach((row) => {
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      triggerBrowserDownload(
        buffer,
        `${normalizeKey(selectedCustomBoard.name).replaceAll(/\s+/g, "-") || "tablero-operativo"}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      setBoardRuntimeFeedback({ tone: "success", message: `Se exportó ${selectedCustomBoard.name} a Excel.` });
    } catch {
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo exportar el tablero a Excel." });
    }
  }

  function getSelectedBoardPdfColumns(board) {
    const visibleColumns = getOrderedBoardColumns(board).filter((column) => !(column.kind !== "field" && column.id === "workflow"));
    const pdfColumns = visibleColumns.map((column) => ({
      key: column.token,
      label: column.kind === "field"
        ? column.label
        : column.id === "time"
          ? "Tiempo acumulado"
          : column.label,
      sectionName: column.sectionName || "General",
      sectionColor: column.sectionColor || "#e2f4ec",
      kind: column.kind,
      id: column.id,
      field: column.field,
    }));

    if (board?.settings?.showDates !== false) {
      pdfColumns.push({
        key: "createdAt",
        label: "Creado el",
        sectionName: "Registro",
        sectionColor: "#f3f5f8",
        kind: "meta",
        id: "createdAt",
      });
    }

    return pdfColumns;
  }

  function getSelectedBoardPdfRows(board, pdfColumns) {
    return (board?.rows || []).map((row) => pdfColumns.map((column) => {
      if (column.kind === "field") {
        const rawValue = getBoardFieldValue(board, row, column.field);
        return String(formatBoardExportFieldValue(column.field, rawValue, state.inventoryItems || [], userMap) ?? "");
      }

      if (column.id === "assignee") {
        return userMap.get(row.responsibleId)?.name || "";
      }

      if (column.id === "status") {
        return row.status || STATUS_PENDING;
      }

      if (column.id === "time") {
        return formatDurationClock(getElapsedSeconds(row, Date.now()));
      }

      if (column.id === "createdAt") {
        return formatDateTime(row.createdAt);
      }

      return "";
    }));
  }

  async function buildSelectedBoardPdfDocument() {
    if (!selectedCustomBoard) return null;

    const boardView = selectedCustomBoardDisplay || selectedCustomBoard;
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const pdfColumns = getSelectedBoardPdfColumns(boardView);
    const body = getSelectedBoardPdfRows(boardView, pdfColumns);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const subtitleParts = [
      isHistoricalCustomBoardView ? (selectedCustomBoardSnapshot?.weekName || "Histórico") : "Semana actual",
      `Filas: ${boardView?.rows?.length || 0}`,
      `Exportado ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", hour12: false }).format(new Date())}`,
    ];
    const operationalContextLabel = String(boardView?.settings?.operationalContextLabel || "").trim();
    const operationalContextValue = String(boardView?.settings?.operationalContextValue || "").trim();
    if (operationalContextLabel && operationalContextValue) {
      subtitleParts.splice(1, 0, `${operationalContextLabel}: ${operationalContextValue}`);
    }
    const descriptionLines = boardView?.description ? doc.splitTextToSize(boardView.description, 760) : [];

    doc.setFillColor(19, 61, 51);
    doc.roundedRect(26, 18, 790, 54, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(boardView?.name || selectedCustomBoard.name, 42, 42);
    doc.setFontSize(9);
    doc.text(subtitleParts.join(" · "), 42, 58);

    let nextStartY = 92;
    if (descriptionLines.length) {
      doc.setTextColor(54, 81, 81);
      doc.setFontSize(10);
      doc.text(descriptionLines, 40, nextStartY);
      nextStartY += descriptionLines.length * 12 + 8;
    }

    autoTable(doc, {
      head: [pdfColumns.map((column) => column.label)],
      body: body.length ? body : [["Sin filas registradas"].concat(Array(Math.max(0, pdfColumns.length - 1)).fill(""))],
      startY: nextStartY,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", lineColor: [221, 231, 226], textColor: [38, 61, 61] },
      headStyles: { fillColor: [19, 61, 51], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 250, 248] },
      bodyStyles: { valign: "middle" },
      margin: { left: 26, right: 26 },
      didParseCell: (hookData) => {
        if (hookData.section !== "head") return;
        const column = pdfColumns[hookData.column.index];
        if (!column) return;
        hookData.cell.styles.fillColor = [19, 61, 51];
      },
    });

    return doc;
  }

  async function previewSelectedBoardPdf() {
    if (!selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) return;

    const previewWindow = globalThis.open("", "_blank");

    try {
      const doc = await buildSelectedBoardPdfDocument();
      if (!doc) throw new Error("pdf_preview_unavailable");
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      if (previewWindow) {
        previewWindow.location.href = pdfUrl;
      } else {
        globalThis.open(pdfUrl, "_blank", "noopener,noreferrer");
      }
      globalThis.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    } catch {
      previewWindow?.close();
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo generar la vista previa del tablero en PDF." });
    }
  }

  async function exportSelectedBoardToPdf() {
    if (!selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) return;

    try {
      const fileBaseName = normalizeKey(selectedCustomBoard.name).replaceAll(/\s+/g, "-") || "tablero-operativo";
      const doc = await buildSelectedBoardPdfDocument();
      if (!doc) throw new Error("pdf_export_unavailable");
      doc.save(`${fileBaseName}.pdf`);
      setBoardRuntimeFeedback({ tone: "success", message: `Se exportó ${selectedCustomBoard.name} a PDF.` });
    } catch {
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo exportar el tablero a PDF." });
    }
  }

  function openBoardExcelImportPicker() {
    boardExcelFileInputRef.current?.click();
  }

  async function importBoardStructureFromExcel(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await parseBoardStructureImportFile(file);
      setControlBoardDraft((current) => ({
        ...current,
        name: current.name || imported.boardName,
        description: current.description || "Tablero importado desde Excel.",
        columns: imported.fields,
        ...createEmptyFieldDraft(),
      }));
      setBoardImportedRowsDraft(Array.isArray(imported.rows) ? imported.rows : []);

      if (Array.isArray(imported.unsupportedFormulaDetails) && imported.unsupportedFormulaDetails.length) {
        setExcelFormulaWizard({
          open: true,
          items: imported.unsupportedFormulaDetails.map((item) => ({
            targetLabel: item.header,
            targetFieldId: imported.fields[item.columnIndex]?.id || "",
            formula: item.formula,
            operation: "add",
            formulaLeftFieldId: "",
            formulaRightFieldId: "",
          })),
        });
      } else {
        setExcelFormulaWizard({ open: false, items: [] });
      }

      const unsupportedColumnsMessage = imported.unsupportedFormulaColumns?.length
        ? ` Fórmulas complejas no convertidas: ${imported.unsupportedFormulaColumns.join(", ")}.`
        : "";
      const supportedFormulaMessage = imported.supportedFormulaCount
        ? ` Fórmulas simples convertidas: ${imported.supportedFormulaCount}.`
        : "";
      const notesMessage = Array.isArray(imported.notes) && imported.notes.length
        ? ` ${imported.notes.join(" ")}`
        : "";

      setControlBoardFeedback(`Se importaron ${imported.fields.length} componentes desde Excel.${supportedFormulaMessage}${unsupportedColumnsMessage}${notesMessage}`);
    } catch (error) {
      setBoardImportedRowsDraft([]);
      setExcelFormulaWizard({ open: false, items: [] });
      setControlBoardFeedback(error?.message || "No se pudo importar la estructura del Excel.");
    }
  }

  function updateExcelFormulaWizardItem(index, key, value) {
    setExcelFormulaWizard((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }));
  }

  function applyExcelFormulaWizard() {
    const validMappings = (excelFormulaWizard.items || []).filter((item) => item.targetFieldId && item.formulaLeftFieldId && item.formulaRightFieldId);
    if (!validMappings.length) {
      setExcelFormulaWizard({ open: false, items: [] });
      setControlBoardFeedback("No se aplicaron conversiones manuales de fórmula.");
      return;
    }

    const mappingByTarget = new Map(validMappings.map((item) => [item.targetFieldId, item]));
    setControlBoardDraft((current) => ({
      ...current,
      columns: (current.columns || []).map((field) => {
        const mapping = mappingByTarget.get(field.id);
        if (!mapping) return field;
        return {
          ...field,
          type: "formula",
          formulaOperation: mapping.operation || "add",
          formulaLeftFieldId: mapping.formulaLeftFieldId,
          formulaRightFieldId: mapping.formulaRightFieldId,
          helpText: field.helpText || "Fórmula configurada manualmente desde el asistente de importación.",
        };
      }),
    }));
    setExcelFormulaWizard({ open: false, items: [] });
    setControlBoardFeedback(`Se configuraron ${validMappings.length} fórmula(s) de manera manual.`);
  }

  function getBoardFieldValue(board, row, field) {
    const values = row.values || {};
    const rawValue = values[field.id];

    if (field.type === "inventoryProperty") {
      const resolvedSourceFieldId = resolveInventoryPropertySourceFieldId(board.fields || [], field.sourceFieldId, field.id);
      const lookupId = values[resolvedSourceFieldId];
      const inventoryItem = (state.inventoryItems || []).find((item) => item.id === lookupId);
      return inventoryItem?.[field.inventoryProperty] ?? "";
    }

    if (field.type === "formula") {
      const left = Number(values[field.formulaLeftFieldId] ?? getBoardFieldValue(board, row, board.fields.find((item) => item.id === field.formulaLeftFieldId)) ?? 0);
      const right = Number(values[field.formulaRightFieldId] ?? getBoardFieldValue(board, row, board.fields.find((item) => item.id === field.formulaRightFieldId)) ?? 0);
      if (field.formulaOperation === "subtract") return left - right;
      if (field.formulaOperation === "multiply") return left * right;
      if (field.formulaOperation === "divide") return right === 0 ? 0 : left / right;
      return left + right;
    }

    return rawValue ?? "";
  }

  function getBoardFieldCellStyle(field) {
    const typeMinimum = BOARD_FIELD_MIN_WIDTH_BY_TYPE[field?.type] || 120;
    const widthPx = Number(field?.widthPx || 0);
    if (Number.isFinite(widthPx) && widthPx >= 90) {
      const normalizedWidth = Math.max(typeMinimum, Math.round(widthPx));
      return { minWidth: `${normalizedWidth}px`, width: `${normalizedWidth}px` };
    }
    const fallbackStyle = BOARD_FIELD_WIDTH_STYLES[field.width] || BOARD_FIELD_WIDTH_STYLES.md;
    const fallbackValue = Number.parseInt(String(fallbackStyle.minWidth || "180").replace("px", ""), 10);
    const normalizedFallback = Math.max(typeMinimum, Number.isFinite(fallbackValue) ? fallbackValue : 180);
    return { minWidth: `${normalizedFallback}px`, width: `${normalizedFallback}px` };
  }

  function openComponentStudio() {
    setControlBoardDraft((current) => ({
      ...current,
      ...createEmptyFieldDraft(),
    }));
    setEditingDraftColumnId(null);
    setComponentStudioOpen(true);
    setControlBoardFeedback("");
  }

  async function submitPasswordReset() {
    if (!passwordForm.password || passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordForm((current) => ({ ...current, message: "Las contraseñas no coinciden o están vacías." }));
      return;
    }
    if (!isStrongPassword(passwordForm.password)) {
      setPasswordForm((current) => ({ ...current, message: "La contraseña debe incluir mayúscula, minúscula, número, símbolo y al menos 10 caracteres." }));
      return;
    }
    try {
      const requiresForcedChange = Boolean(currentUser?.mustChangePassword);
      const result = await requestJson("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ password: passwordForm.password }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setPasswordForm({ password: "", confirmPassword: "", message: requiresForcedChange ? "" : "Contraseña actualizada." });
    } catch (error) {
      setPasswordForm((current) => ({ ...current, message: error?.message || "No se pudo actualizar la contraseña." }));
    }
  }

  function openResetUserPassword(user) {
    if (!actionPermissions.resetPasswords) return;
    setResetUserPasswordModal({
      open: true,
      userId: user.id,
      userName: user.name,
      password: "",
      message: "",
    });
  }

  async function submitUserPasswordReset() {
    if (!canResetOtherPasswords || !actionPermissions.resetPasswords || !resetUserPasswordModal.userId || !resetUserPasswordModal.password.trim()) {
      setResetUserPasswordModal((current) => ({ ...current, message: "Escribe una contraseña válida." }));
      return;
    }
    if (!isTemporaryPassword(resetUserPasswordModal.password.trim())) {
      setResetUserPasswordModal((current) => ({ ...current, message: `Usa al menos ${TEMPORARY_PASSWORD_MIN_LENGTH} caracteres para la contraseña temporal.` }));
      return;
    }

    try {
      const result = await requestJson(`/auth/users/${resetUserPasswordModal.userId}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetUserPasswordModal.password.trim() }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setResetUserPasswordModal({ open: false, userId: null, userName: "", password: "", message: "" });
    } catch (error) {
      setResetUserPasswordModal((current) => ({ ...current, message: error?.message || "No se pudo restablecer la contraseña." }));
    }
  }

  const pageTitle = NAV_ITEMS.find((item) => item.id === page)?.label || {
    [PAGE_ADMIN]: "Creador de tableros",
    [PAGE_NOT_FOUND]: "Página no encontrada",
  }[page];
  const headerEyebrow = getHeaderEyebrowText(page);
  const shouldShowUserPermissionNote = !supportsManagedPermissionOverrides(userModal.role);
  const inventoryEntityLabel = getInventoryEntityLabel(inventoryModal.domain);
  const shouldShowInventoryPresentationField = inventoryDomainUsesPresentation(inventoryModal.domain);
  const shouldShowInventoryPackagingFields = inventoryDomainUsesPackagingMetrics(inventoryModal.domain);
  const shouldShowInventoryStockFields = inventoryModal.domain !== INVENTORY_DOMAIN_BASE;
  const shouldShowCleaningLinkFields = inventoryModal.domain === INVENTORY_DOMAIN_CLEANING;
  const inventoryPresentationLabel = getInventoryPresentationLabel(inventoryModal.domain);
  const inventoryPresentationPlaceholder = getInventoryPresentationPlaceholder(inventoryModal.domain);
  const inventoryUnitPlaceholder = getInventoryUnitPlaceholder(inventoryModal.domain);
  const inventoryStoragePlaceholder = getInventoryStoragePlaceholder(inventoryModal.domain);
  const shouldShowTransferTargetEmptyState = !hasOrderTransferTargets;
  const shouldShowTransferRemainingUnits = (movement) => movement.remainingUnits !== null;
  const shouldShowTransferMovementEmptyState = orderInventoryTransferMovements.length === 0;

  const boardSectionOptions = useMemo(() => {
    const options = new Set(DEFAULT_BOARD_SECTION_OPTIONS);
    (controlBoardDraft.columns || []).forEach((column) => {
      const sectionName = String(column.groupName || "").trim();
      if (sectionName) options.add(sectionName);
    });
    return Array.from(options.values());
  }, [controlBoardDraft.columns]);

  const activityCatalogCategoryOptions = useMemo(() => {
    const options = new Set(["General"]);
    (state.catalog || []).forEach((item) => {
      if (item?.isDeleted) return;
      const categoryName = String(item?.category || "General").trim() || "General";
      options.add(categoryName);
    });
    return Array.from(options.values());
  }, [state.catalog]);

  const contextoConstructor = {
    BOARD_ACTIVITY_LIST_FIELD,
    BOARD_AUX_COLUMN_DEFINITIONS,
    BOARD_FIELD_TYPES,
    BOARD_FIELD_WIDTHS,
    BOARD_FIELD_WIDTH_STYLES,
    COLOR_RULE_OPERATORS,
    FORMULA_OPERATIONS,
    INVENTORY_LOOKUP_LOGISTICS_FIELD,
    INVENTORY_PROPERTIES,
    OPTION_SOURCE_TYPES,
    STATUS_PENDING,
    STATUS_RUNNING,
    formatBoardPreviewValue,
    getBoardFieldDisplayType,
    getBoardFieldTypeDescription,
    getNormalizedBoardColumnOrder,
    getOrderedBoardColumns,
    getBoardSectionGroups,
    reorderBoardColumnOrderTokens,
    renderBoardFieldLabel,
    sortBoardFieldsByColumnOrder,
  };

  const paginasContexto = {
    ACTION_DEFINITIONS,
    AlertTriangle,
    activeAssignableUsers,
    activeWeek,
    actionPermissions,
    adminReportRows,
    adminTab,
    applyPermissionPreset,
    applyRemoteWarehouseState,
    ArrowUp,
    auditFilters,
    BarChart3,
    boardAssignmentsByUser,
    boardRuntimeFeedback,
    buildSelectOptions,
    CalendarDays,
    canDoBoardAction,
    canEditBoard,
    canEditBoardRowRecord,
    canOperateBoardRowRecord,
    catalogMap,
    catalogWeekGroups,
    changeBoardRowStatus,
    CircleCheckBig,
    ClipboardList,
    Clock3,
    Copy,
    creatableRoles,
    createBoardRow,
    currentInventoryImportPermission,
    currentInventoryItems,
    currentInventoryManagePermission,
    currentInventoryMovements,
    currentUser,
    customBoardActionsMenuOpen,
    customBoardActionsMenuRef,
    customBoardMetrics,
    customBoardSearch,
    dashboardActivityRows,
    dashboardAreaRows,
    dashboardCatalogFrequencyRows,
    dashboardCatalogTypeRows,
    dashboardDistributionRows,
    dashboardFilters,
    dashboardIshikawaRows,
    dashboardMetrics,
    dashboardParetoRows,
    dashboardPeriodOptions,
    dashboardResponsibleRows,
    dashboardSectionsOpen,
    dashboardTrendRows,
    DashboardBarRow,
    DashboardCauseCard,
    DashboardColumnChart,
    DashboardIshikawaDiagram,
    DashboardKpiCard,
    DashboardParetoChart,
    DashboardParetoRow,
    DashboardPieChart,
    DashboardProgressMetric,
    DashboardRankItem,
    DashboardSection,
    departmentOptions,
    downloadInventoryTemplate,
    Download,
    duplicateBoardRecord,
    Eye,
    editableVisibleBoards,
    exportPermissionRules,
    exportSelectedBoardToExcel,
    previewSelectedBoardPdf,
    exportSelectedBoardToPdf,
    filteredAuditLog,
    filteredBoardTemplates,
    filteredUsers,
    filteredVisibleControlBoards,
    formatDate,
    formatDateTime,
    formatDurationClock,
    formatMetricNumber,
    formatMinutes,
    formatPercent,
    formatTime,
    Gauge,
    getActivityLabel,
    getActivityFrequencyLabel,
    getBoardAssignmentSummary,
    getBoardFieldCellStyle,
    getOrderedBoardColumns,
    getBoardFieldValue,
    renderBoardFieldLabel,
    getDashboardPeriodTypeLabel,
    getElapsedSeconds,
    getFieldColorRule,
    getResponsibleVisual,
    getRoleBadgeClass,
    getTimeLimitMinutes,
    getUserArea,
    getUserJobTitle,
    handleInventoryImport,
    handlePermissionImport,
    historyWeek,
    inventoryActionsMenuOpen,
    inventoryActionsMenuRef,
    inventoryFileInputRef,
    inventoryImportFeedback,
    inventoryLinkedCleaningRows,
    inventoryMovementSavedDestinations,
    inventoryMovementSavedLocations,
    currentInventorySupplyableCount: currentInventorySupplyableItems.length,
    inventoryCleaningSite,
    inventorySearch,
    inventoryStats,
    inventoryTab,
    CLEANING_SITE_OPTIONS,
    openInventoryBulkRestockModal,
    openInventoryRestockModal,
    openInventoryTransferHistory,
    openInventoryTransferViewer,
    openOrderInventoryTransfer,
    orderInventoryTransferMovements,
    orderInventoryTransferSummary,
    InventoryLookupInput,
    InventoryStockBar,
    INVENTORY_DOMAIN_BASE,
    INVENTORY_DOMAIN_CLEANING,
    INVENTORY_DOMAIN_ORDERS,
    INVENTORY_MOVEMENT_CONSUME,
    INVENTORY_MOVEMENT_RESTOCK,
    INVENTORY_MOVEMENT_TRANSFER,
    LayoutDashboard,
    lowStockInventoryItems,
    Menu,
    MetricCard,
    NAV_ITEMS,
    ACTIVITY_FREQUENCY_OPTIONS,
    normalizedPermissions,
    now,
    OctagonAlert,
    openBoardPauseModal,
    openCatalogCreate,
    openCatalogEdit,
    openCreateBoardBuilder,
    openCreateInventoryItem,
    openCreateUser,
    openEditBoardBuilder,
    openEditInventoryItem,
    openEditUser,
    openFinishBoardRowConfirm,
    openInventoryMovement,
    Package,
    PAGE_CUSTOM_BOARDS,
    PAGE_DASHBOARD,
    page,
    pauseAnalysis,
    Pause,
    PauseCircle,
    Pencil,
    permissionFileInputRef,
    permissionsFeedback,
    PERMISSION_PRESETS,
    PieChart,
    Play,
    Plus,
    requestJson,
    ROLE_LEAD,
    ROLE_JR,
    RotateCcw,
    Search,
    securityEvents,
    securityEventsStatus,
    selectedBoardActionPermissions,
    selectedCustomBoard,
    selectedCustomBoardDisplay,
    selectedCustomBoardHistoryOptions,
    selectedCustomBoardSnapshot,
    selectedCustomBoardViewId,
    selectedCustomBoardSections,
    canChangeSelectedBoardOperationalContext,
    selectedPermissionBoard,
    setAdminTab,
    setAuditFilters,
    setBoardRuntimeFeedback,
    setCustomBoardActionsMenuOpen,
    setCustomBoardSearch,
    setDashboardFilters,
    setDashboardSectionsOpen,
    setDeleteBoardId,
    setDeleteBoardRowState,
    setDeleteInventoryId,
    setDeleteUserId,
    setEditWeekId,
    setHistoryPauseActivityId,
    setInventoryActionsMenuOpen,
    setInventoryCleaningSite,
    setInventorySearch,
    setInventoryTab,
    setLoginDirectory,
    setPage,
    setSelectedCustomBoardId,
    updateBoardOperationalContext,
    setSelectedHistoryWeekId,
    setSelectedPermissionBoardId,
    setState,
    setSyncStatus,
    setUserRoleFilter,
    setUserSearch,
    setUsersViewTab,
    Settings,
    skipNextSyncRef,
    softDeleteCatalog,
    Square,
    state,
    StatTile,
    STATUS_FINISHED,
    STATUS_PAUSED,
    STATUS_PENDING,
    STATUS_RUNNING,
    StatusBadge,
    togglePermissionRole,
    toggleUserActive,
    Trash2,
    updateBoardAssignment,
    updateBoardRowValue,
    updatePermissionEntry,
    Upload,
    userMap,
    usersByAreaGroups,
    isHistoricalCustomBoardView,
    setSelectedCustomBoardViewId,
    usersByCreatorGroups,
    usersCreatedByMap,
    usersViewTab,
    userRoleFilter,
    userSearch,
    userStats,
    USER_ROLES,
    Users,
    visibleControlBoards,
    visibleUsers,
    weeklyAreaCoverageRows,
    Zap,
  };

  if (isBootstrapMasterSession) {
    return <BootstrapLeadSetup setupForm={bootstrapLeadForm} onChange={updateBootstrapLeadField} onSubmit={handleCreateFirstLead} error={bootstrapLeadError} areaOptions={departmentOptions} onAddArea={handleAddAreaToBootstrap} />;
  }

  if (!currentUser) {
    return <LoginScreen loginForm={loginForm} onChange={updateLoginField} onSubmit={handleLogin} error={loginError} demoUsers={loginDirectory.system?.showBootstrapMasterHint ? [{ id: BOOTSTRAP_MASTER_ID, role: "Acceso maestro", login: loginDirectory.system?.masterUsername || MASTER_USERNAME }] : loginDirectory.demoUsers} />;
  }

  return (
    <main className={`warehouse-app ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AppToastStack toasts={appToasts} onDismiss={dismissAppToast} />
      <button type="button" className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`} onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menú lateral" />
      <Sidebar
        currentUser={currentUser}
        page={page}
        onPageChange={setPage}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
        allowedNavItems={allowedNavItems}
      />

      <section ref={contentShellRef} className="content-shell">
        <header className={`content-header ${page === PAGE_DASHBOARD ? "dashboard-header-shell" : ""}`}>
          <button type="button" className="mobile-nav-toggle" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
            <Menu size={18} />
            <span>Menú</span>
          </button>
          <div>
            <p className="eyebrow">{headerEyebrow}</p>
            <h2>{page === PAGE_DASHBOARD ? "Dashboard" : pageTitle}</h2>
            {page === PAGE_DASHBOARD ? <span className="dashboard-header-subtitle">Vista en tiempo real · {activeWeek?.name || "Semana actual"}</span> : null}
          </div>
          <div className="header-tools">
            <div ref={notificationCenterRef}>
              <AppNotificationCenter
                unreadNotifications={unreadNotifications}
                readNotifications={readNotifications}
                unreadCount={unreadNotificationsCount}
                activeTab={notificationPanelTab}
                isOpen={notificationPanelOpen}
                onToggle={handleToggleNotificationPanel}
                onTabChange={setNotificationPanelTab}
                onDeleteAllRead={handleDeleteAllReadNotifications}
                onDeleteNotification={handleDeleteNotification}
                onOpenNotification={handleOpenNotification}
              />
            </div>
            <div className="header-meta">
              <span>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(now))}</span>
              <span>{syncStatus}</span>
              <strong>{currentUser.role}</strong>
            </div>
          </div>
        </header>

        {page === PAGE_BOARD || page === PAGE_ADMIN ? <TablerosCreados contexto={paginasContexto} /> : null}
        {page === PAGE_CUSTOM_BOARDS ? <MisTableros contexto={paginasContexto} /> : null}
        {page === PAGE_DASHBOARD ? <PanelIndicadores contexto={paginasContexto} /> : null}
        {page === PAGE_HISTORY ? <HistorialSemanas contexto={paginasContexto} /> : null}
        {page === PAGE_INVENTORY ? <GestionInventario contexto={paginasContexto} /> : null}
        {page === PAGE_USERS ? <GestionUsuarios contexto={paginasContexto} /> : null}
        {page === PAGE_NOT_FOUND ? <PaginaNoEncontrada contexto={paginasContexto} /> : null}
      </section>

      <Modal open={pauseState.open} title="Actividad en pausa" confirmLabel="Confirmar pausa" cancelLabel="Cancelar" onClose={() => setPauseState({ open: false, activityId: null, reason: "", error: "" })} onConfirm={handleConfirmPause}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Motivo de pausa</span>
            <input value={pauseState.reason} onChange={(event) => setPauseState((current) => ({ ...current, reason: event.target.value, error: "" }))} placeholder="Describe por qué se detiene la actividad" />
          </label>
          {pauseState.error ? <p className="validation-text">{pauseState.error}</p> : null}
          <p className="modal-footnote">El motivo es obligatorio para poder pausar.</p>
        </div>
      </Modal>

      <Modal open={boardPauseState.open} title="Pausar fila" confirmLabel="Confirmar pausa" cancelLabel="Cancelar" onClose={() => setBoardPauseState({ open: false, boardId: null, rowId: null, reason: "", error: "" })} onConfirm={handleConfirmBoardPause}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Motivo de pausa</span>
            <input value={boardPauseState.reason} onChange={(event) => setBoardPauseState((current) => ({ ...current, reason: event.target.value, error: "" }))} placeholder="Describe por qué se detiene la fila" />
          </label>
          {boardPauseState.error ? <p className="validation-text">{boardPauseState.error}</p> : null}
          <p className="modal-footnote">La fila solo se pausa si capturas un motivo.</p>
        </div>
      </Modal>

      <Modal open={boardFinishConfirm.open} title="Finalizar fila" confirmLabel="Confirmar fin" cancelLabel="Cancelar" onClose={() => setBoardFinishConfirm({ open: false, boardId: null, rowId: null, message: "" })} onConfirm={confirmFinishBoardRow}>
        <div className="modal-form-grid">
          <p>Vas a cerrar esta actividad.</p>
          <p>{boardFinishConfirm.message}</p>
        </div>
      </Modal>

      <Modal open={deleteBoardRowState.open} title="Eliminar fila" confirmLabel="Eliminar fila" cancelLabel="Cancelar" onClose={() => setDeleteBoardRowState({ open: false, boardId: null, rowId: null })} onConfirm={() => deleteBoardRow(deleteBoardRowState.boardId, deleteBoardRowState.rowId)}>
        <div className="modal-form-grid">
          <p>Esta fila se eliminará del tablero.</p>
          <p>Úsalo cuando la actividad se creó por error o ya no se va a realizar.</p>
        </div>
      </Modal>

      <Modal open={catalogModal.open} title={catalogModal.mode === "create" ? "Nueva actividad" : "Editar actividad"} confirmLabel={catalogModal.mode === "create" ? "Guardar" : "Guardar cambios"} cancelLabel="Cancelar" onClose={() => setCatalogModal({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: "General" })} onConfirm={submitCatalogModal}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Lista de actividades</span>
            <input value={catalogModal.category} onChange={(event) => setCatalogModal((current) => ({ ...current, category: event.target.value }))} placeholder="Ej: Limpieza, Seguridad, Producción" />
          </label>
          <label className="app-modal-field">
            <span>Nombre de la actividad</span>
            <input value={catalogModal.name} onChange={(event) => setCatalogModal((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Tiempo límite (minutos)</span>
            <input type="number" value={catalogModal.limit} onChange={(event) => setCatalogModal((current) => ({ ...current, limit: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Tipo</span>
            <select value={catalogModal.mandatory} onChange={(event) => setCatalogModal((current) => ({ ...current, mandatory: event.target.value }))}>
              <option value="true">Obligatoria</option>
              <option value="false">Ocasional</option>
            </select>
          </label>
          <label className="app-modal-field">
            <span>Frecuencia</span>
            <select value={catalogModal.frequency} onChange={(event) => setCatalogModal((current) => ({ ...current, frequency: event.target.value }))}>
              {ACTIVITY_FREQUENCY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </Modal>

      <Modal open={areaModal.open} backdropClassName="area-modal-backdrop" title="Agregar área" confirmLabel="Guardar área" cancelLabel="Cancelar" onClose={() => setAreaModal({ open: false, target: "user", name: "", error: "" })} onConfirm={confirmAddArea}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Nombre del área</span>
            <input value={areaModal.name} onChange={(event) => setAreaModal((current) => ({ ...current, name: event.target.value, error: "" }))} placeholder="Ej: LOGISTICA" />
          </label>
          {areaModal.error ? <p className="validation-text">{areaModal.error}</p> : null}
          <p className="modal-footnote">La nueva área se agregará al catálogo y se seleccionará automáticamente.</p>
        </div>
      </Modal>

      <Modal open={Boolean(editWeekId)} title="Editar semana" confirmLabel="Cerrar" hideCancel onClose={() => { setEditWeekId(null); setEditWeekActivityId(""); }}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Seleccionar actividad del catálogo</span>
            <select value={editWeekActivityId} onChange={(event) => setEditWeekActivityId(event.target.value)}>
              <option value="">Seleccionar...</option>
              {state.catalog.filter((item) => !item.isDeleted).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" className="primary-button" onClick={addActivityToWeek}><Plus size={16} /> Agregar a semana</button>
          <div className="week-activity-list">
            {state.activities.filter((activity) => activity.weekId === editWeekId).map((activity) => (
              <div key={activity.id} className="week-activity-item">
                <div>
                  <strong>{getActivityLabel(activity, catalogMap)}</strong>
                  <span>{activity.status}</span>
                </div>
                <button type="button" className="icon-button danger" onClick={() => removeWeekActivity(activity.id)}><Trash2 size={15} /> Quitar</button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={userModal.open} className="user-management-modal" title={userModal.mode === "create" ? "Crear nuevo player" : "Editar player"} confirmLabel={userModal.mode === "create" ? "Guardar player" : "Guardar cambios"} cancelLabel="Cancelar" onClose={closeUserModal} onConfirm={submitUserModal}>
        <div className="modal-form-grid">
          <div className="user-modal-grid">
            <label className="app-modal-field">
              <span>Nombre completo</span>
              <input value={userModal.name} onChange={(event) => setUserModal((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="app-modal-field">
              <span>Player de acceso</span>
              <input value={userModal.username} onChange={(event) => setUserModal((current) => ({ ...current, username: event.target.value }))} placeholder="Ej: alejandro.cruz" />
            </label>
            <label className="app-modal-field">
              <span>Área</span>
              <div className="area-selector-row">
                <select value={userModal.area} onChange={(event) => setUserModal((current) => ({ ...current, area: event.target.value }))}>
                  <option value="">Seleccionar área...</option>
                  {userAreaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                {currentUser?.role === ROLE_LEAD ? <button type="button" className="icon-button area-add-button" onClick={handleAddAreaOption} aria-label="Agregar nueva área"><Plus size={16} /></button> : null}
              </div>
            </label>
            <label className="app-modal-field">
              <span>Cargo</span>
              <input value={userModal.jobTitle} onChange={(event) => setUserModal((current) => ({ ...current, jobTitle: event.target.value }))} placeholder="Ej: Encargado de Mejora Continua" />
            </label>
            <label className="app-modal-field">
              <span>Rol interno</span>
              <select value={userModal.role} onChange={(event) => updateUserModalRole(event.target.value)}>
                {userModalRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="app-modal-field">
              <span>Referencia</span>
              <select value={userModal.managerId} onChange={(event) => setUserModal((current) => ({ ...current, managerId: event.target.value }))}>
                <option value="">Seleccionar...</option>
                {activeAssignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            {userModal.mode === "create" ? (
              <label className="app-modal-field">
                <span>Contraseña temporal</span>
                <input
                  type="password"
                  value={userModal.password}
                  onChange={(event) => setUserModal((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Mínimo 4 caracteres"
                />
              </label>
            ) : null}
            <fieldset className="app-modal-field user-status-switch-field">
              <legend>Estado inicial</legend>
              <div className="user-status-switch-row">
                <button
                  type="button"
                  className={`switch-button ${userModal.isActive === "true" ? "on" : ""}`}
                  onClick={() => setUserModal((current) => ({ ...current, isActive: current.isActive === "true" ? "false" : "true" }))}
                  aria-pressed={userModal.isActive === "true"}
                  aria-label="Cambiar estado inicial del player"
                >
                  <span className="switch-thumb" />
                </button>
                <strong>{userModal.isActive === "true" ? "Activo" : "Inactivo"}</strong>
              </div>
            </fieldset>
          </div>

          {actionPermissions.managePermissions && supportsManagedPermissionOverrides(userModal.role) ? (
            <section className="user-modal-permissions">
              <div className="builder-section-head">
                <div>
                  <h4>Permisos directos</h4>
                  <p>Configura aquí los accesos puntuales de este player sin salir del modal.</p>
                </div>
                <span className="chip primary">{permissionPages.filter((item) => userModal.permissionOverrides.pages?.[item.id]).length} pestañas activas</span>
              </div>

              <div className="permissions-accordion-list user-modal-permission-list">
                {permissionPages.map((item) => {
                  const isOpen = userModal.permissionPageId === item.id;
                  const pageActions = getPagePermissionActions(item.id);
                  return (
                    <article key={item.id} className={`permission-accordion-card ${isOpen ? "open" : ""}`}>
                      <button type="button" className="permission-accordion-toggle" onClick={() => toggleUserModalPermissionSection(item.id)}>
                        <div>
                          <strong>{item.label}</strong>
                          <span>{pageActions.length ? `${pageActions.length} permiso(s) de acción` : "Solo acceso a la pestaña"}</span>
                        </div>
                        <span className="chip">{isOpen ? "Abierto" : "Abrir"}</span>
                      </button>

                      {isOpen ? (
                        <div className="permission-accordion-body user-modal-permission-body">
                          <div className="permission-switch-row permission-switch-row-primary">
                            <div>
                              <strong>Ver pestaña</strong>
                              <span>Permite entrar a {item.label}.</span>
                            </div>
                            <button type="button" className={`switch-button ${userModal.permissionOverrides.pages?.[item.id] ? "on" : ""}`} onClick={() => toggleUserModalPermission("pages", item.id)} aria-pressed={userModal.permissionOverrides.pages?.[item.id]}>
                              <span className="switch-thumb" />
                            </button>
                          </div>

                          {pageActions.length ? (
                            <div className="permission-switch-list">
                              {pageActions.map((action) => (
                                <div key={action.id} className="permission-switch-row">
                                  <div>
                                    <strong>{action.label}</strong>
                                    <span>{action.category}</span>
                                  </div>
                                  <button type="button" className={`switch-button ${userModal.permissionOverrides.actions?.[action.id] ? "on" : ""}`} onClick={() => toggleUserModalPermission("actions", action.id)} aria-pressed={userModal.permissionOverrides.actions?.[action.id]}>
                                    <span className="switch-thumb" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {userModal.mode === "edit" && canResetOtherPasswords && userModal.id && userModal.id !== currentUser?.id ? (
            <div className="user-modal-inline-actions">
              <button
                type="button"
                className="user-row-button"
                onClick={() => {
                  const targetUser = state.users.find((user) => user.id === userModal.id);
                  if (targetUser) openResetUserPassword(targetUser);
                }}
                disabled={!actionPermissions.resetPasswords}
              >
                <RotateCcw size={15} /> Restablecer clave
              </button>
            </div>
          ) : null}

          {shouldShowUserPermissionNote && (
            <article className="user-permission-note">
              <strong>{userModal.role === ROLE_SSR ? "Semi-Senior con alcance operativo" : "Acceso operativo por tablero"}</strong>
              <p>{userModal.role === ROLE_SSR ? "Semi-Senior solo puede crear perfiles Junior y trabajar con los tableros que tenga asignados." : "Junior solo accede a Mis tableros y verá únicamente los tableros que tenga asignados."}</p>
            </article>
          )}
        </div>
      </Modal>

      <Modal open={templateEditorModal.open} title="Editar plantilla guardada" confirmLabel="Guardar cambios" cancelLabel="Cancelar" onClose={() => setTemplateEditorModal({ open: false, id: null, name: "", description: "", category: "", visibilityType: "department", sharedDepartments: [], sharedUserIds: [] })} onConfirm={submitBoardTemplateEdit}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Nombre de plantilla</span>
            <input value={templateEditorModal.name} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Categoría</span>
            <input value={templateEditorModal.category} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, category: event.target.value }))} placeholder="Ej: Embarques, Calidad, Producción" />
          </label>
          <label className="app-modal-field">
            <span>Compartir con</span>
            <select value={templateEditorModal.visibilityType} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, visibilityType: event.target.value }))}>
              <option value="department">Departamento</option>
                        <option value="users">Players específicos</option>
              <option value="all">Todos</option>
            </select>
          </label>
          {templateEditorModal.visibilityType === "department" ? (
            <label className="app-modal-field">
              <span>Departamentos con acceso</span>
              <select multiple value={templateEditorModal.sharedDepartments} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, sharedDepartments: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>
                {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </label>
          ) : null}
          {templateEditorModal.visibilityType === "users" ? (
            <label className="app-modal-field">
                        <span>Players con acceso</span>
              <select multiple value={templateEditorModal.sharedUserIds} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, sharedUserIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>
                {activeAssignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="app-modal-field">
            <span>Descripción</span>
            <input value={templateEditorModal.description} onChange={(event) => setTemplateEditorModal((current) => ({ ...current, description: event.target.value }))} placeholder="Explica para qué sirve esta plantilla" />
          </label>
        </div>
      </Modal>

      <BoardBuilderModal
        open={boardBuilderModal.open}
        mode={boardBuilderModal.mode}
        draft={controlBoardDraft}
        onChange={setControlBoardDraft}
        onClose={closeBoardBuilderModal}
        onConfirm={saveControlBoard}
        onOpenComponentStudio={openComponentStudio}
        onImportFromExcel={openBoardExcelImportPicker}
        onSaveTemplate={saveDraftAsBoardTemplate}
        onClear={clearControlBoardDraft}
        feedback={controlBoardFeedback}
        templateSearch={templateSearch}
        onTemplateSearchChange={setTemplateSearch}
        templateCategoryFilter={templateCategoryFilter}
        onTemplateCategoryChange={setTemplateCategoryFilter}
        templateCategories={templateCategories}
        filteredBoardTemplates={filteredBoardTemplates}
        onPreviewTemplate={previewBoardTemplate}
        onApplyTemplate={applyBoardTemplate}
        selectedPreviewTemplate={selectedPreviewTemplate}
        onClearTemplatePreview={() => setTemplatePreviewId(null)}
        previewBoard={boardBuilderPreview}
        draftColumnGroups={draftColumnGroups}
        onMoveDraftColumn={moveDraftColumn}
        onReorderDraftColumn={reorderDraftColumn}
        onDuplicateDraftColumn={duplicateDraftColumn}
        onEditDraftColumn={editDraftColumn}
        onRemoveDraftColumn={removeDraftColumn}
        visibleUsers={visibleUsers}
        departmentOptions={departmentOptions}
        currentUser={currentUser}
        userMap={userMap}
        inventoryItems={state.inventoryItems}
        contextoConstructor={contextoConstructor}
        boardOperationalContextOptions={BOARD_OPERATIONAL_CONTEXT_OPTIONS}
        canSaveTemplate={actionPermissions.saveTemplate}
        canSaveBoard={actionPermissions.saveBoard}
      />

      <input
        ref={boardExcelFileInputRef}
        type="file"
        accept=".xlsx"
        hidden
        onChange={importBoardStructureFromExcel}
      />

      <BoardComponentStudioModal open={componentStudioOpen} mode={editingDraftColumnId ? "edit" : "create"} draft={controlBoardDraft} onChange={setControlBoardDraft} onClose={() => { setComponentStudioOpen(false); setEditingDraftColumnId(null); setControlBoardDraft((current) => ({ ...current, ...createEmptyFieldDraft() })); }} onConfirm={addDraftColumn} catalog={state.catalog} inventoryItems={state.inventoryItems} visibleUsers={visibleUsers} sectionOptions={boardSectionOptions} activityCategoryOptions={activityCatalogCategoryOptions} contextoConstructor={contextoConstructor} />

      <Modal open={excelFormulaWizard.open} title="Asistente de fórmulas de Excel" confirmLabel="Aplicar mapeo" cancelLabel="Cerrar" onClose={() => setExcelFormulaWizard({ open: false, items: [] })} onConfirm={applyExcelFormulaWizard}>
        <div className="modal-form-grid">
          <p className="modal-footnote">Estas columnas tenían fórmulas complejas que no se pudieron convertir automáticamente. Puedes mapearlas aquí para crear fórmulas nativas del tablero.</p>
          {(excelFormulaWizard.items || []).map((item, index) => (
            <section key={`${item.targetFieldId || item.targetLabel}-${index}`} className="surface-card" style={{ padding: "0.8rem" }}>
              <p><strong>{item.targetLabel}</strong></p>
              <p className="modal-footnote">Fórmula original: {item.formula}</p>
              <div className="modal-form-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <label className="app-modal-field">
                  <span>Operando izquierdo<span className="required-mark" aria-hidden="true"> *</span></span>
                  <select value={item.formulaLeftFieldId || ""} onChange={(event) => updateExcelFormulaWizardItem(index, "formulaLeftFieldId", event.target.value)}>
                    <option value="">Seleccionar...</option>
                    {(controlBoardDraft.columns || []).filter((field) => field.id !== item.targetFieldId).map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}
                  </select>
                </label>
                <label className="app-modal-field">
                  <span>Operación<span className="required-mark" aria-hidden="true"> *</span></span>
                  <select value={item.operation || "add"} onChange={(event) => updateExcelFormulaWizardItem(index, "operation", event.target.value)}>
                    {FORMULA_OPERATIONS.map((operation) => <option key={operation.value} value={operation.value}>{operation.label}</option>)}
                  </select>
                </label>
                <label className="app-modal-field">
                  <span>Operando derecho<span className="required-mark" aria-hidden="true"> *</span></span>
                  <select value={item.formulaRightFieldId || ""} onChange={(event) => updateExcelFormulaWizardItem(index, "formulaRightFieldId", event.target.value)}>
                    <option value="">Seleccionar...</option>
                    {(controlBoardDraft.columns || []).filter((field) => field.id !== item.targetFieldId).map((field) => <option key={field.id} value={field.id}>{field.label}</option>)}
                  </select>
                </label>
              </div>
            </section>
          ))}
        </div>
      </Modal>

      {profileModalOpen ? <EmployeeProfileModal currentUser={currentUser} passwordForm={passwordForm} onPasswordChange={setPasswordForm} onSubmit={submitPasswordReset} onUpdateIdentity={updateCurrentUserIdentity} onClose={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); }} onLogout={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); handleLogout(); }} /> : null}

      {isForcedPasswordChange ? <ForcedPasswordChangeModal passwordForm={passwordForm} onPasswordChange={setPasswordForm} onSubmit={submitPasswordReset} /> : null}

      <Modal open={resetUserPasswordModal.open} title="Restablecer contraseña" confirmLabel="Guardar contraseña temporal" cancelLabel="Cancelar" onClose={() => setResetUserPasswordModal({ open: false, userId: null, userName: "", password: "", message: "" })} onConfirm={submitUserPasswordReset}>
        <div className="modal-form-grid">
          <p className="modal-footnote">La sesión activa de {resetUserPasswordModal.userName || "este player"} se cerrará y en su siguiente acceso deberá capturar una contraseña nueva.</p>
          <label className="app-modal-field">
            <span>Contraseña temporal</span>
            <input type="password" value={resetUserPasswordModal.password} onChange={(event) => setResetUserPasswordModal((current) => ({ ...current, password: event.target.value, message: "" }))} />
          </label>
          {resetUserPasswordModal.message ? <p className="validation-text">{resetUserPasswordModal.message}</p> : null}
          <p className="modal-footnote">Solo Lead y Senior pueden restablecer la contraseña de otros players. La contraseña temporal puede tener desde {TEMPORARY_PASSWORD_MIN_LENGTH} caracteres.</p>
        </div>
      </Modal>

      <Modal className="inventory-item-modal" open={inventoryModal.open} title={inventoryModal.mode === "create" ? `Agregar ${inventoryEntityLabel}` : `Editar ${inventoryEntityLabel}`} confirmLabel={inventoryModal.mode === "create" ? `Guardar ${inventoryEntityLabel}` : "Guardar cambios"} cancelLabel="Cancelar" onClose={() => setInventoryModal(createInventoryModalState())} onConfirm={submitInventoryModal}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Dominio</span>
            <select
              value={inventoryModal.domain}
              onChange={(event) => {
                const nextDomain = normalizeInventoryDomain(event.target.value);
                setInventoryModal((current) => ({
                  ...current,
                  domain: nextDomain,
                  presentation: inventoryDomainUsesPresentation(nextDomain) ? current.presentation : "",
                  piecesPerBox: inventoryDomainUsesPackagingMetrics(nextDomain) ? current.piecesPerBox : "",
                  boxesPerPallet: inventoryDomainUsesPackagingMetrics(nextDomain) ? current.boxesPerPallet : "",
                  cleaningSite: nextDomain === INVENTORY_DOMAIN_CLEANING ? current.cleaningSite || inventoryCleaningSite || DEFAULT_CLEANING_SITE : DEFAULT_CLEANING_SITE,
                  activityCatalogIds: nextDomain === INVENTORY_DOMAIN_CLEANING ? current.activityCatalogIds : [],
                  activityConsumptions: nextDomain === INVENTORY_DOMAIN_CLEANING ? current.activityConsumptions : [],
                }));
              }}
            >
              {INVENTORY_DOMAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="app-modal-field">
            <span>Código</span>
            <input value={inventoryModal.code} onChange={(event) => setInventoryModal((current) => ({ ...current, code: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Nombre</span>
            <input value={inventoryModal.name} onChange={(event) => setInventoryModal((current) => ({ ...current, name: event.target.value }))} />
          </label>
          {shouldShowInventoryPresentationField ? (
            <label className="app-modal-field">
              <span>{inventoryPresentationLabel}</span>
              <input value={inventoryModal.presentation} onChange={(event) => setInventoryModal((current) => ({ ...current, presentation: event.target.value }))} placeholder={inventoryPresentationPlaceholder} />
            </label>
          ) : null}
          {shouldShowInventoryPackagingFields ? (
            <>
              <label className="app-modal-field">
                <span>Piezas por caja</span>
                <input type="number" value={inventoryModal.piecesPerBox} onChange={(event) => setInventoryModal((current) => ({ ...current, piecesPerBox: event.target.value }))} />
              </label>
              <label className="app-modal-field">
                <span>Cajas por tarima</span>
                <input type="number" value={inventoryModal.boxesPerPallet} onChange={(event) => setInventoryModal((current) => ({ ...current, boxesPerPallet: event.target.value }))} />
              </label>
            </>
          ) : null}
          {shouldShowInventoryStockFields && (
            <>
              <label className="app-modal-field">
                <span>Stock actual</span>
                <input type="number" value={inventoryModal.stockUnits} onChange={(event) => setInventoryModal((current) => ({ ...current, stockUnits: event.target.value }))} />
              </label>
              <label className="app-modal-field">
                <span>Stock mínimo</span>
                <input type="number" value={inventoryModal.minStockUnits} onChange={(event) => setInventoryModal((current) => ({ ...current, minStockUnits: event.target.value }))} />
              </label>
              <label className="app-modal-field">
                <span>Unidad</span>
                <input value={inventoryModal.unitLabel} onChange={(event) => setInventoryModal((current) => ({ ...current, unitLabel: event.target.value }))} placeholder={inventoryUnitPlaceholder} />
              </label>
              <label className="app-modal-field">
                <span>Ubicación / resguardo</span>
                <input value={inventoryModal.storageLocation} onChange={(event) => setInventoryModal((current) => ({ ...current, storageLocation: event.target.value }))} placeholder={inventoryStoragePlaceholder} />
              </label>
            </>
          )}
          {shouldShowCleaningLinkFields ? (
            <>
              <label className="app-modal-field">
                <span>Sede de limpieza</span>
                <select value={inventoryModal.cleaningSite} onChange={(event) => setInventoryModal((current) => ({ ...current, cleaningSite: event.target.value }))}>
                  {CLEANING_SITE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div className="app-modal-field app-modal-field-full inventory-activity-consumption-field">
                <span>Actividades y consumo por inicio</span>
                <InventoryActivityConsumptionEditor
                  activeCatalogItems={activeCatalogItems}
                  activityConsumptions={inventoryModal.activityConsumptions}
                  onToggle={toggleInventoryModalActivityCatalog}
                  onQuantityChange={updateInventoryModalActivityConsumption}
                />
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal open={inventoryMovementModal.open} title={inventoryMovementModalTitle} confirmLabel={isOrderTransferMovementModal ? "Guardar transferencia" : "Guardar movimiento"} cancelLabel="Cancelar" onClose={closeInventoryMovementModal} onConfirm={submitInventoryMovementModal}>
        <div className="modal-form-grid">
          {isOrderTransferMovementModal ? (
            <label className="app-modal-field">
              <span>Insumo</span>
              <select value={inventoryMovementModal.itemId || ""} onChange={(event) => updateInventoryMovementModal({ itemId: event.target.value || null })}>
                <option value="">Selecciona un insumo</option>
                {orderInventoryItems.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
              </select>
            </label>
          ) : (
            <label className="app-modal-field">
              <span>Artículo</span>
              <input value={inventoryMovementModal.itemName} readOnly />
            </label>
          )}
          <label className="app-modal-field">
            <span>Tipo de movimiento</span>
            {isOrderTransferMovementModal ? (
              <input value="Transferencia" readOnly />
            ) : (
              <select value={inventoryMovementModal.movementType} onChange={(event) => updateInventoryMovementModal({ movementType: event.target.value })}>
                {inventoryMovementTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            )}
          </label>
          <label className="app-modal-field">
            <span>{isOrderTransferMovementModal ? "Cantidad a transferir" : "Cantidad"}</span>
            <input type="number" min="0" value={inventoryMovementModal.quantity} onChange={(event) => updateInventoryMovementModal({ quantity: event.target.value })} />
          </label>
          {!isOrderTransferMovementModal && inventoryMovementSavedLocations.length ? (
            <label className="app-modal-field">
              <span>Ubicaciones guardadas</span>
              <select value={inventoryMovementSelectedSavedLocation} onChange={(event) => applySavedInventoryLocation(event.target.value)}>
                <option value="">Selecciona una ubicación previa</option>
                {inventoryMovementSavedLocations.map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}
              </select>
            </label>
          ) : null}
          {!isOrderTransferMovementModal ? (
            <label className="app-modal-field">
              <span>Ubicación / resguardo</span>
              <input value={inventoryMovementModal.storageLocation} onChange={(event) => updateInventoryMovementModal({ storageLocation: event.target.value })} placeholder="Ej: Nave 2 · Estante 4" />
            </label>
          ) : null}
          {isOrderTransferMovementModal ? (
            <>
              <label className="app-modal-field">
                <span>Resguardo actual del insumo</span>
                <input value={inventoryMovementSelectedItem?.storageLocation || "Sin resguardo asignado"} readOnly />
              </label>
              {inventoryMovementSavedDestinations.length ? (
                <label className="app-modal-field">
                  <span>Destino guardado</span>
                  <select value={inventoryMovementSelectedSavedDestinationKey} onChange={(event) => applySavedInventoryDestination(event.target.value)}>
                    <option value="">Agregar nuevo destino</option>
                    {inventoryMovementSavedDestinations.map((destination) => <option key={destination.destinationKey} value={destination.destinationKey}>{formatInventoryTransferDestinationLabel(destination)}</option>)}
                  </select>
                </label>
              ) : null}
              {!inventoryMovementSavedDestinations.length || !inventoryMovementSelectedSavedDestinationKey ? (
                <>
                  <label className="app-modal-field">
                    <span>Punto de entrega destino</span>
                    <input value={inventoryMovementModal.storageLocation} onChange={(event) => updateInventoryMovementModal({ storageLocation: event.target.value })} placeholder="Ej: Estación de empaque A" />
                  </label>
                  <label className="app-modal-field">
                    <span>Nave destino</span>
                    <input value={inventoryMovementModal.warehouse} onChange={(event) => updateInventoryMovementModal({ warehouse: event.target.value })} placeholder="Ej: Nave 1" />
                  </label>
                  <label className="app-modal-field">
                    <span>Quién recibe el material</span>
                    <input value={inventoryMovementModal.recipientName} onChange={(event) => updateInventoryMovementModal({ recipientName: event.target.value })} placeholder="Nombre del responsable destino" />
                  </label>
                </>
              ) : null}
              <div className="app-modal-field app-modal-field-full inventory-transfer-modal-summary">
                <span>Resumen actual</span>
                <div className="inventory-transfer-modal-summary-grid">
                  <p><strong>Stock origen:</strong> {inventoryMovementSelectedItem?.stockUnits || 0} {inventoryMovementSelectedItem?.unitLabel || "pzas"}</p>
                  <p><strong>Disponible para transferir:</strong> {inventoryMovementAvailableUnits} {inventoryMovementSelectedItem?.unitLabel || "pzas"}</p>
                </div>
                {inventoryMovementTransferTarget ? (
                  <p className="subtle-line">Último saldo registrado en el destino {inventoryMovementTransferTarget.warehouse || "sin nave"} / {inventoryMovementTransferTarget.storageLocation || "sin punto de entrega"}: {inventoryMovementTransferTarget.availableUnits} {inventoryMovementTransferTarget.unitLabel || inventoryMovementSelectedItem?.unitLabel || "pzas"}. Ese saldo solo actualiza el destino y no devuelve piezas al stock origen.</p>
                ) : (
                  <p className="subtle-line">Este destino se registrará como un nuevo punto de resguardo para el insumo seleccionado.</p>
                )}
              </div>
            </>
          ) : null}
          <label className="app-modal-field">
            <span>Notas</span>
            <input value={inventoryMovementModal.notes} onChange={(event) => updateInventoryMovementModal({ notes: event.target.value })} placeholder="Detalle del movimiento" />
          </label>
        </div>
      </Modal>

      <Modal open={inventoryTransferConfirmModal.open} title="Confirmar saldo del destino" confirmLabel="Aplicar ajuste y transferir" cancelLabel="Volver" onClose={() => closeInventoryTransferConfirmModal(true)} onConfirm={submitInventoryTransferConfirmModal}>
        <div className="modal-form-grid">
          <div className="app-modal-field app-modal-field-full inventory-transfer-modal-summary">
            <span>Destino a actualizar</span>
            <div className="inventory-transfer-modal-summary-grid">
              <p><strong>Insumo:</strong> {inventoryTransferConfirmModal.itemName || "Sin insumo"}</p>
              <p><strong>Nueva transferencia:</strong> {inventoryTransferConfirmModal.quantity || 0} {inventoryTransferConfirmModal.unitLabel || "pzas"}</p>
              <p><strong>Nave destino:</strong> {inventoryTransferConfirmModal.warehouse || "Sin nave"}</p>
              <p><strong>Punto de entrega destino:</strong> {inventoryTransferConfirmModal.storageLocation || "Sin punto de entrega"}</p>
            </div>
            <p className="subtle-line">Antes de sumar esta nueva transferencia, confirma cuántas piezas siguen quedando actualmente en ese mismo destino. Ese dato solo ajusta el control del destino.</p>
          </div>
          <label className="app-modal-field app-modal-field-full">
            <span>¿Cuántas piezas quedan ahorita en ese destino?</span>
            <input type="number" min="0" value={inventoryTransferConfirmModal.remainingUnits} onChange={(event) => setInventoryTransferConfirmModal((current) => ({ ...current, remainingUnits: event.target.value }))} placeholder={inventoryTransferConfirmModal.lastKnownUnits === null ? "Ej: 50" : `Último saldo registrado: ${inventoryTransferConfirmModal.lastKnownUnits}`} />
          </label>
        </div>
      </Modal>

      <Modal open={inventoryRestockModal.open} title={inventoryRestockModalTitle} confirmLabel="Surtir" cancelLabel="Cancelar" onClose={closeInventoryRestockModal} onConfirm={submitInventoryRestockModal}>
        <div className="inventory-restock-modal">
          <p className="subtle-line">Escribe solo las cantidades a sumar. Si una queda en 0, no se agrega nada a ese insumo.</p>
          <div className="inventory-restock-modal-list">
            {inventoryRestockModalItems.map((item) => (
              <label key={item.id} className="inventory-restock-row">
                <span className="inventory-restock-name">{item.name}</span>
                <input type="number" min="0" value={inventoryRestockModal.quantities[item.id] || ""} onChange={(event) => updateInventoryRestockQuantity(item.id, event.target.value)} placeholder="0" />
              </label>
            ))}
            {inventoryRestockModalItems.length ? null : <p className="subtle-line">No hay insumos disponibles para surtir.</p>}
          </div>
        </div>
      </Modal>

      <Modal open={inventoryTransferViewerState.open} title={inventoryTransferViewerTitle} confirmLabel="Cerrar" hideCancel onClose={() => setInventoryTransferViewerState({ open: false, itemId: null })}>
        <div className="inventory-transfer-view">
          <section className="surface-card inventory-transfer-view-card">
            <div className="card-header-row">
              <div>
                <h3>Saldos por destino</h3>
                <p>Resumen compacto de lo que sigue disponible en cada destino.</p>
              </div>
              <span className="chip primary">{viewedOrderInventoryTransferTargets.length}</span>
            </div>
            <div className="inventory-transfer-compact-list">
              {viewedOrderInventoryTransferTargets.map((target) => (
                <article key={`${target.itemId}-${target.destinationKey}`} className="inventory-transfer-compact-row">
                  <div className="inventory-transfer-compact-main">
                    <strong>{target.warehouse || target.storageLocation || "Destino sin nombre"}</strong>
                    {inventoryTransferViewerItem ? null : <p>{target.itemCode} · {target.itemName}</p>}
                    <p className="subtle-line">{target.storageLocation || "Sin punto de entrega"}{target.recipientName ? ` · ${target.recipientName}` : ""}</p>
                  </div>
                  <div className="inventory-transfer-compact-side">
                    <span className="chip">{target.availableUnits} {target.unitLabel || target.itemUnitLabel}</span>
                    <small>{target.updatedAt ? formatDateTime(target.updatedAt) : "Sin fecha"}</small>
                  </div>
                </article>
              ))}
              {!viewedOrderInventoryTransferTargets.length && <p className="subtle-line">Todavía no hay saldos por destino registrados para este filtro.</p>}
            </div>
          </section>

          <section className="surface-card inventory-transfer-view-card">
            <div className="card-header-row">
              <div>
                <h3>Movimientos recientes</h3>
                <p>Últimas transferencias registradas, sin detalle duplicado.</p>
              </div>
              <span className="chip">{Math.min(viewedOrderInventoryTransferMovements.length, 10)}</span>
            </div>
            <div className="inventory-transfer-compact-list">
              {viewedOrderInventoryTransferMovements.slice(0, 10).map((movement) => (
                <article key={movement.id} className="inventory-transfer-compact-row">
                  <div className="inventory-transfer-compact-main">
                    <strong>{movement.warehouse || movement.storageLocation || "Destino sin nombre"}</strong>
                    <p>{movement.quantity} {movement.unitLabel || "pzas"}{movement.recipientName ? ` · ${movement.recipientName}` : ""}</p>
                    <p className="subtle-line">{movement.storageLocation || "Sin punto de entrega"}{shouldShowTransferRemainingUnits(movement) ? ` · Antes quedaban ${movement.remainingUnits} ${movement.unitLabel || "pzas"}` : ""}</p>
                  </div>
                  <div className="inventory-transfer-compact-side">
                    <span className="chip">Saldo {movement.destinationBalanceUnits ?? movement.quantity}</span>
                    <small>{formatDateTime(movement.createdAt)}</small>
                  </div>
                </article>
              ))}
              {!viewedOrderInventoryTransferMovements.length && <p className="subtle-line">No hay transferencias registradas para este filtro.</p>}
            </div>
          </section>
        </div>
      </Modal>

      <Modal open={Boolean(deleteUserId)} title="Eliminar player" confirmLabel="Eliminar player" cancelLabel="Cancelar" onClose={() => setDeleteUserId(null)} onConfirm={() => deleteUser(deleteUserId)}>
        <p>Esta acción no se puede deshacer.</p>
        <p>Se perderá el acceso y los registros del player quedarán sin responsabilidad asignada.</p>
      </Modal>

      <Modal open={Boolean(deleteInventoryId)} title="Eliminar artículo" confirmLabel="Eliminar artículo" cancelLabel="Cancelar" onClose={() => setDeleteInventoryId(null)} onConfirm={() => deleteInventoryItem(deleteInventoryId)}>
        <p>Esta acción quitará el artículo del inventario compartido.</p>
        <p>La información dejará de estar disponible para todos los dispositivos conectados.</p>
      </Modal>

      <Modal open={Boolean(deleteBoardId)} title="Eliminar tablero" confirmLabel="Eliminar tablero" cancelLabel="Cancelar" onClose={() => setDeleteBoardId(null)} onConfirm={() => deleteControlBoard(deleteBoardId)}>
        <p>Esta acción eliminará el tablero completo junto con sus filas guardadas.</p>
        <p>Úsalo cuando el tablero ya no se vaya a ocupar para que no quede abandonado.</p>
      </Modal>

      <Modal open={Boolean(historyPauseActivityId)} title="Pausas de la actividad" confirmLabel="Aceptar" cancelLabel="Cerrar" onClose={() => setHistoryPauseActivityId(null)}>
        <div className="modal-form-grid">
          {historyPauseLogs.length ? historyPauseLogs.map((log) => (
            <div key={log.id} className="week-activity-item pause-item">
              <div>
                <strong>{log.pauseReason}</strong>
                <span>Pausado: {formatDateTime(log.pausedAt)}</span>
                <span>Reanudado: {formatDateTime(log.resumedAt)}</span>
              </div>
              <strong>{formatDurationClock(log.pauseDurationSeconds)}</strong>
            </div>
          )) : <p>No hay pausas registradas para esta actividad.</p>}
        </div>
      </Modal>
    </main>
  );
}

export default App;
