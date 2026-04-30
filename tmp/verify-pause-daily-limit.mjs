import { getWarehouseState, replaceWarehouseState, patchWarehouseBoardRow } from "../backend/src/services/warehouse.store.js";

const original = structuredClone(getWarehouseState());
const working = structuredClone(original);

const userId = (working.users || []).find((u) => u?.isActive && u?.id)?.id;
let target = null;
for (const board of working.controlBoards || []) {
  for (const row of board.rows || []) {
    if (row?.id) { target = { boardId: board.id, rowId: row.id }; break; }
  }
  if (target) break;
}
if (!userId || !target) {
  console.log(JSON.stringify({ ok: false, reason: !userId ? "no_user" : "no_row" }, null, 2));
  process.exit(0);
}

working.system = working.system || {};
working.system.operational = working.system.operational || {};
working.system.operational.pauseControl = working.system.operational.pauseControl || {};
working.system.operational.pauseControl.reasons = [
  { id: "testlim", label: "Prueba limite", enabled: true, affectsTimer: false, authorizedMinutes: 6, dailyUsageLimit: 1 },
];

const board = (working.controlBoards || []).find((b) => b.id === target.boardId);
const row = (board?.rows || []).find((r) => r.id === target.rowId);
row.status = "En curso";
row.startTime = row.startTime || new Date(Date.now() - 3600000).toISOString();
row.lastResumedAt = new Date(Date.now() - 60000).toISOString();
row.accumulatedSeconds = 100;
row.pauseUsageByDay = {};

replaceWarehouseState(working);

const firstPause = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "Pausado", lastPauseReason: "Prueba limite" });
const resume = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "En curso" });
const secondPause = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "Pausado", lastPauseReason: "Prueba limite" });

replaceWarehouseState(original);

console.log(JSON.stringify({
  firstPauseOk: Boolean(firstPause?.ok),
  firstPauseAuthorizedSeconds: Number(firstPause?.row?.pauseAuthorizedSeconds || 0),
  resumeOk: Boolean(resume?.ok),
  secondPauseOk: Boolean(secondPause?.ok),
  secondPauseReason: secondPause?.reason || null
}, null, 2));
