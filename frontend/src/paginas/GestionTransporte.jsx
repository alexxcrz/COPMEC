import { useEffect, useMemo, useRef, useState } from "react";
import { uploadFileToCloudinary } from "../services/upload.service";
import { FileText, Plus } from "lucide-react";
import { TransportAssignmentsTab, TransportMyRoutesTab, TransportPostponedTab } from "./TransportTabs";
import DashboardDateRangePicker from "../components/DashboardDateRangePicker";

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function inferCalendarGroupingFromRange(startDateKey, endDateKey) {
  const startMs = parseDateKeyToMs(startDateKey);
  const endMs = parseDateKeyToMs(endDateKey);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "mes";

  const minMs = Math.min(startMs, endMs);
  const maxMs = Math.max(startMs, endMs);
  const days = Math.floor((maxMs - minMs) / 86400000) + 1;
  if (days <= 7) return "semana";
  return "mes";
}

function extractDateKey(record, fallbackDateKey = "") {
  const fromRecord = String(record?.dateKey || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromRecord)) return fromRecord;
  const fromCreatedAt = String(record?.createdAt || "").trim();
  if (fromCreatedAt.length >= 10) {
    const key = fromCreatedAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  }
  return String(fallbackDateKey || "").trim();
}

function resolveDateMs(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : null;
}

function isPostponedReady(record, nowMs = Date.now()) {
  if (String(record?.status || "").trim() !== "Pospuesto") return false;
  const postponedUntilMs = resolveDateMs(record?.postponedUntil || record?.updatedAt);
  if (postponedUntilMs === null) return true;
  return postponedUntilMs <= nowMs;
}

function getWeekBucketsForMonth(monthKey) {
  const [yearRaw, monthRaw] = String(monthKey || "").split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) return [];

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const buckets = [];
  for (let start = 1; start <= daysInMonth; start += 7) {
    const end = Math.min(start + 6, daysInMonth);
    buckets.push({
      start,
      end,
      label: `Semana ${buckets.length + 1} (${start}-${end})`,
    });
  }
  return buckets;
}

