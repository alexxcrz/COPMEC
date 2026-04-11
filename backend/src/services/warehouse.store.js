import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicLoginDirectoryEnabled } from "../config/env.js";
import { hashPassword, isPasswordHash, verifyPassword } from "../utils/passwords.js";

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
  viewReports: [ROLE_LEAD, ROLE_SR],
  managePermissions: [ROLE_LEAD],
  manageUsers: [ROLE_LEAD, ROLE_SR, ROLE_SSR],
  deleteUsers: [ROLE_LEAD, ROLE_SR],
  resetPasswords: [ROLE_LEAD, ROLE_SR],
  manageInventory: [ROLE_LEAD, ROLE_SR],
  importInventory: [ROLE_LEAD, ROLE_SR],
  saveBoard: [ROLE_LEAD, ROLE_SR],
  saveTemplate: [ROLE_LEAD, ROLE_SR],
  editTemplate: [ROLE_LEAD, ROLE_SR],
  deleteTemplate: [ROLE_LEAD, ROLE_SR],
  createBoardFromTemplate: [ROLE_LEAD, ROLE_SR],
  createBoardRow: [ROLE_LEAD, ROLE_SR, ROLE_SSR, ROLE_JR],
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

function getDefaultInventoryItems() {
  return [
    { id: "inv-1", code: "ALM-001", name: "Detergente industrial", presentation: "Bidón 20L", piecesPerBox: 4, boxesPerPallet: 30 },
    { id: "inv-2", code: "ALM-002", name: "Papel higiénico", presentation: "Paquete 12 rollos", piecesPerBox: 6, boxesPerPallet: 24 },
    { id: "inv-3", code: "ALM-003", name: "Guantes nitrilo", presentation: "Caja 100 piezas", piecesPerBox: 10, boxesPerPallet: 18 },
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
      const incomingPassword = String(user.password || "").trim();
      const passwordHash = isPasswordHash(user.passwordHash)
        ? user.passwordHash
        : incomingPassword
          ? hashPassword(incomingPassword)
          : previousUser?.passwordHash
            ? previousUser.passwordHash
          : hashPassword(defaultPassword(role));
      return {
        ...user,
        role,
        passwordHash,
        password: undefined,
        managerId: user.managerId ?? null,
        createdById: user.createdById ?? user.managerId ?? null,
      };
    }),
    inventoryItems: Array.isArray(state.inventoryItems) ? state.inventoryItems : getDefaultInventoryItems(),
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
      { id: "cat-piso", name: "Piso producción", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
      { id: "cat-banos", name: "Lavado de baños", timeLimitMinutes: 40, isMandatory: true, isDeleted: false },
      { id: "cat-inspeccion", name: "Inspección nave", timeLimitMinutes: 75, isMandatory: true, isDeleted: false },
      { id: "cat-oficinas", name: "Limpieza oficinas", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
      { id: "cat-comedor", name: "Comedor", timeLimitMinutes: 50, isMandatory: true, isDeleted: false },
      { id: "cat-vidrios", name: "Limpieza vidrios", timeLimitMinutes: 50, isMandatory: false, isDeleted: false },
      { id: "cat-rampas", name: "Revisión de rampas", timeLimitMinutes: 35, isMandatory: false, isDeleted: false },
    ],
    inventoryItems: getDefaultInventoryItems(),
    activities: [],
    pauseLogs: [],
    controlRows: [],
    boardTemplates: [],
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
  return sanitizeState(readStore());
}

function getRawWarehouseState() {
  return readStore();
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
  const newActivities = current.catalog.filter((item) => !item.isDeleted).map((item, index) => ({
    id: makeId("act"),
    weekId,
    catalogActivityId: item.id,
    responsibleId: activeUsers[index % Math.max(activeUsers.length, 1)]?.id || null,
    status: "Pendiente",
    activityDate: isoAt(addDays(now, index), 8, 0),
    startTime: null,
    endTime: null,
    accumulatedSeconds: 0,
    lastResumedAt: null,
    customName: item.name,
  }));

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

export function canUserDoBoardAction(user, boardId, actionId) {
  if (!user || !boardId || !actionId) return false;
  const currentState = getRawWarehouseState();
  const board = (currentState.controlBoards || []).find((item) => item.id === boardId);
  if (!board) return false;
  if (!canManageWarehouseBoard(user, board)) return false;
  return canUserDoWarehouseAction(user, actionId, currentState.permissions);
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
  const nextUsers = Array.isArray(nextState?.users) ? nextState.users : currentState.users;
  const nextBoards = Array.isArray(nextState?.controlBoards) ? nextState.controlBoards : currentState.controlBoards;
  const normalizedRole = normalizeRole(currentUser.role);

  if (normalizedRole !== ROLE_JR) {
    return { ok: true };
  }

  const restrictedKeys = ["users", "permissions", "weeks", "catalog", "inventoryItems", "boardTemplates", "activities", "pauseLogs", "controlRows", "areaCatalog", "system"];
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

  const nextBoardMap = new Map(nextBoards.map((board) => [board.id, board]));
  for (const currentBoard of currentState.controlBoards) {
    const nextBoard = nextBoardMap.get(currentBoard.id);
    if (!nextBoard) {
      return { ok: false, reason: "board_missing", boardId: currentBoard.id };
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
      return { ok: false, reason: "board_structure_changed", boardId: currentBoard.id };
    }

    if (!canManage) {
      const currentRows = JSON.stringify(currentBoard.rows || []);
      const nextRows = JSON.stringify(nextBoard.rows || []);
      if (currentRows !== nextRows) {
        return { ok: false, reason: "board_rows_changed_without_access", boardId: currentBoard.id };
      }
    }
  }

  return { ok: true };
}

export function authenticateWarehouseUser(login, password) {
  const normalizedLogin = String(login || "").trim().toLowerCase();
  const user = getRawWarehouseState().users.find((item) => {
    const email = String(item.email || "").trim().toLowerCase();
    const name = String(item.name || "").trim().toLowerCase();
    return email === normalizedLogin || name === normalizedLogin;
  });

  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function getLoginDirectory() {
  const current = getRawWarehouseState();
  return {
    system: {
      masterBootstrapEnabled: Boolean(current.system?.masterBootstrapEnabled),
      masterUsername: current.system?.masterUsername || "Maestro",
    },
    demoUsers: publicLoginDirectoryEnabled
      ? current.users
        .filter((user) => user.isActive)
        .map((user) => ({ id: user.id, email: user.email, role: user.role, name: user.name }))
      : [],
  };
}

export function hasLeadUser() {
  return getRawWarehouseState().users.some((user) => normalizeRole(user.role) === ROLE_LEAD);
}