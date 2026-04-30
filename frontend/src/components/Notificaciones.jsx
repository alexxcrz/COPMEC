import { Bell, X } from "lucide-react";
import { formatNotificationTimestamp } from "../utils/utilidades.jsx";

function AppToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="app-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`app-toast ${toast.tone === "danger" ? "danger" : "success"} ${toast.isClosing ? "closing" : ""}`.trim()}>
          <p>{toast.message}</p>
          <button type="button" className="app-toast-close" onClick={() => onDismiss(toast.id)} aria-label="Cerrar aviso">
            <X size={14} />
          </button>
        </article>
      ))}
    </div>
  );
}

function AppNotificationCenter({ unreadNotifications, readNotifications, unreadCount, activeTab, isOpen, onToggle, onTabChange, onDeleteAllRead, onMarkAllRead, onDeleteNotification, onOpenNotification }) {
  const visibleNotifications = activeTab === "read" ? readNotifications : unreadNotifications;

  return (
    <div className={`app-notification-center${isOpen ? " open" : ""}`}>
      <button type="button" className={`app-notification-trigger ${unreadCount ? "has-unread" : ""}`.trim()} onClick={onToggle} aria-label="Abrir alertas" aria-expanded={isOpen}>
        <Bell size={18} />
        {unreadCount ? <span className="app-notification-badge">{Math.min(unreadCount, 99)}</span> : null}
      </button>
      {isOpen ? (
        <section className="app-notification-panel" aria-label="Centro de alertas">
          <div className="app-notification-panel-header">
            <strong>Alertas</strong>
            <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
              {activeTab === "unread" && unreadNotifications.length ? <button type="button" className="app-notification-action" onClick={onMarkAllRead}>Marcar todo leído</button> : null}
              {activeTab === "read" && readNotifications.length ? <button type="button" className="app-notification-action" onClick={onDeleteAllRead}>Borrar todo</button> : null}
            </div>
          </div>
          <div className="app-notification-tabs" role="tablist" aria-label="Filtros de alertas">
            <button type="button" role="tab" aria-selected={activeTab === "unread"} className={activeTab === "unread" ? "app-notification-tab active" : "app-notification-tab"} onClick={() => onTabChange("unread")}>Sin leer</button>
            <button type="button" role="tab" aria-selected={activeTab === "read"} className={activeTab === "read" ? "app-notification-tab active" : "app-notification-tab"} onClick={() => onTabChange("read")}>Leidas</button>
          </div>
          <div className="app-notification-list">
            {visibleNotifications.map((notification) => (
              <article key={notification.id} className={`app-notification-item ${notification.tone === "danger" ? "danger" : "success"} ${notification.isUnread ? "unread" : ""} ${notification.isLocked ? "locked" : ""} ${activeTab === "read" && !notification.isLocked ? "deletable" : ""}`.trim()}>
                <button type="button" className="app-notification-open" onClick={() => onOpenNotification(notification)}>
                  <div className="app-notification-item-header">
                    <strong>{notification.title}</strong>
                    <span>{formatNotificationTimestamp(notification.timestamp)}</span>
                  </div>
                  <p>{notification.message}</p>
                  {notification.meta ? <small>{notification.meta}</small> : null}
                </button>
                {activeTab === "read" && !notification.isLocked ? (
                  <div className="app-notification-delete-wrap">
                    <button type="button" className="app-notification-delete" onClick={() => onDeleteNotification(notification.id)} aria-label="Eliminar notificación">
                      <X size={14} />
                    </button>
                  </div>
                  
                ) : null}
              </article>
            ))}
            {visibleNotifications.length ? null : <p className="subtle-line app-notification-empty">{activeTab === "read" ? "No hay notificaciones leidas guardadas." : "No hay alertas sin leer."}</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}


export { AppToastStack, AppNotificationCenter };
