import { Server } from "socket.io";
import { corsOriginValidator } from "./env.js";

let io;

// Usuarios activos en chat: { nombre: { sockets: [socketId, ...] } }
const usuariosActivos = {};

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOriginValidator,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // polling primero es obligatorio detrás del proxy de Render;
    // socket.io intentará upgrade a WebSocket automáticamente después
    transports: ["polling", "websocket"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO connection error:", err.message);
  });

  io.on("connection", (socket) => {
    let usuarioNombre = null;

    // ── LOGIN CHAT ──────────────────────────────────────────
    socket.on("login_chat", ({ nickname, photo }) => {
      usuarioNombre = nickname;
      socket.data.nickname = nickname;

      if (!usuariosActivos[nickname]) {
        usuariosActivos[nickname] = { sockets: [], photo: photo || null };
      }
      if (!usuariosActivos[nickname].sockets.includes(socket.id)) {
        usuariosActivos[nickname].sockets.push(socket.id);
      }
      if (photo) usuariosActivos[nickname].photo = photo;

      emitirUsuariosActivos();
    });

    // ── VIDEOLLAMADAS (WebRTC) ──────────────────────────────
    socket.on("call_invite", ({ room, fromNickname, toNicknames }) => {
      if (!room || !Array.isArray(toNicknames)) return;
      toNicknames.forEach((nick) => {
        getSocketsByNickname(nick).forEach((socketId) => {
          io.to(socketId).emit("call_invite", {
            room,
            fromNickname: fromNickname || socket.data.nickname || "Usuario",
          });
        });
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
  const lista = Object.keys(usuariosActivos).map((nickname) => ({
    nickname,
    photo: usuariosActivos[nickname].photo || null,
  }));
  io.emit("usuarios_activos", lista);
  io.emit("estados_actualizados");
}

export function getIO() {
  if (!io) throw new Error("Socket.io no está inicializado");
  return io;
}

export function getUsuariosActivos() {
  return Object.keys(usuariosActivos).map((nickname) => ({
    nickname,
    photo: usuariosActivos[nickname].photo || null,
    sockets: usuariosActivos[nickname].sockets.length,
  }));
}

export function getSocketsByNickname(nickname) {
  return usuariosActivos[nickname]?.sockets || [];
}
