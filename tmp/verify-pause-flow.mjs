import { getWarehouseState, patchWarehouseBoardRow, replaceWarehouseState } from "../backend/src/services/warehouse.store.js";

const original = structuredClone(getWarehouseState());

function pickUser(state) {
  return (state.users || []).find((u) => u?.isActive && u?.id)?.id || null;
}

function pickBoardAndRow(state) {
  for (const board of state.controlBoards || []) {
    for (const row of board.rows || []) {
      if (String(row?.status || "").trim().toLowerCase() === "pausado") {
        return { boardId: board.id, rowId: row.id, row };
      }
    }
  }
  return null;
}

const userId = pickUser(original);
if (!userId) {
  console.log(JSON.stringify({ ok: false, reason: "no_active_user" }, null, 2));
  process.exit(0);
}

const target = pickBoardAndRow(original);
if (!target) {
  console.log(JSON.stringify({ ok: false, reason: "no_paused_row_found" }, null, 2));
  process.exit(0);
}

const beforeAccum = Number(target.row.accumulatedSeconds || 0);

const resumeResult = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "En curso" });
if (!resumeResult?.ok) {
  console.log(JSON.stringify({ ok: false, step: "resume", reason: resumeResult?.reason || "unknown" }, null, 2));
  replaceWarehouseState(original);
  process.exit(0);
}

const afterResumeAccum = Number(resumeResult.row?.accumulatedSeconds || 0);
const sameOnResume = afterResumeAccum === beforeAccum;

const pauseResult = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "Pausado", lastPauseReason: "operativa" });
if (!pauseResult?.ok) {
  console.log(JSON.stringify({ ok: false, step: "pause_again", reason: pauseResult?.reason || "unknown" }, null, 2));
  replaceWarehouseState(original);
  process.exit(0);
}

const afterPauseAgainAccum = Number(pauseResult.row?.accumulatedSeconds || 0);
const noDecrease = afterPauseAgainAccum >= afterResumeAccum;

replaceWarehouseState(original);

console.log(JSON.stringify({
  ok: true,
  boardId: target.boardId,
  rowId: target.rowId,
  beforeAccum,
  afterResumeAccum,
  sameOnResume,
  afterPauseAgainAccum,
  noDecrease
}, null, 2));
