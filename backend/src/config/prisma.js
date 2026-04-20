import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const rawUrl = process.env.DATABASE_URL;

// Parsea la URL y devuelve campos explícitos para que pg NO use PGHOST/PGPORT del entorno.
// Render inyecta PGHOST=/var/data (socket Unix) que sobreescribe cualquier connectionString.
function buildPoolConfig(url) {
  if (!url) {
    console.error("[prisma] DATABASE_URL no está definida");
    return {};
  }
  try {
    const u = new URL(url);
    // Eliminar ?host si apunta a socket Unix
    const hostParam = u.searchParams.get("host");
    if (hostParam?.startsWith("/")) {
      console.log(`[prisma] Ignorando socket host=${hostParam}`);
    }
    const host = u.hostname;
    const port = parseInt(u.port || "5432", 10);
    const database = u.pathname.replace(/^\//, "");
    const user = decodeURIComponent(u.username);
    const password = decodeURIComponent(u.password);
    console.log(`[prisma] Conectando TCP → host=${host} port=${port} db=${database} user=${user}`);
    return { host, port, database, user, password, ssl: { rejectUnauthorized: false } };
  } catch (e) {
    console.error("[prisma] URL inválida:", e.message);
    return { connectionString: url };
  }
}

const pool = new Pool(buildPoolConfig(rawUrl));

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };
