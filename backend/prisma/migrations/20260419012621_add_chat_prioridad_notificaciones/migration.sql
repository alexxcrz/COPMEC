-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('text', 'number', 'checkbox', 'select', 'file', 'date');

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "ColumnType" NOT NULL,
    "position" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "targetBoardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Row" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,4),
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" JSONB,
    "fileUrl" TEXT,
    "fileThumbUrl" TEXT,
    "filePublicId" TEXT,
    "fileMimeType" TEXT,
    "linkedBoardId" TEXT,
    "linkedRowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_general" (
    "id" SERIAL NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "usuarioPhoto" TEXT,
    "mensaje" TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "archivoTamaño" BIGINT,
    "menciona" TEXT,
    "enlaceCompartido" TEXT,
    "replyToId" INTEGER,
    "replyToUser" TEXT,
    "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT,
    "reenviadoDeChat" TEXT,
    "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEdicion" TIMESTAMP(3),
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_general_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_general_leidos" (
    "id" SERIAL NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_general_leidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_privado" (
    "id" SERIAL NOT NULL,
    "deNickname" TEXT NOT NULL,
    "paraNickname" TEXT NOT NULL,
    "dePhoto" TEXT,
    "mensaje" TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "archivoTamaño" BIGINT,
    "menciona" TEXT,
    "enlaceCompartido" TEXT,
    "replyToId" INTEGER,
    "replyToUser" TEXT,
    "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT,
    "reenviadoDeChat" TEXT,
    "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEdicion" TIMESTAMP(3),
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_privado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_privado_leidos" (
    "id" SERIAL NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_privado_leidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_privado_borrados" (
    "id" SERIAL NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "otroNickname" TEXT NOT NULL,
    "borradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_privado_borrados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoPor" TEXT NOT NULL,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    "foto" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupos_miembros" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "unidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupos_miembros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupos_administradores" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupos_administradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupos_solicitudes" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupos_solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupos_restricciones" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "restriccionTipo" TEXT NOT NULL DEFAULT 'sin_mensajes',
    "duracionMinutos" INTEGER,
    "fechaFin" TIMESTAMP(3),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupos_restricciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupal" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "usuarioPhoto" TEXT,
    "mensaje" TEXT NOT NULL,
    "tipoMensaje" TEXT NOT NULL DEFAULT 'texto',
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "archivoTamaño" BIGINT,
    "menciona" TEXT,
    "enlaceCompartido" TEXT,
    "replyToId" INTEGER,
    "replyToUser" TEXT,
    "replyToText" TEXT,
    "reenviadoDeUsuario" TEXT,
    "reenviadoDeChat" TEXT,
    "reenviadoDeTipo" TEXT,
    "mensajeEditado" BOOLEAN NOT NULL DEFAULT false,
    "fechaEdicion" TIMESTAMP(3),
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_grupal_leidos" (
    "id" SERIAL NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "fechaLeido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_grupal_leidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_archivos" (
    "id" SERIAL NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamaño" BIGINT NOT NULL,
    "publicId" TEXT,
    "url" TEXT NOT NULL,
    "mensajeId" INTEGER,
    "tipoChatMensaje" TEXT,
    "subidoPor" TEXT NOT NULL,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_pins" (
    "id" SERIAL NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "tipoChat" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_destacados" (
    "id" SERIAL NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "tipoChat" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "mensajeId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_destacados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_notificaciones_config" (
    "id" SERIAL NOT NULL,
    "usuarioNickname" TEXT NOT NULL,
    "notificacionesActivas" INTEGER NOT NULL DEFAULT 1,
    "sonidoActivo" INTEGER NOT NULL DEFAULT 1,
    "gruposActivos" INTEGER NOT NULL DEFAULT 1,
    "privadosActivos" INTEGER NOT NULL DEFAULT 1,
    "generalActivo" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_notificaciones_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_name_idx" ON "Board"("name");

-- CreateIndex
CREATE INDEX "Column_boardId_position_idx" ON "Column"("boardId", "position");

-- CreateIndex
CREATE INDEX "Column_targetBoardId_idx" ON "Column"("targetBoardId");

-- CreateIndex
CREATE UNIQUE INDEX "Column_boardId_key_key" ON "Column"("boardId", "key");

-- CreateIndex
CREATE INDEX "Row_boardId_position_idx" ON "Row"("boardId", "position");

-- CreateIndex
CREATE INDEX "Cell_columnId_idx" ON "Cell"("columnId");

-- CreateIndex
CREATE INDEX "Cell_linkedBoardId_linkedRowId_idx" ON "Cell"("linkedBoardId", "linkedRowId");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_rowId_columnId_key" ON "Cell"("rowId", "columnId");

-- CreateIndex
CREATE INDEX "chat_general_usuarioNickname_idx" ON "chat_general"("usuarioNickname");

-- CreateIndex
CREATE INDEX "chat_general_fecha_idx" ON "chat_general"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "chat_general_leidos_mensajeId_usuarioNickname_key" ON "chat_general_leidos"("mensajeId", "usuarioNickname");

-- CreateIndex
CREATE INDEX "chat_privado_deNickname_idx" ON "chat_privado"("deNickname");

-- CreateIndex
CREATE INDEX "chat_privado_paraNickname_idx" ON "chat_privado"("paraNickname");

-- CreateIndex
CREATE INDEX "chat_privado_fecha_idx" ON "chat_privado"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "chat_privado_leidos_mensajeId_usuarioNickname_key" ON "chat_privado_leidos"("mensajeId", "usuarioNickname");

-- CreateIndex
CREATE UNIQUE INDEX "chat_privado_borrados_usuarioNickname_otroNickname_key" ON "chat_privado_borrados"("usuarioNickname", "otroNickname");

-- CreateIndex
CREATE INDEX "chat_grupos_creadoPor_idx" ON "chat_grupos"("creadoPor");

-- CreateIndex
CREATE UNIQUE INDEX "chat_grupos_miembros_grupoId_usuarioNickname_key" ON "chat_grupos_miembros"("grupoId", "usuarioNickname");

-- CreateIndex
CREATE UNIQUE INDEX "chat_grupos_administradores_grupoId_usuarioNickname_key" ON "chat_grupos_administradores"("grupoId", "usuarioNickname");

-- CreateIndex
CREATE INDEX "chat_grupos_solicitudes_grupoId_estado_idx" ON "chat_grupos_solicitudes"("grupoId", "estado");

-- CreateIndex
CREATE INDEX "chat_grupos_restricciones_grupoId_usuarioNickname_activa_idx" ON "chat_grupos_restricciones"("grupoId", "usuarioNickname", "activa");

-- CreateIndex
CREATE INDEX "chat_grupal_grupoId_fecha_idx" ON "chat_grupal"("grupoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "chat_grupal_leidos_mensajeId_usuarioNickname_key" ON "chat_grupal_leidos"("mensajeId", "usuarioNickname");

-- CreateIndex
CREATE INDEX "chat_archivos_subidoPor_idx" ON "chat_archivos"("subidoPor");

-- CreateIndex
CREATE UNIQUE INDEX "chat_pins_usuarioNickname_tipoChat_chatId_key" ON "chat_pins"("usuarioNickname", "tipoChat", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_destacados_usuarioNickname_tipoChat_chatId_mensajeId_key" ON "chat_destacados"("usuarioNickname", "tipoChat", "chatId", "mensajeId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_notificaciones_config_usuarioNickname_key" ON "chat_notificaciones_config"("usuarioNickname");

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_targetBoardId_fkey" FOREIGN KEY ("targetBoardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Row" ADD CONSTRAINT "Row_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "Row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_general_leidos" ADD CONSTRAINT "chat_general_leidos_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "chat_general"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_privado_leidos" ADD CONSTRAINT "chat_privado_leidos_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "chat_privado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupos_miembros" ADD CONSTRAINT "chat_grupos_miembros_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupos_administradores" ADD CONSTRAINT "chat_grupos_administradores_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupos_solicitudes" ADD CONSTRAINT "chat_grupos_solicitudes_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupos_restricciones" ADD CONSTRAINT "chat_grupos_restricciones_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupal" ADD CONSTRAINT "chat_grupal_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_grupal_leidos" ADD CONSTRAINT "chat_grupal_leidos_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "chat_grupal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_pins" ADD CONSTRAINT "chat_pins_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_destacados" ADD CONSTRAINT "chat_destacados_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "chat_grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
