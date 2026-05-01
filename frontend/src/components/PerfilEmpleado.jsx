// ── Perfil de Empleado ───────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";

// ── Constantes y utilidades ───────────────────────────────────────────────────

const PROFILE_SELF_EDIT_LIMIT = 1;
const MAX_PROFILE_COPMEC_FILES = 20;
const COPMEC_HISTORY_PACKAGE_HEADER = "COPMEC::HISTORY::V1";
const COPMEC_HISTORY_PACKAGE_SECRET = "COPMEC_HISTORY_PACKAGE_APP_LOCK_V1";

const ROLE_LEAD = "Lead";
const ROLE_SR   = "Senior (Sr)";
const ROLE_SSR  = "Semi-Senior (Ssr)";
const ROLE_JR   = "Junior (Jr)";

const ROLE_LEVEL = {
  [ROLE_JR]:  1,
  [ROLE_SSR]: 2,
  [ROLE_SR]:  3,
  [ROLE_LEAD]: 4,
};

const DEFAULT_JOB_TITLE_BY_ROLE = {
  [ROLE_LEAD]: "Líder de Operaciones",
  [ROLE_SR]:   "Senior de Operaciones",
  [ROLE_SSR]:  "Operador Semi-Senior",
  [ROLE_JR]:   "Operador Junior",
};

const ROLE_COLORS = {
  [ROLE_LEAD]: { bg: "#032121", color: "#fff" },
  [ROLE_SR]:   { bg: "#0f4f3a", color: "#fff" },
  [ROLE_SSR]:  { bg: "#1a7a5a", color: "#fff" },
  [ROLE_JR]:   { bg: "#e8f5ee", color: "#032121" },
};

function normalizeKeyLocal(value) {
  return (value || "").normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function normalizeRole(role) {
  const key = normalizeKeyLocal(role);
  if (key.includes("lead") || key.includes("maestro")) return ROLE_LEAD;
  if (key.includes("semi") || key.includes("ssr"))     return ROLE_SSR;
  if (key.includes("senior") || key.includes("administrador")) return ROLE_SR;
  return ROLE_JR;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getUserArea(user) {
  return String(user?.area || user?.department || "").trim();
}

// eslint-disable-next-line react-refresh/only-export-components
export function getUserJobTitle(user) {
  return String(user?.jobTitle || DEFAULT_JOB_TITLE_BY_ROLE[user?.role] || "").trim();
}

function canBypassSelfProfileEditLimit(user) {
  return (ROLE_LEVEL[normalizeRole(user?.role)] || 0) >= ROLE_LEVEL[ROLE_SR];
}

function getInitialsAvatar(name) {
  const parts = (name || "?").trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] || "?").toUpperCase();
  return initials;
}

function normalizeCopmecHistoryFiles(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry, index) => ({
      id: String(entry?.id || `copmec-${index + 1}`).trim(),
      fileName: String(entry?.fileName || "archivo.copmec").trim() || "archivo.copmec",
      importedAt: String(entry?.importedAt || new Date().toISOString()).trim() || new Date().toISOString(),
      periodLabel: String(entry?.periodLabel || "Periodo").trim() || "Periodo",
      records: Math.max(0, Number(entry?.records || 0)),
      packageText: String(entry?.packageText || "").trim(),
    }))
    .filter((entry) => entry.packageText)
    .slice(0, MAX_PROFILE_COPMEC_FILES);
}

