import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";
import readline from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm" : "npm";

const services = [
  {
    name: "backend",
    cwd: path.join(repoRoot, "backend"),
    port: 4000,
    url: "http://127.0.0.1:4000/api/health",
    args: ["run", "dev"],
    isReady: async () => {
      try {
        const response = await fetch("http://127.0.0.1:4000/api/health", {
          signal: AbortSignal.timeout(1500),
        });
        if (!response.ok) return false;
        const payload = await response.json();
        return payload?.ok === true;
      } catch {
        return false;
      }
    },
  },
  {
    name: "frontend",
    cwd: path.join(repoRoot, "frontend"),
    port: 5173,
    url: "http://127.0.0.1:5173",
    args: ["run", "dev", "--", "--host", "0.0.0.0"],
    isReady: async () => {
      try {
        const response = await fetch("http://127.0.0.1:5173", {
          signal: AbortSignal.timeout(1500),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  },
];

let shuttingDown = false;
const childProcesses = new Map();

function log(message) {
  process.stdout.write(`${message}\n`);
}

function attachLogger(stream, prefix) {
  const streamReader = readline.createInterface({ input: stream });
  streamReader.on("line", (line) => {
    log(`[${prefix}] ${line}`);
  });
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function waitForExit(childProcess) {
  return new Promise((resolve) => {
    childProcess.once("exit", () => resolve());
  });
}

async function stopChild(childProcess) {
  if (!childProcess || childProcess.exitCode !== null || childProcess.killed) {
    return;
  }

  if (process.platform === "win32") {
    const taskkill = spawn("taskkill", ["/pid", String(childProcess.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    await new Promise((resolve) => taskkill.once("exit", resolve));
    return;
  }

  childProcess.kill("SIGTERM");
  await waitForExit(childProcess);
}

async function stopAllChildren() {
  const pendingStops = [];
  for (const childProcess of childProcesses.values()) {
    pendingStops.push(stopChild(childProcess));
  }
  await Promise.allSettled(pendingStops);
}

function spawnService(service) {
  const childProcess = spawn(npmCommand, service.args, {
    cwd: service.cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: false,
    shell: process.platform === "win32",
  });

  childProcesses.set(service.name, childProcess);
  attachLogger(childProcess.stdout, service.name);
  attachLogger(childProcess.stderr, service.name);

  childProcess.once("exit", async (code, signal) => {
    childProcesses.delete(service.name);
    if (shuttingDown) {
      return;
    }

    const exitLabel = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    log(`[${service.name}] exited with ${exitLabel}`);
    shuttingDown = true;
    await stopAllChildren();
    process.exit(code ?? 0);
  });

  return childProcess;
}

async function waitUntilReady(service, childProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30000) {
    if (childProcess.exitCode !== null) {
      throw new Error(`${service.name} stopped before becoming ready.`);
    }

    if (await service.isReady()) {
      log(`${service.name} ready at ${service.url}`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`${service.name} did not become ready within 30 seconds.`);
}

async function handleShutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log(`Stopping COPMEC services after ${signal}...`);
  await stopAllChildren();
  process.exit(0);
}

process.on("SIGINT", () => {
  handleShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  handleShutdown("SIGTERM");
});

async function main() {
  log("Starting COPMEC development environment...");

  const launchQueue = [];
  for (const service of services) {
    const healthy = await service.isReady();
    if (healthy) {
      log(`${service.name} already running on port ${service.port}.`);
      continue;
    }

    const portOpen = await isPortOpen(service.port);
    if (portOpen) {
      throw new Error(`Port ${service.port} is already in use by another process. Free it and try again.`);
    }

    launchQueue.push(service);
  }

  if (!launchQueue.length) {
    log("COPMEC is already running.");
    log("Frontend: http://localhost:5173/");
    log("Backend: http://localhost:4000/api/health");
    return;
  }

  // Start services sequentially: backend must be ready before frontend launches
  // so the browser never hits a proxy ECONNREFUSED on the SSE endpoint.
  for (const service of launchQueue) {
    log(`Launching ${service.name} on port ${service.port}...`);
    const childProcess = spawnService(service);
    await waitUntilReady(service, childProcess);
  }

  log("COPMEC ready.");
  log("Frontend: http://localhost:5173/");
  log("Backend: http://localhost:4000/api/health");
}

main().catch(async (error) => {
  shuttingDown = true;
  await stopAllChildren();
  process.stderr.write(`COPMEC dev runner failed: ${error.message}\n`);
  process.exit(1);
});