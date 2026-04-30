import {
  BarChart3, LayoutDashboard, ClipboardList, CalendarDays, Package,
  Users, PieChart, BookOpen, OctagonAlert, ClipboardCheck,
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
export const PAGE_PROCESS_AUDITS = "processAudits";
export const PAGE_INVENTORY = "inventory";
export const PAGE_USERS = "users";
export const PAGE_BIBLIOTECA = "biblioteca";
export const PAGE_INCIDENCIAS = "incidencias";
export const PAGE_SYSTEM_SETTINGS = "systemSettings";
export const PAGE_NOT_FOUND = "404";

export const PAGE_ROUTE_SLUGS = {
  [PAGE_DASHBOARD]: "dashboard",
  [PAGE_CUSTOM_BOARDS]: "mis-tableros",
  [PAGE_BOARD]: "creador-de-tableros",
  [PAGE_ADMIN]: "creador-de-tableros",
  [PAGE_HISTORY]: "historial",
  [PAGE_PROCESS_AUDITS]: "auditorias-procesos",
  [PAGE_INVENTORY]: "inventario",
  [PAGE_USERS]: "administrador",
  [PAGE_BIBLIOTECA]: "biblioteca",
  [PAGE_INCIDENCIAS]: "incidencias",
  [PAGE_SYSTEM_SETTINGS]: "configuracion-sistema",
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
  "auditorias-procesos": PAGE_PROCESS_AUDITS,
  [PAGE_PROCESS_AUDITS]: PAGE_PROCESS_AUDITS,
  inventario: PAGE_INVENTORY,
  [PAGE_INVENTORY]: PAGE_INVENTORY,
  administrador: PAGE_USERS,
  [PAGE_USERS]: PAGE_USERS,
  biblioteca: PAGE_BIBLIOTECA,
  [PAGE_BIBLIOTECA]: PAGE_BIBLIOTECA,
  incidencias: PAGE_INCIDENCIAS,
  [PAGE_INCIDENCIAS]: PAGE_INCIDENCIAS,
  "configuracion-sistema": PAGE_SYSTEM_SETTINGS,
  [PAGE_SYSTEM_SETTINGS]: PAGE_SYSTEM_SETTINGS,
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
export const DEFAULT_AREA_OPTIONS = ["ESTO", "TRANSPORTE", "REGULATORIO", "CALIDAD", "INVENTARIO", "PEDIDOS", "RETAIL", "LIMPIEZA"];
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
  // Texto y contacto
  { value: "text", label: "Texto corto" },
  { value: "textarea", label: "Notas / Texto largo" },
  { value: "email", label: "Correo electrónico" },
  { value: "phone", label: "Teléfono" },
  { value: "url", label: "Enlace / URL" },
  { value: "location", label: "Ubicación" },
  // Números y cálculo
  { value: "number", label: "Número" },
  { value: "currency", label: "Monto ($)" },
  { value: "percentage", label: "Porcentaje (%)" },
  { value: "weight", label: "Peso (kg)" },
  { value: "temperature", label: "Temperatura (°C)" },
  { value: "duration", label: "Duración (hh:mm)" },
  { value: "formula", label: "Fórmula / Cálculo" },
  // Fecha y tiempo
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
  { value: "timeline", label: "Rango de fechas" },
  // Estado y control
  { value: "boolean", label: "Sí / No" },
  { value: "priority", label: "Prioridad" },
  { value: "rating", label: "Calificación (★)" },
  { value: "progress", label: "Progreso (0-100%)" },
  { value: "counter", label: "Contador (clic +1)" },
  { value: "score", label: "Puntuación (1-10)" },
  { value: "color_tag", label: "Etiqueta de color" },
  // Selección
  { value: "select", label: "Menú desplegable" },
  { value: "multiSelectDetail", label: "Selección múltiple + detalle" },
  { value: "tags", label: "Etiquetas múltiples" },
  { value: "evidenceGallery", label: "Evidencias (foto/video)" },
  // Inventario
  { value: "inventoryLookup", label: "Buscador de inventario" },
  { value: INVENTORY_LOOKUP_LOGISTICS_FIELD, label: "Buscador + empaque" },
  { value: "inventoryProperty", label: "Dato derivado de inventario" },
  // Actividades
  { value: BOARD_ACTIVITY_LIST_FIELD, label: "Lista de actividades" },
];

export const BOARD_FIELD_TYPE_DETAILS = {
  text: "Captura texto corto como SKU, folio o nombre interno.",
  textarea: "Observaciones largas, instrucciones o comentarios multilínea.",
  email: "Guarda correos electrónicos con validación de formato.",
  phone: "Captura números telefónicos para contacto operativo.",
  url: "Guarda enlaces de referencia, evidencias o documentos.",
  location: "Registra una dirección, nave, zona o ubicación física.",
  number: "Guarda cantidades, cajas, piezas, pesos o métricas.",
  currency: "Registra montos monetarios para costos, gastos o ventas.",
  percentage: "Captura porcentajes como avance, merma o cumplimiento.",
  weight: "Captura el peso en kilogramos para logística o calidad.",
  temperature: "Registra temperatura en °C para control de cadena de frío.",
  duration: "Captura duraciones en hh:mm para tiempos de operación o proceso.",
  time: "Registra horas específicas dentro de la operación.",
  date: "Guarda fechas clave como entrega, turno o corte.",
  timeline: "Define un rango de fechas con inicio y fin para proyectos o turnos.",
  boolean: "Marca algo como Sí o No en un clic.",
  priority: "Asigna prioridad visual: Crítica, Alta, Media o Baja. Útil para triage.",
  rating: "Calificación visual de 1 a 5 estrellas. Útil para calidad o satisfacción.",
  progress: "Barra de avance del 0 al 100%. Útil para seguimiento de cumplimiento.",
  counter: "Contador incremental con botones + y −. Útil para conteos o rechazos.",
  score: "Puntuación numérica del 1 al 10. Útil para auditorías o evaluaciones.",
  color_tag: "Etiqueta de color libre para clasificación rápida o categorización visual.",
  select: "Muestra un menú desplegable con opciones manuales o de otro catálogo.",
  multiSelectDetail: "Permite marcar una o varias opciones y capturar un dato adicional por cada selección.",
  tags: "Lista de etiquetas separadas por coma. Útil para categorías o marcadores.",
  evidenceGallery: "Sube fotos o videos dentro de la celda con miniaturas y vista previa navegable.",
  formula: "Calcula un resultado automático usando otros campos del tablero.",
  inventoryLookup: "Busca un artículo del inventario y lo vincula a la fila.",
  [INVENTORY_LOOKUP_LOGISTICS_FIELD]: "Duplica el buscador de inventario y agrega piezas por caja y cajas por tarima como campos editables.",
  inventoryProperty: "Trae un dato automático del inventario ya vinculado.",
  [BOARD_ACTIVITY_LIST_FIELD]: "Toma una lista de actividades y genera una fila por cada actividad dentro del tablero.",
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
  multiSelectDetail: 240,
  evidenceGallery: 240,
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
    id: "revision-tarimas",
    name: "Revisión de tarimas",
    category: "Revisión",
    description: "Plantilla para revisión de tarimas con datos jalados desde inventario y control de conteo.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Proceso",
      operationalContextOptions: ["Revisión"],
      operationalContextValue: "Revisión",
    },
    columns: [
      { templateKey: "fechaRevisionTarima", label: "Fecha revisión", type: "date", required: true, width: "sm", groupName: "Control", groupColor: "#ede9fe", helpText: "Fecha en la que se realizó la revisión de la tarima." },
      { templateKey: "tarimaRevision", label: "Tarima", type: "text", required: true, width: "sm", groupName: "Control", groupColor: "#ede9fe", helpText: "Identificador de la tarima revisada." },
      { templateKey: "colaboradorRevisionTarima", label: "Colaborador", type: "user", width: "md", groupName: "Control", groupColor: "#ede9fe", helpText: "Persona responsable de la revisión." },
      { templateKey: "estacionRevision", label: "Estación", type: "text", width: "sm", groupName: "Control", groupColor: "#ede9fe", helpText: "Estación o mesa donde se ejecutó la revisión." },
      { templateKey: "productoRevisionTarima", label: "Producto", type: "inventoryLookup", required: true, width: "lg", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Producto seleccionado desde inventario." },
      { label: "Nombre", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "name", width: "lg", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Nombre del producto tomado del inventario." },
      { label: "Presentación", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "presentation", width: "md", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Presentación tomada del inventario." },
      { templateKey: "clasificacionRevision", label: "Clasificación", type: "select", optionSource: "manual", options: ["Buen estado", "Merma", "Cuarentena", "Pendiente"], width: "sm", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Clasificación resultante del producto revisado." },
      { label: "Lote", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "lot", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Lote tomado del inventario." },
      { label: "Caducidad", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "expiry", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Caducidad tomada del inventario." },
      { label: "Etiqueta", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "label", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Etiqueta tomada del inventario." },
      { templateKey: "laboratorioRevision", label: "Laboratorio", type: "text", width: "md", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Laboratorio o marca del producto revisado." },
      { templateKey: "cajasRevisadasRevision", label: "Cajas revisadas", type: "number", defaultValue: 0, width: "sm", groupName: "Conteo", groupColor: "#fef3c7", helpText: "Cantidad de cajas revisadas." },
      { templateKey: "piezasPorCajaRevision", label: "Piezas por caja", type: "inventoryProperty", sourceFieldId: "productoRevisionTarima", inventoryProperty: "piecesPerBox", width: "sm", groupName: "Conteo", groupColor: "#fef3c7", helpText: "Piezas por caja tomadas del inventario." },
      { label: "Total piezas esperadas", type: "formula", formulaLeftFieldId: "cajasRevisadasRevision", formulaOperation: "multiply", formulaRightFieldId: "piezasPorCajaRevision", width: "sm", groupName: "Conteo", groupColor: "#fef3c7", helpText: "Calcula el total esperado según cajas revisadas y piezas por caja." },
      { templateKey: "horaInicioRevisionTarima", label: "Hora inicio", type: "time", width: "sm", groupName: "Tiempo", groupColor: "#fee2e2", helpText: "Hora de arranque de la revisión." },
      { templateKey: "piezasContadasRevision", label: "Piezas contadas", type: "number", defaultValue: 0, width: "sm", groupName: "Conteo", groupColor: "#fef3c7", helpText: "Total de piezas contadas físicamente." },
      { templateKey: "piezasBuenasRevision", label: "Piezas buen estado", type: "number", defaultValue: 0, width: "sm", groupName: "Resultado", groupColor: "#dcfce7", helpText: "Piezas que se mantienen en buen estado." },
      { templateKey: "causalesRevisionTarima", label: "Causales", type: "multiSelectDetail", optionSource: "manual", options: ["Lote borroso", "Sin etiqueta", "Lote doble", "Sello roto/incompleto", "Bote dañado", "Lote diferente"], width: "lg", groupName: "Resultado", groupColor: "#fee2e2", placeholder: "Cantidad o detalle", helpText: "Selecciona una o varias causales y captura un dato adicional por cada una." },
      { templateKey: "evidenciasRevisionTarima", label: "Evidencias", type: "evidenceGallery", width: "lg", groupName: "Resultado", groupColor: "#dcfce7", helpText: "Adjunta fotos o videos en miniatura dentro de la celda." },
      { templateKey: "piezasMermaRevision", label: "Piezas merma", type: "number", defaultValue: 0, width: "sm", groupName: "Resultado", groupColor: "#fee2e2", helpText: "Piezas identificadas como merma." },
      { templateKey: "horaFinRevisionTarima", label: "Hora fin", type: "time", width: "sm", groupName: "Tiempo", groupColor: "#fee2e2", helpText: "Hora de término de la revisión." },
      { templateKey: "tiempoTotalRevisionTarima", label: "Tiempo total", type: "duration", width: "sm", groupName: "Tiempo", groupColor: "#fee2e2", helpText: "Duración total invertida en la revisión." },
      { templateKey: "motivoPausaRevisionTarima", label: "Motivo de pausa", type: "textarea", width: "lg", groupName: "Tiempo", groupColor: "#fee2e2", helpText: "Motivo de las pausas durante la revisión." },
      { templateKey: "tiempoPausaRevisionTarima", label: "Tiempo de pausa", type: "duration", width: "sm", groupName: "Tiempo", groupColor: "#fee2e2", helpText: "Tiempo acumulado de pausa." },
      { templateKey: "observacionesRevisionTarima", label: "Observaciones", type: "textarea", width: "lg", groupName: "Resultado", groupColor: "#dcfce7", helpText: "Observaciones generales de la revisión." },
    ],
  },
  {
    id: "revision-causales",
    name: "Revisión de merma y causales",
    category: "Revisión",
    description: "Plantilla para capturar piezas buenas, merma y causales detectadas durante la revisión.",
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      operationalContextType: "custom",
      operationalContextLabel: "Proceso",
      operationalContextOptions: ["Revisión"],
      operationalContextValue: "Revisión",
    },
    columns: [
      { templateKey: "fechaRevisionCausal", label: "Fecha revisión", type: "date", required: true, width: "sm", groupName: "Control", groupColor: "#ede9fe", helpText: "Fecha de captura de la revisión." },
      { templateKey: "tarimaRevisionCausal", label: "Tarima", type: "text", required: true, width: "sm", groupName: "Control", groupColor: "#ede9fe", helpText: "Tarima asociada a la revisión." },
      { templateKey: "colaboradorRevisionCausal", label: "Colaborador", type: "user", width: "md", groupName: "Control", groupColor: "#ede9fe", helpText: "Persona que ejecutó la validación." },
      { templateKey: "productoRevisionCausal", label: "Producto", type: "inventoryLookup", required: true, width: "lg", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Producto revisado desde inventario." },
      { label: "Nombre", type: "inventoryProperty", sourceFieldId: "productoRevisionCausal", inventoryProperty: "name", width: "lg", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Nombre tomado del inventario." },
      { label: "Presentación", type: "inventoryProperty", sourceFieldId: "productoRevisionCausal", inventoryProperty: "presentation", width: "md", groupName: "Producto", groupColor: "#e0f2fe", helpText: "Presentación tomada del inventario." },
      { label: "Lote", type: "inventoryProperty", sourceFieldId: "productoRevisionCausal", inventoryProperty: "lot", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Lote tomado del inventario." },
      { label: "Caducidad", type: "inventoryProperty", sourceFieldId: "productoRevisionCausal", inventoryProperty: "expiry", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Caducidad tomada del inventario." },
      { label: "Etiqueta", type: "inventoryProperty", sourceFieldId: "productoRevisionCausal", inventoryProperty: "label", width: "sm", groupName: "Trazabilidad", groupColor: "#dcfce7", helpText: "Etiqueta tomada del inventario." },
      { templateKey: "piezasBuenasCausal", label: "Piezas buen estado", type: "number", defaultValue: 0, width: "sm", groupName: "Resultado", groupColor: "#dcfce7", helpText: "Piezas sin daño detectado." },
      { templateKey: "piezasMermaCausal", label: "Piezas merma", type: "number", defaultValue: 0, width: "sm", groupName: "Resultado", groupColor: "#fee2e2", helpText: "Piezas que pasan a merma." },
      { templateKey: "loteCadNoLegible", label: "Lote/Cad. no legible", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas con lote o caducidad ilegible." },
      { templateKey: "loteDoble", label: "Lote doble", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas con doble lote." },
      { templateKey: "sinEtiqueta", label: "Sin etiqueta", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas que llegaron sin etiqueta." },
      { templateKey: "selloRotoIncompleto", label: "Sello roto/incompleto", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas con sello roto o incompleto." },
      { templateKey: "boteDanado", label: "Bote dañado", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas con bote o empaque dañado." },
      { templateKey: "loteDiferente", label: "Lote diferente", type: "number", defaultValue: 0, width: "sm", groupName: "Causales", groupColor: "#fee2e2", helpText: "Piezas con lote distinto al esperado." },
      { templateKey: "horaInicioRevisionCausal", label: "Hora inicio", type: "time", width: "sm", groupName: "Tiempo", groupColor: "#fef3c7", helpText: "Hora de arranque de la revisión." },
      { templateKey: "horaFinRevisionCausal", label: "Hora fin", type: "time", width: "sm", groupName: "Tiempo", groupColor: "#fef3c7", helpText: "Hora de cierre de la revisión." },
      { templateKey: "tiempoTotalRevisionCausal", label: "Tiempo total", type: "duration", width: "sm", groupName: "Tiempo", groupColor: "#fef3c7", helpText: "Duración total de la revisión." },
      { templateKey: "motivoPausaRevisionCausal", label: "Motivo de pausa", type: "textarea", width: "lg", groupName: "Tiempo", groupColor: "#fef3c7", helpText: "Motivo de pausas durante la revisión." },
      { templateKey: "tiempoPausaRevisionCausal", label: "Tiempo de pausa", type: "duration", width: "sm", groupName: "Tiempo", groupColor: "#fef3c7", helpText: "Tiempo acumulado de pausa." },
      { templateKey: "observacionesRevisionCausal", label: "Observaciones", type: "textarea", width: "lg", groupName: "Resultado", groupColor: "#dcfce7", helpText: "Comentarios y hallazgos finales." },
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
  { value: "lot", label: "Lote" },
  { value: "expiry", label: "Caducidad" },
  { value: "label", label: "Etiqueta" },
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
  { value: "C3", label: "C3" },
  { value: "P", label: "P" },
];

export const DEFAULT_CLEANING_SITE = "C3";
export const BOARD_OPERATIONAL_CONTEXT_NONE = "none";
export const BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE = "cleaningSite";
export const BOARD_OPERATIONAL_CONTEXT_CUSTOM = "custom";
export const BOARD_OPERATIONAL_CONTEXT_OPTIONS = [
  { value: BOARD_OPERATIONAL_CONTEXT_NONE, label: "Sin contexto operativo" },
  { value: BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE, label: "Sede de limpieza C1/C2/C3/P" },
  { value: BOARD_OPERATIONAL_CONTEXT_CUSTOM, label: "Estación, nave u opciones manuales" },
];

export const NAV_ITEMS = [
  { id: PAGE_DASHBOARD,      label: "Dashboard",           icon: BarChart3,       group: "General",    roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_CUSTOM_BOARDS,  label: "Mis tableros",        icon: LayoutDashboard, group: "General",    roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_BOARD,          label: "Creador de tableros", icon: ClipboardList,   group: "Producción", roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_HISTORY,        label: "Historial",           icon: CalendarDays,    group: "Producción", roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_PROCESS_AUDITS, label: "Auditorías",          icon: ClipboardCheck,  group: "Producción", roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_INVENTORY,      label: "Inventario",          icon: Package,         group: "Producción", roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_BIBLIOTECA,     label: "Biblioteca",          icon: BookOpen,        group: "Recursos",   roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_INCIDENCIAS,    label: "Incidencias",         icon: OctagonAlert,    group: "Recursos",   roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_SYSTEM_SETTINGS,label: "Configuración",       icon: PieChart,        group: "Recursos",   roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_USERS,          label: "Players",             icon: Users,           group: "Equipo",     roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

export const ACTION_DEFINITIONS = [
  { id: "createWeek",              label: "Crear nueva semana",                      category: "Operación semanal",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteWeek",              label: "Borrar semanas",                           category: "Operación semanal",   defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createCatalog",           label: "Crear elementos de catálogo",              category: "Catálogo",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editCatalog",             label: "Editar elementos de catálogo",             category: "Catálogo",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteCatalog",           label: "Eliminar elementos de catálogo",           category: "Catálogo",            defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageWeeks",             label: "Editar semanas",                           category: "Administración",      defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "managePermissions",       label: "Editar permisos",                          category: "Permisos",            defaultRoles: [ROLE_LEAD] },
  { id: "createUsers",             label: "Crear nuevos players",                     category: "Players",             defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "editUsers",               label: "Editar players existentes",                category: "Players",             defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "deleteUsers",             label: "Eliminar players",                         category: "Players",             defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "resetPasswords",          label: "Restablecer contraseñas",                  category: "Players",             defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageInventory",         label: "Crear y editar inventario base",           category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteInventory",         label: "Eliminar artículos de inventario base",    category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importInventory",         label: "Importar inventario base",                 category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewBaseInventory",       label: "Ver pestaña Productos (inventario base)",  category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "manageCleaningInventory", label: "Crear y editar insumos de limpieza",       category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteCleaningInventory", label: "Eliminar insumos de limpieza",             category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importCleaningInventory", label: "Importar insumos de limpieza",             category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewCleaningInventory",   label: "Ver pestaña Insumos de limpieza",          category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "manageOrderInventory",    label: "Crear y editar insumos para pedidos",      category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteOrderInventory",    label: "Eliminar insumos para pedidos",            category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importOrderInventory",    label: "Importar insumos para pedidos",            category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewOrderInventory",      label: "Ver pestaña Insumos para pedidos",         category: "Inventario",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "createBoard",             label: "Crear nuevos tableros",                    category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editBoard",               label: "Editar tableros existentes",               category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBoard",             label: "Eliminar tableros",                        category: "Tableros creados",    defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveTemplate",            label: "Guardar plantillas",                       category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editTemplate",            label: "Editar plantillas",                        category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteTemplate",          label: "Eliminar plantillas",                      category: "Creador de tableros", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createBoardRow",          label: "Agregar filas en Mis tableros",            category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "deleteBoardRow",          label: "Eliminar filas en Mis tableros",           category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editFinishedBoardRow",    label: "Editar filas terminadas",                  category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "boardWorkflow",           label: "Ejecutar flujo del tablero",               category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "duplicateBoard",          label: "Duplicar tablero vacío",                   category: "Tableros creados",    defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "duplicateBoardWithRows",  label: "Duplicar tablero con filas",               category: "Tableros creados",    defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "exportBoardExcel",        label: "Exportar tablero a Excel",                 category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "previewBoardPdf",         label: "Vista previa PDF",                         category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "exportBoardPdf",          label: "Exportar tablero a PDF",                   category: "Mis tableros",        defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "uploadBiblioteca",        label: "Subir archivos a Biblioteca",              category: "Biblioteca",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBiblioteca",        label: "Eliminar archivos de Biblioteca",          category: "Biblioteca",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createIncidencia",        label: "Registrar incidencias",                    category: "Incidencias",         defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "editIncidencia",          label: "Editar incidencias",                       category: "Incidencias",         defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteIncidencia",        label: "Eliminar incidencias",                     category: "Incidencias",         defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewProcessAudits",       label: "Ver auditorías de procesos",               category: "Auditorías",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "manageProcessAudits",     label: "Gestionar auditorías de procesos",         category: "Auditorías",          defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "manageProcessAuditTemplates", label: "Gestionar plantillas de auditoría",    category: "Auditorías",          defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageSystemSettings",    label: "Configurar parámetros globales del sistema", category: "Configuración",      defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteWeekActivity",      label: "Eliminar actividades de semana",            category: "Operación semanal",   defaultRoles: [ROLE_LEAD] },
];

export const BOARD_PERMISSION_ACTION_IDS = new Set([
  "createBoardRow",
  "deleteBoardRow",
  "editFinishedBoardRow",
  "boardWorkflow",
  "exportBoardExcel",
  "previewBoardPdf",
  "exportBoardPdf",
]);

export const BOARD_PERMISSION_ACTIONS = ACTION_DEFINITIONS.filter((item) => BOARD_PERMISSION_ACTION_IDS.has(item.id));

export const PAGE_ACTION_GROUPS = {
  [PAGE_CUSTOM_BOARDS]: ["createBoardRow", "deleteBoardRow", "editFinishedBoardRow", "boardWorkflow", "exportBoardExcel", "previewBoardPdf", "exportBoardPdf"],
  [PAGE_DASHBOARD]: [],
  [PAGE_BOARD]: ["createCatalog", "editCatalog", "deleteCatalog", "createBoard", "editBoard", "saveTemplate", "editTemplate", "deleteTemplate", "duplicateBoard", "duplicateBoardWithRows", "deleteBoard", "deleteWeekActivity"],
  [PAGE_ADMIN]: [],
  [PAGE_HISTORY]: [],
  [PAGE_PROCESS_AUDITS]: ["viewProcessAudits", "manageProcessAudits", "manageProcessAuditTemplates"],
  [PAGE_INVENTORY]: ["viewBaseInventory", "manageInventory", "deleteInventory", "importInventory", "viewCleaningInventory", "manageCleaningInventory", "deleteCleaningInventory", "importCleaningInventory", "viewOrderInventory", "manageOrderInventory", "deleteOrderInventory", "importOrderInventory"],
  [PAGE_USERS]: ["createUsers", "editUsers", "deleteUsers", "resetPasswords", "managePermissions"],
  [PAGE_BIBLIOTECA]: ["uploadBiblioteca", "deleteBiblioteca"],
  [PAGE_INCIDENCIAS]: ["createIncidencia", "editIncidencia", "deleteIncidencia"],
  [PAGE_SYSTEM_SETTINGS]: ["manageSystemSettings"],
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

export const ALL_PAGES = [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_HISTORY, PAGE_PROCESS_AUDITS, PAGE_INVENTORY, PAGE_USERS, PAGE_BIBLIOTECA, PAGE_INCIDENCIAS, PAGE_SYSTEM_SETTINGS];
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
