const COPMEC_GENERIC_PACKAGE_HEADER = "COPMEC::PACKAGE::V1";
const COPMEC_GENERIC_PACKAGE_SECRET = "COPMEC_PACKAGE_APP_LOCK_V1";

export const COPMEC_HISTORY_PACKAGE_HEADER = "COPMEC::HISTORY::V1";
export const COPMEC_HISTORY_PACKAGE_SECRET = "COPMEC_HISTORY_PACKAGE_APP_LOCK_V1";

function uint8ToBase64(bytes) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function base64ToUint8(base64Value) {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveCopmecCryptoKey(secret, saltBytes) {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const baseKey = await crypto.subtle.importKey("raw", secretBytes, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 120000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function sanitizeCopmecFileBaseName(value, fallback = "archivo_copmec") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || fallback;
}

export function triggerCopmecDownload(packageText, fileName) {
  const safeFileName = String(fileName || "archivo.copmec").trim() || "archivo.copmec";
  const blob = new Blob([String(packageText || "")], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function buildEncryptedCopmecPackage(payload, options = {}) {
  const header = String(options.header || COPMEC_GENERIC_PACKAGE_HEADER).trim() || COPMEC_GENERIC_PACKAGE_HEADER;
  const secret = String(options.secret || COPMEC_GENERIC_PACKAGE_SECRET).trim() || COPMEC_GENERIC_PACKAGE_SECRET;
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveCopmecCryptoKey(secret, salt);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload || {})),
  );

  return `${header}\n${JSON.stringify({
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    data: uint8ToBase64(new Uint8Array(encryptedBuffer)),
  })}`;
}

export async function parseEncryptedCopmecPackage(packageText, options = {}) {
  const expectedHeader = String(options.header || COPMEC_GENERIC_PACKAGE_HEADER).trim() || COPMEC_GENERIC_PACKAGE_HEADER;
  const secret = String(options.secret || COPMEC_GENERIC_PACKAGE_SECRET).trim() || COPMEC_GENERIC_PACKAGE_SECRET;
  const normalizedText = String(packageText || "").trim();
  const [header, ...restLines] = normalizedText.split(/\r?\n/);
  if (header !== expectedHeader) {
    throw new Error("Archivo no compatible con COPMEC.");
  }

  const envelope = JSON.parse(restLines.join("\n"));
  const salt = base64ToUint8(String(envelope?.salt || ""));
  const iv = base64ToUint8(String(envelope?.iv || ""));
  const encryptedData = base64ToUint8(String(envelope?.data || ""));
  const key = await deriveCopmecCryptoKey(secret, salt);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
}

export function buildCopmecHistoryFileName(fileSuffix = "historial") {
  const safeSuffix = sanitizeCopmecFileBaseName(fileSuffix, "historial");
  return `copmec_${safeSuffix}.copmec`;
}

export async function buildEncryptedCopmecHistoryPackage(payload) {
  return buildEncryptedCopmecPackage(payload, {
    header: COPMEC_HISTORY_PACKAGE_HEADER,
    secret: COPMEC_HISTORY_PACKAGE_SECRET,
  });
}

export async function parseEncryptedCopmecHistoryPackage(packageText) {
  const payload = await parseEncryptedCopmecPackage(packageText, {
    header: COPMEC_HISTORY_PACKAGE_HEADER,
    secret: COPMEC_HISTORY_PACKAGE_SECRET,
  });
  if (String(payload?.format || "") !== "COPMEC_HISTORY_V1") {
    throw new Error("El archivo .copmec no contiene un historial válido.");
  }
  return payload;
}