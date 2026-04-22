import { Router } from "express";
import { requireAuth, requireWarehouseAction, requireWarehouseStateWriteAccess } from "../middleware/auth.middleware.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  addWarehouseArea,
  createWarehouseCatalogItem,
  createWarehouseBoard,
  bulkImportWarehouseBoardRows,
  createWarehouseBoardRow,
  createWarehouseInventoryItem,
  duplicateWarehouseInventoryItem,
  createWarehouseInventoryColumn,
  deleteWarehouseInventoryColumn,
  createWarehouseInventoryMovement,
  createWarehouseTemplate,
  createWarehouseUser,
  deleteWarehouseCatalogItem,
  deleteWarehouseBoard,
  deleteWarehouseBoardRow,
  deleteWarehouseInventoryItem,
  deleteWarehouseTemplate,
  deleteWarehouseUser,
  createWarehouseWeekFromCatalog,
  duplicateWarehouseBoard,
  getWarehouseState,
  importWarehouseInventoryItems,
  patchWarehouseBoardRow,
  replaceWarehouseState,
  subscribeWarehouseState,
  updateWarehouseBoard,
  updateWarehouseBoardAssignment,
  updateWarehouseBoardOperationalContext,
  updateWarehouseCatalogItem,
  updateWarehouseInventoryItem,
  updateWarehousePermissionOverride,
  updateWarehousePermissionsModel,
  updateWarehouseSelfProfile,
  updateWarehouseTemplate,
  updateWarehouseUser,
  toggleWarehouseUserActive,
  transferWarehouseLead,
  getCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  createIncidencia,
  updateIncidencia,
  deleteIncidencia,
  addEvidenciaToIncidencia,
  removeEvidenciaFromIncidencia,
  removeWarehouseArea,
  addCotizacionToIncidencia,
  updateCotizacion,
  deleteCotizacion,
  upsertProcessAuditTemplate,
  deleteProcessAuditTemplate,
  createProcessAudit,
  updateProcessAudit,
  addProcessAuditEvidence,
  removeProcessAuditEvidence,
} from "../services/warehouse.store.js";

export const warehouseRouter = Router();

warehouseRouter.get("/state", (_req, res) => {
  res.json(getWarehouseState());
});

warehouseRouter.put("/state", requireWarehouseStateWriteAccess, (req, res) => {
  const nextState = replaceWarehouseState(req.body || {});
  auditSecurityEvent("warehouse_state_replaced", req, {
    revision: nextState?.revision,
    users: Array.isArray(nextState?.users) ? nextState.users.length : 0,
    boards: Array.isArray(nextState?.controlBoards) ? nextState.controlBoards.length : 0,
  });
  res.json(nextState);
});

warehouseRouter.post("/weeks", requireWarehouseAction("createWeek"), (_req, res) => {
  const nextState = createWarehouseWeekFromCatalog();
  auditSecurityEvent("warehouse_week_created", _req, {
    revision: nextState?.revision,
    totalWeeks: Array.isArray(nextState?.weeks) ? nextState.weeks.length : 0,
  });
  res.status(201).json(nextState);
});

warehouseRouter.post("/boards", requireWarehouseAction("saveBoard"), (req, res) => {
  const result = createWarehouseBoard(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible crear el tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_created", req, {
    boardId: result.boardId,
    boardName: result.boardName,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, boardId: result.boardId, boardName: result.boardName } });
});

warehouseRouter.patch("/boards/:boardId", requireWarehouseAction("saveBoard"), (req, res) => {
  const result = updateWarehouseBoard(req.auth, req.params.boardId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar el tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_updated", req, {
    boardId: result.boardId,
    boardName: result.boardName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, boardId: result.boardId, boardName: result.boardName } });
});

warehouseRouter.delete("/boards/:boardId", requireWarehouseAction("deleteBoard"), (req, res) => {
  const result = deleteWarehouseBoard(req.auth, req.params.boardId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar el tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_deleted", req, {
    boardId: result.boardId,
    boardName: result.boardName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, boardId: result.boardId, boardName: result.boardName } });
});

