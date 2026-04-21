// Cliente Prisma SQLite para el chat (disco persistente /var/data/chat.db)
import { PrismaClient } from "../../node_modules/.prisma/chat-client/index.js";
import { PrismaBetterSQLite } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dbUrl = process.env.CHAT_DB_URL ?? "file:/var/data/chat.db";
const dbPath = dbUrl.replace(/^file:/, "");

try { mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true }); } catch {}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const adapter = new PrismaBetterSQLite(sqlite);
export const prismaChat = new PrismaClient({ adapter });
