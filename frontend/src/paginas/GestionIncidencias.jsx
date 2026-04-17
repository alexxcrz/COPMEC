/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import {
  OctagonAlert, Plus, Search, Pencil, Trash2, Eye,
  Wrench, Zap, Building2, ShieldAlert, HelpCircle, Package,
} from "lucide-react";
import { Modal } from "../components/Modal";
import "./GestionIncidencias.css";

const CATEGORIAS = ["Mecánico", "Eléctrico", "Infraestructura", "Equipo / Herramienta", "Seguridad", "Limpieza", "Sistemas", "Otro"];
const PRIORIDADES = ["baja", "media", "alta", "critica"];
const ESTADOS = ["abierta", "en_proceso", "resuelta", "cerrada"];
const PAGO_ESTADOS = ["pendiente", "pagado", "cancelado"];

const PRIORIDAD_LABEL = { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" };
const ESTADO_LABEL = { abierta: "Abierta", en_proceso: "En proceso", resuelta: "Resuelta", cerrada: "Cerrada" };
const PAGO_LABEL = { pendiente: "Pendiente", pagado: "Pagado", cancelado: "Cancelado" };

const CAT_ICON = {
  "Mecánico": Wrench,
  "Eléctrico": Zap,
  "Infraestructura": Building2,
  "Equipo / Herramienta": Package,
  "Seguridad": ShieldAlert,
  "Limpieza": OctagonAlert,
  "Sistemas": OctagonAlert,
  "Otro": HelpCircle,
};

function formatCurrency(v) {
  if (v === null || v === undefined || v === "") return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(v);
}

const EMPTY_DRAFT = {
  title: "",
  description: "",
  category: "Mecánico",
  area: "",
  priority: "media",
  status: "abierta",
  assignedToId: "",
  assignedToName: "",
  estimatedCost: "",
  actualCost: "",
  provider: "",
  invoiceNumber: "",
  paymentStatus: "pendiente",
  resolution: "",
};

export default function GestionIncidencias({ contexto }) {
  const {
    state,
    setState,
    requestJson,
    actionPermissions,
    formatDate,
    activeAssignableUsers,
  } = contexto;

  const incidencias = useMemo(() => state.incidencias || [], [state.incidencias]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = useMemo(() => {
    let list = [...incidencias].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q) ||
        (i.area || "").toLowerCase().includes(q) ||
        (i.provider || "").toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    if (filterPriority !== "all") list = list.filter((i) => i.priority === filterPriority);
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    return list;
  }, [incidencias, search, filterStatus, filterPriority, filterCategory]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const abiertas = incidencias.filter((i) => i.status === "abierta").length;
    const en_proceso = incidencias.filter((i) => i.status === "en_proceso").length;
    const criticas = incidencias.filter((i) => i.priority === "critica" && i.status !== "cerrada" && i.status !== "resuelta").length;
    const totalGasto = incidencias.reduce((s, i) => s + (i.actualCost ?? 0), 0);
    const pendientePago = incidencias.filter((i) => i.paymentStatus === "pendiente" && (i.actualCost ?? 0) > 0).reduce((s, i) => s + i.actualCost, 0);
    return { abiertas, en_proceso, criticas, totalGasto, pendientePago };
  }, [incidencias]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [detailId, setDetailId] = useState(null);

  function openCreate() {
    setDraft(EMPTY_DRAFT);
    setEditId(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setDraft({
      title: item.title,
      description: item.description || "",
      category: item.category,
      area: item.area || "",
      priority: item.priority,
      status: item.status,
      assignedToId: item.assignedToId || "",
      assignedToName: item.assignedToName || "",
      estimatedCost: item.estimatedCost !== null && item.estimatedCost !== undefined ? String(item.estimatedCost) : "",
      actualCost: item.actualCost !== null && item.actualCost !== undefined ? String(item.actualCost) : "",
      provider: item.provider || "",
      invoiceNumber: item.invoiceNumber || "",
      paymentStatus: item.paymentStatus || "pendiente",
      resolution: item.resolution || "",
    });
    setEditId(item.id);
    setFormError("");
    setModalOpen(true);
  }

  function setField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!draft.title.trim()) { setFormError("El título es obligatorio."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...draft,
        estimatedCost: draft.estimatedCost !== "" ? Number(draft.estimatedCost) : null,
        actualCost: draft.actualCost !== "" ? Number(draft.actualCost) : null,
      };
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/warehouse/incidencias/${editId}` : "/warehouse/incidencias";
      const res = await requestJson(url, { method, body: JSON.stringify(payload) });
      if (res?.data?.state) setState(res.data.state);
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await requestJson(`/warehouse/incidencias/${deleteId}`, { method: "DELETE" });
      if (res?.data?.state) setState(res.data.state);
    } catch {
      // ignore
    } finally {
      setDeleteId(null);
    }
  }

  const detailItem = detailId ? incidencias.find((i) => i.id === detailId) : null;

  return (
    <section className="incidencias-page">
      {/* ── KPI row ── */}
      <div className="incidencias-kpi-row">
        <div className="incidencias-kpi">
          <span className="incidencias-kpi-label">Abiertas</span>
          <span className={`incidencias-kpi-value ${kpis.abiertas > 0 ? "amber" : "green"}`}>{kpis.abiertas}</span>
        </div>
        <div className="incidencias-kpi">
          <span className="incidencias-kpi-label">En proceso</span>
          <span className="incidencias-kpi-value blue">{kpis.en_proceso}</span>
        </div>
        <div className="incidencias-kpi">
          <span className="incidencias-kpi-label">Críticas activas</span>
          <span className={`incidencias-kpi-value ${kpis.criticas > 0 ? "red" : "green"}`}>{kpis.criticas}</span>
        </div>
        <div className="incidencias-kpi">
          <span className="incidencias-kpi-label">Gasto total</span>
          <span className="incidencias-kpi-value">{formatCurrency(kpis.totalGasto)}</span>
        </div>
        <div className="incidencias-kpi">
          <span className="incidencias-kpi-label">Por pagar</span>
          <span className={`incidencias-kpi-value ${kpis.pendientePago > 0 ? "amber" : "green"}`}>{formatCurrency(kpis.pendientePago)}</span>
        </div>
      </div>

      {/* ── Main card ── */}
      <article className="surface-card full-width admin-tabs-shell">
        <div className="card-header-row">
          <div>
            <h3>Registro de incidencias</h3>
            <p className="subtle-line" style={{ margin: 0 }}>Problemas, fallas y gastos de mantenimiento del almacén</p>
          </div>
          {actionPermissions.createIncidencia ? (
            <button type="button" className="primary-button sm-button" onClick={openCreate}>
              <Plus size={14} /> Nueva incidencia
            </button>
          ) : null}
        </div>

        {/* toolbar */}
        <div className="incidencias-toolbar" style={{ margin: "0.75rem 0" }}>
          <div className="incidencias-search-wrap">
            <Search size={14} />
            <input
              className="incidencias-search"
              placeholder="Buscar por título, área, proveedor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="incidencias-filters">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos los estados</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">Todas las prioridades</option>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDAD_LABEL[p]}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* table */}
        {filtered.length === 0 ? (
          <div className="incidencias-empty">
            <OctagonAlert size={40} />
            <p>{incidencias.length === 0 ? "No hay incidencias registradas aún." : "No hay resultados para los filtros aplicados."}</p>
          </div>
        ) : (
          <div className="incidencias-table-wrap">
            <table className="incidencias-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Área</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Gasto real</th>
                  <th>Pago</th>
                  <th>Registrado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const CatIcon = CAT_ICON[item.category] || HelpCircle;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, maxWidth: 220 }}>
                        <span title={item.title} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </span>
                        {item.assignedToName ? <span style={{ fontSize: "0.72rem", color: "#8a94a0" }}>→ {item.assignedToName}</span> : null}
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CatIcon size={13} style={{ flexShrink: 0, color: "#8a94a0" }} /> {item.category}
                        </span>
                      </td>
                      <td style={{ color: "#8a94a0" }}>{item.area || "—"}</td>
                      <td><span className={`badge badge-${item.priority}`}>{PRIORIDAD_LABEL[item.priority]}</span></td>
                      <td><span className={`badge badge-${item.status}`}>{ESTADO_LABEL[item.status]}</span></td>
                      <td style={{ fontWeight: (item.actualCost ?? 0) > 0 ? 600 : 400 }}>{formatCurrency(item.actualCost)}</td>
                      <td><span className={`badge badge-${item.paymentStatus}`}>{PAGO_LABEL[item.paymentStatus]}</span></td>
                      <td style={{ color: "#8a94a0", whiteSpace: "nowrap" }}>{formatDate ? formatDate(item.reportedAt) : item.reportedAt?.slice(0, 10)}</td>
                      <td>
                        <div className="incidencias-row-actions">
                          <button type="button" className="icon-button" title="Ver detalle" onClick={() => setDetailId(item.id)}>
                            <Eye size={14} />
                          </button>
                          {actionPermissions.editIncidencia ? (
                            <button type="button" className="icon-button" title="Editar" onClick={() => openEdit(item)}>
                              <Pencil size={14} />
                            </button>
                          ) : null}
                          {actionPermissions.deleteIncidencia ? (
                            <button type="button" className="icon-button danger" title="Eliminar" onClick={() => setDeleteId(item.id)}>
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modalOpen}
        title={editId ? "Editar incidencia" : "Nueva incidencia"}
        confirmLabel={saving ? "Guardando…" : "Guardar"}
        cancelLabel="Cancelar"
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
      >
        <div className="incidencia-form">
          <span className="section-divider full-col">Información general</span>
          <label className="full-col">
            Título *
            <input value={draft.title} onChange={(e) => setField("title", e.target.value)} placeholder="Ej. Fuga de aceite en compresor 2" />
          </label>
          <label className="full-col">
            Descripción
            <textarea value={draft.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe el problema con detalle…" rows={3} />
          </label>
          <label>
            Categoría
            <select value={draft.category} onChange={(e) => setField("category", e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Área del almacén
            <input value={draft.area} onChange={(e) => setField("area", e.target.value)} placeholder="Ej. Zona de carga, Oficinas…" />
          </label>
          <label>
            Prioridad
            <select value={draft.priority} onChange={(e) => setField("priority", e.target.value)}>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDAD_LABEL[p]}</option>)}
            </select>
          </label>
          <label>
            Estado
            <select value={draft.status} onChange={(e) => setField("status", e.target.value)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="full-col">
            Asignado a
            <select
              value={draft.assignedToId}
              onChange={(e) => {
                const user = (activeAssignableUsers || []).find((u) => u.id === e.target.value);
                setField("assignedToId", e.target.value);
                setField("assignedToName", user ? user.name : "");
              }}
            >
              <option value="">— Sin asignar —</option>
              {(activeAssignableUsers || []).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </label>

          <span className="section-divider full-col">Gastos y resolución</span>
          <label>
            Costo estimado (MXN)
            <input type="number" min="0" step="0.01" value={draft.estimatedCost} onChange={(e) => setField("estimatedCost", e.target.value)} placeholder="0.00" />
          </label>
          <label>
            Costo real (MXN)
            <input type="number" min="0" step="0.01" value={draft.actualCost} onChange={(e) => setField("actualCost", e.target.value)} placeholder="0.00" />
          </label>
          <label>
            Proveedor / Técnico
            <input value={draft.provider} onChange={(e) => setField("provider", e.target.value)} placeholder="Nombre del proveedor o técnico" />
          </label>
          <label>
            Folio / Factura
            <input value={draft.invoiceNumber} onChange={(e) => setField("invoiceNumber", e.target.value)} placeholder="Número de factura u orden" />
          </label>
          <label>
            Estado de pago
            <select value={draft.paymentStatus} onChange={(e) => setField("paymentStatus", e.target.value)}>
              {PAGO_ESTADOS.map((s) => <option key={s} value={s}>{PAGO_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="full-col">
            Resolución / Acciones tomadas
            <textarea value={draft.resolution} onChange={(e) => setField("resolution", e.target.value)} placeholder="Describe qué se hizo para resolverlo…" rows={3} />
          </label>

          {formError ? <p className="validation-text" style={{ gridColumn: "1/-1", margin: 0 }}>{formError}</p> : null}
        </div>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal
        open={!!detailItem}
        title="Detalle de incidencia"
        confirmLabel={actionPermissions.editIncidencia ? "Editar" : null}
        cancelLabel="Cerrar"
        onClose={() => setDetailId(null)}
        onConfirm={actionPermissions.editIncidencia ? () => { setDetailId(null); openEdit(detailItem); } : null}
      >
        {detailItem ? (
          <div className="incidencia-detail">
            <div className="incidencia-detail-field full-col">
              <span className="incidencia-detail-label">Título</span>
              <span className="incidencia-detail-value" style={{ fontWeight: 700, fontSize: "1rem" }}>{detailItem.title}</span>
            </div>
            {detailItem.description ? (
              <div className="incidencia-detail-field full-col">
                <span className="incidencia-detail-label">Descripción</span>
                <span className="incidencia-detail-value resolution">{detailItem.description}</span>
              </div>
            ) : null}
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Categoría</span>
              <span className="incidencia-detail-value">{detailItem.category}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Área</span>
              <span className="incidencia-detail-value">{detailItem.area || "—"}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Prioridad</span>
              <span className={`badge badge-${detailItem.priority}`}>{PRIORIDAD_LABEL[detailItem.priority]}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Estado</span>
              <span className={`badge badge-${detailItem.status}`}>{ESTADO_LABEL[detailItem.status]}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Reportado por</span>
              <span className="incidencia-detail-value">{detailItem.reportedByName || "—"}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Asignado a</span>
              <span className="incidencia-detail-value">{detailItem.assignedToName || "— Sin asignar —"}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Fecha de reporte</span>
              <span className="incidencia-detail-value">{formatDate ? formatDate(detailItem.reportedAt) : detailItem.reportedAt?.slice(0, 10)}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Fecha de resolución</span>
              <span className="incidencia-detail-value">{detailItem.resolvedAt ? (formatDate ? formatDate(detailItem.resolvedAt) : detailItem.resolvedAt.slice(0, 10)) : "—"}</span>
            </div>
            <span className="section-divider full-col" style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a94a0", borderTop: "1px solid var(--sicfla-border)", paddingTop: "0.6rem" }}>Gastos</span>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Costo estimado</span>
              <span className="incidencia-detail-value cost">{formatCurrency(detailItem.estimatedCost)}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Costo real</span>
              <span className="incidencia-detail-value cost">{formatCurrency(detailItem.actualCost)}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Proveedor / Técnico</span>
              <span className="incidencia-detail-value">{detailItem.provider || "—"}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Folio / Factura</span>
              <span className="incidencia-detail-value">{detailItem.invoiceNumber || "—"}</span>
            </div>
            <div className="incidencia-detail-field">
              <span className="incidencia-detail-label">Estado de pago</span>
              <span className={`badge badge-${detailItem.paymentStatus}`}>{PAGO_LABEL[detailItem.paymentStatus]}</span>
            </div>
            {detailItem.resolution ? (
              <div className="incidencia-detail-field full-col">
                <span className="incidencia-detail-label">Resolución</span>
                <span className="incidencia-detail-value resolution">{detailItem.resolution}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* ── Delete confirm modal ── */}
      <Modal
        open={!!deleteId}
        title="Eliminar incidencia"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      >
        <p style={{ margin: 0 }}>¿Estás seguro de que quieres eliminar esta incidencia? Esta acción no se puede deshacer.</p>
      </Modal>
    </section>
  );
}
