$f = "C:\Users\alexx\Desktop\COPMEC\frontend\src\App.jsx"
$lines = [IO.File]::ReadAllLines($f, [Text.Encoding]::UTF8)
Write-Host "Current App.jsx: $($lines.Count) lines"

# ── Dynamically find function App() ────────────────────────────────────────────
$appStart = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match "^function App\(\)") { $appStart = $i; break }
}
if ($appStart -lt 0) { Write-Error "function App() NOT found!"; exit 1 }
Write-Host "function App() found at line $($appStart + 1)"

# ── Find last original import line (before constants/code) ─────────────────────
$lastImport = 0
for ($i = 0; $i -lt $appStart; $i++) {
  if ($lines[$i] -match '^import ') { $lastImport = $i }
}
# Include the line after the last import that has content (e.g. closing of import block)
for ($j = $lastImport; $j -lt $appStart; $j++) {
  if ($lines[$j] -match "^import |^\s*\}" -and $lines[$j] -notmatch "^(const |function |async |let |var |//)") {
    $lastImport = $j
  } else { break }
}
Write-Host "Last original import at line $($lastImport + 1)"

$kept = [System.Collections.Generic.List[string]]::new()

# ── Keep original imports (lines 1 through last import + blanks) ───────────────
0..$lastImport | ForEach-Object { $kept.Add($lines[$_]) }

# ── Module imports ─────────────────────────────────────────────────────────────
$newImports = @'

// ── Modulos extraidos ─────────────────────────────────────────────────────────
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
// ── Constantes globales ───────────────────────────────────────────────────────
import {
  STORAGE_KEY, SIDEBAR_COLLAPSED_KEY, ACTIVE_PAGE_KEY, DASHBOARD_SECTIONS_KEY,
  NOTIFICATION_READ_KEY, NOTIFICATION_DELETED_KEY, NOTIFICATION_INBOX_KEY,
  EMPTY_OBJECT, BOOTSTRAP_MASTER_ID, MASTER_USERNAME, API_BASE_URL,
  ENABLE_LEGACY_WHOLE_STATE_SYNC,
  PAGE_BOARD, PAGE_CUSTOM_BOARDS, PAGE_ADMIN, PAGE_DASHBOARD, PAGE_HISTORY,
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
// ── Utilidades puras ──────────────────────────────────────────────────────────
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
} from "./utils/utilidades.js";
// ── Componentes menores ────────────────────────────────────────────────────────
import { AppToastStack, AppNotificationCenter } from "./components/Notificaciones.jsx";
import { InventoryLookupInput } from "./components/BuscadorInventario.jsx";

const INITIAL_ROUTE_STATE = getInitialRouteState();

'@

$newImports -split "`n" | ForEach-Object { $kept.Add($_) }

# ── Keep function App() to end ─────────────────────────────────────────────────
$appStart..($lines.Count - 1) | ForEach-Object { $kept.Add($lines[$_]) }

Write-Host "New App.jsx: $($kept.Count) lines"
Write-Host "  Original imports: $($lastImport + 1) lines"
Write-Host "  New module imports: $($newImports.Split("`n").Count) lines"
Write-Host "  function App(): $($lines.Count - $appStart) lines"

Copy-Item $f "$f.bak-pre-rebuild" -Force
[IO.File]::WriteAllLines($f, $kept, [Text.Encoding]::UTF8)
Write-Host "Done. Backup saved as App.jsx.bak-pre-rebuild"
