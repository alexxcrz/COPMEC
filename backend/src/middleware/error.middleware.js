export function errorHandler(err, _req, res, _next) {
  const message = String(err?.message || "");
  const lowerMessage = message.toLowerCase();
  const isDbAuthError =
    lowerMessage.includes("authentication failed against the database server") ||
    lowerMessage.includes("sasl") ||
    lowerMessage.includes("password");
  const isCorsError = lowerMessage.includes("origin not allowed by cors");
  const isPayloadTooLarge = err?.code === "LIMIT_FILE_SIZE";
  const isBadUpload = err?.name === "MulterError";

  const status = err.status || (isCorsError ? 403 : isPayloadTooLarge ? 413 : isBadUpload ? 400 : isDbAuthError ? 503 : 500);

  res.status(status).json({
    ok: false,
    message: isDbAuthError
      ? "No se pudo conectar a PostgreSQL. Revisa DATABASE_URL en backend/.env"
      : isCorsError
        ? "Origen no permitido por la configuracion de seguridad."
        : isPayloadTooLarge
          ? "El archivo excede el tamano maximo permitido."
          : err.message || "Unexpected server error.",
  });
}