function base64ToUint8(base64Value) {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveCopmecHistoryCryptoKey(saltBytes) {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(COPMEC_HISTORY_PACKAGE_SECRET);
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

async function parseEncryptedCopmecHistoryPackage(packageText) {
  const normalizedText = String(packageText || "").trim();
  const [header, ...restLines] = normalizedText.split(/\r?\n/);
  if (header !== COPMEC_HISTORY_PACKAGE_HEADER) {
    throw new Error("Archivo no compatible con COPMEC.");
  }
  const envelope = JSON.parse(restLines.join("\n"));
  const salt = base64ToUint8(String(envelope?.salt || ""));
  const iv = base64ToUint8(String(envelope?.iv || ""));
  const encryptedData = base64ToUint8(String(envelope?.data || ""));
  const key = await deriveCopmecHistoryCryptoKey(salt);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
  const decoder = new TextDecoder();
  const payload = JSON.parse(decoder.decode(decryptedBuffer));
  if (String(payload?.format || "") !== "COPMEC_HISTORY_V1") {
    throw new Error("El archivo .copmec no contiene un historial válido.");
  }
  return payload;
}

function buildProfileCopmecHistoryEntry({ packageText, payload, fileName }) {
  const safeFileName = String(fileName || "historial.copmec").trim() || "historial.copmec";
  return {
    id: `copmec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: safeFileName,
    importedAt: new Date().toISOString(),
    periodLabel: String(payload?.period?.label || "Periodo").trim() || "Periodo",
    records: Math.max(0, Number(payload?.summary?.records || (Array.isArray(payload?.rows) ? payload.rows.length : 0))),
    packageText: String(packageText || "").trim(),
  };
}

// ── Exports mantenidos por compatibilidad con App.jsx ─────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function createIdentityFormFromUser(currentUser) {
  return {
    name:             currentUser?.name     || "",
    email:            currentUser?.email    || "",
    area:             getUserArea(currentUser),
    jobTitle:         getUserJobTitle(currentUser),
    telefono:         currentUser?.telefono         || "",
    telefono_visible: currentUser?.telefono_visible ?? false,
    birthday:         currentUser?.birthday         || "",
  };
}

// Stubs mantenidos para no romper imports en App.jsx
export function EmployeeProfileSummarySection() { return null; }
export function EmployeeProfileDetailsSection()  { return null; }
export function EmployeeProfilePasswordSection() { return null; }
export function EmployeeProfileMessages()        { return null; }

// ── Componente interno: campo de información ──────────────────────────────────

function InfoField({ label, value, placeholder = "No definido", wide, children }) {
  return (
    <div className={`ep-field${wide ? " ep-field--wide" : ""}`}>
      <span className="ep-field__label">{label}</span>
      {children || <strong className="ep-field__value">{value || <span className="ep-field__empty">{placeholder}</span>}</strong>}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────

export function EmployeeProfileModal({ currentUser, passwordForm, onPasswordChange, onSubmit, onClose, onLogout, onUpdateIdentity }) {
  const [isEditMode, setIsEditMode]   = useState(false);
  const [activeTab, setActiveTab]     = useState("perfil");
  const [form, setForm]               = useState(() => createIdentityFormFromUser(currentUser));
  const [message, setMessage]         = useState("");
  const [pwOpen, setPwOpen]           = useState(false);
  const [saving, setSaving]           = useState(false);
  const [copmecPreview, setCopmecPreview] = useState(null);
  const [copmecDecisionOpen, setCopmecDecisionOpen] = useState(false);
  const [copmecDeleteTarget, setCopmecDeleteTarget] = useState(null);
  const [copmecSaving, setCopmecSaving] = useState(false);
  const copmecFileInputRef = useRef(null);

  const canBypass      = canBypassSelfProfileEditLimit(currentUser);
  const selfEditCount  = Number(currentUser?.selfIdentityEditCount ?? 0);
  const canEdit        = canBypass || selfEditCount < PROFILE_SELF_EDIT_LIMIT;
  const roleStyle      = ROLE_COLORS[normalizeRole(currentUser?.role)] || ROLE_COLORS[ROLE_JR];
  const initials       = getInitialsAvatar(currentUser?.name);
  const savedCopmecFiles = useMemo(
    () => normalizeCopmecHistoryFiles(currentUser?.copmecHistoryFiles),
    [currentUser?.copmecHistoryFiles],
  );

  useEffect(() => {
    setForm(createIdentityFormFromUser(currentUser));
    setMessage("");
    setIsEditMode(false);
    setActiveTab("perfil");
  }, [currentUser]);

  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage("");
  }

  function startEdit() {
    if (!canEdit) {
      setMessage("La autoedición ya fue utilizada. Pide apoyo a un Senior o Lead.");
      return;
    }
    setForm(createIdentityFormFromUser(currentUser));
    setIsEditMode(true);
    setMessage("");
  }

  async function save() {
    if (!form.name.trim() || !form.email.trim() || !form.area.trim() || !form.jobTitle.trim()) {
      setMessage("Nombre, acceso, área y cargo son obligatorios.");
      return;
    }
    setSaving(true);
    const result = await onUpdateIdentity({
      name:             form.name.trim(),
      username:         form.email.trim(),
      area:             form.area.trim(),
      jobTitle:         form.jobTitle.trim(),
      telefono:         form.telefono.trim(),
      telefono_visible: form.telefono_visible,
      birthday:         form.birthday.trim(),
    });
    setSaving(false);
    setMessage(result?.message || "");
    if (result?.ok) setIsEditMode(false);
  }

  async function persistCopmecFiles(nextFiles, successMessage) {
    setCopmecSaving(true);
    const identityBase = createIdentityFormFromUser(currentUser);
    const result = await onUpdateIdentity({
      name: identityBase.name,
      username: identityBase.email,
      area: identityBase.area,
      jobTitle: identityBase.jobTitle,
      telefono: identityBase.telefono,
      telefono_visible: identityBase.telefono_visible,
      birthday: identityBase.birthday,
      copmecHistoryFiles: normalizeCopmecHistoryFiles(nextFiles),
    });
    setCopmecSaving(false);
    setMessage(result?.message || "");
    if (result?.ok && successMessage) {
      setMessage(successMessage);
    }
    return Boolean(result?.ok);
  }

  async function exportCopmecPayloadToPdf(payload, fileBaseName = "historial_copmec") {
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (!rows.length) {
      setMessage("El archivo .copmec no contiene filas para exportar.");
      return;
    }
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      pdf.setFontSize(14);
      pdf.text("Historial operativo COPMEC (importado)", 36, 40);
      pdf.setFontSize(10);
      pdf.text(`Periodo: ${String(payload?.period?.label || "Periodo")}`, 36, 58);
      pdf.text(`Generado originalmente: ${String(payload?.generatedAt || "-")}`, 36, 74);
      pdf.text(`Registros: ${rows.length}`, 36, 90);

      autoTable(pdf, {
        startY: 104,
        head: [["Area", "Tablero", "Actividad", "Player", "Estado", "Fecha", "Inicio", "Fin", "Tiempo"]],
        body: rows.map((row) => [
          row.area || "-",
          row.tablero || "-",
          row.actividad || "-",
          row.player || "-",
          row.estado || "-",
          row.fecha || "-",
          row.inicio || "-",
          row.fin || "-",
          row.tiempo || "-",
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [3, 33, 33], textColor: [255, 255, 255] },
        theme: "grid",
      });

      const safeName = String(fileBaseName || "historial_copmec")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 80) || "historial_copmec";
      pdf.save(`${safeName}.pdf`);
    } catch (error) {
      setMessage(error?.message || "No se pudo exportar el archivo importado a PDF.");
    }
  }

  async function handleCopmecImportChange(event) {
    const file = event.target?.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const packageText = await file.text();
      const payload = await parseEncryptedCopmecHistoryPackage(packageText);
      setCopmecPreview({
        payload,
        packageText,
        fileName: String(file.name || "historial.copmec"),
        source: "upload",
      });
      setCopmecDecisionOpen(false);
      setMessage("Archivo .copmec cargado. Revisa el contenido antes de decidir si guardarlo.");
    } catch (error) {
      setMessage(error?.message || "No se pudo abrir el archivo .copmec.");
    }
  }

  async function openSavedCopmecFile(entry) {
    try {
      const payload = await parseEncryptedCopmecHistoryPackage(entry.packageText);
      setCopmecPreview({
        payload,
        packageText: entry.packageText,
        fileName: entry.fileName,
        source: "saved",
      });
      setCopmecDecisionOpen(false);
    } catch (error) {
      setMessage(error?.message || "No se pudo abrir este archivo guardado.");
    }
  }

  function requestCloseCopmecPreview() {
    if (!copmecPreview) return;
    if (copmecPreview.source === "upload") {
      setCopmecDecisionOpen(true);
      return;
    }
    setCopmecPreview(null);
  }

  async function confirmSaveImportedCopmec() {
    if (!copmecPreview?.packageText || !copmecPreview?.payload) {
      setCopmecDecisionOpen(false);
      setCopmecPreview(null);
      return;
    }
    const newEntry = buildProfileCopmecHistoryEntry({
      packageText: copmecPreview.packageText,
      payload: copmecPreview.payload,
      fileName: copmecPreview.fileName,
    });
    const nextFiles = [newEntry].concat(savedCopmecFiles).slice(0, MAX_PROFILE_COPMEC_FILES);
    const ok = await persistCopmecFiles(nextFiles, "Archivo .copmec guardado en tu perfil.");
    if (ok) {
      setCopmecDecisionOpen(false);
      setCopmecPreview(null);
    }
  }

  function discardImportedCopmec() {
    setCopmecDecisionOpen(false);
    setCopmecPreview(null);
    setMessage("El archivo importado fue descartado.");
  }

  async function removeSavedCopmecFile(fileId) {
    const nextFiles = savedCopmecFiles.filter((entry) => entry.id !== fileId);
    await persistCopmecFiles(nextFiles, "Archivo eliminado del historial del perfil.");
  }

  function requestRemoveSavedCopmecFile(entry) {
    if (!entry?.id) return;
    setCopmecDeleteTarget(entry);
  }

  async function confirmRemoveSavedCopmecFile() {
    if (!copmecDeleteTarget?.id) {
      setCopmecDeleteTarget(null);
      return;
    }
    await removeSavedCopmecFile(copmecDeleteTarget.id);
    setCopmecDeleteTarget(null);
  }

  return (
    <>
      <Modal
      open
      className="ep-modal"
      title=""
      confirmLabel="Cerrar"
      hideCancel
      onClose={onClose}
      footerActions={isEditMode
        ? [
            <button key="save"   type="button" className="ep-btn ep-btn--primary" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>,
            <button key="cancel" type="button" className="ep-btn ep-btn--ghost"   onClick={() => { setIsEditMode(false); setMessage(""); }}>Cancelar</button>,
            <button key="out"    type="button" className="ep-btn ep-btn--danger"  onClick={onLogout}>Cerrar sesión</button>,
          ]
        : [
            <button key="edit"   type="button" className="ep-btn ep-btn--primary" onClick={startEdit}>Editar perfil</button>,
            <button key="out"    type="button" className="ep-btn ep-btn--danger"  onClick={onLogout}>Cerrar sesión</button>,
          ]
      }
    >
      <div className="ep-body">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="ep-hero">
          <div className="ep-hero__avatar">{initials}</div>
          <div className="ep-hero__info">
            <div className="ep-hero__name">{currentUser.name}</div>
            <div className="ep-hero__meta">
              <span className="ep-hero__nick">@{currentUser.email}</span>
              <span className="ep-role-chip" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                {currentUser.role}
              </span>
              <span className={`ep-status-dot ${currentUser.isActive ? "ep-status-dot--active" : "ep-status-dot--inactive"}`} />
              <span className="ep-hero__status">{currentUser.isActive ? "Activo" : "Inactivo"}</span>
            </div>
            {!isEditMode && (
              <div className="ep-hero__job">{getUserJobTitle(currentUser) || "Sin cargo asignado"} · {getUserArea(currentUser) || "Sin área"}</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.25rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`ep-btn ${activeTab === "perfil" ? "ep-btn--primary" : "ep-btn--ghost"}`}
            onClick={() => setActiveTab("perfil")}
          >
            Perfil
          </button>
          <button
            type="button"
            className={`ep-btn ${activeTab === "copmec" ? "ep-btn--primary" : "ep-btn--ghost"}`}
            onClick={() => setActiveTab("copmec")}
          >
            Archivos .copmec ({savedCopmecFiles.length})
          </button>
        </div>

        {activeTab === "perfil" && (
          <>
        {/* ── IDENTIDAD ────────────────────────────────────────────────────── */}
        <div className="ep-section">
          <div className="ep-section__title">Identidad</div>
          <div className="ep-grid ep-grid--2">
            {isEditMode ? (
              <>
                <div className="ep-field ep-field--wide">
                  <label className="ep-field__label">Nombre completo</label>
                  <input className="ep-input" value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="Nombre del player" />
                </div>
                <div className="ep-field ep-field--wide">
                  <label className="ep-field__label">Player de acceso</label>
                  <input className="ep-input" value={form.email} onChange={(e) => field("email", e.target.value)} placeholder="Tu acceso" />
                </div>
              </>
            ) : (
              <>
                <InfoField label="Nombre completo" value={currentUser.name} wide />
                <InfoField label="Player de acceso" value={currentUser.email} wide />
              </>
            )}
          </div>
        </div>

        {/* ── ORGANIZACIÓN ─────────────────────────────────────────────────── */}
        <div className="ep-section">
          <div className="ep-section__title">Organización</div>
          <div className="ep-grid ep-grid--2">
            {isEditMode ? (
              <>
                <div className="ep-field ep-field--wide">
                  <label className="ep-field__label">Cargo</label>
                  <input className="ep-input" value={form.jobTitle} onChange={(e) => field("jobTitle", e.target.value)} placeholder="Ej: Encargado de Mejora Continua" />
                </div>
                <div className="ep-field">
                  <label className="ep-field__label">Área</label>
                  <input className="ep-input" value={form.area} onChange={(e) => field("area", e.target.value)} placeholder="Ej: ESTO" />
                </div>
                <InfoField label="Nivel interno" value={currentUser.role} />
              </>
            ) : (
              <>
                <InfoField label="Cargo" value={getUserJobTitle(currentUser)} wide />
                <InfoField label="Área" value={getUserArea(currentUser)} />
                <InfoField label="Nivel interno" value={currentUser.role} />
              </>
            )}
          </div>
        </div>

        {/* ── CONTACTO Y PERSONAL ──────────────────────────────────────────── */}
        <div className="ep-section">
          <div className="ep-section__title">Contacto y personal</div>
          <div className="ep-grid ep-grid--2">
            {isEditMode ? (
              <>
                <div className="ep-field">
                  <label className="ep-field__label">Teléfono</label>
                  <input className="ep-input" value={form.telefono} onChange={(e) => field("telefono", e.target.value)} placeholder="+52 664 123 4567" />
                </div>
                <div className="ep-field">
                  <label className="ep-field__label">Cumpleaños</label>
                  <input className="ep-input" type="date" value={form.birthday} onChange={(e) => field("birthday", e.target.value)} />
                </div>
                <div className="ep-field ep-field--wide ep-field--row">
                  <input
                    type="checkbox"
                    id="ep-tel-visible"
                    checked={form.telefono_visible}
                    onChange={(e) => field("telefono_visible", e.target.checked)}
                    style={{ accentColor: "#032121", width: 16, height: 16 }}
                  />
                  <label htmlFor="ep-tel-visible" className="ep-field__label" style={{ cursor: "pointer", margin: 0 }}>
                    Mostrar teléfono en mi perfil del chat
                  </label>
                </div>
              </>
            ) : (
              <>
                <InfoField
                  label={`Teléfono${currentUser.telefono ? (currentUser.telefono_visible ? " · visible" : " · oculto") : ""}`}
                  value={currentUser.telefono}
                  placeholder="No definido"
                />
                <InfoField label="Cumpleaños" value={currentUser.birthday} placeholder="No definido" />
              </>
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === "copmec" && (
        <div className="ep-section">
          <div className="ep-section__title">Archivos COPMEC (.copmec)</div>
          <div className="ep-grid ep-grid--1">
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button type="button" className="ep-btn ep-btn--primary" onClick={() => copmecFileInputRef.current?.click()}>
                Abrir .copmec
              </button>
              <input
                ref={copmecFileInputRef}
                type="file"
                accept=".copmec"
                style={{ display: "none" }}
                onChange={(event) => { void handleCopmecImportChange(event); }}
              />
            </div>

            {savedCopmecFiles.length ? (
              <div className="table-wrap compact-table">
                <table className="history-table-clean">
                  <thead>
                    <tr>
                      <th>Archivo</th>
                      <th>Periodo</th>
                      <th>Registros</th>
                      <th>Guardado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCopmecFiles.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.fileName}</td>
                        <td>{entry.periodLabel}</td>
                        <td>{entry.records}</td>
                        <td>{new Date(entry.importedAt).toLocaleString("es-MX")}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button type="button" className="ep-btn ep-btn--ghost" onClick={() => { void openSavedCopmecFile(entry); }}>
                              Ver
                            </button>
                            <button type="button" className="ep-btn ep-btn--ghost" onClick={() => { void parseEncryptedCopmecHistoryPackage(entry.packageText).then((payload) => exportCopmecPayloadToPdf(payload, entry.fileName.replace(/\.copmec$/i, ""))); }}>
                              PDF
                            </button>
                            <button type="button" className="ep-btn ep-btn--danger" onClick={() => requestRemoveSavedCopmecFile(entry)} disabled={copmecSaving}>
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ep-footnote" style={{ margin: 0 }}>Aún no tienes archivos .copmec guardados en tu perfil.</p>
            )}
          </div>
        </div>
        )}

        {activeTab === "perfil" && (
        <div className="ep-section">
          <button type="button" className="ep-pw-toggle" onClick={() => setPwOpen((v) => !v)}>
            <span>🔒 Contraseña</span>
            <span className="ep-pw-toggle__arrow" style={{ transform: pwOpen ? "rotate(180deg)" : "none" }}>▾</span>
          </button>
          {pwOpen && (
            <div className="ep-pw-body">
              <div className="ep-grid ep-grid--1">
                <div className="ep-field ep-field--wide">
                  <label className="ep-field__label">Nueva contraseña</label>
                  <input className="ep-input" type="password" value={passwordForm.password} onChange={(e) => onPasswordChange((c) => ({ ...c, password: e.target.value, message: "" }))} />
                </div>
                <div className="ep-field ep-field--wide">
                  <label className="ep-field__label">Confirmar contraseña</label>
                  <input className="ep-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => onPasswordChange((c) => ({ ...c, confirmPassword: e.target.value, message: "" }))} />
                </div>
                <button type="button" className="ep-btn ep-btn--primary" onClick={onSubmit}>Guardar contraseña</button>
                {passwordForm.message && <p className="ep-msg">{passwordForm.message}</p>}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ── MENSAJES ─────────────────────────────────────────────────────── */}
        {message && (
          <p className={`ep-msg${message.toLowerCase().includes("actualizados") || message.toLowerCase().includes("ok") ? " ep-msg--ok" : ""}`}>
            {message}
          </p>
        )}

      </div>
      </Modal>

      <Modal
      open={Boolean(copmecPreview)}
      title="Vista del archivo .copmec"
      confirmLabel="Cerrar"
      hideCancel
      onClose={requestCloseCopmecPreview}
      className="ep-modal"
      footerActions={copmecPreview ? [
        <button key="pdf" type="button" className="ep-btn ep-btn--primary" onClick={() => { void exportCopmecPayloadToPdf(copmecPreview.payload, copmecPreview.fileName.replace(/\.copmec$/i, "")); }}>
          Descargar PDF
        </button>,
        <button key="close" type="button" className="ep-btn ep-btn--ghost" onClick={requestCloseCopmecPreview}>
          Cerrar
        </button>,
      ] : undefined}
    >
      <div className="ep-body">
        {copmecPreview?.payload ? (
          <div style={{ display: "grid", gap: "0.65rem" }}>
            <p className="ep-footnote" style={{ margin: 0 }}>
              {String(copmecPreview.payload?.period?.label || "Periodo")} · {Array.isArray(copmecPreview.payload?.rows) ? copmecPreview.payload.rows.length : 0} registros
            </p>
            {Array.isArray(copmecPreview.payload?.rows) && copmecPreview.payload.rows.length ? (
              <div className="table-wrap compact-table">
                <table className="history-table-clean">
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Tablero</th>
                      <th>Actividad</th>
                      <th>Player</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copmecPreview.payload.rows.map((row, index) => (
                      <tr key={`copmec-preview-${index}`}>
                        <td>{row.area || "-"}</td>
                        <td>{row.tablero || "-"}</td>
                        <td>{row.actividad || "-"}</td>
                        <td>{row.player || "-"}</td>
                        <td>{row.estado || "-"}</td>
                        <td>{row.fecha || "-"}</td>
                        <td>{row.inicio || "-"}</td>
                        <td>{row.fin || "-"}</td>
                        <td>{row.tiempo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ep-footnote" style={{ margin: 0 }}>Este archivo no contiene filas.</p>
            )}
          </div>
        ) : null}
      </div>
      </Modal>

      <Modal
      open={copmecDecisionOpen}
      title="Guardar archivo en tu perfil"
      onClose={() => setCopmecDecisionOpen(false)}
      confirmLabel="Guardar en perfil"
      cancelLabel="No guardar"
      onConfirm={() => { void confirmSaveImportedCopmec(); }}
      onCancel={discardImportedCopmec}
      className="ep-modal"
    >
      <div className="ep-body">
        <p className="ep-footnote" style={{ margin: 0 }}>
          ¿Deseas guardar este archivo .copmec en el historial de tu perfil para abrirlo después?
        </p>
      </div>
      </Modal>

      <Modal
      open={Boolean(copmecDeleteTarget)}
      title="Borrar archivo guardado"
      onClose={() => setCopmecDeleteTarget(null)}
      confirmLabel="Borrar"
      cancelLabel="Cancelar"
      onConfirm={() => { void confirmRemoveSavedCopmecFile(); }}
      onCancel={() => setCopmecDeleteTarget(null)}
      className="ep-modal"
    >
      <div className="ep-body">
        <p className="ep-footnote" style={{ margin: 0 }}>
          ¿Deseas borrar {copmecDeleteTarget?.fileName ? `"${copmecDeleteTarget.fileName}"` : "este archivo"} de tu historial del perfil?
        </p>
      </div>
      </Modal>
    </>
  );
}

export function ForcedPasswordChangeModal({ passwordForm, onPasswordChange, onSubmit }) {
  return (
    <Modal
      open
      title="Actualiza tu contraseña temporal"
      confirmLabel="Guardar mi nueva contraseña"
      hideCancel
      onClose={() => {}}
      onConfirm={onSubmit}
      className="ep-modal"
    >
      <div className="ep-body">
        <p className="ep-footnote">Tu contraseña fue restablecida. Para continuar debes crear una nueva que solo tú conozcas.</p>
        <div className="ep-grid ep-grid--1">
          <div className="ep-field ep-field--wide">
            <label className="ep-field__label">Nueva contraseña</label>
            <input className="ep-input" type="password" value={passwordForm.password} onChange={(e) => onPasswordChange((c) => ({ ...c, password: e.target.value, message: "" }))} />
          </div>
          <div className="ep-field ep-field--wide">
            <label className="ep-field__label">Confirmar contraseña</label>
            <input className="ep-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => onPasswordChange((c) => ({ ...c, confirmPassword: e.target.value, message: "" }))} />
          </div>
          <p className="ep-footnote">Debe incluir mayúscula, minúscula, número, símbolo y al menos 10 caracteres.</p>
          {passwordForm.message && <p className="ep-msg">{passwordForm.message}</p>}
        </div>
      </div>
    </Modal>
  );
}
