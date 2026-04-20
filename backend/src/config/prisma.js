import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

// Log diagnóstico (enmascara la contraseña)
try {
  if (rawUrl) {
    const u = new URL(rawUrl);
    console.log(`[prisma] DATABASE_URL → protocol=${u.protocol} host=${u.hostname} port=${u.port} path=${u.pathname} host_param=${u.searchParams.get("host") ?? "n/a"}`);
  } else {
    console.warn("[prisma] DATABASE_URL no está definida — pg usará variables PGHOST/PGPORT del entorno");
    console.log(`[prisma] PGHOST=${process.env.PGHOST ?? "n/a"} PGPORT=${process.env.PGPORT ?? "n/a"} PGDATABASE=${process.env.PGDATABASE ?? "n/a"}`);
  }
} catch (e) {
  console.warn("[prisma] DATABASE_URL no es una URL válida:", e.message);
}

// Convierte la URL a conexión TCP eliminando cualquier socket Unix del parámetro ?host=
function buildPoolConfig(url) {
  if (!url) {
    // Sin DATABASE_URL no podemos hacer nada útil — fallará con error claro
    return {};
  }
  try {
    const u = new URL(url);
    // Eliminar ?host=... si apunta a socket Unix
    const hostParam = u.searchParams.get("host");
    if (hostParam?.startsWith("/")) {
      u.searchParams.delete("host");
      console.log(`[prisma] Eliminado parámetro socket host=${hostParam}, usando hostname=${u.hostname}`);
    }
    // Si no hay hostname, no podemos conectar por TCP
    if (!u.hostname) {
      console.error("[prisma] La URL no tiene hostname TCP — verifica DATABASE_URL en el entorno de Render");
      return { connectionString: url };
    }
    if (!u.port) u.port = "5432";
    return {
      connectionString: u.toString(),
      ssl: { rejectUnauthorized: false },
    };
  } catch {
    return { connectionString: url };
  }
}

const pool = new Pool(buildPoolConfig(rawUrl));

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
