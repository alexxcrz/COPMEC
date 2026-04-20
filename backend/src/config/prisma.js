import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Render internal connectionString a veces incluye ?host=/var/data (socket Unix).
// Eliminamos ese parámetro y forzamos TCP con host/port explícitos.
function buildPoolConfig(rawUrl) {
  if (!rawUrl) return {};
  try {
    const u = new URL(rawUrl);
    // Si el host del query apunta a un socket, lo eliminamos
    if (u.searchParams.get("host")?.startsWith("/")) {
      u.searchParams.delete("host");
    }
    // Forzar puerto 5432 si no viene explícito
    if (!u.port) u.port = "5432";
    const clean = u.toString();
    return {
      connectionString: clean,
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    // Si la URL no es parseable, usarla tal cual
    return { connectionString: rawUrl };
  }
}

const pool = new Pool(buildPoolConfig(process.env.DATABASE_URL));

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