warehouseRouter.post("/boards/:boardId/duplicate", (req, res) => {
  const result = duplicateWarehouseBoard(req.auth, req.params.boardId, Boolean(req.body?.includeRows));
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible duplicar el tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_duplicated", req, {
    sourceBoardId: req.params.boardId,
    boardId: result.boardId,
    boardName: result.boardName,
    includeRows: Boolean(req.body?.includeRows),
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, boardId: result.boardId, boardName: result.boardName } });
});

warehouseRouter.post("/templates", requireWarehouseAction("saveTemplate"), (req, res) => {
  const result = createWarehouseTemplate(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible guardar la plantilla." });
    return;
  }

  auditSecurityEvent("warehouse_template_created", req, {
    templateId: result.templateId,
    templateName: result.templateName,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, templateId: result.templateId, templateName: result.templateName } });
});

warehouseRouter.patch("/templates/:templateId", requireWarehouseAction("editTemplate"), (req, res) => {
  const result = updateWarehouseTemplate(req.auth, req.params.templateId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "template_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar la plantilla." });
    return;
  }

  auditSecurityEvent("warehouse_template_updated", req, {
    templateId: result.templateId,
    templateName: result.templateName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, templateId: result.templateId, templateName: result.templateName } });
});

warehouseRouter.delete("/templates/:templateId", requireWarehouseAction("deleteTemplate"), (req, res) => {
  const result = deleteWarehouseTemplate(req.auth, req.params.templateId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "template_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la plantilla." });
    return;
  }

  auditSecurityEvent("warehouse_template_deleted", req, {
    templateId: result.templateId,
    templateName: result.templateName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, templateId: result.templateId, templateName: result.templateName } });
});

warehouseRouter.post("/inventory", requireAuth, (req, res) => {
  const result = createWarehouseInventoryItem(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : result.reason === "duplicate_code" ? 409 : 400;
    res.status(status).json({ ok: false, message: result.reason === "duplicate_code" ? "Ya existe un artículo con ese código." : "No fue posible crear el artículo de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_item_created", req, {
    itemId: result.itemId,
    itemCode: result.itemCode,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId, itemCode: result.itemCode } });
});

warehouseRouter.patch("/inventory/:itemId", requireAuth, (req, res) => {
  const result = updateWarehouseInventoryItem(req.auth, req.params.itemId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : result.reason === "duplicate_code" ? 409 : 400;
    res.status(status).json({ ok: false, message: result.reason === "duplicate_code" ? "Ya existe un artículo con ese código." : "No fue posible actualizar el artículo de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_item_updated", req, {
    itemId: result.itemId,
    itemCode: result.itemCode,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, itemId: result.itemId, itemCode: result.itemCode } });
});

warehouseRouter.delete("/inventory/:itemId", requireAuth, (req, res) => {
  const result = deleteWarehouseInventoryItem(req.auth, req.params.itemId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar el artículo de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_item_deleted", req, {
    itemId: result.itemId,
    itemCode: result.itemCode,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, itemId: result.itemId, itemCode: result.itemCode } });
});

warehouseRouter.post("/inventory/:itemId/duplicate", requireAuth, (req, res) => {
  const result = duplicateWarehouseInventoryItem(req.auth, req.params.itemId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible duplicar el artículo de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_item_duplicated", req, {
    sourceItemId: result.sourceItemId,
    itemId: result.itemId,
    itemCode: result.itemCode,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId, itemCode: result.itemCode } });
});

warehouseRouter.post("/inventory/columns", requireAuth, (req, res) => {
  const result = createWarehouseInventoryColumn(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible crear la columna de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_column_created", req, {
    columnId: result.column?.id,
    columnKey: result.column?.key,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, column: result.column } });
});

warehouseRouter.delete("/inventory/columns/:columnId", requireAuth, (req, res) => {
  const result = deleteWarehouseInventoryColumn(req.auth, req.params.columnId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "column_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la columna de inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_column_deleted", req, {
    columnId: result.columnId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, columnId: result.columnId } });
});

warehouseRouter.post("/process-audits/templates", requireAuth, (req, res) => {
  const result = upsertProcessAuditTemplate(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible guardar la plantilla de auditoría." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_template_saved", req, {
    templateId: result.templateId,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, templateId: result.templateId } });
});

