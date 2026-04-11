export function errorHandler(err, _req, res, _next) {
  const message = String(err?.message || "");
  const isDbAuthError =
    message.toLowerCase().includes("authentication failed against the database server") ||
    message.toLowerCase().includes("sasl") ||
    message.toLowerCase().includes("password");

  const status = err.status || (isDbAuthError ? 503 : 500);

  res.status(status).json({
    ok: false,
    message: isDbAuthError
      ? "No se pudo conectar a PostgreSQL. Revisa DATABASE_URL en backend/.env"
      : err.message || "Unexpected server error.",
  });
}
