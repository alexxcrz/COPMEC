import { Router } from "express";
import { requireAuth, requireWarehouseAction, requireWarehouseStateWriteAccess } from "../middleware/auth.middleware.js";
import { auditSecurityEvent } from "../services/security-events.service.js";
import {
  addWarehouseArea,
  createWarehouseCatalogItem,
  createWarehouseBoard,
  createWarehouseBoardRow,
  createWarehouseInventoryItem,
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
  const result = addWarehouseArea(req.auth, req.body?.name || "");
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

warehouseRouter.post("/catalog", requireWarehouseAction("manageCatalog"), (req, res) => {
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

warehouseRouter.patch("/catalog/:itemId", requireWarehouseAction("manageCatalog"), (req, res) => {
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

warehouseRouter.delete("/catalog/:itemId", requireWarehouseAction("manageCatalog"), (req, res) => {
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

warehouseRouter.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
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