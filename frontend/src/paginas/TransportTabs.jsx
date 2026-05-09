import { useEffect, useMemo, useState } from "react";

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

/**
 * Tab Asignaciones - muestra envíos pendientes por área con botón "Tomar ruta"
 */
export function TransportAssignmentsTab({
  transportState,
  documentacionState,
  activeDateKey,
  canManageTransportArea,
  selectedArea,
  currentUser,
  formatDateTime,
  requestJson,
  onRouteAssigned,
}) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNowMs(Date.now()), 10000);
    return () => globalThis.clearInterval(timer);
  }, []);

  // Filtrar registros Pendiente del área seleccionada
  const pendingRecords = useMemo(() => {
    const allAreaIds = (Array.isArray(transportState?.config) ? transportState.config : [])
      .map((area) => area.id)
      .filter(Boolean);

    const manageableAreaIds = allAreaIds.filter((areaId) => canManageTransportArea?.(areaId));

    const allowedAreaIds = new Set(
      manageableAreaIds.length
        ? manageableAreaIds
        : allAreaIds
    );

    const areaLabelById = new Map(
      (Array.isArray(transportState?.config) ? transportState.config : [])
        .map((area) => [area.id, area.label || area.id])
    );

    return (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => {
        const isPending = String(record?.status || "").trim() === "Pendiente";
        const isReadyPostponed = isPostponedReady(record, nowMs);
        if (!isPending && !isReadyPostponed) return false;
        return allowedAreaIds.size ? allowedAreaIds.has(record.areaId) : true;
      })
      .map((record) => ({
        ...record,
        areaLabel: areaLabelById.get(record.areaId) || record.areaId || "-",
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [canManageTransportArea, nowMs, selectedArea?.id, transportState?.activeRecords, transportState?.config]);

  const pendingDocRecords = useMemo(() => {
    const dateKey = String(activeDateKey || "").trim();
    const records = Array.isArray(documentacionState?.records) ? documentacionState.records : [];
    if (!dateKey) return [];
    return records
      .filter((record) => String(record?.dateKey || "").trim() === dateKey)
      .filter((record) => String(record?.status || "Pendiente").trim() === "Pendiente")
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [activeDateKey, documentacionState?.records]);

  const handleTakeRoute = async (recordId) => {
    if (!currentUser?.id) {
      setAssignError("Usuario no identificado");
      return;
    }

    setIsAssigning(true);
    setAssignError("");

    try {
      const result = await requestJson(`/warehouse/transport/records/${recordId}/assign`, {
        method: "POST",
        body: JSON.stringify({ driverId: currentUser.id }),
      });

      if (result.ok) {
        onRouteAssigned?.();
      } else {
        setAssignError("No fue posible asignar la ruta");
      }
    } catch (error) {
      setAssignError(error?.message || "Error asignando ruta");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTakeDocRoute = async (recordId) => {
    if (!currentUser?.id) {
      setAssignError("Usuario no identificado");
      return;
    }

    setIsAssigning(true);
    setAssignError("");

    try {
      const result = await requestJson(`/warehouse/documentacion/records/${recordId}/assign`, {
        method: "POST",
        body: JSON.stringify({ driverId: currentUser.id }),
      });

      if (result.ok) {
        onRouteAssigned?.();
      } else {
        setAssignError("No fue posible asignar la ruta de documentación");
      }
    } catch (error) {
      setAssignError(error?.message || "Error asignando documentación");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Envíos Pendientes de Asignar</h3>
        <span className="chip" style={{ background: "#e3f2fd", color: "#1976d2" }}>
          {pendingRecords.length} pendiente{pendingRecords.length !== 1 ? "s" : ""}
        </span>
      </div>

      {assignError && (
        <div style={{
          padding: "0.75rem",
          background: "#ffebee",
          border: "1px solid #ff5252",
          borderRadius: "0.5rem",
          color: "#d32f2f",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
        }}>
          {assignError}
        </div>
      )}

      <div className="table-wrap">
        <table className="inventory-table-clean">
          <thead>
            <tr>
              <th>Área</th>
              <th>Destino</th>
              <th>Cajas</th>
              <th>Piezas</th>
              <th>Fecha programada</th>
              <th>Notas</th>
              <th>Capturado por</th>
              <th>Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.areaLabel}</td>
                <td>{record.destination}</td>
                <td>{record.boxes}</td>
                <td>{record.pieces}</td>
                <td>{record.postponedUntil ? formatDateTime(record.postponedUntil) : "-"}</td>
                <td style={{ fontSize: "0.85rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {record.notes || "-"}
                </td>
                <td>{record.createdByName}</td>
                <td>{formatDateTime(record.createdAt)}</td>
                <td>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleTakeRoute(record.id)}
                    disabled={isAssigning}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  >
                    {isAssigning ? "Asignando..." : "Tomar ruta"}
                  </button>
                </td>
              </tr>
            ))}
            {!pendingRecords.length && (
              <tr>
                <td colSpan="9" className="subtle-line">
                  No hay envíos pendientes para asignar en esta área.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-header-row" style={{ marginBottom: "0.5rem", marginTop: "1rem" }}>
        <h3 style={{ margin: 0 }}>Documentación pendiente por trasladar</h3>
        <span className="chip" style={{ background: "#fff3cd", color: "#856404" }}>
          {pendingDocRecords.length} pendiente{pendingDocRecords.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-wrap">
        <table className="inventory-table-clean">
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Área</th>
              <th>Dirigido a</th>
              <th>Registrado por</th>
              <th>Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pendingDocRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.ubicacion || "-"}</td>
                <td>{record.area || "-"}</td>
                <td>{record.dirigidoA || "-"}</td>
                <td>{record.createdByName || "-"}</td>
                <td>{formatDateTime(record.createdAt || record.updatedAt)}</td>
                <td>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleTakeDocRoute(record.id)}
                    disabled={isAssigning}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  >
                    {isAssigning ? "Asignando..." : "Tomar ruta"}
                  </button>
                </td>
              </tr>
            ))}
            {!pendingDocRecords.length && (
              <tr>
                <td colSpan="6" className="subtle-line">
                  No hay registros de documentación pendientes para el día activo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TransportPostponedTab({
  transportState,
  canManageTransportArea,
  canViewAllPostponed,
  currentUser,
  formatDateTime,
  requestJson,
  onChanged,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNowMs(Date.now()), 10000);
    return () => globalThis.clearInterval(timer);
  }, []);

  const postponedRecords = useMemo(() => {
    const areaLabelById = new Map(
      (Array.isArray(transportState?.config) ? transportState.config : [])
        .map((area) => [area.id, area.label || area.id])
    );

    return (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => String(record?.status || "").trim() === "Pospuesto")
      .filter((record) => !isPostponedReady(record, nowMs))
      .filter((record) => canViewAllPostponed || canManageTransportArea?.(record.areaId))
      .map((record) => ({
        ...record,
        areaLabel: areaLabelById.get(record.areaId) || record.areaId || "-",
      }))
      .sort((a, b) => new Date(a.postponedUntil || a.updatedAt || 0) - new Date(b.postponedUntil || b.updatedAt || 0));
  }, [canManageTransportArea, canViewAllPostponed, nowMs, transportState?.activeRecords, transportState?.config]);

  const handleReactivate = async (recordId) => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await requestJson(`/warehouse/transport/records/${recordId}/reactivate`, {
        method: "POST",
      });
      if (!result.ok) {
        setError(result?.message || "No fue posible reactivar el envío.");
        return;
      }
      onChanged?.();
    } catch (requestError) {
      setError(requestError?.message || "Error reactivando envío.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeRoute = async (recordId) => {
    if (!currentUser?.id) {
      setError("Usuario no identificado");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await requestJson(`/warehouse/transport/records/${recordId}/assign`, {
        method: "POST",
        body: JSON.stringify({ driverId: currentUser.id }),
      });
      if (!result.ok) {
        setError(result?.message || "No fue posible tomar la ruta.");
        return;
      }
      onChanged?.();
    } catch (requestError) {
      setError(requestError?.message || "Error asignando ruta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Envíos Pospuestos y Programados</h3>
        <span className="chip" style={{ background: "#fff3cd", color: "#856404" }}>
          {postponedRecords.length} pospuesto{postponedRecords.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error ? (
        <div style={{
          padding: "0.75rem",
          background: "#ffebee",
          border: "1px solid #ff5252",
          borderRadius: "0.5rem",
          color: "#d32f2f",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
        }}>
          {error}
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="inventory-table-clean">
          <thead>
            <tr>
              <th>Área</th>
              <th>Destino</th>
              <th>Cajas</th>
              <th>Piezas</th>
              <th>Fecha programada</th>
              <th>Recordar</th>
              <th>Capturado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {postponedRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.areaLabel}</td>
                <td>{record.destination}</td>
                <td>{record.boxes}</td>
                <td>{record.pieces}</td>
                <td>{formatDateTime(record.postponedUntil || record.updatedAt)}</td>
                <td>{Math.max(0, Number(record.postponedReminderMinutes || 0))} min antes</td>
                <td>{record.createdByName || "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleReactivate(record.id)}
                      disabled={isSubmitting}
                    >
                      Marcar pendiente
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleTakeRoute(record.id)}
                      disabled={isSubmitting}
                      style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                    >
                      Tomar ruta
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!postponedRecords.length ? (
              <tr>
                <td colSpan="8" className="subtle-line">
                  No hay envíos pospuestos por gestionar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Tab Mis Rutas - muestra rutas asignadas al driver actual
 */
export function TransportMyRoutesTab({ transportState, documentacionState, currentUser, formatDateTime, requestJson, onStatusUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [routesViewTab, setRoutesViewTab] = useState("active");
  const [reasonState, setReasonState] = useState({
    open: false,
    routeType: "",
    recordId: "",
    destination: "",
    nextStatus: "",
    reason: "",
  });

  const terminalStatuses = useMemo(() => new Set(["Entregado", "Devuelto", "Cancelado"]), []);

  const activeTransportRecords = useMemo(() => {
    return (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => record.assignedTo === currentUser?.id && !terminalStatuses.has(String(record.status || "")))
      .sort((a, b) => {
        const statusOrder = ["Pendiente", "Asignado", "En camino", "Retorno", "Entregado", "Devuelto", "Cancelado"];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      });
  }, [currentUser?.id, terminalStatuses, transportState?.activeRecords]);

  const activeDocRecords = useMemo(() => {
    return (Array.isArray(documentacionState?.records) ? documentacionState.records : [])
      .filter((record) => record.assignedTo === currentUser?.id && !terminalStatuses.has(String(record.status || "")))
      .sort((a, b) => {
        const statusOrder = ["Pendiente", "Asignado", "En camino", "Retorno", "Entregado", "Devuelto", "Cancelado"];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      });
  }, [currentUser?.id, documentacionState?.records, terminalStatuses]);

  const historyTransportRecords = useMemo(() => {
    const fromHistory = Array.isArray(transportState?.historyRecords) ? transportState.historyRecords : [];
    const fromActiveTerminal = (Array.isArray(transportState?.activeRecords) ? transportState.activeRecords : [])
      .filter((record) => terminalStatuses.has(String(record.status || "")));
    return [...fromHistory, ...fromActiveTerminal]
      .filter((record) => record.assignedTo === currentUser?.id)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [currentUser?.id, terminalStatuses, transportState?.activeRecords, transportState?.historyRecords]);

  const historyDocRecords = useMemo(() => {
    return (Array.isArray(documentacionState?.records) ? documentacionState.records : [])
      .filter((record) => record.assignedTo === currentUser?.id && terminalStatuses.has(String(record.status || "")))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [currentUser?.id, documentacionState?.records, terminalStatuses]);

  const totalActive = activeTransportRecords.length + activeDocRecords.length;
  const totalHistory = historyTransportRecords.length + historyDocRecords.length;

  const sendStatusUpdate = async (routeType, recordId, nextStatus, reason = "") => {
    setIsUpdating(true);
    setUpdateError("");

    try {
      const endpoint = routeType === "documentacion"
        ? `/warehouse/documentacion/records/${recordId}/status`
        : `/warehouse/transport/records/${recordId}/status`;

      const result = await requestJson(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, reason }),
      });

      if (result.ok) {
        setReasonState({ open: false, routeType: "", recordId: "", destination: "", nextStatus: "", reason: "" });
        onStatusUpdated?.();
      } else {
        setUpdateError(result?.message || "No fue posible actualizar el estado");
      }
    } catch (error) {
      setUpdateError(error?.message || "Error actualizando estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const requestStatusChange = (record, routeType, nextStatus, options = {}) => {
    if (options?.requiresReason) {
      setReasonState({
        open: true,
        routeType,
        recordId: record.id,
        destination: routeType === "documentacion" ? (record.area || "Documentación") : (record.destination || "Destino"),
        nextStatus,
        reason: "",
      });
      return;
    }
    sendStatusUpdate(routeType, record.id, nextStatus, "");
  };

  const getNextActions = (statusValue = "") => {
    const status = String(statusValue || "").trim();
    if (status === "Asignado") {
      return [
        { id: "en-camino", label: "En camino", nextStatus: "En camino", tone: "primary" },
        { id: "cancelar", label: "Cancelar ruta", nextStatus: "Cancelado", tone: "secondary" },
      ];
    }
    if (status === "En camino") {
      return [
        { id: "entregado", label: "Entregado", nextStatus: "Entregado", tone: "success" },
        { id: "retorno", label: "Retorno", nextStatus: "Retorno", tone: "warning", requiresReason: true },
      ];
    }
    if (status === "Retorno") {
      return [
        { id: "devuelto", label: "Devuelto", nextStatus: "Devuelto", tone: "danger" },
      ];
    }
    return [];
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pendiente: { bg: "#fff3cd", color: "#856404" },
      Asignado: { bg: "#cfe2ff", color: "#084298" },
      "En camino": { bg: "#d1ecf1", color: "#0c5460" },
      Retorno: { bg: "#ffe8cc", color: "#7a4100" },
      Entregado: { bg: "#d4edda", color: "#155724" },
      Devuelto: { bg: "#f8d7da", color: "#842029" },
      Cancelado: { bg: "#e2e3e5", color: "#41464b" },
    };
    const style = styles[status] || { bg: "#e2e3e5", color: "#383d41" };
    return (
      <span style={{
        display: "inline-block",
        padding: "0.25rem 0.5rem",
        background: style.bg,
        color: style.color,
        borderRadius: "0.25rem",
        fontSize: "0.85rem",
        fontWeight: "500",
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Mis Rutas Asignadas</h3>
        <span className="chip" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
          {totalActive} activa{totalActive !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="transport-view-tabs" style={{ marginBottom: "0.8rem" }}>
        <button
          type="button"
          className={`transport-view-tab ${routesViewTab === "active" ? "is-active" : ""}`}
          onClick={() => setRoutesViewTab("active")}
        >
          Mis rutas activas
        </button>
        <button
          type="button"
          className={`transport-view-tab ${routesViewTab === "history" ? "is-active" : ""}`}
          onClick={() => setRoutesViewTab("history")}
        >
          Historial mis rutas ({totalHistory})
        </button>
      </div>

      {updateError && (
        <div style={{
          padding: "0.75rem",
          background: "#ffebee",
          border: "1px solid #ff5252",
          borderRadius: "0.5rem",
          color: "#d32f2f",
          marginBottom: "0.75rem",
          fontSize: "0.9rem",
        }}>
          {updateError}
        </div>
      )}

      <div className="table-wrap">
        <table className="inventory-table-clean">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Destino</th>
              <th>Cajas</th>
              <th>Piezas</th>
              <th>Estado</th>
              <th>{routesViewTab === "history" ? "Cerrado" : "Asignado el"}</th>
              <th>Detalle</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(routesViewTab === "active" ? activeTransportRecords : historyTransportRecords).map((record) => (
              <tr key={record.id}>
                <td>Transporte</td>
                <td>{record.destination}</td>
                <td>{record.boxes}</td>
                <td>{record.pieces}</td>
                <td>{getStatusBadge(record.status)}</td>
                <td>{formatDateTime((routesViewTab === "history" ? (record.deliveredAt || record.updatedAt) : (record.assignedAt || record.createdAt)) || record.createdAt)}</td>
                <td>{record.returnReason || record.canceledReason || "-"}</td>
                <td>
                  {routesViewTab === "active" ? (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {getNextActions(record.status).map((action) => (
                        <button
                          key={`${record.id}-${action.id}`}
                          type="button"
                          className={action.tone === "primary" ? "primary-button" : "icon-button"}
                          onClick={() => requestStatusChange(record, "transport", action.nextStatus, { requiresReason: action.requiresReason })}
                          disabled={isUpdating}
                          style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="subtle-line">Ciclo cerrado</span>
                  )}
                </td>
              </tr>
            ))}
            {(routesViewTab === "active" ? activeDocRecords : historyDocRecords).map((record) => (
                <tr key={record.id}>
                  <td>Documentación</td>
                  <td>{record.area || "-"}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{getStatusBadge(record.status)}</td>
                <td>{formatDateTime((routesViewTab === "history" ? (record.deliveredAt || record.updatedAt) : (record.assignedAt || record.createdAt)) || record.createdAt)}</td>
                  <td>{record.returnReason || record.canceledReason || "-"}</td>
                  <td>
                  {routesViewTab === "active" ? (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {getNextActions(record.status).map((action) => (
                        <button
                          key={`${record.id}-${action.id}`}
                          type="button"
                          className={action.tone === "primary" ? "primary-button" : "icon-button"}
                          onClick={() => requestStatusChange(record, "documentacion", action.nextStatus, { requiresReason: action.requiresReason })}
                          disabled={isUpdating}
                          style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="subtle-line">Ciclo cerrado</span>
                  )}
                  </td>
                </tr>
              ))}
            {routesViewTab === "active" && !totalActive ? (
              <tr>
                <td colSpan="8" className="subtle-line">
                  No tienes rutas asignadas en este momento.
                </td>
              </tr>
            ) : null}
            {routesViewTab === "history" && !totalHistory ? (
              <tr>
                <td colSpan="8" className="subtle-line">
                  Aún no tienes rutas cerradas en historial.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {reasonState.open && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }} onClick={() => setReasonState({ open: false, routeType: "", recordId: "", destination: "", nextStatus: "", reason: "" })}>
          <div className="transport-reason-modal" style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "1rem",
            width: "min(92vw, 420px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>
              Motivo de retorno
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>
                Escribe el motivo para {reasonState.destination}:
              </label>
              <textarea
                value={reasonState.reason}
                onChange={(e) => setReasonState((prev) => ({ ...prev, reason: e.target.value }))}
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "0.25rem",
                  fontSize: "0.9rem",
                }}
                placeholder="Ejemplo: Cliente no recibió, reprogramar para mañana"
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setReasonState({ open: false, routeType: "", recordId: "", destination: "", nextStatus: "", reason: "" })}
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => sendStatusUpdate(reasonState.routeType, reasonState.recordId, reasonState.nextStatus, reasonState.reason)}
                disabled={isUpdating || !String(reasonState.reason || "").trim()}
              >
                {isUpdating ? "Guardando..." : "Guardar motivo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
