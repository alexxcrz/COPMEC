// ── Barra Lateral (Sidebar) ──────────────────────────────────────────────────
// Sidebar: navegación principal colapsable con perfil de usuario.
// InventoryActivityConsumptionEditor: editor de consumos por actividad.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { CopmecBrand } from "./ComponentesDashboard";
import logoIA from "../assets/logo-ia.jpeg";
import { PAGE_ROUTE_SLUGS } from "../utils/constantes";

const DEFAULT_JOB_TITLE_BY_ROLE = {
  "Lead":              "Líder de Operaciones",
  "Senior (Sr)":       "Senior de Operaciones",
  "Semi-Senior (Ssr)": "Operador Semi-Senior",
  "Junior (Jr)":       "Operador Junior",
};

function getUserJobTitle(user) {
  return String(user?.jobTitle || DEFAULT_JOB_TITLE_BY_ROLE[user?.role] || "").trim();
}

function getPageHref(pageId) {
  const slug = PAGE_ROUTE_SLUGS?.[pageId];
  return slug ? `/${slug}` : "/";
}

function openPageInAnotherContext(pageId, target = "tab") {
  const href = getPageHref(pageId);
  if (target === "window") {
    globalThis.open(href, "_blank", "noopener,noreferrer,width=1280,height=900");
    return;
  }
  globalThis.open(href, "_blank", "noopener,noreferrer");
}

