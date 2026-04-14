import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicLoginDirectoryEnabled } from "../config/env.js";
import { hashPassword, isStrongPassword, isTemporaryPassword, verifyPassword } from "../utils/passwords.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../../data");
const dataFilePath = path.join(dataDirectory, "warehouse-state.json");
const warehouseEvents = new EventEmitter();
export const BOOTSTRAP_MASTER_ID = "bootstrap-master";

const ROLE_LEAD = "Lead";
const ROLE_SR = "Senior (Sr)";
const ROLE_SSR = "Semi-Senior (Ssr)";
const ROLE_JR = "Junior (Jr)";

const PAGE_PERMISSIONS = {
  index: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR],
  customBoards: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR],
  admin: [ROLE_LEAD, ROLE_SR],
  dashboard: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  history: [ROLE_LEAD, ROLE_SR],
  inventory: [ROLE_LEAD, ROLE_SR],
  users: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
};

const ACTION_PERMISSIONS = {
  createWeek: [ROLE_LEAD, ROLE_SR],
  manageCatalog: [ROLE_LEAD, ROLE_SR],
  manageWeeks: [ROLE_LEAD, ROLE_SR],
  managePermissions: [ROLE_LEAD],
  manageUsers: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  deleteUsers: [ROLE_LEAD, ROLE_SR],
  resetPasswords: [ROLE_LEAD, ROLE_SR],
  manageInventory: [ROLE_LEAD, ROLE_SR],
  importInventory: [ROLE_LEAD, ROLE_SR],
  manageCleaningInventory: [ROLE_LEAD, ROLE_SR],
  importCleaningInventory: [ROLE_LEAD, ROLE_SR],
  manageOrderInventory: [ROLE_LEAD, ROLE_SR],
  importOrderInventory: [ROLE_LEAD, ROLE_SR],
  saveBoard: [ROLE_LEAD, ROLE_SR],
  deleteBoard: [ROLE_LEAD, ROLE_SR],
  saveTemplate: [ROLE_LEAD, ROLE_SR],
  editTemplate: [ROLE_LEAD, ROLE_SR],
  deleteTemplate: [ROLE_LEAD, ROLE_SR],
  createBoardFromTemplate: [ROLE_LEAD, ROLE_SR],
  createBoardRow: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR],
  editFinishedBoardRow: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  boardWorkflow: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR],
  duplicateBoard: [ROLE_LEAD, ROLE_SR],
  duplicateBoardWithRows: [ROLE_LEAD, ROLE_SR],
  exportBoardExcel: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  previewBoardPdf: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  exportBoardPdf: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
};

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("lead") || value.includes("maestro")) return ROLE_LEAD;
  if (value.includes("semi") || value.includes("ssr")) return ROLE_SSR;
  if (value.includes("senior") || value.includes("administrador")) return ROLE_SR;
  return ROLE_JR;
}

function supportsManagedPermissionOverrides(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === ROLE_LEAD || normalizedRole === ROLE_SR;
}

function defaultPassword(role) {
  if (role === ROLE_LEAD) return "lead123";
  if (role === ROLE_SR) return "senior123";
  if (role === ROLE_SSR) return "ssr123";
  return "junior123";
}

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return next;
}

function isoAt(date, hours, minutes) {
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getWeekName(date) {
  const weekStart = startOfWeek(date);
  return `Semana ${formatDate(weekStart)} - ${formatDate(endOfWeek(date))}`;
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

function getBoardWeekNameByKey(weekKey) {
  const weekStart = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date());
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

function cloneBoardRowSnapshot(row) {
  return {
    ...row,
    values: { ...(row?.values || {}) },
  };
}

function normalizeBoardHistorySnapshot(snapshot, permissions, fallbackUsers = []) {
  const ownerId = snapshot?.ownerId ?? snapshot?.createdById ?? fallbackUsers[0]?.id ?? null;
  const createdById = snapshot?.createdById ?? ownerId ?? fallbackUsers[0]?.id ?? null;
  const weekKey = String(snapshot?.weekKey || "").trim() || formatBoardWeekKey(new Date(snapshot?.startDate || Date.now()));
  const parsedWeekStart = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date(snapshot?.startDate || Date.now()));
  return {
    id: snapshot?.id || makeId("boardhist"),
    boardId: String(snapshot?.boardId || "").trim(),
    boardName: String(snapshot?.boardName || snapshot?.name || "Tablero").trim() || "Tablero",
    description: String(snapshot?.description || "").trim(),
    createdById,
    ownerId,
    accessUserIds: Array.isArray(snapshot?.accessUserIds) ? snapshot.accessUserIds : [],
    weekKey,
    weekName: String(snapshot?.weekName || "").trim() || getBoardWeekNameByKey(weekKey),
    startDate: snapshot?.startDate || parsedWeekStart.toISOString(),
    endDate: snapshot?.endDate || getBoardWeekEnd(parsedWeekStart).toISOString(),
    archivedAt: snapshot?.archivedAt || new Date().toISOString(),
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      ...(snapshot?.settings || {}),
    },
    fields: Array.isArray(snapshot?.fields)
      ? snapshot.fields.map((field) => ({ ...field, colorRules: field.colorRules || [] }))
      : [],
    permissions: normalizeBoardPermissions(snapshot?.permissions, permissions, snapshot),
    rows: Array.isArray(snapshot?.rows) ? snapshot.rows.map((row) => cloneBoardRowSnapshot(row)) : [],
  };
}

function buildBoardHistorySnapshot(board, weekKey, permissions, archivedAt = new Date().toISOString()) {
  const weekStart = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date());
  return normalizeBoardHistorySnapshot({
    id: makeId("boardhist"),
    boardId: board.id,
    boardName: board.name,
    description: board.description || "",
    createdById: board.createdById,
    ownerId: board.ownerId,
    accessUserIds: board.accessUserIds || [],
    weekKey,
    weekName: getBoardWeekNameByKey(weekKey),
    startDate: weekStart.toISOString(),
    endDate: getBoardWeekEnd(weekStart).toISOString(),
    archivedAt,
    settings: { ...(board.settings || {}) },
    fields: (board.fields || []).map((field) => ({ ...field, colorRules: field.colorRules || [] })),
    permissions: board.permissions,
    rows: (board.rows || []).map((row) => cloneBoardRowSnapshot(row)),
  }, permissions);
}

function advanceBoardWeekKey(weekKey) {
  const current = parseBoardWeekKey(weekKey) || getBoardWeekStart(new Date());
  return formatBoardWeekKey(addDays(current, 7));
}

