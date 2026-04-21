import { Server } from "socket.io";
import { corsOriginValidator } from "./env.js";

let io;

// Usuarios activos en chat: { nombre: { sockets: [socketId, ...], photo, lastActivity, inCall } }
const usuariosActivos = {};

function normalizeNick(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveActiveNickKey(nickname) {
  const target = normalizeNick(nickname);
  if (!target) return null;
  return Object.keys(usuariosActivos).find((key) => normalizeNick(key) === target) || null;
}

function getUserRoomKey(nickname) {
  const key = normalizeNick(nickname);
  return key ? `user:${key}` : null;
}

// Intervalo que marca usuarios como ausentes tras 1 hora de inactividad
setInterval(() => {
  let changed = false;
  Object.keys(usuariosActivos).forEach((nick) => {
    const u = usuariosActivos[nick];
    const away = Date.now() - (u.lastActivity || 0) > 3600000;
    if (away !== u._wasAway) {
      u._wasAway = away;
      changed = true;
    }
  });
  if (changed && io) emitirUsuariosActivos();
}, 5 * 60 * 1000);

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOriginValidator,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Render free tier: forzar polling, sin upgrade a WebSocket
    transports: ["polling"],
    allowUpgrades: false,
    allowEIO3: true,
    // Mantener por debajo del timeout de 55s del proxy de Render
    pingInterval: 20000,
    pingTimeout: 25000,
    connectTimeout: 45000,
    // Evitar que las sesiones queden colgadas
    maxHttpBufferSize: 1e6,
  });

  io.engine.on("connection_error", (err) => {
    // Muy común en deploy/restart o pestañas con sid viejo; no indica falla real del chat.
    if (err?.message === "Session ID unknown" || err?.code === 1) {
      console.log("Socket.IO stale sid discarded");
      return;
    }
    console.error("Socket.IO connection error:", err?.message || err);
  });

  io.on("connection", (socket) => {
    let usuarioNombre = null;
    let usuarioRoomKey = null;

    // ── LOGIN CHAT ──────────────────────────────────────────
    socket.on("login_chat", ({ nickname, photo }) => {
      const safeNickname = String(nickname || "").trim();
      if (!safeNickname) return;
      usuarioNombre = safeNickname;
      socket.data.nickname = safeNickname;

      const nextRoomKey = getUserRoomKey(safeNickname);
      if (usuarioRoomKey && usuarioRoomKey !== nextRoomKey) {
        socket.leave(usuarioRoomKey);
      }
      if (nextRoomKey) {
        socket.join(nextRoomKey);
        usuarioRoomKey = nextRoomKey;
      }

      if (!usuariosActivos[safeNickname]) {
        usuariosActivos[safeNickname] = { sockets: [], photo: photo || null, lastActivity: Date.now(), inCall: false, _wasAway: false };
      } else {
        usuariosActivos[safeNickname].lastActivity = Date.now();
        usuariosActivos[safeNickname]._wasAway = false;
      }
      if (!usuariosActivos[safeNickname].sockets.includes(socket.id)) {
        usuariosActivos[safeNickname].sockets.push(socket.id);
      }
      if (photo) usuariosActivos[safeNickname].photo = photo;

      emitirUsuariosActivos();
    });

    // ── ACTIVIDAD DE USUARIO ────────────────────────────────
    socket.on("user_activity", () => {
      const nick = socket.data.nickname || usuarioNombre;
      if (!nick || !usuariosActivos[nick]) return;
      const wasAway = usuariosActivos[nick]._wasAway;
      usuariosActivos[nick].lastActivity = Date.now();
      usuariosActivos[nick]._wasAway = false;
      // Solo re-emitir si el estado cambió (ausente → activo)
      if (wasAway) emitirUsuariosActivos();
    });

    // ── ESTADO EN LLAMADA ───────────────────────────────────
    socket.on("set_in_call", ({ inCall }) => {
      const nick = socket.data.nickname || usuarioNombre;
      if (!nick || !usuariosActivos[nick]) return;
      usuariosActivos[nick].inCall = !!inCall;
      emitirUsuariosActivos();
    });

    // ── VIDEOLLAMADAS (WebRTC) ──────────────────────────────
    socket.on("call_invite", ({ room, fromNickname, toNicknames }) => {
      if (!room || !Array.isArray(toNicknames)) return;
      const requested = Array.from(new Set(toNicknames.map((nick) => String(nick || "").trim()).filter(Boolean)));
      let delivered = 0;
      const reachedNicknames = [];

      requested.forEach((nick) => {
        const roomKey = getUserRoomKey(nick);
        const roomSet = roomKey ? io.sockets.adapter.rooms.get(roomKey) : null;
        const targets = roomSet ? Array.from(roomSet) : [];

        if (targets.length > 0) {
          reachedNicknames.push(nick);
        }

        targets.forEach((socketId) => {
          delivered += 1;
          io.to(socketId).emit("call_invite", {
            room,
            fromNickname: fromNickname || socket.data.nickname || "Usuario",
            fromSocketId: socket.id,
          });
        });
      });

      socket.emit("call_invite_status", {
        room,
        requestedNicknames: requested,
        reachedNicknames,
        delivered,
      });
    });

    socket.on("call_reject", ({ to, room, nickname }) => {
      if (!to || !room) return;
      io.to(to).emit("call_rejected", {
        room,
        fromSocketId: socket.id,
        nickname: nickname || socket.data.nickname || "Usuario",
      });
    });

    socket.on("call_join", ({ room, nickname }) => {
      if (!room) return;
      socket.data.nickname = socket.data.nickname || nickname;
      socket.join(room);

      const roomSet = io.sockets.adapter.rooms.get(room) || new Set();
      const users = Array.from(roomSet).map((id) => {
        const s = io.sockets.sockets.get(id);
        return { socketId: id, nickname: s?.data?.nickname || "Usuario" };
      });

      socket.emit("call_users", { room, users });
      socket.to(room).emit("call_user_joined", {
        room,
        socketId: socket.id,
        nickname: socket.data.nickname || "Usuario",
      });
    });

    socket.on("call_leave", ({ room }) => {
      if (!room) return;
      socket.leave(room);
      socket.to(room).emit("call_user_left", { room, socketId: socket.id });
    });

    socket.on("call_offer", ({ to, room, sdp, nickname }) => {
      if (!to || !room || !sdp) return;
      io.to(to).emit("call_offer", {
        from: socket.id,
        room,
        sdp,
        nickname: nickname || socket.data.nickname || "Usuario",
      });
    });

    socket.on("call_answer", ({ to, room, sdp }) => {
      if (!to || !room || !sdp) return;
      io.to(to).emit("call_answer", { from: socket.id, room, sdp });
    });

    socket.on("call_ice", ({ to, room, candidate }) => {
      if (!to || !room || !candidate) return;
      io.to(to).emit("call_ice", { from: socket.id, room, candidate });
    });

    // ── DESCONEXIÓN ─────────────────────────────────────────
    socket.on("disconnect", () => {
      try {
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            socket.to(room).emit("call_user_left", { room, socketId: socket.id });
          }
        });
      } catch (_) {}

      if (usuarioNombre && usuariosActivos[usuarioNombre]) {
        usuariosActivos[usuarioNombre].sockets = usuariosActivos[usuarioNombre].sockets.filter(
          (id) => id !== socket.id
        );
        if (usuariosActivos[usuarioNombre].sockets.length === 0) {
          delete usuariosActivos[usuarioNombre];
        }
        emitirUsuariosActivos();
      }
    });
  });

  return io;
}

