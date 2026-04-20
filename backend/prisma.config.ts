import "dotenv/config";
import { defineConfig } from "prisma/config";

// Si DATABASE_URL no es URL válida (formato libpq con disco persistente),
// construir la URL desde las variables PG* que Render inyecta.
function resolveDbUrl(): string | undefined {
  const raw = process.env["DATABASE_URL"];
  if (raw) {
    try { new URL(raw); return raw; } catch {}
  }
  // Fallback a variables individuales
  const host = process.env["PGHOST"] ?? "localhost";
  const port = process.env["PGPORT"] ?? "5432";
  const db = process.env["PGDATABASE"];
  const user = process.env["PGUSER"];
  const pass = process.env["PGPASSWORD"];
  if (db && user) {
    return `postgresql://${user}:${pass ?? ""}@${host}:${port}/${db}`;
  }
  return raw;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDbUrl(),
  },
});
