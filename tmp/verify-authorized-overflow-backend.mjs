import { getWarehouseState, patchWarehouseBoardRow, replaceWarehouseState } from "../backend/src/services/warehouse.store.js";

const original = structuredClone(getWarehouseState());
const working = structuredClone(original);

function pickUser(state) {
  return (state.users || []).find((u) => u?.isActive && u?.id)?.id || null;
}

function pickAnyRow(state) {
  for (const board of state.controlBoards || []) {
    for (const row of board.rows || []) {
      if (board?.id && row?.id) return { boardId: board.id, rowId: row.id };
    }
  }
  return null;
}

const userId = pickUser(original);
const target = pickAnyRow(working);
if (!userId || !target) {
  console.log(JSON.stringify({ ok: false, reason: !userId ? "no_active_user" : "no_row_found" }, null, 2));
  process.exit(0);
}

const board = working.controlBoards.find((b) => b.id === target.boardId);
const row = board?.rows?.find((r) => r.id === target.rowId);
if (!row) {
  console.log(JSON.stringify({ ok: false, reason: "row_not_found" }, null, 2));
  process.exit(0);
}

row.status = "Pausado";
row.startTime = row.startTime || new Date(Date.now() - (3 * 60 * 60 * 1000)).toISOString();
row.lastResumedAt = null;
row.accumulatedSeconds = 1200;
row.pauseStartedAt = new Date(Date.now() - (12 * 60 * 1000)).toISOString();
row.pauseAuthorizedSeconds = 300;
row.pauseAffectsTimer = false;
row.lastPauseReason = "calidad";

replaceWarehouseState(working);

const resume = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "En curso" });

const working2 = structuredClone(getWarehouseState());
const board2 = working2.controlBoards.find((b) => b.id === target.boardId);
const row2 = board2?.rows?.find((r) => r.id === target.rowId);
row2.status = "Pausado";
row2.lastResumedAt = null;
row2.accumulatedSeconds = 1200;
row2.pauseStartedAt = new Date(Date.now() - (12 * 60 * 1000)).toISOString();
row2.pauseAuthorizedSeconds = 300;
row2.pauseAffectsTimer = false;
replaceWarehouseState(working2);

const finish = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "Terminado" });

replaceWarehouseState(original);

console.log(JSON.stringify({
  ok: true,
  expectedMinAfterAuthorized: 1200 + (12 * 60 - 300),
  resumeAccumulated: Number(resume?.row?.accumulatedSeconds || 0),
  finishAccumulated: Number(finish?.row?.accumulatedSeconds || 0),
  resumeOk: Boolean(resume?.ok),
  finishOk: Boolean(finish?.ok)
}, null, 2));
