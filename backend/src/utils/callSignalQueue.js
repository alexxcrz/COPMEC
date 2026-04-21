// Shared in-memory queue for HTTP-fallback call signaling.
// Used by both chat.routes.js and socket.js so that socket delivery
// failures automatically fall back to REST polling.

const callSignalQueues = new Map();
let callSignalSequence = 0;
const CALL_SIGNAL_TTL_MS = 90 * 1000;

export function normalizeNick(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function cleanupExpiredCallSignals() {
  const now = Date.now();
  for (const [key, queue] of callSignalQueues.entries()) {
    const nextQueue = queue.filter(
      (item) => now - Number(item.createdAt || 0) < CALL_SIGNAL_TTL_MS
    );
    if (nextQueue.length > 0) {
      callSignalQueues.set(key, nextQueue);
    } else {
      callSignalQueues.delete(key);
    }
  }
}

setInterval(cleanupExpiredCallSignals, 30000).unref?.();

export function nextSignalId() {
  return `call-${++callSignalSequence}`;
}

export function enqueueCallSignal(targetNickname, signal) {
  const key = normalizeNick(targetNickname);
  if (!key) return;
  const queue = callSignalQueues.get(key) || [];
  queue.push(signal);
  callSignalQueues.set(key, queue.slice(-400));
}

export function drainCallSignals(targetNickname) {
  cleanupExpiredCallSignals();
  const key = normalizeNick(targetNickname);
  if (!key) return [];
  const queue = callSignalQueues.get(key) || [];
  callSignalQueues.delete(key);
  return queue;
}
