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

// Las tablas de chat las crea prisma db push en el preDeployCommand (chat.prisma → SQLite)
console.log("[startup] iniciando servidor...");

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`COPMEC API listening on port ${PORT}`);
});
