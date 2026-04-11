import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
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
  X,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { Modal } from "./components/Modal";
import copmecLogo from "./assets/copmec-logo.jpeg";
import "./App.css";

const STORAGE_KEY = "sicfla.almacen.state.v1";
const SIDEBAR_COLLAPSED_KEY = "sicfla.almacen.sidebarCollapsed.v1";
const DASHBOARD_SECTIONS_KEY = "sicfla.almacen.dashboardSections.v1";
const BOOTSTRAP_MASTER_ID = "bootstrap-master";
const MASTER_USERNAME = "Maestro";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000/api`;
const PAGE_BOARD = "index";
const PAGE_CUSTOM_BOARDS = "customBoards";
const PAGE_ADMIN = "admin";
const PAGE_DASHBOARD = "dashboard";
const PAGE_HISTORY = "history";
const PAGE_INVENTORY = "inventory";
const PAGE_USERS = "users";
const PAGE_NOT_FOUND = "404";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";
const ROLE_SSR = "Semi-Senior (Ssr)";
const ROLE_JR = "Junior (Jr)";

const STATUS_PENDING = "Pendiente";
const STATUS_RUNNING = "En curso";
const STATUS_PAUSED = "Pausado";
const STATUS_FINISHED = "Terminado";

const CONTROL_STATUS_OPTIONS = ["Pendiente", "En curso", "Completado", "Bloqueado"];
const USER_ROLES = [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR];
const PERMISSION_SCHEMA_VERSION = 2;
const ROLE_LEVEL = {
  [ROLE_JR]: 1,
  [ROLE_SSR]: 2,
  [ROLE_SR]: 3,
  [ROLE_LEAD]: 4,
};
const PROFILE_SELF_EDIT_LIMIT = 1;
const DEFAULT_AREA_OPTIONS = ["ESTO", "TRANSPORTE", "REGULATORIO", "CALIDAD", "INVENTARIO", "PEDIDOS", "RETAIL"];
const INVENTORY_LOOKUP_LOGISTICS_FIELD = "inventoryLookupLogistics";
const DEFAULT_JOB_TITLE_BY_ROLE = {
  [ROLE_LEAD]: "Encargado de área",
  [ROLE_SR]: "Supervisor senior",
  [ROLE_SSR]: "Coordinador de operación",
  [ROLE_JR]: "Asociado operativo",
};
const DASHBOARD_CHART_PALETTE = ["#0ea5e9", "#14b8a6", "#84cc16", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];
const DEFAULT_DASHBOARD_SECTION_STATE = {
  executive: true,
  people: true,
  trends: false,
  causes: false,
  alerts: false,
};

const BOARD_FIELD_TYPES = [
  { value: "text", label: "Texto libre" },
  { value: "number", label: "Número medible" },
  { value: "inventoryLookup", label: "Buscador de inventario" },
  { value: INVENTORY_LOOKUP_LOGISTICS_FIELD, label: "Buscador de inventario + empaque" },
  { value: "inventoryProperty", label: "Dato derivado de inventario" },
  { value: "select", label: "Menú desplegable" },
  { value: "formula", label: "Fórmula" },
  { value: "user", label: "Asociado" },
  { value: "status", label: "Estado" },
  { value: "date", label: "Fecha" },
  { value: "textarea", label: "Notas" },
  { value: "boolean", label: "Sí / No" },
];

const BOARD_FIELD_TYPE_DETAILS = {
  text: "Captura texto corto como SKU, folio o nombre interno.",
  number: "Guarda cantidades, cajas, piezas, pesos o métricas.",
  inventoryLookup: "Busca un artículo del inventario y lo vincula a la fila.",
  [INVENTORY_LOOKUP_LOGISTICS_FIELD]: "Duplica el buscador de inventario y agrega piezas por caja y cajas por tarima como campos editables.",
  inventoryProperty: "Trae un dato automático del inventario ya vinculado.",
  select: "Muestra una lista rápida de opciones para elegir.",
  formula: "Calcula un resultado con otros campos del tablero.",
  user: "Asigna un asociado sin escribirlo manualmente.",
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

const BOARD_TEMPLATES = [
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
    description: "Da seguimiento a lotes, asociados, cantidades y estatus de operación.",
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
  { value: "users", label: "Asociados existentes" },
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
};

const NAV_ITEMS = [
  { id: PAGE_DASHBOARD, label: "Dashboard", icon: BarChart3, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_CUSTOM_BOARDS, label: "Mis tableros", icon: LayoutDashboard, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: PAGE_BOARD, label: "Tableros creados", icon: ClipboardList, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: PAGE_ADMIN, label: "Constructor", icon: Settings, roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_HISTORY, label: "Historial", icon: CalendarDays, roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_INVENTORY, label: "Inventario", icon: Package, roles: [ROLE_LEAD, ROLE_SR] },
  { id: PAGE_USERS, label: "Administrador", icon: Users, roles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

const ACTION_DEFINITIONS = [
  { id: "createWeek", label: "Crear nueva semana", category: "Operación semanal", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageCatalog", label: "Crear y editar catálogo", category: "Administración", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageWeeks", label: "Editar semanas", category: "Administración", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "viewReports", label: "Ver reportes avanzados", category: "Dashboard", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "managePermissions", label: "Editar permisos", category: "Permisos", defaultRoles: [ROLE_LEAD] },
  { id: "manageUsers", label: "Crear y editar asociados", category: "Asociados", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "deleteUsers", label: "Eliminar asociados", category: "Asociados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "resetPasswords", label: "Restablecer contraseñas", category: "Asociados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "manageInventory", label: "Crear y editar inventario", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "importInventory", label: "Importar inventario", category: "Inventario", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveBoard", label: "Crear y editar tableros", category: "Constructor", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteBoard", label: "Eliminar tableros", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "saveTemplate", label: "Guardar plantillas", category: "Constructor", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "editTemplate", label: "Editar plantillas", category: "Constructor", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "deleteTemplate", label: "Eliminar plantillas", category: "Constructor", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "createBoardRow", label: "Agregar filas en Mis tableros", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "editFinishedBoardRow", label: "Editar filas terminadas", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "boardWorkflow", label: "Ejecutar flujo del tablero", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR] },
  { id: "duplicateBoard", label: "Duplicar tablero vacío", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "duplicateBoardWithRows", label: "Duplicar tablero con filas", category: "Tableros creados", defaultRoles: [ROLE_LEAD, ROLE_SR] },
  { id: "exportBoardExcel", label: "Exportar tablero a Excel", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "previewBoardPdf", label: "Vista previa PDF", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
  { id: "exportBoardPdf", label: "Exportar tablero a PDF", category: "Mis tableros", defaultRoles: [ROLE_LEAD, ROLE_SR, ROLE_SSR] },
];

const BOARD_PERMISSION_ACTION_IDS = [
  "createBoardRow",
  "editFinishedBoardRow",
  "boardWorkflow",
  "exportBoardExcel",
  "previewBoardPdf",
  "exportBoardPdf",
];

const BOARD_PERMISSION_ACTIONS = ACTION_DEFINITIONS.filter((item) => BOARD_PERMISSION_ACTION_IDS.includes(item.id));

const PAGE_ACTION_GROUPS = {
  [PAGE_CUSTOM_BOARDS]: ["createBoardRow", "editFinishedBoardRow", "boardWorkflow", "exportBoardExcel", "previewBoardPdf", "exportBoardPdf"],
  [PAGE_DASHBOARD]: ["viewReports"],
  [PAGE_BOARD]: ["duplicateBoard", "duplicateBoardWithRows", "deleteBoard"],
  [PAGE_ADMIN]: ["manageCatalog", "manageWeeks", "saveBoard", "saveTemplate", "editTemplate", "deleteTemplate"],
  [PAGE_HISTORY]: [],
  [PAGE_INVENTORY]: ["manageInventory", "importInventory"],
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
    pages: [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_ADMIN, PAGE_HISTORY, PAGE_INVENTORY, PAGE_USERS],
    actions: ACTION_DEFINITIONS.map((item) => item.id),
  },
  [ROLE_SR]: {
    pages: [PAGE_DASHBOARD, PAGE_CUSTOM_BOARDS, PAGE_BOARD, PAGE_ADMIN, PAGE_HISTORY, PAGE_INVENTORY, PAGE_USERS],
    actions: [
      "createWeek",
      "manageCatalog",
      "manageWeeks",
      "viewReports",
      "manageUsers",
      "deleteUsers",
      "resetPasswords",
      "manageInventory",
      "importInventory",
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
      "viewReports",
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
  const pageValues = Object.values(override.pages || {});
  const actionValues = Object.values(override.actions || {});
  return pageValues.concat(actionValues).some((value) => typeof value === "boolean");
}

function remapPermissionsModel(permissions, users = []) {
  const defaults = buildDefaultPermissions();
  const knownUserIds = new Set((users || []).map((user) => user.id));
  const userById = new Map((users || []).map((user) => [user.id, user]));
  const nextOverrides = Object.fromEntries(Object.entries(permissions?.userOverrides || {})
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
    userOverrides: Object.fromEntries(Object.entries(permissions?.userOverrides || {}).map(([userId, override]) => [
      userId,
      {
        pages: Object.fromEntries(NAV_ITEMS.map((item) => [item.id, typeof override?.pages?.[item.id] === "boolean" ? override.pages[item.id] : null])),
        actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, typeof override?.actions?.[item.id] === "boolean" ? override.actions[item.id] : null])),
      },
    ])),
  };
}

function buildBoardPermissions(basePermissions, board = null) {
  const visibilityUserIds = Array.from(new Set([board?.ownerId, ...(board?.accessUserIds || [])].filter(Boolean)));
  return {
    isEnabled: false,
    visibility: {
      roles: [],
      userIds: visibilityUserIds,
      departments: [],
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
    permissions.pages[PAGE_ADMIN].roles = [ROLE_LEAD];
    permissions.pages[PAGE_USERS].roles = [ROLE_LEAD, ROLE_SR];
    permissions.pages[PAGE_INVENTORY].roles = [ROLE_LEAD, ROLE_SR];

    permissions.actions.manageCatalog.roles = [ROLE_LEAD];
    permissions.actions.manageWeeks.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.manageUsers.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.deleteUsers.roles = [ROLE_LEAD];
    permissions.actions.resetPasswords.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.manageInventory.roles = [ROLE_LEAD, ROLE_SR];
    permissions.actions.importInventory.roles = [ROLE_LEAD];
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
    permissions.pages[PAGE_ADMIN].roles = [ROLE_LEAD];
    permissions.pages[PAGE_USERS].roles = [ROLE_LEAD];
    permissions.pages[PAGE_INVENTORY].roles = [ROLE_LEAD, ROLE_SR];

    Object.keys(permissions.actions).forEach((actionId) => {
      permissions.actions[actionId].roles = [];
    });

    permissions.actions.viewReports.roles = [ROLE_LEAD, ROLE_SR, ROLE_SSR];
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
      ...(options.headers || {}),
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

function createWarehouseEventSource() {
  return new EventSource(`${API_BASE_URL}/warehouse/events`, { withCredentials: true });
}

function buildLoginDirectoryFromState(state) {
  return {
    system: {
      masterBootstrapEnabled: Boolean(state?.system?.masterBootstrapEnabled),
      masterUsername: state?.system?.masterUsername || MASTER_USERNAME,
    },
    demoUsers: (state?.users || [])
      .filter((user) => user.isActive)
      .map((user) => ({ id: user.id, email: user.email, role: user.role, name: user.name })),
  };
}

function isoAt(date, hours, minutes) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
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

function getIshikawaCategory(label) {
  const normalized = normalizeKey(label);
  if (["responsable", "operador", "personal", "capacitacion", "ausencia", "turno"].some((term) => normalized.includes(term))) return "Personas";
  if (["inventario", "material", "faltante", "insumo", "producto", "merma"].some((term) => normalized.includes(term))) return "Materiales";
  if (["sistema", "scanner", "escaner", "equipo", "red", "impresora", "software", "maquina"].some((term) => normalized.includes(term))) return "Maquinaria / Sistema";
  if (["espacio", "energia", "clima", "anden", "trafico", "limpieza", "layout"].some((term) => normalized.includes(term))) return "Entorno";
  if (["captura", "conteo", "documento", "dato", "medicion", "folio"].some((term) => normalized.includes(term))) return "Medición";
  return "Proceso";
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

function normalizeKey(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeImportHeader(value) {
  return normalizeKey(value).replace(/[^a-z0-9]/g, "");
}

function isEmptyRuleValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function parseComparableNumber(value) {
  if (isEmptyRuleValue(value)) return null;
  const parsed = Number(String(value).replace(/,/g, "."));
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

function formatInventoryLookupLabel(item) {
  if (!item) return "";
  return `${item.name} · ${item.presentation}`;
}

function isInventoryLookupFieldType(type) {
  return ["inventoryLookup", INVENTORY_LOOKUP_LOGISTICS_FIELD].includes(type);
}

function getInventoryBundleEditableFields(fields, lookupFieldId) {
  return (fields || []).filter((field) => field.bundleParentId === lookupFieldId && field.bundleType === INVENTORY_LOOKUP_LOGISTICS_FIELD);
}

function inferInventoryBundleFieldType(fields, column) {
  if (!column || column.type !== "inventoryLookup") return column?.type || "text";
  const editableFields = getInventoryBundleEditableFields(fields, column.id);
  const editableRoles = new Set(editableFields.map((field) => field.bundleRole));
  if (editableRoles.has("piecesPerBox") && editableRoles.has("boxesPerPallet")) {
    return INVENTORY_LOOKUP_LOGISTICS_FIELD;
  }
  return column.type || "text";
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
    accessUserIds: [],
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true },
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
    accessUserIds: [...(board?.accessUserIds || [])],
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      ...(board?.settings || {}),
    },
    columns: cloneDraftColumns(board?.fields || []),
    ...createEmptyFieldDraft(),
  };
}

function getPreviewFieldSeedValue(field, currentUserId, sampleInventory, variant = 0) {
  if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== "") {
    if (field.type === "number") return Number(field.defaultValue || 0);
    if (field.type === "boolean") return String(field.defaultValue).toLowerCase() === "si" ? "Si" : field.defaultValue;
    return field.defaultValue;
  }

  if (field.type === "number") return variant === 0 ? 12 : 18;
  if (field.type === "select") return field.options?.[variant] || field.options?.[0] || "Opción";
  if (isInventoryLookupFieldType(field.type)) return sampleInventory?.id || "preview-inventory";
  if (field.type === "status") return variant === 0 ? STATUS_PENDING : STATUS_RUNNING;
  if (field.type === "date") {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + variant);
    return nextDate.toISOString().slice(0, 10);
  }
  if (field.type === "boolean") return variant === 0 ? "Si" : "No";
  if (field.type === "user") return currentUserId || "";
  if (field.type === "textarea") return variant === 0 ? (field.placeholder || "Notas rápidas de ejemplo") : "Seguimiento validado en vista previa";
  if (field.type === "text") return variant === 0 ? (field.placeholder || field.label || "Dato") : `${field.label || "Dato"} 2`;
  return field.placeholder || field.label || "Dato";
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
    const lookupId = values[field.sourceFieldId];
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
    accessUserIds: [...(baseBoard?.accessUserIds || [])],
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      ...(baseBoard?.settings || {}),
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

function formatBoardPreviewValue(value, field, userMap, inventoryItems) {
  if (isInventoryLookupFieldType(field.type)) {
    const inventoryItem = (inventoryItems || []).find((item) => item.id === value);
    return inventoryItem ? `${inventoryItem.name} · ${inventoryItem.presentation}` : "Producto vinculado";
  }
  if (field.type === "user") {
    return userMap.get(value)?.name || "Asociado";
  }
  if (field.type === "date" && value) {
    return formatDate(value);
  }
  if (field.type === "boolean") {
    return value === "Si" ? "Sí" : "No";
  }
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
  if (fieldType === "number") return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
  if (fieldType === "boolean") return value === "Si" || value === "No";
  if (fieldType === "formula") return value !== null && value !== undefined;
  return String(value ?? "").trim() !== "";
}

function getBoardSectionGroups(board) {
  const groups = [];
  let current = null;

  (board?.fields || []).forEach((field) => {
    const name = field.groupName || "General";
    const color = field.groupColor || "#e2f4ec";
    if (!current || current.name !== name) {
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
    fieldType: inferInventoryBundleFieldType(columns, column),
    optionSource: column.optionSource || "manual",
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
    isRequired: column.required ? "true" : "false",
    groupName: column.groupName || "General",
    groupColor: column.groupColor || "#e2f4ec",
  };
}

function getBoardFieldDefaultValue(field, currentUserId) {
  if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== "") {
    if (field.type === "number") return Number(field.defaultValue || 0);
    if (field.type === "boolean") return String(field.defaultValue).toLowerCase() === "si" ? "Si" : field.defaultValue;
    return field.defaultValue;
  }

  if (field.type === "status") return STATUS_PENDING;
  if (field.type === "user") return currentUserId || "";
  if (field.type === "boolean") return "No";
  if (field.type === "date") return new Date().toISOString().slice(0, 10);
  return "";
}

function toInventoryNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value || "")
    .trim()
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
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

function sanitizeImportedText(value) {
  if (typeof value !== "string") return value;

  if (/Ã.|Â.|â./.test(value)) {
    try {
      const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0));
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return value;
    }
  }

  return value;
}

function mapInventoryImportRow(row, index) {
  const normalizedRow = Object.entries(row || {}).reduce((accumulator, [key, value]) => {
    const alias = INVENTORY_IMPORT_FIELD_ALIASES[normalizeImportHeader(key)];
    if (alias) accumulator[alias] = sanitizeImportedText(value);
    return accumulator;
  }, {});

  const code = String(normalizedRow.code || "").trim();
  const name = String(normalizedRow.name || "").trim();

  if (!code || !name) return null;

  return {
    id: `import-${index + 1}`,
    code,
    name,
    presentation: String(normalizedRow.presentation || "").trim(),
    piecesPerBox: toInventoryNumber(normalizedRow.piecesPerBox),
    boxesPerPallet: toInventoryNumber(normalizedRow.boxesPerPallet),
  };
}

async function parseInventoryImportFile(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const isCsv = /\.csv$/i.test(file.name);
  const workbook = isCsv
    ? XLSX.read(decodeCsvBuffer(buffer), { type: "string", raw: false })
    : XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("No se encontró ninguna hoja en el archivo.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row, index) => mapInventoryImportRow(row, index))
    .filter(Boolean);
}

async function downloadInventoryTemplateFile() {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet([
    {
      codigo: "ALM-001",
      nombre: "Detergente industrial",
      presentacion: "Bidon 20L",
      piezas_por_caja: 4,
      cajas_por_tarima: 30,
    },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
  XLSX.writeFile(workbook, "plantilla-inventario.xlsx");
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
  return {
    open: false,
    mode: "create",
    id: null,
    name: "",
    email: "",
    role: ROLE_JR,
    area: "",
    jobTitle: "",
    isActive: "true",
    password: "",
    managerId: "",
    permissionPageId: "",
    permissionOverrides: { pages: {}, actions: {} },
    ...overrides,
    permissionOverrides: {
      pages: { ...(overrides.permissionOverrides?.pages || {}) },
      actions: { ...(overrides.permissionOverrides?.actions || {}) },
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
  return {
    ...user,
    role,
    area,
    department: area,
    jobTitle: String(user.jobTitle ?? DEFAULT_JOB_TITLE_BY_ROLE[role] ?? "").trim(),
    password: String(user.password || ""),
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
  if ((board.accessUserIds || []).includes(user.id)) return true;
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
  if (row.status !== STATUS_FINISHED) return true;
  return canDoAction(user, "editFinishedBoardRow", permissions);
}

function canOperateBoardRowRecord(user, board, row, permissions) {
  return canEditBoardRowRecord(user, board, row, permissions, "boardWorkflow");
}

function buildSelectOptions(field, state) {
  if (field.optionSource === "users") {
    return state.users.filter((user) => user.isActive).map((user) => user.name);
  }
  if (field.optionSource === "inventory") {
    return (state.inventoryItems || []).map((item) => item.name);
  }
  if (field.optionSource === "catalog") {
    return state.catalog.filter((item) => !item.isDeleted).map((item) => item.name);
  }
  if (field.optionSource === "status") {
    return [STATUS_PENDING, STATUS_RUNNING, STATUS_PAUSED, STATUS_FINISHED];
  }
  return field.options || [];
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
      name: "Demo Asociado",
      email: "demo@copmec.local",
      area: "INVENTARIO",
      department: "INVENTARIO",
      jobTitle: "Asociado operativo",
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
    { id: "cat-piso", name: "Piso producción", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
    { id: "cat-banos", name: "Lavado de baños", timeLimitMinutes: 40, isMandatory: true, isDeleted: false },
    { id: "cat-inspeccion", name: "Inspección nave", timeLimitMinutes: 75, isMandatory: true, isDeleted: false },
    { id: "cat-oficinas", name: "Limpieza oficinas", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
    { id: "cat-comedor", name: "Comedor", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
    { id: "cat-vidrios", name: "Limpieza vidrios", timeLimitMinutes: 50, isMandatory: false, isDeleted: false },
    { id: "cat-rampas", name: "Revisión de rampas", timeLimitMinutes: 35, isMandatory: false, isDeleted: false },
  ];

  const inventoryItems = [
    { id: "inv-1", code: "ALM-001", name: "Detergente industrial", presentation: "Bidón 20L", piecesPerBox: 4, boxesPerPallet: 30 },
    { id: "inv-2", code: "ALM-002", name: "Papel higiénico", presentation: "Paquete 12 rollos", piecesPerBox: 6, boxesPerPallet: 24 },
    { id: "inv-3", code: "ALM-003", name: "Guantes nitrilo", presentation: "Caja 100 piezas", piecesPerBox: 10, boxesPerPallet: 18 },
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
    activities: starterWorkspace?.activities || activities,
    pauseLogs: starterWorkspace?.pauseLogs || pauseLogs,
    controlRows: starterWorkspace?.controlRows || controlRows,
    controlBoards: starterWorkspace?.controlBoards || controlBoards,
    boardTemplates: [],
    permissions: buildDefaultPermissions(),
    auditLog: [],
  };
}

function normalizeWarehouseState(parsed) {
  if (!parsed) return buildSampleState();
  const sampleState = buildSampleState();
  const shouldHydrateDemoWorkspace = !Array.isArray(parsed.users) || parsed.users.length === 0;
  const sourceUsers = shouldHydrateDemoWorkspace ? sampleState.users : parsed.users;
  const users = sourceUsers.map((user) => normalizeUserRecord(user, user.managerId ?? parsed.currentUserId ?? null));
  const normalizedPermissions = normalizePermissions(remapPermissionsModel(parsed.permissions, users));
  return {
    ...parsed,
    system: {
      masterBootstrapEnabled: parsed.system?.masterBootstrapEnabled ?? !hasLeadUser(users),
      masterUsername: MASTER_USERNAME,
    },
    users,
    areaCatalog: buildAreaCatalog(users, parsed.areaCatalog),
    weeks: shouldHydrateDemoWorkspace && (!Array.isArray(parsed.weeks) || parsed.weeks.length === 0) ? sampleState.weeks : parsed.weeks,
    catalog: Array.isArray(parsed.catalog) && parsed.catalog.length ? parsed.catalog : sampleState.catalog,
    activities: shouldHydrateDemoWorkspace && (!Array.isArray(parsed.activities) || parsed.activities.length === 0) ? sampleState.activities : parsed.activities,
    pauseLogs: shouldHydrateDemoWorkspace && !Array.isArray(parsed.pauseLogs) ? sampleState.pauseLogs : parsed.pauseLogs,
    controlRows: shouldHydrateDemoWorkspace && (!Array.isArray(parsed.controlRows) || parsed.controlRows.length === 0) ? sampleState.controlRows : parsed.controlRows,
    controlBoards: Array.isArray(parsed.controlBoards)
      ? parsed.controlBoards.map((board) => {
          const normalizedBoard = {
            ...board,
            createdById: board.createdById ?? users[0]?.id ?? null,
            ownerId: board.ownerId ?? board.createdById ?? users[0]?.id ?? null,
            accessUserIds: Array.isArray(board.accessUserIds) ? board.accessUserIds : [],
          };
          return {
            ...normalizedBoard,
            permissions: normalizeBoardPermissions(board.permissions, normalizedPermissions, normalizedBoard),
          };
        })
      : sampleState.controlBoards,
    inventoryItems: Array.isArray(parsed.inventoryItems) && parsed.inventoryItems.length ? parsed.inventoryItems : sampleState.inventoryItems,
    boardTemplates: Array.isArray(parsed.boardTemplates) ? parsed.boardTemplates : [],
    permissions: normalizedPermissions,
    auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
  };
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
  const baseDate = new Date();
  let assigneeIndex = 0;

  return catalog
    .filter((item) => !item.isDeleted)
    .map((item, index) => {
      const responsible = activeUsers[assigneeIndex % activeUsers.length] || users[0] || null;
      assigneeIndex += 1;
      return {
        id: makeId("act"),
        weekId,
        catalogActivityId: item.id,
        responsibleId: responsible?.id || null,
        status: STATUS_PENDING,
        activityDate: isoAt(addDays(baseDate, index), 8, 0),
        startTime: null,
        endTime: null,
        accumulatedSeconds: 0,
        lastResumedAt: null,
        customName: item.name,
      };
    });
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
    settings: { showWorkflow: true, showMetrics: true, showAssignee: true, showDates: true, ...(sampleBoardTemplate?.settings || {}) },
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

function ProgressBar({ value, max, label }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const exceeded = value > max;
  return (
    <div className="progress-row">
      <div className="progress-row-head">
        <span>{label}</span>
        <strong className={exceeded ? "danger-text" : ""}>{formatMinutes(value)} / {formatMinutes(max)}</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${exceeded ? "danger" : ""}`} style={{ width: `${Math.max(8, percent)}%` }} />
      </div>
    </div>
  );
}

