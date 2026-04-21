/* eslint-disable react/prop-types */
// ── Perfil de Empleado ───────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Modal } from "./Modal";

// ── Constantes y utilidades ───────────────────────────────────────────────────

const PROFILE_SELF_EDIT_LIMIT = 1;

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

export function getUserArea(user) {
  return String(user?.area || user?.department || "").trim();
}

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

// ── Exports mantenidos por compatibilidad con App.jsx ─────────────────────────

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
  const [form, setForm]               = useState(() => createIdentityFormFromUser(currentUser));
  const [message, setMessage]         = useState("");
  const [pwOpen, setPwOpen]           = useState(false);
  const [saving, setSaving]           = useState(false);

  const canBypass      = canBypassSelfProfileEditLimit(currentUser);
  const selfEditCount  = Number(currentUser?.selfIdentityEditCount ?? 0);
  const canEdit        = canBypass || selfEditCount < PROFILE_SELF_EDIT_LIMIT;
  const roleStyle      = ROLE_COLORS[normalizeRole(currentUser?.role)] || ROLE_COLORS[ROLE_JR];
  const initials       = getInitialsAvatar(currentUser?.name);

  useEffect(() => {
    setForm(createIdentityFormFromUser(currentUser));
    setMessage("");
    setIsEditMode(false);
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

  return (
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

        {/* ── CONTRASEÑA ───────────────────────────────────────────────────── */}
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

        {/* ── MENSAJES ─────────────────────────────────────────────────────── */}
        {message && (
          <p className={`ep-msg${message.toLowerCase().includes("actualizados") || message.toLowerCase().includes("ok") ? " ep-msg--ok" : ""}`}>
            {message}
          </p>
        )}

      </div>
    </Modal>
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