warehouseRouter.delete("/process-audits/templates/:templateId", requireAuth, (req, res) => {
  const result = deleteProcessAuditTemplate(req.auth, req.params.templateId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "template_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la plantilla de auditoría." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_template_deleted", req, {
    templateId: result.templateId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, templateId: result.templateId } });
});

warehouseRouter.post("/process-audits", requireAuth, (req, res) => {
  const result = createProcessAudit(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible crear la auditoría." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_created", req, {
    auditId: result.auditId,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, auditId: result.auditId } });
});

warehouseRouter.patch("/process-audits/:auditId", requireAuth, (req, res) => {
  const result = updateProcessAudit(req.auth, req.params.auditId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "audit_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar la auditoría." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_updated", req, {
    auditId: result.auditId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, auditId: result.auditId } });
});

warehouseRouter.post("/process-audits/:auditId/evidences", requireAuth, (req, res) => {
  const result = addProcessAuditEvidence(req.auth, req.params.auditId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "audit_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible agregar la evidencia." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_evidence_added", req, {
    auditId: result.auditId,
    evidenceId: result.evidenceId,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, auditId: result.auditId, evidenceId: result.evidenceId } });
});

warehouseRouter.delete("/process-audits/:auditId/evidences/:evidenceId", requireAuth, (req, res) => {
  const result = removeProcessAuditEvidence(req.auth, req.params.auditId, req.params.evidenceId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "audit_not_found" ? 404 : result.reason === "evidence_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la evidencia." });
    return;
  }

  auditSecurityEvent("warehouse_process_audit_evidence_deleted", req, {
    auditId: result.auditId,
    evidenceId: result.evidenceId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, auditId: result.auditId, evidenceId: result.evidenceId } });
});

warehouseRouter.post("/inventory/import", requireAuth, (req, res) => {
  const result = importWarehouseInventoryItems(req.auth, req.body?.items || []);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible importar el inventario." });
    return;
  }

  auditSecurityEvent("warehouse_inventory_imported", req, {
    createdCount: result.createdCount,
    updatedCount: result.updatedCount,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, createdCount: result.createdCount, updatedCount: result.updatedCount } });
});

warehouseRouter.post("/inventory/movements", requireAuth, (req, res) => {
  const result = createWarehouseInventoryMovement(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required"
      ? 401
      : result.reason === "item_not_found"
        ? 404
        : result.reason === "forbidden"
          ? 403
          : result.reason === "insufficient_stock"
            ? 409
            : 400;
    const message = result.reason === "insufficient_stock"
      ? "No hay stock suficiente para registrar este movimiento."
      : result.reason === "invalid_transfer_target"
        ? "Define una nave o un resguardo para registrar la transferencia."
        : result.reason === "remaining_units_required"
          ? "Indica cuántas unidades quedan en ese destino antes de registrar una nueva transferencia."
          : "No fue posible registrar el movimiento de inventario.";
    res.status(status).json({ ok: false, message });
    return;
  }

  auditSecurityEvent("warehouse_inventory_movement_created", req, {
    movementId: result.movementId,
    itemId: result.itemId,
    itemCode: result.itemCode,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, movementId: result.movementId, itemId: result.itemId, itemCode: result.itemCode } });
});

warehouseRouter.patch("/permissions", requireWarehouseAction("managePermissions"), (req, res) => {
  const result = updateWarehousePermissionsModel(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar las reglas de permisos." });
    return;
  }

  auditSecurityEvent("warehouse_permissions_updated", req, {
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state } });
});

warehouseRouter.patch("/permissions/users/:userId", requireWarehouseAction("managePermissions"), (req, res) => {
  const result = updateWarehousePermissionOverride(req.auth, req.params.userId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : result.reason === "invalid_target" ? 400 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar los permisos directos del player." });
    return;
  }

  auditSecurityEvent("warehouse_permission_override_updated", req, {
    targetUserId: req.params.userId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, userId: result.userId } });
});

warehouseRouter.patch("/boards/:boardId/assignment", requireWarehouseAction("managePermissions"), (req, res) => {
  const result = updateWarehouseBoardAssignment(req.auth, req.params.boardId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar la asignación del tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_assignment_updated", req, {
    boardId: result.boardId,
    boardName: result.boardName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, boardId: result.boardId, boardName: result.boardName } });
});

