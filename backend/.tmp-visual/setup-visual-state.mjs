import {
  replaceWarehouseState,
  createWarehouseInventoryItem,
  createWarehouseInventoryMovement,
  getWarehouseState,
} from "./src/services/warehouse.store.js";

const LEAD_ID = "usr-lead-nu7wt83h";
const leadPassword = "LeadTest123!";
const leadLogin = "visuallead";

const currentState = getWarehouseState();
replaceWarehouseState({
  ...currentState,
  users: (currentState.users || []).map((user) => (
    user.id === LEAD_ID
      ? {
          ...user,
          email: leadLogin,
          password: leadPassword,
          mustChangePassword: false,
          temporaryPasswordIssuedAt: null,
        }
      : user
  )),
});

const leadAuth = { userId: LEAD_ID };
const created = createWarehouseInventoryItem(leadAuth, {
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
if (!created.ok) {
  console.log(JSON.stringify({ step: "createItem", ok: false, reason: created.reason }, null, 2));
  process.exit(1);
}

const firstTransfer = createWarehouseInventoryMovement(leadAuth, {
  itemId: created.itemId,
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

console.log(JSON.stringify({
  ok: true,
  leadLogin,
  leadPassword,
  itemCode: "VISUAL-ORD-001",
}, null, 2));