function applyAutomatedBoardWeeklyCut(state, referenceDate = new Date()) {
  const currentWeekStart = getBoardWeekStart(referenceDate);
  const currentWeekKey = formatBoardWeekKey(currentWeekStart);
  const normalizedCycle = normalizeBoardWeeklyCycle(state?.boardWeeklyCycle, referenceDate);
  let activeWeekKey = normalizedCycle.activeWeekKey;
  let nextBoards = (state?.controlBoards || []).map((board) => ({ ...board, rows: Array.isArray(board.rows) ? board.rows : [] }));
  let nextHistory = Array.isArray(state?.boardWeekHistory) ? [...state.boardWeekHistory] : [];
  let changed = activeWeekKey !== currentWeekKey;

  while (activeWeekKey < currentWeekKey) {
    const archivedAt = new Date().toISOString();
    const existingKeys = new Set(nextHistory.map((snapshot) => `${snapshot.boardId}|${snapshot.weekKey}`));
    nextBoards.forEach((board) => {
      const snapshotKey = `${board.id}|${activeWeekKey}`;
      if (existingKeys.has(snapshotKey)) return;
      nextHistory.push(buildBoardHistorySnapshot(board, activeWeekKey, state.permissions, archivedAt));
      existingKeys.add(snapshotKey);
      changed = true;
    });
    nextBoards = nextBoards.map((board) => ({ ...board, rows: [] }));
    activeWeekKey = advanceBoardWeekKey(activeWeekKey);
  }

  if (!changed) {
    return { state, changed: false };
  }

  return {
    changed: true,
    state: {
      ...state,
      controlBoards: nextBoards,
      boardWeekHistory: nextHistory,
      boardWeeklyCycle: {
        activeWeekKey: currentWeekKey,
        activeWeekStartDate: currentWeekStart.toISOString(),
        activeWeekEndDate: getBoardWeekEnd(currentWeekStart).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function normalizeInventoryDomain(value) {
  const key = String(value || "").trim().toLowerCase();
  if (["cleaning", "limpieza", "clean"].includes(key)) return "cleaning";
  if (["orders", "order", "pedidos", "pedido"].includes(key)) return "orders";
  return "base";
}

function normalizeInventoryTransferTargetSegment(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildInventoryTransferTargetKey(warehouse = "", storageLocation = "") {
  const normalizedWarehouse = normalizeInventoryTransferTargetSegment(warehouse) || "sin-destino";        
  const normalizedStorage = normalizeInventoryTransferTargetSegment(storageLocation) || "sin-resguardo";  
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

function sumInventoryTransferTargetUnits(targets = []) {
  return (Array.isArray(targets) ? targets : []).reduce((sum, target) => sum + Math.max(0, Number(target?.availableUnits || 0)), 0);
}

function mergeInventoryItemTransferTargets(currentItem, nextItem) {
  const nextDomain = normalizeInventoryDomain(nextItem?.domain || currentItem?.domain);
  if (nextDomain !== "orders") {
    return {
      ...nextItem,
      transferTargets: [],
    };
  }

  const sourceTargets = Array.isArray(nextItem?.transferTargets) && nextItem.transferTargets.length
    ? nextItem.transferTargets
    : Array.isArray(currentItem?.transferTargets)
      ? currentItem.transferTargets
      : [];

  return {
    ...nextItem,
    transferTargets: sourceTargets
      .map((target) => normalizeInventoryTransferTargetRecord(target, nextItem?.unitLabel || currentItem?.unitLabel || "pzas"))
      .filter((target) => target.warehouse || target.storageLocation || target.availableUnits > 0),
  };
}

function hasInventoryBalanceInput(value) {
  return !(value === undefined || value === null || String(value).trim() === "");
}

function normalizeInventoryActivityIds(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[;,]/).map((item) => String(item || "").trim()).filter(Boolean)));
  }
  return [];
}

function normalizeInventoryItemRecord(item, fallbackId = null) {
  const domain = normalizeInventoryDomain(item?.domain);
  return {
    id: fallbackId || item?.id || makeId("inv"),
    code: String(item?.code || "").trim(),
    name: String(item?.name || "").trim(),
    presentation: String(item?.presentation || "").trim(),
    piecesPerBox: Number(item?.piecesPerBox || 0),
    boxesPerPallet: Number(item?.boxesPerPallet || 0),
    domain,
    stockUnits: Math.max(0, Number(item?.stockUnits || 0)),
    minStockUnits: Math.max(0, Number(item?.minStockUnits || 0)),
    storageLocation: String(item?.storageLocation || "").trim(),
    unitLabel: String(item?.unitLabel || "pzas").trim() || "pzas",
    transferTargets: domain === "orders"
      ? (Array.isArray(item?.transferTargets) ? item.transferTargets : []).map((target) => normalizeInventoryTransferTargetRecord(target, item?.unitLabel || "pzas")).filter((target) => target.warehouse || target.storageLocation || target.availableUnits > 0)
      : [],
    activityCatalogIds: normalizeInventoryActivityIds(item?.activityCatalogIds),
    consumptionPerStart: Math.max(0, Number(item?.consumptionPerStart || 0)),
  };
}

function normalizeInventoryMovementType(value) {
  const key = String(value || "").trim().toLowerCase();
  if (["restock", "entrada", "reabasto", "reabastecimiento"].includes(key)) return "restock";
  if (["consume", "consumo", "usage", "uso"].includes(key)) return "consume";
  if (["transfer", "transferencia", "traslado"].includes(key)) return "transfer";
  return "restock";
}

function normalizeInventoryMovementRecord(movement, item = null, fallbackId = null) {
  const warehouse = String(movement?.warehouse || "").trim();
  const storageLocation = String(movement?.storageLocation || item?.storageLocation || "").trim();
  const remainingUnits = movement?.remainingUnits;
  const destinationBalanceUnits = movement?.destinationBalanceUnits;
  const destinationKey = warehouse || storageLocation
    ? buildInventoryTransferTargetKey(warehouse, storageLocation)
    : String(movement?.destinationKey || "").trim() || buildInventoryTransferTargetKey(warehouse, storageLocation);
  return {
    id: fallbackId || movement?.id || makeId("invmov"),
    itemId: String(movement?.itemId || item?.id || "").trim(),
    itemCode: String(movement?.itemCode || item?.code || "").trim(),
    itemName: String(movement?.itemName || item?.name || "").trim(),
    domain: normalizeInventoryDomain(movement?.domain || item?.domain),
    movementType: normalizeInventoryMovementType(movement?.movementType),
    quantity: Math.max(0, Number(movement?.quantity || 0)),
    unitLabel: String(movement?.unitLabel || item?.unitLabel || "pzas").trim() || "pzas",
    notes: String(movement?.notes || "").trim(),
    activityId: movement?.activityId ? String(movement.activityId).trim() : null,
    catalogActivityId: movement?.catalogActivityId ? String(movement.catalogActivityId).trim() : null,
    warehouse,
    recipientName: String(movement?.recipientName || "").trim(),
    storageLocation,
    remainingUnits: remainingUnits === undefined || remainingUnits === null || String(remainingUnits).trim() === "" ? null : Math.max(0, Number(remainingUnits || 0)),
    destinationBalanceUnits: destinationBalanceUnits === undefined || destinationBalanceUnits === null || String(destinationBalanceUnits).trim() === "" ? null : Math.max(0, Number(destinationBalanceUnits || 0)),
    destinationKey,
    performedById: String(movement?.performedById || "").trim() || null,
    createdAt: movement?.createdAt || new Date().toISOString(),
  };
}

function getDefaultInventoryItems() {
  return [
    normalizeInventoryItemRecord({ id: "inv-1", code: "ALM-001", name: "Tarima estándar", presentation: "Tarima", piecesPerBox: 1, boxesPerPallet: 1, domain: "base", stockUnits: 36, minStockUnits: 10, storageLocation: "Almacén central", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-2", code: "ALM-002", name: "Caja master", presentation: "Paquete", piecesPerBox: 20, boxesPerPallet: 48, domain: "base", stockUnits: 240, minStockUnits: 80, storageLocation: "Racks A-2", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-3", code: "ALM-003", name: "Playo transparente", presentation: "Rollo", piecesPerBox: 6, boxesPerPallet: 40, domain: "base", stockUnits: 120, minStockUnits: 36, storageLocation: "Racks B-1", unitLabel: "rollos" }),
    normalizeInventoryItemRecord({ id: "inv-4", code: "LIMP-001", name: "Detergente industrial", presentation: "Bidón 20L", piecesPerBox: 4, boxesPerPallet: 30, domain: "cleaning", stockUnits: 18, minStockUnits: 8, storageLocation: "Cuarto de limpieza", unitLabel: "bidones", activityCatalogIds: ["cat-piso", "cat-oficinas"], consumptionPerStart: 1 }),
    normalizeInventoryItemRecord({ id: "inv-5", code: "LIMP-002", name: "Papel higiénico", presentation: "Paquete 12 rollos", piecesPerBox: 6, boxesPerPallet: 24, domain: "cleaning", stockUnits: 42, minStockUnits: 18, storageLocation: "Cuarto de limpieza", unitLabel: "paquetes", activityCatalogIds: ["cat-banos"], consumptionPerStart: 1 }),
    normalizeInventoryItemRecord({ id: "inv-6", code: "PED-001", name: "Separador corrugado", presentation: "Fajo 25 piezas", piecesPerBox: 25, boxesPerPallet: 80, domain: "orders", stockUnits: 220, minStockUnits: 100, storageLocation: "Nave 2 · Estante 4", unitLabel: "pzas" }),
    normalizeInventoryItemRecord({ id: "inv-7", code: "PED-002", name: "Esquinero", presentation: "Paquete 50 piezas", piecesPerBox: 50, boxesPerPallet: 60, domain: "orders", stockUnits: 150, minStockUnits: 70, storageLocation: "Nave 1 · Jaula 2", unitLabel: "pzas" }),
  ];
}

function buildDefaultPermissions() {
  return {
    pages: Object.fromEntries(Object.entries(PAGE_PERMISSIONS).map(([key, roles]) => [key, { roles, userIds: [], departments: [] }])),
    actions: Object.fromEntries(Object.entries(ACTION_PERMISSIONS).map(([key, roles]) => [key, { roles, userIds: [], departments: [] }])),
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
    pages: Object.fromEntries(Object.keys(PAGE_PERMISSIONS).map((key) => [key, normalizePermissionEntry(permissions?.pages?.[key], defaults.pages[key].roles)])),
    actions: Object.fromEntries(Object.keys(ACTION_PERMISSIONS).map((key) => [key, normalizePermissionEntry(permissions?.actions?.[key], defaults.actions[key].roles)])),
    userOverrides: Object.fromEntries(Object.entries(permissions?.userOverrides || {}).map(([userId, override]) => [
      userId,
      {
        pages: Object.fromEntries(Object.keys(PAGE_PERMISSIONS).map((key) => [key, typeof override?.pages?.[key] === "boolean" ? override.pages[key] : null])),
        actions: Object.fromEntries(Object.keys(ACTION_PERMISSIONS).map((key) => [key, typeof override?.actions?.[key] === "boolean" ? override.actions[key] : null])),
      },
    ])),
  };
}

function userMatchesPermissionEntry(user, entry) {
  if (!user || !entry) return false;
  const normalizedRole = normalizeRole(user.role);
  if (Array.isArray(entry.roles) && entry.roles.includes(normalizedRole)) return true;
  if (Array.isArray(entry.userIds) && entry.userIds.includes(user.id)) return true;
  const department = String(user.department || user.area || "").trim();
  if (department && Array.isArray(entry.departments) && entry.departments.includes(department)) return true;
  return false;
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
    actions: {
      createBoardRow: normalizePermissionEntry(basePermissions?.actions?.createBoardRow, ACTION_PERMISSIONS.createBoardRow),
      boardWorkflow: normalizePermissionEntry(basePermissions?.actions?.boardWorkflow, ACTION_PERMISSIONS.boardWorkflow),
      exportBoardExcel: normalizePermissionEntry(basePermissions?.actions?.exportBoardExcel, ACTION_PERMISSIONS.exportBoardExcel),
      previewBoardPdf: normalizePermissionEntry(basePermissions?.actions?.previewBoardPdf, ACTION_PERMISSIONS.previewBoardPdf),
      exportBoardPdf: normalizePermissionEntry(basePermissions?.actions?.exportBoardPdf, ACTION_PERMISSIONS.exportBoardPdf),
      duplicateBoard: normalizePermissionEntry(basePermissions?.actions?.duplicateBoard, ACTION_PERMISSIONS.duplicateBoard),
      duplicateBoardWithRows: normalizePermissionEntry(basePermissions?.actions?.duplicateBoardWithRows, ACTION_PERMISSIONS.duplicateBoardWithRows),
    },
  };
}

function normalizeBoardPermissions(permissions, basePermissions, board = null) {
  const defaults = buildBoardPermissions(basePermissions, board);
  return {
    isEnabled: Boolean(permissions?.isEnabled),
    visibility: normalizePermissionEntry(permissions?.visibility, defaults.visibility.roles),
    actions: {
      createBoardRow: normalizePermissionEntry(permissions?.actions?.createBoardRow, defaults.actions.createBoardRow.roles),
      boardWorkflow: normalizePermissionEntry(permissions?.actions?.boardWorkflow, defaults.actions.boardWorkflow.roles),
      exportBoardExcel: normalizePermissionEntry(permissions?.actions?.exportBoardExcel, defaults.actions.exportBoardExcel.roles),
      previewBoardPdf: normalizePermissionEntry(permissions?.actions?.previewBoardPdf, defaults.actions.previewBoardPdf.roles),
      exportBoardPdf: normalizePermissionEntry(permissions?.actions?.exportBoardPdf, defaults.actions.exportBoardPdf.roles),
      duplicateBoard: normalizePermissionEntry(permissions?.actions?.duplicateBoard, defaults.actions.duplicateBoard.roles),
      duplicateBoardWithRows: normalizePermissionEntry(permissions?.actions?.duplicateBoardWithRows, defaults.actions.duplicateBoardWithRows.roles),
    },
  };
}

function normalizeState(state, previousState = null) {
  const fallbackUsers = buildSampleState().users;
  const users = Array.isArray(state.users) && state.users.length ? state.users : fallbackUsers;
  const permissions = normalizePermissions(state.permissions);
  const fallbackCatalog = buildSampleState().catalog;
  return {
    ...state,
    system: {
      masterBootstrapEnabled: state.system?.masterBootstrapEnabled ?? !users.some((user) => normalizeRole(user.role) === ROLE_LEAD),
      masterUsername: "Maestro",
      ...(state.system || {}),
    },
    users: users.map((user) => {
      const role = normalizeRole(user.role);
      const previousUser = previousState?.users?.find((item) => item.id === user.id) || null;
      const loginIdentifier = String((user.email ?? user.username ?? previousUser?.email) || "").trim();
      const incomingPassword = String(user.password || "").trim();
      const storedPasswordHash = String(user.passwordHash || "").trim();
      const mustChangePassword = typeof user.mustChangePassword === "boolean"
        ? user.mustChangePassword
        : Boolean(previousUser?.mustChangePassword);
      const passwordHash = incomingPassword
        ? hashPassword(incomingPassword)
        : storedPasswordHash
          ? storedPasswordHash
          : previousUser?.passwordHash
            ? previousUser.passwordHash
            : hashPassword(defaultPassword(role));
      const previousSessionVersion = Math.max(1, Number(previousUser?.sessionVersion || 1));
      const sessionVersion = previousUser
        ? previousUser.passwordHash !== passwordHash
          || previousUser.role !== role
          || Boolean(previousUser.isActive) !== Boolean(user.isActive)
          || Boolean(previousUser.mustChangePassword) !== Boolean(mustChangePassword)
          ? previousSessionVersion + 1
          : previousSessionVersion
        : Math.max(1, Number(user.sessionVersion || 1));
      return {
        ...user,
        email: loginIdentifier,
        role,
        passwordHash,
        password: undefined,
        mustChangePassword,
        temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || previousUser?.temporaryPasswordIssuedAt || null,
        sessionVersion,
        managerId: user.managerId ?? null,
        createdById: user.createdById ?? user.managerId ?? null,
      };
    }),
    inventoryItems: Array.isArray(state.inventoryItems) ? state.inventoryItems.map((item) => normalizeInventoryItemRecord(item, item?.id)) : getDefaultInventoryItems(),
    inventoryMovements: Array.isArray(state.inventoryMovements) ? state.inventoryMovements.map((movement) => normalizeInventoryMovementRecord(movement, null, movement?.id)) : [],
    catalog: Array.isArray(state.catalog) && state.catalog.length
      ? state.catalog.map((item) => sanitizeCatalogItemDraft(item, item?.id))
      : fallbackCatalog.map((item) => sanitizeCatalogItemDraft(item, item.id)),
    controlRows: Array.isArray(state.controlRows) ? state.controlRows : [],
    permissions,
    auditLog: Array.isArray(state.auditLog) ? state.auditLog : [],
    boardTemplates: Array.isArray(state.boardTemplates)
      ? state.boardTemplates.map((template) => ({
          ...template,
          category: template.category || "Personalizada",
          visibilityType: template.visibilityType || "department",
          sharedDepartments: Array.isArray(template.sharedDepartments) ? template.sharedDepartments : [],
          sharedUserIds: Array.isArray(template.sharedUserIds) ? template.sharedUserIds : [],
        }))
      : [],
    boardWeeklyCycle: normalizeBoardWeeklyCycle(state.boardWeeklyCycle),
    boardWeekHistory: Array.isArray(state.boardWeekHistory)
      ? state.boardWeekHistory.map((snapshot) => normalizeBoardHistorySnapshot(snapshot, permissions, users))
      : [],
    controlBoards: Array.isArray(state.controlBoards)
      ? state.controlBoards.map((board) => ({
          ...board,
          createdById: board.createdById ?? users[0]?.id ?? null,
          ownerId: board.ownerId ?? board.createdById ?? users[0]?.id ?? null,
          accessUserIds: Array.isArray(board.accessUserIds) ? board.accessUserIds : [],
          settings: {
            showWorkflow: true,
            showMetrics: true,
            showAssignee: true,
            showDates: true,
            ...(board.settings || {}),
          },
          fields: Array.isArray(board.fields) ? board.fields : Array.isArray(board.columns) ? board.columns.map((field) => ({ ...field, label: field.label || field.name, type: field.type || "text", colorRules: field.colorRules || [] })) : [],
          permissions: normalizeBoardPermissions(board.permissions, permissions, board),
          rows: Array.isArray(board.rows) ? board.rows : [],
        }))
      : [],
  };
}

function buildSampleState() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const previousWeekStart = addDays(weekStart, -7);
  const oldWeekStart = addDays(weekStart, -14);

  return {
    revision: 1,
    system: {
      masterBootstrapEnabled: true,
      masterUsername: "Maestro",
    },
    currentUserId: null,
    users: [],
    weeks: [
      { id: "week-active", name: getWeekName(weekStart), startDate: weekStart.toISOString(), endDate: endOfWeek(weekStart).toISOString(), isActive: true },
      { id: "week-prev", name: getWeekName(previousWeekStart), startDate: previousWeekStart.toISOString(), endDate: endOfWeek(previousWeekStart).toISOString(), isActive: false },
      { id: "week-old", name: getWeekName(oldWeekStart), startDate: oldWeekStart.toISOString(), endDate: endOfWeek(oldWeekStart).toISOString(), isActive: false },
    ],
    catalog: [
      { id: "cat-piso", name: "Piso producción", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "daily", category: "Limpieza" },
      { id: "cat-banos", name: "Lavado de baños", timeLimitMinutes: 40, isMandatory: true, isDeleted: false, frequency: "daily", category: "Limpieza" },
      { id: "cat-inspeccion", name: "Inspección nave", timeLimitMinutes: 75, isMandatory: true, isDeleted: false, frequency: "threeTimesWeek", category: "Seguridad" },
      { id: "cat-oficinas", name: "Limpieza oficinas", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "weekdays", category: "Limpieza" },
      { id: "cat-comedor", name: "Comedor", timeLimitMinutes: 50, isMandatory: true, isDeleted: false, frequency: "daily", category: "Servicios" },
      { id: "cat-vidrios", name: "Limpieza vidrios", timeLimitMinutes: 50, isMandatory: false, isDeleted: false, frequency: "twiceWeek", category: "Limpieza" },
      { id: "cat-rampas", name: "Revisión de rampas", timeLimitMinutes: 35, isMandatory: false, isDeleted: false, frequency: "weekly", category: "Seguridad" },
    ],
    inventoryItems: getDefaultInventoryItems(),
    inventoryMovements: [],
    activities: [],
    pauseLogs: [],
    controlRows: [],
    boardTemplates: [],
    boardWeeklyCycle: normalizeBoardWeeklyCycle(null, now),
    boardWeekHistory: [],
    permissions: buildDefaultPermissions(),
    auditLog: [],
    controlBoards: [],
    updatedAt: new Date().toISOString(),
  };
}

