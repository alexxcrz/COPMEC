/* eslint-disable */
import {
  BarChart3, LayoutDashboard, ClipboardList, CalendarDays, Package,
  Users, PieChart, BookOpen, OctagonAlert,
} from "lucide-react";

export const STORAGE_KEY = "sicfla.almacen.state.v1";
export const SIDEBAR_COLLAPSED_KEY = "sicfla.almacen.sidebarCollapsed.v1";
export const ACTIVE_PAGE_KEY = "sicfla.almacen.activePage.v1";
export const DASHBOARD_SECTIONS_KEY = "sicfla.almacen.dashboardSections.v2";
export const NOTIFICATION_READ_KEY = "sicfla.almacen.notifications.read.v1";
export const NOTIFICATION_DELETED_KEY = "sicfla.almacen.notifications.deleted.v1";
export const NOTIFICATION_INBOX_KEY = "sicfla.almacen.notifications.inbox.v1";
export const EMPTY_OBJECT = Object.freeze({});
export const BOOTSTRAP_MASTER_ID = "bootstrap-master";
export const MASTER_USERNAME = "Maestro";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";
export const ENABLE_LEGACY_WHOLE_STATE_SYNC = false;
export const PAGE_BOARD = "index";
export const PAGE_CUSTOM_BOARDS = "customBoards";
export const PAGE_ADMIN = "admin";
export const PAGE_DASHBOARD = "dashboard";
export const PAGE_HISTORY = "history";
export const PAGE_INVENTORY = "inventory";
export const PAGE_USERS = "users";
export const PAGE_BIBLIOTECA = "biblioteca";
export const PAGE_INCIDENCIAS = "incidencias";
export const PAGE_NOT_FOUND = "404";

export const PAGE_ROUTE_SLUGS = {
  [PAGE_DASHBOARD]: "dashboard",
  [PAGE_CUSTOM_BOARDS]: "mis-tableros",
  [PAGE_BOARD]: "creador-de-tableros",
  [PAGE_ADMIN]: "creador-de-tableros",
  [PAGE_HISTORY]: "historial",
  [PAGE_INVENTORY]: "inventario",
  [PAGE_USERS]: "administrador",
  [PAGE_BIBLIOTECA]: "biblioteca",
  [PAGE_INCIDENCIAS]: "incidencias",
  [PAGE_NOT_FOUND]: "404",
};

export const PAGE_ROUTE_ALIASES = {
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
  biblioteca: PAGE_BIBLIOTECA,
  [PAGE_BIBLIOTECA]: PAGE_BIBLIOTECA,
  incidencias: PAGE_INCIDENCIAS,
  [PAGE_INCIDENCIAS]: PAGE_INCIDENCIAS,
  [PAGE_NOT_FOUND]: PAGE_NOT_FOUND,
};

export const EMPTY_LOGIN_DIRECTORY = {
  system: {
    masterBootstrapEnabled: false,
    masterUsername: null,
    showBootstrapMasterHint: false,
  },
  demoUsers: [],
};

export const ROLE_LEAD = "Lead";
export const ROLE_SR = "Senior (Sr)";
export const ROLE_SSR = "Semi-Senior (Ssr)";
export const ROLE_JR = "Junior (Jr)";

export const STATUS_PENDING = "Pendiente";
export const STATUS_RUNNING = "En curso";
export const STATUS_PAUSED = "Pausado";
export const STATUS_FINISHED = "Terminado";
export const INVENTORY_DOMAIN_BASE = "base";
export const INVENTORY_DOMAIN_CLEANING = "cleaning";
export const INVENTORY_DOMAIN_ORDERS = "orders";
export const INVENTORY_MOVEMENT_RESTOCK = "restock";
export const INVENTORY_MOVEMENT_CONSUME = "consume";
export const INVENTORY_MOVEMENT_TRANSFER = "transfer";