warehouseRouter.patch("/boards/:boardId/context", requireAuth, (req, res) => {
  const result = updateWarehouseBoardOperationalContext(req.auth, req.params.boardId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar el contexto del tablero." });
    return;
  }

  auditSecurityEvent("warehouse_board_context_updated", req, {
    boardId: result.boardId,
    boardName: result.boardName,
    operationalContextValue: result.operationalContextValue,
    revision: result.state?.revision,
  });
  res.json({
    ok: true,
    data: {
      state: result.state,
      boardId: result.boardId,
      boardName: result.boardName,
      operationalContextValue: result.operationalContextValue,
    },
  });
});

warehouseRouter.post("/users", requireWarehouseAction("manageUsers"), (req, res) => {
  const result = createWarehouseUser(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "duplicate_email" ? 409 : result.reason === "forbidden" ? 403 : 400;
    const message = result.reason === "duplicate_email"
      ? "Ya existe un player con ese acceso."
      : result.reason === "weak_temporary_password"
        ? "La contraseña temporal debe tener al menos 4 caracteres."
        : "No fue posible crear el player.";
    res.status(status).json({ ok: false, message });
    return;
  }

  auditSecurityEvent("warehouse_user_created", req, {
    targetUserId: result.userId,
    targetUserName: result.userName,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, userId: result.userId, userName: result.userName } });
});

warehouseRouter.patch("/users/:userId", requireWarehouseAction("manageUsers"), (req, res) => {
  const result = updateWarehouseUser(req.auth, req.params.userId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : result.reason === "duplicate_email" ? 409 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: result.reason === "duplicate_email" ? "Ya existe un player con ese acceso." : "No fue posible actualizar el player." });
    return;
  }

  auditSecurityEvent("warehouse_user_updated", req, {
    targetUserId: result.userId,
    targetUserName: result.userName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, userId: result.userId, userName: result.userName } });
});

warehouseRouter.delete("/users/:userId", requireWarehouseAction("deleteUsers"), (req, res) => {
  const result = deleteWarehouseUser(req.auth, req.params.userId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar el player." });
    return;
  }

  auditSecurityEvent("warehouse_user_deleted", req, {
    targetUserId: result.userId,
    targetUserName: result.userName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, userId: result.userId, userName: result.userName } });
});

warehouseRouter.post("/users/:userId/transfer-lead", (req, res) => {
  const result = transferWarehouseLead(req.auth, req.params.userId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : 403;
    res.status(status).json({ ok: false, message: "No fue posible transferir el rol de Lead." });
    return;
  }
  auditSecurityEvent("warehouse_lead_transferred", req, {
    targetUserId: result.targetUserId,
    targetUserName: result.targetUserName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state } });
});

warehouseRouter.patch("/users/:userId/active", requireWarehouseAction("manageUsers"), (req, res) => {
  const result = toggleWarehouseUserActive(req.auth, req.params.userId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "user_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible cambiar el estado del player." });
    return;
  }

  auditSecurityEvent("warehouse_user_active_toggled", req, {
    targetUserId: result.userId,
    isActive: result.isActive,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, userId: result.userId, isActive: result.isActive } });
});

warehouseRouter.patch("/users/me/profile", (req, res) => {
  const result = updateWarehouseSelfProfile(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "duplicate_email" ? 409 : result.reason === "self_edit_limit_reached" ? 403 : 400;
    res.status(status).json({ ok: false, message: result.reason === "duplicate_email" ? "Ya existe un player con ese acceso." : result.reason === "self_edit_limit_reached" ? "La autoedicion ya fue utilizada." : "No fue posible actualizar el perfil." });
    return;
  }

  auditSecurityEvent("warehouse_self_profile_updated", req, {
    targetUserId: result.userId,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, userId: result.userId } });
});

warehouseRouter.post("/areas", requireWarehouseAction("manageUsers"), (req, res) => {
  const result = addWarehouseArea(req.auth, req.body?.name || "", req.body?.parentArea || "");
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : result.reason === "duplicate_area" ? 409 : 400;
    res.status(status).json({ ok: false, message: result.reason === "duplicate_area" ? "Esa área ya existe." : "No fue posible agregar el área." });
    return;
  }

  auditSecurityEvent("warehouse_area_added", req, {
    area: result.area,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, area: result.area } });
});