function ensureStore() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(buildSampleState(), null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataFilePath, "utf8");
  return normalizeState(JSON.parse(raw));
}

function writeStore(state) {
  ensureStore();
  fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), "utf8");
}

export function sanitizeUserRecord(user) {
  if (!user) return null;
  return {
    ...user,
    password: undefined,
    passwordHash: undefined,
  };
}

function sanitizeState(state) {
  return {
    ...state,
    users: (state.users || []).map((user) => sanitizeUserRecord(user)),
  };
}

export function getWarehouseState() {
  return sanitizeState(getRawWarehouseState());
}

function getRawWarehouseState() {
  const currentState = readStore();
  const { state: nextState, changed } = applyAutomatedBoardWeeklyCut(currentState);
  if (!changed) return currentState;

  const persistedState = normalizeState({
    ...nextState,
    revision: Number(currentState.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
  }, currentState);
  writeStore(persistedState);
  warehouseEvents.emit("state", sanitizeState(persistedState));
  return persistedState;
}

export function replaceWarehouseState(nextState) {
  const current = getRawWarehouseState();
  const mergedState = normalizeState({
    ...nextState,
    revision: Number(current.revision || 0) + 1,
    updatedAt: new Date().toISOString(),
  }, current);

  writeStore(mergedState);
  const sanitizedState = sanitizeState(mergedState);
  warehouseEvents.emit("state", sanitizedState);
  return sanitizedState;
}

export function createWarehouseWeekFromCatalog() {
  const current = getRawWarehouseState();
  const now = new Date();
  const weekId = makeId("week");
  const week = {
    id: weekId,
    name: getWeekName(now),
    startDate: startOfWeek(now).toISOString(),
    endDate: endOfWeek(now).toISOString(),
    isActive: true,
  };
  const activeUsers = current.users.filter((user) => user.isActive);
  let assigneeIndex = 0;
  const newActivities = current.catalog
    .filter((item) => !item.isDeleted)
    .flatMap((item) => {
      const responsibleId = activeUsers[assigneeIndex % Math.max(activeUsers.length, 1)]?.id || null;
      assigneeIndex += 1;
      return buildActivitiesForCatalogItem(weekId, item, startOfWeek(now), responsibleId);
    });

  return replaceWarehouseState({
    ...current,
    weeks: current.weeks.map((item) => ({ ...item, isActive: false })).concat(week),
    activities: current.activities.concat(newActivities),
  });
}

export function subscribeWarehouseState(listener) {
  warehouseEvents.on("state", listener);
  return () => warehouseEvents.off("state", listener);
}

export function findWarehouseUserById(userId) {
  return getRawWarehouseState().users.find((user) => user.id === userId) || null;
}

export function canManageWarehouseBoard(user, board) {
  if (!user || !board) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === ROLE_LEAD) return true;
  if (board.createdById === user.id || board.ownerId === user.id) return true;
  if ((board.accessUserIds || []).includes(user.id)) return true;
  return false;
}

export function canEditWarehouseBoard(user, board) {
  if (!user || !board) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === ROLE_LEAD) return true;
  return board.createdById === user.id;
}

export function canAccessWarehouseTemplate(user, template) {
  if (!user || !template) return false;
  const normalizedRole = normalizeRole(user.role);
  if (!template.isCustom) return true;
  if (normalizedRole === ROLE_LEAD) return true;
  if (template.createdById === user.id) return true;
  if (template.visibilityType === "all") return true;
  if (template.visibilityType === "department" && (template.sharedDepartments || []).includes(user.department || "")) return true;
  if (template.visibilityType === "users" && (template.sharedUserIds || []).includes(user.id)) return true;
  return false;
}

export function canManageWarehouseTemplate(user, template) {
  if (!user || !template) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === ROLE_LEAD) return true;
  return template.createdById === user.id;
}

export function canUserDoWarehouseAction(user, actionId, permissions = null) {
  if (!user || !actionId) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === ROLE_LEAD) return true;

  const resolvedPermissions = permissions || getRawWarehouseState().permissions;
  const normalizedPermissions = normalizePermissions(resolvedPermissions);
  const userOverride = normalizedPermissions.userOverrides?.[user.id]?.actions?.[actionId];
  if (typeof userOverride === "boolean") return userOverride;
  return userMatchesPermissionEntry(user, normalizedPermissions.actions?.[actionId]);
}

export function canUserAccessWarehousePage(user, pageId, permissions = null) {
  if (!user || !pageId) return false;
  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole === ROLE_LEAD) return true;

  const resolvedPermissions = permissions || getRawWarehouseState().permissions;
  const normalizedPermissions = normalizePermissions(resolvedPermissions);
  const userOverride = normalizedPermissions.userOverrides?.[user.id]?.pages?.[pageId];
  if (typeof userOverride === "boolean") return userOverride;
  return userMatchesPermissionEntry(user, normalizedPermissions.pages?.[pageId]);
}

export function canUserDoBoardAction(user, boardId, actionId) {
  if (!user || !boardId || !actionId) return false;
  const currentState = getRawWarehouseState();
  const board = (currentState.controlBoards || []).find((item) => item.id === boardId);
  if (!board) return false;
  if (!canManageWarehouseBoard(user, board)) return false;
  return canUserDoWarehouseAction(user, actionId, currentState.permissions);
}

function canManageUserRole(actorRole, targetRole) {
  const normalizedActorRole = normalizeRole(actorRole);
  const normalizedTargetRole = normalizeRole(targetRole);
  if (normalizedActorRole === ROLE_LEAD) return true;
  if (normalizedActorRole === ROLE_SR) return [ROLE_SSR, ROLE_JR].includes(normalizedTargetRole);
  if (normalizedActorRole === ROLE_SSR) return normalizedTargetRole === ROLE_JR;
  return false;
}

function canBypassSelfProfileEditLimit(user) {
  const normalizedRole = normalizeRole(user?.role);
  return normalizedRole === ROLE_LEAD || normalizedRole === ROLE_SR;
}

function sanitizeWarehouseUserDraft(payload = {}, fallbackManagerId = null) {
  const role = normalizeRole(payload.role);
  const area = String(payload.area ?? payload.department ?? "").trim();
  return {
    id: payload.id || makeId("usr"),
    name: String(payload.name || "").trim(),
    email: String((payload.username ?? payload.email) || "").trim(),
    role,
    area,
    department: area,
    jobTitle: String(payload.jobTitle || "").trim(),
    isActive: Boolean(payload.isActive),
    managerId: payload.managerId ?? fallbackManagerId,
    createdById: payload.createdById ?? fallbackManagerId,
    selfIdentityEditCount: Math.max(0, Number(payload.selfIdentityEditCount ?? 0) || 0),
    mustChangePassword: Boolean(payload.mustChangePassword),
    temporaryPasswordIssuedAt: payload.temporaryPasswordIssuedAt || null,
    ...(String(payload.password || "").trim() ? { password: String(payload.password || "").trim() } : {}),
  };
}

function buildEffectivePermissionSelection(user, permissionsModel) {
  return {
    pages: Object.fromEntries(Object.keys(PAGE_PERMISSIONS).map((pageId) => [pageId, canUserAccessWarehousePage(user, pageId, permissionsModel)])),
    actions: Object.fromEntries(Object.keys(ACTION_PERMISSIONS).map((actionId) => [actionId, canUserDoWarehouseAction(user, actionId, permissionsModel)])),
  };
}

function buildUserOverridesForDraft(user, requestedOverrides, permissionsModel) {
  if (!supportsManagedPermissionOverrides(user.role)) {
    return null;
  }

  const baseSelection = buildEffectivePermissionSelection(user, permissionsModel);
  const nextOverride = {
    pages: Object.fromEntries(Object.keys(PAGE_PERMISSIONS)
      .map((pageId) => [pageId, requestedOverrides?.pages?.[pageId]])
      .filter(([, value]) => typeof value === "boolean")
      .filter(([pageId, value]) => value !== baseSelection.pages[pageId])),
    actions: Object.fromEntries(Object.keys(ACTION_PERMISSIONS)
      .map((actionId) => [actionId, requestedOverrides?.actions?.[actionId]])
      .filter(([, value]) => typeof value === "boolean")
      .filter(([actionId, value]) => value !== baseSelection.actions[actionId])),
  };

  return Object.keys(nextOverride.pages).length > 0 || Object.keys(nextOverride.actions).length > 0 ? nextOverride : null;
}

