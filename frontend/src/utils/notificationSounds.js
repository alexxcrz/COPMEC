// ── Sonidos de notificación generados por Web Audio API ──────────────────────
// 5 sonidos distintos, sin archivos externos

export const NOTIFICATION_SOUNDS = [
  { id: "burbuja",  label: "Burbuja",  emoji: "🫧" },
  { id: "campana",  label: "Campana",  emoji: "🔔" },
  { id: "ping",     label: "Ping",     emoji: "✨" },
  { id: "marimba",  label: "Marimba",  emoji: "🎵" },
  { id: "digital",  label: "Digital",  emoji: "💻" },
  { id: "cristal",  label: "Cristal",  emoji: "🧊" },
  { id: "pulso",    label: "Pulso",    emoji: "💓" },
  { id: "chime",    label: "Chime",    emoji: "🎐" },
];

export const SOUND_PREF_KEY = "copmec_notification_sound";

export function getSoundPref() {
  return localStorage.getItem(SOUND_PREF_KEY) || "campana";
}

export function setSoundPref(id) {
  localStorage.setItem(SOUND_PREF_KEY, id);
}

let audioGestureUnlocked = false;
let audioUnlockListenersBound = false;

function detachAudioUnlockListeners() {
  if (!audioUnlockListenersBound) return;
  document.removeEventListener("click", handleAudioUnlockGesture);
  document.removeEventListener("pointerdown", handleAudioUnlockGesture);
  document.removeEventListener("keydown", handleAudioUnlockGesture);
  document.removeEventListener("touchstart", handleAudioUnlockGesture);
  audioUnlockListenersBound = false;
}

function handleAudioUnlockGesture() {
  audioGestureUnlocked = true;
  detachAudioUnlockListeners();
}

export function ensureAudioGestureUnlock() {
  if (audioGestureUnlocked) return true;
  if (typeof document === "undefined") return false;
  if (!audioUnlockListenersBound) {
    document.addEventListener("click", handleAudioUnlockGesture, { once: true });
    document.addEventListener("pointerdown", handleAudioUnlockGesture, { once: true });
    document.addEventListener("keydown", handleAudioUnlockGesture, { once: true });
    document.addEventListener("touchstart", handleAudioUnlockGesture, { once: true });
    audioUnlockListenersBound = true;
  }
  return audioGestureUnlocked;
}

function getCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

const clampVolume = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
};

const PLAYERS = {
  // Sweep suave descendente, relajante
  burbuja(ctx, volume = 1) {
    const vol = clampVolume(volume);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(820, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.28 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  },

  // Campana clásica con armónico
  campana(ctx, volume = 1) {
    const volMult = clampVolume(volume);
    [[880, 0.35], [1760, 0.12]].forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol * volMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.4);
    });
  },

  // Ping seco y corto
  ping(ctx, volume = 1) {
    const vol = clampVolume(volume);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.3 * vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  // Marimba: dos notas ascendentes cálidas
  marimba(ctx, volume = 1) {
    const vol = clampVolume(volume);
    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.16;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.32 * vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  },

  // Digital: dos blips de onda cuadrada filtrada
  digital(ctx, volume = 1) {
    const vol = clampVolume(volume);
    [700, 1050].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      const t = ctx.currentTime + i * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  },

  // Cristal: golpe brillante con cola corta
  cristal(ctx, volume = 1) {
    const vol = clampVolume(volume);
    [[1320, 0.16], [1760, 0.10], [2200, 0.07]].forEach(([freq, gainBase], i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      const t = ctx.currentTime + i * 0.02;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(gainBase * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.37);
    });
  },

  // Pulso: doble latido cálido
  pulso(ctx, volume = 1) {
    const vol = clampVolume(volume);
    [0, 0.16].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + offset;
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.14);
      gain.gain.setValueAtTime(0.26 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.21);
    });
  },

  // Chime: tres notas ascendentes ligeras
  chime(ctx, volume = 1) {
    const vol = clampVolume(volume);
    [784, 988, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.17 * vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  },
};

export function playNotificationSound(id, options = {}) {
  if (!ensureAudioGestureUnlock()) return false;
  const soundId = id || getSoundPref();
  const player = PLAYERS[soundId];
  const volume = clampVolume(options.volume ?? 1);
  if (!player) return false;
  const ctx = getCtx();
  if (!ctx) return false;
  try {
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().then(() => player(ctx, volume));
    } else {
      player(ctx, volume);
    }
    return true;
  } catch {
    // Silently ignore errors (e.g., tab not focused)
    return false;
  }
}
