import { useEffect } from "react";

export function Modal({
  open,
  title,
  children,
  onConfirm,
  onClose,
  confirmLabel = "Confirmar (Enter)",
  cancelLabel = "Cancelar (Esc)",
  hideCancel = false,
  className = "",
  backdropClassName = "",
  footerActions = null,
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Enter") {
        if (onConfirm) {
          onConfirm();
          return;
        }
        onClose?.();
      }

      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onConfirm]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`sicfla-modal-backdrop ${backdropClassName}`.trim()} role="presentation" onClick={onClose}>
      <section
        className={`sicfla-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        <div className="sicfla-modal-body">{children}</div>
        <footer className="sicfla-modal-actions">
          {footerActions}
          {hideCancel ? null : (
            <button type="button" className="sicfla-button ghost" onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button type="button" className="sicfla-button" onClick={onConfirm || onClose}>
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
