// Cliente Prisma separado para el chat (SQLite en disco persistente /var/data/chat.db)
import { PrismaClient } from "../../node_modules/.prisma/chat-client/index.js";

export const prismaChat = new PrismaClient({
  datasourceUrl: process.env.CHAT_DB_URL ?? "file:/var/data/chat.db",
});