function DashboardKpiCard({ title, value, subtitle, tone, icon: Icon }) {
  const palette = KPI_STYLES[tone] || KPI_STYLES.cyan;
  return (
    <article className="dashboard-kpi-card">
      <div className="dashboard-kpi-head">
        <span>{title}</span>
        <div className="dashboard-kpi-icon" style={{ backgroundColor: palette.iconBg, color: palette.iconColor }}>
          <Icon size={18} strokeWidth={2.1} />
        </div>
      </div>
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
      <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-pareto-chart" role="img" aria-label="Gráfica de Pareto de incidencias e impacto">
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
      const viewportSpaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenAbove = viewportSpaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: shouldOpenAbove ? Math.max(12, rect.top - estimatedHeight - 4) : rect.bottom + 4,
      });
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
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
    window.setTimeout(() => inputRef.current?.focus(), 0);
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
          {!disabled ? (
            <button type="button" className="inventory-lookup-clear" onClick={clearSelection} aria-label="Quitar producto seleccionado" title="Quitar producto seleccionado">
              <X size={12} />
            </button>
          ) : null}
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
          onBlur={() => window.setTimeout(resolveQuery, 120)}
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
              <span>Usuario o correo</span>
              <input value={loginForm.email} onChange={(event) => onChange("email", event.target.value)} placeholder="Maestro o usuario@copmec.local" />
            </label>
            <label className="app-modal-field login-field">
              <span>Contraseña</span>
              <input type="password" value={loginForm.password} onChange={(event) => onChange("password", event.target.value)} placeholder="Contraseña" />
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
                    onChange("email", user.email);
                  }}>
                    {user.role} · {user.email}
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
            <h2>Alta inicial de asociado líder</h2>
            <p>Primer acceso principal</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="app-modal-field login-field">
              <span>Nombre del Lead</span>
              <input value={setupForm.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Nombre completo" />
            </label>
            <label className="app-modal-field login-field">
              <span>Correo del Lead</span>
              <input value={setupForm.email} onChange={(event) => onChange("email", event.target.value)} placeholder="lead@copmec.local" />
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
            <button type="submit" className="primary-button login-submit-button">Crear asociado líder y cerrar maestro</button>
          </form>
        </article>
      </section>
    </main>
  );
}

