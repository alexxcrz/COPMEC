import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function isPasswordHash(value) {
  return String(value || "").startsWith(`${HASH_PREFIX}$`);
}

export function hashPassword(password) {
  const normalizedPassword = String(password || "");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalizedPassword, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password, storedValue) {
  const normalizedStoredValue = String(storedValue || "");
  if (!normalizedStoredValue) return false;

  if (!isPasswordHash(normalizedStoredValue)) {
    const incomingPassword = Buffer.from(String(password || ""));
    const storedPassword = Buffer.from(normalizedStoredValue);
    if (incomingPassword.length !== storedPassword.length) return false;
    return timingSafeEqual(incomingPassword, storedPassword);
  }

  const [, salt, originalHash] = normalizedStoredValue.split("$");
  if (!salt || !originalHash) return false;

  const candidateHash = scryptSync(String(password || ""), salt, KEY_LENGTH).toString("hex");
  return timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(originalHash, "hex"));
}