import { Router } from "express";
import { requireAuth, requireWarehouseAction } from "../middleware/auth.middleware.js";
import { processCopmecAIMessage } from "../services/copmecai.service.js";

export const copmecAiRouter = Router();

/**
 * POST /api/copmec-ai/chat
 * Envía un mensaje al Cerebro Operativo de COPMEC.
 * Requiere permiso: useCopmecAI
 */
copmecAiRouter.post("/chat", requireAuth, requireWarehouseAction("useCopmecAI"), (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ ok: false, message: "Se requiere un mensaje válido." });
    return;
  }

  if (message.trim().length > 1000) {
    res.status(400).json({ ok: false, message: "El mensaje supera el límite permitido de 1000 caracteres." });
    return;
  }

  const result = processCopmecAIMessage(req.auth, message.trim());

  if (!result.ok) {
    res.status(400).json({ ok: false, message: result.message || "No fue posible procesar el mensaje." });
    return;
  }

  res.json({ ok: true, response: result.response, intent: result.intent });
});