function BoardComponentStudioModal({ open, mode, draft, onChange, onClose, onConfirm, catalog, inventoryItems, visibleUsers }) {
  const studioSteps = [
    { title: "Tipo", subtitle: "Qué componente necesitas" },
    { title: "Base", subtitle: "Nombre y estructura" },
    { title: "Reglas", subtitle: "Automatización y color" },
    { title: "Resumen", subtitle: "Revisión final" },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const selectedType = draft.fieldType;
  const selectedTypeOption = BOARD_FIELD_TYPES.find((type) => type.value === selectedType);
  const showOptionSource = selectedType === "select";
  const showInventoryProperty = selectedType === "inventoryProperty";
  const showFormulaFields = selectedType === "formula";
  const showColorRules = selectedType !== "formula";
  const isInventoryBundleType = selectedType === INVENTORY_LOOKUP_LOGISTICS_FIELD;
  const autoGeneratedFieldLabels = selectedType === INVENTORY_LOOKUP_LOGISTICS_FIELD
    ? ["Piezas por caja", "Cajas por tarima"]
    : [];
  const selectedTypeUsage = selectedType === INVENTORY_LOOKUP_LOGISTICS_FIELD
    ? "Sirve cuando quieres usar el mismo buscador de inventario de siempre, pero dejando dos columnas extra editables para piezas por caja y cajas por tarima."
    : getBoardFieldTypeDescription(selectedType);
  const colorOperatorNeedsValue = !["isEmpty", "isNotEmpty", "isTrue", "isFalse"].includes(draft.colorOperator);
  const colorValueUsesBooleanSelect = selectedType === "boolean" && ["equals", "notEquals"].includes(draft.colorOperator);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open, mode]);

  const isLastStep = currentStep === studioSteps.length - 1;

  function handleStepConfirm() {
    if (!isLastStep) {
      setCurrentStep((step) => Math.min(step + 1, studioSteps.length - 1));
      return;
    }
    onConfirm();
  }

  let colorValuePlaceholder = "Ej: Alta, 20, Crítico";
  let colorValueHelp = "Cuando la celda llegue a este valor, se aplicará el color.";

  if (["contains", "notContains", "startsWith", "endsWith"].includes(draft.colorOperator)) {
    colorValuePlaceholder = "Ej: Crítico, Urgente, LIB";
    colorValueHelp = "Usa una palabra o fragmento de texto para activar el color.";
  } else if (["inList", "notInList"].includes(draft.colorOperator)) {
    colorValuePlaceholder = "Ej: Alta, Media, Crítica";
    colorValueHelp = "Escribe varios valores separados por coma para comparar contra una lista.";
  } else if ([">", ">=", "<", "<="].includes(draft.colorOperator)) {
    colorValuePlaceholder = "Ej: 20, 3.5 o 2026-04-10";
    colorValueHelp = "Funciona con números y también con fechas comparables.";
  } else if (draft.colorOperator === "notEquals") {
    colorValuePlaceholder = "Ej: Rechazado, No, 0";
    colorValueHelp = "El color se activa cuando el valor sea distinto al capturado aquí.";
  } else if (!colorOperatorNeedsValue) {
    colorValueHelp = "Esta condición se activa sola; no necesitas capturar un valor adicional.";
  }

  return (
    <Modal
      open={open}
      className="component-studio-modal"
      title={mode === "edit" ? "Editar componente" : "Studio de Componentes"}
      confirmLabel={isLastStep ? (mode === "edit" ? "Guardar cambios" : "Agregar componente") : "Siguiente"}
      cancelLabel="Cerrar"
      onClose={onClose}
      onConfirm={handleStepConfirm}
      footerActions={currentStep > 0 ? (
        <>
          <div className="component-studio-footer-progress">Paso {currentStep + 1} de {studioSteps.length}</div>
          <button type="button" className="sicfla-button ghost" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}>Anterior</button>
        </>
      ) : <div className="component-studio-footer-progress">Paso 1 de {studioSteps.length}</div>}
    >
      <div className="component-studio-shell">
        <div className="component-studio-intro">
          <span className="chip primary">{mode === "edit" ? "Edición guiada" : "Diseño guiado"}</span>
          <p>{mode === "edit" ? "Actualiza este componente sin perder orden ni claridad en el tablero." : "Ahora el alta va por pasos para que primero elijas qué necesitas y después configures solo lo importante."}</p>
          <div className="saved-board-list">
            <span className="chip">Catálogo: {catalog.filter((item) => !item.isDeleted).length}</span>
            <span className="chip">Inventario: {(inventoryItems || []).length}</span>
              <span className="chip">Asociados: {visibleUsers.filter((item) => item.isActive).length}</span>
          </div>
        </div>

        <div className="component-studio-stepper">
          {studioSteps.map((step, index) => (
            <button key={step.title} type="button" className={index === currentStep ? "component-studio-step active" : index < currentStep ? "component-studio-step complete" : "component-studio-step"} onClick={() => setCurrentStep(index)}>
              <span className="component-studio-step-number">{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.subtitle}</small>
              </span>
            </button>
          ))}
        </div>

        {currentStep === 0 ? (
          <>
            <section className="component-studio-section">
              <div className="component-studio-section-head">
                <h4>1. Tipo de componente</h4>
                <p>Elige qué tipo de dato capturará o calculará esta celda.</p>
              </div>
              <div className="component-type-grid">
                {BOARD_FIELD_TYPES.map((type) => (
                  <button key={type.value} type="button" className={draft.fieldType === type.value ? "component-type-card active" : "component-type-card"} onClick={() => onChange((current) => ({ ...current, fieldType: type.value }))}>
                    <strong>{type.label}</strong>
                    <span>{getBoardFieldTypeDescription(type.value)}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="component-studio-section component-studio-spotlight">
              <div>
                <span className="chip primary">Para qué sirve</span>
                <strong>{selectedTypeOption?.label || "Componente"}</strong>
                <p>{selectedTypeUsage}</p>
              </div>
              {autoGeneratedFieldLabels.length ? (
                <div className="component-studio-summary-list">
                  <strong>Se agregan en automático</strong>
                  <div className="saved-board-list">
                    {autoGeneratedFieldLabels.map((label) => <span key={label} className="chip">{label}</span>)}
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {currentStep === 1 ? (
          <section className="component-studio-section component-studio-config-grid">
            <div className="component-studio-section-head component-studio-field-span-2">
              <div>
                <h4>2. Datos base</h4>
                <p>Define el nombre, la sección y la ayuda visual del componente.</p>
              </div>
            </div>
            <label className="app-modal-field">
              <span>Sección</span>
              <input value={draft.groupName} onChange={(event) => onChange((current) => ({ ...current, groupName: event.target.value }))} placeholder="Ej: Identificación, Validación, Cierre" />
              <small className="builder-help-text">Agrupa componentes relacionados para mantener el tablero ordenado.</small>
            </label>
            <label className="app-modal-field">
              <span>Color de sección</span>
              <input type="color" value={draft.groupColor} onChange={(event) => onChange((current) => ({ ...current, groupColor: event.target.value }))} />
              <small className="builder-help-text">Color visual rápido para identificar este bloque de columnas.</small>
            </label>
            <label className="app-modal-field component-studio-field-span-2">
              <span>Nombre visible</span>
              <input value={draft.fieldLabel} onChange={(event) => onChange((current) => ({ ...current, fieldLabel: event.target.value }))} placeholder="Ej: SKU, Piezas surtidas, Fecha de corte" />
              <small className="builder-help-text">Es el nombre que verá el equipo en la cabecera del tablero.</small>
            </label>
            <label className="app-modal-field component-studio-field-span-2">
              <span>Ayuda corta</span>
              <input value={draft.fieldHelp} onChange={(event) => onChange((current) => ({ ...current, fieldHelp: event.target.value }))} placeholder="Ej: Selecciona el producto para autollenar datos" />
              <small className="builder-help-text">Sirve para explicar rápido qué debe capturarse aquí.</small>
            </label>
            <label className="app-modal-field component-studio-field-span-2">
              <span>Placeholder</span>
              <input value={draft.placeholder} onChange={(event) => onChange((current) => ({ ...current, placeholder: event.target.value }))} placeholder="Ej: Escribe el folio o el comentario" />
              <small className="builder-help-text">Texto guía dentro de la celda antes de capturar algo.</small>
            </label>
            <label className="app-modal-field">
              <span>Valor inicial</span>
              <input value={draft.defaultValue} onChange={(event) => onChange((current) => ({ ...current, defaultValue: event.target.value }))} placeholder="Ej: Pendiente, 0, No o una fecha" />
              <small className="builder-help-text">Se coloca automáticamente cuando se crea una fila nueva.</small>
            </label>
            <label className="app-modal-field">
              <span>Ancho</span>
              <select value={draft.fieldWidth} onChange={(event) => onChange((current) => ({ ...current, fieldWidth: event.target.value }))}>
                {BOARD_FIELD_WIDTHS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <small className="builder-help-text">Controla cuánto espacio visual ocupará la columna.</small>
            </label>
            <label className="app-modal-field">
              <span>Campo obligatorio</span>
              <select value={draft.isRequired} onChange={(event) => onChange((current) => ({ ...current, isRequired: event.target.value }))}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
              <small className="builder-help-text">Marca la columna como clave para la operación.</small>
            </label>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <div className="component-studio-logic-stack">
            {isInventoryBundleType ? (
              <section className="component-studio-section component-studio-spotlight">
                <div>
                  <span className="chip primary">Bundle automático</span>
                  <strong>Buscador con empaque editable</strong>
                  <p>Al guardar, este componente crea el buscador principal y dos columnas numéricas editables para piezas por caja y cajas por tarima.</p>
                </div>
                <div className="saved-board-list">
                  <span className="chip">Buscador de inventario</span>
                  <span className="chip">Piezas por caja</span>
                  <span className="chip">Cajas por tarima</span>
                </div>
              </section>
            ) : null}

            {showOptionSource ? (
              <section className="component-studio-section three-columns component-studio-short-grid">
                <label className="app-modal-field">
                  <span>Fuente de menú</span>
                  <select value={draft.optionSource} onChange={(event) => onChange((current) => ({ ...current, optionSource: event.target.value }))}>
                    {OPTION_SOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <small className="builder-help-text">Define de dónde saldrán las opciones que verá el usuario.</small>
                </label>
                <label className="app-modal-field">
                  <span>Opciones manuales</span>
                  <input value={draft.optionsText} onChange={(event) => onChange((current) => ({ ...current, optionsText: event.target.value }))} placeholder="Ej: Alta, Media, Baja" />
                  <small className="builder-help-text">Escribe opciones separadas por coma si no vienen de otro catálogo.</small>
                </label>
              </section>
            ) : null}

            {showInventoryProperty ? (
              <section className="component-studio-section three-columns component-studio-short-grid">
                <label className="app-modal-field">
                  <span>Campo origen</span>
                  <select value={draft.sourceFieldId} onChange={(event) => onChange((current) => ({ ...current, sourceFieldId: event.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {draft.columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
                  </select>
                  <small className="builder-help-text">Elige el buscador de inventario del que se tomará la información.</small>
                </label>
                <label className="app-modal-field">
                  <span>Dato de inventario</span>
                  <select value={draft.inventoryProperty} onChange={(event) => onChange((current) => ({ ...current, inventoryProperty: event.target.value }))}>
                    {INVENTORY_PROPERTIES.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
                  </select>
                  <small className="builder-help-text">Trae automáticamente código, nombre, presentación o conversiones.</small>
                </label>
                <div className="component-rule-hint compact-surface-card">
                  <strong>Atajo visual</strong>
                  <p>Estos selectores cortos quedan alineados en una sola fila para capturar más rápido.</p>
                </div>
              </section>
            ) : null}

            {showFormulaFields ? (
              <section className="component-studio-section three-columns">
                <label className="app-modal-field">
                  <span>Operando izquierdo</span>
                  <select value={draft.formulaLeftFieldId} onChange={(event) => onChange((current) => ({ ...current, formulaLeftFieldId: event.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {draft.columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
                  </select>
                  <small className="builder-help-text">Primer valor que participa en la operación.</small>
                </label>
                <label className="app-modal-field">
                  <span>Operación</span>
                  <select value={draft.formulaOperation} onChange={(event) => onChange((current) => ({ ...current, formulaOperation: event.target.value }))}>
                    {FORMULA_OPERATIONS.map((operation) => <option key={operation.value} value={operation.value}>{operation.label}</option>)}
                  </select>
                  <small className="builder-help-text">Define cómo se calculará el resultado final.</small>
                </label>
                <label className="app-modal-field">
                  <span>Operando derecho</span>
                  <select value={draft.formulaRightFieldId} onChange={(event) => onChange((current) => ({ ...current, formulaRightFieldId: event.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {draft.columns.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
                  </select>
                  <small className="builder-help-text">Segundo valor que completa la fórmula.</small>
                </label>
              </section>
            ) : null}

            {showColorRules ? (
              <section className={`component-studio-section ${colorOperatorNeedsValue ? "three-columns" : "color-rule-two-columns"}`}>
                <label className="app-modal-field">
                  <span>Condición de color</span>
                  <select value={draft.colorOperator} onChange={(event) => onChange((current) => ({ ...current, colorOperator: event.target.value }))}>
                    {COLOR_RULE_OPERATORS.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
                  </select>
                  <small className="builder-help-text">Se usa para pintar la celda cuando cumpla una regla.</small>
                </label>
                {colorOperatorNeedsValue ? (
                  <label className="app-modal-field">
                    <span>Valor de comparación</span>
                    {colorValueUsesBooleanSelect ? (
                      <select value={draft.colorValue || "Sí"} onChange={(event) => onChange((current) => ({ ...current, colorValue: event.target.value }))}>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <input value={draft.colorValue} onChange={(event) => onChange((current) => ({ ...current, colorValue: event.target.value }))} placeholder={colorValuePlaceholder} />
                    )}
                    <small className="builder-help-text">{colorValueHelp}</small>
                  </label>
                ) : (
                  <div className="component-rule-hint compact-surface-card">
                    <strong>Sin valor adicional</strong>
                    <p>{colorValueHelp}</p>
                  </div>
                )}
                <div className="component-color-grid">
                  <label className="app-modal-field">
                    <span>Color fondo</span>
                    <input type="color" value={draft.colorBg} onChange={(event) => onChange((current) => ({ ...current, colorBg: event.target.value }))} />
                    <small className="builder-help-text">Color del fondo cuando la regla se active.</small>
                  </label>
                  <label className="app-modal-field">
                    <span>Color texto</span>
                    <input type="color" value={draft.colorText} onChange={(event) => onChange((current) => ({ ...current, colorText: event.target.value }))} />
                    <small className="builder-help-text">Color del texto para mantener la lectura clara.</small>
                  </label>
                </div>
              </section>
            ) : null}

            {!showOptionSource && !showInventoryProperty && !showFormulaFields && !showColorRules ? (
              <section className="component-studio-section component-studio-empty">
                <strong>Sin reglas adicionales</strong>
                <p>Este tipo de componente no necesita configuración extra. Puedes pasar al resumen final.</p>
              </section>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <section className="component-studio-section component-studio-summary">
            <div>
              <strong>{draft.fieldLabel || "Nuevo componente"}</strong>
              <span>{selectedTypeUsage}</span>
            </div>
            <div className="component-studio-summary-list">
              <div className="saved-board-list">
                <span className="chip primary">Tipo: {selectedTypeOption?.label}</span>
                <span className="chip">Sección: {draft.groupName || "General"}</span>
                <span className="chip">Ancho: {BOARD_FIELD_WIDTHS.find((item) => item.value === draft.fieldWidth)?.label}</span>
                {draft.isRequired === "true" ? <span className="chip danger">Obligatorio</span> : null}
                {draft.defaultValue ? <span className="chip success">Valor inicial</span> : null}
              </div>
              {autoGeneratedFieldLabels.length ? (
                <div className="saved-board-list">
                  {autoGeneratedFieldLabels.map((label) => <span key={label} className="chip">Auto: {label}</span>)}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

function BoardBuilderModal({
  open,
  mode,
  draft,
  onChange,
  onClose,
  onConfirm,
  onOpenComponentStudio,
  onSaveTemplate,
  onClear,
  feedback,
  templateSearch,
  onTemplateSearchChange,
  templateCategoryFilter,
  onTemplateCategoryChange,
  templateCategories,
  filteredBoardTemplates,
  onPreviewTemplate,
  onApplyTemplate,
  selectedPreviewTemplate,
  onClearTemplatePreview,
  previewBoard,
  draftColumnGroups,
  onMoveDraftColumn,
  onDuplicateDraftColumn,
  onEditDraftColumn,
  onRemoveDraftColumn,
  visibleUsers,
  currentUser,
  userMap,
  inventoryItems,
  canSaveTemplate,
  canSaveBoard,
}) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);
  const actionMenuRef = useRef(null);
  const accessMenuRef = useRef(null);
  const previewSections = getBoardSectionGroups(previewBoard);
  const previewRows = previewBoard?.rows?.slice(0, 2) || [];
  const previewAccessNames = (previewBoard?.accessUserIds || []).map((userId) => userMap.get(userId)?.name).filter(Boolean);
  const availableOperationalUsers = visibleUsers.filter((user) => user.isActive && user.id !== draft.ownerId);
  const selectedOperationalNames = (draft.accessUserIds || []).map((userId) => userMap.get(userId)?.name).filter(Boolean);

  useEffect(() => {
    if (!actionMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!actionMenuRef.current?.contains(event.target)) {
        setActionMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [actionMenuOpen]);

  useEffect(() => {
    if (!accessMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!accessMenuRef.current?.contains(event.target)) {
        setAccessMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [accessMenuOpen]);

  return (
    <Modal
      open={open}
      className="board-builder-modal"
      title={mode === "edit" ? "Editar tablero" : "Nuevo tablero"}
      confirmLabel={mode === "edit" ? "Guardar cambios" : "Crear tablero"}
      cancelLabel="Cerrar"
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="board-builder-modal-shell">
        <section className="board-builder-workbench">
          <div className="board-builder-hero compact-surface-card">
            <div>
              <span className="chip primary">{mode === "edit" ? "Edición estructural" : "Constructor guiado"}</span>
              <h4>{mode === "edit" ? "Ajusta el tablero existente sin salir de aquí" : "Arma un tablero completo en un solo flujo"}</h4>
              <p>Construye el tablero desde cero. La vista previa de la derecha refleja el tablero tal como quedará armado.</p>
            </div>
            <div className="board-builder-hero-actions" ref={actionMenuRef}>
              <button
                type="button"
                className="icon-button board-builder-menu-trigger"
                aria-label="Abrir acciones del constructor"
                aria-expanded={actionMenuOpen}
                onClick={() => setActionMenuOpen((current) => !current)}
              >
                <Menu size={16} />
              </button>
              {actionMenuOpen ? (
                <div className="board-builder-actions-dropdown">
                  <button type="button" className="board-builder-menu-item" onClick={() => { setActionMenuOpen(false); onOpenComponentStudio(); }}>
                    Agregar componente
                  </button>
                  <button type="button" className="board-builder-menu-item danger" onClick={() => { setActionMenuOpen(false); onClear(); }}>
                    Limpiar
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="builder-overview-grid board-builder-tight-grid board-builder-overview-grid">
            <label className="app-modal-field builder-card compact-builder-card">
              <span>Nombre del tablero</span>
              <input value={draft.name} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} placeholder="Ej: Embarques nocturnos" />
            </label>
            <label className="app-modal-field builder-card compact-builder-card">
                        <span>Asociado</span>
              <select value={draft.ownerId} onChange={(event) => onChange((current) => ({ ...current, ownerId: event.target.value }))}>
                <option value="">Seleccionar...</option>
                {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label className="app-modal-field builder-card compact-builder-card builder-card-wide">
              <span>Descripción</span>
              <input value={draft.description} onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))} placeholder="Qué controla, para qué sirve y cuándo se usa" />
            </label>
            <div className="app-modal-field builder-card compact-builder-card builder-card-wide">
              <span>Accesos operativos</span>
              <div className="board-access-selector" ref={accessMenuRef}>
                <button type="button" className="board-access-trigger" onClick={() => setAccessMenuOpen((current) => !current)} aria-expanded={accessMenuOpen}>
                  <span>{selectedOperationalNames.length ? selectedOperationalNames.join(", ") : "Seleccionar asociados con acceso"}</span>
                  <ArrowDown size={16} />
                </button>
                {accessMenuOpen ? (
                  <div className="board-access-dropdown">
                    {availableOperationalUsers.length ? availableOperationalUsers.map((user) => {
                      const checked = (draft.accessUserIds || []).includes(user.id);
                      return (
                        <label key={user.id} className="board-access-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onChange((current) => ({
                              ...current,
                              accessUserIds: checked
                                ? (current.accessUserIds || []).filter((userId) => userId !== user.id)
                                : Array.from(new Set([...(current.accessUserIds || []), user.id])).filter((userId) => userId !== current.ownerId),
                            }))}
                          />
                          <span>{user.name}</span>
                        </label>
                      );
                    }) : <p className="board-access-empty">No hay asociados disponibles para asignar acceso.</p>}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="builder-settings-grid board-builder-settings-grid board-builder-short-select-grid">
            <label className="app-modal-field builder-card compact-builder-card">
              <span>Workflow</span>
              <select value={String(draft.settings.showWorkflow)} onChange={(event) => onChange((current) => ({ ...current, settings: { ...current.settings, showWorkflow: event.target.value === "true" } }))}>
                <option value="true">Activado</option>
                <option value="false">Desactivado</option>
              </select>
            </label>
            <label className="app-modal-field builder-card compact-builder-card">
              <span>Métricas</span>
              <select value={String(draft.settings.showMetrics)} onChange={(event) => onChange((current) => ({ ...current, settings: { ...current.settings, showMetrics: event.target.value === "true" } }))}>
                <option value="true">Activadas</option>
                <option value="false">Desactivadas</option>
              </select>
            </label>
            <label className="app-modal-field builder-card compact-builder-card">
                            <span>Asociado visible</span>
              <select value={String(draft.settings.showAssignee)} onChange={(event) => onChange((current) => ({ ...current, settings: { ...current.settings, showAssignee: event.target.value === "true" } }))}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="app-modal-field builder-card compact-builder-card">
              <span>Fechas visibles</span>
              <select value={String(draft.settings.showDates)} onChange={(event) => onChange((current) => ({ ...current, settings: { ...current.settings, showDates: event.target.value === "true" } }))}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>
          </div>

          <div className="builder-section-head board-builder-section-head">
            <div>
              <h4>Componentes configurados</h4>
              <p>Modifica el tablero y observa inmediatamente cómo cambia la estructura final.</p>
            </div>
            <span className="chip primary">{draft.columns.length} componente(s)</span>
          </div>
          <p className="required-legend"><span className="required-mark" aria-hidden="true">*</span> obligatorio</p>
          <div className="builder-component-list board-builder-component-list">
            {draftColumnGroups.length ? draftColumnGroups.map((group) => (
              <section key={group.name} className="builder-group-block compact-group-block">
                <div className="builder-group-head" style={{ borderColor: group.color }}>
                  <span className="builder-group-indicator" style={{ backgroundColor: group.color }} />
                  <div>
                    <strong>{group.name}</strong>
                    <p>{group.columns.length} componente(s)</p>
                  </div>
                </div>
                {group.columns.map((column) => (
                  <article key={column.id} className="builder-component-card compact-component-card">
                    <div>
                      <strong>{renderBoardFieldLabel(column.label, column.required)}</strong>
                      <p>{column.helpText || getBoardFieldTypeDescription(column.type)}</p>
                    </div>
                    <div className="saved-board-list compact-component-actions">
                      <span className="chip primary">{BOARD_FIELD_TYPES.find((item) => item.value === column.type)?.label || column.type}</span>
                      <button type="button" className="icon-button" onClick={() => onMoveDraftColumn(column.id, "up")}><ArrowUp size={14} /> Subir</button>
                      <button type="button" className="icon-button" onClick={() => onMoveDraftColumn(column.id, "down")}><ArrowDown size={14} /> Bajar</button>
                      <button type="button" className="icon-button" onClick={() => onDuplicateDraftColumn(column.id)}><Copy size={14} /> Duplicar</button>
                      <button type="button" className="icon-button" onClick={() => onEditDraftColumn(column.id)}><Pencil size={14} /> Editar</button>
                      <button type="button" className="icon-button danger" onClick={() => onRemoveDraftColumn(column.id)}><Trash2 size={14} /> Quitar</button>
                    </div>
                  </article>
                ))}
              </section>
            )) : (
              <div className="builder-empty-state compact-builder-empty-state">
                <LayoutDashboard size={28} />
                <div>
                  <strong>Aún no agregas componentes</strong>
                  <p>Usa el Studio de Componentes para construir tu tablero desde cero.</p>
                </div>
              </div>
            )}
          </div>

          {feedback ? <p className="inline-success-message">{feedback}</p> : null}
        </section>

        <aside className="board-builder-preview-panel">
          <div className="board-preview-surface">
            <div className="board-preview-head">
              <div>
                <span className="chip success">Vista previa en vivo</span>
                <h4>{previewBoard.name || "Nuevo tablero"}</h4>
                <p>{previewBoard.description}</p>
              </div>
              <div className="saved-board-list compact-preview-metrics">
                <span className="chip">Campos: {(previewBoard.fields || []).length}</span>
                <span className="chip">Secciones: {previewSections.length}</span>
                <span className="chip">Filas demo: {previewRows.length}</span>
              </div>
            </div>

            <div className="board-meta-inline board-meta-inline-preview">
                      <span>Asociado principal · {userMap.get(previewBoard.ownerId)?.name || currentUser?.name || "Sin asignar"}</span>
              {previewAccessNames.length ? <span>Acceso · {previewAccessNames.join(", ")}</span> : null}
            </div>

            {(previewBoard.fields || []).length ? (
              <div className="table-wrap board-preview-table-wrap">
                <table className="admin-table-clean board-preview-table">
                  <thead>
                    {previewSections.length ? (
                      <tr>
                        {previewSections.map((section) => (
                          <th key={section.name} colSpan={section.span} className="board-section-header-cell" style={{ backgroundColor: section.color }}>
                            {section.name}
                          </th>
                        ))}
                        {previewBoard.settings?.showAssignee !== false ? <th className="board-section-header-cell board-section-header-static">Asociado</th> : null}
                        <th className="board-section-header-cell board-section-header-static">Estado</th>
                        {previewBoard.settings?.showDates !== false ? <th className="board-section-header-cell board-section-header-static">Tiempo</th> : null}
                        {previewBoard.settings?.showWorkflow !== false ? <th className="board-section-header-cell board-section-header-static">Acciones</th> : null}
                      </tr>
                    ) : null}
                    <tr>
                      {(previewBoard.fields || []).map((field) => <th key={field.id}>{field.label}{field.required ? " *" : ""}</th>)}
                      {previewBoard.settings?.showAssignee !== false ? <th>Asociado</th> : null}
                      <th>Estado</th>
                      {previewBoard.settings?.showDates !== false ? <th>Tiempo</th> : null}
                      {previewBoard.settings?.showWorkflow !== false ? <th>Acciones</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id}>
                        {(previewBoard.fields || []).map((field) => <td key={field.id} style={BOARD_FIELD_WIDTH_STYLES[field.width] || BOARD_FIELD_WIDTH_STYLES.md}>{formatBoardPreviewValue(row.values?.[field.id], field, userMap, inventoryItems)}</td>)}
                        {previewBoard.settings?.showAssignee !== false ? <td>{userMap.get(row.responsibleId)?.name || currentUser?.name || "Asociado"}</td> : null}
                        <td><span className="chip">{row.status || STATUS_PENDING}</span></td>
                        {previewBoard.settings?.showDates !== false ? <td>{row.accumulatedSeconds ? `${Math.round(row.accumulatedSeconds / 60)} min` : "0 min"}</td> : null}
                        {previewBoard.settings?.showWorkflow !== false ? <td><span className={row.status === STATUS_RUNNING ? "chip success" : "chip"}>Inicia · Pausa · Fin</span></td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="builder-preview-empty">
                <LayoutDashboard size={32} />
                <div>
                  <strong>La estructura aparecerá aquí</strong>
                  <p>Agrega componentes o previsualiza una plantilla para ver el tablero terminado antes de crearlo.</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Modal>
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

function EmployeeProfileModal({ currentUser, passwordForm, onPasswordChange, onSubmit, onClose, onLogout, onUpdateIdentity }) {
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    area: getUserArea(currentUser),
    jobTitle: getUserJobTitle(currentUser),
  });
  const [identityMessage, setIdentityMessage] = useState("");
  const canBypassEditLimit = canBypassSelfProfileEditLimit(currentUser);
  const selfEditCount = Number(currentUser?.selfIdentityEditCount ?? 0);
  const hasSelfEditAvailable = canBypassEditLimit || selfEditCount < PROFILE_SELF_EDIT_LIMIT;

  useEffect(() => {
    setIdentityForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      area: getUserArea(currentUser),
      jobTitle: getUserJobTitle(currentUser),
    });
    setIdentityMessage("");
    setIsEditMode(false);
  }, [currentUser]);

  function handleStartEditing() {
    if (!hasSelfEditAvailable) {
      setIdentityMessage("La autoedición del perfil ya fue utilizada. Desde ahora sólo un Senior o Lead puede corregir estos datos.");
      return;
    }
    setIdentityForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      area: getUserArea(currentUser),
      jobTitle: getUserJobTitle(currentUser),
    });
    setIsEditMode(true);
    setIdentityMessage("");
  }

  function handleCancelEditing() {
    setIdentityForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      area: getUserArea(currentUser),
      jobTitle: getUserJobTitle(currentUser),
    });
    setIsEditMode(false);
    setIdentityMessage("");
  }

  function handleSaveIdentity() {
    if (!identityForm.name.trim() || !identityForm.email.trim() || !identityForm.area.trim() || !identityForm.jobTitle.trim()) {
      setIdentityMessage("Captura nombre, correo, área y cargo para guardar el perfil del asociado.");
      return;
    }
    const result = onUpdateIdentity({
      name: identityForm.name.trim(),
      email: identityForm.email.trim(),
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
      title="Perfil de asociado"
      confirmLabel="Cerrar"
      hideCancel
      onClose={onClose}
      footerActions={footerActions}
    >
      <div className="modal-form-grid">
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
                  <input value={identityForm.name} onChange={(event) => {
                    setIdentityForm((current) => ({ ...current, name: event.target.value }));
                    setIdentityMessage("");
                  }} placeholder="Nombre del asociado" />
                </label>
                <label className="profile-summary-field">
                  <span>Correo</span>
                  <input value={identityForm.email} onChange={(event) => {
                    setIdentityForm((current) => ({ ...current, email: event.target.value }));
                    setIdentityMessage("");
                  }} placeholder="correo@empresa.com" />
                </label>
              </>
            ) : (
              <div className="profile-summary-readonly-grid">
                <article className="profile-static-field">
                  <span>Nombre</span>
                  <strong>{currentUser.name}</strong>
                </article>
                <article className="profile-static-field">
                  <span>Correo</span>
                  <strong>{currentUser.email}</strong>
                </article>
              </div>
            )}
            <div className="profile-summary-meta">
              <span>{(isEditMode ? identityForm.area : getUserArea(currentUser)).trim() || "Sin área asignada"}</span>
              <small>{canBypassEditLimit ? "Edición libre por nivel interno." : hasSelfEditAvailable ? "Disponible 1 corrección personal del perfil." : "La siguiente corrección requiere apoyo de Senior o Lead."}</small>
            </div>
          </div>
        </div>
        <div className="profile-detail-grid">
          {isEditMode ? (
            <>
              <label className="profile-detail-item profile-detail-item-editable profile-detail-item-wide">
                <span>Cargo</span>
                <input value={identityForm.jobTitle} onChange={(event) => {
                  setIdentityForm((current) => ({ ...current, jobTitle: event.target.value }));
                  setIdentityMessage("");
                }} placeholder="Ej: Encargado de Mejora Continua" />
              </label>
              <label className="profile-detail-item profile-detail-item-editable">
                <span>Área</span>
                <input value={identityForm.area} onChange={(event) => {
                  setIdentityForm((current) => ({ ...current, area: event.target.value }));
                  setIdentityMessage("");
                }} placeholder="Ej: Área de Mejora Continua" />
              </label>
            </>
          ) : (
            <article className="profile-detail-item profile-detail-item-wide">
              <span>Cargo</span>
              <strong>{getUserJobTitle(currentUser) || "Sin cargo asignado"}</strong>
            </article>
          )}
          {!isEditMode ? (
            <article className="profile-detail-item">
              <span>Área</span>
              <strong>{getUserArea(currentUser) || "Sin área asignada"}</strong>
            </article>
          ) : null}
          <article className="profile-detail-item">
            <span>Rol interno</span>
            <strong>{currentUser.role}</strong>
          </article>
        </div>
        <div className={`profile-password-shell ${passwordPanelOpen ? "open" : "collapsed"}`.trim()}>
          <button type="button" className="profile-password-toggle" onClick={() => setPasswordPanelOpen((current) => !current)} aria-expanded={passwordPanelOpen}>
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
        {identityMessage || passwordForm.message ? (
          <div className="profile-action-messages">
            {identityMessage ? <p className={identityMessage.includes("actualizados") ? "inline-success-message" : "validation-text"}>{identityMessage}</p> : null}
            {passwordForm.message ? <p className="inline-message">{passwordForm.message}</p> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function App() {
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState(PAGE_DASHBOARD);
  const [dashboardSectionsOpen, setDashboardSectionsOpen] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DASHBOARD_SECTIONS_KEY) || "null");
      return { ...DEFAULT_DASHBOARD_SECTION_STATE, ...(saved || {}) };
    } catch {
      return DEFAULT_DASHBOARD_SECTION_STATE;
    }
  });
  const [adminTab, setAdminTab] = useState("catalog");
  const [selectedWeekId, setSelectedWeekId] = useState(() => {
    const initial = loadState();
    return initial.weeks.find((week) => week.isActive)?.id || initial.weeks[0]?.id || "";
  });
  const [selectedHistoryWeekId, setSelectedHistoryWeekId] = useState(() => {
    const initial = loadState();
    return initial.weeks[0]?.id || "";
  });
  const [boardFilters, setBoardFilters] = useState({ responsibleId: "all", activityId: "all", status: "all" });
  const [inventorySearch, setInventorySearch] = useState("");
  const [dashboardFilters, setDashboardFilters] = useState({ periodType: "week", periodKey: "all", responsibleId: "all", area: "all", source: "all" });
  const [pauseState, setPauseState] = useState({ open: false, activityId: null, reason: "", error: "" });
  const [boardPauseState, setBoardPauseState] = useState({ open: false, boardId: null, rowId: null, reason: "", error: "" });
  const [catalogModal, setCatalogModal] = useState({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true" });
  const [editWeekId, setEditWeekId] = useState(null);
  const [editWeekActivityId, setEditWeekActivityId] = useState("");
  const [historyPauseActivityId, setHistoryPauseActivityId] = useState(null);
  const [userModal, setUserModal] = useState(() => createUserModalState());
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [resetUserPasswordModal, setResetUserPasswordModal] = useState({ open: false, userId: null, password: "", message: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("Todos los roles");
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "", message: "" });
  const [areaModal, setAreaModal] = useState({ open: false, target: "user", name: "", error: "" });
  const [controlBoardDraft, setControlBoardDraft] = useState(createEmptyBoardDraft);
  const [controlBoardFeedback, setControlBoardFeedback] = useState("");
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
  const [inventoryModal, setInventoryModal] = useState({ open: false, mode: "create", id: null, code: "", name: "", presentation: "", piecesPerBox: "", boxesPerPallet: "" });
  const [inventoryImportFeedback, setInventoryImportFeedback] = useState({ tone: "", message: "" });
  const [permissionsFeedback, setPermissionsFeedback] = useState({ tone: "", message: "" });
  const [selectedPermissionUserId, setSelectedPermissionUserId] = useState("");
  const [openPermissionPageId, setOpenPermissionPageId] = useState("");
  const [permissionEditorDraft, setPermissionEditorDraft] = useState(null);
  const [deleteInventoryId, setDeleteInventoryId] = useState(null);
  const [deleteBoardId, setDeleteBoardId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  const [selectedCustomBoardId, setSelectedCustomBoardId] = useState("");
  const [customBoardActionsMenuOpen, setCustomBoardActionsMenuOpen] = useState(false);
  const [selectedPermissionBoardId, setSelectedPermissionBoardId] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginDirectory, setLoginDirectory] = useState(() => buildLoginDirectoryFromState(loadState()));
  const [bootstrapLeadForm, setBootstrapLeadForm] = useState({ name: "", email: "", area: "", jobTitle: "", password: "" });
  const [bootstrapLeadError, setBootstrapLeadError] = useState("");
  const [auditFilters, setAuditFilters] = useState({ scope: "all", userId: "all", period: "all", search: "" });
  const [sessionUserId, setSessionUserId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState("Conectando");
  const isHydratedRef = useRef(false);
  const skipNextSyncRef = useRef(false);
  const contentShellRef = useRef(null);
  const inventoryFileInputRef = useRef(null);
  const permissionFileInputRef = useRef(null);
  const customBoardActionsMenuRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    contentShellRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    if (!customBoardActionsMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!customBoardActionsMenuRef.current?.contains(event.target)) {
        setCustomBoardActionsMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [customBoardActionsMenuOpen]);

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
    let active = true;

    async function bootstrapAuth() {
      try {
        const directory = await requestJson("/auth/login-options");
        if (active) {
          setLoginDirectory(directory);
        }
      } catch {
        if (active) {
          setLoginDirectory(buildLoginDirectoryFromState(state));
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
        if (error?.status === 401) {
          setSessionUserId("");
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
        skipNextSyncRef.current = true;
        setState(normalizedState);
        setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
        setSyncStatus("Sincronizado");
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
    if (!sessionUserId) return;
    if (!isHydratedRef.current) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
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
        if (error?.status === 401) {
          setSessionUserId("");
        }
        setSyncStatus("Modo local");
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [sessionUserId, state]);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === sessionUserId) || null,
    [sessionUserId, state.users],
  );
  const isBootstrapMasterSession = sessionUserId === BOOTSTRAP_MASTER_ID && loginDirectory.system?.masterBootstrapEnabled;
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
  const weekActivities = useMemo(
    () => state.activities.filter((activity) => activity.weekId === activeWeek?.id),
    [activeWeek?.id, state.activities],
  );

  const filteredBoardActivities = useMemo(() => {
    return weekActivities.filter((activity) => {
      const responsibleOk = boardFilters.responsibleId === "all" || activity.responsibleId === boardFilters.responsibleId;
      const activityOk = boardFilters.activityId === "all" || activity.catalogActivityId === boardFilters.activityId;
      const statusOk = boardFilters.status === "all" || activity.status === boardFilters.status;
      return responsibleOk && activityOk && statusOk;
    });
  }, [boardFilters, weekActivities]);

  const boardCounters = useMemo(
    () => ({
      [STATUS_PENDING]: weekActivities.filter((item) => item.status === STATUS_PENDING).length,
      [STATUS_RUNNING]: weekActivities.filter((item) => item.status === STATUS_RUNNING).length,
      [STATUS_PAUSED]: weekActivities.filter((item) => item.status === STATUS_PAUSED).length,
      [STATUS_FINISHED]: weekActivities.filter((item) => item.status === STATUS_FINISHED).length,
    }),
    [weekActivities],
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
        responsibleName: responsibleUser?.name || "Sin asociado",
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
        responsibleName: responsibleUser?.name || userMap.get(board.ownerId)?.name || "Sin asociado",
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

    return activityRecords.concat(boardRecords).filter((record) => Boolean(record.occurredAt));
  }, [activityPauseSummaryMap, catalogMap, dashboardVisibleControlBoards, now, state.activities, userMap, visibleDashboardActivities]);

  const dashboardPeriodOptions = useMemo(() => {
    const optionsMap = new Map();
    dashboardRecords.forEach((record) => {
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
  }, [dashboardFilters.periodType, dashboardRecords]);

  useEffect(() => {
    if (dashboardFilters.periodKey === "all") return;
    if (!dashboardPeriodOptions.some((option) => option.value === dashboardFilters.periodKey)) {
      setDashboardFilters((current) => ({ ...current, periodKey: "all" }));
    }
  }, [dashboardFilters.periodKey, dashboardPeriodOptions]);

  const filteredDashboardRecords = useMemo(() => {
    return dashboardRecords.filter((record) => {
      const periodOk = dashboardFilters.periodKey === "all" || getDashboardPeriodKey(record.occurredAt, dashboardFilters.periodType) === dashboardFilters.periodKey;
      const responsibleOk = dashboardFilters.responsibleId === "all" || record.responsibleId === dashboardFilters.responsibleId;
      const areaOk = dashboardFilters.area === "all" || record.area === dashboardFilters.area;
      const sourceOk = dashboardFilters.source === "all" || record.source === dashboardFilters.source;
      return periodOk && responsibleOk && areaOk && sourceOk;
    });
  }, [dashboardFilters, dashboardRecords]);

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
    return {
      total,
      completed,
      running,
      paused,
      totalHours: totalSeconds / 3600,
      averageMinutes,
      medianMinutes,
      fastest: sorted[0] || null,
      slowest: sorted[sorted.length - 1] || null,
      withinPercent: slaScoped.length ? (within / slaScoped.length) * 100 : 0,
      outsidePercent: slaScoped.length ? (exceeded.length / slaScoped.length) * 100 : 0,
      exceeded,
      pauseCount: dashboardPauseLogs.length,
      pauseHours: totalPauseSeconds / 3600,
      areaCount: new Set(filteredDashboardRecords.map((record) => record.area)).size,
      boardCount: new Set(filteredDashboardRecords.map((record) => record.boardName)).size,
    };
  }, [dashboardPauseLogs, filteredDashboardCompleted, filteredDashboardRecords]);

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

  const canResetOtherPasswords = currentUser?.role === ROLE_LEAD || currentUser?.role === ROLE_SR;

  const inventoryItems = useMemo(() => {
    return (state.inventoryItems || []).filter((item) => {
      const term = inventorySearch.trim().toLowerCase();
      if (!term) return true;
      return [item.code, item.name, item.presentation].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [inventorySearch, state.inventoryItems]);

  const inventoryStats = useMemo(() => ({
    total: (state.inventoryItems || []).length,
    totalPiecesPerBox: (state.inventoryItems || []).reduce((sum, item) => sum + Number(item.piecesPerBox || 0), 0),
    totalBoxesPerPallet: (state.inventoryItems || []).reduce((sum, item) => sum + Number(item.boxesPerPallet || 0), 0),
  }), [state.inventoryItems]);

  const departmentOptions = useMemo(
    () => buildAreaCatalog(state.users, state.areaCatalog),
    [state.areaCatalog, state.users],
  );
  const userAreaOptions = useMemo(() => {
    if (!currentUser || currentUser.role === ROLE_LEAD) return departmentOptions;
    const actorArea = normalizeAreaOption(getUserArea(currentUser));
    return departmentOptions.filter((area) => area === actorArea);
  }, [currentUser, departmentOptions]);

  function handleAddAreaOption() {
    if (currentUser && currentUser.role !== ROLE_LEAD) {
      return "";
    }
    setAreaModal({ open: true, target: "user", name: "", error: "" });
    return "";
  }

  function handleAddAreaToBootstrap() {
    setAreaModal({ open: true, target: "bootstrap", name: "", error: "" });
  }

  function confirmAddArea() {
    const nextArea = normalizeAreaOption(areaModal.name);
    if (!nextArea) {
      setAreaModal((current) => ({ ...current, error: "Escribe el nombre del área." }));
      return;
    }
    if (departmentOptions.includes(nextArea)) {
      setAreaModal((current) => ({ ...current, error: "Esa área ya existe." }));
      return;
    }

    setState((current) => ({
      ...current,
      areaCatalog: buildAreaCatalog(current.users, (current.areaCatalog || []).concat(nextArea)),
    }));

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
    if (adminTab === "permissions") {
      setAdminTab("catalog");
    }
  }, [adminTab]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [page]);

  useEffect(() => {
    if (sessionUserId && !currentUser) {
      if (!isBootstrapMasterSession) {
        setSessionUserId("");
      }
    }
  }, [currentUser, isBootstrapMasterSession, sessionUserId]);

  const actionPermissions = useMemo(
    () => Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, canDoAction(currentUser, item.id, normalizedPermissions)])),
    [currentUser, normalizedPermissions],
  );

  const visibleControlBoards = useMemo(() => {
    if (!currentUser) return [];
    return (state.controlBoards || []).filter((board) => getBoardVisibleToUser(board, currentUser));
  }, [currentUser, state.controlBoards]);

  const filteredVisibleControlBoards = useMemo(() => {
    const term = customBoardSearch.trim().toLowerCase();
    if (!term) return visibleControlBoards;
    return visibleControlBoards.filter((board) => [board.name, board.description, userMap.get(board.ownerId)?.name]
      .some((value) => String(value || "").toLowerCase().includes(term)));
  }, [customBoardSearch, userMap, visibleControlBoards]);

  const selectedCustomBoard = useMemo(() => {
    return filteredVisibleControlBoards.find((board) => board.id === selectedCustomBoardId) || filteredVisibleControlBoards[0] || null;
  }, [selectedCustomBoardId, filteredVisibleControlBoards]);

  const selectedPermissionBoard = useMemo(
    () => (state.controlBoards || []).find((board) => board.id === selectedPermissionBoardId) || state.controlBoards?.[0] || null,
    [selectedPermissionBoardId, state.controlBoards],
  );

  const selectedBoardActionPermissions = useMemo(
    () => Object.fromEntries(BOARD_PERMISSION_ACTIONS.map((item) => [item.id, canDoBoardAction(currentUser, selectedCustomBoard) && canDoAction(currentUser, item.id, normalizedPermissions)])),
    [currentUser, normalizedPermissions, selectedCustomBoard],
  );

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

  const selectedPermissionUser = useMemo(
    () => permissionManagedUsers.find((user) => user.id === selectedPermissionUserId) || permissionManagedUsers[0] || null,
    [permissionManagedUsers, selectedPermissionUserId],
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

  const selectedPreviewTemplateGroups = useMemo(
    () => getTemplateFieldGroups(selectedPreviewTemplate),
    [selectedPreviewTemplate],
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
    () => getBoardSectionGroups(selectedCustomBoard),
    [selectedCustomBoard],
  );

  const filteredAuditLog = useMemo(() => {
    const nowMs = Date.now();
    const periodMs = auditFilters.period === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : auditFilters.period === "30d"
        ? 30 * 24 * 60 * 60 * 1000
        : null;
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
      setOpenPermissionPageId("");
      setPermissionEditorDraft(null);
      return;
    }

    if (!permissionManagedUsers.some((user) => user.id === selectedPermissionUserId)) {
      setSelectedPermissionUserId(permissionManagedUsers[0].id);
      setOpenPermissionPageId("");
      setPermissionEditorDraft(null);
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
    if (!selectedCustomBoard) return null;
    const rows = selectedCustomBoard.rows || [];
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
  }, [now, selectedCustomBoard]);

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

  async function handleCreateWeek() {
    if (!actionPermissions.createWeek) return;
    try {
      const nextState = await requestJson("/warehouse/weeks", { method: "POST" });
      const activeId = nextState.weeks.find((item) => item.isActive)?.id || nextState.weeks.at(-1)?.id || "";
      skipNextSyncRef.current = true;
      setState(nextState);
      setSelectedWeekId(activeId);
      setSyncStatus("Sincronizado");
      return;
    } catch {
      const nowDate = new Date();
      const weekId = makeId("week");
      const startDate = startOfWeek(nowDate);
      const newWeek = {
        id: weekId,
        name: getWeekName(nowDate),
        startDate: startDate.toISOString(),
        endDate: endOfWeek(nowDate).toISOString(),
        isActive: true,
      };
      const newActivities = buildWeekActivities(weekId, state.catalog, state.users);

      setState((current) => ({
        ...current,
        weeks: current.weeks.map((week) => ({ ...week, isActive: false })).concat(newWeek),
        activities: current.activities.concat(newActivities),
      }));
      setSelectedWeekId(weekId);
    }
  }

  function updateActivity(activityId, updater) {
    setState((current) => ({
      ...current,
      activities: current.activities.map((activity) => (activity.id === activityId ? updater(activity) : activity)),
    }));
  }

  function assignResponsible(activityId, responsibleId) {
    updateActivity(activityId, (activity) => ({
      ...activity,
      responsibleId: responsibleId || null,
    }));
  }

  function handleStart(activityId) {
    const nowIso = new Date().toISOString();
    updateActivity(activityId, (activity) => ({
      ...activity,
      status: STATUS_RUNNING,
      startTime: activity.startTime || nowIso,
      lastResumedAt: nowIso,
    }));
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

  function handleResume(activityId) {
    const nowIso = new Date().toISOString();
    setState((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              status: STATUS_RUNNING,
              lastResumedAt: nowIso,
            }
          : activity,
      ),
      pauseLogs: current.pauseLogs.map((log) => {
        if (log.weekActivityId !== activityId || log.resumedAt) return log;
        return {
          ...log,
          resumedAt: nowIso,
          pauseDurationSeconds: Math.max(0, Math.floor((new Date(nowIso) - new Date(log.pausedAt)) / 1000)),
        };
      }),
    }));
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

    const nowIso = new Date().toISOString();
    updateBoardRow(boardPauseState.boardId, boardPauseState.rowId, (row) => ({
      ...row,
      status: STATUS_PAUSED,
      accumulatedSeconds: updateElapsedForFinish(row, nowIso),
      lastResumedAt: null,
      lastPauseReason: boardPauseState.reason.trim(),
    }));
    setBoardPauseState({ open: false, boardId: null, rowId: null, reason: "", error: "" });
  }

  function handleFinish(activityId) {
    const nowIso = new Date().toISOString();
    updateActivity(activityId, (activity) => ({
      ...activity,
      status: STATUS_FINISHED,
      startTime: activity.startTime || nowIso,
      endTime: nowIso,
      accumulatedSeconds: updateElapsedForFinish(activity, nowIso),
      lastResumedAt: null,
    }));
  }

  function openCatalogCreate() {
    setCatalogModal({ open: true, mode: "create", id: null, name: "", limit: "", mandatory: "true" });
  }

  function openCatalogEdit(item) {
    setCatalogModal({
      open: true,
      mode: "edit",
      id: item.id,
      name: item.name,
      limit: String(item.timeLimitMinutes),
      mandatory: String(item.isMandatory),
    });
  }

  function submitCatalogModal() {
    const payload = {
      id: catalogModal.id || makeId("cat"),
      name: catalogModal.name.trim(),
      timeLimitMinutes: Number(catalogModal.limit || 0),
      isMandatory: catalogModal.mandatory === "true",
      isDeleted: false,
    };

    if (!payload.name || payload.timeLimitMinutes <= 0) return;

    setState((current) => ({
      ...current,
      catalog:
        catalogModal.mode === "create"
          ? current.catalog.concat(payload)
          : current.catalog.map((item) => (item.id === payload.id ? { ...item, ...payload } : item)),
    }));

    setCatalogModal({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true" });
  }

  function softDeleteCatalog(id) {
    setState((current) => ({
      ...current,
      catalog: current.catalog.map((item) => (item.id === id ? { ...item, isDeleted: true } : item)),
    }));
  }

  function addActivityToWeek() {
    if (!editWeekId || !editWeekActivityId) return;
    const targetWeek = state.weeks.find((week) => week.id === editWeekId);
    const catalogItem = state.catalog.find((item) => item.id === editWeekActivityId);
    const defaultResponsible = state.users.find((user) => user.isActive) || state.users[0] || null;
    if (!targetWeek || !catalogItem) return;

    setState((current) => ({
      ...current,
      activities: current.activities.concat({
        id: makeId("act"),
        weekId: editWeekId,
        catalogActivityId: editWeekActivityId,
        responsibleId: defaultResponsible?.id || null,
        status: STATUS_PENDING,
        activityDate: targetWeek.startDate,
        startTime: null,
        endTime: null,
        accumulatedSeconds: 0,
        lastResumedAt: null,
        customName: catalogItem.name,
      }),
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
    return normalizeUserRecord({
      id: draft.id || fallbackId,
      name: draft.name || "Nuevo asociado",
      email: draft.email || `${normalizeKey(draft.role || ROLE_JR) || "usuario"}@copmec.local`,
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
      email: "",
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
      email: user.email,
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

  function submitUserModal() {
    if (!currentUser || !actionPermissions.manageUsers || !canCreateRole(currentUser.role, userModal.role) && userModal.mode === "create") return;
    const trimmedPassword = userModal.password.trim();
    const payload = {
      id: userModal.id || makeId("usr"),
      name: userModal.name.trim(),
      email: userModal.email.trim(),
      role: userModal.role,
      area: userModal.area.trim(),
      department: userModal.area.trim(),
      jobTitle: userModal.jobTitle.trim(),
      isActive: userModal.isActive === "true",
      managerId: userModal.managerId || currentUser?.id || null,
      createdById: userModal.mode === "create" ? currentUser?.id || null : userModal.managerId || currentUser?.id || null,
      ...(userModal.mode === "create" ? { selfIdentityEditCount: 0 } : {}),
    };

    if (!payload.name || !payload.email || !payload.area || !payload.jobTitle || (userModal.mode === "create" && !trimmedPassword)) return;
    if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    setState((current) => ({
      ...(() => {
        const nextUsers = userModal.mode === "create"
          ? current.users.concat(payload)
          : current.users.map((user) => (user.id === payload.id ? { ...user, ...payload } : user));
        const currentOverrides = current.permissions?.userOverrides || {};
        const remainingOverrides = Object.fromEntries(Object.entries(currentOverrides).filter(([userId]) => userId !== payload.id));
        let nextPermissions = {
          ...current.permissions,
          userOverrides: remainingOverrides,
        };
        let nextState = {
          ...current,
          users: nextUsers,
          permissions: nextPermissions,
        };

        if (supportsManagedPermissionOverrides(payload.role) && actionPermissions.managePermissions) {
          const permissionUser = normalizeUserRecord(payload, payload.managerId || currentUser?.id || null);
          const basePermissions = normalizePermissions({
            ...current.permissions,
            userOverrides: remainingOverrides,
          });
          const baseSelection = buildPermissionSelectionForUser(permissionUser, basePermissions);
          const nextOverride = {
            pages: Object.fromEntries(permissionPages
              .map((item) => [item.id, userModal.permissionOverrides.pages?.[item.id]])
              .filter(([pageId, value]) => typeof value === "boolean" && value !== baseSelection.pages[pageId])),
            actions: Object.fromEntries(ACTION_DEFINITIONS
              .map((item) => [item.id, userModal.permissionOverrides.actions?.[item.id]])
              .filter(([actionId, value]) => typeof value === "boolean" && value !== baseSelection.actions[actionId])),
          };
          const hasDirectOverride = Object.keys(nextOverride.pages).length > 0 || Object.keys(nextOverride.actions).length > 0;
          nextPermissions = {
            ...current.permissions,
            userOverrides: hasDirectOverride
              ? { ...remainingOverrides, [payload.id]: nextOverride }
              : remainingOverrides,
          };
          nextState = {
            ...nextState,
            permissions: nextPermissions,
          };
          nextState = appendAuditLog(nextState, buildAuditEntry(currentUser, "permissions", `${userModal.mode === "create" ? "Configuró" : "Actualizó"} permisos directos de ${payload.name}.`));
        }

        return nextState;
      })(),
    }));
    closeUserModal();
  }

  function updateCurrentUserIdentity(identityPatch) {
    if (!currentUser) return;
    const trimmedPatch = {
      name: String(identityPatch.name || "").trim(),
      email: String(identityPatch.email || "").trim(),
      area: String(identityPatch.area || "").trim(),
      jobTitle: String(identityPatch.jobTitle || "").trim(),
    };
    if (!trimmedPatch.name || !trimmedPatch.email || !trimmedPatch.area || !trimmedPatch.jobTitle) {
      return { ok: false, message: "Captura nombre, correo, área y cargo para guardar el perfil del asociado." };
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
    setState((current) => ({
      ...current,
      users: current.users.map((user) => user.id === currentUser.id ? {
        ...user,
        name: trimmedPatch.name,
        email: trimmedPatch.email,
        area: trimmedPatch.area,
        department: trimmedPatch.area,
        jobTitle: trimmedPatch.jobTitle,
        selfIdentityEditCount: canBypassEditLimit ? user.selfIdentityEditCount : Number(user.selfIdentityEditCount ?? 0) + 1,
      } : user),
    }));
    return { ok: true, message: "Datos del asociado actualizados." };
  }

  function deleteUser(userId) {
    if (!userId || userId === currentUser?.id || !actionPermissions.deleteUsers) return;
    setState((current) => {
      const remainingUsers = current.users.filter((user) => user.id !== userId);
      return {
        ...current,
        users: remainingUsers,
        activities: current.activities.map((activity) => (activity.responsibleId === userId ? { ...activity, responsibleId: null } : activity)),
        currentUserId: current.currentUserId === userId ? remainingUsers[0]?.id || current.currentUserId : current.currentUserId,
      };
    });
    setDeleteUserId(null);
  }

  function toggleUserActive(userId) {
    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user)),
    }));
  }

  function updateControlRow(rowId, key, value) {
    setState((current) => ({
      ...current,
      controlRows: current.controlRows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    }));
  }

  function addControlRow() {
    setState((current) => ({
      ...current,
      controlRows: current.controlRows.concat({
        id: makeId("ctrl"),
        product: "",
        pallets: 0,
        boxes: 0,
        responsibleId: current.users.find((user) => user.isActive)?.id || current.users[0]?.id || "",
        status: CONTROL_STATUS_OPTIONS[0],
      }),
    }));
  }

  function removeControlRow(rowId) {
    setState((current) => ({
      ...current,
      controlRows: current.controlRows.filter((row) => row.id !== rowId),
    }));
  }

  function addDraftColumn() {
    if (!controlBoardDraft.fieldLabel.trim()) {
      setControlBoardFeedback("Escribe una etiqueta para el campo antes de agregarlo.");
      return;
    }
    const colorRules = controlBoardDraft.colorValue
      ? [{ operator: controlBoardDraft.colorOperator, value: controlBoardDraft.colorValue, color: controlBoardDraft.colorBg, textColor: controlBoardDraft.colorText }]
      : [];
    const field = {
      id: makeId("fld"),
      label: controlBoardDraft.fieldLabel.trim(),
      type: controlBoardDraft.fieldType,
      optionSource: controlBoardDraft.optionSource,
      options: controlBoardDraft.optionsText.split(",").map((item) => item.trim()).filter(Boolean),
      inventoryProperty: controlBoardDraft.inventoryProperty,
      sourceFieldId: controlBoardDraft.sourceFieldId || null,
      formulaOperation: controlBoardDraft.formulaOperation,
      formulaLeftFieldId: controlBoardDraft.formulaLeftFieldId || null,
      formulaRightFieldId: controlBoardDraft.formulaRightFieldId || null,
      helpText: controlBoardDraft.fieldHelp.trim(),
      placeholder: controlBoardDraft.placeholder.trim(),
      defaultValue: controlBoardDraft.defaultValue,
      width: controlBoardDraft.fieldWidth,
      required: controlBoardDraft.isRequired === "true",
      groupName: controlBoardDraft.groupName.trim() || "General",
      groupColor: controlBoardDraft.groupColor,
      colorRules,
    };
    const isBundleField = controlBoardDraft.fieldType === INVENTORY_LOOKUP_LOGISTICS_FIELD;
    const fieldsToInsert = controlBoardDraft.fieldType === INVENTORY_LOOKUP_LOGISTICS_FIELD
      ? buildInventoryBundleFields(controlBoardDraft, editingDraftColumnId || null)
      : [field];
    setControlBoardDraft((current) => ({
      ...current,
      columns: editingDraftColumnId
        ? current.columns.flatMap((column) => {
          if (isBundleField) {
            const derivedIds = new Set(getInventoryBundleEditableFields(current.columns, editingDraftColumnId).map((item) => item.id));
            if (column.id === editingDraftColumnId) return fieldsToInsert;
            if (derivedIds.has(column.id)) return [];
            return [column];
          }
          return column.id === editingDraftColumnId ? fieldsToInsert : [column];
        })
        : current.columns.concat(fieldsToInsert),
      ...createEmptyFieldDraft(),
    }));
    setEditingDraftColumnId(null);
    setComponentStudioOpen(false);
    setControlBoardFeedback(editingDraftColumnId ? "Componente actualizado correctamente." : fieldsToInsert.length > 1 ? "Buscador agregado con sus columnas automáticas." : "Componente agregado al tablero borrador.");
  }

  function removeDraftColumn(columnId) {
    setControlBoardDraft((current) => ({
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId),
    }));
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
      const source = current.columns[index];
      const duplicate = {
        ...source,
        id: makeId("fld"),
        label: `${source.label} copia`,
      };
      const nextColumns = [...current.columns];
      nextColumns.splice(index + 1, 0, duplicate);
      return { ...current, columns: nextColumns };
    });
    setControlBoardFeedback("Componente duplicado.");
  }

  function moveDraftColumn(columnId, direction) {
    setControlBoardDraft((current) => {
      const index = current.columns.findIndex((item) => item.id === columnId);
      if (index === -1) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.columns.length) return current;
      const nextColumns = [...current.columns];
      const [moved] = nextColumns.splice(index, 1);
      nextColumns.splice(targetIndex, 0, moved);
      return { ...current, columns: nextColumns };
    });
  }

  function applyBoardTemplate(templateId) {
    const template = availableBoardTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setControlBoardDraft((current) => ({
      ...current,
      name: template.name,
      description: template.description,
      settings: { ...current.settings, ...(template.settings || {}) },
      columns: buildTemplateColumns(template),
      ...createEmptyFieldDraft(),
    }));
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

  function buildUserPermissionDraft(user, pageId) {
    if (!user) return null;
    return {
      pageId,
      pageEnabled: canAccessPage(user, pageId, normalizedPermissions),
      actions: Object.fromEntries(getPagePermissionActions(pageId).map((item) => [item.id, canDoAction(user, item.id, normalizedPermissions)])),
    };
  }

  function openPermissionPanel(pageId) {
    if (!selectedPermissionUser) return;
    if (openPermissionPageId === pageId) {
      setOpenPermissionPageId("");
      setPermissionEditorDraft(null);
      return;
    }
    setOpenPermissionPageId(pageId);
    setPermissionEditorDraft(buildUserPermissionDraft(selectedPermissionUser, pageId));
  }

  function togglePermissionDraftValue(kind, key) {
    setPermissionEditorDraft((current) => {
      if (!current) return current;
      if (kind === "page") {
        return { ...current, pageEnabled: !current.pageEnabled };
      }
      return {
        ...current,
        actions: {
          ...current.actions,
          [key]: !current.actions[key],
        },
      };
    });
  }

  function savePermissionPanel() {
    if (!selectedPermissionUser || !permissionEditorDraft || !actionPermissions.managePermissions) return;

    setState((current) => {
      const currentOverrides = current.permissions?.userOverrides || {};
      const baseOverride = currentOverrides[selectedPermissionUser.id] || { pages: {}, actions: {} };
      const nextOverride = {
        pages: {
          ...baseOverride.pages,
          [permissionEditorDraft.pageId]: permissionEditorDraft.pageEnabled,
        },
        actions: {
          ...baseOverride.actions,
          ...permissionEditorDraft.actions,
        },
      };

      return {
        ...appendAuditLog(current, buildAuditEntry(currentUser, "permissions", `Actualizó permisos directos de ${selectedPermissionUser.name} en ${permissionEditorDraft.pageId}.`)),
        permissions: {
          ...current.permissions,
          userOverrides: {
            ...currentOverrides,
            [selectedPermissionUser.id]: nextOverride,
          },
        },
      };
    });

    setPermissionsFeedback({ tone: "success", message: `Permisos guardados para ${selectedPermissionUser.name}.` });
    setOpenPermissionPageId("");
    setPermissionEditorDraft(null);
  }

  function updatePermissionEntry(scope, key, field, value) {
    if (!actionPermissions.managePermissions) return;
    const entry = buildAuditEntry(currentUser, "permissions", `Actualizó ${scope === "pages" ? "pestaña" : "acción"} ${key} en ${field}.`);
    setState((current) => ({
      ...appendAuditLog(current, entry),
      permissions: {
        ...current.permissions,
        [scope]: {
          ...current.permissions[scope],
          [key]: {
            ...(current.permissions[scope]?.[key] || { roles: [], userIds: [], departments: [] }),
            [field]: value,
          },
        },
      },
    }));
  }

  function updateBoardAssignment(boardId, field, value) {
    if (!actionPermissions.managePermissions) return;
    setState((current) => {
      const board = current.controlBoards.find((item) => item.id === boardId);
      if (!board) return current;
      const normalizedAccessUserIds = field === "accessUserIds"
        ? Array.from(new Set((value || []).filter((userId) => userId && userId !== board.ownerId)))
        : Array.from(new Set((board.accessUserIds || []).filter((userId) => userId && userId !== value)));
      const entry = buildAuditEntry(currentUser, "boards", `Actualizó la asignación del tablero ${board.name}.`);
      return {
        ...appendAuditLog(current, entry),
        controlBoards: current.controlBoards.map((item) => (item.id === boardId
          ? {
              ...item,
              ownerId: field === "ownerId" ? value : item.ownerId,
              accessUserIds: field === "accessUserIds" ? normalizedAccessUserIds : normalizedAccessUserIds,
            }
          : item)),
      };
    });
  }

  function applyPermissionPreset(presetId) {
    if (!actionPermissions.managePermissions) return;
    const preset = PERMISSION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const nextPermissions = buildPermissionsFromPreset(presetId);
    const entry = buildAuditEntry(currentUser, "permissions", `Aplicó el preset ${preset.label}.`);
    setState((current) => ({
      ...appendAuditLog(current, entry),
      permissions: nextPermissions,
    }));
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

      setState((current) => ({
        ...appendAuditLog(current, buildAuditEntry(currentUser, "permissions", `Importó reglas de permisos desde ${file.name}.`)),
        permissions: nextPermissions,
        controlBoards: current.controlBoards.map((board) => ({
          ...board,
          permissions: normalizeBoardPermissions(boardPermissionsMap.get(board.id) || board.permissions, nextPermissions, board),
        })),
      }));
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

  function saveDraftAsBoardTemplate() {
    if (!controlBoardDraft.name.trim() || !controlBoardDraft.columns.length || !actionPermissions.saveTemplate) {
      setControlBoardFeedback("Define nombre y al menos un componente antes de guardar una plantilla reutilizable.");
      return;
    }

    const templateName = controlBoardDraft.name.trim();
    const templateDescription = controlBoardDraft.description.trim() || `Plantilla reutilizable para ${templateName}.`;
    const templatePayload = {
      id: makeId("tpl"),
      name: templateName,
      description: templateDescription,
      category: "Personalizada",
      visibilityType: currentUser?.department ? "department" : "users",
      sharedDepartments: currentUser?.department ? [currentUser.department] : [],
      sharedUserIds: currentUser ? [currentUser.id] : [],
      settings: { ...controlBoardDraft.settings },
      columns: (controlBoardDraft.columns || []).map((column) => ({
        ...column,
        templateKey: column.templateKey || column.id,
      })),
      isCustom: true,
      createdAt: new Date().toISOString(),
      createdById: currentUser?.id || null,
    };

    setState((current) => ({
      ...appendAuditLog(current, buildAuditEntry(currentUser, "templates", `Guardó la plantilla ${templateName}.`)),
      boardTemplates: [...(current.boardTemplates || []), templatePayload],
    }));
    setControlBoardFeedback(`Plantilla ${templateName} guardada para reutilizarla cuando quieras.`);
  }

  function openEditBoardTemplate(template) {
    if (!template?.isCustom || !actionPermissions.editTemplate) return;
    setTemplateEditorModal({
      open: true,
      id: template.id,
      name: template.name || "",
      description: template.description || "",
      category: getBoardTemplateCategory(template),
      visibilityType: template.visibilityType || "department",
      sharedDepartments: template.sharedDepartments || [],
      sharedUserIds: template.sharedUserIds || [],
    });
  }

  function submitBoardTemplateEdit() {
    if (!templateEditorModal.id || !templateEditorModal.name.trim() || !actionPermissions.editTemplate) {
      setControlBoardFeedback("La plantilla debe tener nombre para guardar los cambios.");
      return;
    }

    setState((current) => ({
      ...appendAuditLog(current, buildAuditEntry(currentUser, "templates", `Actualizó la plantilla ${templateEditorModal.name.trim()}.`)),
      boardTemplates: (current.boardTemplates || []).map((template) => (
        template.id === templateEditorModal.id
          ? {
              ...template,
              name: templateEditorModal.name.trim(),
              description: templateEditorModal.description.trim(),
              category: templateEditorModal.category.trim() || "Personalizada",
              visibilityType: templateEditorModal.visibilityType,
              sharedDepartments: templateEditorModal.sharedDepartments,
              sharedUserIds: templateEditorModal.sharedUserIds,
            }
          : template
      )),
    }));
    setTemplateEditorModal({ open: false, id: null, name: "", description: "", category: "", visibilityType: "department", sharedDepartments: [], sharedUserIds: [] });
    setControlBoardFeedback("Plantilla actualizada correctamente.");
  }

  function deleteBoardTemplate(templateId) {
    if (!actionPermissions.deleteTemplate) return;
    setState((current) => ({
      ...appendAuditLog(current, buildAuditEntry(currentUser, "templates", `Eliminó la plantilla ${current.boardTemplates.find((template) => template.id === templateId)?.name || templateId}.`)),
      boardTemplates: (current.boardTemplates || []).filter((template) => template.id !== templateId),
    }));
    setControlBoardFeedback("Plantilla personalizada eliminada.");
  }

  function saveControlBoard() {
    if (!currentUser || !actionPermissions.saveBoard || !controlBoardDraft.name.trim() || !controlBoardDraft.columns.length) {
      setControlBoardFeedback("Agrega nombre, dueño y al menos un campo para guardar el tablero.");
      return;
    }
    const isEditing = boardBuilderModal.mode === "edit" && boardBuilderModal.boardId;
    const nextBoardId = isEditing ? boardBuilderModal.boardId : makeId("board");

    setState((current) => {
      const ownerId = controlBoardDraft.ownerId || currentUser.id;
      const accessUserIds = Array.from(new Set((controlBoardDraft.accessUserIds || []).filter((userId) => userId && userId !== ownerId)));

      if (isEditing) {
        const existingBoard = current.controlBoards.find((board) => board.id === boardBuilderModal.boardId);
        if (!existingBoard || !canEditBoard(currentUser, existingBoard)) return current;

        const nextFields = cloneDraftColumns(controlBoardDraft.columns || []);
        const updatedBoard = {
          ...existingBoard,
          name: controlBoardDraft.name.trim(),
          description: controlBoardDraft.description.trim(),
          ownerId,
          accessUserIds,
          settings: { ...controlBoardDraft.settings },
          fields: nextFields,
          rows: (existingBoard.rows || []).map((row) => ({
            ...row,
            values: nextFields.reduce((accumulator, field) => {
              if (Object.prototype.hasOwnProperty.call(row.values || {}, field.id)) {
                accumulator[field.id] = row.values[field.id];
              } else {
                accumulator[field.id] = getBoardFieldDefaultValue(field, row.responsibleId || ownerId || currentUser.id);
              }
              return accumulator;
            }, {}),
          })),
        };

        return {
          ...current,
          controlBoards: current.controlBoards.map((board) => (
            board.id === existingBoard.id
              ? {
                  ...updatedBoard,
                  permissions: normalizeBoardPermissions(existingBoard.permissions, current.permissions, updatedBoard),
                }
              : board
          )),
        };
      }

      const board = {
        id: nextBoardId,
        name: controlBoardDraft.name.trim(),
        description: controlBoardDraft.description.trim(),
        createdById: currentUser.id,
        ownerId,
        accessUserIds,
        settings: { ...controlBoardDraft.settings },
        fields: cloneDraftColumns(controlBoardDraft.columns || []),
        rows: [],
      };

      return {
        ...current,
        controlBoards: current.controlBoards.concat({
          ...board,
          permissions: buildBoardPermissions(current.permissions, board),
        }),
      };
    });

    setSelectedCustomBoardId(nextBoardId);
    setPage(PAGE_CUSTOM_BOARDS);
    setBoardBuilderModal({ open: false, mode: "create", boardId: null });
    setTemplatePreviewId(null);
    setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser.id });
    setControlBoardFeedback("");
    setBoardRuntimeFeedback({
      tone: "success",
      message: isEditing
        ? `Se actualizó ${controlBoardDraft.name.trim()} y ya quedó reflejado en Mis tableros.`
        : `Se creó ${controlBoardDraft.name.trim()} y ya aparece en Mis tableros.`,
    });
  }

  function clearControlBoardDraft() {
    setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser?.id || "" });
    setEditingDraftColumnId(null);
    setTemplatePreviewId(null);
    setControlBoardFeedback("Borrador limpiado.");
  }

  function openCreateBoardBuilder() {
    setControlBoardDraft({ ...createEmptyBoardDraft(), ownerId: currentUser?.id || "" });
    setBoardBuilderModal({ open: true, mode: "create", boardId: null });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  function openEditBoardBuilder(board) {
    if (!actionPermissions.saveBoard || !canEditBoard(currentUser, board)) return;
    setControlBoardDraft(createBoardDraftFromBoard(board));
    setBoardBuilderModal({ open: true, mode: "edit", boardId: board.id });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  function deleteControlBoard(boardId) {
    if (!currentUser || !boardId) return;
    const boardToDelete = (state.controlBoards || []).find((board) => board.id === boardId);
    if (!actionPermissions.deleteBoard || !boardToDelete || !canEditBoard(currentUser, boardToDelete)) return;

    const remainingVisibleBoards = visibleControlBoards.filter((board) => board.id !== boardId);

    setState((current) => ({
      ...appendAuditLog(current, buildAuditEntry(currentUser, "boards", `Eliminó el tablero ${boardToDelete.name}.`)),
      controlBoards: (current.controlBoards || []).filter((board) => board.id !== boardId),
    }));
    setDeleteBoardId(null);
    setCustomBoardActionsMenuOpen(false);
    setSelectedCustomBoardId(remainingVisibleBoards[0]?.id || "");
    setBoardRuntimeFeedback({ tone: "success", message: `Se eliminó el tablero ${boardToDelete.name}.` });
  }

  function closeBoardBuilderModal() {
    setBoardBuilderModal({ open: false, mode: "create", boardId: null });
    setTemplatePreviewId(null);
    setEditingDraftColumnId(null);
    setControlBoardFeedback("");
  }

  function openCreateInventoryItem() {
    if (!actionPermissions.manageInventory) return;
    setInventoryImportFeedback({ tone: "", message: "" });
    setInventoryModal({ open: true, mode: "create", id: null, code: "", name: "", presentation: "", piecesPerBox: "", boxesPerPallet: "" });
  }

  function openEditInventoryItem(item) {
    if (!actionPermissions.manageInventory) return;
    setInventoryModal({
      open: true,
      mode: "edit",
      id: item.id,
      code: item.code,
      name: item.name,
      presentation: item.presentation,
      piecesPerBox: String(item.piecesPerBox),
      boxesPerPallet: String(item.boxesPerPallet),
    });
  }

  function submitInventoryModal() {
    if (!actionPermissions.manageInventory) return;
    const payload = {
      id: inventoryModal.id || makeId("inv"),
      code: inventoryModal.code.trim(),
      name: inventoryModal.name.trim(),
      presentation: inventoryModal.presentation.trim(),
      piecesPerBox: Number(inventoryModal.piecesPerBox || 0),
      boxesPerPallet: Number(inventoryModal.boxesPerPallet || 0),
    };

    if (!payload.code || !payload.name) return;

    setState((current) => ({
      ...current,
      inventoryItems:
        inventoryModal.mode === "create"
          ? [...(current.inventoryItems || []), payload]
          : (current.inventoryItems || []).map((item) => (item.id === payload.id ? { ...item, ...payload } : item)),
    }));
    setInventoryModal({ open: false, mode: "create", id: null, code: "", name: "", presentation: "", piecesPerBox: "", boxesPerPallet: "" });
  }

  async function handleInventoryImport(event) {
    if (!actionPermissions.importInventory) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedItems = await parseInventoryImportFile(file);

      if (!importedItems.length) {
        setInventoryImportFeedback({ tone: "danger", message: "No se encontraron filas válidas. Usa columnas como codigo, nombre, presentacion, piezas_por_caja y cajas_por_tarima." });
        return;
      }

      const existingItems = state.inventoryItems || [];
      const existingByCode = new Map(existingItems.map((item) => [normalizeKey(item.code), item]));
      let createdCount = 0;
      let updatedCount = 0;

      const mergedByCode = new Map(existingItems.map((item) => [normalizeKey(item.code), item]));
      importedItems.forEach((item) => {
        const key = normalizeKey(item.code);
        const currentItem = mergedByCode.get(key);
        if (currentItem) {
          updatedCount += 1;
          mergedByCode.set(key, { ...currentItem, ...item, id: currentItem.id });
          return;
        }
        createdCount += 1;
        mergedByCode.set(key, { ...item, id: makeId("inv") });
      });

      setState((current) => ({
        ...current,
        inventoryItems: Array.from(mergedByCode.values()),
      }));

      setInventoryImportFeedback({
        tone: "success",
        message: `Importacion completada. ${createdCount} nuevos y ${updatedCount} actualizados${existingByCode.size ? " por codigo" : ""}.`,
      });
    } catch (error) {
      setInventoryImportFeedback({ tone: "danger", message: `No se pudo importar el archivo. ${error instanceof Error ? error.message : "Revisa el formato del CSV o Excel."}` });
    } finally {
      event.target.value = "";
    }
  }

  async function downloadInventoryTemplate() {
    if (!actionPermissions.importInventory) return;
    try {
      await downloadInventoryTemplateFile();
    } catch {
      setInventoryImportFeedback({ tone: "danger", message: "No se pudo generar la plantilla de inventario." });
    }
  }

  function deleteInventoryItem(itemId) {
    if (!itemId || !actionPermissions.manageInventory) return;
    setState((current) => ({
      ...current,
      inventoryItems: (current.inventoryItems || []).filter((item) => item.id !== itemId),
    }));
    setDeleteInventoryId(null);
  }

  function resetBoardFilters() {
    setBoardFilters({ responsibleId: "all", activityId: "all", status: "all" });
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
    try {
      const authResult = await requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      setSessionUserId(authResult.userId || "");
      if (authResult.isBootstrapMaster) {
        setPage(PAGE_DASHBOARD);
        return;
      }

      const remoteState = await requestJson("/warehouse/state");
      const normalizedState = normalizeWarehouseState(remoteState);
      skipNextSyncRef.current = true;
      setState(normalizedState);
      setLoginDirectory(buildLoginDirectoryFromState(normalizedState));
      const nextUser = normalizedState.users.find((user) => user.id === authResult.userId) || authResult.user;
      setPage(nextUser?.role === ROLE_JR ? PAGE_CUSTOM_BOARDS : PAGE_DASHBOARD);
      setSyncStatus("Sincronizado");
    } catch (error) {
      setLoginError(error?.message || "Credenciales inválidas.");
    }
  }

  async function handleLogout() {
    try {
      await requestJson("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout transport errors and clear client session anyway.
    }
    setSessionUserId("");
    setLoginForm({ email: "", password: "" });
    setLoginError("");
    setLoginDirectory(buildLoginDirectoryFromState(state));
  }

  function handleCreateFirstLead(event) {
    event.preventDefault();
    if (!bootstrapLeadForm.name.trim() || !bootstrapLeadForm.email.trim() || !bootstrapLeadForm.area.trim() || !bootstrapLeadForm.jobTitle.trim() || !bootstrapLeadForm.password.trim()) {
      setBootstrapLeadError("Completa nombre, correo, área, cargo y contraseña para crear el primer Lead.");
      return;
    }

    const leadId = makeId("usr-lead");
    const leadUser = {
      id: leadId,
      name: bootstrapLeadForm.name.trim(),
      email: bootstrapLeadForm.email.trim(),
      area: bootstrapLeadForm.area.trim(),
      department: bootstrapLeadForm.area.trim(),
      jobTitle: bootstrapLeadForm.jobTitle.trim(),
      password: bootstrapLeadForm.password,
      role: ROLE_LEAD,
      isActive: true,
      managerId: null,
      createdById: BOOTSTRAP_MASTER_ID,
    };

    const starterWorkspace = buildStarterWorkspace(leadUser, state.catalog, state.inventoryItems || [], state.permissions);

    setState((current) => ({
      ...current,
      system: {
        ...current.system,
        masterBootstrapEnabled: false,
        firstLeadCreatedAt: new Date().toISOString(),
      },
      currentUserId: leadId,
      users: [leadUser],
      weeks: starterWorkspace.weeks,
      controlBoards: starterWorkspace.controlBoards,
      controlRows: starterWorkspace.controlRows,
      activities: starterWorkspace.activities,
      pauseLogs: starterWorkspace.pauseLogs,
    }));
    setBootstrapLeadForm({ name: "", email: "", area: "", jobTitle: "", password: "" });
    setSessionUserId(leadId);
    setPage(PAGE_DASHBOARD);
  }

  function createBoardRow(boardId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    if (!canDoBoardAction(currentUser, board)) return;
    if (!board || !currentUser) return;
    const defaultValues = (board.fields || []).reduce((accumulator, field) => {
      accumulator[field.id] = getBoardFieldDefaultValue(field, currentUser.id);
      return accumulator;
    }, {});
    const row = {
      id: makeId("row"),
      values: defaultValues,
      responsibleId: currentUser.id,
      status: STATUS_PENDING,
      startTime: null,
      endTime: null,
      accumulatedSeconds: 0,
      lastResumedAt: null,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({
      ...current,
      controlBoards: current.controlBoards.map((item) => (item.id === boardId ? { ...item, rows: [...(item.rows || []), row] } : item)),
    }));
    setBoardRuntimeFeedback({ tone: "", message: "" });
  }

  function updateBoardRow(boardId, rowId, updater) {
    setState((current) => ({
      ...current,
      controlBoards: current.controlBoards.map((board) => {
        if (board.id !== boardId) return board;
        return {
          ...board,
          rows: (board.rows || []).map((row) => (row.id === rowId ? updater(row) : row)),
        };
      }),
    }));
  }

  function deleteBoardRow(boardId, rowId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || row.status === STATUS_FINISHED || !canEditBoardRowRecord(currentUser, board, row, normalizedPermissions)) {
      setDeleteBoardRowState({ open: false, boardId: null, rowId: null });
      return;
    }

    setState((current) => ({
      ...current,
      controlBoards: current.controlBoards.map((item) => (
        item.id === boardId
          ? { ...item, rows: (item.rows || []).filter((entry) => entry.id !== rowId) }
          : item
      )),
    }));
    setDeleteBoardRowState({ open: false, boardId: null, rowId: null });
    setBoardRuntimeFeedback({ tone: "success", message: "La fila fue eliminada del tablero." });
  }

  function updateBoardRowValue(boardId, rowId, field, rawValue) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!canEditBoardRowRecord(currentUser, board, row, normalizedPermissions)) return;
    updateBoardRow(boardId, rowId, (row) => ({
      ...row,
      values: {
        ...(row.values || {}),
        [field.id]: rawValue,
      },
    }));
  }

  function getBoardExportRows(board) {
    return (board?.rows || []).map((row) => {
      const exportRow = {};

      (board.fields || []).forEach((field) => {
        let value = getBoardFieldValue(board, row, field);

        if (field.type === "inventoryLookup") {
          const inventoryItem = (state.inventoryItems || []).find((item) => item.id === value);
          value = inventoryItem ? `${inventoryItem.name} · ${inventoryItem.presentation}` : "";
        }

        if (field.type === "user") {
          value = userMap.get(value)?.name || "";
        }

        exportRow[field.label] = value;
      });

      if (board.settings?.showAssignee !== false) {
        exportRow.Asociado = userMap.get(row.responsibleId)?.name || "";
      }

      exportRow.Estado = row.status || STATUS_PENDING;

      if (board.settings?.showDates !== false) {
        exportRow["Tiempo acumulado"] = formatDurationClock(getElapsedSeconds(row, Date.now()));
        exportRow["Creado el"] = formatDateTime(row.createdAt);
      }

      return exportRow;
    });
  }

  function duplicateBoardRecord(board, includeRows = false) {
    if (!board || !currentUser) return;
    if (!canDoBoardAction(currentUser, board)) return;
    if (includeRows && !actionPermissions.duplicateBoardWithRows) return;
    if (!includeRows && !actionPermissions.duplicateBoard) return;

    const { fields, idMap } = cloneBoardFieldBundle(board.fields || []);
    const duplicatedBoardId = makeId("board");
    const duplicatedBoard = {
      ...board,
      id: duplicatedBoardId,
      name: `${board.name} copia${includeRows ? " con filas" : ""}`,
      description: board.description || `Copia de ${board.name}.`,
      createdById: currentUser.id,
      fields,
      rows: includeRows
        ? (board.rows || []).map((row) => ({
            ...row,
            id: makeId("row"),
            values: Object.entries(row.values || {}).reduce((accumulator, [fieldId, value]) => {
              accumulator[idMap.get(fieldId) || fieldId] = value;
              return accumulator;
            }, {}),
          }))
        : [],
    };

    setState((current) => ({
      ...current,
      controlBoards: current.controlBoards.concat({
        ...duplicatedBoard,
        permissions: normalizeBoardPermissions(board.permissions, current.permissions, duplicatedBoard),
      }),
    }));
    setSelectedCustomBoardId(duplicatedBoardId);
    setBoardRuntimeFeedback({ tone: "success", message: `Se duplicó ${board.name} y ya quedó listo como ${duplicatedBoard.name}.` });
  }

  function changeBoardRowStatus(boardId, rowId, status) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || !canOperateBoardRowRecord(currentUser, board, row, normalizedPermissions)) return;

    if (status === STATUS_FINISHED) {
      const missingFields = (board.fields || []).filter((field) => {
        if (!field.required) return false;
        return !isBoardFieldValueFilled(getBoardFieldValue(board, row, field), field.type);
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
    const nowIso = new Date().toISOString();
    updateBoardRow(boardId, rowId, (row) => {
      if (status === STATUS_RUNNING) {
        return { ...row, status, startTime: row.startTime || nowIso, endTime: row.status === STATUS_FINISHED ? null : row.endTime, lastResumedAt: nowIso };
      }
      if (status === STATUS_PAUSED) {
        return { ...row, status, accumulatedSeconds: updateElapsedForFinish(row, nowIso), lastResumedAt: null };
      }
      if (status === STATUS_FINISHED) {
        return { ...row, status, endTime: nowIso, accumulatedSeconds: updateElapsedForFinish(row, nowIso), lastResumedAt: null };
      }
      return { ...row, status };
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
      message: "Al terminar la fila, el producto buscado ya no podrá cambiarse ni borrarse.",
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
      const XLSX = await import("xlsx");
      const rows = getBoardExportRows(selectedCustomBoard);

      const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Estado: "Sin filas registradas" }]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tablero");
      XLSX.writeFile(workbook, `${normalizeKey(selectedCustomBoard.name).replace(/\s+/g, "-") || "tablero-operativo"}.xlsx`);
      setBoardRuntimeFeedback({ tone: "success", message: `Se exportó ${selectedCustomBoard.name} a Excel.` });
    } catch {
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo exportar el tablero a Excel." });
    }
  }

  async function buildSelectedBoardPdfDocument() {
    if (!selectedCustomBoard) return null;

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const rows = getBoardExportRows(selectedCustomBoard);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const descriptionLines = selectedCustomBoard.description ? doc.splitTextToSize(selectedCustomBoard.description, 760) : [];
    const subtitle = `Filas: ${selectedCustomBoard.rows?.length || 0} · Exportado ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`;
    const columns = rows.length ? Object.keys(rows[0]) : ["Estado"];
    const body = rows.length ? rows.map((row) => columns.map((column) => String(row[column] ?? ""))) : [["Sin filas registradas"]];

    doc.setFillColor(19, 61, 51);
    doc.roundedRect(26, 18, 790, 54, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(selectedCustomBoard.name, 42, 42);
    doc.setFontSize(9);
    doc.text(subtitle, 42, 58);

    if (descriptionLines.length) {
      doc.setTextColor(54, 81, 81);
      doc.setFontSize(10);
      doc.text(descriptionLines, 40, 92);
    }

    autoTable(doc, {
      head: [columns],
      body,
      startY: descriptionLines.length ? 92 + descriptionLines.length * 12 : 92,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", lineColor: [221, 231, 226] },
      headStyles: { fillColor: [19, 61, 51] },
      alternateRowStyles: { fillColor: [247, 250, 248] },
    });

    return doc;
  }

  async function previewSelectedBoardPdf() {
    if (!selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) return;

    try {
      const doc = await buildSelectedBoardPdfDocument();
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setBoardRuntimeFeedback({ tone: "success", message: `Vista previa PDF abierta para ${selectedCustomBoard.name}.` });
    } catch {
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo abrir la vista previa del PDF." });
    }
  }

  async function exportSelectedBoardToPdf() {
    if (!selectedCustomBoard || !canDoBoardAction(currentUser, selectedCustomBoard)) return;

    try {
      const fileBaseName = normalizeKey(selectedCustomBoard.name).replace(/\s+/g, "-") || "tablero-operativo";
      const doc = await buildSelectedBoardPdfDocument();
      doc.save(`${fileBaseName}.pdf`);
      setBoardRuntimeFeedback({ tone: "success", message: `Se exportó ${selectedCustomBoard.name} a PDF.` });
    } catch {
      setBoardRuntimeFeedback({ tone: "danger", message: "No se pudo exportar el tablero a PDF." });
    }
  }

  function getBoardFieldValue(board, row, field) {
    const values = row.values || {};
    const rawValue = values[field.id];

    if (field.type === "inventoryProperty") {
      const lookupId = values[field.sourceFieldId];
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
    return BOARD_FIELD_WIDTH_STYLES[field.width] || BOARD_FIELD_WIDTH_STYLES.md;
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

  function getFieldColorRule(field, value) {
    return (field.colorRules || []).find((rule) => {
      const normalizedValue = normalizeKey(value);
      const normalizedRuleValue = normalizeKey(rule.value);
      const valueList = parseRuleValueList(rule.value);

      if (rule.operator === "isEmpty") return isEmptyRuleValue(value);
      if (rule.operator === "isNotEmpty") return !isEmptyRuleValue(value);
      if (rule.operator === "isTrue") return isTruthyRuleValue(value);
      if (rule.operator === "isFalse") return isFalsyRuleValue(value);
      if (rule.operator === "equals") return normalizedValue === normalizedRuleValue;
      if (rule.operator === "notEquals") return normalizedValue !== normalizedRuleValue;
      if (rule.operator === ">=") return compareRuleValues(value, rule.value) >= 0;
      if (rule.operator === "<=") return compareRuleValues(value, rule.value) <= 0;
      if (rule.operator === ">") return compareRuleValues(value, rule.value) > 0;
      if (rule.operator === "<") return compareRuleValues(value, rule.value) < 0;
      if (rule.operator === "contains") return normalizedValue.includes(normalizedRuleValue);
      if (rule.operator === "notContains") return !normalizedValue.includes(normalizedRuleValue);
      if (rule.operator === "startsWith") return normalizedValue.startsWith(normalizedRuleValue);
      if (rule.operator === "endsWith") return normalizedValue.endsWith(normalizedRuleValue);
      if (rule.operator === "inList") return valueList.includes(normalizedValue);
      if (rule.operator === "notInList") return !valueList.includes(normalizedValue);
      return false;
    }) || null;
  }

  function submitPasswordReset() {
    if (!passwordForm.password || passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordForm((current) => ({ ...current, message: "Las contraseñas no coinciden o están vacías." }));
      return;
    }
    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === currentUser?.id ? { ...user, password: passwordForm.password } : user)),
    }));
    setPasswordForm({ password: "", confirmPassword: "", message: "Contraseña actualizada. Redirección lógica completada." });
  }

  function openResetUserPassword(user) {
    if (!actionPermissions.resetPasswords) return;
    setResetUserPasswordModal({
      open: true,
      userId: user.id,
      password: "",
      message: "",
    });
  }

  function submitUserPasswordReset() {
    if (!canResetOtherPasswords || !actionPermissions.resetPasswords || !resetUserPasswordModal.userId || !resetUserPasswordModal.password.trim()) {
      setResetUserPasswordModal((current) => ({ ...current, message: "Escribe una contraseña válida." }));
      return;
    }

    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === resetUserPasswordModal.userId ? { ...user, password: resetUserPasswordModal.password.trim() } : user)),
    }));
    setResetUserPasswordModal({ open: false, userId: null, password: "", message: "" });
  }

  const pageTitle = {
    [PAGE_BOARD]: "Tableros creados",
    [PAGE_CUSTOM_BOARDS]: "Mis tableros",
    [PAGE_ADMIN]: "Panel de administración",
    [PAGE_DASHBOARD]: "Dashboard de métricas",
    [PAGE_HISTORY]: "Historial de semanas",
    [PAGE_INVENTORY]: "Inventario",
    [PAGE_USERS]: "Administrador",
    [PAGE_NOT_FOUND]: "Página no encontrada",
  }[page];

  if (isBootstrapMasterSession) {
    return <BootstrapLeadSetup setupForm={bootstrapLeadForm} onChange={updateBootstrapLeadField} onSubmit={handleCreateFirstLead} error={bootstrapLeadError} areaOptions={departmentOptions} onAddArea={handleAddAreaToBootstrap} />;
  }

  if (!currentUser) {
    return <LoginScreen loginForm={loginForm} onChange={updateLoginField} onSubmit={handleLogin} error={loginError} demoUsers={loginDirectory.system?.masterBootstrapEnabled ? [{ id: BOOTSTRAP_MASTER_ID, role: "Usuario maestro", email: loginDirectory.system?.masterUsername || MASTER_USERNAME }] : loginDirectory.demoUsers} />;
  }

  return (
    <main className={`warehouse-app ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
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
            <p className="eyebrow">{page === PAGE_DASHBOARD ? "Panel principal" : page === PAGE_USERS ? "Control de accesos" : "Operación diaria"}</p>
            <h2>{page === PAGE_DASHBOARD ? "Dashboard" : pageTitle}</h2>
            {page === PAGE_DASHBOARD ? <span className="dashboard-header-subtitle">Vista en tiempo real · {activeWeek?.name || "Semana actual"}</span> : null}
          </div>
          <div className="header-meta">
            <span>{new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(now))}</span>
            <span>{syncStatus}</span>
            <strong>{currentUser.role}</strong>
          </div>
        </header>

        {page === PAGE_BOARD ? (
          <section className="page-grid created-boards-page">
            <article className="admin-hero-card full-width">
              <div>
                <h3>Tableros creados</h3>
                <p>Consulta todos los tableros visibles, su dueño, su creador y entra directo a operarlos en Mis tableros.</p>
              </div>
              <span className="chip success">{visibleControlBoards.length} visibles</span>
            </article>

            <div className="created-board-grid full-width">
              {visibleControlBoards.length ? visibleControlBoards.map((board) => (
                <article key={board.id} className="created-board-card surface-card">
                  <div>
                    <strong>{board.name}</strong>
                    <p>{board.description || "Sin descripción."}</p>
                  </div>
                  <div className="saved-board-list">
                    <span className="chip primary">Campos: {(board.fields || []).length}</span>
                    <span className="chip">Filas: {(board.rows || []).length}</span>
                  </div>
                  <div className="board-meta-inline">
                    <span>Asociado principal · {userMap.get(board.ownerId)?.name || "N/A"}</span>
                    <span>Creó · {userMap.get(board.createdById)?.name || "N/A"}</span>
                    {(board.accessUserIds || []).length ? <span>Acceso · {(board.accessUserIds || []).map((userId) => userMap.get(userId)?.name || "N/A").join(", ")}</span> : null}
                  </div>
                  <div className="toolbar-actions">
                    <button type="button" className="primary-button" onClick={() => {
                      setSelectedCustomBoardId(board.id);
                      setPage(PAGE_CUSTOM_BOARDS);
                    }}>
                      <LayoutDashboard size={16} /> Abrir en Mis tableros
                    </button>
                    {actionPermissions.duplicateBoard && canDoBoardAction(currentUser, board) ? (
                      <button type="button" className="icon-button" onClick={() => duplicateBoardRecord(board)}>
                        <Copy size={15} /> Duplicar
                      </button>
                    ) : null}
                    {actionPermissions.duplicateBoardWithRows && canDoBoardAction(currentUser, board) ? (
                      <button type="button" className="icon-button" onClick={() => duplicateBoardRecord(board, true)}>
                        <Copy size={15} /> Duplicar con filas
                      </button>
                    ) : null}
                    {actionPermissions.saveBoard && canEditBoard(currentUser, board) ? (
                      <button type="button" className="icon-button" onClick={() => openEditBoardBuilder(board)}>
                        <Pencil size={15} /> Editar tablero
                      </button>
                    ) : null}
                    {actionPermissions.deleteBoard && canEditBoard(currentUser, board) ? (
                      <button type="button" className="icon-button danger" onClick={() => setDeleteBoardId(board.id)}>
                        <Trash2 size={15} /> Eliminar tablero
                      </button>
                    ) : null}
                  </div>
                </article>
              )) : (
                <article className="surface-card empty-state full-width">
                  <LayoutDashboard size={44} />
                  <h3>No hay tableros visibles</h3>
                  <p>Crea un tablero desde el constructor o asigna acceso para empezar.</p>
                </article>
              )}
            </div>
          </section>
        ) : null}

        {page === PAGE_CUSTOM_BOARDS ? (
          <section className="admin-page-layout">
            {visibleControlBoards.length > 1 ? (
              <article className="surface-card full-width board-selector-card">
                <div className="builder-template-toolbar board-selector-toolbar">
                  <label className="app-modal-field builder-card builder-card-wide">
                    <span>Buscar tablero</span>
                    <input value={customBoardSearch} onChange={(event) => setCustomBoardSearch(event.target.value)} placeholder="Nombre, descripción o dueño" />
                  </label>
                  <label className="board-top-select min-width">
                    <span>Menú de tableros</span>
                    <select value={selectedCustomBoard?.id || ""} onChange={(event) => setSelectedCustomBoardId(event.target.value)}>
                      {filteredVisibleControlBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            ) : null}

            {selectedCustomBoard ? (
              <>
                <div className="inventory-stat-grid custom-board-stat-grid">
                  <StatTile label="Filas" value={customBoardMetrics?.totalRows || 0} className="custom-board-stat-tile" />
                  <StatTile label="En curso" value={customBoardMetrics?.running || 0} tone="soft" className="custom-board-stat-tile" />
                  <StatTile label="Terminadas" value={customBoardMetrics?.completed || 0} tone="success" className="custom-board-stat-tile" />
                </div>

                <article className="surface-card full-width table-card admin-surface-card">
                  <div className="card-header-row">
                    <div>
                      <h3>{selectedCustomBoard.name}</h3>
                    </div>
                    <div className="toolbar-actions custom-board-toolbar-actions">
                      {filteredVisibleControlBoards.length > 1 ? (
                        <label className="board-top-select min-width">
                          <span>Tablero</span>
                          <select value={selectedCustomBoard.id} onChange={(event) => setSelectedCustomBoardId(event.target.value)}>
                            {filteredVisibleControlBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                          </select>
                        </label>
                      ) : null}
                      <div className="custom-board-actions-menu-shell" ref={customBoardActionsMenuRef}>
                        <button
                          type="button"
                          className="primary-button custom-board-add-row-button"
                          title="Nueva fila"
                          aria-label="Nueva fila"
                          onClick={() => createBoardRow(selectedCustomBoard.id)}
                          disabled={!selectedBoardActionPermissions.createBoardRow}
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button custom-board-menu-trigger"
                          aria-label="Abrir acciones del tablero"
                          aria-expanded={customBoardActionsMenuOpen}
                          onClick={() => setCustomBoardActionsMenuOpen((current) => !current)}
                        >
                          <Menu size={16} />
                        </button>
                        {customBoardActionsMenuOpen ? (
                          <div className="custom-board-actions-dropdown">
                            <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); exportSelectedBoardToExcel(); }} disabled={!selectedBoardActionPermissions.exportBoardExcel}>
                              Exportar Excel
                            </button>
                            <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); previewSelectedBoardPdf(); }} disabled={!selectedBoardActionPermissions.previewBoardPdf}>
                              Vista PDF
                            </button>
                            <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); exportSelectedBoardToPdf(); }} disabled={!selectedBoardActionPermissions.exportBoardPdf}>
                              Exportar PDF
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="board-meta-inline board-meta-inline-header">
                    <span>Creó · {userMap.get(selectedCustomBoard.createdById)?.name || "N/A"}</span>
                        <span>Asociado principal · {userMap.get(selectedCustomBoard.ownerId)?.name || "N/A"}</span>
                    {(selectedCustomBoard.accessUserIds || []).length ? <span>Acceso · {(selectedCustomBoard.accessUserIds || []).map((userId) => userMap.get(userId)?.name || "N/A").join(", ")}</span> : null}
                  </div>
                  {boardRuntimeFeedback.message ? <p className={boardRuntimeFeedback.tone === "danger" ? "validation-text" : "inline-success-message"}>{boardRuntimeFeedback.message}</p> : null}
                  <p className="required-legend"><span className="required-mark" aria-hidden="true">*</span> obligatorio</p>

                  <div className="table-wrap">
                    <table className="admin-table-clean">
                      <thead>
                        {selectedCustomBoardSections.length ? (
                          <tr>
                            {selectedCustomBoardSections.map((section) => (
                              <th key={section.name} colSpan={section.span} className="board-section-header-cell" style={{ backgroundColor: section.color }}>
                                {section.name}
                              </th>
                            ))}
                            {selectedCustomBoard.settings?.showAssignee !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Asociado</th> : null}
                            <th className="board-section-header-cell board-section-header-static" colSpan={1}>Seguimiento</th>
                            {selectedCustomBoard.settings?.showDates !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Tiempo</th> : null}
                            {selectedCustomBoard.settings?.showWorkflow !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Acciones</th> : null}
                          </tr>
                        ) : null}
                        <tr>
                          {(selectedCustomBoard.fields || []).map((field) => <th key={field.id} title={`${field.helpText || field.label}${field.required ? " · Obligatorio" : ""}`}>{renderBoardFieldLabel(field.label, field.required)}</th>)}
                          {selectedCustomBoard.settings?.showAssignee !== false ? <th>Asociado</th> : null}
                          <th>Estado</th>
                          {selectedCustomBoard.settings?.showDates !== false ? <th>Tiempo</th> : null}
                          {selectedCustomBoard.settings?.showWorkflow !== false ? <th>Acciones</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedCustomBoard.rows || []).map((row) => {
                          const rowCaptureEnabled = canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                          const rowWorkflowEnabled = canOperateBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                          const rowDeleteEnabled = row.status !== STATUS_FINISHED && canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                          const isFinishedRow = row.status === STATUS_FINISHED;
                          const canStartRow = row.status === STATUS_PENDING || row.status === STATUS_PAUSED;
                          const canPauseRow = row.status === STATUS_RUNNING;
                          const canFinishRow = row.status === STATUS_RUNNING;
                          return (
                          <tr key={row.id}>
                            {(selectedCustomBoard.fields || []).map((field) => {
                              const value = getBoardFieldValue(selectedCustomBoard, row, field);
                              const rule = getFieldColorRule(field, value);
                              const style = rule ? { ...getBoardFieldCellStyle(field), backgroundColor: rule.color, color: rule.textColor || "inherit", borderRadius: "0.75rem", padding: "0.45rem 0.6rem", display: "inline-flex" } : getBoardFieldCellStyle(field);
                              const options = buildSelectOptions(field, state);

                              if (field.type === "inventoryLookup") {
                                return (
                                  <td key={field.id}>
                                    <InventoryLookupInput
                                      inventoryItems={state.inventoryItems || []}
                                      value={row.values?.[field.id] || ""}
                                      onChange={(nextValue) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, nextValue)}
                                      placeholder={field.placeholder || "Buscar por código o nombre"}
                                      style={getBoardFieldCellStyle(field)}
                                      title={field.helpText || field.label}
                                      disabled={!rowCaptureEnabled || isFinishedRow}
                                    />
                                  </td>
                                );
                              }

                              if (field.type === "select") {
                                return (
                                  <td key={field.id}>
                                    <select value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                      <option value="">Seleccionar...</option>
                                      {options.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                  </td>
                                );
                              }

                              if (field.type === "number") {
                                return <td key={field.id}><input type="number" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, Number(event.target.value || 0))} placeholder={field.placeholder || "Escribe un valor"} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                              }

                              if (field.type === "textarea") {
                                return <td key={field.id}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Escribe una nota"} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                              }

                              if (field.type === "date") {
                                return <td key={field.id}><input type="date" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                              }

                              if (field.type === "boolean") {
                                return (
                                  <td key={field.id}>
                                    <select value={row.values?.[field.id] || "No"} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                      <option value="Si">Sí</option>
                                      <option value="No">No</option>
                                    </select>
                                  </td>
                                );
                              }

                              if (field.type === "status") {
                                return (
                                  <td key={field.id}>
                                    <select value={row.values?.[field.id] || STATUS_PENDING} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                      <option value={STATUS_PENDING}>{STATUS_PENDING}</option>
                                      <option value={STATUS_RUNNING}>{STATUS_RUNNING}</option>
                                      <option value={STATUS_PAUSED}>{STATUS_PAUSED}</option>
                                      <option value={STATUS_FINISHED}>{STATUS_FINISHED}</option>
                                    </select>
                                  </td>
                                );
                              }

                              if (field.type === "user") {
                                return (
                                  <td key={field.id}>
                                    <select value={row.values?.[field.id] || row.responsibleId || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                      <option value="">Seleccionar usuario...</option>
                                      {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                    </select>
                                  </td>
                                );
                              }

                              if (field.type === "formula" || field.type === "inventoryProperty") {
                                return <td key={field.id}><span style={style}>{String(value || 0)}</span></td>;
                              }

                              return <td key={field.id}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Captura un valor"} style={rule ? { ...getBoardFieldCellStyle(field), backgroundColor: rule.color, color: rule.textColor || "inherit" } : getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                            })}
                            {selectedCustomBoard.settings?.showAssignee !== false ? (
                              <td>
                                <select value={row.responsibleId || ""} onChange={(event) => {
                                  if (!rowCaptureEnabled) return;
                                  updateBoardRow(selectedCustomBoard.id, row.id, (current) => ({ ...current, responsibleId: event.target.value }));
                                }} disabled={!rowCaptureEnabled}>
                                  {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                              </td>
                            ) : null}
                            <td><StatusBadge status={row.status || STATUS_PENDING} /></td>
                            {selectedCustomBoard.settings?.showDates !== false ? <td>{formatDurationClock(getElapsedSeconds(row, now))}</td> : null}
                            {selectedCustomBoard.settings?.showWorkflow !== false ? (
                              <td className="board-workflow-cell">
                                <div className="row-actions compact board-workflow-actions">
                                  {canStartRow ? (
                                    <button type="button" className="board-action-button start icon-only" title={row.status === STATUS_PAUSED ? "Reanudar" : "Iniciar"} aria-label={row.status === STATUS_PAUSED ? "Reanudar" : "Iniciar"} onClick={() => changeBoardRowStatus(selectedCustomBoard.id, row.id, STATUS_RUNNING)} disabled={!rowWorkflowEnabled}>
                                      <Play size={13} />
                                    </button>
                                  ) : null}
                                  {canPauseRow ? (
                                    <button type="button" className="board-action-button pause icon-only" title="Pausar" aria-label="Pausar" onClick={() => openBoardPauseModal(selectedCustomBoard.id, row.id)} disabled={!rowWorkflowEnabled}>
                                      <PauseCircle size={13} />
                                    </button>
                                  ) : null}
                                  {canFinishRow ? (
                                    <button type="button" className="board-action-button finish icon-only" title="Finalizar" aria-label="Finalizar" onClick={() => openFinishBoardRowConfirm(selectedCustomBoard.id, row.id)} disabled={!rowWorkflowEnabled}>
                                      <Square size={13} />
                                    </button>
                                  ) : null}
                                  {isFinishedRow ? (
                                    <button type="button" className="board-action-button finish icon-only static" title="Terminado" aria-label="Terminado" disabled>
                                      <Square size={13} />
                                    </button>
                                  ) : null}
                                  <button type="button" className={`board-action-button delete icon-only ${rowDeleteEnabled ? "enabled" : "locked"}`.trim()} title={rowDeleteEnabled ? "Eliminar fila" : "Las filas terminadas no se pueden eliminar"} aria-label={rowDeleteEnabled ? "Eliminar fila" : "Las filas terminadas no se pueden eliminar"} onClick={() => {
                                    if (!rowDeleteEnabled) return;
                                    setDeleteBoardRowState({ open: true, boardId: selectedCustomBoard.id, rowId: row.id });
                                  }} disabled={!rowDeleteEnabled}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                </article>
              </>
            ) : (
              <article className="surface-card empty-state">
                <LayoutDashboard size={44} />
                <h3>{visibleControlBoards.length ? "No se encontró un tablero con ese filtro" : "No tienes tableros asignados"}</h3>
                <p>{visibleControlBoards.length ? "Prueba con otro nombre en el buscador o limpia el filtro." : currentUser.role === ROLE_JR ? "Tu líder aún no te asigna un tablero." : "Crea un tablero desde el constructor para comenzar."}</p>
              </article>
            )}
          </section>
        ) : null}

        {page === PAGE_ADMIN ? (
          <section className="admin-page-layout">
            <article className="admin-hero-card">
              <div>
                <h3>Panel de Administración</h3>
                <p>Gestión central del catálogo, semanas, reportes y control operativo.</p>
              </div>
              <span className="chip success">Modo administrador</span>
            </article>

            <div className="admin-stat-strip">
              <StatTile label="Actividades activas" value={state.catalog.filter((item) => !item.isDeleted).length} />
              <StatTile label="Semanas registradas" value={state.weeks.length} tone="soft" />
              <StatTile label="Excesos detectados" value={adminReportRows.reduce((sum, row) => sum + row.excessCount, 0)} tone="danger" />
              <StatTile label="Tableros operativos" value={state.controlBoards.length} tone="success" />
            </div>

            <article className="surface-card admin-tabs full-width admin-tabs-shell">
              <div className="tab-strip">
                <button type="button" className={adminTab === "catalog" ? "tab active" : "tab"} onClick={() => setAdminTab("catalog")}>Catálogo de actividades</button>
                <button type="button" className={adminTab === "weeks" ? "tab active" : "tab"} onClick={() => setAdminTab("weeks")}>Gestión de semanas</button>
                <button type="button" className={adminTab === "reports" ? "tab active" : "tab"} onClick={() => setAdminTab("reports")}>Reportes avanzados</button>
                <button type="button" className={adminTab === "control" ? "tab active" : "tab"} onClick={() => setAdminTab("control")}>Control operativo</button>
              </div>
            </article>

            {adminTab === "catalog" ? (
              <article className="surface-card full-width table-card admin-surface-card">
                <div className="card-header-row">
                  <div>
                    <h3>Catálogo maestro de actividades</h3>
                    <p>Actividades reutilizables para semanas nuevas y reportes.</p>
                  </div>
                  <button type="button" className="primary-button" onClick={openCatalogCreate} disabled={!actionPermissions.manageCatalog}>
                    <Plus size={16} /> Agregar actividad
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="admin-table-clean">
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Tiempo límite</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.catalog.filter((item) => !item.isDeleted).map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.timeLimitMinutes} min</td>
                          <td>{item.isMandatory ? "Obligatoria" : "Ocasional"}</td>
                          <td><span className="chip success">Activa</span></td>
                          <td>
                            <div className="row-actions compact">
                              <button type="button" className="icon-button" onClick={() => openCatalogEdit(item)} disabled={!actionPermissions.manageCatalog}><Pencil size={15} /> Editar</button>
                              <button type="button" className="icon-button danger" onClick={() => softDeleteCatalog(item.id)} disabled={!actionPermissions.manageCatalog}><Trash2 size={15} /> Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ) : null}

            {adminTab === "weeks" ? (
              <article className="surface-card full-width table-card admin-surface-card">
                <div className="card-header-row">
                  <div>
                    <h3>Gestión de semanas</h3>
                    <p>Agrega actividades extra y depura cada semana operativa.</p>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="admin-table-clean">
                    <thead>
                      <tr>
                        <th>Semana</th>
                        <th>Fechas</th>
                        <th>Actividades</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.weeks.map((week) => (
                        <tr key={week.id}>
                          <td>{week.name}</td>
                          <td>{formatDate(week.startDate)} - {formatDate(week.endDate)}</td>
                          <td>{state.activities.filter((activity) => activity.weekId === week.id).length} actividades</td>
                          <td><span className={week.isActive ? "chip success" : "chip"}>{week.isActive ? "Activa" : "Cerrada"}</span></td>
                          <td>
                            <button type="button" className="icon-button" onClick={() => setEditWeekId(week.id)} disabled={!actionPermissions.manageWeeks}>
                              <Pencil size={15} /> Editar semana
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ) : null}

            {adminTab === "control" ? (
              <>
                <article className="surface-card board-builder-launch-card full-width admin-surface-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Studio de tableros</h3>
                      <p>Crea o edita tableros en un modal amplio con vista previa en vivo. Solo el creador o un Lead pueden editar un tablero ya creado.</p>
                    </div>
                    <button type="button" className="primary-button" onClick={openCreateBoardBuilder} disabled={!actionPermissions.saveBoard}>
                      <Plus size={16} /> Nuevo tablero
                    </button>
                  </div>
                  <div className="saved-board-list">
                    <span className="chip primary">Editables por ti: {editableVisibleBoards.length}</span>
                    <span className="chip">Plantillas visibles: {filteredBoardTemplates.length}</span>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {editableVisibleBoards.slice(0, 8).map((board) => (
                      <button key={board.id} type="button" className="icon-button" onClick={() => openEditBoardBuilder(board)}>
                        <Pencil size={14} /> {board.name}
                      </button>
                    ))}
                  </div>
                </article>
              </>
            ) : null}

            {adminTab === "__legacy_permissions__" && actionPermissions.managePermissions ? (
              <>
                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Presets rápidos</h3>
                      <p>Aplica una base completa y luego afina usuarios o departamentos si lo necesitas.</p>
                    </div>
                  </div>
                  <div className="saved-board-list permissions-preset-list">
                    {PERMISSION_PRESETS.map((preset) => (
                      <button key={preset.id} type="button" className="icon-button" onClick={() => applyPermissionPreset(preset.id)}>
                        <Settings size={15} /> {preset.label}
                      </button>
                    ))}
                  </div>
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Respaldo de reglas</h3>
                      <p>Exporta permisos globales y por tablero para moverlos o restaurarlos cuando lo necesites.</p>
                    </div>
                    <div className="toolbar-actions">
                      <input ref={permissionFileInputRef} type="file" accept="application/json,.json" className="inventory-file-input" onChange={handlePermissionImport} />
                      <button type="button" className="icon-button" onClick={exportPermissionRules}>
                        <Download size={15} /> Exportar JSON
                      </button>
                      <button type="button" className="icon-button" onClick={() => permissionFileInputRef.current?.click()}>
                        <Upload size={15} /> Importar JSON
                      </button>
                    </div>
                  </div>
                  {permissionsFeedback.message ? <p className={permissionsFeedback.tone === "danger" ? "validation-text" : "inline-success-message"}>{permissionsFeedback.message}</p> : null}
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Matriz rápida por rol</h3>
                      <p>Activa o desactiva acceso por rol sin entrar al detalle fino de usuarios o departamentos.</p>
                    </div>
                  </div>
                  <div className="table-wrap permissions-matrix-wrap">
                    <table className="admin-table-clean permissions-matrix-table">
                      <thead>
                        <tr>
                          <th>Pestaña</th>
                          {USER_ROLES.map((role) => <th key={role}>{role}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {NAV_ITEMS.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.label}</strong>
                            </td>
                            {USER_ROLES.map((role) => (
                              <td key={role}>
                                <input type="checkbox" checked={(normalizedPermissions.pages[item.id]?.roles || []).includes(role)} onChange={() => togglePermissionRole("pages", item.id, role)} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="table-wrap permissions-matrix-wrap">
                    <table className="admin-table-clean permissions-matrix-table">
                      <thead>
                        <tr>
                          <th>Acción</th>
                          {USER_ROLES.map((role) => <th key={role}>{role}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {ACTION_DEFINITIONS.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.label}</strong>
                              <span className="subtle-line">{item.category}</span>
                            </td>
                            {USER_ROLES.map((role) => (
                              <td key={role}>
                                <input type="checkbox" checked={(normalizedPermissions.actions[item.id]?.roles || []).includes(role)} onChange={() => togglePermissionRole("actions", item.id, role)} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Ajustes finos por pestaña</h3>
                      <p>Define quién puede ver cada área usando roles, asociados específicos o áreas completas.</p>
                    </div>
                  </div>
                  <div className="permissions-grid">
                    {NAV_ITEMS.map((item) => (
                      <article key={item.id} className="permission-entry-card">
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.id}</p>
                        </div>
                        <label className="app-modal-field">
                          <span>Roles</span>
                          <select multiple value={normalizedPermissions.pages[item.id]?.roles || []} onChange={(event) => updatePermissionEntry("pages", item.id, "roles", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                          </select>
                        </label>
                        <label className="app-modal-field">
                          <span>Asociados</span>
                          <select multiple value={normalizedPermissions.pages[item.id]?.userIds || []} onChange={(event) => updatePermissionEntry("pages", item.id, "userIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {state.users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                          </select>
                        </label>
                        <label className="app-modal-field">
                          <span>Áreas</span>
                          <select multiple value={normalizedPermissions.pages[item.id]?.departments || []} onChange={(event) => updatePermissionEntry("pages", item.id, "departments", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Ajustes finos por acción</h3>
                      <p>Controla qué acciones puede ejecutar cada asociado sin depender sólo del rol.</p>
                    </div>
                  </div>
                  <div className="permissions-grid">
                    {ACTION_DEFINITIONS.map((item) => (
                      <article key={item.id} className="permission-entry-card">
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.category}</p>
                        </div>
                        <label className="app-modal-field">
                          <span>Roles</span>
                          <select multiple value={normalizedPermissions.actions[item.id]?.roles || []} onChange={(event) => updatePermissionEntry("actions", item.id, "roles", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                          </select>
                        </label>
                        <label className="app-modal-field">
                          <span>Asociados</span>
                          <select multiple value={normalizedPermissions.actions[item.id]?.userIds || []} onChange={(event) => updatePermissionEntry("actions", item.id, "userIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {state.users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                          </select>
                        </label>
                        <label className="app-modal-field">
                          <span>Áreas</span>
                          <select multiple value={normalizedPermissions.actions[item.id]?.departments || []} onChange={(event) => updatePermissionEntry("actions", item.id, "departments", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                            {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                          </select>
                        </label>
                      </article>
                    ))}
                  </div>
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Asignación por tablero</h3>
                      <p>Selecciona qué asociados quedan asignados. Los asociados asignados pueden hacer todo dentro de ese tablero.</p>
                    </div>
                    {selectedPermissionBoard ? <span className="chip primary">{1 + (selectedPermissionBoard.accessUserIds || []).length} persona(s) con control</span> : null}
                  </div>
                  {selectedPermissionBoard ? (
                    <div className="permissions-board-shell">
                      <div className="builder-template-toolbar permissions-board-toolbar">
                        <label className="app-modal-field builder-card">
                          <span>Tablero</span>
                          <select value={selectedPermissionBoard.id} onChange={(event) => setSelectedPermissionBoardId(event.target.value)}>
                            {(state.controlBoards || []).map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                          </select>
                        </label>
                        <label className="app-modal-field builder-card permissions-toggle-card">
                          <span>Asociado principal</span>
                          <select value={selectedPermissionBoard.ownerId || ""} onChange={(event) => updateBoardAssignment(selectedPermissionBoard.id, "ownerId", event.target.value)}>
                            {activeAssignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                          </select>
                        </label>
                      </div>

                      <div className="permissions-grid">
                        <article className="permission-entry-card">
                          <div>
                            <strong>Personas asignadas</strong>
                            <p>Quien aparezca aquí podrá ver, capturar, editar, exportar y mover el flujo de este tablero.</p>
                          </div>
                          <label className="app-modal-field">
                            <span>Asociados con acceso total</span>
                            <select multiple value={selectedPermissionBoard.accessUserIds || []} onChange={(event) => updateBoardAssignment(selectedPermissionBoard.id, "accessUserIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                              {activeAssignableUsers.filter((user) => user.id !== selectedPermissionBoard.ownerId).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                          </label>
                          <div className="saved-board-list">
                            <span className="chip primary">Asociado principal: {userMap.get(selectedPermissionBoard.ownerId)?.name || "Sin asociado"}</span>
                            {(selectedPermissionBoard.accessUserIds || []).map((userId) => <span key={userId} className="chip success">Acceso total: {userMap.get(userId)?.name || "N/A"}</span>)}
                          </div>
                        </article>
                      </div>
                    </div>
                  ) : (
                    <p className="inline-message">Aún no hay tableros guardados para asignar personas.</p>
                  )}
                </article>

                <article className="surface-card full-width table-card admin-surface-card permissions-card">
                  <div className="card-header-row">
                    <div>
                      <h3>Auditoría reciente</h3>
                      <p>Revisa quién cambió permisos o plantillas y en qué momento lo hizo.</p>
                    </div>
                    <span className="chip primary">{filteredAuditLog.length} de {(state.auditLog || []).length} eventos</span>
                  </div>
                  <div className="builder-template-toolbar permissions-audit-toolbar">
                    <label className="app-modal-field builder-card">
                      <span>Usuario</span>
                      <select value={auditFilters.userId} onChange={(event) => setAuditFilters((current) => ({ ...current, userId: event.target.value }))}>
                        <option value="all">Todos</option>
                        {state.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                      </select>
                    </label>
                    <label className="app-modal-field builder-card">
                      <span>Ámbito</span>
                      <select value={auditFilters.scope} onChange={(event) => setAuditFilters((current) => ({ ...current, scope: event.target.value }))}>
                        <option value="all">Todos</option>
                        {Array.from(new Set((state.auditLog || []).map((entry) => entry.scope).filter(Boolean))).map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                      </select>
                    </label>
                    <label className="app-modal-field builder-card">
                      <span>Periodo</span>
                      <select value={auditFilters.period} onChange={(event) => setAuditFilters((current) => ({ ...current, period: event.target.value }))}>
                        <option value="all">Todo el historial</option>
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                      </select>
                    </label>
                    <label className="app-modal-field builder-card builder-card-wide">
                      <span>Buscar detalle</span>
                      <input value={auditFilters.search} onChange={(event) => setAuditFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Usuario, acción o detalle" />
                    </label>
                  </div>
                  <div className="table-wrap permissions-matrix-wrap">
                    <table className="admin-table-clean permissions-matrix-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Usuario</th>
                          <th>Ámbito</th>
                          <th>Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLog.slice(0, 40).map((entry) => (
                          <tr key={entry.id}>
                            <td>{formatDateTime(entry.createdAt)}</td>
                            <td>{entry.userName || userMap.get(entry.userId)?.name || "Sistema"}</td>
                            <td><span className="chip">{entry.scope}</span></td>
                            <td>{entry.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </>
            ) : null}
          </section>
        ) : null}

        {page === PAGE_DASHBOARD ? (
          <section className="dashboard-page">
            <div className="dashboard-topbar">
              <div>
                <h3>Dashboard COPMEC</h3>
                    <p>Vista ejecutiva consolidada por semana, quincena o mes, con lectura por asociado y por área.</p>
              </div>
              <div className="dashboard-topbar-actions">
                <button type="button" className="icon-button" onClick={() => setDashboardSectionsOpen({ executive: true, people: true, trends: true, causes: true, alerts: true })}>Expandir todo</button>
                <button type="button" className="icon-button" onClick={() => setDashboardSectionsOpen({ executive: false, people: false, trends: false, causes: false, alerts: false })}>Contraer todo</button>
              </div>
              <div className="dashboard-filter-panel">
                <div className="dashboard-filter-row">
                <label className="dashboard-filter-field">
                  <span>Periodo</span>
                  <select value={dashboardFilters.periodType} onChange={(event) => setDashboardFilters((current) => ({ ...current, periodType: event.target.value, periodKey: "all" }))}>
                    <option value="week">Semana</option>
                    <option value="fortnight">Quincena</option>
                    <option value="month">Mes</option>
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Rango</span>
                  <select value={dashboardFilters.periodKey} onChange={(event) => setDashboardFilters((current) => ({ ...current, periodKey: event.target.value }))}>
                    {dashboardPeriodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="dashboard-filter-field">
                  <span>Asociado</span>
                  <select value={dashboardFilters.responsibleId} onChange={(event) => setDashboardFilters((current) => ({ ...current, responsibleId: event.target.value }))}>
                    <option value="all">Todos los asociados</option>
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

            <DashboardSection title="Análisis por asociado" subtitle="Desempeño individual, carga y cumplimiento por persona." summary={`${dashboardResponsibleRows.length} asociados con métricas`} icon={Users} open={dashboardSectionsOpen.people} onToggle={() => setDashboardSectionsOpen((current) => ({ ...current, people: !current.people }))}>
              <div className="dashboard-main-grid">
                <article className="dashboard-panel dashboard-panel-wide">
                  <div className="dashboard-panel-header">
                    <h3>Tiempo Promedio por Asociado</h3>
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
                    <h3>Tendencia General por {getDashboardPeriodTypeLabel(dashboardFilters.periodType)}</h3>
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
        ) : null}

        {page === PAGE_HISTORY ? (
          <section className="history-page-layout">
            <article className="history-summary-card">
              <div>
                <h3>Historial de Semanas</h3>
                <p>Consulta semanas cerradas y revisa sus actividades sin editar información.</p>
              </div>
              <span className="chip">{state.weeks.length} semanas</span>
            </article>

            <div className="history-stat-strip">
              <StatTile label="Semanas activas" value={state.weeks.filter((week) => week.isActive).length} />
              <StatTile label="Semanas cerradas" value={state.weeks.filter((week) => !week.isActive).length} tone="soft" />
              <StatTile label="Actividades históricas" value={state.activities.filter((item) => item.weekId !== activeWeek?.id).length} tone="success" />
            </div>

            <section className="page-grid history-grid">
            <article className="surface-card table-card history-surface-card">
              <div className="card-header-row">
                <div>
                  <h3>Todas las semanas</h3>
                  <p>Consulta de solo lectura del histórico operativo.</p>
                </div>
                <span className="chip">{state.weeks.length} semanas registradas</span>
              </div>
              <div className="table-wrap">
                <table className="history-table-clean">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Fechas</th>
                      <th>Actividades</th>
                      <th>Completadas</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.weeks.map((week) => {
                      const weekRows = state.activities.filter((activity) => activity.weekId === week.id);
                      const completed = weekRows.filter((activity) => activity.status === STATUS_FINISHED).length;
                      return (
                        <tr key={week.id}>
                          <td>{week.name}</td>
                          <td>{formatDate(week.startDate)} - {formatDate(week.endDate)}</td>
                          <td>{weekRows.length}</td>
                          <td>{completed}</td>
                          <td><span className={week.isActive ? "chip success" : "chip"}>{week.isActive ? "Activa" : "Histórica"}</span></td>
                          <td><button type="button" className="icon-button" onClick={() => setSelectedHistoryWeekId(week.id)}><Search size={15} /> Ver detalle</button></td>
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
                  <h3>{historyWeek?.name || "Selecciona una semana"}</h3>
                  <p>Vista de solo lectura del desempeño semanal.</p>
                </div>
              </div>
              {historyWeek ? (
                <>
                  <div className="metric-grid three-up">
                    <MetricCard label="Tiempo total efectivo" value={formatMinutes(state.activities.filter((item) => item.weekId === historyWeek.id).reduce((sum, item) => sum + item.accumulatedSeconds, 0) / 60)} hint="Suma total de la semana" />
                    <MetricCard label="Actividades completadas" value={String(state.activities.filter((item) => item.weekId === historyWeek.id && item.status === STATUS_FINISHED).length)} hint="Terminadas en la semana" />
                    <MetricCard label="Fuera de tiempo límite" value={String(state.activities.filter((item) => item.weekId === historyWeek.id && item.accumulatedSeconds > getTimeLimitMinutes(item, catalogMap) * 60).length)} hint="Desviaciones detectadas" tone="danger" />
                  </div>

                  <div className="table-wrap compact-table">
                    <table className="history-table-clean">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Actividad</th>
                          <th>Asociado</th>
                          <th>Estado</th>
                          <th>Inicio</th>
                          <th>Fin</th>
                          <th>Tiempo</th>
                          <th>Límite</th>
                          <th>Pausas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.activities.filter((item) => item.weekId === historyWeek.id).map((activity) => (
                          <tr key={activity.id}>
                            <td>{formatDate(activity.activityDate)}</td>
                            <td>{getActivityLabel(activity, catalogMap)}</td>
                            <td title={userMap.get(activity.responsibleId)?.name || "Sin asociado"}>{userMap.get(activity.responsibleId)?.name || "Sin asociado"}</td>
                            <td><StatusBadge status={activity.status} /></td>
                            <td>{formatTime(activity.startTime)}</td>
                            <td>{formatTime(activity.endTime)}</td>
                            <td>{formatDurationClock(activity.accumulatedSeconds)}</td>
                            <td>{getTimeLimitMinutes(activity, catalogMap)} min</td>
                            <td><button type="button" className="icon-button" onClick={() => setHistoryPauseActivityId(activity.id)}>Ver pausas</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </article>
          </section>
          </section>
        ) : null}

        {page === PAGE_INVENTORY ? (
          <section className="inventory-page-layout">
            <article className="inventory-hero-card">
              <div>
                <h3>Inventario</h3>
                <p>Catálogo base de producto y presentación para operación y logística.</p>
              </div>
              <div className="inventory-hero-actions">
                <input ref={inventoryFileInputRef} type="file" accept=".csv,.xlsx,.xls" className="inventory-file-input" onChange={handleInventoryImport} />
                <button type="button" className="icon-button" onClick={downloadInventoryTemplate} disabled={!actionPermissions.importInventory}><Upload size={15} /> Plantilla Excel</button>
                <button type="button" className="icon-button" onClick={() => inventoryFileInputRef.current?.click()} disabled={!actionPermissions.importInventory}><Upload size={15} /> Importar CSV / Excel</button>
                <button type="button" className="primary-button" onClick={openCreateInventoryItem} disabled={!actionPermissions.manageInventory}><Plus size={16} /> Agregar artículo</button>
              </div>
            </article>

            {inventoryImportFeedback.message ? <p className={`inventory-import-feedback ${inventoryImportFeedback.tone}`}>{inventoryImportFeedback.message}</p> : null}

            <div className="inventory-stat-grid">
              <StatTile label="Artículos registrados" value={inventoryStats.total} />
              <StatTile label="Piezas por caja" value={inventoryStats.totalPiecesPerBox} tone="soft" />
              <StatTile label="Cajas por tarima" value={inventoryStats.totalBoxesPerPallet} tone="success" />
            </div>

            <article className="surface-card inventory-surface-card">
              <div className="card-header-row">
                <div>
                  <h3>Base de inventario</h3>
                  <p>Código, presentación y conversión logística por artículo.</p>
                </div>
                <label className="users-search-field inventory-search-field">
                  <span>Buscar</span>
                  <div className="users-search-input-wrap">
                    <Search size={16} />
                    <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Buscar por código o nombre..." />
                  </div>
                </label>
                {inventorySearch ? (
                  <button type="button" className="icon-button" onClick={() => setInventorySearch("")}>
                    <RotateCcw size={15} /> Limpiar búsqueda
                  </button>
                ) : null}
              </div>

              {!inventoryItems.length ? (
                <div className="empty-state inventory-empty-state">
                  <Package size={42} />
                  <h3>No hay coincidencias en inventario</h3>
                  <p>Ajusta la búsqueda o registra un artículo nuevo para continuar.</p>
                  <button type="button" className="primary-button" onClick={openCreateInventoryItem}>
                    <Plus size={16} /> Agregar artículo
                  </button>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="inventory-table-clean">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Presentación</th>
                        <th>Piezas por caja</th>
                        <th>Cajas por tarima</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.map((item) => (
                        <tr key={item.id}>
                          <td><span className="inventory-code-badge">{item.code}</span></td>
                          <td>{item.name}</td>
                          <td>{item.presentation}</td>
                          <td>{item.piecesPerBox}</td>
                          <td>{item.boxesPerPallet}</td>
                          <td>
                            <div className="row-actions compact">
                              <button type="button" className="icon-button" onClick={() => openEditInventoryItem(item)} disabled={!actionPermissions.manageInventory}><Pencil size={15} /> Editar</button>
                              <button type="button" className="icon-button danger" onClick={() => setDeleteInventoryId(item.id)} disabled={!actionPermissions.manageInventory}><Trash2 size={15} /> Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {page === PAGE_USERS ? (
          <section className="users-page-layout">
            <article className="users-hero-card">
              <div>
                <h3>Administrador</h3>
                <p>Gestiona asociados, accesos y permisos directos por persona desde un solo lugar.</p>
              </div>
              {creatableRoles.length ? <button type="button" className="primary-button" onClick={openCreateUser} disabled={!actionPermissions.manageUsers}><Plus size={16} /> Crear asociado</button> : null}
            </article>

          <section className="page-grid">
            <div className="users-stat-grid full-width">
              <StatTile label="Total asociados" value={userStats.total} />
              <StatTile label="Asociados activos" value={userStats.active} tone="success" />
              <StatTile label="Administradores" value={userStats.admins} tone="soft" />
              <StatTile label="Inactivos" value={userStats.inactive} tone="danger" />
            </div>

            <article className="surface-card full-width table-card users-surface-card">
              <div className="card-header-row">
                <div>
                  <h3>Asociados bajo tu control</h3>
                  <p>Crea y administra únicamente los perfiles que tu rol interno puede delegar.</p>
                </div>
                <span className="chip primary">{filteredUsers.length} visibles</span>
              </div>

              <div className="filter-bar inline-toolbar users-toolbar">
                <label className="users-search-field">
                  <span>Buscar</span>
                  <div className="users-search-input-wrap">
                    <Search size={16} />
                    <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar asociado..." />
                  </div>
                </label>
                <label>
                  <span>Rol interno</span>
                  <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                    <option>Todos los roles</option>
                    {USER_ROLES.map((role) => <option key={role}>{role}</option>)}
                  </select>
                </label>
              </div>

              <div className="table-wrap">
                <table className="users-table-clean">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cargo</th>
                      <th>Área</th>
                      <th>Rol interno</th>
                      <th>Reporta a</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                            <div>
                              <strong>{user.name.toUpperCase()}</strong>
                              <span className="subtle-line">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>{getUserJobTitle(user) || "Sin cargo"}</td>
                        <td>{getUserArea(user) || "Sin área"}</td>
                        <td><span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span></td>
                        <td>{userMap.get(user.managerId)?.name || "Sin líder"}</td>
                        <td>
                          <button type="button" className={user.isActive ? "user-status-toggle active" : "user-status-toggle"} onClick={() => toggleUserActive(user.id)}>
                            <span className="user-status-dot" />
                            {user.isActive ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td>
                          <div className="row-actions compact">
                            <button type="button" className="user-row-button" onClick={() => openEditUser(user)} disabled={!actionPermissions.manageUsers}><Pencil size={15} /> Editar</button>
                            <button type="button" className="user-row-button danger" onClick={() => setDeleteUserId(user.id)} disabled={!actionPermissions.deleteUsers}><Trash2 size={15} /> Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="users-table-footer">
                <span>Mostrando asociados visibles para tu jerarquía</span>
                <span>{currentUser.role} · Control delegado</span>
              </div>
            </article>
          </section>
          </section>
        ) : null}

        {page === PAGE_NOT_FOUND ? (
          <section className="page-grid narrow-page">
            <article className="surface-card form-card not-found-card">
              <h3>404</h3>
              <p>Página no encontrada</p>
              <span>Lo sentimos, la página que busca no existe o se ha movido.</span>
              <button type="button" className="primary-button" onClick={() => setPage(PAGE_DASHBOARD)}>Ir a casa</button>
            </article>
          </section>
        ) : null}
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

      <Modal open={catalogModal.open} title={catalogModal.mode === "create" ? "Nueva actividad" : "Editar actividad"} confirmLabel={catalogModal.mode === "create" ? "Guardar" : "Guardar cambios"} cancelLabel="Cancelar" onClose={() => setCatalogModal({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true" })} onConfirm={submitCatalogModal}>
        <div className="modal-form-grid">
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
        </div>
      </Modal>

      <Modal open={areaModal.open} title="Agregar área" confirmLabel="Guardar área" cancelLabel="Cancelar" onClose={() => setAreaModal({ open: false, target: "user", name: "", error: "" })} onConfirm={confirmAddArea}>
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

      <Modal open={userModal.open} className="user-management-modal" title={userModal.mode === "create" ? "Crear nuevo asociado" : "Editar asociado"} confirmLabel={userModal.mode === "create" ? "Guardar asociado" : "Guardar cambios"} cancelLabel="Cancelar" onClose={closeUserModal} onConfirm={submitUserModal}>
        <div className="modal-form-grid">
          <div className="user-modal-grid">
            <label className="app-modal-field">
              <span>Nombre completo</span>
              <input value={userModal.name} onChange={(event) => setUserModal((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="app-modal-field">
              <span>Correo</span>
              <input value={userModal.email} onChange={(event) => setUserModal((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="app-modal-field">
              <span>Área</span>
              <div className="area-selector-row">
                <select value={userModal.area} onChange={(event) => setUserModal((current) => ({ ...current, area: event.target.value }))}>
                  <option value="">Seleccionar área...</option>
                  {userAreaOptions.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                {currentUser?.role === ROLE_LEAD ? <button type="button" className="icon-button area-add-button" onClick={() => {
                  const nextArea = handleAddAreaOption();
                  if (nextArea) {
                    setUserModal((current) => ({ ...current, area: nextArea }));
                  }
                }} aria-label="Agregar nueva área"><Plus size={16} /></button> : null}
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
              <span>Reporta a</span>
              <select value={userModal.managerId} onChange={(event) => setUserModal((current) => ({ ...current, managerId: event.target.value }))}>
                <option value="">Seleccionar...</option>
                {activeAssignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label className="app-modal-field">
              <span>Contraseña</span>
              <input value={userModal.password} onChange={(event) => setUserModal((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label className="app-modal-field">
              <span>Estado inicial</span>
              <select value={userModal.isActive} onChange={(event) => setUserModal((current) => ({ ...current, isActive: event.target.value }))}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </label>
          </div>

          {actionPermissions.managePermissions && supportsManagedPermissionOverrides(userModal.role) ? (
            <section className="user-modal-permissions">
              <div className="builder-section-head">
                <div>
                  <h4>Permisos directos</h4>
                  <p>Configura aquí los accesos puntuales de este asociado sin salir del modal.</p>
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

          {!supportsManagedPermissionOverrides(userModal.role) ? (
            <article className="user-permission-note">
              <strong>{userModal.role === ROLE_SSR ? "Semi-Senior con alcance operativo" : "Acceso operativo por tablero"}</strong>
              <p>{userModal.role === ROLE_SSR ? "Semi-Senior solo puede crear asociados Junior y trabajar con los tableros que tenga asignados." : "Junior solo entra a Mis tableros y verá únicamente los tableros que le asignen."}</p>
            </article>
          ) : null}
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
                        <option value="users">Asociados específicos</option>
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
                        <span>Asociados con acceso</span>
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
        onDuplicateDraftColumn={duplicateDraftColumn}
        onEditDraftColumn={editDraftColumn}
        onRemoveDraftColumn={removeDraftColumn}
        visibleUsers={visibleUsers}
        currentUser={currentUser}
        userMap={userMap}
        inventoryItems={state.inventoryItems}
        canSaveTemplate={actionPermissions.saveTemplate}
        canSaveBoard={actionPermissions.saveBoard}
      />

      <BoardComponentStudioModal open={componentStudioOpen} mode={editingDraftColumnId ? "edit" : "create"} draft={controlBoardDraft} onChange={setControlBoardDraft} onClose={() => { setComponentStudioOpen(false); setEditingDraftColumnId(null); setControlBoardDraft((current) => ({ ...current, ...createEmptyFieldDraft() })); }} onConfirm={addDraftColumn} catalog={state.catalog} inventoryItems={state.inventoryItems} visibleUsers={visibleUsers} />

      {profileModalOpen ? <EmployeeProfileModal currentUser={currentUser} passwordForm={passwordForm} onPasswordChange={setPasswordForm} onSubmit={submitPasswordReset} onUpdateIdentity={updateCurrentUserIdentity} onClose={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); }} onLogout={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); handleLogout(); }} /> : null}

      <Modal open={resetUserPasswordModal.open} title="Restablecer contraseña" confirmLabel="Guardar nueva clave" cancelLabel="Cancelar" onClose={() => setResetUserPasswordModal({ open: false, userId: null, password: "", message: "" })} onConfirm={submitUserPasswordReset}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Nueva contraseña</span>
            <input type="password" value={resetUserPasswordModal.password} onChange={(event) => setResetUserPasswordModal((current) => ({ ...current, password: event.target.value, message: "" }))} />
          </label>
          {resetUserPasswordModal.message ? <p className="validation-text">{resetUserPasswordModal.message}</p> : null}
                  <p className="modal-footnote">Solo Lead y Senior pueden restablecer la contraseña de otros asociados.</p>
        </div>
      </Modal>

      <Modal open={inventoryModal.open} title={inventoryModal.mode === "create" ? "Agregar artículo" : "Editar artículo"} confirmLabel={inventoryModal.mode === "create" ? "Guardar artículo" : "Guardar cambios"} cancelLabel="Cancelar" onClose={() => setInventoryModal({ open: false, mode: "create", id: null, code: "", name: "", presentation: "", piecesPerBox: "", boxesPerPallet: "" })} onConfirm={submitInventoryModal}>
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Código</span>
            <input value={inventoryModal.code} onChange={(event) => setInventoryModal((current) => ({ ...current, code: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Nombre</span>
            <input value={inventoryModal.name} onChange={(event) => setInventoryModal((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Presentación</span>
            <input value={inventoryModal.presentation} onChange={(event) => setInventoryModal((current) => ({ ...current, presentation: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Piezas por caja</span>
            <input type="number" value={inventoryModal.piecesPerBox} onChange={(event) => setInventoryModal((current) => ({ ...current, piecesPerBox: event.target.value }))} />
          </label>
          <label className="app-modal-field">
            <span>Cajas por tarima</span>
            <input type="number" value={inventoryModal.boxesPerPallet} onChange={(event) => setInventoryModal((current) => ({ ...current, boxesPerPallet: event.target.value }))} />
          </label>
        </div>
      </Modal>

      <Modal open={Boolean(deleteUserId)} title="Eliminar asociado" confirmLabel="Eliminar asociado" cancelLabel="Cancelar" onClose={() => setDeleteUserId(null)} onConfirm={() => deleteUser(deleteUserId)}>
        <p>Esta acción no se puede deshacer.</p>
        <p>Se perderá el acceso y los registros asociados quedarán sin responsabilidad asignada.</p>
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
