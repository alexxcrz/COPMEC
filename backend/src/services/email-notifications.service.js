import nodemailer from "nodemailer";

const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").trim().toLowerCase() === "true";
const SMTP_FROM = String(process.env.SMTP_FROM || SMTP_USER || "").trim();
const EMAIL_NOTIFICATIONS_ENABLED = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "true").trim().toLowerCase() !== "false";

let transporter = null;
let initialized = false;

function hasSmtpConfig() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
}

function getTransporter() {
  if (initialized) return transporter;
  initialized = true;

  if (!EMAIL_NOTIFICATIONS_ENABLED) {
    console.log("[Email] Notificaciones por correo desactivadas (EMAIL_NOTIFICATIONS_ENABLED=false)");
    return null;
  }

  if (!hasSmtpConfig()) {
    console.log("[Email] SMTP no configurado; notificaciones por correo desactivadas");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

function isLikelyEmail(value) {
  const email = String(value || "").trim();
  return Boolean(email && email.includes("@") && email.includes("."));
}

export function canSendEmailNotifications() {
  return Boolean(getTransporter());
}

export async function sendIncidenciaAssignedEmail({
  to,
  incidenciaTitle,
  incidenciaPriority,
  assignedByName,
  assignedToName,
}) {
  if (!isLikelyEmail(to)) return { ok: false, reason: "invalid_email" };
  const transport = getTransporter();
  if (!transport) return { ok: false, reason: "smtp_not_configured" };

  const safePriority = String(incidenciaPriority || "media").trim();
  const safeTitle = String(incidenciaTitle || "Incidencia").trim() || "Incidencia";
  const safeAssignedBy = String(assignedByName || "Sistema").trim() || "Sistema";
  const safeAssignedTo = String(assignedToName || "usuario").trim() || "usuario";

  const subject = `[COPMEC] Nueva incidencia asignada (${safePriority})`;
  const text = [
    `Hola ${safeAssignedTo},`,
    "",
    "Se te asigno una incidencia en COPMEC:",
    `- Titulo: ${safeTitle}`,
    `- Prioridad: ${safePriority}`,
    `- Asignado por: ${safeAssignedBy}`,
    "",
    "Ingresa al modulo de Incidencias para revisarla.",
  ].join("\n");

  await transport.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
  });

  return { ok: true };
}