function emitirUsuariosActivos() {
  const lista = Object.keys(usuariosActivos).map((nickname) => {
    const u = usuariosActivos[nickname];
    let status = "activo";
    if (u.inCall) {
      status = "en-llamada";
    } else if (Date.now() - (u.lastActivity || 0) > 3600000) {
      status = "ausente";
    }
    return { nickname, photo: u.photo || null, status, inCall: u.inCall || false };
  });
  io.emit("usuarios_activos", lista);
  io.emit("estados_actualizados");
}

export function getIO() {
  if (!io) throw new Error("Socket.io no está inicializado");
  return io;
}

export function getUsuariosActivos() {
  return Object.keys(usuariosActivos).map((nickname) => {
    const u = usuariosActivos[nickname];
    let status = "activo";
    if (u.inCall) {
      status = "en-llamada";
    } else if (Date.now() - (u.lastActivity || 0) > 3600000) {
      status = "ausente";
    }
    return {
      nickname,
      photo: u.photo || null,
      sockets: u.sockets.length,
      status,
      inCall: u.inCall || false,
      lastActivity: u.lastActivity || 0,
    };
  });
}

export function getSocketsByNickname(nickname) {
  const key = resolveActiveNickKey(nickname);
  return key ? usuariosActivos[key]?.sockets || [] : [];
}