export function Sidebar({ currentUser, page, onPageChange, isOpen, isCollapsed, onClose, onOpenProfile, onToggleCollapsed, allowedNavItems, canUseAI, onOpenAI }) {
  const contextMenuRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    item: null,
  });

  function closeContextMenu() {
    setContextMenu((current) => (current.open ? { ...current, open: false, item: null } : current));
  }

  function handleOpenContextMenu(event, item) {
    event.preventDefault();
    const viewportWidth = Number(globalThis.innerWidth || 0);
    const viewportHeight = Number(globalThis.innerHeight || 0);
    const menuWidth = 236;
    const menuHeight = 154;
    const x = Math.max(8, Math.min(event.clientX, Math.max(8, viewportWidth - menuWidth - 8)));
    const y = Math.max(8, Math.min(event.clientY, Math.max(8, viewportHeight - menuHeight - 8)));
    setContextMenu({ open: true, x, y, item });
  }

  useEffect(() => {
    if (!contextMenu.open) return undefined;

    function handlePointerDown(event) {
      if (contextMenuRef.current?.contains(event.target)) return;
      closeContextMenu();
    }

    function handleEscape(event) {
      if (event.key === "Escape") closeContextMenu();
    }

    globalThis.addEventListener("pointerdown", handlePointerDown);
    globalThis.addEventListener("keydown", handleEscape);

    return () => {
      globalThis.removeEventListener("pointerdown", handlePointerDown);
      globalThis.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu.open]);

  return (
    <aside className={`sidebar-shell ${isOpen ? "open" : ""} ${isCollapsed && !isOpen ? "collapsed" : ""}`}>
      <div className="sidebar-mobile-actions">
        <button type="button" className="sidebar-close-button" onClick={onClose} aria-label="Cerrar menú">
          <X size={18} />
        </button>
      </div>
      <div className="sidebar-desktop-toggle">
        <button type="button" className="sidebar-collapse-button" onClick={onToggleCollapsed} aria-label={isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"} title={isCollapsed ? "Expandir menú" : "Contraer menú"}>
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <div className="brand-block">
        <CopmecBrand headingTag="h1" compact={isCollapsed} />
      </div>

      <nav className="sidebar-nav">
        {(() => {
          let lastGroup = null;
          const elements = [];
          allowedNavItems.forEach((item) => {
            const Icon = item.icon;
            const showGroupLabel = item.group && item.group !== lastGroup;
            if (showGroupLabel) {
              lastGroup = item.group;
              elements.push(
                <div key={`group-${item.group}`} className="nav-group-separator">
                  <span className="nav-group-label">{item.group}</span>
                </div>,
              );
            }
            elements.push(
              <button
                key={item.id}
                type="button"
                className={`nav-item ${page === item.id ? "active" : ""}`}
                title={item.label}
                aria-label={item.label}
                onClick={() => {
                  closeContextMenu();
                  onPageChange(item.id);
                  onClose?.();
                }}
                onContextMenu={(event) => handleOpenContextMenu(event, item)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>,
            );
          });
          return elements;
        })()}
      </nav>

      {contextMenu.open && contextMenu.item ? (
        <div
          ref={contextMenuRef}
          className="sidebar-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          role="menu"
          aria-label={`Opciones de ${contextMenu.item.label}`}
        >
          <button
            type="button"
            className="sidebar-context-menu-item"
            role="menuitem"
            onClick={() => {
              onPageChange(contextMenu.item.id);
              onClose?.();
              closeContextMenu();
            }}
          >
            Abrir aquí
          </button>
          <button
            type="button"
            className="sidebar-context-menu-item"
            role="menuitem"
            onClick={() => {
              openPageInAnotherContext(contextMenu.item.id, "tab");
              closeContextMenu();
            }}
          >
            Abrir en otra pestaña
          </button>
          <button
            type="button"
            className="sidebar-context-menu-item"
            role="menuitem"
            onClick={() => {
              openPageInAnotherContext(contextMenu.item.id, "window");
              closeContextMenu();
            }}
          >
            Abrir en otra ventana
          </button>
        </div>
      ) : null}

      {canUseAI && (
        <button
          type="button"
          className="sidebar-ai-btn"
          onClick={onOpenAI}
          title="COPMEC AI — Cerebro Operativo"
        >
          <img src={logoIA} alt="AI" className="sidebar-ai-logo" />
          <span className="sidebar-ai-label">COPMEC AI</span>
        </button>
      )}

      <button type="button" className="sidebar-profile-card" onClick={onOpenProfile} title={currentUser.name}>
        <span className="avatar-circle sidebar-profile-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
        <div className="sidebar-profile-meta">
          <strong>{currentUser.name}</strong>
          <span>{getUserJobTitle(currentUser) || currentUser.role}</span>
        </div>
      </button>
    </aside>
  );
}

export function InventoryActivityConsumptionEditor({ activeCatalogItems, activityConsumptions, onToggle, onQuantityChange }) {
  if (!activeCatalogItems.length) {
    return <p className="inventory-activity-consumption-empty">Primero agrega actividades activas al catalogo para definir el consumo automatico por inicio.</p>;
  }

  return (
    <div className="inventory-activity-consumption-editor">
      {activeCatalogItems.map((item) => {
        const currentConsumption = activityConsumptions.find((entry) => entry.catalogActivityId === item.id);
        const isEnabled = Boolean(currentConsumption);
        return (
          <article key={item.id} className={`inventory-activity-consumption-row ${isEnabled ? "active" : ""}`.trim()}>
            <div className="inventory-activity-consumption-main">
              <div className="inventory-activity-consumption-copy">
                <strong>{item.name}</strong>
              </div>
              <button
                type="button"
                className={`switch-button ${isEnabled ? "on" : ""}`}
                onClick={() => onToggle(item.id, !isEnabled)}
                aria-pressed={isEnabled}
                aria-label={`${isEnabled ? "Desactivar" : "Activar"} consumo para ${item.name}`}
              >
                <span className="switch-thumb" />
              </button>
            </div>
            <label className="inventory-activity-consumption-quantity">
              <span>Cantidad por inicio</span>
              <input
                type="number"
                min="0"
                value={currentConsumption?.quantity || ""}
                onChange={(event) => onQuantityChange(item.id, event.target.value)}
                disabled={!isEnabled}
                placeholder={isEnabled ? "0" : "Activa la actividad"}
              />
            </label>
          </article>
        );
      })}
    </div>
  );
}
