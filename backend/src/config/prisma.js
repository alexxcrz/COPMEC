import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

// Intenta parsear como URL postgres://. Si falla (formato libpq key=value),
// devuelve {} para que pg use las variables PGHOST/PGDATABASE/PGUSER/PGPASSWORD
// que Render ya inyecta automáticamente cuando hay disco persistente con PostgreSQL.
function buildPoolConfig(url) {
  if (!url) {
    console.log("[prisma] Sin DATABASE_URL — usando variables PG* del entorno (disco persistente)");
    console.log(`[prisma] PGHOST=${process.env.PGHOST} PGDATABASE=${process.env.PGDATABASE} PGUSER=${process.env.PGUSER}`);
    return {};
  }
  try {
    const u = new URL(url);
    const hostParam = u.searchParams.get("host");
    if (hostParam?.startsWith("/")) {
      // Socket Unix en query param — usar socket directamente vía env vars
      console.log(`[prisma] URL contiene socket host=${hostParam} — delegando a variables PG* del entorno`);
      return {};
    }
    console.log(`[prisma] Conectando TCP → host=${u.hostname}:${u.port || 5432}`);
    return {
      host: u.hostname,
      port: parseInt(u.port || "5432", 10),
      database: u.pathname.replace(/^\//, ""),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    // Formato libpq (key=value) u otro — dejar que pg lo resuelva con env vars
    console.log("[prisma] DATABASE_URL no es URL estándar — usando variables PG* del entorno");
    console.log(`[prisma] PGHOST=${process.env.PGHOST} PGDATABASE=${process.env.PGDATABASE} PGUSER=${process.env.PGUSER}`);
    return {};
  }
}

const pool = new Pool(buildPoolConfig(rawUrl));

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
