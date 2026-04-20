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

// Verify chat tables exist; if not, run prisma db push to create them
try {
  await prisma.$queryRaw`SELECT 1 FROM chat_privado LIMIT 1`;
} catch (err) {
  const msg = String(err?.message || "");
  if (msg.includes("does not exist") || msg.includes("no existe") || err?.code === "42P01") {
    console.log("[startup] tablas de chat no encontradas, ejecutando prisma db push...");
    try {
      const { execSync } = await import("node:child_process");
      const schemaDir = path.resolve(__dirname, "..");
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        cwd: schemaDir,
        stdio: "inherit",
        env: process.env,
        timeout: 60000,
      });
      console.log("[startup] prisma db push completado OK");
    } catch (pushErr) {
      console.error("[startup] prisma db push falló:", pushErr?.message);
    }
  }
}

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`COPMEC API listening on port ${PORT}`);
});
