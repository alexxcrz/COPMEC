import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AlertContext = createContext(null);

export function AlertModalProvider({ children }) {
  const [modal, setModal] = useState(null);
  const resolveRef = useRef(null);

  const showAlert = useCallback((message, type = "info") => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ mode: "alert", message, type });
    });
  }, []);

  const showConfirm = useCallback((title, body) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ mode: "confirm", title, body });
    });
  }, []);

  const dismiss = (value) => {
    setModal(null);
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
  };

  useEffect(() => {
    if (!modal) return;
    const handler = (e) => {
      if (e.key === "Enter") dismiss(modal.mode === "confirm" ? true : undefined);
      if (e.key === "Escape") dismiss(modal.mode === "confirm" ? false : undefined);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  const TYPE_META = {
    success: { icon: "✓", accent: "#4f7da9", light: "#f2f6fb" },
    warning: { icon: "!", accent: "#d97706", light: "#fffbeb" },
    error:   { icon: "✕", accent: "#dc2626", light: "#fef2f2" },
    info:    { icon: "i", accent: "#0369a1", light: "#f0f9ff" },
  };

  const S = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(49, 77, 105, 0.35)", backdropFilter: "blur(4px)",
    },
    box: {
      background: "#ffffff",
      borderRadius: "1.5rem",
      padding: "2rem",
      maxWidth: "420px",
      width: "90vw",
      boxShadow: "0 8px 40px rgba(49, 77, 105, 0.18)",
      display: "flex", flexDirection: "column", gap: "1.25rem",
    },
    title: {
      margin: 0, fontSize: "1.05rem", fontWeight: 700,
      color: "#314d69", lineHeight: 1.3,
    },
    body: {
      margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: 1.6,
    },
    actions: {
      display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.25rem",
    },
    btnCancel: {
      background: "#f1f5f9", color: "#475569",
      border: "none", borderRadius: "0.875rem",
      padding: "0.6rem 1.4rem", cursor: "pointer",
      fontWeight: 600, fontSize: "0.875rem",
      transition: "background 0.15s",
    },
    btnConfirm: {
      background: "#314d69", color: "#ffffff",
      border: "none", borderRadius: "0.875rem",
      padding: "0.6rem 1.4rem", cursor: "pointer",
      fontWeight: 600, fontSize: "0.875rem",
      transition: "background 0.15s",
    },
    btnDanger: {
      background: "#dc2626", color: "#ffffff",
      border: "none", borderRadius: "0.875rem",
      padding: "0.6rem 1.4rem", cursor: "pointer",
      fontWeight: 600, fontSize: "0.875rem",
    },
  };

  const meta = modal ? (TYPE_META[modal.type] || TYPE_META.info) : TYPE_META.info;
  const isDanger = modal?.title?.toLowerCase().includes("borrar") ||
                   modal?.title?.toLowerCase().includes("elimin") ||
                   modal?.body?.toLowerCase().includes("borrar") ||
                   modal?.body?.toLowerCase().includes("elimin");

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modal && (
        <div
          className="alert-modal-overlay"
          role="presentation"
          onClick={() => dismiss(modal.mode === "confirm" ? false : undefined)}
          style={S.overlay}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={S.box}
          >
            {modal.mode === "alert" && (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: meta.light, color: meta.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "1rem",
                  }}>
                    {meta.icon}
                  </div>
                  <p style={{ ...S.body, paddingTop: "0.5rem" }}>{modal.message}</p>
                </div>
                <div style={S.actions}>
                  <button type="button" onClick={() => dismiss(undefined)} style={S.btnConfirm}>
                    Aceptar
                  </button>
                </div>
              </>
            )}
            {modal.mode === "confirm" && (
              <>
                {modal.title && <h3 style={S.title}>{modal.title}</h3>}
                {modal.body && <p style={S.body}>{modal.body}</p>}
                <div style={S.actions}>
                  <button type="button" onClick={() => dismiss(false)} style={S.btnCancel}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(true)}
                    style={isDanger ? S.btnDanger : S.btnConfirm}
                  >
                    Confirmar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert debe usarse dentro de AlertModalProvider");
  return ctx;
}