export const CONTROL_STATUS_OPTIONS = ["Pendiente", "En curso", "Completado", "Bloqueado"];
export const USER_ROLES = [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR];
export const PERMISSION_SCHEMA_VERSION = 2;
export const ROLE_LEVEL = {
  [ROLE_JR]: 1,
  [ROLE_SSR]: 2,
  [ROLE_SR]: 3,
  [ROLE_LEAD]: 4,
};
export const TEMPORARY_PASSWORD_MIN_LENGTH = 4;
export const PROFILE_SELF_EDIT_LIMIT = 1;
export const DEFAULT_AREA_OPTIONS = ["ESTO", "TRANSPORTE", "REGULATORIO", "CALIDAD", "INVENTARIO", "PEDIDOS", "RETAIL"];
export const DEFAULT_BOARD_SECTION_OPTIONS = [
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
export const INVENTORY_LOOKUP_LOGISTICS_FIELD = "inventoryLookupLogistics";
export const BOARD_ACTIVITY_LIST_FIELD = "activityList";
export const DEFAULT_JOB_TITLE_BY_ROLE = {
  [ROLE_LEAD]: "Encargado de área",
  [ROLE_SR]: "Supervisor senior",
  [ROLE_SSR]: "Coordinador de operación",
  [ROLE_JR]: "Player operativo",
};
export const DASHBOARD_CHART_PALETTE = ["#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];
export const DEFAULT_DASHBOARD_SECTION_STATE = {
  executive: false,
  people: false,
  trends: false,
  causes: false,
  alerts: false,
};
export const DEFAULT_ADMIN_TAB = "catalog";
export const ACTIVITY_FREQUENCY_OPTIONS = [
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
export const ACTIVITY_FREQUENCY_LABELS = Object.fromEntries(ACTIVITY_FREQUENCY_OPTIONS.map((item) => [item.value, item.label]));
export const ACTIVITY_FREQUENCY_DAY_OFFSETS = {
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


export const BOARD_FIELD_TYPES = [
  { value: "text", label: "Texto libre" },
  { value: "email", label: "Correo electrónico" },
  { value: "phone", label: "Teléfono" },
  { value: "url", label: "Enlace / URL" },
  { value: "number", label: "Número medible" },
  { value: "currency", label: "Monto ($)" },
  { value: "percentage", label: "Porcentaje (%)" },
  { value: "time", label: "Hora" },
  { value: "date", label: "Fecha" },
  { value: "textarea", label: "Notas" },
  { value: "boolean", label: "Sí / No" },
  { value: "select", label: "Menú desplegable" },
  { value: "rating", label: "Calificación (1-5 ★)" },
  { value: "progress", label: "Progreso (0-100%)" },
  { value: "counter", label: "Contador (clic +1)" },
  { value: "tags", label: "Etiquetas / Tags" },
  { value: "formula", label: "Fórmula" },
  { value: "inventoryLookup", label: "Buscador de inventario" },
  { value: INVENTORY_LOOKUP_LOGISTICS_FIELD, label: "Buscador de inventario + empaque" },
  { value: "inventoryProperty", label: "Dato derivado de inventario" },
  { value: BOARD_ACTIVITY_LIST_FIELD, label: "Lista de actividades" },
];

export const BOARD_FIELD_TYPE_DETAILS = {
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
  rating: "Calificación visual de 1 a 5 estrellas. Útil para evaluar calidad, prioridad o satisfacción.",
  progress: "Barra de avance del 0 al 100%. Útil para seguimiento de cumplimiento o llenado.",
  counter: "Contador incremental con botones + y −. Útil para conteos de piezas, rechazos o eventos.",
  tags: "Lista de etiquetas separadas por coma. Útil para categorías, lotes o marcadores múltiples.",
};

export const BOARD_FIELD_WIDTHS = [
  { value: "sm", label: "Compacto" },
  { value: "md", label: "Medio" },
  { value: "lg", label: "Amplio" },
];

export const COLOR_RULE_OPERATORS = [
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

export const BOARD_FIELD_WIDTH_STYLES = {
  sm: { minWidth: "120px" },
  md: { minWidth: "180px" },
  lg: { minWidth: "240px" },
};

export const BOARD_FIELD_MIN_WIDTH_BY_TYPE = {
  inventoryLookup: 210,
  inventoryLookupLogistics: 210,
  select: 190,
  user: 190,
  status: 150,
  time: 130,
  date: 140,
};

export const DEFAULT_BOARD_AUX_COLUMNS_ORDER = ["status", "time", "totalTime", "efficiency", "workflow", "assignee"];
export const BOARD_AUX_COLUMN_DEFINITIONS = {
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
  totalTime: {
    id: "totalTime",
    label: "Acumulado",
    sectionName: "Acumulado",
    sectionColor: "#f0f4ff",
    defaultWidth: 130,
    minWidth: 120,
  },
  efficiency: {
    id: "efficiency",
    label: "Eficiencia",
    sectionName: "Eficiencia",
    sectionColor: "#f0fdf4",
    defaultWidth: 120,
    minWidth: 100,
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
export const BOARD_AUX_COLUMN_IDS = Object.keys(BOARD_AUX_COLUMN_DEFINITIONS);

export const BOARD_TEMPLATES = [
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


export const FORMULA_OPERATIONS = [
  { value: "add", label: "Sumar" },
  { value: "subtract", label: "Restar" },
  { value: "multiply", label: "Multiplicar" },
  { value: "divide", label: "Dividir" },
  { value: "average", label: "Promedio" },
  { value: "min", label: "Mínimo" },
  { value: "max", label: "Máximo" },
  { value: "percent", label: "Porcentaje (A÷B×100)" },
];

export const OPTION_SOURCE_TYPES = [
  { value: "manual", label: "Opciones manuales" },
  { value: "users", label: "Players existentes" },
  { value: "inventory", label: "Inventario" },
  { value: "catalog", label: "Catálogo de actividades" },
  { value: "status", label: "Estados estándar" },
];

export const INVENTORY_PROPERTIES = [
  { value: "code", label: "Código" },
  { value: "name", label: "Nombre" },
  { value: "presentation", label: "Presentación" },
  { value: "piecesPerBox", label: "Piezas por caja" },
  { value: "boxesPerPallet", label: "Cajas por tarima" },
];

export const INVENTORY_IMPORT_FIELD_ALIASES = {
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

export const INVENTORY_DOMAIN_OPTIONS = [
  { value: INVENTORY_DOMAIN_BASE, label: "Base" },
  { value: INVENTORY_DOMAIN_CLEANING, label: "Insumos de limpieza" },
  { value: INVENTORY_DOMAIN_ORDERS, label: "Insumos para pedidos" },
];

export const INVENTORY_MOVEMENT_OPTIONS = [
  { value: INVENTORY_MOVEMENT_RESTOCK, label: "Entrada / reabasto" },
  { value: INVENTORY_MOVEMENT_CONSUME, label: "Consumo" },
  { value: INVENTORY_MOVEMENT_TRANSFER, label: "Transferencia" },
];

export const CLEANING_SITE_OPTIONS = [
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "C3", label: "C3 principal" },
];

export const DEFAULT_CLEANING_SITE = "C3";
export const BOARD_OPERATIONAL_CONTEXT_NONE = "none";
export const BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE = "cleaningSite";
export const BOARD_OPERATIONAL_CONTEXT_CUSTOM = "custom";
export const BOARD_OPERATIONAL_CONTEXT_OPTIONS = [
  { value: BOARD_OPERATIONAL_CONTEXT_NONE, label: "Sin contexto operativo" },
  { value: BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE, label: "Sede de limpieza C1/C2/C3" },
  { value: BOARD_OPERATIONAL_CONTEXT_CUSTOM, label: "Estación, nave u opciones manuales" },
];


export const NAV_ITEMS = [
  { id: PAGE_DASHBOARD,      label: "Dashboard",           icon: BarChart3,       group: "General",    roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_CUSTOM_BOARDS,  label: "Mis tableros",         icon: LayoutDashboard, group: "General",    roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_BOARD,          label: "Creador de tableros",  icon: ClipboardList,   group: "Producción", roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_HISTORY,        label: "Historial",            icon: CalendarDays,    group: "Producción", roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_INVENTORY,      label: "Inventario",           icon: Package,         group: "Producción", roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_BIBLIOTECA,    label: "Biblioteca",           icon: BookOpen,        group: "Recursos",   roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_INCIDENCIAS,   label: "Incidencias",          icon: OctagonAlert,    group: "Recursos",   roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_USERS,         label: "Players",              icon: Users,           group: "Equipo",     roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

export const ACTION_DEFINITIONS = [
  { id: "createWeek",              label: "Crear nueva semana",                     category: "Operación semanal",     defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createCatalog",          label: "Crear elementos de catálogo",             category: "Catálogo",              defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editCatalog",            label: "Editar elementos de catálogo",            category: "Catálogo",              defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteCatalog",          label: "Eliminar elementos de catálogo",          category: "Catálogo",              defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageWeeks",            label: "Editar semanas",                          category: "Administración",        defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "managePermissions",      label: "Editar permisos",                         category: "Permisos",              defaultRoles: [ROLE_LEAD] },
  { id: "createUsers",            label: "Crear nuevos players",                    category: "Players",               defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "editUsers",              label: "Editar players existentes",               category: "Players",               defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "deleteUsers",            label: "Eliminar players",                        category: "Players",               defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "resetPasswords",         label: "Restablecer contraseñas",                 category: "Players",               defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageInventory",        label: "Crear y editar inventario base",          category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteInventory",        label: "Eliminar artículos de inventario base",   category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importInventory",        label: "Importar inventario base",                category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewBaseInventory",      label: "Ver pestaña Productos (inventario base)", category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "manageCleaningInventory",label: "Crear y editar insumos de limpieza",      category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteCleaningInventory",label: "Eliminar insumos de limpieza",            category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importCleaningInventory",label: "Importar insumos de limpieza",            category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewCleaningInventory",  label: "Ver pestaña Insumos de limpieza",         category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "manageOrderInventory",   label: "Crear y editar insumos para pedidos",     category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteOrderInventory",   label: "Eliminar insumos para pedidos",           category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importOrderInventory",   label: "Importar insumos para pedidos",           category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewOrderInventory",     label: "Ver pestaña Insumos para pedidos",        category: "Inventario",            defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "createBoard",            label: "Crear nuevos tableros",                   category: "Creador de tableros",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editBoard",              label: "Editar tableros existentes",              category: "Creador de tableros",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBoard",            label: "Eliminar tableros",                       category: "Tableros creados",      defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveTemplate",           label: "Guardar plantillas",                      category: "Creador de tableros",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editTemplate",           label: "Editar plantillas",                       category: "Creador de tableros",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteTemplate",         label: "Eliminar plantillas",                     category: "Creador de tableros",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createBoardRow",         label: "Agregar filas en Mis tableros",           category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "editFinishedBoardRow",   label: "Editar filas terminadas",                 category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "boardWorkflow",          label: "Ejecutar flujo del tablero",              category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "duplicateBoard",         label: "Duplicar tablero vacío",                  category: "Tableros creados",      defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "duplicateBoardWithRows", label: "Duplicar tablero con filas",              category: "Tableros creados",      defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "exportBoardExcel",       label: "Exportar tablero a Excel",                category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "previewBoardPdf",        label: "Vista previa PDF",                        category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "exportBoardPdf",         label: "Exportar tablero a PDF",                  category: "Mis tableros",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "uploadBiblioteca",       label: "Subir archivos a Biblioteca",             category: "Biblioteca",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBiblioteca",       label: "Eliminar archivos de Biblioteca",         category: "Biblioteca",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createIncidencia",       label: "Registrar incidencias",                  category: "Incidencias",           defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "editIncidencia",         label: "Editar incidencias",                     category: "Incidencias",           defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteIncidencia",       label: "Eliminar incidencias",                   category: "Incidencias",           defaultRoles: [ROLE_LEAD, ROLE_SR] },
];

export const BOARD_PERMISSION_ACTION_IDS = new Set([
  "createBoardRow",
  "editFinishedBoardRow",
  "boardWorkflow",
  "exportBoardExcel",
  "previewBoardPdf",
  "exportBoardPdf",
]);

export const BOARD_PERMISSION_ACTIONS = ACTION_DEFINITIONS.filter((item) => BOARD_PERMISSION_ACTION_IDS.has(item.id));

export const PAGE_ACTION_GROUPS = {
  [PAGE_CUSTOM_BOARDS]: ["createBoardRow", "editFinishedBoardRow", "boardWorkflow", "exportBoardExcel", "previewBoardPdf", "exportBoardPdf"],
  [PAGE_DASHBOARD]: [],
  [PAGE_BOARD]: ["createCatalog", "editCatalog", "deleteCatalog", "createBoard", "editBoard", "saveTemplate", "editTemplate", "deleteTemplate", "duplicateBoard", "duplicateBoardWithRows", "deleteBoard"],
  [PAGE_ADMIN]: [],
  [PAGE_HISTORY]: [],
  [PAGE_INVENTORY]: ["viewBaseInventory", "manageInventory", "deleteInventory", "importInventory", "viewCleaningInventory", "manageCleaningInventory", "deleteCleaningInventory", "importCleaningInventory", "viewOrderInventory", "manageOrderInventory", "deleteOrderInventory", "importOrderInventory"],
  [PAGE_USERS]: ["createUsers", "editUsers", "deleteUsers", "resetPasswords", "managePermissions"],
  [PAGE_BIBLIOTECA]: ["uploadBiblioteca", "deleteBiblioteca"],
  [PAGE_INCIDENCIAS]: ["createIncidencia", "editIncidencia", "deleteIncidencia"],
};

export const PERMISSION_PRESETS = [
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

export const RESPONSIBLE_VISUALS = {
  edith: { accent: "#2dd4df", soft: "#1fb9c5", badge: "#1f9bb3" },
  alejandro: { accent: "#25b8c8", soft: "#1c99b8", badge: "#2d7fb8" },
  jesus: { accent: "#4ade80", soft: "#34c759", badge: "#34a853" },
  barbara: { accent: "#ffb020", soft: "#f59e0b", badge: "#d68f00" },
  anahi: { accent: "#ef4444", soft: "#dc2626", badge: "#cf3d3d" },
  default: { accent: "#60a5fa", soft: "#3b82f6", badge: "#4f8adf" },
};

// ROLE_PERMISSION_MATRIX: por defecto todos los roles tienen acceso a todas las pestañas.
// Los permisos reales se configuran manualmente en el panel de Permisos.
export const ALL_PAGES = [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_HISTORY, PAGE_INVENTORY, PAGE_USERS, PAGE_BIBLIOTECA, PAGE_INCIDENCIAS];
export const ALL_ACTION_IDS = ACTION_DEFINITIONS.map((item) => item.id);

export const ROLE_PERMISSION_MATRIX = {
  [ROLE_LEAD]: { pages: ALL_PAGES, actions: ALL_ACTION_IDS },
  [ROLE_SR]:   { pages: ALL_PAGES, actions: ALL_ACTION_IDS },
  [ROLE_SSR]:  { pages: ALL_PAGES, actions: ALL_ACTION_IDS },
  [ROLE_JR]:   { pages: ALL_PAGES, actions: ALL_ACTION_IDS },
};

export const KPI_STYLES = {
  cyan: { iconBg: "#53dde5", iconColor: "#178e94" },
  green: { iconBg: "#58d88d", iconColor: "#20894d" },
  red: { iconBg: "#ff5f5f", iconColor: "#bf2f2f" },
  lime: { iconBg: "#56d97a", iconColor: "#238343" },
  amber: { iconBg: "#ffbf47", iconColor: "#b87800" },
  slate: { iconBg: "#eef1f7", iconColor: "#8a94a6" },
};

