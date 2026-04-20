import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateEnv } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const dotenv = await import("dotenv");
  dotenv.default.config({ path: path.resolve(__dirname, "../.env") });
} catch {
  // In production the platform already injects environment variables.
}

validateEnv();

const { app } = await import("./app.js");
const { initSocket } = await import("./config/socket.js");
const { prisma } = await import("./config/prisma.js");

// ── Crear tablas de chat si no existen ────────────────────────────────────────
const CHAT_DDL = [
  `CREATE TABLE IF NOT EXISTS chat_general (
    id SERIAL PRIMARY KEY,
    "usuarioNickname" TEXT NOT NULL,
    "usuarioPhoto" TEXT,
    mensaje TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT, "archivoNombre" TEXT, "archivoTipo" TEXT, "archivoTamaño" BIGINT,
    menciona TEXT, "enlaceCompartido" TEXT,
    "replyToId" INTEGER, "replyToUser" TEXT, "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT, "reenviadoDeChat" TEXT, "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false, "fechaEdicion" TIMESTAMP(3),
    prioridad INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_general_leidos (
    id SERIAL PRIMARY KEY,
    "mensajeId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_gen_leidos_uq UNIQUE("mensajeId","usuarioNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_privado (
    id SERIAL PRIMARY KEY,
    "deNickname" TEXT NOT NULL,
    "paraNickname" TEXT NOT NULL,
    "dePhoto" TEXT,
    mensaje TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT, "archivoNombre" TEXT, "archivoTipo" TEXT, "archivoTamaño" BIGINT,
    menciona TEXT, "enlaceCompartido" TEXT,
    "replyToId" INTEGER, "replyToUser" TEXT, "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT, "reenviadoDeChat" TEXT, "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false, "fechaEdicion" TIMESTAMP(3),
    prioridad INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_privado_leidos (
    id SERIAL PRIMARY KEY,
    "mensajeId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_priv_leidos_uq UNIQUE("mensajeId","usuarioNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_privado_borrados (
    id SERIAL PRIMARY KEY,
    "usuarioNickname" TEXT NOT NULL,
    "otroNickname" TEXT NOT NULL,
    "borradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_priv_borrados_uq UNIQUE("usuarioNickname","otroNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    "creadoPor" TEXT NOT NULL,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    foto TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupos_miembros (
    id SERIAL PRIMARY KEY,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "unidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_grp_miembros_uq UNIQUE("grupoId","usuarioNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupos_administradores (
    id SERIAL PRIMARY KEY,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_grp_admins_uq UNIQUE("grupoId","usuarioNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupos_solicitudes (
    id SERIAL PRIMARY KEY,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupos_restricciones (
    id SERIAL PRIMARY KEY,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "restriccionTipo" TEXT NOT NULL DEFAULT 'sin_mensajes',
    "duracionMinutos" INTEGER,
    "fechaFin" TIMESTAMP(3),
    activa BOOLEAN NOT NULL DEFAULT true,
    fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupal (
    id SERIAL PRIMARY KEY,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "usuarioPhoto" TEXT,
    mensaje TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT, "archivoNombre" TEXT, "archivoTipo" TEXT, "archivoTamaño" BIGINT,
    menciona TEXT, "enlaceCompartido" TEXT,
    "replyToId" INTEGER, "replyToUser" TEXT, "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT, "reenviadoDeChat" TEXT, "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false, "fechaEdicion" TIMESTAMP(3),
    prioridad INTEGER NOT NULL DEFAULT 0,
    fecha TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_grupal_leidos (
    id SERIAL PRIMARY KEY,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_grupal_leidos_uq UNIQUE("mensajeId","usuarioNickname")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_archivos (
    id SERIAL PRIMARY KEY,
    "nombreOriginal" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamaño" BIGINT NOT NULL,
    "publicId" TEXT,
    url TEXT NOT NULL,
    "mensajeId" INTEGER,
    "tipoChatMensaje" TEXT,
    "subidoPor" TEXT NOT NULL,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chat_pins (
    id SERIAL PRIMARY KEY,
    "usuarioNickname" TEXT NOT NULL,
    "tipoChat" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_pins_uq UNIQUE("usuarioNickname","tipoChat","chatId")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_destacados (
    id SERIAL PRIMARY KEY,
    "usuarioNickname" TEXT NOT NULL,
    "tipoChat" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_destacados_uq UNIQUE("usuarioNickname","tipoChat","chatId","mensajeId")
  )`,
  `CREATE TABLE IF NOT EXISTS chat_notificaciones_config (
    id SERIAL PRIMARY KEY,
    "usuarioNickname" TEXT NOT NULL UNIQUE,
    "notificacionesActivas" INTEGER NOT NULL DEFAULT 1,
    "sonidoActivo" INTEGER NOT NULL DEFAULT 1,
    "gruposActivos" INTEGER NOT NULL DEFAULT 1,
    "privadosActivos" INTEGER NOT NULL DEFAULT 1,
    "generalActivo" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

try {
  for (const ddl of CHAT_DDL) {
    await prisma.$executeRawUnsafe(ddl);
  }
  console.log("[startup] tablas de chat verificadas OK");
} catch (err) {
  console.error("[startup] error al verificar tablas de chat:", err?.message);
}

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`COPMEC API listening on port ${PORT}`);
});
