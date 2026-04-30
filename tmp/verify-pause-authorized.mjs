import { getWarehouseState, patchWarehouseBoardRow, replaceWarehouseState } from "../backend/src/services/warehouse.store.js";

const original = structuredClone(getWarehouseState());
const working = structuredClone(original);

function pickUser(state) {
  return (state.users || []).find((u) => u?.isActive && u?.id)?.id || null;
}

function pickBoardAndRow(state) {
  for (const board of state.controlBoards || []) {
    for (const row of board.rows || []) {
      if (String(row?.status || "").trim().toLowerCase() === "pausado") {
        return { boardId: board.id, rowId: row.id };
      }
    }
  }
  return null;
}

const userId = pickUser(original);
const target = pickBoardAndRow(original);
if (!userId || !target) {
  console.log(JSON.stringify({ ok: false, reason: !userId ? "no_active_user" : "no_paused_row_found" }, null, 2));
  process.exit(0);
}

const board = working.controlBoards.find((b) => b.id === target.boardId);
const row = board?.rows?.find((r) => r.id === target.rowId);
if (!row) {
  console.log(JSON.stringify({ ok: false, reason: "row_not_found" }, null, 2));
  process.exit(0);
}

row.status = "Pausado";
row.lastPauseReason = "calidad";
row.pauseAffectsTimer = false;
row.pauseAuthorizedSeconds = 300; // 5 minutes authorized
row.pauseStartedAt = new Date(Date.now() - (12 * 60 * 1000)).toISOString(); // paused 12m ago

replaceWarehouseState(working);

const beforeAccum = Number(row.accumulatedSeconds || 0);
const resumeResult = patchWarehouseBoardRow({ userId }, target.boardId, target.rowId, { status: "En curso" });

const payload = {
  ok: Boolean(resumeResult?.ok),
  boardId: target.boardId,
  rowId: target.rowId,
  beforeAccum,
  afterResumeAccum: Number(resumeResult?.row?.accumulatedSeconds || 0),
  sameOnResume: Number(resumeResult?.row?.accumulatedSeconds || 0) === beforeAccum,
  simulatedPauseReason: "calidad",
  simulatedPauseAffectsTimer: false,
  simulatedPauseAuthorizedSeconds: 300,
  simulatedPausedSeconds: 720,
  resumeReason: resumeResult?.reason || null
};

replaceWarehouseState(original);
console.log(JSON.stringify(payload, null, 2));