function parseDateKeyToMs(dateKey) {
  const normalized = String(dateKey || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const ms = Date.parse(`${normalized}T12:00:00`);
  return Number.isFinite(ms) ? ms : null;
}

function toDateKeyFromDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthBuckets(monthKeys = []) {
  return monthKeys.map((monthKey) => {
    const [yearRaw, monthRaw] = String(monthKey || "").split("-");
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return null;
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    const startMs = parseDateKeyToMs(toDateKeyFromDate(startDate));
    const endMs = parseDateKeyToMs(toDateKeyFromDate(endDate));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;

    return {
      key: monthKey,
      label: monthKey,
      shortLabel: `${String(monthIndex + 1).padStart(2, "0")}/${String(year).slice(-2)}`,
      startMs,
      endMs,
    };
  }).filter(Boolean);
}

function getConsolidatedRangeModel({
  rangeType,
  selectedDateKey,
  selectedDateFrom,
  selectedDateTo,
  selectedCalendarGrouping,
  selectedMonth,
  selectedYear,
  selectedMonthSpan,
  principalMonthOptions,
}) {
  const normalizedRangeType = String(rangeType || "mes").trim();
  const todayKey = toDateKeyFromDate(new Date());
  const safeDateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDateKey || "")) ? String(selectedDateKey || "") : todayKey;
  const safeDateMs = parseDateKeyToMs(safeDateKey) || parseDateKeyToMs(todayKey) || Date.now();
  const safeDate = new Date(safeDateMs);

  const monthCandidates = Array.isArray(principalMonthOptions) ? principalMonthOptions : [];
  const monthFallback = monthCandidates[0] || `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
  const safeMonth = String(selectedMonth || monthFallback);

  const yearFallback = Number(String(safeMonth).slice(0, 4)) || safeDate.getFullYear();
  const safeYear = Number(selectedYear) || yearFallback;
  const safeSpan = Math.max(2, Math.min(12, Number(selectedMonthSpan) || 3));
  const safeDateFrom = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDateFrom || "")) ? String(selectedDateFrom || "") : safeDateKey;
  const safeDateTo = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDateTo || "")) ? String(selectedDateTo || "") : safeDateKey;
  const safeCalendarGrouping = ["semana", "mes", "anio"].includes(String(selectedCalendarGrouping || ""))
    ? String(selectedCalendarGrouping)
    : "mes";

  const toBucket = (key, label, shortLabel, startKey, endKey) => {
    const startMs = parseDateKeyToMs(startKey);
    const endMs = parseDateKeyToMs(endKey);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
    return { key, label, shortLabel, startMs, endMs };
  };

  if (normalizedRangeType === "dia") {
    const bucket = toBucket(safeDateKey, safeDateKey, "Día", safeDateKey, safeDateKey);
    return {
      rangeType: normalizedRangeType,
      rangeLabel: `Día ${safeDateKey}`,
      unitLabel: "día",
      buckets: bucket ? [bucket] : [],
    };
  }

  if (normalizedRangeType === "dias") {
    const fromMsRaw = parseDateKeyToMs(safeDateFrom);
    const toMsRaw = parseDateKeyToMs(safeDateTo);
    const startMs = Math.min(Number(fromMsRaw || 0), Number(toMsRaw || 0));
    const endMs = Math.max(Number(fromMsRaw || 0), Number(toMsRaw || 0));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs <= 0 || endMs <= 0) {
      return {
        rangeType: normalizedRangeType,
        rangeLabel: "Rango de días",
        unitLabel: safeCalendarGrouping === "semana" ? "día" : safeCalendarGrouping === "anio" ? "mes" : "semana",
        buckets: [],
      };
    }

    const startDate = new Date(startMs);
    const endDate = new Date(endMs);
    const buckets = [];

    if (safeCalendarGrouping === "semana") {
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const dateKey = toDateKeyFromDate(cursor);
        const dayToken = dateKey.slice(8, 10);
        const monthToken = dateKey.slice(5, 7);
        const bucket = toBucket(`dia-${dateKey}`, dateKey, `${dayToken}/${monthToken}`, dateKey, dateKey);
        if (bucket) buckets.push(bucket);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (safeCalendarGrouping === "anio") {
      const monthCursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const monthLimit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      while (monthCursor <= monthLimit) {
        const year = monthCursor.getFullYear();
        const month = monthCursor.getMonth();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const rangeStart = monthStart < startDate ? startDate : monthStart;
        const rangeEnd = monthEnd > endDate ? endDate : monthEnd;

        const startKey = toDateKeyFromDate(rangeStart);
        const endKey = toDateKeyFromDate(rangeEnd);
        const mm = String(month + 1).padStart(2, "0");
        const yy = String(year).slice(-2);
        const bucket = toBucket(`mes-${year}-${mm}`, `${year}-${mm}`, `${mm}/${yy}`, startKey, endKey);
        if (bucket) buckets.push(bucket);
        monthCursor.setMonth(monthCursor.getMonth() + 1);
      }
    } else {
      const cursor = new Date(startDate);
      let bucketIndex = 1;
      while (cursor <= endDate) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(cursor);
        bucketEnd.setDate(bucketEnd.getDate() + 6);
        if (bucketEnd > endDate) {
          bucketEnd.setTime(endDate.getTime());
        }

        const startKey = toDateKeyFromDate(bucketStart);
        const endKey = toDateKeyFromDate(bucketEnd);
        const startDay = String(bucketStart.getDate()).padStart(2, "0");
        const endDay = String(bucketEnd.getDate()).padStart(2, "0");
        const startMonth = String(bucketStart.getMonth() + 1).padStart(2, "0");
        const endMonth = String(bucketEnd.getMonth() + 1).padStart(2, "0");

        const label = `${startKey} a ${endKey}`;
        const shortLabel = startMonth === endMonth
          ? `Sem ${bucketIndex} (${startDay}-${endDay}/${startMonth})`
          : `Sem ${bucketIndex} (${startDay}/${startMonth}-${endDay}/${endMonth})`;

        const bucket = toBucket(`sem-rango-${bucketIndex}`, label, shortLabel, startKey, endKey);
        if (bucket) buckets.push(bucket);
        cursor.setDate(cursor.getDate() + 7);
        bucketIndex += 1;
      }
    }

    const groupingLabel = safeCalendarGrouping === "semana" ? "días" : safeCalendarGrouping === "anio" ? "meses" : "semanas";

    return {
      rangeType: normalizedRangeType,
      rangeLabel: buckets.length ? `Rango ${safeDateFrom} a ${safeDateTo} (${buckets.length} ${groupingLabel})` : "Rango de días",
      unitLabel: safeCalendarGrouping === "semana" ? "día" : safeCalendarGrouping === "anio" ? "mes" : "semana",
      buckets,
    };
  }

  if (normalizedRangeType === "semana") {
    const weekStart = new Date(safeDateMs);
    const weekDay = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - weekDay);

    const buckets = [];
    for (let index = 0; index < 7; index += 1) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      const key = toDateKeyFromDate(dayDate);
      const dayToken = key.slice(8, 10);
      const monthToken = key.slice(5, 7);
      const bucket = toBucket(key, key, `${dayToken}/${monthToken}`, key, key);
      if (bucket) buckets.push(bucket);
    }

    return {
      rangeType: normalizedRangeType,
      rangeLabel: buckets.length ? `Semana ${buckets[0].label} a ${buckets.at(-1)?.label || buckets[0].label}` : "Semana",
      unitLabel: "día",
      buckets,
    };
  }

  if (normalizedRangeType === "quincena") {
    const year = safeDate.getFullYear();
    const monthIndex = safeDate.getMonth();
    const day = safeDate.getDate();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const segmentStart = day <= 15 ? 1 : 16;
    const segmentEnd = day <= 15 ? 15 : daysInMonth;
    const buckets = [];

    for (let start = segmentStart; start <= segmentEnd; start += 7) {
      const end = Math.min(start + 6, segmentEnd);
      const startKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(start).padStart(2, "0")}`;
      const endKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
      const key = `${startKey}:${endKey}`;
      const bucket = toBucket(key, `${start}-${end}`, `${start}-${end}`, startKey, endKey);
      if (bucket) buckets.push(bucket);
    }

    return {
      rangeType: normalizedRangeType,
      rangeLabel: `Quincena ${segmentStart}-${segmentEnd} de ${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      unitLabel: "bloque",
      buckets,
    };
  }

  if (normalizedRangeType === "mes") {
    const weeks = getWeekBucketsForMonth(safeMonth);
    const [yearRaw, monthRaw] = String(safeMonth || "").split("-");
    const year = Number(yearRaw);
    const monthToken = String(monthRaw || "").padStart(2, "0");
    const buckets = weeks.map((week, index) => {
      const startKey = `${year}-${monthToken}-${String(week.start).padStart(2, "0")}`;
      const endKey = `${year}-${monthToken}-${String(week.end).padStart(2, "0")}`;
      return toBucket(`sem-${index + 1}`, week.label, `Sem ${index + 1}`, startKey, endKey);
    }).filter(Boolean);

    return {
      rangeType: normalizedRangeType,
      rangeLabel: `Mes ${safeMonth}`,
      unitLabel: "semana",
      buckets,
    };
  }

  if (normalizedRangeType === "meses") {
    const selectedMonthIndex = monthCandidates.indexOf(safeMonth);
    let monthWindow;
    if (selectedMonthIndex >= 0) {
      monthWindow = monthCandidates.slice(selectedMonthIndex, selectedMonthIndex + safeSpan).reverse();
    } else {
      monthWindow = [safeMonth];
    }
    const buckets = buildMonthBuckets(monthWindow);
    const fromLabel = buckets[0]?.label || safeMonth;
    const toLabel = buckets.at(-1)?.label || safeMonth;

    return {
      rangeType: normalizedRangeType,
      rangeLabel: `${buckets.length} meses (${fromLabel} a ${toLabel})`,
      unitLabel: "mes",
      buckets,
    };
  }

  const yearMonthKeys = Array.from({ length: 12 }, (_, monthIndex) => (
    `${safeYear}-${String(monthIndex + 1).padStart(2, "0")}`
  ));

  return {
    rangeType: "anio",
    rangeLabel: `Año ${safeYear}`,
    unitLabel: "mes",
    buckets: buildMonthBuckets(yearMonthKeys),
  };
}

function isImageEvidence(evidence) {
  const type = String(evidence?.type || "").toLowerCase();
  return type.startsWith("image");
}

function isVideoEvidence(evidence) {
  const type = String(evidence?.type || "").toLowerCase();
  return type.startsWith("video");
}

function createTransportModalState(areaId = "") {
  return {
    open: false,
    mode: "create",
    recordId: "",
    areaId,
    destination: "",
    boxes: "",
    pieces: "",
    notes: "",
    evidence: null,
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    remindBeforeMinutes: "60",
  };
}

function createDocModalState() {
  return {
    open: false,
    mode: "create",
    recordId: "",
    ubicacion: "SONATA",
    area: "",
    dirigidoA: "",
    notas: "",
    evidence: null,
  };
}

function createPostponeModalState() {
  return {
    open: false,
    recordId: "",
    destination: "",
    postponedDate: "",
    postponedTime: "",
    remindBeforeMinutes: "60",
  };
}

function createDeleteTransportModalState() {
  return {
    open: false,
    recordId: "",
    destination: "",
    submitting: false,
    error: "",
  };
}

function renderRouteStatusChip(statusValue, assignedToName) {
  const status = String(statusValue || "Pendiente").trim() || "Pendiente";
  const assignee = String(assignedToName || "").trim();
  const styles = {
    Pendiente: { bg: "#fff3cd", color: "#856404" },
    Pospuesto: { bg: "#ece8ff", color: "#493d8a" },
    Asignado: { bg: "#cfe2ff", color: "#084298" },
    "En camino": { bg: "#d1ecf1", color: "#0c5460" },
    Retorno: { bg: "#ffe8cc", color: "#7a4100" },
    Entregado: { bg: "#d4edda", color: "#155724" },
    Devuelto: { bg: "#f8d7da", color: "#842029" },
    Cancelado: { bg: "#e2e3e5", color: "#41464b" },
  };
  const style = styles[status] || { bg: "#e2e3e5", color: "#383d41" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
      <span
        className="chip"
        style={{
          background: style.bg,
          color: style.color,
          fontSize: "0.78rem",
          fontWeight: 600,
        }}
      >
        {status}
      </span>
      {assignee ? (
        <span style={{ fontSize: "0.72rem", color: "#315753", fontWeight: 600 }}>
          {assignee}
        </span>
      ) : null}
    </div>
  );
}

export default function GestionTransporte({ contexto }) {
  const {
    transportState,
    users,
    createTransportRecord,
    updateTransportRecord,
    requestJson,
    actionPermissions,
    Modal,
    formatDateTime,
    documentacionState,
    createDocumentacionRecord,
    updateDocumentacionRecord,
    addDocumentacionArea,
  } = contexto;

  const usersById = useMemo(() => {
    const map = new Map();
    (Array.isArray(users) ? users : []).forEach((user) => {
      const id = String(user?.id || "").trim();
      if (!id) return;
      const resolvedName = String(user?.name || user?.username || "").trim();
      if (resolvedName) map.set(id, resolvedName);
    });
    return map;
  }, [users]);

  const resolveAssignedName = (record) => {
    const inlineName = String(record?.assignedToName || "").trim();
    if (inlineName) return inlineName;
    const assignedId = String(record?.assignedTo || "").trim();
    if (!assignedId) return "";
    return usersById.get(assignedId) || "";
  };

  const getTransportPermissionIds = (areaId) => {
    const normalizedAreaId = String(areaId || "").trim();
    if (normalizedAreaId === "foraneas" || normalizedAreaId === "locales") {
      return { view: "viewTransportRetail", manage: "manageTransportRetail" };
    }
    if (normalizedAreaId === "pedidos") {
      return { view: "viewTransportPedidos", manage: "manageTransportPedidos" };
    }
    if (normalizedAreaId === "inventarioTraslados") {
      return { view: "viewTransportInventario", manage: "manageTransportInventario" };
    }
    return { view: "", manage: "" };
  };

  const canViewTransportArea = (areaId) => {
    const ids = getTransportPermissionIds(areaId);
    if (!ids.view) return false;
    return Boolean(actionPermissions?.[ids.view]);
  };

  const canManageTransportArea = (areaId) => {
    const ids = getTransportPermissionIds(areaId);
    if (!ids.manage) return false;
    return Boolean(actionPermissions?.[ids.manage]);
  };

  const hasActionPermission = (permissionId, fallbackValue = false) => {
    const key = String(permissionId || "").trim();
    if (!key) return fallbackValue;
    if (!actionPermissions || typeof actionPermissions !== "object") return fallbackValue;
    if (!(key in actionPermissions)) return fallbackValue;
    return Boolean(actionPermissions[key]);
  };

  const areaConfig = (Array.isArray(transportState?.config) ? transportState.config : []).filter((area) => canViewTransportArea(area.id));
  const retailAreaIds = ["foraneas", "locales"];
  const pedidosAreaIds = ["pedidos"];
  const inventarioAreaIds = ["inventarioTraslados"];
  const hasRetailAccess = retailAreaIds.some((id) => canViewTransportArea(id));
  const hasPedidosAccess = pedidosAreaIds.some((id) => canViewTransportArea(id));
  const hasInventarioAccess = inventarioAreaIds.some((id) => canViewTransportArea(id));
  const hasRetailManage = retailAreaIds.some((id) => canManageTransportArea(id));
  const hasPedidosManage = pedidosAreaIds.some((id) => canManageTransportArea(id));
  const hasInventarioManage = inventarioAreaIds.some((id) => canManageTransportArea(id));
  const hasAnyTransportViewAccess = hasRetailAccess || hasPedidosAccess || hasInventarioAccess;
  const hasAnyTransportManageAccess = hasRetailManage || hasPedidosManage || hasInventarioManage;
  const hasTransportOnlyAccess = Boolean(
    hasActionPermission("viewTransportDocumentacion", false)
    || hasActionPermission("manageTransportDocumentacion", false)
    || hasActionPermission("viewTransportAssignments", false)
    || hasActionPermission("manageTransportAssignments", false)
    || hasActionPermission("viewTransportPostponed", false)
    || hasActionPermission("manageTransportPostponed", false)
    || hasActionPermission("viewTransportMyRoutes", false)
    || hasActionPermission("viewTransportConsolidated", false)
  );
  const canSeeDocumentacionTab = hasTransportOnlyAccess
    && hasActionPermission("viewTransportDocumentacion", false);
  const canSeeAssignmentsTab = hasTransportOnlyAccess
    && hasActionPermission("viewTransportAssignments", false);
  const canSeePostponedTab = hasTransportOnlyAccess
    && hasActionPermission("viewTransportPostponed", false);
  const canSeeMyRoutesTab = hasTransportOnlyAccess
    && hasActionPermission("viewTransportMyRoutes", false);
  const canSeeConsolidatedTab = hasTransportOnlyAccess
    && hasActionPermission("viewTransportConsolidated", false);
  const canManageDocumentacionTab = hasActionPermission("manageTransportDocumentacion", false);
  const canDeleteTransportRecord = hasAnyTransportManageAccess
    && hasActionPermission("deleteTransportRecord", hasAnyTransportManageAccess);

  const areaTabOptions = useMemo(() => {
    const tabs = [];
    if (hasRetailAccess) tabs.push({ id: "area-retail", label: "Retail", shortLabel: "Retail", icon: "🛍️", accent: "#0f7b5c", soft: "rgba(15, 123, 92, 0.12)" });
    if (hasPedidosAccess) tabs.push({ id: "area-pedidos", label: "Pedidos", shortLabel: "Pedidos", icon: "📦", accent: "#b45309", soft: "rgba(180, 83, 9, 0.12)" });
    if (hasInventarioAccess) tabs.push({ id: "area-inventario", label: "Inventario", shortLabel: "Inv.", icon: "🏷️", accent: "#0e7490", soft: "rgba(14, 116, 144, 0.12)" });
    if (canSeeDocumentacionTab) tabs.push({ id: "documentacion", label: "Documentación", shortLabel: "Doc.", icon: "📄", accent: "#6d28d9", soft: "rgba(109, 40, 217, 0.12)" });
    return tabs;
  }, [canSeeDocumentacionTab, hasInventarioAccess, hasPedidosAccess, hasRetailAccess]);

  const transportOnlyTabOptions = useMemo(() => {
    const tabs = [];
    if (canSeeAssignmentsTab) tabs.push({ id: "asignaciones", label: "Asignaciones", shortLabel: "Asig.", icon: "🚚", accent: "#2563eb", soft: "rgba(37, 99, 235, 0.12)" });
    if (canSeePostponedTab) tabs.push({ id: "pospuestos", label: "Pospuestos y programados", shortLabel: "Prog.", icon: "⏰", accent: "#b45309", soft: "rgba(180, 83, 9, 0.12)" });
    if (canSeeMyRoutesTab) tabs.push({ id: "mis-rutas", label: "Mis rutas", shortLabel: "Rutas", icon: "🛣️", accent: "#15803d", soft: "rgba(21, 128, 61, 0.12)" });
    if (canSeeConsolidatedTab) tabs.push({ id: "consolidado", label: "Consolidado", shortLabel: "Consol.", icon: "📊", accent: "#0f766e", soft: "rgba(15, 118, 110, 0.12)" });
    return tabs;
  }, [
    canSeeAssignmentsTab,
    canSeeConsolidatedTab,
    canSeeMyRoutesTab,
    canSeePostponedTab,
  ]);

  const mainTabOptions = useMemo(() => ([...areaTabOptions, ...transportOnlyTabOptions]), [areaTabOptions, transportOnlyTabOptions]);

  const firstAreaId = areaConfig[0]?.id || "";
  const [selectedAreaId, setSelectedAreaId] = useState(firstAreaId);
  const [selectedViewTab, setSelectedViewTab] = useState("active");
  const [selectedMainTab, setSelectedMainTab] = useState(() => mainTabOptions[0]?.id || "documentacion");
  const [selectedPrincipalMonth, setSelectedPrincipalMonth] = useState(() => String(transportState?.activeDateKey || new Date().toISOString().slice(0, 10)).slice(0, 7));
  const [selectedConsolidatedRange] = useState("dias");
  const [selectedPrincipalDate, setSelectedPrincipalDate] = useState(() => String(transportState?.activeDateKey || new Date().toISOString().slice(0, 10)).slice(0, 10));
  const [selectedPrincipalDateFrom, setSelectedPrincipalDateFrom] = useState(() => String(transportState?.activeDateKey || new Date().toISOString().slice(0, 10)).slice(0, 10));
  const [selectedPrincipalDateTo, setSelectedPrincipalDateTo] = useState(() => String(transportState?.activeDateKey || new Date().toISOString().slice(0, 10)).slice(0, 10));
  const [selectedCalendarGrouping, setSelectedCalendarGrouping] = useState("mes");
  const [selectedPrincipalYear, setSelectedPrincipalYear] = useState(() => Number(String(transportState?.activeDateKey || "").slice(0, 4)) || new Date().getFullYear());
  const [selectedPrincipalMonthSpan] = useState(3);
  const [selectedConsolidatedPlayerId, setSelectedConsolidatedPlayerId] = useState("all");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [transportModal, setTransportModal] = useState(createTransportModalState(firstAreaId));
  const [transportModalError, setTransportModalError] = useState("");
  const [postponeModal, setPostponeModal] = useState(createPostponeModalState());
  const [deleteTransportModal, setDeleteTransportModal] = useState(createDeleteTransportModalState());
  const [evidenceViewer, setEvidenceViewer] = useState({ open: false, evidence: null, title: "" });
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Documentación state
  const [docModal, setDocModal] = useState(createDocModalState());
  const [docAreaMode, setDocAreaMode] = useState("select");
  const [docEvidenceViewer, setDocEvidenceViewer] = useState({ open: false, evidence: null, title: "" });
  const [uploadingDocEvidence, setUploadingDocEvidence] = useState(false);
  const docEvidenceInputRef = useRef(null);
  const docEvidenceCameraRef = useRef(null);
  const [selectedDocViewTab, setSelectedDocViewTab] = useState("active");
  const [docFilterUbicacion, setDocFilterUbicacion] = useState("ALL");
  const [docFilterArea, setDocFilterArea] = useState("ALL");

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNowMs(Date.now()), 10000);
    return () => globalThis.clearInterval(timer);
  }, []);

  const selectedAreaOptions = useMemo(() => {
    if (selectedMainTab === "area-retail") {
      return areaConfig.filter((area) => retailAreaIds.includes(String(area?.id || "").trim()));
    }
    if (selectedMainTab === "area-pedidos") {
      return areaConfig.filter((area) => pedidosAreaIds.includes(String(area?.id || "").trim()));
    }
    if (selectedMainTab === "area-inventario") {
      return areaConfig.filter((area) => inventarioAreaIds.includes(String(area?.id || "").trim()));
    }
    return [];
  }, [areaConfig, selectedMainTab]);

  const selectedArea = useMemo(
    () => selectedAreaOptions.find((item) => item.id === selectedAreaId) || selectedAreaOptions[0] || areaConfig[0] || null,
    [areaConfig, selectedAreaId, selectedAreaOptions],
  );
  const canManageSelectedArea = canManageTransportArea(selectedArea?.id);

  useEffect(() => {
    if (!mainTabOptions.length) return;
    if (mainTabOptions.some((tab) => tab.id === selectedMainTab)) return;
    setSelectedMainTab(mainTabOptions[0].id);
  }, [mainTabOptions, selectedMainTab]);

  useEffect(() => {
    if (!selectedAreaOptions.length) return;
    if (selectedAreaOptions.some((entry) => entry.id === selectedAreaId)) return;
    setSelectedAreaId(selectedAreaOptions[0].id);
  }, [selectedAreaId, selectedAreaOptions]);

  const activeRecords = useMemo(
    () => (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => record.areaId === selectedArea?.id),
    [selectedArea?.id, transportState?.activeRecords],
  );

  const historyRecords = useMemo(
    () => (Array.isArray(transportState?.historyRecords) ? transportState.historyRecords : [])
      .filter((record) => record.areaId === selectedArea?.id),
    [selectedArea?.id, transportState?.historyRecords],
  );

  const transportRecordsAll = useMemo(
    () => [
      ...(Array.isArray(transportState?.historyRecords) ? transportState.historyRecords : []),
      ...(Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : []),
    ],
    [transportState?.activeRecords, transportState?.historyRecords],
  );

  const principalMonthOptions = useMemo(() => {
    const monthSet = new Set();
    const activeMonth = String(transportState?.activeDateKey || "").slice(0, 7);
    if (activeMonth) monthSet.add(activeMonth);

    transportRecordsAll.forEach((record) => {
      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      if (dateKey.length >= 7) monthSet.add(dateKey.slice(0, 7));
    });

    (Array.isArray(documentacionState?.records) ? documentacionState.records : []).forEach((record) => {
      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      if (dateKey.length >= 7) monthSet.add(dateKey.slice(0, 7));
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [documentacionState?.records, transportRecordsAll, transportState?.activeDateKey]);

  useEffect(() => {
    if (!principalMonthOptions.length) return;
    if (principalMonthOptions.includes(selectedPrincipalMonth)) return;
    setSelectedPrincipalMonth(principalMonthOptions[0]);
  }, [principalMonthOptions, selectedPrincipalMonth]);

  const principalDateOptions = useMemo(() => {
    const dateSet = new Set();
    const activeDateKey = String(transportState?.activeDateKey || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(activeDateKey)) dateSet.add(activeDateKey);

    transportRecordsAll.forEach((record) => {
      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) dateSet.add(dateKey);
    });

    (Array.isArray(documentacionState?.records) ? documentacionState.records : []).forEach((record) => {
      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) dateSet.add(dateKey);
    });

    const todayKey = toDateKeyFromDate(new Date());
    if (todayKey) dateSet.add(todayKey);

    return Array.from(dateSet).sort((left, right) => right.localeCompare(left));
  }, [documentacionState?.records, transportRecordsAll, transportState?.activeDateKey]);

  useEffect(() => {
    if (!principalDateOptions.length) return;
    if (principalDateOptions.includes(selectedPrincipalDate)) return;
    setSelectedPrincipalDate(principalDateOptions[0]);
  }, [principalDateOptions, selectedPrincipalDate]);

  useEffect(() => {
    const todayKey = toDateKeyFromDate(new Date());
    const isFromValid = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedPrincipalDateFrom || ""));
    const isToValid = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedPrincipalDateTo || ""));
    if (!isFromValid) {
      setSelectedPrincipalDateFrom(todayKey);
      if (!isToValid) setSelectedPrincipalDateTo(todayKey);
      return;
    }
    if (!isToValid) {
      setSelectedPrincipalDateTo(selectedPrincipalDateFrom);
    }
  }, [selectedPrincipalDateFrom, selectedPrincipalDateTo]);

  const principalYearOptions = useMemo(() => {
    const years = new Set();
    principalMonthOptions.forEach((monthKey) => {
      const year = Number(String(monthKey || "").slice(0, 4));
      if (Number.isInteger(year) && year > 0) years.add(year);
    });

    principalDateOptions.forEach((dateKey) => {
      const year = Number(String(dateKey || "").slice(0, 4));
      if (Number.isInteger(year) && year > 0) years.add(year);
    });

    if (!years.size) years.add(new Date().getFullYear());

    return Array.from(years).sort((left, right) => right - left);
  }, [principalDateOptions, principalMonthOptions]);

  useEffect(() => {
    if (!principalYearOptions.length) return;
    if (principalYearOptions.includes(Number(selectedPrincipalYear))) return;
    setSelectedPrincipalYear(principalYearOptions[0]);
  }, [principalYearOptions, selectedPrincipalYear]);

  const consolidatedRangeModel = useMemo(() => getConsolidatedRangeModel({
    rangeType: selectedConsolidatedRange,
    selectedDateKey: selectedPrincipalDate,
    selectedDateFrom: selectedPrincipalDateFrom,
    selectedDateTo: selectedPrincipalDateTo,
    selectedCalendarGrouping,
    selectedMonth: selectedPrincipalMonth,
    selectedYear: selectedPrincipalYear,
    selectedMonthSpan: selectedPrincipalMonthSpan,
    principalMonthOptions,
  }), [
    principalMonthOptions,
    selectedCalendarGrouping,
    selectedConsolidatedRange,
    selectedPrincipalDate,
    selectedPrincipalDateFrom,
    selectedPrincipalDateTo,
    selectedPrincipalMonth,
    selectedPrincipalMonthSpan,
    selectedPrincipalYear,
  ]);

  const consolidatedPlayerOptions = useMemo(() => {
    const optionsMap = new Map();
    const addOption = (playerIdRaw, playerNameRaw) => {
      const id = String(playerIdRaw || "").trim();
      const name = String(playerNameRaw || "").trim();
      if (id) {
        const resolved = name || usersById.get(id) || id;
        if (resolved) optionsMap.set(id, resolved);
        return;
      }
      if (name) {
        optionsMap.set(`name:${name.toLowerCase()}`, name);
      }
    };

    transportRecordsAll.forEach((record) => {
      addOption(record?.assignedTo, record?.assignedToName);
    });
    (Array.isArray(documentacionState?.records) ? documentacionState.records : []).forEach((record) => {
      addOption(record?.assignedTo, record?.assignedToName);
    });

    return Array.from(optionsMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "es"));
  }, [documentacionState?.records, transportRecordsAll, usersById]);

  useEffect(() => {
    if (selectedConsolidatedPlayerId === "all" || selectedConsolidatedPlayerId === "unassigned") return;
    const isValid = consolidatedPlayerOptions.some((player) => player.value === selectedConsolidatedPlayerId);
    if (!isValid) setSelectedConsolidatedPlayerId("all");
  }, [consolidatedPlayerOptions, selectedConsolidatedPlayerId]);

  const doesRecordMatchConsolidatedPlayer = (record) => {
    const selectedId = String(selectedConsolidatedPlayerId || "all").trim();
    if (selectedId === "all") return true;

    const assignedId = String(record?.assignedTo || "").trim();
    const assignedName = String(record?.assignedToName || "").trim();
    if (selectedId === "unassigned") return !assignedId && !assignedName;
    if (selectedId.startsWith("name:")) {
      return assignedName && `name:${assignedName.toLowerCase()}` === selectedId;
    }
    return assignedId === selectedId;
  };

  const principalSummary = useMemo(() => {
    const visibleAreas = areaConfig
      .map((area) => ({ id: String(area?.id || "").trim(), label: String(area?.label || area?.id || "").trim() }))
      .filter((area) => area.id);
    visibleAreas.push({ id: "documentacion", label: "DOCUMENTACIÓN" });

    const visibleAreaMap = new Map(visibleAreas.map((area) => [area.id, area]));
    const weeks = Array.isArray(consolidatedRangeModel?.buckets) ? consolidatedRangeModel.buckets : [];
    if (!weeks.length) {
      return { weeks: [], areas: [], grandTotals: { salidas: 0, cajas: 0, piezas: 0 }, grandWeekly: [] };
    }

    const areasMap = new Map();
    const grandWeekly = weeks.map(() => ({ salidas: 0, cajas: 0, piezas: 0 }));
    const grandTotals = { salidas: 0, cajas: 0, piezas: 0 };

    const ensureAreaEntry = (areaId, areaLabel) => {
      if (!areasMap.has(areaId)) {
        areasMap.set(areaId, {
          areaId,
          areaLabel,
          rowsMap: new Map(),
          totals: { salidas: 0, cajas: 0, piezas: 0 },
          weeklyTotals: weeks.map(() => ({ salidas: 0, cajas: 0, piezas: 0 })),
        });
      }
      return areasMap.get(areaId);
    };

    const applyRecordToSummary = (areaId, areaLabel, destination, weekIndex, salidas, cajas, piezas) => {
      const areaEntry = ensureAreaEntry(areaId, areaLabel);

      if (!areaEntry.rowsMap.has(destination)) {
        areaEntry.rowsMap.set(destination, {
          destination,
          totals: { salidas: 0, cajas: 0, piezas: 0 },
          weekly: weeks.map(() => ({ salidas: 0, cajas: 0, piezas: 0 })),
        });
      }

      const rowEntry = areaEntry.rowsMap.get(destination);
      rowEntry.weekly[weekIndex].salidas += salidas;
      rowEntry.weekly[weekIndex].cajas += cajas;
      rowEntry.weekly[weekIndex].piezas += piezas;
      rowEntry.totals.salidas += salidas;
      rowEntry.totals.cajas += cajas;
      rowEntry.totals.piezas += piezas;

      areaEntry.weeklyTotals[weekIndex].salidas += salidas;
      areaEntry.weeklyTotals[weekIndex].cajas += cajas;
      areaEntry.weeklyTotals[weekIndex].piezas += piezas;
      areaEntry.totals.salidas += salidas;
      areaEntry.totals.cajas += cajas;
      areaEntry.totals.piezas += piezas;

      grandWeekly[weekIndex].salidas += salidas;
      grandWeekly[weekIndex].cajas += cajas;
      grandWeekly[weekIndex].piezas += piezas;
      grandTotals.salidas += salidas;
      grandTotals.cajas += cajas;
      grandTotals.piezas += piezas;
    };

    transportRecordsAll.forEach((record) => {
      if (String(record?.status || "").trim() === "Cancelado") return;
      if (!doesRecordMatchConsolidatedPlayer(record)) return;
      const areaId = String(record?.areaId || "").trim();
      const visibleArea = visibleAreaMap.get(areaId);
      if (!visibleArea) return;

      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      const dateMs = parseDateKeyToMs(dateKey);
      if (!Number.isFinite(dateMs)) return;
      const weekIndex = weeks.findIndex((bucket) => dateMs >= bucket.startMs && dateMs <= bucket.endMs);
      if (weekIndex < 0 || weekIndex >= weeks.length) return;

      const destination = String(record?.destination || "Sin destino").trim() || "Sin destino";
      const salidas = 1;
      const cajas = toPositiveNumber(record?.boxes);
      const piezas = toPositiveNumber(record?.pieces);

      applyRecordToSummary(areaId, visibleArea.label, destination, weekIndex, salidas, cajas, piezas);
    });

    (Array.isArray(documentacionState?.records) ? documentacionState.records : []).forEach((record) => {
      if (String(record?.status || "").trim() === "Cancelado") return;
      if (!doesRecordMatchConsolidatedPlayer(record)) return;
      const visibleArea = visibleAreaMap.get("documentacion");
      if (!visibleArea) return;

      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      const dateMs = parseDateKeyToMs(dateKey);
      if (!Number.isFinite(dateMs)) return;
      const weekIndex = weeks.findIndex((bucket) => dateMs >= bucket.startMs && dateMs <= bucket.endMs);
      if (weekIndex < 0 || weekIndex >= weeks.length) return;

      const destination = String(record?.area || "Sin área").trim() || "Sin área";
      const salidas = 1;
      const cajas = 0;
      const piezas = 0;

      applyRecordToSummary("documentacion", visibleArea.label, destination, weekIndex, salidas, cajas, piezas);
    });

    const areas = visibleAreas.map((area) => {
      const resolved = areasMap.get(area.id) || {
        areaId: area.id,
        areaLabel: area.label,
        rowsMap: new Map(),
        totals: { salidas: 0, cajas: 0, piezas: 0 },
        weeklyTotals: weeks.map(() => ({ salidas: 0, cajas: 0, piezas: 0 })),
      };
      return {
        areaId: resolved.areaId,
        areaLabel: resolved.areaLabel,
        totals: resolved.totals,
        weeklyTotals: resolved.weeklyTotals,
        rows: Array.from(resolved.rowsMap.values()).sort((a, b) => a.destination.localeCompare(b.destination, "es")),
      };
    });

    return { weeks, areas, grandTotals, grandWeekly };
  }, [
    areaConfig,
    consolidatedRangeModel,
    documentacionState?.records,
    selectedConsolidatedPlayerId,
    transportRecordsAll,
    transportState?.activeDateKey,
  ]);

  const consolidatedDashboard = useMemo(() => {
    const totalSalidas = Number(principalSummary?.grandTotals?.salidas || 0);
    const totalCajas = Number(principalSummary?.grandTotals?.cajas || 0);
    const totalPiezas = Number(principalSummary?.grandTotals?.piezas || 0);

    const areaRows = Array.isArray(principalSummary?.areas) ? principalSummary.areas : [];
    const weekRows = Array.isArray(principalSummary?.weeks) ? principalSummary.weeks : [];
    const weeklyTotals = Array.isArray(principalSummary?.grandWeekly) ? principalSummary.grandWeekly : [];

    const areaTotals = areaRows.map((area) => ({
      areaId: area.areaId,
      areaLabel: area.areaLabel,
      salidas: Number(area?.totals?.salidas || 0),
      cajas: Number(area?.totals?.cajas || 0),
      piezas: Number(area?.totals?.piezas || 0),
      destinos: Array.isArray(area?.rows) ? area.rows.length : 0,
    }));

    const totalDestinos = areaTotals.reduce((acc, area) => acc + Number(area.destinos || 0), 0);
    const maxAreaSalidas = Math.max(1, ...areaTotals.map((area) => Number(area.salidas || 0)));

    const weeklySeries = weekRows.map((week, index) => ({
      label: week.label,
      shortLabel: week.shortLabel,
      salidas: Number(weeklyTotals?.[index]?.salidas || 0),
      cajas: Number(weeklyTotals?.[index]?.cajas || 0),
      piezas: Number(weeklyTotals?.[index]?.piezas || 0),
    }));

    const maxWeeklySalidas = Math.max(1, ...weeklySeries.map((week) => Number(week.salidas || 0)));

    const areaSortedBySalidas = [...areaTotals].sort((left, right) => right.salidas - left.salidas);
    const topArea = areaSortedBySalidas[0] || null;

    const dominantWeek = [...weeklySeries]
      .sort((left, right) => right.salidas - left.salidas)[0] || null;

    const palette = [
      "#0f766e",
      "#2563eb",
      "#b45309",
      "#6d28d9",
      "#15803d",
      "#be123c",
      "#0e7490",
      "#334155",
    ];

    const areaPie = [];
    let accumulated = 0;
    areaSortedBySalidas.forEach((area, index) => {
      const rawPercent = totalSalidas > 0 ? (area.salidas / totalSalidas) * 100 : 0;
      const safePercent = Number.isFinite(rawPercent) ? rawPercent : 0;
      const start = accumulated;
      const end = Math.min(100, accumulated + safePercent);
      accumulated = end;
      areaPie.push({
        ...area,
        color: palette[index % palette.length],
        percent: safePercent,
        start,
        end,
      });
    });

    const pieGradient = areaPie.length
      ? `conic-gradient(${areaPie.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(", ")})`
      : "conic-gradient(#dce7e3 0% 100%)";

    const lineSeries = weeklySeries.map((week, index, list) => {
      const ratio = maxWeeklySalidas > 0 ? week.salidas / maxWeeklySalidas : 0;
      const x = list.length <= 1 ? 40 : 40 + (index * (560 / (list.length - 1)));
      const y = 170 - (ratio * 130);
      return {
        ...week,
        shortLabel: String(week.shortLabel || week.label || ""),
        x,
        y,
      };
    });

    const linePath = lineSeries.map((point) => `${point.x},${point.y}`).join(" ");

    const areaBarSeries = areaSortedBySalidas.slice(0, 8).map((area) => ({
      ...area,
      shortLabel: String(area.areaLabel || "").replace("DOCUMENTACIÓN", "DOC."),
      ratio: maxAreaSalidas > 0 ? (area.salidas / maxAreaSalidas) : 0,
    }));

    return {
      totalSalidas,
      totalCajas,
      totalPiezas,
      totalDestinos,
      areaTotals,
      areaSortedBySalidas,
      maxAreaSalidas,
      weeklySeries,
      maxWeeklySalidas,
      topArea,
      dominantWeek,
      areaPie,
      pieGradient,
      lineSeries,
      linePath,
      areaBarSeries,
    };
  }, [principalSummary]);

  const transportPlayersRanking = useMemo(() => {
    const visibleTransportAreaIds = new Set(
      (Array.isArray(areaConfig) ? areaConfig : [])
        .map((area) => String(area?.id || "").trim())
        .filter(Boolean),
    );

    const rankingMap = new Map();

    transportRecordsAll.forEach((record) => {
      if (String(record?.status || "").trim() === "Cancelado") return;
      if (!doesRecordMatchConsolidatedPlayer(record)) return;

      const areaId = String(record?.areaId || "").trim();
      if (!visibleTransportAreaIds.has(areaId)) return;

      const dateKey = extractDateKey(record, transportState?.activeDateKey || "");
      const dateMs = parseDateKeyToMs(dateKey);
      if (!Number.isFinite(dateMs)) return;
      const isInRange = (Array.isArray(consolidatedRangeModel?.buckets) ? consolidatedRangeModel.buckets : [])
        .some((bucket) => dateMs >= bucket.startMs && dateMs <= bucket.endMs);
      if (!isInRange) return;

      const assignedId = String(record?.assignedTo || "").trim();
      const inlineName = String(record?.assignedToName || "").trim();
      const resolvedName = inlineName || (assignedId ? usersById.get(assignedId) : "") || "Sin asignar";
      const rankingKey = assignedId || `name:${resolvedName.toLowerCase()}`;

      if (!rankingMap.has(rankingKey)) {
        rankingMap.set(rankingKey, {
          key: rankingKey,
          playerId: assignedId,
          playerName: resolvedName,
          salidas: 0,
          cajas: 0,
          piezas: 0,
        });
      }

      const entry = rankingMap.get(rankingKey);
      entry.salidas += 1;
      entry.cajas += toPositiveNumber(record?.boxes);
      entry.piezas += toPositiveNumber(record?.pieces);
    });

    const rows = Array.from(rankingMap.values())
      .sort((left, right) => {
        if (right.salidas !== left.salidas) return right.salidas - left.salidas;
        if (right.cajas !== left.cajas) return right.cajas - left.cajas;
        if (right.piezas !== left.piezas) return right.piezas - left.piezas;
        return left.playerName.localeCompare(right.playerName, "es");
      });

    const maxSalidas = Math.max(1, ...rows.map((row) => Number(row.salidas || 0)));

    return {
      rows,
      maxSalidas,
      topThree: rows.slice(0, 3),
    };
  }, [
    areaConfig,
    consolidatedRangeModel,
    selectedConsolidatedPlayerId,
    transportRecordsAll,
    transportState?.activeDateKey,
    usersById,
  ]);

  const mainTabCountById = useMemo(() => {
    const terminalStatuses = new Set(["Entregado", "Devuelto", "Cancelado"]);
    const activeTransportRecords = Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [];
    const docRecords = Array.isArray(documentacionState?.records) ? documentacionState.records : [];
    const activeDateKey = String(transportState?.activeDateKey || "").trim();

    const allAreaIds = (Array.isArray(transportState?.config) ? transportState.config : [])
      .map((area) => area.id)
      .filter(Boolean);

    const manageableAreaIds = allAreaIds.filter((areaId) => canManageTransportArea?.(areaId));
    const allowedAssignmentAreaIds = new Set(manageableAreaIds.length ? manageableAreaIds : allAreaIds);
    const canViewAllPostponed = canSeePostponedTab && !hasAnyTransportManageAccess;
    const visibleAreaIds = new Set(areaConfig.map((area) => area.id).filter(Boolean));

    const areaRetailCount = activeTransportRecords.filter((record) => retailAreaIds.includes(String(record?.areaId || "").trim())).length;
    const areaPedidosCount = activeTransportRecords.filter((record) => pedidosAreaIds.includes(String(record?.areaId || "").trim())).length;
    const areaInventarioCount = activeTransportRecords.filter((record) => inventarioAreaIds.includes(String(record?.areaId || "").trim())).length;

    const documentacionCount = activeDateKey
      ? docRecords.filter((record) => String(record?.dateKey || "").trim() === activeDateKey).length
      : 0;

    const assignmentTransportCount = activeTransportRecords
      .filter((record) => {
        const status = String(record?.status || "").trim();
        const isPending = status === "Pendiente";
        const isReadyFromPostponed = isPostponedReady(record, nowMs);
        if (!isPending && !isReadyFromPostponed) return false;
        return allowedAssignmentAreaIds.size ? allowedAssignmentAreaIds.has(record.areaId) : true;
      })
      .length;

    const assignmentDocCount = activeDateKey
      ? docRecords
        .filter((record) => String(record?.dateKey || "").trim() === activeDateKey)
        .filter((record) => String(record?.status || "Pendiente").trim() === "Pendiente")
        .length
      : 0;

    const postponedCount = activeTransportRecords
      .filter((record) => String(record?.status || "").trim() === "Pospuesto")
      .filter((record) => !isPostponedReady(record, nowMs))
      .filter((record) => canViewAllPostponed || canManageTransportArea?.(record.areaId))
      .length;

    const currentUserId = String(contexto?.currentUser?.id || "").trim();
    const myRoutesCount = currentUserId
      ? activeTransportRecords.filter((record) => record.assignedTo === currentUserId && !terminalStatuses.has(String(record.status || ""))).length
        + docRecords.filter((record) => record.assignedTo === currentUserId && !terminalStatuses.has(String(record.status || ""))).length
      : 0;

    const rangeBuckets = Array.isArray(consolidatedRangeModel?.buckets) ? consolidatedRangeModel.buckets : [];
    const isDateInConsolidatedRange = (dateKey) => {
      const dateMs = parseDateKeyToMs(dateKey);
      if (!Number.isFinite(dateMs)) return false;
      return rangeBuckets.some((bucket) => dateMs >= bucket.startMs && dateMs <= bucket.endMs);
    };

    const consolidatedCount = rangeBuckets.length
      ? transportRecordsAll
        .filter((record) => visibleAreaIds.has(String(record?.areaId || "").trim()))
        .filter((record) => doesRecordMatchConsolidatedPlayer(record))
        .filter((record) => isDateInConsolidatedRange(extractDateKey(record, transportState?.activeDateKey || "")))
        .length
        + docRecords
          .filter((record) => doesRecordMatchConsolidatedPlayer(record))
          .filter((record) => isDateInConsolidatedRange(extractDateKey(record, transportState?.activeDateKey || "")))
          .length
      : 0;

    return {
      "area-retail": areaRetailCount,
      "area-pedidos": areaPedidosCount,
      "area-inventario": areaInventarioCount,
      documentacion: documentacionCount,
      asignaciones: assignmentTransportCount + assignmentDocCount,
      pospuestos: postponedCount,
      "mis-rutas": myRoutesCount,
      consolidado: consolidatedCount,
    };
  }, [
    areaConfig,
    canManageTransportArea,
    canSeePostponedTab,
    consolidatedRangeModel,
    contexto?.currentUser?.id,
    documentacionState?.records,
    hasAnyTransportManageAccess,
    nowMs,
    selectedConsolidatedPlayerId,
    transportRecordsAll,
    transportState?.activeDateKey,
    transportState?.activeRecords,
    transportState?.config,
  ]);

  function openCreateModal() {
    const baseDate = new Date(Date.now() + (2 * 60 * 60 * 1000));
    const defaultDate = baseDate.toISOString().slice(0, 10);
    const defaultTime = baseDate.toTimeString().slice(0, 5);
    setTransportModalError("");
    setTransportModal({
      ...createTransportModalState(selectedArea?.id || ""),
      open: true,
      destination: selectedArea?.destinations?.[0] || "",
      scheduledDate: defaultDate,
      scheduledTime: defaultTime,
    });
  }

  function openEditModal(record) {
    setTransportModalError("");
    setTransportModal({
      open: true,
      mode: "edit",
      recordId: String(record?.id || "").trim(),
      areaId: String(record?.areaId || selectedArea?.id || "").trim(),
      destination: String(record?.destination || "").trim(),
      boxes: String(record?.boxes ?? ""),
      pieces: String(record?.pieces ?? ""),
      notes: String(record?.notes || "").trim(),
      evidence: record?.evidence || null,
    });
  }

  function openEvidenceViewer(record) {
    if (!record?.evidence?.url) return;
    setEvidenceViewer({
      open: true,
      evidence: record.evidence,
      title: record.destination || "Evidencia del envio",
    });
  }

  function closeEvidenceViewer() {
    setEvidenceViewer({ open: false, evidence: null, title: "" });
  }

  async function handleUploadEvidence(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    try {
      const uploaded = await uploadFileToCloudinary(file);
      setTransportModal((current) => ({
        ...current,
        evidence: {
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
          name: uploaded.originalName || file.name,
          type: uploaded.resourceType || file.type || "image",
        },
      }));
      setTransportModalError("");
    } finally {
      setUploadingEvidence(false);
      event.target.value = "";
    }
  }

  async function submitTransportModal() {
    if (!canManageTransportArea(transportModal.areaId)) {
      setTransportModalError("No tienes permiso para guardar este registro.");
      return;
    }
    const payload = {
      areaId: transportModal.areaId,
      destination: transportModal.destination,
      boxes: Number(transportModal.boxes || 0),
      pieces: Number(transportModal.pieces || 0),
      notes: transportModal.notes.trim(),
      evidence: transportModal.evidence,
    };

    const missingFields = [];
    if (!payload.areaId) missingFields.push("área");
    if (!payload.destination) missingFields.push("destino");
    if (!payload.evidence?.url) missingFields.push("evidencia");
    if ((payload.boxes || 0) <= 0 && (payload.pieces || 0) <= 0) missingFields.push("cajas o piezas");

    if (missingFields.length > 0) {
      setTransportModalError(`Falta completar: ${missingFields.join(", ")}.`);
      return;
    }

    if (transportModal.mode === "create" && transportModal.isScheduled) {
      const scheduleDate = String(transportModal.scheduledDate || "").trim();
      const scheduleTime = String(transportModal.scheduledTime || "").trim();
      const remindBeforeMinutes = Math.max(0, Number(transportModal.remindBeforeMinutes || 0));
      const candidate = new Date(`${scheduleDate}T${scheduleTime}`);
      if (!scheduleDate || !scheduleTime || Number.isNaN(candidate.getTime())) {
        setTransportModalError("Define una fecha y hora válidas para programar el envío.");
        return;
      }
      if (candidate.getTime() <= Date.now()) {
        setTransportModalError("La fecha programada debe ser mayor a la hora actual.");
        return;
      }
      if (!Number.isFinite(remindBeforeMinutes)) {
        setTransportModalError("El recordatorio debe ser un número válido.");
        return;
      }
    }

    try {
      if (transportModal.mode === "create") {
        const createdResult = await createTransportRecord(payload);
        if (transportModal.isScheduled) {
          const recordId = String(createdResult?.data?.recordId || "").trim();
          const scheduleDate = String(transportModal.scheduledDate || "").trim();
          const scheduleTime = String(transportModal.scheduledTime || "").trim();
          const remindBeforeMinutes = Math.max(0, Number(transportModal.remindBeforeMinutes || 0));
          const candidate = new Date(`${scheduleDate}T${scheduleTime}`);
          if (!recordId) {
            throw new Error("Se creó el envío, pero no se pudo identificar para programarlo.");
          }
          const scheduleResult = await requestJson(`/warehouse/transport/records/${recordId}/postpone`, {
            method: "POST",
            body: JSON.stringify({
              postponedUntil: candidate.toISOString(),
              remindBeforeMinutes,
            }),
          });
          if (!scheduleResult?.ok) {
            throw new Error(scheduleResult?.message || "Se creó el envío, pero no se pudo programar.");
          }
        }
      } else {
        await updateTransportRecord(transportModal.recordId, payload);
      }
      setTransportModalError("");
      setTransportModal(createTransportModalState(selectedArea?.id || ""));
    } catch (error) {
      setTransportModalError(error?.message || "No fue posible guardar el registro. Revisa los campos obligatorios.");
    }
  }

  function openPostponeModal(record) {
    const baseDate = new Date(Date.now() + (2 * 60 * 60 * 1000));
    const defaultDate = baseDate.toISOString().slice(0, 10);
    const defaultTime = baseDate.toTimeString().slice(0, 5);

    setPostponeModal({
      open: true,
      recordId: String(record?.id || "").trim(),
      destination: String(record?.destination || "").trim() || "Destino",
      postponedDate: defaultDate,
      postponedTime: defaultTime,
      remindBeforeMinutes: "60",
    });
  }

  async function submitPostponeModal() {
    const recordId = String(postponeModal.recordId || "").trim();
    const postponedDate = String(postponeModal.postponedDate || "").trim();
    const postponedTime = String(postponeModal.postponedTime || "").trim();
    const remindBeforeMinutes = Math.max(0, Number(postponeModal.remindBeforeMinutes || 0));

    if (!recordId || !postponedDate || !postponedTime || !Number.isFinite(remindBeforeMinutes)) return;

    const candidate = new Date(`${postponedDate}T${postponedTime}`);
    if (Number.isNaN(candidate.getTime())) return;

    const result = await requestJson(`/warehouse/transport/records/${recordId}/postpone`, {
      method: "POST",
      body: JSON.stringify({
        postponedUntil: candidate.toISOString(),
        remindBeforeMinutes,
      }),
    });

    if (!result?.ok) return;
    setPostponeModal(createPostponeModalState());
  }

  function openDeleteTransportModal(record) {
    setDeleteTransportModal({
      open: true,
      recordId: String(record?.id || "").trim(),
      destination: String(record?.destination || "").trim() || "Destino",
      submitting: false,
      error: "",
    });
  }

  async function submitDeleteTransportModal() {
    const recordId = String(deleteTransportModal.recordId || "").trim();
    if (!recordId || !canDeleteTransportRecord) return;

    setDeleteTransportModal((current) => ({ ...current, submitting: true, error: "" }));
    try {
      await requestJson(`/warehouse/transport/records/${recordId}`, { method: "DELETE" });
      setDeleteTransportModal(createDeleteTransportModalState());
    } catch (error) {
      setDeleteTransportModal((current) => ({
        ...current,
        submitting: false,
        error: error?.message || "No fue posible eliminar el registro.",
      }));
    }
  }

  function renderEvidenceCell(record) {
    const evidence = record?.evidence;
    if (!evidence?.url) return <span className="subtle-line">Sin evidencia</span>;

    if (isImageEvidence(evidence)) {
      return (
        <button type="button" className="transport-evidence-thumb" onClick={() => openEvidenceViewer(record)}>
          <img src={evidence.thumbnailUrl || evidence.url} alt={evidence.name || `Evidencia ${record.destination || ""}`.trim()} />
        </button>
      );
    }

    if (isVideoEvidence(evidence)) {
      return (
        <button type="button" className="transport-evidence-thumb transport-evidence-thumb-video" onClick={() => openEvidenceViewer(record)}>
          <video src={evidence.url} poster={evidence.thumbnailUrl || undefined} muted playsInline preload="metadata" />
          <span>Video</span>
        </button>
      );
    }

    return (
      <a href={evidence.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
        {evidence.name || "Abrir archivo"}
      </a>
    );
  }

  // ── Documentación helpers ─────────────────────────────────────────
  const docRecords = useMemo(() => {
    const all = Array.isArray(documentacionState?.records) ? documentacionState.records : [];
    return all
      .filter((r) => docFilterUbicacion === "ALL" || r.ubicacion === docFilterUbicacion)
      .filter((r) => docFilterArea === "ALL" || r.area === docFilterArea);
  }, [documentacionState, docFilterUbicacion, docFilterArea]);

  const activeDocDateKey = String(transportState?.activeDateKey || "").trim();
  const docActiveRecords = useMemo(
    () => docRecords.filter((r) => String(r?.dateKey || "").trim() === activeDocDateKey),
    [activeDocDateKey, docRecords],
  );
  const docHistoryRecords = useMemo(
    () => docRecords.filter((r) => String(r?.dateKey || "").trim() !== activeDocDateKey),
    [activeDocDateKey, docRecords],
  );

  const customAreas = Array.isArray(documentacionState?.customAreas) ? documentacionState.customAreas : [];

  function openCreateDocModal() {
    const defaultArea = customAreas[0] || "";
    setDocAreaMode(customAreas.length ? "select" : "new");
    setDocModal({ ...createDocModalState(), open: true, area: defaultArea });
  }

  function openEditDocModal(record) {
    const areaName = String(record?.area || "").trim();
    const isKnownArea = customAreas.some((a) => a.toLowerCase() === areaName.toLowerCase());
    setDocAreaMode(isKnownArea ? "select" : "new");
    setDocModal({
      open: true,
      mode: "edit",
      recordId: record.id,
      ubicacion: record.ubicacion || "SONATA",
      area: areaName,
      dirigidoA: record.dirigidoA || "",
      notas: record.notas || "",
      evidence: record.evidence || null,
    });
  }

  async function handleUploadDocEvidence(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingDocEvidence(true);
    try {
      const uploaded = await uploadFileToCloudinary(file);
      setDocModal((prev) => ({
        ...prev,
        evidence: {
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
          name: uploaded.originalName || file.name,
          type: uploaded.resourceType || file.type || "image",
        },
      }));
    } finally {
      setUploadingDocEvidence(false);
      event.target.value = "";
    }
  }

  async function submitDocModal() {
    const normalizedArea = docModal.area.trim();
    const payload = {
      ubicacion: docModal.ubicacion,
      area: normalizedArea,
      dirigidoA: docModal.dirigidoA.trim(),
      notas: docModal.notas.trim(),
      evidence: docModal.evidence,
    };
    if (!payload.area || !payload.dirigidoA || !payload.evidence?.url) return;

    const areaExists = customAreas.some((a) => a.toLowerCase() === normalizedArea.toLowerCase());
    if (!areaExists) {
      await addDocumentacionArea(normalizedArea);
    }

    if (docModal.mode === "create") {
      await createDocumentacionRecord(payload);
    } else {
      await updateDocumentacionRecord(docModal.recordId, payload);
    }
    setDocAreaMode(customAreas.length ? "select" : "new");
    setDocModal(createDocModalState());
  }

  function renderDocFileCell(record, field = "evidence") {
    const file = record?.[field];
    if (!file?.url) return <span className="subtle-line">—</span>;
    if (isImageEvidence(file)) {
      return (
        <button type="button" className="transport-evidence-thumb" onClick={() => setDocEvidenceViewer({ open: true, evidence: file, title: "Evidencia" })}>
          <img src={file.thumbnailUrl || file.url} alt={file.name || ""} />
        </button>
      );
    }
    return (
      <a href={file.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
        <FileText size={14} style={{ marginRight: "0.25rem" }} />{file.name || "Abrir"}
      </a>
    );
  }

  return (
    <section className="page-shell inventory-page-shell">
      <section className="inventory-stack">
        <article className="surface-card inventory-surface-card full-width">
          <div className="card-header-row" style={{ alignItems: "center" }}>
            <div>
              <h3>Control de Transporte</h3>
              <p>Captura diaria por área. Al cambiar de día, los registros pasan automáticamente al historial.</p>
            </div>
            <span className="chip">Día activo: {transportState?.activeDateKey || "-"}</span>
          </div>

          <div className="transport-main-groups">
            {areaTabOptions.length ? (
              <section className="transport-tab-section">
                <div className="transport-view-tabs transport-view-tabs-separated">
                  {areaTabOptions.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`transport-view-tab transport-main-tab ${selectedMainTab === tab.id ? "is-active" : ""}`}
                      onClick={() => setSelectedMainTab(tab.id)}
                      aria-label={tab.label}
                      title={tab.label}
                      style={{ "--transport-tab-accent": tab.accent, "--transport-tab-soft": tab.soft }}
                    >
                      <span className="transport-main-tab-icon" aria-hidden="true">{tab.icon}</span>
                      <span>{tab.shortLabel || tab.label}</span>
                      {Number(mainTabCountById[tab.id] || 0) > 0 ? (
                        <span className="transport-main-tab-count">{mainTabCountById[tab.id]}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {transportOnlyTabOptions.length ? (
              <section className="transport-tab-section transport-tab-section-ops">
                <div className="transport-view-tabs transport-view-tabs-separated">
                  {transportOnlyTabOptions.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`transport-view-tab transport-main-tab ${tab.id === "consolidado" ? "transport-main-tab-end" : ""} ${selectedMainTab === tab.id ? "is-active" : ""}`}
                      onClick={() => setSelectedMainTab(tab.id)}
                      aria-label={tab.label}
                      title={tab.label}
                      style={{ "--transport-tab-accent": tab.accent, "--transport-tab-soft": tab.soft }}
                    >
                      <span className="transport-main-tab-icon" aria-hidden="true">{tab.icon}</span>
                      <span>{tab.shortLabel || tab.label}</span>
                      {tab.id !== "consolidado" && Number(mainTabCountById[tab.id] || 0) > 0 ? (
                        <span className="transport-main-tab-count">{mainTabCountById[tab.id]}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* ── TRANSPORTE POR ÁREA ── */}
          {["area-retail", "area-pedidos", "area-inventario"].includes(selectedMainTab) ? (
            <>
              <div className="transport-view-tabs" style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedViewTab === "active" ? "is-active" : ""}`}
                  onClick={() => setSelectedViewTab("active")}
                >
                  Registros de hoy
                </button>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedViewTab === "history" ? "is-active" : ""}`}
                  onClick={() => setSelectedViewTab("history")}
                >
                  Historial
                </button>
              </div>


              {selectedAreaOptions.length > 1 ? (
                <div className="saved-board-list board-builder-launch-list" style={{ marginBottom: "0.8rem" }}>
                  {selectedAreaOptions.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className="chip"
                      onClick={() => setSelectedAreaId(area.id)}
                      style={{
                        border: area.id === selectedArea?.id ? "1px solid rgba(3,33,33,0.36)" : "1px solid rgba(162,170,181,0.25)",
                        background: area.id === selectedArea?.id ? "rgba(3,33,33,0.08)" : "#fff",
                        color: "#032121",
                        cursor: "pointer",
                      }}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="card-header-row" style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>{selectedArea?.label || "Area"}</h3>
                <button type="button" className="primary-button" onClick={openCreateModal} disabled={!canManageSelectedArea || !selectedArea}>Crear registro de envio</button>
              </div>

              <div className="table-wrap">
                <table className="inventory-table-clean">
                  <thead>
                    <tr>
                      {selectedViewTab === "history" ? <th>Fecha</th> : null}
                      <th>Destino</th>
                      <th>Cajas</th>
                      <th>Piezas</th>
                      <th>Estado</th>
                      <th>Creado por</th>
                      <th>Evidencia</th>
                      <th>{selectedViewTab === "history" ? "Ultima actualizacion" : "Capturado"}</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedViewTab === "history" ? historyRecords : activeRecords).map((record) => (
                      <tr key={record.id}>
                        {selectedViewTab === "history" ? <td>{record.dateKey || "-"}</td> : null}
                        <td>{record.destination}</td>
                        <td>{record.boxes}</td>
                        <td>{record.pieces}</td>
                        <td>{renderRouteStatusChip(record.status, resolveAssignedName(record))}</td>
                        <td>{record.createdByName || "-"}</td>
                        <td>{renderEvidenceCell(record)}</td>
                        <td>{formatDateTime(record.updatedAt || record.createdAt)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            <button type="button" className="icon-button" onClick={() => openEditModal(record)} disabled={!canManageSelectedArea}>Editar</button>
                            {selectedViewTab === "active" ? (
                              <button
                                type="button"
                                className="icon-button"
                                onClick={() => openPostponeModal(record)}
                                disabled={!canManageSelectedArea}
                              >
                                Posponer
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => openDeleteTransportModal(record)}
                              disabled={!canDeleteTransportRecord}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!(selectedViewTab === "history" ? historyRecords : activeRecords).length ? (
                      <tr>
                        <td colSpan={selectedViewTab === "history" ? 9 : 8} className="subtle-line">
                          {selectedViewTab === "history" ? "Sin historial para esta area." : "Sin registros capturados hoy para esta area."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {/* ── ASIGNACIONES ── */}
          {selectedMainTab === "asignaciones" ? (
            <TransportAssignmentsTab
              transportState={transportState}
              documentacionState={documentacionState}
              activeDateKey={transportState?.activeDateKey || ""}
              canManageTransportArea={canManageTransportArea}
              selectedArea={selectedArea}
              currentUser={contexto.currentUser}
              formatDateTime={formatDateTime}
              requestJson={contexto.requestJson}
              onRouteAssigned={() => {
                // Forzar recarga
                contexto.onRefresh?.();
              }}
            />
          ) : null}

          {selectedMainTab === "pospuestos" ? (
            <TransportPostponedTab
              transportState={transportState}
              canManageTransportArea={canManageTransportArea}
              canViewAllPostponed={canSeePostponedTab && !hasAnyTransportManageAccess}
              currentUser={contexto.currentUser}
              formatDateTime={formatDateTime}
              requestJson={contexto.requestJson}
              onChanged={() => {
                contexto.onRefresh?.();
              }}
            />
          ) : null}

          {/* ── MIS RUTAS ── */}
          {selectedMainTab === "mis-rutas" ? (
            <TransportMyRoutesTab
              transportState={transportState}
              documentacionState={documentacionState}
              currentUser={contexto.currentUser}
              formatDateTime={formatDateTime}
              requestJson={contexto.requestJson}
              onStatusUpdated={() => {
                // Forzar recarga
                contexto.onRefresh?.();
              }}
            />
          ) : null}

          {/* ── CONSOLIDADO ── */}
          {selectedMainTab === "consolidado" ? (
            <>
              <div className="card-header-row" style={{ marginBottom: "0.65rem", gap: "0.65rem", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>Consolidado general por área</h3>
                <div style={{ display: "inline-flex", alignItems: "flex-end", gap: "0.55rem", flexWrap: "nowrap" }}>
                  <label style={{ display: "inline-flex", flexDirection: "column", gap: "0.2rem", minWidth: "190px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#315753" }}>Player</span>
                    <select value={selectedConsolidatedPlayerId} onChange={(e) => setSelectedConsolidatedPlayerId(e.target.value)}>
                      <option value="all">Todos los players</option>
                      <option value="unassigned">Sin asignar</option>
                      {consolidatedPlayerOptions.map((player) => (
                        <option key={player.value} value={player.value}>{player.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="dashboard-filter-field dashboard-filter-field-range" style={{ minWidth: "320px" }}>
                    <span>Calendario y vista</span>
                    <DashboardDateRangePicker
                      startDate={selectedPrincipalDateFrom}
                      endDate={selectedPrincipalDateTo}
                      grouping={selectedCalendarGrouping}
                      onGroupingChange={setSelectedCalendarGrouping}
                      selectedYear={selectedPrincipalYear}
                      yearOptions={principalYearOptions}
                      onYearChange={setSelectedPrincipalYear}
                      onChange={({ startDate, endDate }) => {
                        const nextStart = startDate || selectedPrincipalDateFrom;
                        const nextEnd = endDate || startDate || selectedPrincipalDateTo || nextStart;
                        if (selectedCalendarGrouping !== "anio") {
                          setSelectedCalendarGrouping(inferCalendarGroupingFromRange(nextStart, nextEnd));
                        }
                        setSelectedPrincipalDate(nextStart);
                        setSelectedPrincipalDateFrom(nextStart);
                        setSelectedPrincipalDateTo(nextEnd);
                      }}
                    />
                  </label>
                </div>
              </div>

              <p className="subtle-line" style={{ marginBottom: "0.75rem" }}>
                Vista actual: {consolidatedRangeModel.rangeLabel}. Agrupación: {selectedCalendarGrouping === "semana" ? "por días" : selectedCalendarGrouping === "anio" ? "por meses" : "por semanas"}. Player: {selectedConsolidatedPlayerId === "all" ? "Todos" : selectedConsolidatedPlayerId === "unassigned" ? "Sin asignar" : consolidatedPlayerOptions.find((entry) => entry.value === selectedConsolidatedPlayerId)?.label || "Seleccionado"}. Columnas: S (salidas/folios), C (cajas), PZ (piezas). En DOCUMENTACIÓN, S representa cantidad de registros.
              </p>

              <section className="transport-consolidated-dashboard">
                <div className="transport-consolidated-kpi-grid">
                  <article className="transport-consolidated-kpi-card">
                    <span className="transport-consolidated-kpi-label">Salidas del periodo</span>
                    <strong>{consolidatedDashboard.totalSalidas}</strong>
                    <small>{consolidatedDashboard.topArea ? `Área líder: ${consolidatedDashboard.topArea.areaLabel}` : "Sin datos"}</small>
                  </article>
                  <article className="transport-consolidated-kpi-card">
                    <span className="transport-consolidated-kpi-label">Cajas del periodo</span>
                    <strong>{consolidatedDashboard.totalCajas}</strong>
                    <small>Promedio por salida: {consolidatedDashboard.totalSalidas > 0 ? (consolidatedDashboard.totalCajas / consolidatedDashboard.totalSalidas).toFixed(1) : "0.0"}</small>
                  </article>
                  <article className="transport-consolidated-kpi-card">
                    <span className="transport-consolidated-kpi-label">Piezas del periodo</span>
                    <strong>{consolidatedDashboard.totalPiezas}</strong>
                    <small>Promedio por salida: {consolidatedDashboard.totalSalidas > 0 ? (consolidatedDashboard.totalPiezas / consolidatedDashboard.totalSalidas).toFixed(1) : "0.0"}</small>
                  </article>
                  <article className="transport-consolidated-kpi-card">
                    <span className="transport-consolidated-kpi-label">Destinos activos</span>
                    <strong>{consolidatedDashboard.totalDestinos}</strong>
                    <small>{consolidatedDashboard.dominantWeek ? `Pico: ${consolidatedDashboard.dominantWeek.label}` : "Sin datos"}</small>
                  </article>
                </div>

                <div className="transport-consolidated-chart-grid">
                  <article className="transport-consolidated-chart-card">
                    <div className="transport-consolidated-chart-head">
                      <h4>Participación por área (S)</h4>
                    </div>
                    <div className="transport-consolidated-pie-layout">
                      <div className="transport-consolidated-pie-ring" style={{ background: consolidatedDashboard.pieGradient }} aria-label="Participación por área" />
                      <div className="transport-consolidated-legend">
                        {consolidatedDashboard.areaPie.map((item) => (
                          <div key={`pie-${item.areaId}`} className="transport-consolidated-legend-item">
                            <span className="transport-consolidated-legend-dot" style={{ background: item.color }} />
                            <span className="transport-consolidated-legend-label">{item.areaLabel}</span>
                            <strong>{item.percent.toFixed(1)}%</strong>
                          </div>
                        ))}
                        {!consolidatedDashboard.areaPie.length ? <span className="subtle-line">Sin datos para graficar.</span> : null}
                      </div>
                    </div>
                  </article>

                  <article className="transport-consolidated-chart-card">
                    <div className="transport-consolidated-chart-head">
                      <h4>Gráfica de línea por {consolidatedRangeModel.unitLabel} (S)</h4>
                    </div>
                    <div className="transport-consolidated-line-chart-wrap">
                      {consolidatedDashboard.lineSeries.length ? (
                        <>
                          <svg className="transport-consolidated-line-chart" viewBox="0 0 620 210" role="img" aria-label="Gráfica de línea semanal de salidas">
                            <line x1="40" y1="170" x2="600" y2="170" stroke="rgba(3, 33, 33, 0.22)" strokeWidth="1" />
                            <line x1="40" y1="26" x2="40" y2="170" stroke="rgba(3, 33, 33, 0.22)" strokeWidth="1" />
                            <polyline
                              points={consolidatedDashboard.linePath}
                              fill="none"
                              stroke="#0f766e"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {consolidatedDashboard.lineSeries.map((point) => (
                              <g key={`line-point-${point.label}`}>
                                <circle cx={point.x} cy={point.y} r="4.4" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
                                <text x={point.x} y={point.y - 10} textAnchor="middle" className="transport-consolidated-line-value">{point.salidas}</text>
                                <text x={point.x} y="190" textAnchor="middle" className="transport-consolidated-line-label">{point.shortLabel}</text>
                              </g>
                            ))}
                          </svg>
                          <span className="subtle-line">Tendencia de salidas por {consolidatedRangeModel.unitLabel} en el periodo seleccionado.</span>
                        </>
                      ) : (
                        <span className="subtle-line">Sin datos para graficar.</span>
                      )}
                    </div>
                  </article>
                </div>

                <div className="transport-consolidated-bar-ranking-grid">
                  <article className="transport-consolidated-chart-card transport-consolidated-chart-card--compact-bars">
                    <div className="transport-consolidated-chart-head">
                      <h4>Gráfica de barras por área (S)</h4>
                    </div>
                    <div className="transport-consolidated-columns-wrap">
                      {consolidatedDashboard.areaBarSeries.length ? (
                        consolidatedDashboard.areaBarSeries.map((area) => (
                          <div key={`bar-${area.areaId}`} className="transport-consolidated-column-item">
                            <div className="transport-consolidated-column-track">
                              <span className="transport-consolidated-column-fill" style={{ height: `${Math.max(6, Math.round(area.ratio * 100))}%` }} />
                            </div>
                            <strong className="transport-consolidated-column-value">{area.salidas}</strong>
                            <span className="transport-consolidated-column-label" title={area.areaLabel}>{area.shortLabel}</span>
                          </div>
                        ))
                      ) : (
                        <span className="subtle-line">Sin datos para graficar.</span>
                      )}
                    </div>
                  </article>

                  <article className="transport-consolidated-chart-card">
                    <div className="transport-consolidated-chart-head">
                      <h4>Ranking de players de Transporte</h4>
                    </div>

                    <div className="transport-player-ranking-list">
                      {transportPlayersRanking.rows.length ? (
                        transportPlayersRanking.rows.map((player, index) => {
                          const ratio = Math.max(5, Math.round((player.salidas / transportPlayersRanking.maxSalidas) * 100));
                          return (
                            <div key={`player-rank-${player.key}`} className="transport-player-ranking-item">
                              <div className="transport-player-ranking-head">
                                <strong>{index + 1}. {player.playerName}</strong>
                                <span>S: {player.salidas} | C: {player.cajas} | PZ: {player.piezas}</span>
                              </div>
                              <div className="transport-player-ranking-track">
                                <span className="transport-player-ranking-fill" style={{ width: `${ratio}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="subtle-line">No hay registros asignados en este periodo.</span>
                      )}
                    </div>
                  </article>
                </div>
              </section>

              {principalSummary.areas.map((area) => (
                <div key={area.areaId} style={{ marginBottom: "1rem", border: "1px solid rgba(34, 139, 84, 0.28)", borderRadius: "1rem", overflow: "hidden" }}>
                  <div style={{ padding: "0.55rem 0.8rem", background: "rgba(74, 222, 128, 0.18)", fontWeight: 700, color: "#0b5d46" }}>
                    {area.areaLabel}
                  </div>
                  <div className="table-wrap" style={{ margin: 0 }}>
                    <table className="inventory-table-clean">
                      <thead>
                        <tr>
                          <th rowSpan={2}>Destino</th>
                          {principalSummary.weeks.map((week) => (
                            <th key={`${area.areaId}-${week.key || week.label}`} colSpan={3}>{week.shortLabel || week.label}</th>
                          ))}
                          <th colSpan={3}>Total periodo</th>
                        </tr>
                        <tr>
                          {principalSummary.weeks.flatMap((week) => ([
                            <th key={`${area.areaId}-${week.key || week.label}-s`}>S</th>,
                            <th key={`${area.areaId}-${week.key || week.label}-c`}>C</th>,
                            <th key={`${area.areaId}-${week.key || week.label}-p`}>PZ</th>,
                          ]))}
                          <th>S</th>
                          <th>C</th>
                          <th>PZ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {area.rows.map((row) => (
                          <tr key={`${area.areaId}-${row.destination}`}>
                            <td>{row.destination}</td>
                            {row.weekly.flatMap((weekTotals, index) => ([
                              <td key={`${area.areaId}-${row.destination}-${index}-s`}>{weekTotals.salidas}</td>,
                              <td key={`${area.areaId}-${row.destination}-${index}-c`}>{weekTotals.cajas}</td>,
                              <td key={`${area.areaId}-${row.destination}-${index}-p`}>{weekTotals.piezas}</td>,
                            ]))}
                            <td>{row.totals.salidas}</td>
                            <td>{row.totals.cajas}</td>
                            <td>{row.totals.piezas}</td>
                          </tr>
                        ))}
                        {!area.rows.length ? (
                          <tr>
                            <td colSpan={1 + principalSummary.weeks.length * 3 + 3} className="subtle-line">Sin movimientos en este periodo para esta área.</td>
                          </tr>
                        ) : null}
                        <tr style={{ background: "rgba(74, 222, 128, 0.14)", fontWeight: 700 }}>
                          <td>Total área</td>
                          {area.weeklyTotals.flatMap((weekTotals, index) => ([
                            <td key={`${area.areaId}-total-${index}-s`}>{weekTotals.salidas}</td>,
                            <td key={`${area.areaId}-total-${index}-c`}>{weekTotals.cajas}</td>,
                            <td key={`${area.areaId}-total-${index}-p`}>{weekTotals.piezas}</td>,
                          ]))}
                          <td>{area.totals.salidas}</td>
                          <td>{area.totals.cajas}</td>
                          <td>{area.totals.piezas}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div style={{ border: "1px solid rgba(34, 139, 84, 0.34)", borderRadius: "1rem", padding: "0.7rem 0.9rem", background: "rgba(74, 222, 128, 0.16)" }}>
                <strong style={{ color: "#0b5d46", fontSize: "0.85rem" }}>Total general del período</strong>
                <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.8rem", flexWrap: "wrap", fontSize: "0.82rem" }}>
                  <span><strong>S:</strong> {principalSummary.grandTotals.salidas}</span>
                  <span><strong>C:</strong> {principalSummary.grandTotals.cajas}</span>
                  <span><strong>PZ:</strong> {principalSummary.grandTotals.piezas}</span>
                </div>
              </div>
            </>
          ) : null}

          {/* ── DOCUMENTACIÓN TAB ── */}
          {selectedMainTab === "documentacion" ? (
            <>
              {/* Filters + action */}
              <div className="card-header-row" style={{ marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <select value={docFilterUbicacion} onChange={(e) => setDocFilterUbicacion(e.target.value)} style={{ minWidth: "120px" }}>
                    <option value="ALL">Todas las ubicaciones</option>
                    <option value="SONATA">SONATA</option>
                    <option value="CEDIS">CEDIS</option>
                  </select>
                  <select value={docFilterArea} onChange={(e) => setDocFilterArea(e.target.value)} style={{ minWidth: "120px" }}>
                    <option value="ALL">Todas las áreas</option>
                    {customAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <button type="button" className="primary-button" onClick={openCreateDocModal} disabled={!canManageDocumentacionTab}>
                  + Registro de envío
                </button>
              </div>

              <div className="transport-view-tabs" style={{ marginBottom: "0.8rem" }}>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedDocViewTab === "active" ? "is-active" : ""}`}
                  onClick={() => setSelectedDocViewTab("active")}
                >
                  Registros de hoy
                </button>
                <button
                  type="button"
                  className={`transport-view-tab ${selectedDocViewTab === "history" ? "is-active" : ""}`}
                  onClick={() => setSelectedDocViewTab("history")}
                >
                  Historial
                </button>
              </div>

              {/* Table */}
              <div className="table-wrap">
                <table className="inventory-table-clean">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ubicación</th>
                      <th>Área</th>
                      <th>Dirigido a</th>
                      <th>Estado</th>
                      <th>Evidencia</th>
                      <th>Notas</th>
                      <th>Registrado por</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDocViewTab === "history" ? docHistoryRecords : docActiveRecords).map((record) => (
                      <tr key={record.id}>
                        <td>{record.dateKey || "-"}</td>
                        <td><span className="chip" style={{ fontSize: "0.75rem" }}>{record.ubicacion}</span></td>
                        <td>{record.area}</td>
                        <td>{record.dirigidoA}</td>
                        <td>{renderRouteStatusChip(record.status, resolveAssignedName(record))}</td>
                        <td>{renderDocFileCell(record, "evidence")}</td>
                        <td style={{ maxWidth: "160px", whiteSpace: "normal", fontSize: "0.78rem" }}>{record.notas || "—"}</td>
                        <td style={{ fontSize: "0.78rem" }}>{record.createdByName || "—"}</td>
                        <td>
                          <button type="button" className="icon-button" onClick={() => openEditDocModal(record)} disabled={!canManageDocumentacionTab}>Editar</button>
                        </td>
                      </tr>
                    ))}
                    {!(selectedDocViewTab === "history" ? docHistoryRecords : docActiveRecords).length ? (
                      <tr>
                        <td colSpan={9} className="subtle-line">
                          {selectedDocViewTab === "history" ? "Sin historial en documentación." : "Sin registros de documentación para hoy."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </article>
      </section>

      <Modal
        className="transport-record-modal"
        open={transportModal.open}
        title={transportModal.mode === "create" ? "Agregar registro de envio" : "Editar registro de envio"}
        confirmLabel={transportModal.mode === "create" ? "Guardar registro" : "Guardar cambios"}
        cancelLabel="Cancelar"
        onClose={() => {
          setTransportModalError("");
          setTransportModal(createTransportModalState(selectedArea?.id || ""));
        }}
        onConfirm={submitTransportModal}
      >
        <div className="modal-form-grid transport-record-grid">
          {transportModalError ? (
            <div
              className="transport-field-full"
              style={{
                background: "#ffebee",
                border: "1px solid #ff8a80",
                color: "#c62828",
                borderRadius: "0.75rem",
                padding: "0.65rem 0.8rem",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {transportModalError}
            </div>
          ) : null}

          <div className="transport-field-full transport-inline-top-row">
            <div className="app-modal-field transport-inline-area">
              <span>Area</span>
              <div className="transport-readonly-field">{selectedArea?.label || "Area"}</div>
            </div>

            <label className="app-modal-field transport-inline-boxes">
              <span>Cajas a mandar</span>
              <input
                type="number"
                min="0"
                value={transportModal.boxes}
                onChange={(event) => setTransportModal((current) => ({ ...current, boxes: event.target.value }))}
                placeholder="0"
              />
            </label>

            <label className="app-modal-field transport-inline-pieces">
              <span>Piezas a mandar</span>
              <input
                type="number"
                min="0"
                value={transportModal.pieces}
                onChange={(event) => setTransportModal((current) => ({ ...current, pieces: event.target.value }))}
                placeholder="0"
              />
            </label>
          </div>

          {transportModal.mode === "create" ? (
            <div className="transport-field-full transport-destination-schedule-row">
              <label className="app-modal-field transport-destination-field">
                <span>Destino</span>
                <select
                  value={transportModal.destination}
                  onChange={(event) => setTransportModal((current) => ({ ...current, destination: event.target.value }))}
                >
                  {(areaConfig.find((area) => area.id === transportModal.areaId)?.destinations || []).map((destination) => (
                    <option key={destination} value={destination}>{destination}</option>
                  ))}
                </select>
              </label>

              <div className="transport-schedule-row" role="group" aria-label="Programación de envío">
                <div className="transport-schedule-row-copy">
                  <strong>Programar envío</strong>
                  <span>Activa para definir fecha, hora y recordatorio.</span>
                </div>
                <button
                  type="button"
                  className={`switch-button transport-schedule-switch ${transportModal.isScheduled ? "on" : ""}`.trim()}
                  role="switch"
                  aria-checked={Boolean(transportModal.isScheduled)}
                  aria-label="Programar envío"
                  onClick={() => setTransportModal((current) => ({ ...current, isScheduled: !current.isScheduled }))}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          ) : (
            <label className="app-modal-field transport-field-span-2">
              <span>Destino</span>
              <select
                value={transportModal.destination}
                onChange={(event) => setTransportModal((current) => ({ ...current, destination: event.target.value }))}
              >
                {(areaConfig.find((area) => area.id === transportModal.areaId)?.destinations || []).map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </label>
          )}

          <label className="app-modal-field transport-field-full">
            <span>Notas</span>
            <textarea
              value={transportModal.notes}
              onChange={(event) => setTransportModal((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Detalle opcional del envio"
              rows={2}
            />
          </label>

          {transportModal.mode === "create" ? (
            <>
              {transportModal.isScheduled ? (
                <div className="transport-field-full transport-schedule-panel">
                  <label className="app-modal-field">
                    <span>Fecha programada</span>
                    <input
                      type="date"
                      value={transportModal.scheduledDate}
                      onChange={(event) => setTransportModal((current) => ({ ...current, scheduledDate: event.target.value }))}
                    />
                  </label>

                  <label className="app-modal-field">
                    <span>Hora programada</span>
                    <input
                      type="time"
                      value={transportModal.scheduledTime}
                      onChange={(event) => setTransportModal((current) => ({ ...current, scheduledTime: event.target.value }))}
                    />
                  </label>

                  <label className="app-modal-field">
                    <span>Recordatorio (min)</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={transportModal.remindBeforeMinutes}
                      onChange={(event) => setTransportModal((current) => ({ ...current, remindBeforeMinutes: event.target.value }))}
                      placeholder="60"
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="app-modal-field transport-field-full">
            <span>Evidencia <span style={{ color: "#b05050" }}>*</span></span>
            <div className="transport-upload-actions">
              <button type="button" className="icon-button sm-button" onClick={() => cameraInputRef.current?.click()} disabled={uploadingEvidence}>
                {uploadingEvidence ? "Subiendo evidencia..." : "Tomar foto"}
              </button>
              <button type="button" className="icon-button sm-button" onClick={() => fileInputRef.current?.click()} disabled={uploadingEvidence}>
                {uploadingEvidence ? "Subiendo evidencia..." : "Subir desde dispositivo"}
              </button>
              {transportModal.evidence?.url ? (
                <button type="button" className="transport-upload-preview" onClick={() => openEvidenceViewer({ destination: transportModal.destination, evidence: transportModal.evidence })}>
                  {isImageEvidence(transportModal.evidence) ? (
                    <img src={transportModal.evidence.thumbnailUrl || transportModal.evidence.url} alt={transportModal.evidence.name || "Evidencia subida"} />
                  ) : isVideoEvidence(transportModal.evidence) ? (
                    <video src={transportModal.evidence.url} poster={transportModal.evidence.thumbnailUrl || undefined} muted playsInline preload="metadata" />
                  ) : (
                    <span>{transportModal.evidence.name || "Archivo cargado"}</span>
                  )}
                </button>
              ) : (
                <span className="subtle-line">Debes adjuntar una evidencia para guardar.</span>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleUploadEvidence}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf"
              style={{ display: "none" }}
              onChange={handleUploadEvidence}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={postponeModal.open}
        title={`Posponer envío: ${postponeModal.destination || "Destino"}`}
        confirmLabel="Guardar pospuesto"
        cancelLabel="Cancelar"
        onClose={() => setPostponeModal(createPostponeModalState())}
        onConfirm={submitPostponeModal}
      >
        <div className="modal-form-grid">
          <label className="app-modal-field">
            <span>Fecha nueva de entrega</span>
            <input
              type="date"
              value={postponeModal.postponedDate}
              onChange={(event) => setPostponeModal((prev) => ({ ...prev, postponedDate: event.target.value }))}
            />
          </label>
          <label className="app-modal-field">
            <span>Hora nueva de entrega</span>
            <input
              type="time"
              value={postponeModal.postponedTime}
              onChange={(event) => setPostponeModal((prev) => ({ ...prev, postponedTime: event.target.value }))}
            />
          </label>
          <label className="app-modal-field transport-field-full">
            <span>Recordar con anticipación (minutos)</span>
            <input
              type="number"
              min="0"
              step="5"
              value={postponeModal.remindBeforeMinutes}
              onChange={(event) => setPostponeModal((prev) => ({ ...prev, remindBeforeMinutes: event.target.value }))}
              placeholder="60"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={deleteTransportModal.open}
        title={`Eliminar envío: ${deleteTransportModal.destination || "Destino"}`}
        confirmLabel={deleteTransportModal.submitting ? "Eliminando..." : "Eliminar"}
        cancelLabel="Cancelar"
        onClose={() => setDeleteTransportModal(createDeleteTransportModalState())}
        onConfirm={submitDeleteTransportModal}
      >
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <p className="subtle-line" style={{ margin: 0 }}>
            Esta acción eliminará el registro de forma permanente.
          </p>
          {deleteTransportModal.error ? (
            <div
              role="alert"
              style={{
                background: "rgba(176, 80, 80, 0.12)",
                color: "#7d1e1e",
                border: "1px solid rgba(176, 80, 80, 0.25)",
                borderRadius: "0.75rem",
                padding: "0.55rem 0.65rem",
                fontSize: "0.84rem",
                fontWeight: 600,
              }}
            >
              {deleteTransportModal.error}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        className="modal-wide transport-evidence-viewer-modal"
        open={evidenceViewer.open}
        title={evidenceViewer.title || "Vista previa de evidencia"}
        confirmLabel="Cerrar"
        hideCancel
        onClose={closeEvidenceViewer}
      >
        <div className="transport-evidence-viewer-body">
          {isImageEvidence(evidenceViewer.evidence) ? (
            <img src={evidenceViewer.evidence?.url} alt={evidenceViewer.evidence?.name || evidenceViewer.title || "Evidencia"} className="transport-evidence-viewer-media" />
          ) : isVideoEvidence(evidenceViewer.evidence) ? (
            <video src={evidenceViewer.evidence?.url} poster={evidenceViewer.evidence?.thumbnailUrl || undefined} className="transport-evidence-viewer-media" controls autoPlay />
          ) : (
            <a href={evidenceViewer.evidence?.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
              {evidenceViewer.evidence?.name || "Abrir archivo"}
            </a>
          )}
        </div>
      </Modal>

      {/* ── Documentación: Create/Edit Modal ── */}
      <Modal
        className="transport-record-modal"
        open={docModal.open}
        title={docModal.mode === "create" ? "Nuevo registro de documentación" : "Editar registro de documentación"}
        confirmLabel={docModal.mode === "create" ? "Guardar registro" : "Guardar cambios"}
        cancelLabel="Cancelar"
                onClose={() => {
                  setDocModal(createDocModalState());
                  setDocAreaMode(customAreas.length ? "select" : "new");
                }}
        onConfirm={submitDocModal}
      >
        <div className="modal-form-grid transport-record-grid">
          <div className="transport-field-full doc-three-inputs-row">
            {/* Ubicación */}
            <label className="app-modal-field">
              <span>Ubicación</span>
              <select
                value={docModal.ubicacion}
                onChange={(e) => setDocModal((prev) => ({ ...prev, ubicacion: e.target.value }))}
              >
                <option value="SONATA">SONATA</option>
                <option value="CEDIS">CEDIS</option>
              </select>
            </label>

            {/* Área */}
            <label className="app-modal-field">
              <span>Área</span>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                {docAreaMode === "select" && customAreas.length > 0 ? (
                  <select
                    value={docModal.area}
                    onChange={(e) => setDocModal((prev) => ({ ...prev, area: e.target.value }))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Seleccionar área...</option>
                    {customAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={docModal.area}
                    onChange={(e) => setDocModal((prev) => ({ ...prev, area: e.target.value }))}
                    placeholder="Escribe el área"
                    style={{ flex: 1 }}
                  />
                )}
                <button
                  type="button"
                  className="icon-button sm-button"
                  onClick={() => {
                    if (docAreaMode === "select") {
                      setDocAreaMode("new");
                      setDocModal((prev) => ({ ...prev, area: "" }));
                    } else {
                      setDocAreaMode("select");
                      setDocModal((prev) => ({ ...prev, area: customAreas[0] || prev.area }));
                    }
                  }}
                  title={docAreaMode === "select" ? "Agregar nueva área" : "Elegir del menú"}
                  aria-label={docAreaMode === "select" ? "Agregar nueva área" : "Elegir del menú"}
                >
                  <Plus size={13} />
                </button>
              </div>
            </label>

            {/* Dirigido a */}
            <label className="app-modal-field">
              <span>Dirigido a</span>
              <input
                type="text"
                value={docModal.dirigidoA}
                onChange={(e) => setDocModal((prev) => ({ ...prev, dirigidoA: e.target.value }))}
                placeholder="Nombre del destinatario"
              />
            </label>
          </div>

          {/* Notas */}
          <label className="app-modal-field transport-field-full">
            <span>Notas</span>
            <textarea
              value={docModal.notas}
              onChange={(e) => setDocModal((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Descripción del documento o paquete (opcional)"
              rows={2}
            />
          </label>

          {/* Evidencia */}
          <div className="app-modal-field transport-field-full">
            <span>Evidencia <span style={{ color: "#b05050" }}>*</span></span>
            <div className="transport-upload-actions">
              <button type="button" className="icon-button sm-button" onClick={() => docEvidenceCameraRef.current?.click()} disabled={uploadingDocEvidence}>
                {uploadingDocEvidence ? "Subiendo..." : "Tomar foto"}
              </button>
              <button type="button" className="icon-button sm-button" onClick={() => docEvidenceInputRef.current?.click()} disabled={uploadingDocEvidence}>
                {uploadingDocEvidence ? "Subiendo..." : "Subir archivo"}
              </button>
              {docModal.evidence?.url ? (
                <button type="button" className="transport-upload-preview" onClick={() => setDocEvidenceViewer({ open: true, evidence: docModal.evidence, title: "Evidencia" })}>
                  {isImageEvidence(docModal.evidence) ? (
                    <img src={docModal.evidence.thumbnailUrl || docModal.evidence.url} alt={docModal.evidence.name || "Evidencia"} />
                  ) : (
                    <span>{docModal.evidence.name || "Archivo cargado"}</span>
                  )}
                </button>
              ) : (
                <span className="subtle-line">Debes adjuntar una evidencia para guardar.</span>
              )}
            </div>
            <input ref={docEvidenceCameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleUploadDocEvidence} />
            <input ref={docEvidenceInputRef} type="file" accept="image/*,video/*,.pdf" style={{ display: "none" }} onChange={handleUploadDocEvidence} />
          </div>
        </div>
      </Modal>

      {/* ── Documentación: evidence viewer ── */}
      <Modal
        className="modal-wide transport-evidence-viewer-modal"
        open={docEvidenceViewer.open}
        title={docEvidenceViewer.title || "Vista previa"}
        confirmLabel="Cerrar"
        hideCancel
        onClose={() => setDocEvidenceViewer({ open: false, evidence: null, title: "" })}
      >
        <div className="transport-evidence-viewer-body">
          {isImageEvidence(docEvidenceViewer.evidence) ? (
            <img src={docEvidenceViewer.evidence?.url} alt={docEvidenceViewer.evidence?.name || "Evidencia"} className="transport-evidence-viewer-media" />
          ) : isVideoEvidence(docEvidenceViewer.evidence) ? (
            <video src={docEvidenceViewer.evidence?.url} poster={docEvidenceViewer.evidence?.thumbnailUrl || undefined} className="transport-evidence-viewer-media" controls autoPlay />
          ) : (
            <a href={docEvidenceViewer.evidence?.url} target="_blank" rel="noreferrer" className="transport-evidence-file-link">
              {docEvidenceViewer.evidence?.name || "Abrir archivo"}
            </a>
          )}
        </div>
      </Modal>
    </section>
  );
}