warehouseRouter.delete("/areas/:areaName", requireWarehouseAction("manageUsers"), (req, res) => {
  const targetArea = decodeURIComponent(String(req.params.areaName || ""));
  const result = removeWarehouseArea(req.auth, targetArea);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : result.reason === "area_not_found" ? 404 : 400;
    res.status(status).json({ ok: false, message: result.reason === "area_not_found" ? "Área o subárea no encontrada." : "No fue posible eliminar el área." });
    return;
  }

  auditSecurityEvent("warehouse_area_removed", req, {
    area: result.removedArea,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, removedArea: result.removedArea } });
});

warehouseRouter.post("/catalog", requireWarehouseAction("createCatalog"), (req, res) => {
  const result = createWarehouseCatalogItem(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible crear la actividad del catálogo." });
    return;
  }

  auditSecurityEvent("warehouse_catalog_item_created", req, {
    itemId: result.itemId,
    itemName: result.itemName,
    revision: result.state?.revision,
  });
  res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId, itemName: result.itemName } });
});

warehouseRouter.patch("/catalog/:itemId", requireWarehouseAction("editCatalog"), (req, res) => {
  const result = updateWarehouseCatalogItem(req.auth, req.params.itemId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible actualizar la actividad del catálogo." });
    return;
  }

  auditSecurityEvent("warehouse_catalog_item_updated", req, {
    itemId: result.itemId,
    itemName: result.itemName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, itemId: result.itemId, itemName: result.itemName } });
});

warehouseRouter.delete("/catalog/:itemId", requireWarehouseAction("deleteCatalog"), (req, res) => {
  const result = deleteWarehouseCatalogItem(req.auth, req.params.itemId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la actividad del catálogo." });
    return;
  }

  auditSecurityEvent("warehouse_catalog_item_deleted", req, {
    itemId: result.itemId,
    itemName: result.itemName,
    revision: result.state?.revision,
  });
  res.json({ ok: true, data: { state: result.state, itemId: result.itemId, itemName: result.itemName } });
});

warehouseRouter.post("/boards/:boardId/rows/bulk", (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const result = bulkImportWarehouseBoardRows(req.auth, req.params.boardId, rows);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : 403;
    res.status(status).json({ ok: false, message: "No fue posible importar las filas." });
    return;
  }
  auditSecurityEvent("warehouse_board_rows_bulk_imported", req, {
    boardId: req.params.boardId,
    count: result.count,
    revision: result.state?.revision,
  });
  res.status(201).json(result.state);
});

warehouseRouter.post("/boards/:boardId/rows", (req, res) => {
  const result = createWarehouseBoardRow(req.auth, req.params.boardId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "board_not_found" ? 404 : 403;
    res.status(status).json({ ok: false, message: "No fue posible crear la fila solicitada." });
    return;
  }

  auditSecurityEvent("warehouse_board_row_created", req, {
    boardId: req.params.boardId,
    rowId: result.row?.id,
    revision: result.state?.revision,
  });
  res.status(201).json(result.state);
});

warehouseRouter.patch("/boards/:boardId/rows/:rowId", (req, res) => {
  const result = patchWarehouseBoardRow(req.auth, req.params.boardId, req.params.rowId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "row_not_found" ? 404 : 403;
    res.status(status).json({ ok: false, message: "No fue posible actualizar la fila solicitada." });
    return;
  }

  auditSecurityEvent("warehouse_board_row_updated", req, {
    boardId: req.params.boardId,
    rowId: req.params.rowId,
    revision: result.state?.revision,
  });
  res.json(result.state);
});

warehouseRouter.delete("/boards/:boardId/rows/:rowId", (req, res) => {
  const result = deleteWarehouseBoardRow(req.auth, req.params.boardId, req.params.rowId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "row_not_found" ? 404 : 403;
    res.status(status).json({ ok: false, message: "No fue posible eliminar la fila solicitada." });
    return;
  }

  auditSecurityEvent("warehouse_board_row_deleted", req, {
    boardId: req.params.boardId,
    rowId: req.params.rowId,
    revision: result.state?.revision,
  });
  res.json(result.state);
});