export function createWarehouseUser(auth, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const temporaryPassword = String(payload.password || "").trim();
  if (!isTemporaryPassword(temporaryPassword)) {
    return { ok: false, reason: "weak_temporary_password" };
  }

  const nextUser = sanitizeWarehouseUserDraft({
    ...payload,
    password: temporaryPassword,
    mustChangePassword: true,
    temporaryPasswordIssuedAt: new Date().toISOString(),
    selfIdentityEditCount: 0,
  }, currentUser.id);
  if (!nextUser.name || !nextUser.email || !nextUser.area || !nextUser.jobTitle) {
    return { ok: false, reason: "invalid_payload" };
  }
  if (!canManageUserRole(currentUser.role, nextUser.role)) {
    return { ok: false, reason: "forbidden" };
  }
  if ((currentState.users || []).some((user) => normalizeKey(user.email) === normalizeKey(nextUser.email))) {
    return { ok: false, reason: "duplicate_email" };
  }

  const currentOverrides = currentState.permissions?.userOverrides || {};
  const basePermissions = normalizePermissions({
    ...currentState.permissions,
    userOverrides: currentOverrides,
  });
  const directOverride = canUserDoWarehouseAction(currentUser, "managePermissions", currentState.permissions)
    ? buildUserOverridesForDraft(nextUser, payload.permissionOverrides, basePermissions)
    : null;

  const nextState = {
    ...currentState,
    users: (currentState.users || []).concat(nextUser),
    permissions: {
      ...currentState.permissions,
      userOverrides: directOverride ? { ...currentOverrides, [nextUser.id]: directOverride } : currentOverrides,
    },
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId: nextUser.id, userName: nextUser.name };
}

export function updateWarehouseUser(auth, userId, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const existingUser = (currentState.users || []).find((user) => user.id === userId);
  if (!existingUser) return { ok: false, reason: "user_not_found" };

  const nextUser = sanitizeWarehouseUserDraft({ ...existingUser, ...payload, id: userId }, existingUser.managerId || currentUser.id);
  if (!nextUser.name || !nextUser.email || !nextUser.area || !nextUser.jobTitle) {
    return { ok: false, reason: "invalid_payload" };
  }
  if (!canManageUserRole(currentUser.role, existingUser.role) || !canManageUserRole(currentUser.role, nextUser.role)) {
    return { ok: false, reason: "forbidden" };
  }
  if ((currentState.users || []).some((user) => user.id !== userId && normalizeKey(user.email) === normalizeKey(nextUser.email))) {
    return { ok: false, reason: "duplicate_email" };
  }

  const currentOverrides = currentState.permissions?.userOverrides || {};
  const remainingOverrides = Object.fromEntries(Object.entries(currentOverrides).filter(([overrideUserId]) => overrideUserId !== userId));
  const basePermissions = normalizePermissions({
    ...currentState.permissions,
    userOverrides: remainingOverrides,
  });
  const directOverride = canUserDoWarehouseAction(currentUser, "managePermissions", currentState.permissions)
    ? buildUserOverridesForDraft(nextUser, payload.permissionOverrides, basePermissions)
    : null;

  const nextState = {
    ...currentState,
    users: (currentState.users || []).map((user) => (user.id === userId ? nextUser : user)),
    permissions: {
      ...currentState.permissions,
      userOverrides: directOverride ? { ...remainingOverrides, [userId]: directOverride } : remainingOverrides,
    },
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId: nextUser.id, userName: nextUser.name };
}

export function deleteWarehouseUser(auth, userId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "deleteUsers", currentState.permissions)) return { ok: false, reason: "forbidden" };
  if (currentUser.id === userId) return { ok: false, reason: "forbidden" };

  const targetUser = (currentState.users || []).find((user) => user.id === userId);
  if (!targetUser) return { ok: false, reason: "user_not_found" };
  if (!canManageUserRole(currentUser.role, targetUser.role)) return { ok: false, reason: "forbidden" };

  const remainingUsers = (currentState.users || []).filter((user) => user.id !== userId);
  const nextState = {
    ...currentState,
    users: remainingUsers,
    activities: (currentState.activities || []).map((activity) => (activity.responsibleId === userId ? { ...activity, responsibleId: null } : activity)),
    permissions: {
      ...currentState.permissions,
      userOverrides: Object.fromEntries(Object.entries(currentState.permissions?.userOverrides || {}).filter(([overrideUserId]) => overrideUserId !== userId)),
    },
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId: targetUser.id, userName: targetUser.name };
}

export function toggleWarehouseUserActive(auth, userId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const targetUser = (currentState.users || []).find((user) => user.id === userId);
  if (!targetUser) return { ok: false, reason: "user_not_found" };
  if (currentUser.id === userId || !canManageUserRole(currentUser.role, targetUser.role)) return { ok: false, reason: "forbidden" };

  const nextState = {
    ...currentState,
    users: (currentState.users || []).map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId: targetUser.id, isActive: !targetUser.isActive };
}

export function updateWarehouseSelfProfile(auth, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const trimmedPatch = {
    name: String(payload.name || "").trim(),
    email: String((payload.username ?? payload.email) || "").trim(),
    area: String(payload.area || "").trim(),
    department: String(payload.area || "").trim(),
    jobTitle: String(payload.jobTitle || "").trim(),
  };
  if (!trimmedPatch.name || !trimmedPatch.email || !trimmedPatch.area || !trimmedPatch.jobTitle) {
    return { ok: false, reason: "invalid_payload" };
  }
  if ((getRawWarehouseState().users || []).some((user) => user.id !== currentUser.id && normalizeKey(user.email) === normalizeKey(trimmedPatch.email))) {
    return { ok: false, reason: "duplicate_email" };
  }
  if (!canBypassSelfProfileEditLimit(currentUser) && Number(currentUser.selfIdentityEditCount ?? 0) >= 1) {
    return { ok: false, reason: "self_edit_limit_reached" };
  }

  const nextState = {
    ...getRawWarehouseState(),
    users: getRawWarehouseState().users.map((user) => (user.id === currentUser.id
      ? {
          ...user,
          ...trimmedPatch,
          selfIdentityEditCount: canBypassSelfProfileEditLimit(currentUser) ? user.selfIdentityEditCount : Number(user.selfIdentityEditCount ?? 0) + 1,
        }
      : user)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId: currentUser.id };
}

export function changeWarehouseSelfPassword(auth, nextPassword) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const password = String(nextPassword || "").trim();
  if (!isStrongPassword(password)) {
    return { ok: false, reason: "weak_password" };
  }

  const currentState = getRawWarehouseState();
  const nextState = {
    ...currentState,
    users: (currentState.users || []).map((user) => (user.id === currentUser.id
      ? {
          ...user,
          password,
          mustChangePassword: false,
          temporaryPasswordIssuedAt: null,
        }
      : user)),
  };
  const state = replaceWarehouseState(nextState);
  const updatedUser = (state.users || []).find((user) => user.id === currentUser.id) || null;
  return { ok: true, state, user: updatedUser };
}

export function resetWarehouseUserPassword(auth, userId, nextPassword) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "resetPasswords", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const targetUser = (currentState.users || []).find((user) => user.id === userId);
  if (!targetUser) return { ok: false, reason: "user_not_found" };
  if (!canManageUserRole(currentUser.role, targetUser.role)) return { ok: false, reason: "forbidden" };

  const password = String(nextPassword || "").trim();
  if (!isTemporaryPassword(password)) {
    return { ok: false, reason: "weak_temporary_password" };
  }

  const nextState = {
    ...currentState,
    users: (currentState.users || []).map((user) => (user.id === userId
      ? {
          ...user,
          password,
          mustChangePassword: true,
          temporaryPasswordIssuedAt: new Date().toISOString(),
        }
      : user)),
  };
  return { ok: true, state: replaceWarehouseState(nextState), userId: targetUser.id, userName: targetUser.name };
}

function getBoardFieldDefaultValue(field, currentUserId) {
  if (field?.defaultValue !== undefined && field?.defaultValue !== null && String(field.defaultValue).trim() !== "") {
    if (field.type === "number") return Number(field.defaultValue || 0);
    if (field.type === "boolean") return String(field.defaultValue).toLowerCase() === "si" ? "Si" : field.defaultValue;
    return field.defaultValue;
  }

  if (field?.type === "status") return "Pendiente";
  if (field?.type === "user") return currentUserId || "";
  if (field?.type === "boolean") return "No";
  if (field?.type === "date") return new Date().toISOString().slice(0, 10);
  return "";
}

function updateElapsedForFinish(row, nowIso) {
  if (!row?.lastResumedAt) return Number(row?.accumulatedSeconds || 0);
  return Math.max(0, Number(row?.accumulatedSeconds || 0) + Math.floor((new Date(nowIso) - new Date(row.lastResumedAt)) / 1000));
}

function findBoardAndRow(currentState, boardId, rowId = null) {
  const boardIndex = (currentState.controlBoards || []).findIndex((board) => board.id === boardId);
  if (boardIndex === -1) return { boardIndex: -1, rowIndex: -1, board: null, row: null };
  const board = currentState.controlBoards[boardIndex];
  const rowIndex = rowId ? (board.rows || []).findIndex((row) => row.id === rowId) : -1;
  const row = rowIndex >= 0 ? board.rows[rowIndex] : null;
  return { boardIndex, rowIndex, board, row };
}

function cloneBoardFieldBundle(fields) {
  const idMap = new Map();
  const clonedFields = (fields || []).map((field) => {
    const id = makeId("fld");
    idMap.set(field.id, id);
    idMap.set(field.templateKey || field.label, id);
    return {
      ...field,
      id,
      colorRules: field.colorRules || [],
    };
  });

  return {
    idMap,
    fields: clonedFields.map((field) => ({
      ...field,
      sourceFieldId: idMap.get(field.sourceFieldId) || field.sourceFieldId,
      formulaLeftFieldId: idMap.get(field.formulaLeftFieldId) || field.formulaLeftFieldId,
      formulaRightFieldId: idMap.get(field.formulaRightFieldId) || field.formulaRightFieldId,
    })),
  };
}

function sanitizeBoardDraft(draft, currentUserId) {
  const ownerId = String(draft?.ownerId || currentUserId || "").trim() || currentUserId;
  return {
    name: String(draft?.name || "").trim(),
    description: String(draft?.description || "").trim(),
    ownerId,
    accessUserIds: Array.from(new Set((Array.isArray(draft?.accessUserIds) ? draft.accessUserIds : []).filter((userId) => userId && userId !== ownerId))),
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      ...(draft?.settings || {}),
    },
    fields: Array.isArray(draft?.columns) ? draft.columns.map((field) => ({ ...field, colorRules: field.colorRules || [] })) : [],
  };
}

function findBoardActivityListField(fields = []) {
  return (fields || []).find((field) => field?.type === "select" && field?.optionSource === "catalogByCategory") || null;
}

function getBoardActivityListValues(field, catalog = []) {
  const selectedCategory = String(field?.optionCatalogCategory || "").trim();
  const seen = new Set();
  return (catalog || [])
    .filter((item) => !item?.isDeleted)
    .filter((item) => !selectedCategory || String(item.category || "General").trim() === selectedCategory)
    .map((item) => String(item.name || "").trim())
    .filter((name) => {
      const normalizedName = normalizeKey(name);
      if (!normalizedName || seen.has(normalizedName)) return false;
      seen.add(normalizedName);
      return true;
    });
}

