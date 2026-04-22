/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
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
import GestionIncidencias from "./paginas/GestionIncidencias";
import GestionUsuarios from "./paginas/GestionUsuarios";
import HistorialSemanas from "./paginas/HistorialSemanas";
import AuditoriasProcesos from "./paginas/AuditoriasProcesosCompact";
import MisTableros from "./paginas/MisTableros";
import PaginaNoEncontrada from "./paginas/PaginaNoEncontrada";
import PanelIndicadores from "./paginas/PanelIndicadores";
import TablerosCreados from "./paginas/TablerosCreados";
import BibliotecaPage from "./paginas/BibliotecaPage";
import copmecLogo from "./assets/copmec-logo.jpeg";
import "./App.css";


// â”€â”€ Modulos extraidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import {

  StatusBadge, MetricCard, InventoryStockBar, DashboardKpiCard, DashboardBarRow,

  DashboardRankItem, DashboardProgressMetric, DashboardParetoRow, DashboardCauseCard,

  DashboardSection, DashboardPieChart, DashboardColumnChart, DashboardLineChart,

  DashboardParetoChart, DashboardIshikawaDiagram, CopmecBrand, StatTile,

} from "./components/ComponentesDashboard";

import { LoginScreen, BootstrapLeadSetup } from "./components/ComponentesAutenticacion";

import { Sidebar, InventoryActivityConsumptionEditor } from "./components/BarraLateral";

import {

  createIdentityFormFromUser, EmployeeProfileSummarySection,

  EmployeeProfileDetailsSection, EmployeeProfilePasswordSection,

  EmployeeProfileMessages, EmployeeProfileModal, ForcedPasswordChangeModal,

} from "./components/PerfilEmpleado";

import {

  excelColumnLettersToIndex, parseSimpleExcelFormula, EXCEL_FUNCTION_DESCRIPTIONS,

  FORMULA_MEMORY_LS_KEY, loadFormulasMemory, lookupFormulaMemory, saveFormulaToMemory,

  classifyExcelFormula,

} from "./utils/utilidadesFormulas.js";

import {

  getExcelJsModule, normalizeArgbHex, getExcelCellColors,

  inferImportedFieldTypeFromSamples, getWorksheetHeaders, getCellTextValue,

  collectBoardStructureCellData, collectBoardStructureSheetData,

  buildImportedColorRules, buildImportedBoardFields, parseBoardStructureImportFile,

} from "./utils/utilidadesImportExcel.js";

// â”€â”€ Constantes globales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import {

  STORAGE_KEY, SIDEBAR_COLLAPSED_KEY, ACTIVE_PAGE_KEY, DASHBOARD_SECTIONS_KEY,

  NOTIFICATION_READ_KEY, NOTIFICATION_DELETED_KEY, NOTIFICATION_INBOX_KEY,

  EMPTY_OBJECT, BOOTSTRAP_MASTER_ID, MASTER_USERNAME, API_BASE_URL,

  ENABLE_LEGACY_WHOLE_STATE_SYNC,

  PAGE_BOARD, PAGE_CUSTOM_BOARDS, PAGE_ADMIN, PAGE_DASHBOARD, PAGE_HISTORY, PAGE_PROCESS_AUDITS,

  PAGE_INVENTORY, PAGE_USERS, PAGE_BIBLIOTECA, PAGE_INCIDENCIAS, PAGE_NOT_FOUND,

  PAGE_ROUTE_SLUGS, PAGE_ROUTE_ALIASES, EMPTY_LOGIN_DIRECTORY,

  ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR,

  STATUS_PENDING, STATUS_RUNNING, STATUS_PAUSED, STATUS_FINISHED,

  INVENTORY_DOMAIN_BASE, INVENTORY_DOMAIN_CLEANING, INVENTORY_DOMAIN_ORDERS,

  INVENTORY_MOVEMENT_RESTOCK, INVENTORY_MOVEMENT_CONSUME, INVENTORY_MOVEMENT_TRANSFER,

  CONTROL_STATUS_OPTIONS, USER_ROLES, PERMISSION_SCHEMA_VERSION, ROLE_LEVEL,

  TEMPORARY_PASSWORD_MIN_LENGTH, PROFILE_SELF_EDIT_LIMIT,

  DEFAULT_AREA_OPTIONS, DEFAULT_BOARD_SECTION_OPTIONS,

  INVENTORY_LOOKUP_LOGISTICS_FIELD, BOARD_ACTIVITY_LIST_FIELD,

  DEFAULT_JOB_TITLE_BY_ROLE, DASHBOARD_CHART_PALETTE, DEFAULT_DASHBOARD_SECTION_STATE,

  DEFAULT_ADMIN_TAB, ACTIVITY_FREQUENCY_OPTIONS, ACTIVITY_FREQUENCY_LABELS,

  ACTIVITY_FREQUENCY_DAY_OFFSETS,

  BOARD_FIELD_TYPES, BOARD_FIELD_TYPE_DETAILS, BOARD_FIELD_WIDTHS,

  COLOR_RULE_OPERATORS, BOARD_FIELD_WIDTH_STYLES, BOARD_FIELD_MIN_WIDTH_BY_TYPE,

  DEFAULT_BOARD_AUX_COLUMNS_ORDER, BOARD_AUX_COLUMN_DEFINITIONS, BOARD_AUX_COLUMN_IDS,

  BOARD_TEMPLATES, FORMULA_OPERATIONS, OPTION_SOURCE_TYPES, INVENTORY_PROPERTIES,

  INVENTORY_IMPORT_FIELD_ALIASES, INVENTORY_DOMAIN_OPTIONS, INVENTORY_MOVEMENT_OPTIONS,

  CLEANING_SITE_OPTIONS, DEFAULT_CLEANING_SITE,

  BOARD_OPERATIONAL_CONTEXT_NONE, BOARD_OPERATIONAL_CONTEXT_CLEANING_SITE,

  BOARD_OPERATIONAL_CONTEXT_CUSTOM, BOARD_OPERATIONAL_CONTEXT_OPTIONS,

  NAV_ITEMS, ACTION_DEFINITIONS, BOARD_PERMISSION_ACTION_IDS, BOARD_PERMISSION_ACTIONS,

  PAGE_ACTION_GROUPS, PERMISSION_PRESETS, RESPONSIBLE_VISUALS,

  ALL_PAGES, ALL_ACTION_IDS, ROLE_PERMISSION_MATRIX, KPI_STYLES,

} from "./utils/constantes.js";

