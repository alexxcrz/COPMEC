import {
  replaceWarehouseState,
  createWarehouseInventoryItem,
  createWarehouseInventoryMovement,
  getWarehouseState,
} from "./src/services/warehouse.store.js";

const LEAD_ID = "usr-visual-lead";
const leadPassword = "LeadTest123!";
const leadLogin = "visuallead";

const currentState = getWarehouseState();
replaceWarehouseState({
  ...currentState,
  currentUserId: LEAD_ID,
  users: [
    {
      id: LEAD_ID,
      name: "Visual Lead",
      email: leadLogin,
      role: "Lead",
      area: "INVENTARIO",
      department: "INVENTARIO",
      jobTitle: "Lead QA",
      isActive: true,
      managerId: LEAD_ID,
      createdById: LEAD_ID,
      selfIdentityEditCount: 0,
      mustChangePassword: false,
      temporaryPasswordIssuedAt: null,
      password: leadPassword,
    },
  ],
});

const refreshedState = getWarehouseState();
const leadAuth = { userId: LEAD_ID };
const existingItem = (refreshedState.inventoryItems || []).find((item) => item.code === "VISUAL-ORD-001");
const createResult = existingItem
  ? { ok: true, itemId: existingItem.id }
  : createWarehouseInventoryItem(leadAuth, {
      domain: "orders",
      code: "VISUAL-ORD-001",
      name: "Film stretch QA",
      presentation: "Rollo",
      piecesPerBox: 1,
      boxesPerPallet: 1,
      stockUnits: 40,
      minStockUnits: 5,
      storageLocation: "Central QA",
      unitLabel: "pzas",
    });
if (!createResult.ok) {
  console.log(JSON.stringify({ step: "createItem", ok: false, reason: createResult.reason }, null, 2));
  process.exit(1);
}

const afterCreateState = getWarehouseState();
const createdItem = (afterCreateState.inventoryItems || []).find((item) => item.id === createResult.itemId) || null;
const currentTarget = (createdItem?.transferTargets || []).find((target) => target.destinationKey === "nave 1::estacion a") || null;

if (!currentTarget) {
  const firstTransfer = createWarehouseInventoryMovement(leadAuth, {
    itemId: createResult.itemId,
    movementType: "transfer",
    quantity: 8,
    warehouse: "Náve 1",
    storageLocation: "Estación Á",
    recipientName: "Equipo QA",
    notes: "Semilla visual inicial",
  });
  if (!firstTransfer.ok) {
    console.log(JSON.stringify({ step: "seedTransfer", ok: false, reason: firstTransfer.reason }, null, 2));
    process.exit(1);
  }
}

console.log(JSON.stringify({
  ok: true,
  leadLogin,
  leadPassword,
  itemCode: "VISUAL-ORD-001",
}, null, 2));