function findMatchingPreviousBoardField(nextField, previousFields = []) {
  if (!nextField) return null;
  return (previousFields || []).find((field) => field.id === nextField.id)
    || (nextField.templateKey ? (previousFields || []).find((field) => field.templateKey && field.templateKey === nextField.templateKey) : null)
    || (previousFields || []).find((field) => (
      normalizeKey(field.label) === normalizeKey(nextField.label)
      && String(field.type || "") === String(nextField.type || "")
      && normalizeKey(field.groupName || "General") === normalizeKey(nextField.groupName || "General")
    ))
    || null;
}

function remapBoardRowValues(row, previousFields, nextFields, fallbackResponsibleId) {
  return (nextFields || []).reduce((accumulator, nextField) => {
    if (Object.prototype.hasOwnProperty.call(row?.values || {}, nextField.id)) {
      accumulator[nextField.id] = row.values[nextField.id];
      return accumulator;
    }

    const matchedPreviousField = findMatchingPreviousBoardField(nextField, previousFields);
    if (matchedPreviousField && Object.prototype.hasOwnProperty.call(row?.values || {}, matchedPreviousField.id)) {
      accumulator[nextField.id] = row.values[matchedPreviousField.id];
      return accumulator;
    }

    accumulator[nextField.id] = getBoardFieldDefaultValue(nextField, row?.responsibleId || fallbackResponsibleId);
    return accumulator;
  }, {});
}

function createBoardRowRecord(fields, responsibleId, partial = {}) {
  const effectiveResponsibleId = partial?.responsibleId || responsibleId || "";
  const baseValues = (fields || []).reduce((accumulator, field) => {
    accumulator[field.id] = getBoardFieldDefaultValue(field, effectiveResponsibleId);
    return accumulator;
  }, {});

  const nextRow = {
    id: partial?.id || makeId("row"),
    values: {
      ...baseValues,
      ...(partial?.values || {}),
    },
    responsibleId: effectiveResponsibleId,
    status: partial?.status || "Pendiente",
    startTime: partial?.startTime ?? null,
    endTime: partial?.endTime ?? null,
    accumulatedSeconds: Number(partial?.accumulatedSeconds || 0),
    lastResumedAt: partial?.lastResumedAt ?? null,
    createdAt: partial?.createdAt || new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(partial || {}, "lastPauseReason")) {
    nextRow.lastPauseReason = partial.lastPauseReason || "";
  }

  return nextRow;
}

function buildBoardRowsFromActivityList(fields, catalog, responsibleId, previousFields = [], previousRows = []) {
  const nextFields = Array.isArray(fields) ? fields : [];
  const normalizedPreviousFields = Array.isArray(previousFields) ? previousFields : [];
  const normalizedPreviousRows = Array.isArray(previousRows) ? previousRows : [];
  const activityListField = findBoardActivityListField(nextFields);

  if (!activityListField) {
    return normalizedPreviousRows.map((row) => createBoardRowRecord(nextFields, row?.responsibleId || responsibleId, {
      ...row,
      values: remapBoardRowValues(row, normalizedPreviousFields, nextFields, row?.responsibleId || responsibleId),
    }));
  }

  const activityNames = getBoardActivityListValues(activityListField, catalog);
  const previousActivityField = findBoardActivityListField(normalizedPreviousFields) || findMatchingPreviousBoardField(activityListField, normalizedPreviousFields);
  const usedRowIds = new Set();

  const seededRows = activityNames.map((activityName) => {
    const matchingRow = normalizedPreviousRows.find((row) => {
      if (!row || usedRowIds.has(row.id)) return false;
      const rowValues = row.values || {};
      const previousValue = previousActivityField?.id && Object.prototype.hasOwnProperty.call(rowValues, previousActivityField.id)
        ? rowValues[previousActivityField.id]
        : rowValues[activityListField.id];
      return normalizeKey(previousValue) === normalizeKey(activityName);
    });

    const rowResponsibleId = matchingRow?.responsibleId || responsibleId;
    const nextValues = matchingRow
      ? remapBoardRowValues(matchingRow, normalizedPreviousFields, nextFields, rowResponsibleId)
      : (nextFields || []).reduce((accumulator, field) => {
        accumulator[field.id] = getBoardFieldDefaultValue(field, rowResponsibleId);
        return accumulator;
      }, {});

    nextValues[activityListField.id] = activityName;
    if (matchingRow) usedRowIds.add(matchingRow.id);

    return createBoardRowRecord(nextFields, rowResponsibleId, {
      ...(matchingRow || {}),
      values: nextValues,
    });
  });

  const remainingRows = normalizedPreviousRows
    .filter((row) => row && !usedRowIds.has(row.id))
    .map((row) => createBoardRowRecord(nextFields, row.responsibleId || responsibleId, {
      ...row,
      values: remapBoardRowValues(row, normalizedPreviousFields, nextFields, row.responsibleId || responsibleId),
    }));

  return seededRows.concat(remainingRows);
}

