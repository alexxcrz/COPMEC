import { Router } from "express";
import { existsSync, createReadStream } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { requireAuth, requireWarehouseAction } from "../middleware/auth.middleware.js";
import { processCopmecAIMessage } from "../services/copmecai.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, "../../data/uploads/reports");

export const copmecAiRouter = Router();

/**
 * POST /api/copmec-ai/chat
 * Envía un mensaje al Cerebro Operativo de COPMEC.
 * Requiere permiso: useCopmecAI
 */
copmecAiRouter.post("/chat", requireAuth, requireWarehouseAction("useCopmecAI"), async (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ ok: false, message: "Se requiere un mensaje válido." });
    return;
  }

  if (message.trim().length > 1000) {
    res.status(400).json({ ok: false, message: "El mensaje supera el límite permitido de 1000 caracteres." });
    return;
  }

  const result = await processCopmecAIMessage(req.auth, message.trim());

  if (!result.ok) {
    res.status(400).json({ ok: false, message: result.message || "No fue posible procesar el mensaje." });
    return;
  }

  res.json({
    ok: true,
    response: result.response,
    intent: result.intent,
    reportToken: result.reportToken || null,
    dashboardFixed: result.dashboardFixed || false,
  });
});

/**
 * GET /api/copmec-ai/report/:token/:format
 * Descarga un reporte generado previamente.
 * format: "cop" | "pdf"
 */
copmecAiRouter.get("/report/:token/:format", requireAuth, requireWarehouseAction("useCopmecAI"), (req, res) => {
  const { token, format } = req.params;

  // Validar token: solo UUID v4
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    res.status(400).json({ ok: false, message: "Token inválido." });
    return;
  }

  if (format !== "cop" && format !== "pdf") {
    res.status(400).json({ ok: false, message: "Formato inválido. Use 'cop' o 'pdf'." });
    return;
  }

  const filePath = join(REPORTS_DIR, `${token}.${format}`);

  if (!existsSync(filePath)) {
    res.status(404).json({ ok: false, message: "El reporte ya expiró o no existe. Genera uno nuevo." });
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const fileName = `COPMEC-Reporte-${dateStr}.${format}`;

  const mimeType = format === "pdf" ? "application/pdf" : "application/octet-stream";
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  createReadStream(filePath).pipe(res);
});