// â”€â”€ Utilidades puras â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import {

  getInitialRouteState,

  toBoardAuxColumnToken, isBoardAuxColumnToken, getBoardAuxColumnIdFromToken,

  getBoardFields, getBoardVisibleAuxColumnIds, getBoardAuxColumnOrder,

  getNormalizedBoardColumnOrder, sortBoardFieldsByColumnOrder,

  syncBoardFieldOrderIntoColumnOrder, reorderBoardColumnOrderTokens, getOrderedBoardColumns,

  normalizeInventoryDomain, inventoryDomainUsesPresentation, inventoryDomainUsesPackagingMetrics,

  getInventoryPresentationLabel, getInventoryPresentationPlaceholder,

  getInventoryUnitPlaceholder, getInventoryStoragePlaceholder, getInventoryEntityLabel,

  normalizeCleaningSite, normalizeBoardOperationalContextType, normalizeBoardOperationalContextOptions,

  normalizeBoardOperationalContextLabel, normalizeBoardOperationalContextValue,

  normalizeInventoryActivityConsumptions, normalizeInventoryMovementType,

  buildInventoryTransferTargetKey, normalizeInventoryTransferTargetRecord,

  resolveInventorySourceStockUnits, normalizeInventoryItemRecord, normalizeInventoryMovementRecord,

  findInventoryTransferTarget, sumInventoryTransferTargetUnits, hasInventoryBalanceInput,

  getInventoryAllocatedUnits, getInventoryAvailableToTransfer, getComparableDateMs,

  formatInventoryTransferDestinationLabel, getInventorySavedStorageLocations,

  getInventorySavedTransferDestinations, getInventoryDefaultTransferDestination,

  getInventoryDeleteActionId, getInventoryManageActionId, getInventoryImportActionId,

  createInventoryModalState, createInventoryMovementModalState,

  createInventoryTransferConfirmModalState, readNotificationReadState,

  readNotificationDeletedState, readNotificationInboxState, formatNotificationTimestamp,

  createInventoryRestockModalState, inferFeedbackToneFromMessage,

  buildDefaultPermissions, hasExplicitOverrideValues, remapPermissionsModel,

  normalizePermissionEntry, normalizePermissions, buildBoardPermissions,

  normalizeBoardPermissions, buildPermissionsFromPreset,

  buildAuditEntry, appendAuditLog, makeId,

  SESSION_STORAGE_KEY, setSessionExpiredHandler, clearSessionExpiredHandler,

  requestJson, isSessionRequiredError, applyRemoteWarehouseState,

  createWarehouseEventSource, buildLoginDirectoryFromState,

  buildRouteQuery, buildRoutePath, normalizeAdminTab,

  normalizeActivityFrequency, getActivityFrequencyLabel,

  normalizeCatalogItemRecord, buildWeekActivitiesFromCatalogItem,

  isoAt, isStrongPassword, isTemporaryPassword, addDays,

  startOfWeek, endOfWeek, getBoardWeekStart, getBoardWeekEnd,

  formatBoardWeekKey, parseBoardWeekKey, getBoardWeekLabel, normalizeBoardWeeklyCycle,

  withDefaultBoardSettings, cloneBoardRowSnapshot, normalizeBoardHistorySnapshot,

  buildBoardHistorySnapshot, advanceBoardWeekKey, applyBoardWeeklyCutToState,

  startOfMonth, endOfMonth, startOfFortnight, endOfFortnight,

  getDashboardPeriodTypeLabel, getDashboardPeriodRange, getDashboardPeriodKey,

  formatDateRangeCompact, formatDashboardPeriodLabel,

  getDashboardFilterStartDate, getDashboardFilterEndDate,

  formatDate, formatTime, formatDateTime, formatDurationClock,

  formatMinutes, formatPercent, formatMetricNumber, getAuditPeriodMs,

  normalizeKey, buildPlayerAccessBase, buildUniquePlayerAccess, getIshikawaCategory,

  normalizeImportHeader, normalizeMeridiemHour, normalizeTimeValue24h,

  isEmptyRuleValue, parseComparableNumber, parseComparableDate,

  compareRuleValues, parseRuleValueList, isTruthyRuleValue, isFalsyRuleValue,

  doesFieldColorRuleMatch, getFieldColorRule,

  formatInventoryLookupLabel, isInventoryLookupFieldType, getInventoryLookupSourceFields,

  resolveInventoryPropertySourceFieldId, getInventoryBundleEditableFields,

  inferInventoryBundleFieldType, isBoardActivityListField, getBoardFieldDisplayType,

  buildInventoryBundleFields, buildUpdatedDraftColumns, findInventoryItemByQuery,

  createEmptyFieldDraft, createEmptyBoardDraft, cloneDraftColumns, createBoardDraftFromBoard,

  hasFieldDefaultValue, getFieldDefaultPreviewValue, getPreviewDateValue,

  getDirectPreviewSeedValue, getTextPreviewSeedValue, getTypedPreviewSeedValue,

  getPreviewFieldSeedValue, buildPreviewRowValues, buildBoardPreviewModel,

  buildDraftPreviewBoard, buildTemplatePreviewBoard,

  getTypedBoardPreviewValue, formatBoardPreviewValue,

  getBoardFieldTypeDescription, renderBoardFieldLabel,

  getProfileEditAvailabilityMessage, getHeaderEyebrowText,

  buildTemplateColumns, cloneBoardFields, cloneBoardFieldBundle,

  getBoardTemplateCategory, getTemplateFields, getTemplateFieldGroups, getTemplateFieldDetail,

  isBoardFieldValueFilled, getBoardSectionGroups, mapColumnToFieldDraft, getBoardFieldDefaultValue,

  toInventoryNumber, decodeCsvBuffer, parseCsvTextToObjects,

  triggerBrowserDownload, sanitizeImportedText, mapInventoryImportRow,

  parseInventoryImportFile, buildImportedBoardRowValuesPatch,

  buildBoardSavePayload, formatBoardExportFieldValue, downloadInventoryTemplateFile,

  getResponsibleVisual, getRoleBadgeClass, normalizeRole, canCreateRole,

  supportsManagedPermissionOverrides, createUserModalState, getManagedUserIds, normalizeAreaOption,

  splitAreaAndSubArea, joinAreaAndSubArea, getAreaRoot,

  normalizeBoardVisibilityType, normalizeBoardSharedDepartments, normalizeBoardAccessUserIds,

  getNormalizedBoardVisibility, getBoardAssignmentSummary, buildAreaCatalog,

  getUserArea, getUserJobTitle, hasLeadUser, normalizeUserRecord, canBypassSelfProfileEditLimit,

  canViewUserByAreaScope, userMatchesPermissionEntry, canAccessPage, canDoAction,

  canUserAccessTemplate, canManageBoard, canEditBoard, getBoardVisibleToUser,

  canDoBoardAction, canEditBoardRowRecord, canOperateBoardRowRecord,

  toSelectOption, buildSelectOptions, getWeekName, getActivityLabel,

  getTimeLimitMinutes, getElapsedSeconds,

  buildDemoUsers, buildSampleState, normalizeBoardRowValues, normalizeControlBoard,

  getNormalizedControlBoards, resolveHydratedWorkspaceCollection,

  buildNormalizedWarehouseState, normalizeWarehouseState, loadState,

  buildWeekActivities, buildStarterWorkspace, updateElapsedForFinish,

} from "./utils/utilidades.jsx";

// â”€â”€ Componentes menores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { AppToastStack, AppNotificationCenter } from "./components/Notificaciones.jsx";

import { InventoryLookupInput } from "./components/BuscadorInventario.jsx";
import { io } from "socket.io-client";
import ChatPro from "./components/ChatPro.jsx";
import { AlertModalProvider } from "./components/AlertModal.jsx";



const INITIAL_ROUTE_STATE = getInitialRouteState();