function sanitizeTemplateDraft(draft, currentUser) {
  const visibilityType = ["all", "department", "users"].includes(draft?.visibilityType) ? draft.visibilityType : "department";
  return {
    name: String(draft?.name || "").trim(),
    description: String(draft?.description || "").trim(),
    category: String(draft?.category || "").trim() || "Personalizada",
    visibilityType,
    sharedDepartments: Array.from(new Set((Array.isArray(draft?.sharedDepartments) ? draft.sharedDepartments : []).map((entry) => String(entry || "").trim()).filter(Boolean))),
    sharedUserIds: Array.from(new Set((Array.isArray(draft?.sharedUserIds) ? draft.sharedUserIds : []).map((entry) => String(entry || "").trim()).filter(Boolean))),
    settings: {
      showWorkflow: true,
      showMetrics: true,
      showAssignee: true,
      showDates: true,
      ...(draft?.settings || {}),
    },
    columns: Array.isArray(draft?.columns)
      ? draft.columns.map((column) => ({
          ...column,
          templateKey: column.templateKey || column.id || column.label,
          options: Array.isArray(column.options) ? [...column.options] : [],
          colorRules: Array.isArray(column.colorRules) ? column.colorRules.map((rule) => ({ ...rule })) : [],
        }))
      : [],
    creatorDepartment: currentUser?.department || "",
  };
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeAreaOption(area) {
  return String(area || "").trim().toUpperCase();
}

function buildAreaCatalogEntries(users = [], catalog = []) {
  return Array.from(new Set((catalog || []).concat((users || []).map((user) => normalizeAreaOption(user.area || user.department || ""))).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function sanitizeInventoryItemDraft(item, existingId = null) {
  return normalizeInventoryItemRecord(item, existingId);
}

export function createWarehouseInventoryItem(auth, payload) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, getInventoryManageActionId(payload?.domain), currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const item = sanitizeInventoryItemDraft(payload);
  if (!item.code || !item.name || Number.isNaN(item.piecesPerBox) || Number.isNaN(item.boxesPerPallet)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const duplicate = (currentState.inventoryItems || []).find((entry) => normalizeKey(entry.code) === normalizeKey(item.code));
  if (duplicate) {
    return { ok: false, reason: "duplicate_code" };
  }

  const nextState = {
    ...currentState,
    inventoryItems: [...(currentState.inventoryItems || []), item],
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: item.id, itemCode: item.code };
}

export function updateWarehouseInventoryItem(auth, itemId, payload) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const currentItem = (currentState.inventoryItems || []).find((entry) => entry.id === itemId);
  if (!currentItem) return { ok: false, reason: "item_not_found" };

  const nextDomain = normalizeInventoryDomain(payload?.domain || currentItem.domain);
  const allowed = [getInventoryManageActionId(currentItem.domain), getInventoryManageActionId(nextDomain)]
    .every((actionId) => canUserDoWarehouseAction(currentUser, actionId, currentState.permissions));
  if (!allowed) {
    return { ok: false, reason: "forbidden" };
  }

  const item = mergeInventoryItemTransferTargets(currentItem, sanitizeInventoryItemDraft(payload, itemId));
  if (!item.code || !item.name || Number.isNaN(item.piecesPerBox) || Number.isNaN(item.boxesPerPallet)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const duplicate = (currentState.inventoryItems || []).find((entry) => entry.id !== itemId && normalizeKey(entry.code) === normalizeKey(item.code));
  if (duplicate) {
    return { ok: false, reason: "duplicate_code" };
  }

  const nextState = {
    ...currentState,
    inventoryItems: (currentState.inventoryItems || []).map((entry) => (entry.id === itemId ? item : entry)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: item.id, itemCode: item.code };
}

export function deleteWarehouseInventoryItem(auth, itemId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const currentItem = (currentState.inventoryItems || []).find((entry) => entry.id === itemId);
  if (!currentItem) return { ok: false, reason: "item_not_found" };
  if (!canUserDoWarehouseAction(currentUser, getInventoryManageActionId(currentItem.domain), currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextState = {
    ...currentState,
    inventoryItems: (currentState.inventoryItems || []).filter((entry) => entry.id !== itemId),
    inventoryMovements: (currentState.inventoryMovements || []).filter((entry) => entry.itemId !== itemId),
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: currentItem.id, itemCode: currentItem.code };
}

export function importWarehouseInventoryItems(auth, items) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, reason: "invalid_payload" };
  }

  const importActionIds = Array.from(new Set(items.map((item) => getInventoryImportActionId(item?.domain))));
  if (!importActionIds.every((actionId) => canUserDoWarehouseAction(currentUser, actionId, currentState.permissions))) {
    return { ok: false, reason: "forbidden" };
  }

  const mergedByCode = new Map((currentState.inventoryItems || []).map((item) => [normalizeKey(item.code), item]));
  let createdCount = 0;
  let updatedCount = 0;

  for (const rawItem of items) {
    const sanitized = sanitizeInventoryItemDraft(rawItem);
    if (!sanitized.code || !sanitized.name || Number.isNaN(sanitized.piecesPerBox) || Number.isNaN(sanitized.boxesPerPallet)) {
      return { ok: false, reason: "invalid_payload" };
    }

    const key = normalizeKey(sanitized.code);
    const currentItem = mergedByCode.get(key);
    if (currentItem) {
      updatedCount += 1;
      mergedByCode.set(key, normalizeInventoryItemRecord(mergeInventoryItemTransferTargets(currentItem, { ...currentItem, ...sanitized }), currentItem.id));
    } else {
      createdCount += 1;
      mergedByCode.set(key, normalizeInventoryItemRecord(sanitized, makeId("inv")));
    }
  }

  const nextState = {
    ...currentState,
    inventoryItems: Array.from(mergedByCode.values()),
  };

  return {
    ok: true,
    state: replaceWarehouseState(nextState),
    createdCount,
    updatedCount,
  };
}

export function createWarehouseInventoryMovement(auth, payload) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const itemId = String(payload?.itemId || "").trim();
  const quantity = Math.max(0, Number(payload?.quantity || 0));
  if (!itemId || !quantity || Number.isNaN(quantity)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const currentItem = (currentState.inventoryItems || []).find((entry) => entry.id === itemId);
  if (!currentItem) return { ok: false, reason: "item_not_found" };
  if (!canUserDoWarehouseAction(currentUser, getInventoryManageActionId(currentItem.domain), currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const movementType = normalizeInventoryMovementType(payload?.movementType);
  const currentDomain = normalizeInventoryDomain(currentItem.domain);
  const currentTransferTargets = (Array.isArray(currentItem.transferTargets) ? currentItem.transferTargets : [])
    .map((target) => normalizeInventoryTransferTargetRecord(target, currentItem.unitLabel || "pzas"));
  const allocatedUnits = sumInventoryTransferTargetUnits(currentTransferTargets);
  const movementCreatedAt = new Date().toISOString();
  const unitLabel = String(payload?.unitLabel || currentItem.unitLabel || "pzas").trim() || "pzas";

  let nextStockUnits = Number(currentItem.stockUnits || 0);
  let nextStorageLocation = String(payload?.storageLocation || currentItem.storageLocation || "").trim();
  let nextTransferTargets = currentTransferTargets;
  let remainingUnits = null;
  let destinationBalanceUnits = null;
  let destinationKey = String(payload?.destinationKey || "").trim();

  if (movementType === "restock") {
    nextStockUnits += quantity;
  } else if (movementType === "consume") {
    nextStockUnits -= quantity;
    if (nextStockUnits < 0 || (currentDomain === "orders" && nextStockUnits < allocatedUnits)) {
      return { ok: false, reason: "insufficient_stock" };
    }
  } else if (movementType === "transfer" && currentDomain === "orders") {
    const warehouse = String(payload?.warehouse || "").trim();
    const storageLocation = String(payload?.storageLocation || "").trim();
    if (!warehouse && !storageLocation) {
      return { ok: false, reason: "invalid_transfer_target" };
    }

    destinationKey = buildInventoryTransferTargetKey(warehouse, storageLocation);
    const targetIndex = currentTransferTargets.findIndex((target) => target.destinationKey === destinationKey);
    const existingTarget = targetIndex >= 0 ? currentTransferTargets[targetIndex] : null;
    const previousBalanceUnits = Math.max(0, Number(existingTarget?.availableUnits || 0));
    const hasRemainingUnits = hasInventoryBalanceInput(payload?.remainingUnits);

    if (existingTarget && !hasRemainingUnits) {
      return { ok: false, reason: "remaining_units_required" };
    }

    if (hasRemainingUnits) {
      remainingUnits = Math.max(0, Number(payload?.remainingUnits || 0));
      if (Number.isNaN(remainingUnits)) {
        return { ok: false, reason: "invalid_payload" };
      }
    }

    const reconciledBalanceUnits = hasRemainingUnits ? remainingUnits : previousBalanceUnits;
    const otherAllocatedUnits = sumInventoryTransferTargetUnits(currentTransferTargets.filter((_, index) => index !== targetIndex));
    const reconciledStockUnits = nextStockUnits + (reconciledBalanceUnits - previousBalanceUnits);
    const availableToTransferUnits = reconciledStockUnits - otherAllocatedUnits - reconciledBalanceUnits;
    if (availableToTransferUnits < quantity) {
      return { ok: false, reason: "insufficient_stock" };
    }

    destinationBalanceUnits = reconciledBalanceUnits + quantity;
    nextStockUnits = reconciledStockUnits;
    nextStorageLocation = String(currentItem.storageLocation || "").trim();

    const nextTarget = normalizeInventoryTransferTargetRecord({
      ...existingTarget,
      destinationKey,
      warehouse,
      storageLocation,
      recipientName: String(payload?.recipientName || existingTarget?.recipientName || "").trim(),
      unitLabel,
      availableUnits: destinationBalanceUnits,
      updatedAt: movementCreatedAt,
    }, unitLabel);
    if (targetIndex >= 0) {
      nextTransferTargets = currentTransferTargets.map((target, index) => (index === targetIndex ? nextTarget : target));
    } else {
      nextTransferTargets = [nextTarget, ...currentTransferTargets];
    }
  } else {
    nextStockUnits -= quantity;
    if (nextStockUnits < 0 || (currentDomain === "orders" && nextStockUnits < allocatedUnits)) {
      return { ok: false, reason: "insufficient_stock" };
    }
  }

  const nextItem = normalizeInventoryItemRecord({
    ...currentItem,
    stockUnits: nextStockUnits,
    storageLocation: nextStorageLocation,
    transferTargets: nextTransferTargets,
  }, currentItem.id);
  const movement = normalizeInventoryMovementRecord({
    ...payload,
    itemId: currentItem.id,
    itemCode: currentItem.code,
    itemName: currentItem.name,
    domain: currentItem.domain,
    unitLabel,
    remainingUnits,
    destinationBalanceUnits,
    destinationKey,
    performedById: currentUser.id,
    createdAt: movementCreatedAt,
  }, currentItem);

  const nextState = {
    ...currentState,
    inventoryItems: (currentState.inventoryItems || []).map((entry) => (entry.id === itemId ? nextItem : entry)),
    inventoryMovements: [movement, ...(currentState.inventoryMovements || [])],
  };

  return {
    ok: true,
    state: replaceWarehouseState(nextState),
    movementId: movement.id,
    itemId: currentItem.id,
    itemCode: currentItem.code,
  };
}

export function addWarehouseArea(auth, areaName) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextArea = normalizeAreaOption(areaName);
  if (!nextArea) return { ok: false, reason: "invalid_payload" };
  const nextCatalog = buildAreaCatalogEntries(currentState.users, (currentState.areaCatalog || []).concat(nextArea));
  if ((currentState.areaCatalog || []).includes(nextArea)) {
    return { ok: false, reason: "duplicate_area" };
  }

  const nextState = {
    ...currentState,
    areaCatalog: nextCatalog,
  };

  return { ok: true, state: replaceWarehouseState(nextState), area: nextArea };
}

function sanitizeCatalogItemDraft(payload = {}, existingId = null) {
  return {
    id: existingId || payload.id || makeId("cat"),
    name: String(payload.name || "").trim(),
    timeLimitMinutes: Number(payload.timeLimitMinutes || 0),
    isMandatory: Boolean(payload.isMandatory),
    frequency: normalizeCatalogFrequency(payload.frequency),
    category: normalizeCatalogCategory(payload.category),
    isDeleted: Boolean(payload.isDeleted),
  };
}

function normalizeCatalogCategory(value) {
  const normalizedValue = String(value || "General").trim();
  return normalizedValue || "General";
}

function normalizeCatalogFrequency(value) {
  const normalizedValue = String(value || "").trim();
  return ["daily", "every2days", "every3days", "weekdays", "twiceWeek", "threeTimesWeek", "fourTimesWeek", "fiveTimesWeek", "sixTimesWeek", "weekly"].includes(normalizedValue)
    ? normalizedValue
    : "weekly";
}

function getCatalogFrequencyDayOffsets(value) {
  const normalizedValue = normalizeCatalogFrequency(value);
  return {
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
  }[normalizedValue] || [0];
}

function buildActivitiesForCatalogItem(weekId, item, weekStart, responsibleId) {
  return getCatalogFrequencyDayOffsets(item.frequency).map((dayOffset) => ({
    id: makeId("act"),
    weekId,
    catalogActivityId: item.id,
    responsibleId,
    status: "Pendiente",
    activityDate: isoAt(addDays(weekStart, dayOffset), 8, 0),
    startTime: null,
    endTime: null,
    accumulatedSeconds: 0,
    lastResumedAt: null,
    customName: item.name,
  }));
}

export function createWarehouseCatalogItem(auth, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };
  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageCatalog", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const item = sanitizeCatalogItemDraft(payload);
  if (!item.name || item.timeLimitMinutes <= 0) return { ok: false, reason: "invalid_payload" };

  const nextState = {
    ...currentState,
    catalog: (currentState.catalog || []).concat(item),
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: item.id, itemName: item.name };
}

export function updateWarehouseCatalogItem(auth, itemId, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };
  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageCatalog", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const existingItem = (currentState.catalog || []).find((item) => item.id === itemId);
  if (!existingItem) return { ok: false, reason: "item_not_found" };

  const item = sanitizeCatalogItemDraft({ ...existingItem, ...payload }, itemId);
  if (!item.name || item.timeLimitMinutes <= 0) return { ok: false, reason: "invalid_payload" };

  const nextState = {
    ...currentState,
    catalog: (currentState.catalog || []).map((entry) => (entry.id === itemId ? item : entry)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: item.id, itemName: item.name };
}

export function deleteWarehouseCatalogItem(auth, itemId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };
  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "manageCatalog", currentState.permissions)) return { ok: false, reason: "forbidden" };

  const existingItem = (currentState.catalog || []).find((item) => item.id === itemId);
  if (!existingItem) return { ok: false, reason: "item_not_found" };

  const nextState = {
    ...currentState,
    catalog: (currentState.catalog || []).map((entry) => (entry.id === itemId ? { ...entry, isDeleted: true } : entry)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), itemId: existingItem.id, itemName: existingItem.name };
}

export function createWarehouseTemplate(auth, draft) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "saveTemplate", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const normalizedDraft = sanitizeTemplateDraft(draft, currentUser);
  if (!normalizedDraft.name || !normalizedDraft.columns.length) {
    return { ok: false, reason: "invalid_payload" };
  }

  const template = {
    id: makeId("tpl"),
    name: normalizedDraft.name,
    description: normalizedDraft.description || `Plantilla reutilizable para ${normalizedDraft.name}.`,
    category: normalizedDraft.category,
    visibilityType: normalizedDraft.visibilityType,
    sharedDepartments: normalizedDraft.visibilityType === "department"
      ? (normalizedDraft.sharedDepartments.length ? normalizedDraft.sharedDepartments : (normalizedDraft.creatorDepartment ? [normalizedDraft.creatorDepartment] : []))
      : normalizedDraft.sharedDepartments,
    sharedUserIds: normalizedDraft.visibilityType === "users"
      ? (normalizedDraft.sharedUserIds.length ? normalizedDraft.sharedUserIds : [currentUser.id])
      : normalizedDraft.sharedUserIds,
    settings: normalizedDraft.settings,
    columns: normalizedDraft.columns,
    isCustom: true,
    createdAt: new Date().toISOString(),
    createdById: currentUser.id,
  };

  const nextState = {
    ...currentState,
    boardTemplates: [...(currentState.boardTemplates || []), template],
  };

  return { ok: true, state: replaceWarehouseState(nextState), templateId: template.id, templateName: template.name };
}

export function updateWarehouseTemplate(auth, templateId, draft) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const template = (currentState.boardTemplates || []).find((item) => item.id === templateId);
  if (!template) return { ok: false, reason: "template_not_found" };
  if (!template.isCustom) return { ok: false, reason: "forbidden" };
  if (!canUserDoWarehouseAction(currentUser, "editTemplate", currentState.permissions) || !canManageWarehouseTemplate(currentUser, template)) {
    return { ok: false, reason: "forbidden" };
  }

  const normalizedDraft = sanitizeTemplateDraft({ ...template, ...draft }, currentUser);
  if (!normalizedDraft.name) {
    return { ok: false, reason: "invalid_payload" };
  }

  const nextTemplate = {
    ...template,
    name: normalizedDraft.name,
    description: normalizedDraft.description,
    category: normalizedDraft.category,
    visibilityType: normalizedDraft.visibilityType,
    sharedDepartments: normalizedDraft.sharedDepartments,
    sharedUserIds: normalizedDraft.sharedUserIds,
  };

  const nextState = {
    ...currentState,
    boardTemplates: (currentState.boardTemplates || []).map((item) => (item.id === templateId ? nextTemplate : item)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), templateId: nextTemplate.id, templateName: nextTemplate.name };
}

