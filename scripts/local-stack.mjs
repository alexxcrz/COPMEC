import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const APP_PORTS = [
  { name: "backend", port: 4000 },
  { name: "frontend", port: 5173 },
];

const DATABASE_SERVICE = {
  name: "postgresql-x64-18",
  port: 5432,
  label: "postgresql",
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function runWindowsCommand(command, args) {
  try {
    const result = await execFileAsync(command, args, { windowsHide: true, maxBuffer: 1024 * 1024 });
    return {
      ok: true,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      code: 0,
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message || "",
      code: Number(error.code || 1),
    };
  }
}

async function getWindowsListeners() {
  const result = await runWindowsCommand("netstat", ["-ano", "-p", "tcp"]);
  if (!result.ok) {
    throw new Error(`Could not inspect TCP listeners: ${result.stderr.trim() || result.stdout.trim()}`);
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[0] === "TCP" && parts[3] === "LISTENING")
    .map((parts) => {
      const localAddress = parts[1];
      const localPort = Number(localAddress.split(":").at(-1));
      return {
        localPort,
        pid: Number(parts[4]),
      };
    });
}

async function getServiceState(serviceName) {
  const result = await runWindowsCommand("sc.exe", ["query", serviceName]);
  const combined = `${result.stdout}\n${result.stderr}`;
  const normalized = combined.toLowerCase();

  if (combined.includes("FAILED 1060")) {
    return { exists: false, state: "missing" };
  }

  const stateLine = combined
    .split(/\r?\n/)
    .find((line) => line.includes("STATE") || line.includes("ESTADO"));

  if (!stateLine) {
    return { exists: true, state: "unknown", detail: combined.trim() };
  }

  if (normalized.includes("access is denied") || normalized.includes("acceso denegado")) {
    return { exists: true, state: "permission-required" };
  }

  if (stateLine.includes("RUNNING") || stateLine.includes("EJECUTANDO")) {
    return { exists: true, state: "running" };
  }

  if (stateLine.includes("STOPPED") || stateLine.includes("DETENIDO")) {
    return { exists: true, state: "stopped" };
  }

  return { exists: true, state: "pending", detail: stateLine.trim() };
}

function findListener(listeners, port) {
  return listeners.find((listener) => listener.localPort === port) || null;
}

async function printStatus() {
  const listeners = await getWindowsListeners();

  for (const service of APP_PORTS) {
    const listener = findListener(listeners, service.port);
    if (listener) {
      log(`${service.name}: running on ${service.port} (PID ${listener.pid})`);
    } else {
      log(`${service.name}: stopped on ${service.port}`);
    }
  }

  const databaseListener = findListener(listeners, DATABASE_SERVICE.port);
  const databaseService = await getServiceState(DATABASE_SERVICE.name);
  const databaseState = databaseListener ? `running on ${DATABASE_SERVICE.port} (PID ${databaseListener.pid})` : `stopped on ${DATABASE_SERVICE.port}`;
  const serviceState = databaseService.exists ? databaseService.state : "missing";
  log(`${DATABASE_SERVICE.label}: ${databaseState}; Windows service ${DATABASE_SERVICE.name} is ${serviceState}`);
  log("Note: local PostgreSQL is external to npm run dev. Render uses its own managed database from render.yaml.");
}

async function stopAppPorts() {
  const listeners = await getWindowsListeners();
  const appPids = [...new Set(APP_PORTS.map((service) => findListener(listeners, service.port)?.pid).filter(Boolean))];

  if (!appPids.length) {
    log("No COPMEC app processes were listening on 4000 or 5173.");
    return;
  }

  for (const pid of appPids) {
    const result = await runWindowsCommand("taskkill", ["/PID", String(pid), "/T", "/F"]);
    if (result.ok) {
      log(`Stopped COPMEC process PID ${pid}.`);
      continue;
    }

    throw new Error(`Could not stop PID ${pid}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
}

async function stopDatabaseService() {
  const result = await runWindowsCommand("sc.exe", ["stop", DATABASE_SERVICE.name]);
  const combined = `${result.stdout}\n${result.stderr}`.trim();

  if (combined.includes("FAILED 5") || combined.toLowerCase().includes("access is denied") || combined.toLowerCase().includes("acceso denegado")) {
    log(`Could not stop ${DATABASE_SERVICE.name} without administrator permissions.`);
    return false;
  }

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const state = await getServiceState(DATABASE_SERVICE.name);
    if (state.state === "stopped" || state.state === "missing") {
      log(`Stopped ${DATABASE_SERVICE.name}.`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  log(`Stop requested for ${DATABASE_SERVICE.name}, but it did not report Stopped within 20 seconds.`);
  return false;
}

async function stopStack(withDatabase) {
  await stopAppPorts();

  if (withDatabase) {
    await stopDatabaseService();
  } else {
    log("Local PostgreSQL was left running on purpose. Use --with-db if you want to stop it too.");
  }

  await printStatus();
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("local-stack.mjs is currently implemented for Windows only.");
  }

  const mode = process.argv[2] || "status";
  const withDatabase = process.argv.includes("--with-db");

  if (mode === "status") {
    await printStatus();
    return;
  }

  if (mode === "stop") {
    await stopStack(withDatabase);
    return;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

main().catch((error) => {
  process.stderr.write(`COPMEC local stack error: ${error.message}\n`);
  process.exit(1);
});