function App() { // NOSONAR
  const socketRef = useRef(null);
  const [socketConnectCount, setSocketConnectCount] = useState(0);
  const [socketResetKey, setSocketResetKey] = useState(0);
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState(() => {
    const urlPage = INITIAL_ROUTE_STATE.page;
    if (urlPage && urlPage !== PAGE_DASHBOARD) return urlPage;
    try {
      const saved = localStorage.getItem(ACTIVE_PAGE_KEY);
      return saved && PAGE_ROUTE_ALIASES[saved] ? PAGE_ROUTE_ALIASES[saved] : urlPage;
    } catch {
      return urlPage;
    }
  });
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
  const [pauseState, setPauseState] = useState({ open: false, activityId: null, reason: "", error: "", completed: false });
  const [boardPauseState, setBoardPauseState] = useState({ open: false, boardId: null, rowId: null, reason: "", error: "", completed: false });
  const [pieceDeductionModal, setPieceDeductionModal] = useState({ open: false, boardId: null, rowId: null, items: [] });
  const [catalogModal, setCatalogModal] = useState({ open: false, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: "General" });
  const [editWeekId, setEditWeekId] = useState(null);
  const [editWeekActivityId, setEditWeekActivityId] = useState("");
  const [historyPauseActivityId, setHistoryPauseActivityId] = useState(null);
  const [userModal, setUserModal] = useState(() => createUserModalState());
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [transferLeadTargetId, setTransferLeadTargetId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [resetUserPasswordModal, setResetUserPasswordModal] = useState({ open: false, userId: null, userName: "", password: "", message: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("Todos los roles");
  const [usersViewTab, setUsersViewTab] = useState("table");
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "", message: "" });
  const [areaModal, setAreaModal] = useState({ open: false, target: "user", name: "", parentArea: "", error: "" });
  const [controlBoardDraft, setControlBoardDraft] = useState(createEmptyBoardDraft);
  const [controlBoardFeedback, setControlBoardFeedback] = useState("");
  const [boardImportedRowsDraft, setBoardImportedRowsDraft] = useState([]);
  const [excelFormulaWizard, setExcelFormulaWizard] = useState({ open: false, items: [] });
  const [excelSheetSelector, setExcelSheetSelector] = useState({ open: false, sheets: [], fileName: "" });
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
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
    try { localStorage.setItem(ACTIVE_PAGE_KEY, page); } catch { /* noop */ }
  }, [page]);

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

      // Only check session if we previously stored a session marker.
      // This prevents a spurious 401 in the console when the user is not logged in.
      const hadSession = localStorage.getItem(SESSION_STORAGE_KEY) === "1";
      if (!hadSession) {
        if (active) {
          setSessionUserId("");
          isHydratedRef.current = true;
          setSyncStatus("Modo local");
          setIsAuthChecking(false);
        }
        return;
      }

      try {
        const session = await requestJson("/auth/session");
        if (!active) return;
        setSessionExpiredHandler(() => invalidateClientSession("Tu sesión expiró. Por favor inicia sesión nuevamente."));
        setSessionUserId(session.userId || "");
      } catch {
        if (active) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setSessionUserId("");
          isHydratedRef.current = true;
          setSyncStatus("Modo local");
        }
      } finally {
        if (active) setIsAuthChecking(false);
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
      const totalElapsedSeconds = row.startTime
        ? Math.max(durationSeconds, Math.floor((now - new Date(row.startTime).getTime()) / 1000))
        : durationSeconds;
      const pauseSeconds = Math.max(0, totalElapsedSeconds - durationSeconds);
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
        totalElapsedSeconds,
        limitMinutes: 0,
        excessSeconds: 0,
        pauseCount: pauseSeconds > 0 ? 1 : 0,
        pauseSeconds,
        pauseReasons: row.lastPauseReason ? [row.lastPauseReason] : [],
      };
    }));

    const historicalBoardRecords = dashboardVisibleBoardHistorySnapshots.flatMap((snapshot) => (snapshot.rows || []).map((row) => {
      const responsibleUser = userMap.get(row.responsibleId || snapshot.ownerId);
      const durationSeconds = getElapsedSeconds(row, now);
      const totalElapsedSeconds = row.startTime
        ? Math.max(durationSeconds, Math.floor((now - new Date(row.startTime).getTime()) / 1000))
        : durationSeconds;
      const pauseSeconds = Math.max(0, totalElapsedSeconds - durationSeconds);
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
        totalElapsedSeconds,
        limitMinutes: 0,
        excessSeconds: 0,
        pauseCount: pauseSeconds > 0 ? 1 : 0,
        pauseSeconds,
        pauseReasons: row.lastPauseReason ? [row.lastPauseReason] : [],
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
    const boardPauseSeconds = filteredDashboardRecords.filter((r) => r.source === "board").reduce((sum, r) => sum + (r.pauseSeconds || 0), 0);
    const allPauseSeconds = totalPauseSeconds + boardPauseSeconds;
    const totalProductionSeconds = filteredDashboardRecords.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
    const totalElapsedSeconds = filteredDashboardRecords.reduce((sum, r) => sum + (r.totalElapsedSeconds || r.durationSeconds || 0), 0);
    const globalEfficiency = totalElapsedSeconds > 0 ? (totalProductionSeconds / totalElapsedSeconds) * 100 : 100;
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
      pauseCount: dashboardPauseLogs.length + filteredDashboardRecords.filter((r) => r.source === "board" && r.pauseSeconds > 0).length,
      pauseHours: allPauseSeconds / 3600,
      productionHours: totalProductionSeconds / 3600,
      efficiency: globalEfficiency,
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

  // Todos los roles disponibles: base + personalizados
  const allRoles = useMemo(() => [
    ...USER_ROLES,
    ...(state.customRoles || []).map((r) => r.name),
  ], [state.customRoles]);

  const creatableRoles = useMemo(() => currentUser ? allRoles : [], [currentUser, allRoles]);

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

  // Root areas (no slash) for the first-level selector in the user modal
  const rootAreaOptions = useMemo(
    () => Array.from(new Set(departmentOptions.map((area) => getAreaRoot(area) || area))).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [departmentOptions],
  );

  // Sub-areas for a given root area
  const getSubAreaOptions = (rootArea) => {
    const normalizedRoot = normalizeAreaOption(rootArea);
    return departmentOptions
      .filter((area) => {
        const { area: r, subArea: s } = splitAreaAndSubArea(area);
        return r === normalizedRoot && Boolean(s);
      })
      .map((area) => splitAreaAndSubArea(area).subArea);
  };

  const userAreaOptions = useMemo(() => {
    if (!currentUser || currentUser.role === ROLE_LEAD) return departmentOptions;
    const actorRoot = getAreaRoot(getUserArea(currentUser));
    return departmentOptions.filter((area) => {
      const r = getAreaRoot(area);
      return !actorRoot || r === actorRoot;
    });
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

  function handleAddAreaOption(parentArea = "") {
    if (currentUser && currentUser.role !== ROLE_LEAD) {
      return;
    }
    setAreaModal({ open: true, target: "user", name: "", parentArea: parentArea || "", error: "" });
  }

  function handleAddAreaToBootstrap() {
    setAreaModal({ open: true, target: "bootstrap", name: "", parentArea: "", error: "" });
  }

  async function confirmAddArea() {
    const nextArea = areaModal.parentArea
      ? joinAreaAndSubArea(areaModal.parentArea, areaModal.name)
      : normalizeAreaOption(areaModal.name);
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
        body: JSON.stringify({ name: areaModal.name, parentArea: areaModal.parentArea || "" }),
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } catch (error) {
      setAreaModal((current) => ({ ...current, error: error?.message || "No se pudo agregar el área." }));
      return;
    }

    if (areaModal.target === "bootstrap") {
      setBootstrapLeadForm((current) => ({ ...current, area: nextArea }));
    } else {
      // If parentArea is set, we're adding a subArea → preserve the root area and select subArea in modal
      setUserModal((current) => ({
        ...current,
        area: areaModal.parentArea ? normalizeAreaOption(areaModal.parentArea) : nextArea,
        subArea: areaModal.parentArea ? normalizeAreaOption(areaModal.name) : "",
      }));
    }

    setAreaModal({ open: false, target: "user", name: "", parentArea: "", error: "" });
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
    if (!currentUser) return;
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
  const currentInventoryDeletePermission = actionPermissions[getInventoryDeleteActionId(inventoryTab)];
  const currentInventoryImportPermission = actionPermissions[getInventoryImportActionId(inventoryTab)];

  const canResetOtherPasswords = actionPermissions.resetPasswords;

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
      // Eventos de seguridad: solo en logs internos, no en notificaciones visibles
    }

    (state.bibliotecaNotifications || [])
      .slice(-20)
      .forEach((notif) => {
        const toneMap = { alta: "danger", media: "warning", baja: "success" };
        notifications.push({
          id: `biblioteca-notif-${notif.id}`,
          title:
            notif.priority === "alta"
              ? "🔴 Documento urgente en Biblioteca"
              : notif.priority === "media"
                ? "🟡 Nuevo documento en Biblioteca"
                : "📄 Documento disponible en Biblioteca",
          message: `${notif.authorName} subió "${notif.originalName}" en la sección ${notif.area}.`,
          meta: `Prioridad: ${notif.priority ? notif.priority.charAt(0).toUpperCase() + notif.priority.slice(1) : "Baja"}`,
          tone: toneMap[notif.priority] || "success",
          timestamp: notif.createdAt,
          targetPage: PAGE_BIBLIOTECA,
          isLocked: notif.priority === "alta",
          keepUntilResolved: notif.priority === "alta",
        });
      });

    // Notificaciones de incidencias asignadas al usuario actual
    (state.incidenciaNotifications || [])
      .slice(-50)
      .filter((notif) => notif.assignedToId === currentUser?.id)
      .forEach((notif) => {
        const prioTone = { critica: "danger", alta: "danger", media: "warning", baja: "success" };
        const prioEmoji = { critica: "🔴", alta: "🟠", media: "🟡", baja: "🟢" };
        notifications.push({
          id: `incidencia-notif-${notif.id}`,
          title: `${prioEmoji[notif.priority] || "⚠️"} Incidencia asignada a ti`,
          message: `"${notif.incidenciaTitle}" fue asignada por ${notif.assignedByName}.`,
          meta: `Prioridad: ${notif.priority ? notif.priority.charAt(0).toUpperCase() + notif.priority.slice(1) : "Media"}`,
          tone: prioTone[notif.priority] || "warning",
          timestamp: notif.createdAt,
          targetPage: PAGE_INCIDENCIAS,
          isLocked: notif.priority === "critica",
        });
      });

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
    state.bibliotecaNotifications,
    state.incidenciaNotifications,
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
    // Siempre muestra todos los roles; el control real es el permiso manageUsers
    const options = new Set(allRoles);
    if (userModal.mode === "edit" && userModal.role) options.add(userModal.role);
    return Array.from(options);
  }, [allRoles, currentUser, userModal.mode, userModal.role]);

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
    clearSessionExpiredHandler();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionUserId("");
    setProfileModalOpen(false);
    setPasswordForm({ password: "", confirmPassword: "", message: "" });
    setLoginError(message || "");
  }

  function handleConfirmPause() {
    if (pauseState.completed) {
      setPauseState({ open: false, activityId: null, reason: "", error: "", completed: false });
      return;
    }

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

    setPauseState((current) => ({
      ...current,
      error: "",
      completed: true,
    }));
  }

  function openBoardPauseModal(boardId, rowId) {
    const board = (state.controlBoards || []).find((item) => item.id === boardId);
    const row = board?.rows?.find((item) => item.id === rowId);
    if (!board || !row || !canOperateBoardRowRecord(currentUser, board, row, normalizedPermissions) || row.status !== STATUS_RUNNING) return;
    setBoardPauseState({ open: true, boardId, rowId, reason: "", error: "", completed: false });
  }

  function handleConfirmBoardPause() {
    if (boardPauseState.completed) {
      setBoardPauseState({ open: false, boardId: null, rowId: null, reason: "", error: "", completed: false });
      return;
    }

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
      setBoardPauseState((current) => ({
        ...current,
        error: "",
        completed: true,
      }));
    }).catch((error) => {
      setBoardPauseState((current) => ({ ...current, error: error?.message || "No se pudo pausar la fila." }));
    });
  }

  function openCatalogCreate(preferredCategory = "General") {
    const normalizedCategory = String(preferredCategory || "General").trim() || "General";
    setCatalogModal({ open: true, mode: "create", id: null, name: "", limit: "", mandatory: "true", frequency: "weekly", category: normalizedCategory });
  }

  function exportCatalogToCsv() {
    const items = state.catalog.filter((item) => !item.isDeleted);
    if (!items.length) return;
    const header = ["nombre", "lista", "frecuencia", "tiempo_limite_min", "tipo"].join(",");
    const rows = items.map((item) =>
      [
        `"${String(item.name || "").replace(/"/g, '""')}"`,
        `"${String(item.category || "General").replace(/"/g, '""')}"`,
        item.frequency || "weekly",
        String(item.timeLimitMinutes || 0),
        item.isMandatory ? "Obligatoria" : "Ocasional",
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalogo-actividades.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCatalogFromCsv(file) {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return;
    const headerLine = lines[0].toLowerCase().replace(/^\uFEFF/, "");
    const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const nameIdx = headers.findIndex((h) => h.includes("nombre") || h === "name");
    const catIdx = headers.findIndex((h) => h.includes("lista") || h.includes("categoria") || h.includes("category"));
    const freqIdx = headers.findIndex((h) => h.includes("frecuencia") || h === "frequency");
    const limitIdx = headers.findIndex((h) => h.includes("tiempo") || h.includes("limit") || h.includes("min"));
    const typeIdx = headers.findIndex((h) => h.includes("tipo") || h === "type" || h.includes("mandatory"));
    if (nameIdx === -1) return;

    function parseCsvRow(line) {
      const result = [];
      let inQuote = false;
      let current = "";
      for (const char of line) {
        if (char === '"') { inQuote = !inQuote; continue; }
        if (char === "," && !inQuote) { result.push(current); current = ""; continue; }
        current += char;
      }
      result.push(current);
      return result;
    }

    const validFrequencies = new Set(ACTIVITY_FREQUENCY_OPTIONS.map((o) => o.value));
    const freqByLabel = Object.fromEntries(ACTIVITY_FREQUENCY_OPTIONS.map((o) => [o.label.toLowerCase(), o.value]));

    const items = lines.slice(1).map((line) => {
      const cols = parseCsvRow(line);
      const name = String(cols[nameIdx] || "").trim();
      if (!name) return null;
      const category = catIdx >= 0 ? String(cols[catIdx] || "General").trim() || "General" : "General";
      const rawFreq = freqIdx >= 0 ? String(cols[freqIdx] || "weekly").trim().toLowerCase() : "weekly";
      const frequency = validFrequencies.has(rawFreq) ? rawFreq : (freqByLabel[rawFreq] || "weekly");
      const timeLimitMinutes = Math.max(0, Number(limitIdx >= 0 ? cols[limitIdx] : 0) || 0);
      const rawType = typeIdx >= 0 ? String(cols[typeIdx] || "").trim().toLowerCase() : "";
      const isMandatory = rawType === "obligatoria" || rawType === "true" || rawType === "1";
      return { name, category, frequency, timeLimitMinutes: timeLimitMinutes || 30, isMandatory, isDeleted: false };
    }).filter(Boolean);

    if (!items.length) return;

    let lastState = null;
    let importedCount = 0;
    for (const item of items) {
      const result = await requestJson("/warehouse/catalog", { method: "POST", body: JSON.stringify(item) });
      if (result?.data?.state) lastState = result.data.state;
      importedCount++;
    }
    if (lastState) {
      applyRemoteWarehouseState(lastState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    } else {
      const stateResult = await requestJson("/warehouse/state").catch(() => null);
      if (stateResult) applyRemoteWarehouseState(stateResult, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    }
    return importedCount;
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
      const shouldRefreshJobTitle = current.mode !== "create" && current.jobTitle === (DEFAULT_JOB_TITLE_BY_ROLE[current.role] || "");
      const nextDraft = {
        ...current,
        role: nextRole,
        jobTitle: shouldRefreshJobTitle ? (DEFAULT_JOB_TITLE_BY_ROLE[nextRole] || "") : current.jobTitle,
        permissionPageId: "",
      };

      if (current.mode === "create") {
        const isLead = normalizeRole(nextRole) === ROLE_LEAD;
        return {
          ...nextDraft,
          permissionOverrides: isLead
            ? { pages: Object.fromEntries(permissionPages.map((item) => [item.id, true])), actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, true])) }
            : { pages: {}, actions: {} },
        };
      }
      return {
        ...nextDraft,
        permissionOverrides: buildPermissionSelectionFromModalDraft(nextDraft),
      };
    });
  }

  function buildAllPermissionsOn() {
    return {
      pages: Object.fromEntries(permissionPages.map((item) => [item.id, true])),
      actions: Object.fromEntries(ACTION_DEFINITIONS.map((item) => [item.id, true])),
    };
  }

  function openCreateUser() {
    if (!actionPermissions.createUsers) return;
    const defaultRole = creatableRoles[0] || ROLE_JR;
    const currentUserAreaFull = getUserArea(currentUser);
    const { area: currentRootArea, subArea: currentSubArea } = splitAreaAndSubArea(currentUserAreaFull);
    const nextModal = createUserModalState({
      open: true,
      mode: "create",
      id: null,
      name: "",
      username: "",
      role: defaultRole,
      area: currentRootArea,
      subArea: currentSubArea,
      jobTitle: "",
      isActive: "true",
      password: "",
      managerId: currentUser?.id || "",
    });
    setUserModal({
      ...nextModal,
      permissionOverrides: normalizeRole(defaultRole) === ROLE_LEAD ? buildAllPermissionsOn() : { pages: {}, actions: {} },
    });
  }

  function openEditUser(user) {
    if (!actionPermissions.editUsers) return;
    const fullArea = getUserArea(user);
    const { area: rootArea, subArea } = splitAreaAndSubArea(fullArea);
    const nextModal = createUserModalState({
      open: true,
      mode: "edit",
      id: user.id,
      name: user.name,
      username: user.email,
      role: user.role,
      area: rootArea,
      subArea,
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
    const requiredPermission = userModal.mode === "create" ? actionPermissions.createUsers : actionPermissions.editUsers;
    if (!currentUser || !requiredPermission) return;
    const trimmedPassword = userModal.password.trim();
    const resolvedPlayerAccess = userModal.username.trim() || buildUniquePlayerAccess(
      userModal.name || userModal.role || "player",
      state.users || [],
      userModal.mode === "edit" ? userModal.id : null,
    );
    const fullArea = joinAreaAndSubArea(userModal.area, userModal.subArea);
    const payload = {
      name: userModal.name.trim(),
      username: resolvedPlayerAccess,
      role: userModal.role,
      area: fullArea,
      department: fullArea,
      jobTitle: userModal.jobTitle.trim(),
      isActive: userModal.isActive === "true",
      managerId: userModal.managerId || currentUser?.id || null,
      createdById: userModal.mode === "create" ? currentUser?.id || null : userModal.managerId || currentUser?.id || null,
      ...(userModal.mode === "create" ? { selfIdentityEditCount: 0 } : {}),
      permissionOverrides: userModal.permissionOverrides,
    };

    if (!payload.name || !payload.area || !payload.jobTitle) return;
    if (userModal.mode === "create" && supportsManagedPermissionOverrides(userModal.role)) {
      const pageValues = Object.values(userModal.permissionOverrides.pages || {});
      const actionValues = Object.values(userModal.permissionOverrides.actions || {});
      const hasAtLeastOnePermission = pageValues.concat(actionValues).some(Boolean);
      if (!hasAtLeastOnePermission) {
        pushAppToast("Asigna al menos un permiso antes de crear el player.", "danger");
        return;
      }
    }
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
      pushAppToast(
        userModal.mode === "create"
          ? `Player ${payload.name} creado correctamente.`
          : `Cambios de ${payload.name} guardados correctamente.`,
        "success",
      );
      closeUserModal();
    } catch (error) {
      pushAppToast(error?.message || "No se pudieron guardar los cambios. Intenta de nuevo.", "danger");
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
      telefono: String(identityPatch.telefono || "").trim(),
      telefono_visible: Boolean(identityPatch.telefono_visible),
      birthday: String(identityPatch.birthday || "").trim(),
    };
    if (!trimmedPatch.name || !trimmedPatch.area || !trimmedPatch.jobTitle) {
      return { ok: false, message: "Captura nombre, área y cargo para guardar el perfil del player." };
    }
    const hasChanges = [
      trimmedPatch.name !== String(currentUser.name || "").trim(),
      trimmedPatch.email !== String(currentUser.email || "").trim(),
      trimmedPatch.area !== getUserArea(currentUser),
      trimmedPatch.jobTitle !== getUserJobTitle(currentUser),
      trimmedPatch.telefono !== String(currentUser.telefono || "").trim(),
      trimmedPatch.telefono_visible !== Boolean(currentUser.telefono_visible),
      trimmedPatch.birthday !== String(currentUser.birthday || "").trim(),
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

  async function transferLead(targetUserId) {
    if (!targetUserId || normalizeRole(currentUser?.role) !== ROLE_LEAD) return;
    try {
      const result = await requestJson(`/warehouse/users/${targetUserId}/transfer-lead`, {
        method: "POST",
      });
      applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      setTransferLeadTargetId(null);
      pushAppToast("Rol de Lead transferido correctamente.", "success");
    } catch (error) {
      pushAppToast(error?.message || "No se pudo transferir el rol de Lead.", "danger");
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

  // ── Roles personalizados ──────────────────────────────────────────────────
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalName, setRoleModalName] = useState("");
  const [roleModalEditId, setRoleModalEditId] = useState(null);
  const [roleModalError, setRoleModalError] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);

  function openCreateRoleModal() {
    setRoleModalEditId(null);
    setRoleModalName("");
    setRoleModalError(null);
    setRoleModalOpen(true);
  }

  function openEditRoleModal(role) {
    setRoleModalEditId(role.id);
    setRoleModalName(role.name);
    setRoleModalError(null);
    setRoleModalOpen(true);
  }

  async function submitRoleModal() {
    if (!roleModalName.trim()) { setRoleModalError("El nombre no puede estar vacío."); return; }
    setRoleSaving(true);
    setRoleModalError(null);
    try {
      const result = roleModalEditId
        ? await requestJson(`/warehouse/roles/${roleModalEditId}`, { method: "PATCH", body: JSON.stringify({ name: roleModalName.trim() }) })
        : await requestJson("/warehouse/roles", { method: "POST", body: JSON.stringify({ name: roleModalName.trim() }) });
      if (!result.ok) throw new Error(result.message || "Error al guardar rol.");
      const savedRole = result.data;
      setState((prev) => {
        const prevRoles = prev.customRoles || [];
        const updated = roleModalEditId
          ? prevRoles.map((r) => r.id === roleModalEditId ? savedRole : r)
          : [...prevRoles, savedRole];
        return { ...prev, customRoles: updated };
      });
      setRoleModalOpen(false);
    } catch (err) {
      setRoleModalError(err.message);
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleDeleteCustomRole(roleId) {
    try {
      await requestJson(`/warehouse/roles/${roleId}`, { method: "DELETE" });
      setState((prev) => ({ ...prev, customRoles: (prev.customRoles || []).filter((r) => r.id !== roleId) }));
    } catch {
      // silencioso
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
      setPermissionsFeedback({ tone: "success", message: "Permiso actualizado correctamente." });
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
    const rowsToImport = boardImportedRowsDraft.slice(0, 500);
    const yesValues = new Set(["si", "sí", "true", "1", "yes", "y"]);

    const bulkRows = rowsToImport.map((importedRow) => {
      const values = buildImportedBoardRowValuesPatch(importedRow, payload.columns, visibleUsers, state.inventoryItems || [], yesValues);
      return { values };
    }).filter((item) => Object.keys(item.values).length > 0);

    if (!bulkRows.length) return initialState;

    const latestRemoteState = await requestJson(`/warehouse/boards/${createdBoardId}/rows/bulk`, {
      method: "POST",
      body: JSON.stringify({ rows: bulkRows }),
    });

    return latestRemoteState;
  }

  async function saveControlBoard() {
    const isEditing = boardBuilderModal.mode === "edit" && boardBuilderModal.boardId;
    const hasPermission = isEditing ? actionPermissions.editBoard : actionPermissions.createBoard;
    if (!currentUser || !hasPermission || !controlBoardDraft.name.trim() || !controlBoardDraft.columns.length) {
      setControlBoardFeedback("Agrega nombre, dueño y al menos un campo para guardar el tablero.");
      return;
    }

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
          message: `Se creó ${payload.name} y se importaron ${Math.min(boardImportedRowsDraft.length, 500)} fila(s) desde Excel.${boardImportedRowsDraft.length > 500 ? " Solo se importaron las primeras 500 por rendimiento." : ""}`,
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
    if (!actionPermissions.editBoard || !canEditBoard(currentUser, board)) return;
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
      customFields: Object.fromEntries(
        Object.entries(inventoryModal.customFields || {})
          .map(([key, value]) => [String(key || "").trim(), String(value || "").trim()])
          .filter(([key]) => key),
      ),
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
    if (!itemId || !actionPermissions[getInventoryDeleteActionId(item?.domain)]) return;
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
    localStorage.setItem(SESSION_STORAGE_KEY, "1");
    setSessionExpiredHandler(() => invalidateClientSession("Tu sesión expiró. Por favor inicia sesión nuevamente."));
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
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (_) {}
        socketRef.current = null;
      }
    try {
      await requestJson("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout transport errors and clear client session anyway.
    }
    clearSessionExpiredHandler();
    localStorage.removeItem(SESSION_STORAGE_KEY);
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
      localStorage.setItem(SESSION_STORAGE_KEY, "1");
      setSessionExpiredHandler(() => invalidateClientSession("Tu sesión expiró. Por favor inicia sesión nuevamente."));
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
        const snapshotNow = row.status === STATUS_FINISHED && row.endTime ? new Date(row.endTime).getTime() : Date.now();
        const prodSecs = getElapsedSeconds(row, snapshotNow);
        const totalSecs = row.startTime
          ? Math.max(prodSecs, Math.floor((snapshotNow - new Date(row.startTime).getTime()) / 1000))
          : prodSecs;
        const pauseSecs = Math.max(0, totalSecs - prodSecs);
        const efficiencyPct = totalSecs > 0 ? Math.round((prodSecs / totalSecs) * 100) : (row.startTime ? 100 : 0);
        exportRow["Tiempo de producción"] = formatDurationClock(prodSecs);
        exportRow["Tiempo acumulado"] = formatDurationClock(totalSecs);
        exportRow["Tiempo en pausa"] = formatDurationClock(pauseSecs);
        exportRow["Eficiencia"] = row.startTime ? `${efficiencyPct}%` : "";
        exportRow["Creado el"] = formatDateTime(row.createdAt);
      }

      return exportRow;
    });
  }

  async function duplicateBoardRecord(board, includeRows = false) {
    if (!board || !currentUser) return;
    if (!canDoBoardAction(currentUser, board)) return;
    if (!actionPermissions.duplicateBoardWithRows && !actionPermissions.duplicateBoard) return;

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

    // When starting a row, check if there are linked cleaning inventory items measured in piezas
    if (status === STATUS_RUNNING && row.status !== STATUS_RUNNING) {
      const activityCatalogId = row.catalogActivityId || null;
      if (activityCatalogId) {
        const pieceItems = (state.inventory || []).filter((invItem) => {
          if (invItem.isDeleted) return false;
          const unit = String(invItem.unitLabel || "").trim().toLowerCase();
          const isPieces = unit === "pzas" || unit === "piezas" || unit === "pz";
          if (!isPieces) return false;
          return (invItem.activityConsumptions || []).some((entry) => entry.catalogActivityId === activityCatalogId && Number(entry.quantity) > 0);
        });
        if (pieceItems.length) {
          setPieceDeductionModal({
            open: true,
            boardId,
            rowId,
            items: pieceItems.map((invItem) => {
              const consumption = invItem.activityConsumptions.find((entry) => entry.catalogActivityId === activityCatalogId);
              return { id: invItem.id, name: invItem.name, quantity: consumption?.quantity || 1, unit: invItem.unitLabel || "pzas", stock: invItem.stockUnits };
            }),
          });
          return;
        }
      }
    }

    executeBoardRowStatusChange(boardId, rowId, status);
  }

  function executeBoardRowStatusChange(boardId, rowId, status) {
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

  async function confirmPieceDeductionAndStart(deduct) {
    const { boardId, rowId, items } = pieceDeductionModal;
    setPieceDeductionModal({ open: false, boardId: null, rowId: null, items: [] });
    if (deduct && items.length) {
      try {
        for (const item of items) {
          await requestJson(`/warehouse/inventory/movements`, {
            method: "POST",
            body: JSON.stringify({
              itemId: item.id,
              movementType: "Salida",
              quantity: item.quantity,
              notes: "Descuento automático al iniciar actividad en tablero",
              storageLocation: "",
            }),
          });
        }
      } catch {
        // Non-blocking: proceed to start row even if deduction fails
      }
    }
    executeBoardRowStatusChange(boardId, rowId, STATUS_RUNNING);
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

  /** Apply a parsed sheet object into the board draft + open wizard if needed */
  function applyImportedSheet(imported) {
    setControlBoardDraft((current) => ({
      ...current,
      name: current.name || imported.name || imported.boardName || "Tablero importado",
      description: current.description || "Tablero importado desde Excel.",
      columns: imported.fields,
      ...createEmptyFieldDraft(),
    }));
    setBoardImportedRowsDraft(Array.isArray(imported.rows) ? imported.rows : []);

    if (Array.isArray(imported.unsupportedFormulaDetails) && imported.unsupportedFormulaDetails.length) {
      const memorySnapshot = loadFormulasMemory();
      setExcelFormulaWizard({
        open: true,
        items: imported.unsupportedFormulaDetails.map((item) => {
          const memKey = String(item.header || "").toLowerCase().trim();
          const saved = memorySnapshot[memKey] || null;
          let prefilledLeft = "";
          let prefilledRight = "";
          let prefilledOp = item.autoOperation || "add";
          let fromMemory = false;
          let fromClassification = false;

          if (saved) {
            const fieldByLabel = (label) =>
              (imported.fields || []).find((f) => f.label?.toLowerCase().trim() === String(label || "").toLowerCase().trim());
            const leftField = fieldByLabel(saved.leftLabel);
            const rightField = fieldByLabel(saved.rightLabel);
            if (leftField && rightField) {
              prefilledLeft = leftField.id;
              prefilledRight = rightField.id;
              prefilledOp = saved.operation || "add";
              fromMemory = true;
            }
          }

          if (!fromMemory && item.autoLeftColumnIndex != null && item.autoRightColumnIndex != null) {
            const leftField = imported.fields[item.autoLeftColumnIndex];
            const rightField = imported.fields[item.autoRightColumnIndex];
            if (leftField) prefilledLeft = leftField.id;
            if (rightField) prefilledRight = rightField.id;
            if (prefilledLeft || prefilledRight) fromClassification = true;
          }

          return {
            targetLabel: item.header,
            targetFieldId: imported.fields[item.columnIndex]?.id || "",
            formula: item.formula,
            operation: prefilledOp,
            formulaLeftFieldId: prefilledLeft,
            formulaRightFieldId: prefilledRight,
            targetType: fromMemory ? "formula" : (item.suggestedFieldType || "formula"),
            fromMemory,
            fromClassification,
            classification: item.classification || null,
          };
        }),
      });
    } else {
      setExcelFormulaWizard({ open: false, items: [] });
    }

    const unsupportedMsg = (imported.unsupportedFormulaColumns || imported.unsupportedFormulaDetails || []).length
      ? ` ${(imported.unsupportedFormulaColumns || imported.unsupportedFormulaDetails).length} fórmula(s) complejas requieren mapeo manual.`
      : "";
    const supportedMsg = (imported.supportedFormulaCount || 0) > 0
      ? ` ${imported.supportedFormulaCount} fórmula(s) convertidas automáticamente.`
      : "";
    setControlBoardFeedback(`Se importaron ${(imported.fields || []).length} componentes desde Excel (${imported.name || imported.boardName}).${supportedMsg}${unsupportedMsg}`);
  }

  async function importBoardStructureFromExcel(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await parseBoardStructureImportFile(file);

      // Multiple sheets → show sheet picker first
      if (imported.sheets && imported.sheets.length > 1) {
        setExcelSheetSelector({ open: true, sheets: imported.sheets, fileName: imported.fileName });
        return;
      }

      // Single sheet → apply directly
      applyImportedSheet(imported);
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

  function removeExcelFormulaWizardItem(index) {
    setExcelFormulaWizard((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  }

  function applyExcelFormulaWizard() {
    const validMappings = (excelFormulaWizard.items || []).filter((item) => {
      if (!item.targetFieldId) return false;
      if (item.targetType === "formula") return item.formulaLeftFieldId && item.formulaRightFieldId;
      return true; // inventoryLookup, text, number — just apply the type
    });
    if (!validMappings.length) {
      setExcelFormulaWizard({ open: false, items: [] });
      setControlBoardFeedback("No se aplicaron conversiones manuales de fórmula.");
      return;
    }

    const allFields = controlBoardDraft.columns || [];
    const fieldLabelById = (id) => allFields.find((f) => f.id === id)?.label || "";

    const mappingByTarget = new Map(validMappings.map((item) => [item.targetFieldId, item]));
    setControlBoardDraft((current) => ({
      ...current,
      columns: (current.columns || []).map((field) => {
        const mapping = mappingByTarget.get(field.id);
        if (!mapping) return field;

        if (mapping.targetType === "inventoryLookup") {
          return {
            ...field,
            type: "inventoryLookup",
            formulaOperation: "add",
            formulaLeftFieldId: null,
            formulaRightFieldId: null,
            helpText: field.helpText || "Buscador de inventario configurado desde el asistente de importación.",
          };
        }

        if (mapping.targetType === "number") {
          return { ...field, type: "number" };
        }

        if (mapping.targetType === "text") {
          return { ...field, type: "text" };
        }

        if (mapping.targetType === "select") {
          return { ...field, type: "select" };
        }

        // formula
        if (mapping.formulaLeftFieldId && mapping.formulaRightFieldId) {
          saveFormulaToMemory(
            mapping.targetLabel,
            mapping.operation || "add",
            fieldLabelById(mapping.formulaLeftFieldId),
            fieldLabelById(mapping.formulaRightFieldId),
            mapping.formula || "",
          );
          return {
            ...field,
            type: "formula",
            formulaOperation: mapping.operation || "add",
            formulaLeftFieldId: mapping.formulaLeftFieldId,
            formulaRightFieldId: mapping.formulaRightFieldId,
            helpText: field.helpText || "Fórmula configurada manualmente desde el asistente de importación.",
          };
        }

        return field;
      }),
    }));
    setExcelFormulaWizard({ open: false, items: [] });
    setControlBoardFeedback(`Se configuraron ${validMappings.length} campo(s) desde el asistente.`);
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
      if (field.formulaOperation === "average") return (left + right) / 2;
      if (field.formulaOperation === "min") return Math.min(left, right);
      if (field.formulaOperation === "max") return Math.max(left, right);
      if (field.formulaOperation === "percent") return right === 0 ? 0 : Math.round((left / right) * 10000) / 100;
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

  const inventoryUnitOptions = useMemo(() => {
    const PRESET_UNITS = ["pzas", "piezas", "rollos", "bidones", "bolsas", "litros", "kg", "cajas", "paquetes", "galones", "latas", "metros", "sacos", "cubetas"];
    const existing = new Set(PRESET_UNITS);
    (state.inventory || []).forEach((item) => {
      const u = String(item.unitLabel || "").trim().toLowerCase();
      if (u) existing.add(u);
    });
    return Array.from(existing).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [state.inventory]);
  const inventoryCustomColumnsForModal = useMemo(
    () => (state.inventoryColumns || []).filter((column) => column.domain === inventoryModal.domain),
    [inventoryModal.domain, state.inventoryColumns],
  );
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
    BOOTSTRAP_MASTER_ID,
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
    currentInventoryDeletePermission,
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
    DashboardLineChart,
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
    exportCatalogToCsv,
    importCatalogFromCsv,
    openCreateBoardBuilder,
    openCreateInventoryItem,
    openCreateUser,
    openEditBoardBuilder,
    openEditInventoryItem,
    openEditUser,
    openFinishBoardRowConfirm,
    openInventoryMovement,
    deleteArea: async (areaName) => {
      try {
        const result = await requestJson(`/warehouse/areas/${encodeURIComponent(areaName)}`, { method: "DELETE" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      } catch (error) {
        pushAppToast(error?.message || "No se pudo eliminar el área.", "danger");
      }
    },
    handleAddAreaOption,
    rootAreaOptions,
    splitAreaAndSubArea,
    inventoryColumns: Array.isArray(state.inventoryColumns) ? state.inventoryColumns : [],
    createInventoryColumn: async (payload) => {
      try {
        const result = await requestJson("/warehouse/inventory/columns", {
          method: "POST",
          body: JSON.stringify(payload || {}),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        pushAppToast("Columna de inventario creada.", "success");
      } catch (error) {
        pushAppToast(error?.message || "No se pudo crear la columna.", "danger");
        throw error;
      }
    },
    deleteInventoryColumn: async (columnId) => {
      try {
        const result = await requestJson(`/warehouse/inventory/columns/${columnId}`, { method: "DELETE" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        pushAppToast("Columna de inventario eliminada.", "success");
      } catch (error) {
        pushAppToast(error?.message || "No se pudo eliminar la columna.", "danger");
        throw error;
      }
    },
    duplicateInventoryItem: async (itemId) => {
      try {
        const result = await requestJson(`/warehouse/inventory/${itemId}/duplicate`, { method: "POST" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        pushAppToast("Artículo duplicado correctamente.", "success");
      } catch (error) {
        pushAppToast(error?.message || "No se pudo duplicar el artículo.", "danger");
      }
    },
    processAuditTemplates: Array.isArray(state.processAuditTemplates) ? state.processAuditTemplates : [],
    processAudits: Array.isArray(state.processAudits) ? state.processAudits : [],
    upsertProcessAuditTemplate: async (payload) => {
      try {
        const result = await requestJson("/warehouse/process-audits/templates", {
          method: "POST",
          body: JSON.stringify(payload || {}),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.templateId;
      } catch (error) {
        throw error;
      }
    },
    deleteProcessAuditTemplate: async (templateId) => {
      try {
        const result = await requestJson(`/warehouse/process-audits/templates/${templateId}`, { method: "DELETE" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      } catch (error) {
        throw error;
      }
    },
    createProcessAudit: async (payload) => {
      try {
        const result = await requestJson("/warehouse/process-audits", {
          method: "POST",
          body: JSON.stringify(payload || {}),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.auditId;
      } catch (error) {
        throw error;
      }
    },
    updateProcessAudit: async (auditId, payload) => {
      try {
        const result = await requestJson(`/warehouse/process-audits/${auditId}`, {
          method: "PATCH",
          body: JSON.stringify(payload || {}),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.auditId;
      } catch (error) {
        throw error;
      }
    },
    deleteProcessAudit: async (auditId, leadPassword) => {
      try {
        const result = await requestJson(`/warehouse/process-audits/${auditId}`, {
          method: "DELETE",
          body: JSON.stringify({ leadPassword }),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.auditId;
      } catch (error) {
        throw error;
      }
    },
    resetProcessAuditStats: async () => {
      try {
        const result = await requestJson("/warehouse/process-audits/reset-stats", { method: "POST" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      } catch (error) {
        throw error;
      }
    },
    addProcessAuditEvidence: async (auditId, payload) => {
      try {
        const result = await requestJson(`/warehouse/process-audits/${auditId}/evidences`, {
          method: "POST",
          body: JSON.stringify(payload || {}),
        });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.evidenceId;
      } catch (error) {
        throw error;
      }
    },
    removeProcessAuditEvidence: async (auditId, evidenceId) => {
      try {
        const result = await requestJson(`/warehouse/process-audits/${auditId}/evidences/${evidenceId}`, { method: "DELETE" });
        applyRemoteWarehouseState(result.data.state, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
        return result.data.evidenceId;
      } catch (error) {
        throw error;
      }
    },
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
    pushAppToast,
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
    transferLead,
    transferLeadTargetId,
    setTransferLeadTargetId,
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
    allRoles,
    customRoles: state.customRoles || [],
    roleModalOpen,
    roleModalName,
    setRoleModalName,
    roleModalEditId,
    roleModalError,
    roleSaving,
    openCreateRoleModal,
    openEditRoleModal,
    submitRoleModal,
    handleDeleteCustomRole,
    setRoleModalOpen,
    Users,
    visibleControlBoards,
    visibleUsers,
    weeklyAreaCoverageRows,
    Zap,
  };

  // Socket.IO — reconexión automática gestionada por Socket.IO internamente.
  //
  // Por qué reconnection:true resuelve el bucle de 400 "Session ID unknown":
  //   - Con reconnection:false el cliente tenía que recrear el socket manualmente
  //     (via scheduleReset). Cualquier race condition dejaba el sid expirado en vuelo.
  //   - Con reconnection:true, cuando Socket.IO reconecta llama a Manager.open()
  //     que crea un NUEVO engine.io.Socket (sin sid). El handshake siempre es fresco.
  //
  // Por qué dep es currentUser?.id (primitivo, no el objeto):
  //   - currentUser es recalculado en cada sync SSE del estado, aunque el usuario
  //     sea el mismo. Usar el objeto como dep destruía/recreaba el socket ~cada 3s.
  useEffect(() => {
    const userId = currentUser?.id;
    const userName = currentUser?.name;
    if (!userId) return;

    // Destruir socket anterior si existe (p.ej. cambio de usuario)
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // API_BASE_URL puede ser "/api"; para Socket.IO solo necesitamos el origin.
    let socketBaseUrl = window.location.origin;
    try {
      const parsedApiUrl = new URL(API_BASE_URL || window.location.origin, window.location.origin);
      socketBaseUrl = parsedApiUrl.origin;
    } catch (_) {}

    const socket = io(socketBaseUrl, {
      withCredentials: true,
      path: "/socket.io",
      transports: ["websocket", "polling"],
      upgrade: true,
      reconnection: true,            // Socket.IO gestiona reconexión (sin race conditions)
      reconnectionDelay: 3000,       // 3s entre intentos
      reconnectionDelayMax: 10000,   // máximo 10s de espera
      reconnectionAttempts: Infinity,
      timeout: 30000,
      forceNew: true,                // nuevo Manager en cada montaje (sin cache)
    });

    socket.on("connect", () => {
      socket.emit("login_chat", { nickname: userName, photo: null });
      setSocketConnectCount((c) => c + 1);
    });

    socketRef.current = socket;
    return () => {
      // disconnect() también llama io.reconnection(false) internamente,
      // así que el socket no intentará reconectarse después del desmontaje.
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (isBootstrapMasterSession) {
    return <BootstrapLeadSetup setupForm={bootstrapLeadForm} onChange={updateBootstrapLeadField} onSubmit={handleCreateFirstLead} error={bootstrapLeadError} areaOptions={departmentOptions} onAddArea={handleAddAreaToBootstrap} />;
  }

  if (!currentUser) {
    if (isAuthChecking) return <div className="app-auth-splash" />;
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
                onMarkAllRead={() => markNotificationIdsAsRead(unreadNotifications.map((n) => n.id))}
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
        {page === PAGE_PROCESS_AUDITS ? <AuditoriasProcesos contexto={paginasContexto} /> : null}
        {page === PAGE_INVENTORY ? <GestionInventario contexto={paginasContexto} /> : null}
        {page === PAGE_USERS ? <GestionUsuarios contexto={paginasContexto} /> : null}
        {page === PAGE_BIBLIOTECA ? <BibliotecaPage currentUser={currentUser} canUpload={actionPermissions.uploadBiblioteca} canDelete={actionPermissions.deleteBiblioteca} /> : null}
        {page === PAGE_INCIDENCIAS ? <GestionIncidencias contexto={paginasContexto} /> : null}
        {page === PAGE_NOT_FOUND ? <PaginaNoEncontrada contexto={paginasContexto} /> : null}
      </section>

      <Modal open={pauseState.open} title="Actividad en pausa" confirmLabel={pauseState.completed ? "Continuar" : "Confirmar pausa"} cancelLabel="Cancelar" hideCancel={pauseState.completed} onClose={() => setPauseState({ open: false, activityId: null, reason: "", error: "", completed: false })} onConfirm={handleConfirmPause}>
        <div className="modal-form-grid">
          {pauseState.completed ? (
            <>
              <p className="validation-text success">Continuemos. La pausa de la actividad quedó registrada correctamente.</p>
              <p className="modal-footnote">Cuando pulses continuar se cerrará este modal.</p>
            </>
          ) : (
            <>
              <label className="app-modal-field">
                <span>Motivo de pausa</span>
                <input value={pauseState.reason} onChange={(event) => setPauseState((current) => ({ ...current, reason: event.target.value, error: "" }))} placeholder="Describe por qué se detiene la actividad" />
              </label>
              {pauseState.error ? <p className="validation-text">{pauseState.error}</p> : null}
              <p className="modal-footnote">El motivo es obligatorio para poder pausar.</p>
            </>
          )}
        </div>
      </Modal>

      <Modal open={boardPauseState.open} title="Pausar fila" confirmLabel={boardPauseState.completed ? "Continuar" : "Confirmar pausa"} cancelLabel="Cancelar" hideCancel={boardPauseState.completed} onClose={() => setBoardPauseState({ open: false, boardId: null, rowId: null, reason: "", error: "", completed: false })} onConfirm={handleConfirmBoardPause}>
        <div className="modal-form-grid">
          {boardPauseState.completed ? (
            <>
              <p className="validation-text success">Continuemos. La fila quedó pausada y el motivo se guardó correctamente.</p>
              <p className="modal-footnote">Pulsa continuar para cerrar este modal.</p>
            </>
          ) : (
            <>
              <label className="app-modal-field">
                <span>Motivo de pausa</span>
                <input value={boardPauseState.reason} onChange={(event) => setBoardPauseState((current) => ({ ...current, reason: event.target.value, error: "" }))} placeholder="Describe por qué se detiene la fila" />
              </label>
              {boardPauseState.error ? <p className="validation-text">{boardPauseState.error}</p> : null}
              <p className="modal-footnote">La fila solo se pausa si capturas un motivo.</p>
            </>
          )}
        </div>
      </Modal>

      <Modal open={boardFinishConfirm.open} title="Finalizar fila" confirmLabel="Confirmar fin" cancelLabel="Cancelar" onClose={() => setBoardFinishConfirm({ open: false, boardId: null, rowId: null, message: "" })} onConfirm={confirmFinishBoardRow}>
        <div className="modal-form-grid">
          {(() => {
            const finBoard = boardFinishConfirm.boardId ? (state.controlBoards || []).find((b) => b.id === boardFinishConfirm.boardId) : null;
            const finRow = finBoard?.rows?.find((r) => r.id === boardFinishConfirm.rowId) || null;
            if (!finRow) return null;
            const productionSecs = getElapsedSeconds(finRow, now);
            const totalSecs = finRow.startTime
              ? Math.max(productionSecs, Math.floor((now - new Date(finRow.startTime).getTime()) / 1000))
              : productionSecs;
            const pauseSecs = Math.max(0, totalSecs - productionSecs);
            const efficiency = totalSecs > 0 ? Math.round((productionSecs / totalSecs) * 100) : 100;
            return (
              <div className="board-finish-time-breakdown">
                <div className="board-finish-time-row production">
                  <div className="board-finish-time-icon production-icon" />
                  <div className="board-finish-time-info">
                    <span className="board-finish-time-label">Tiempo de producción</span>
                    <small className="board-finish-time-hint">Solo cuando estuvo activa</small>
                  </div>
                  <strong className="board-finish-time-value">{formatDurationClock(productionSecs)}</strong>
                </div>
                <div className="board-finish-time-row pause">
                  <div className="board-finish-time-icon pause-icon" />
                  <div className="board-finish-time-info">
                    <span className="board-finish-time-label">Tiempo en pausa</span>
                    <small className="board-finish-time-hint">Tiempo detenida (no productivo)</small>
                  </div>
                  <strong className="board-finish-time-value">{formatDurationClock(pauseSecs)}</strong>
                </div>
                <div className="board-finish-time-row total">
                  <div className="board-finish-time-icon total-icon" />
                  <div className="board-finish-time-info">
                    <span className="board-finish-time-label">Tiempo total</span>
                    <small className="board-finish-time-hint">Desde inicio hasta ahora</small>
                  </div>
                  <strong className="board-finish-time-value">{formatDurationClock(totalSecs)}</strong>
                </div>
                <div className="board-finish-efficiency-bar">
                  <div className="board-finish-efficiency-track">
                    <div className="board-finish-efficiency-fill" style={{ width: `${efficiency}%` }} />
                  </div>
                  <span className="board-finish-efficiency-label">{efficiency}% eficiencia productiva</span>
                </div>
              </div>
            );
          })()}
          <p className="board-finish-confirm-note">{boardFinishConfirm.message}</p>
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

      <Modal open={areaModal.open} backdropClassName="area-modal-backdrop" title={areaModal.parentArea ? "Agregar subárea" : "Agregar área"} confirmLabel={areaModal.parentArea ? "Guardar subárea" : "Guardar área"} cancelLabel="Cancelar" onClose={() => setAreaModal({ open: false, target: "user", name: "", parentArea: "", error: "" })} onConfirm={confirmAddArea}>
        <div className="modal-form-grid">
          {areaModal.parentArea ? (
            <label className="app-modal-field">
              <span>Área padre</span>
              <input value={areaModal.parentArea} readOnly />
            </label>
          ) : null}
          <label className="app-modal-field">
            <span>{areaModal.parentArea ? "Nombre de la subárea" : "Nombre del área"}</span>
            <input value={areaModal.name} onChange={(event) => setAreaModal((current) => ({ ...current, name: event.target.value, error: "" }))} placeholder={areaModal.parentArea ? "Ej: TURNO MAÑANA" : "Ej: LOGISTICA"} />
          </label>
          {areaModal.error ? <p className="validation-text">{areaModal.error}</p> : null}
          <p className="modal-footnote">{areaModal.parentArea ? `La nueva subárea se creará bajo ${areaModal.parentArea}.` : "La nueva área se agregará al catálogo y se seleccionará automáticamente."}</p>
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
                <select value={userModal.area} onChange={(event) => setUserModal((current) => ({ ...current, area: event.target.value, subArea: "" }))}>
                  <option value="">Seleccionar área...</option>
                  {(currentUser?.role === ROLE_LEAD ? rootAreaOptions : Array.from(new Set(userAreaOptions.map((a) => getAreaRoot(a) || a))).filter(Boolean)).map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                {currentUser?.role === ROLE_LEAD ? <button type="button" className="icon-button area-add-button" onClick={() => handleAddAreaOption()} aria-label="Agregar nueva área"><Plus size={16} /></button> : null}
              </div>
            </label>
            {userModal.area ? (
              <label className="app-modal-field">
                <span>Subárea <small style={{ fontWeight: 400, opacity: 0.65 }}>(opcional)</small></span>
                <div className="area-selector-row">
                  <select value={userModal.subArea} onChange={(event) => setUserModal((current) => ({ ...current, subArea: event.target.value }))}>
                    <option value="">Sin subárea</option>
                    {getSubAreaOptions(userModal.area).map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  {currentUser?.role === ROLE_LEAD ? <button type="button" className="icon-button area-add-button" onClick={() => handleAddAreaOption(userModal.area)} aria-label="Agregar nueva subárea"><Plus size={16} /></button> : null}
                </div>
              </label>
            ) : null}
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
        onSaveTemplate={actionPermissions.saveTemplate ? saveDraftAsBoardTemplate : null}
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
        canSaveBoard={actionPermissions.createBoard || actionPermissions.editBoard}
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
          <p className="modal-footnote">Estas columnas tenían fórmulas que no se pudieron convertir automáticamente. Elige cómo debe comportarse cada campo en el tablero.</p>
          {(excelFormulaWizard.items || []).map((item, index) => (
            <section key={`${item.targetFieldId || item.targetLabel}-${index}`} className="surface-card" style={{ padding: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <strong>{item.targetLabel}</strong>
                {item.fromMemory ? (
                  <span style={{ fontSize: "0.7rem", background: "#032121", color: "#fff", borderRadius: "999px", padding: "0.1rem 0.55rem", fontWeight: 600 }}>Desde memoria</span>
                ) : item.fromClassification ? (
                  <span style={{ fontSize: "0.7rem", background: "#1d4ed8", color: "#fff", borderRadius: "999px", padding: "0.1rem 0.55rem", fontWeight: 600 }}>Auto-detectado</span>
                ) : null}
                {item.classification?.label ? (
                  <span style={{ fontSize: "0.7rem", background: "#f3f4f6", color: "#374151", borderRadius: "999px", padding: "0.1rem 0.55rem" }}>{item.classification.label}</span>
                ) : null}
                <button
                  type="button"
                  className="icon-button danger"
                  style={{ marginLeft: "auto", fontSize: "0.75rem" }}
                  onClick={() => removeExcelFormulaWizardItem(index)}
                  title="Omitir este campo del asistente"
                >
                  <Trash2 size={13} /> Omitir
                </button>
              </div>
              {item.classification?.description ? (
                <p className="modal-footnote" style={{ marginBottom: "0.35rem", color: "#374151" }}>{item.classification.description}</p>
              ) : null}
              <p className="modal-footnote" style={{ marginBottom: "0.5rem" }}>
                Fórmula original: <code style={{ fontSize: "0.78rem", background: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>{item.formula}</code>
              </p>

              <label className="app-modal-field" style={{ marginBottom: "0.6rem" }}>
                <span>Convertir como</span>
                <select
                  value={item.targetType || "formula"}
                  onChange={(event) => updateExcelFormulaWizardItem(index, "targetType", event.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="formula">Fórmula (operación entre campos)</option>
                  <option value="inventoryLookup">Buscador de inventario</option>
                  <option value="number">Número (valor estático)</option>
                  <option value="text">Texto (valor estático)</option>
                  <option value="select">Menú desplegable</option>
                </select>
              </label>

              {(item.targetType === "inventoryLookup") ? (
                <p className="modal-footnote" style={{ color: "#065f46", background: "#d1fae5", borderRadius: "8px", padding: "0.4rem 0.6rem" }}>
                  Este campo se configurará como Buscador de inventario. Los operadores podrán buscar y vincular artículos del inventario del sistema.
                </p>
              ) : (item.targetType === "text" || item.targetType === "number" || item.targetType === "select") ? (
                <p className="modal-footnote" style={{ color: "#92400e", background: "#fef3c7", borderRadius: "8px", padding: "0.4rem 0.6rem" }}>
                  El campo se importará como <strong>{item.targetType === "text" ? "Texto" : item.targetType === "number" ? "Número" : "Menú desplegable"}</strong> con los valores calculados por Excel.
                </p>
              ) : (
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
              )}
            </section>
          ))}
        </div>
      </Modal>

      {currentUser ? (
        <AlertModalProvider>
          <ChatPro socket={socketRef.current} user={currentUser} connectCount={socketConnectCount} />
        </AlertModalProvider>
      ) : null}

      {profileModalOpen ? <EmployeeProfileModal currentUser={currentUser} passwordForm={passwordForm} onPasswordChange={setPasswordForm} onSubmit={submitPasswordReset} onUpdateIdentity={updateCurrentUserIdentity} onClose={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); }} onLogout={() => { setProfileModalOpen(false); setPasswordForm({ password: "", confirmPassword: "", message: "" }); handleLogout(); }} /> : null}

      <Modal
        open={excelSheetSelector.open}
        title={`Hojas en "${excelSheetSelector.fileName}"`}
        confirmLabel="Importar hoja seleccionada"
        cancelLabel="Cancelar"
        onClose={() => setExcelSheetSelector({ open: false, sheets: [], fileName: "" })}
        onConfirm={() => {
          const checked = excelSheetSelector.sheets.filter((s) => s._selected);
          if (!checked.length) return;
          setExcelSheetSelector({ open: false, sheets: [], fileName: "" });
          checked.forEach((sheet) => applyImportedSheet(sheet));
        }}
      >
        <div className="modal-form-grid">
          <p className="modal-footnote">
            Este archivo tiene <strong>{excelSheetSelector.sheets.length} hojas</strong>. Selecciona las que quieres importar. Cada hoja seleccionada reemplazará los componentes actuales del tablero (la última seleccionada quedará activa). Para crear tableros separados, importa una hoja a la vez.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {excelSheetSelector.sheets.map((sheet, idx) => (
              <button
                key={sheet.name}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  border: `2px solid ${sheet._selected ? "#032121" : "#e5e7eb"}`,
                  background: sheet._selected ? "#f0fdf4" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s",
                }}
                onClick={() => setExcelSheetSelector((current) => ({
                  ...current,
                  sheets: current.sheets.map((s, i) => i === idx ? { ...s, _selected: !s._selected } : s),
                }))}
              >
                <span style={{
                  width: "20px", height: "20px", borderRadius: "4px", flexShrink: 0,
                  border: `2px solid ${sheet._selected ? "#032121" : "#d1d5db"}`,
                  background: sheet._selected ? "#032121" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {sheet._selected ? <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>✓</span> : null}
                </span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>{sheet.name}</strong>
                  <p style={{ margin: 0, fontSize: "0.77rem", color: "#6b7280" }}>
                    {sheet.columnCount} columnas · {sheet.rowCount} filas de datos
                    {(sheet.supportedFormulaCount || 0) > 0 ? ` · ${sheet.supportedFormulaCount} fórmula(s) detectada(s)` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

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
                <input list="inventory-unit-datalist" value={inventoryModal.unitLabel} onChange={(event) => setInventoryModal((current) => ({ ...current, unitLabel: event.target.value }))} placeholder={inventoryUnitPlaceholder} />
                <datalist id="inventory-unit-datalist">
                  {inventoryUnitOptions.map((unit) => <option key={unit} value={unit} />)}
                </datalist>
              </label>
              <label className="app-modal-field">
                <span>Ubicación / resguardo</span>
                <input value={inventoryModal.storageLocation} onChange={(event) => setInventoryModal((current) => ({ ...current, storageLocation: event.target.value }))} placeholder={inventoryStoragePlaceholder} />
              </label>
            </>
          )}
          {inventoryCustomColumnsForModal.map((column) => (
            <label key={column.id} className="app-modal-field">
              <span>{column.label}</span>
              <input
                value={inventoryModal.customFields?.[column.key] || ""}
                onChange={(event) => setInventoryModal((current) => ({
                  ...current,
                  customFields: {
                    ...(current.customFields || {}),
                    [column.key]: event.target.value,
                  },
                }))}
                placeholder={`Captura ${String(column.label || "dato").toLowerCase()}`}
              />
            </label>
          ))}
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

      <Modal
        open={pieceDeductionModal.open}
        title="¿Descontar insumos al iniciar?"
        confirmLabel="Sí, descontar y comenzar"
        cancelLabel="Comenzar sin descontar"
        onClose={() => confirmPieceDeductionAndStart(false)}
        onConfirm={() => confirmPieceDeductionAndStart(true)}
      >
        <div className="modal-form-grid">
          <p className="modal-footnote">Esta actividad tiene insumos en piezas vinculados. ¿Quieres descontar automáticamente del inventario al iniciar?</p>
          <div className="piece-deduction-list">
            {pieceDeductionModal.items.map((item) => (
              <div key={item.id} className="piece-deduction-row">
                <strong>{item.name}</strong>
                <span className="chip">{item.quantity} {item.unit} · Stock actual: {item.stock}</span>
              </div>
            ))}
          </div>
          <p className="modal-footnote">Si eliges "Comenzar sin descontar", la actividad inicia normalmente y el inventario no cambia.</p>
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

      <Modal open={Boolean(transferLeadTargetId)} title="Transferir rol de Lead" confirmLabel="Transferir Lead" cancelLabel="Cancelar" onClose={() => setTransferLeadTargetId(null)} onConfirm={() => transferLead(transferLeadTargetId)}>
        <p>El player <strong>{state.users?.find((u) => u.id === transferLeadTargetId)?.name || ""}</strong> pasará a ser Lead.</p>
        <p>Tu cuenta quedará como Senior. Esta acción no se puede deshacer desde aquí.</p>
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
