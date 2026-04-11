import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const valid =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.endsWith(".csv") ||
    file.originalname.endsWith(".xlsx") ||
    file.originalname.endsWith(".xls");

  if (!valid) {
    cb(new Error("Archivo no soportado. Usa CSV o XLSX."));
    return;
  }

  cb(null, true);
}

export const importUpload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter,
});