export function deleteWarehouseTemplate(auth, templateId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const template = (currentState.boardTemplates || []).find((item) => item.id === templateId);
  if (!template) return { ok: false, reason: "template_not_found" };
  if (!template.isCustom) return { ok: false, reason: "forbidden" };
  if (!canUserDoWarehouseAction(currentUser, "deleteTemplate", currentState.permissions) || !canManageWarehouseTemplate(currentUser, template)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextState = {
    ...currentState,
    boardTemplates: (currentState.boardTemplates || []).filter((item) => item.id !== templateId),
  };

  return { ok: true, state: replaceWarehouseState(nextState), templateId: template.id, templateName: template.name };
}

export function updateWarehousePermissionsModel(auth, payload = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "managePermissions", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextPermissions = normalizePermissions(payload.permissions || currentState.permissions);
  const boardPermissionsMap = new Map(
    Array.isArray(payload.boardPermissions)
      ? payload.boardPermissions.map((entry) => [entry.boardId, entry.permissions || entry])
      : [],
  );

  const nextState = {
    ...currentState,
    permissions: nextPermissions,
    controlBoards: (currentState.controlBoards || []).map((board) => ({
      ...board,
      permissions: normalizeBoardPermissions(boardPermissionsMap.get(board.id) || board.permissions, nextPermissions, board),
    })),
  };

  return { ok: true, state: replaceWarehouseState(nextState) };
}

export function updateWarehousePermissionOverride(auth, userId, draft = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "managePermissions", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const targetUser = (currentState.users || []).find((user) => user.id === userId);
  if (!targetUser) return { ok: false, reason: "user_not_found" };
  if (!supportsManagedPermissionOverrides(targetUser.role)) {
    return { ok: false, reason: "invalid_target" };
  }

  const baseOverride = currentState.permissions?.userOverrides?.[userId] || { pages: {}, actions: {} };
  const nextOverride = {
    pages: {
      ...baseOverride.pages,
      ...(draft.pages || {}),
    },
    actions: {
      ...baseOverride.actions,
      ...(draft.actions || {}),
    },
  };

  const cleanedOverride = {
    pages: Object.fromEntries(Object.entries(nextOverride.pages).filter(([, value]) => typeof value === "boolean")),
    actions: Object.fromEntries(Object.entries(nextOverride.actions).filter(([, value]) => typeof value === "boolean")),
  };
  const hasOverride = Object.keys(cleanedOverride.pages).length > 0 || Object.keys(cleanedOverride.actions).length > 0;

  const nextOverrides = { ...(currentState.permissions?.userOverrides || {}) };
  if (hasOverride) {
    nextOverrides[userId] = cleanedOverride;
  } else {
    delete nextOverrides[userId];
  }

  const nextState = {
    ...currentState,
    permissions: {
      ...currentState.permissions,
      userOverrides: nextOverrides,
    },
  };

  return { ok: true, state: replaceWarehouseState(nextState), userId };
}

export function updateWarehouseBoardAssignment(auth, boardId, assignment = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "managePermissions", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const { boardIndex, board } = findBoardAndRow(currentState, boardId);
  if (!board) return { ok: false, reason: "board_not_found" };

  const nextOwnerId = String(assignment.ownerId || board.ownerId || "").trim() || board.ownerId;
  const nextAccessUserIds = Array.from(new Set((Array.isArray(assignment.accessUserIds) ? assignment.accessUserIds : board.accessUserIds || []).filter((userId) => userId && userId !== nextOwnerId)));
  const boardShape = {
    ...board,
    ownerId: nextOwnerId,
    accessUserIds: nextAccessUserIds,
  };
  const nextBoard = {
    ...boardShape,
    permissions: normalizeBoardPermissions(board.permissions, currentState.permissions, boardShape),
  };

  const nextState = {
    ...currentState,
    controlBoards: (currentState.controlBoards || []).map((item, index) => (index === boardIndex ? nextBoard : item)),
  };

  return { ok: true, state: replaceWarehouseState(nextState), boardId: nextBoard.id, boardName: nextBoard.name };
}

export function createWarehouseBoard(auth, draft) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  if (!canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const normalizedDraft = sanitizeBoardDraft(draft, currentUser.id);
  if (!normalizedDraft.name || !normalizedDraft.fields.length) {
    return { ok: false, reason: "invalid_payload" };
  }

  const board = {
    id: makeId("board"),
    name: normalizedDraft.name,
    description: normalizedDraft.description,
    createdById: currentUser.id,
    ownerId: normalizedDraft.ownerId,
    accessUserIds: normalizedDraft.accessUserIds,
    settings: normalizedDraft.settings,
    fields: normalizedDraft.fields,
    rows: buildBoardRowsFromActivityList(normalizedDraft.fields, currentState.catalog, normalizedDraft.ownerId, [], []),
  };

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.concat({
      ...board,
      permissions: buildBoardPermissions(currentState.permissions, board),
    }),
  };

  return { ok: true, state: replaceWarehouseState(nextState), boardId: board.id, boardName: board.name };
}

export function updateWarehouseBoard(auth, boardId, draft) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const { boardIndex, board } = findBoardAndRow(currentState, boardId);
  if (!board) return { ok: false, reason: "board_not_found" };
  if (!canEditWarehouseBoard(currentUser, board) || !canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const normalizedDraft = sanitizeBoardDraft(draft, board.ownerId || currentUser.id);
  if (!normalizedDraft.name || !normalizedDraft.fields.length) {
    return { ok: false, reason: "invalid_payload" };
  }

  const updatedBoard = {
    ...board,
    name: normalizedDraft.name,
    description: normalizedDraft.description,
    ownerId: normalizedDraft.ownerId,
    accessUserIds: normalizedDraft.accessUserIds,
    settings: normalizedDraft.settings,
    fields: normalizedDraft.fields,
    rows: buildBoardRowsFromActivityList(
      normalizedDraft.fields,
      currentState.catalog,
      normalizedDraft.ownerId || currentUser.id,
      board.fields || [],
      board.rows || [],
    ),
  };

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.map((item, index) => (
      index === boardIndex
        ? {
            ...updatedBoard,
            permissions: normalizeBoardPermissions(board.permissions, currentState.permissions, updatedBoard),
          }
        : item
    )),
  };

  return { ok: true, state: replaceWarehouseState(nextState), boardId: updatedBoard.id, boardName: updatedBoard.name };
}

export function deleteWarehouseBoard(auth, boardId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const { board } = findBoardAndRow(currentState, boardId);
  if (!board) return { ok: false, reason: "board_not_found" };
  if (!canEditWarehouseBoard(currentUser, board) || !canUserDoWarehouseAction(currentUser, "deleteBoard", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextState = {
    ...currentState,
    controlBoards: (currentState.controlBoards || []).filter((item) => item.id !== boardId),
  };

  return { ok: true, state: replaceWarehouseState(nextState), boardId: board.id, boardName: board.name };
}

export function duplicateWarehouseBoard(auth, boardId, includeRows = false) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) return { ok: false, reason: "auth_required" };

  const currentState = getRawWarehouseState();
  const { board } = findBoardAndRow(currentState, boardId);
  if (!board) return { ok: false, reason: "board_not_found" };
  if (!canManageWarehouseBoard(currentUser, board)) {
    return { ok: false, reason: "forbidden" };
  }
  if (includeRows) {
    if (!canUserDoWarehouseAction(currentUser, "duplicateBoardWithRows", currentState.permissions)) {
      return { ok: false, reason: "forbidden" };
    }
  } else if (!canUserDoWarehouseAction(currentUser, "duplicateBoard", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const { fields, idMap } = cloneBoardFieldBundle(board.fields || []);
  const duplicatedBoardId = makeId("board");
  const duplicatedBoard = {
    ...board,
    id: duplicatedBoardId,
    name: `${board.name} copia${includeRows ? " con filas" : ""}`,
    description: board.description || `Copia de ${board.name}.`,
    createdById: currentUser.id,
    ownerId: board.ownerId || currentUser.id,
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

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.concat({
      ...duplicatedBoard,
      permissions: normalizeBoardPermissions(board.permissions, currentState.permissions, duplicatedBoard),
    }),
  };

  return { ok: true, state: replaceWarehouseState(nextState), boardId: duplicatedBoard.id, boardName: duplicatedBoard.name };
}

export function canEditWarehouseBoardRow(user, board, row, permissions, actionId = "createBoardRow") {
  if (!user || !board || !row) return false;
  if (!canManageWarehouseBoard(user, board)) return false;
  if (!canUserDoWarehouseAction(user, actionId, permissions)) return false;
  return row.status !== "Terminado";
}

export function canOperateWarehouseBoardRow(user, board, row, permissions) {
  return canEditWarehouseBoardRow(user, board, row, permissions, "boardWorkflow");
}

export function createWarehouseBoardRow(auth, boardId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) {
    return { ok: false, reason: "auth_required" };
  }

  const currentState = getRawWarehouseState();
  const { boardIndex, board } = findBoardAndRow(currentState, boardId);
  if (!board) {
    return { ok: false, reason: "board_not_found" };
  }
  if (!canManageWarehouseBoard(currentUser, board) || !canUserDoWarehouseAction(currentUser, "createBoardRow", currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const row = createBoardRowRecord(board.fields || [], currentUser.id);
  const activityListField = findBoardActivityListField(board.fields || []);
  if (activityListField) {
    const existingValues = new Set((board.rows || []).map((currentRow) => normalizeKey(currentRow?.values?.[activityListField.id])));
    const nextActivityName = getBoardActivityListValues(activityListField, currentState.catalog).find((activityName) => !existingValues.has(normalizeKey(activityName)));
    if (nextActivityName) {
      row.values[activityListField.id] = nextActivityName;
    }
  }

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.map((item, index) => (
      index === boardIndex ? { ...item, rows: [...(item.rows || []), row] } : item
    )),
  };
  return { ok: true, state: replaceWarehouseState(nextState), row };
}

export function patchWarehouseBoardRow(auth, boardId, rowId, patch = {}) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) {
    return { ok: false, reason: "auth_required" };
  }

  const currentState = getRawWarehouseState();
  const { boardIndex, rowIndex, board, row } = findBoardAndRow(currentState, boardId, rowId);
  if (!board || !row) {
    return { ok: false, reason: "row_not_found" };
  }

  const isWorkflowPatch = Object.prototype.hasOwnProperty.call(patch, "status") || Object.prototype.hasOwnProperty.call(patch, "lastPauseReason");
  const allowed = isWorkflowPatch
    ? canOperateWarehouseBoardRow(currentUser, board, row, currentState.permissions)
    : canEditWarehouseBoardRow(currentUser, board, row, currentState.permissions);
  if (!allowed) {
    return { ok: false, reason: "forbidden" };
  }

  const nowIso = new Date().toISOString();
  const nowTime = new Date(nowIso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
  const normalizedValuesPatch = {
    ...(patch.values || {}),
  };
  const nextRow = {
    ...row,
    values: {
      ...(row.values || {}),
      ...normalizedValuesPatch,
    },
  };

  if (Object.prototype.hasOwnProperty.call(patch, "responsibleId")) {
    nextRow.responsibleId = patch.responsibleId || "";
  }

  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    if (patch.status === "En curso") {
      (board.fields || []).forEach((field) => {
        if (field.type !== "time") return;
        const normalizedLabel = normalizeKey(field.label || "");
        const currentValue = String(nextRow.values?.[field.id] || "").trim();
        if ((normalizedLabel.includes("inicio") || normalizedLabel.includes("start")) && !currentValue) {
          nextRow.values[field.id] = nowTime;
        }
      });
      nextRow.status = patch.status;
      nextRow.startTime = nextRow.startTime || nowIso;
      nextRow.endTime = row.status === "Terminado" ? null : nextRow.endTime;
      nextRow.lastResumedAt = nowIso;
    } else if (patch.status === "Pausado") {
      nextRow.status = patch.status;
      nextRow.accumulatedSeconds = updateElapsedForFinish(row, nowIso);
      nextRow.lastResumedAt = null;
    } else if (patch.status === "Terminado") {
      (board.fields || []).forEach((field) => {
        if (field.type !== "time") return;
        const normalizedLabel = normalizeKey(field.label || "");
        if (normalizedLabel.includes("fin") || normalizedLabel.includes("final") || normalizedLabel.includes("end")) {
          nextRow.values[field.id] = nowTime;
        }
      });
      nextRow.status = patch.status;
      nextRow.endTime = nowIso;
      nextRow.accumulatedSeconds = updateElapsedForFinish(row, nowIso);
      nextRow.lastResumedAt = null;
    } else {
      nextRow.status = patch.status;
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, "lastPauseReason")) {
    nextRow.lastPauseReason = patch.lastPauseReason || "";
  }

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.map((item, currentBoardIndex) => {
      if (currentBoardIndex !== boardIndex) return item;
      return {
        ...item,
        rows: (item.rows || []).map((currentRow, currentRowIndex) => (currentRowIndex === rowIndex ? nextRow : currentRow)),
      };
    }),
  };

  return { ok: true, state: replaceWarehouseState(nextState), row: nextRow };
}

