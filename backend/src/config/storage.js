const internalOnlyRaw = String(process.env.INTERNAL_STORAGE_ONLY || "true").trim().toLowerCase();

export const INTERNAL_STORAGE_ONLY = internalOnlyRaw !== "false";

const INTERNAL_PATH_PREFIXES = [
  "/api/uploads/files/",
  "/api/biblioteca/files/",
];

export function isInternalStorageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) return false;
  return INTERNAL_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));
}
