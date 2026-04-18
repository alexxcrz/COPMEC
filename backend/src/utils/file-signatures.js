import path from "node:path";

function startsWithBytes(buffer, signature) {
  if (!buffer || buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function isLikelyTextBuffer(buffer) {
  if (!buffer || buffer.length === 0) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  let printable = 0;

  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126) || byte >= 160) {
      printable += 1;
      continue;
    }
    if (byte === 0) return false;
  }

  return printable / sample.length >= 0.85;
}

function matchesWebp(buffer) {
  if (!buffer || buffer.length < 12) return false;
  return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

export function isAllowedUploadBuffer(file) {
  const extension = path.extname(String(file?.originalname || "")).toLowerCase();
  const buffer = file?.buffer;
  if (!buffer?.length) return false;

  if ([".jpg", ".jpeg"].includes(extension)) {
    return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
  }
  if (extension === ".png") {
    return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (extension === ".gif") {
    return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  }
  if (extension === ".webp") {
    return matchesWebp(buffer);
  }
  if (extension === ".pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  // xlsx, docx, txt already passed multer fileFilter — accept them
  if (extension === ".xlsx" || extension === ".docx") {
    return startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]);
  }
  if (extension === ".xls") {
    return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  if (extension === ".doc") {
    return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }
  if (extension === ".txt") {
    return isLikelyTextBuffer(buffer);
  }

  return false;
}

export function isAllowedImportBuffer(file) {
  const extension = path.extname(String(file?.originalname || "")).toLowerCase();
  const buffer = file?.buffer;
  if (!buffer?.length) return false;

  if (extension === ".csv") {
    return isLikelyTextBuffer(buffer);
  }
  if (extension === ".xlsx") {
    return startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]);
  }
  if (extension === ".xls") {
    return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }

  return false;
}