export function deleteWarehouseBoardRow(auth, boardId, rowId) {
  const currentUser = findWarehouseUserById(auth?.userId);
  if (!currentUser?.isActive) {
    return { ok: false, reason: "auth_required" };
  }

  const currentState = getRawWarehouseState();
  const { boardIndex, board, row } = findBoardAndRow(currentState, boardId, rowId);
  if (!board || !row) {
    return { ok: false, reason: "row_not_found" };
  }
  if (row.status === "Terminado" || !canEditWarehouseBoardRow(currentUser, board, row, currentState.permissions)) {
    return { ok: false, reason: "forbidden" };
  }

  const nextState = {
    ...currentState,
    controlBoards: currentState.controlBoards.map((item, index) => (
      index === boardIndex ? { ...item, rows: (item.rows || []).filter((entry) => entry.id !== rowId) } : item
    )),
  };
  return { ok: true, state: replaceWarehouseState(nextState) };
}

export function validateWarehouseStateMutation(auth, nextState) {
  if (!auth) {
    return { ok: false, reason: "auth_required" };
  }

  if (auth.type === "master") {
    return { ok: true };
  }

  const currentUser = findWarehouseUserById(auth.userId);
  if (!currentUser?.isActive) {
    return { ok: false, reason: "user_not_active" };
  }

  const currentState = getRawWarehouseState();
  if (Number(nextState?.revision) !== Number(currentState.revision)) {
    return { ok: false, reason: "stale_revision", expectedRevision: currentState.revision };
  }
  const nextUsers = Array.isArray(nextState?.users) ? nextState.users : currentState.users;
  const nextBoards = Array.isArray(nextState?.controlBoards) ? nextState.controlBoards : currentState.controlBoards;
  const nextUserMap = new Map(nextUsers.map((user) => [user.id, user]));
  const nextBoardMap = new Map(nextBoards.map((board) => [board.id, board]));
  const normalizedRole = normalizeRole(currentUser.role);

  for (const nextUser of nextUsers) {
    const incomingPassword = String(nextUser?.password || "").trim();
    if (incomingPassword && !isStrongPassword(incomingPassword)) {
      return { ok: false, reason: "weak_password", userId: nextUser.id || null };
    }
    if (nextUser?.passwordHash && nextUser.passwordHash !== currentState.users.find((item) => item.id === nextUser.id)?.passwordHash) {
      return { ok: false, reason: "password_hash_injection", userId: nextUser.id || null };
    }
  }

  const sensitiveSectionRules = [
    { key: "permissions", actionId: "managePermissions", legacyBlocked: true },
    { key: "catalog", actionId: "manageCatalog", legacyBlocked: true },
    { key: "inventoryItems", actionId: "manageInventory", alternateActionIds: ["importInventory"], legacyBlocked: true },
    { key: "inventoryMovements", actionId: "manageInventory", legacyBlocked: true },
    { key: "boardTemplates", actionId: "saveTemplate", alternateActionIds: ["editTemplate", "deleteTemplate"], legacyBlocked: true },
    { key: "weeks", actionId: "manageWeeks", alternateActionIds: ["createWeek"] },
  ];

  for (const rule of sensitiveSectionRules) {
    const currentValue = JSON.stringify(currentState[rule.key] ?? null);
    const nextValue = JSON.stringify((nextState?.[rule.key] ?? currentState[rule.key]) ?? null);
    if (currentValue !== nextValue) {
      if (rule.legacyBlocked) {
        return { ok: false, reason: "legacy_section_blocked", section: rule.key };
      }
      const allowed = [rule.actionId].concat(rule.alternateActionIds || []).some((actionId) => canUserDoWarehouseAction(currentUser, actionId, currentState.permissions));
      if (!allowed) {
        return { ok: false, reason: "restricted_section_changed", section: rule.key };
      }
    }
  }

  const currentSystem = JSON.stringify(currentState.system ?? null);
  const nextSystem = JSON.stringify((nextState?.system ?? currentState.system) ?? null);
  if (currentSystem !== nextSystem && normalizedRole !== ROLE_LEAD) {
    return { ok: false, reason: "restricted_section_changed", section: "system" };
  }

  const currentAreaCatalog = JSON.stringify(currentState.areaCatalog ?? null);
  const nextAreaCatalog = JSON.stringify((nextState?.areaCatalog ?? currentState.areaCatalog) ?? null);
  if (currentAreaCatalog !== nextAreaCatalog) {
    return { ok: false, reason: "legacy_section_blocked", section: "areaCatalog" };
  }

  if (nextUsers.length !== currentState.users.length) {
    const actionId = nextUsers.length < currentState.users.length ? "deleteUsers" : "manageUsers";
    if (!canUserDoWarehouseAction(currentUser, actionId, currentState.permissions)) {
      return { ok: false, reason: "user_list_changed" };
    }
  }

  for (const currentRecord of currentState.users) {
    const nextRecord = nextUserMap.get(currentRecord.id);
    if (!nextRecord) {
      if (!canUserDoWarehouseAction(currentUser, "deleteUsers", currentState.permissions)) {
        return { ok: false, reason: "user_list_changed" };
      }
      continue;
    }

    const currentProfile = JSON.stringify({
      name: currentRecord.name,
      email: currentRecord.email,
      area: currentRecord.area,
      department: currentRecord.department,
      jobTitle: currentRecord.jobTitle,
    });
    const nextProfile = JSON.stringify({
      name: nextRecord.name,
      email: nextRecord.email,
      area: nextRecord.area,
      department: nextRecord.department,
      jobTitle: nextRecord.jobTitle,
    });
    if (currentProfile !== nextProfile && currentRecord.id !== currentUser.id && !canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) {
      return { ok: false, reason: "restricted_section_changed", section: "users" };
    }

    const currentAdminFields = JSON.stringify({
      role: currentRecord.role,
      isActive: currentRecord.isActive,
      managerId: currentRecord.managerId,
      createdById: currentRecord.createdById,
    });
    const nextAdminFields = JSON.stringify({
      role: nextRecord.role,
      isActive: nextRecord.isActive,
      managerId: nextRecord.managerId,
      createdById: nextRecord.createdById,
    });
    if (currentAdminFields !== nextAdminFields && !canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) {
      return { ok: false, reason: "restricted_section_changed", section: "users" };
    }

    const passwordChanged = String(nextRecord.password || "").trim() || nextRecord.passwordHash !== currentRecord.passwordHash;
    if (passwordChanged && currentRecord.id !== currentUser.id && !canUserDoWarehouseAction(currentUser, "resetPasswords", currentState.permissions)) {
      return { ok: false, reason: "restricted_section_changed", section: "users" };
    }
  }

  for (const nextRecord of nextUsers) {
    if (!currentState.users.find((item) => item.id === nextRecord.id) && !canUserDoWarehouseAction(currentUser, "manageUsers", currentState.permissions)) {
      return { ok: false, reason: "user_list_changed" };
    }
  }

  if (normalizedRole !== ROLE_JR) {
    if (nextBoards.length !== currentState.controlBoards.length && !canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
      return { ok: false, reason: "board_list_changed" };
    }
  } else {
    const restrictedKeys = ["users", "permissions", "weeks", "catalog", "inventoryItems", "inventoryMovements", "boardTemplates", "activities", "pauseLogs", "controlRows", "areaCatalog", "system"];
    for (const key of restrictedKeys) {
      const currentValue = JSON.stringify(currentState[key] ?? null);
      const nextValue = JSON.stringify((nextState?.[key] ?? currentState[key]) ?? null);
      if (currentValue !== nextValue) {
        return { ok: false, reason: "restricted_section_changed", section: key };
      }
    }

    if (nextUsers.length !== currentState.users.length) {
      return { ok: false, reason: "user_list_changed" };
    }

    if (nextBoards.length !== currentState.controlBoards.length) {
      return { ok: false, reason: "board_list_changed" };
    }
  }

  for (const currentBoard of currentState.controlBoards) {
    const nextBoard = nextBoardMap.get(currentBoard.id);
    if (!nextBoard) {
      if (!canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
        return { ok: false, reason: "board_missing", boardId: currentBoard.id };
      }
      continue;
    }

    const canManage = canManageWarehouseBoard(currentUser, currentBoard);
    const currentStructure = JSON.stringify({
      name: currentBoard.name,
      description: currentBoard.description,
      createdById: currentBoard.createdById,
      ownerId: currentBoard.ownerId,
      accessUserIds: currentBoard.accessUserIds || [],
      settings: currentBoard.settings || {},
      fields: currentBoard.fields || [],
      permissions: currentBoard.permissions || {},
    });
    const nextStructure = JSON.stringify({
      name: nextBoard.name,
      description: nextBoard.description,
      createdById: nextBoard.createdById,
      ownerId: nextBoard.ownerId,
      accessUserIds: nextBoard.accessUserIds || [],
      settings: nextBoard.settings || {},
      fields: nextBoard.fields || [],
      permissions: nextBoard.permissions || {},
    });

    if (currentStructure !== nextStructure) {
      if (!canManage || !canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
        return { ok: false, reason: "board_structure_changed", boardId: currentBoard.id };
      }
    }

    const currentRows = JSON.stringify(currentBoard.rows || []);
    const nextRows = JSON.stringify(nextBoard.rows || []);
    if (currentRows !== nextRows) {
      if (!canManage) {
        return { ok: false, reason: "board_rows_changed_without_access", boardId: currentBoard.id };
      }
      if (!canUserDoWarehouseAction(currentUser, "boardWorkflow", currentState.permissions) && !canUserDoWarehouseAction(currentUser, "createBoardRow", currentState.permissions)) {
        return { ok: false, reason: "board_rows_changed_without_access", boardId: currentBoard.id };
      }
    }
  }

  for (const nextBoard of nextBoards) {
    if (!currentState.controlBoards.find((item) => item.id === nextBoard.id) && !canUserDoWarehouseAction(currentUser, "saveBoard", currentState.permissions)) {
      return { ok: false, reason: "board_list_changed" };
    }
  }

  return { ok: true };
}

export function authenticateWarehouseUser(login, password) {
  const normalizedLogin = String(login || "").trim().toLowerCase();
  const user = getRawWarehouseState().users.find((item) => {
    const username = String((item.username ?? item.email) || "").trim().toLowerCase();
    return username === normalizedLogin;
  });

  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function getLoginDirectory() {
  const current = getRawWarehouseState();
  const showPublicHints = publicLoginDirectoryEnabled;
  return {
    system: {
      masterBootstrapEnabled: Boolean(current.system?.masterBootstrapEnabled),
      masterUsername: showPublicHints ? current.system?.masterUsername || "Maestro" : null,
      showBootstrapMasterHint: showPublicHints && Boolean(current.system?.masterBootstrapEnabled),
    },
    demoUsers: showPublicHints
      ? current.users
        .filter((user) => user.isActive)
        .map((user) => ({ id: user.id, login: user.email, email: user.email, role: user.role, name: user.name }))
      : [],
  };
}

export function hasLeadUser() {
  return getRawWarehouseState().users.some((user) => normalizeRole(user.role) === ROLE_LEAD);
}

function getInventoryManageActionId(domain) {
  if (normalizeInventoryDomain(domain) === "cleaning") return "manageCleaningInventory";
  if (normalizeInventoryDomain(domain) === "orders") return "manageOrderInventory";
  return "manageInventory";
}

function getInventoryImportActionId(domain) {
  if (normalizeInventoryDomain(domain) === "cleaning") return "importCleaningInventory";
  if (normalizeInventoryDomain(domain) === "orders") return "importOrderInventory";
  return "importInventory";
}