// ─── Roles personalizados ──────────────────────────────────────────────────
warehouseRouter.get("/roles", requireAuth, (_req, res) => {
  res.json({ ok: true, data: getCustomRoles() });
});

warehouseRouter.post("/roles", requireWarehouseAction("managePermissions"), (req, res) => {
  try {
    const role = createCustomRole(req.body?.name);
    res.status(201).json({ ok: true, data: role });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

warehouseRouter.patch("/roles/:roleId", requireWarehouseAction("managePermissions"), (req, res) => {
  try {
    const role = updateCustomRole(req.params.roleId, req.body?.name);
    if (!role) return res.status(404).json({ ok: false, message: "Rol no encontrado." });
    res.json({ ok: true, data: role });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
});

warehouseRouter.delete("/roles/:roleId", requireWarehouseAction("managePermissions"), (req, res) => {
  deleteCustomRole(req.params.roleId);
  res.json({ ok: true });
});

// ─── Incidencias ───────────────────────────────────────────────────────────
warehouseRouter.post("/incidencias", requireWarehouseAction("createIncidencia"), (req, res) => {
  const result = createIncidencia(req.auth, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible registrar la incidencia." });
  }
  auditSecurityEvent("incidencia_created", req, { itemId: result.itemId, revision: result.state?.revision });
  return res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.patch("/incidencias/:itemId", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = updateIncidencia(req.auth, req.params.itemId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible actualizar la incidencia." });
  }
  auditSecurityEvent("incidencia_updated", req, { itemId: result.itemId, revision: result.state?.revision });
  return res.json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.delete("/incidencias/:itemId", requireWarehouseAction("deleteIncidencia"), (req, res) => {
  const result = deleteIncidencia(req.auth, req.params.itemId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible eliminar la incidencia." });
  }
  auditSecurityEvent("incidencia_deleted", req, { itemId: result.itemId, revision: result.state?.revision });
  return res.json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.post("/incidencias/:itemId/evidencias", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = addEvidenciaToIncidencia(req.auth, req.params.itemId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible agregar la evidencia." });
  }
  return res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.delete("/incidencias/:itemId/evidencias/:evidenciaId", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = removeEvidenciaFromIncidencia(req.auth, req.params.itemId, req.params.evidenciaId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible eliminar la evidencia." });
  }
  return res.json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.post("/incidencias/:itemId/cotizaciones", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = addCotizacionToIncidencia(req.auth, req.params.itemId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible agregar la cotización." });
  }
  return res.status(201).json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.patch("/incidencias/:itemId/cotizaciones/:cotizacionId", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = updateCotizacion(req.auth, req.params.itemId, req.params.cotizacionId, req.body || {});
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible actualizar la cotización." });
  }
  return res.json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.delete("/incidencias/:itemId/cotizaciones/:cotizacionId", requireWarehouseAction("editIncidencia"), (req, res) => {
  const result = deleteCotizacion(req.auth, req.params.itemId, req.params.cotizacionId);
  if (!result.ok) {
    const status = result.reason === "auth_required" ? 401 : result.reason === "item_not_found" ? 404 : result.reason === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, message: "No fue posible eliminar la cotización." });
  }
  return res.json({ ok: true, data: { state: result.state, itemId: result.itemId } });
});

warehouseRouter.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  // Prevent QUIC/HTTP3 from being used for this long-lived SSE connection
  res.setHeader("Alt-Svc", "clear");
  res.flushHeaders?.();

  let closed = false;

  const safeWrite = (chunk) => {
    if (closed || res.writableEnded || res.destroyed) return false;
    try {
      res.write(chunk);
      return true;
    } catch {
      closed = true;
      return false;
    }
  };

  const sendState = (state) => {
    safeWrite(`data: ${JSON.stringify({ type: "state", state })}\n\n`);
  };

  sendState(getWarehouseState());
  const unsubscribe = subscribeWarehouseState(sendState);

  const heartbeat = setInterval(() => {
    safeWrite(`: heartbeat ${Date.now()}\n\n`);
  }, 15000);

  const closeStream = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
    if (!res.writableEnded && !res.destroyed) {
      res.end();
    }
  };

  req.on("aborted", closeStream);
  req.on("close", closeStream);
  res.on("close", closeStream);
  res.on("error", closeStream);
});