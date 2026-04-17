import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import bibliotecaWelcome from "../assets/biblioteca-welcome.jpeg";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  FolderUp,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Modal } from "../components/Modal.jsx";
import "./BibliotecaPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api";

const PREDEFINED_AREAS = ["NOM"];

const getFileUrl = (f) =>
  f?.fileName ? `${API_BASE}/biblioteca/files/${encodeURIComponent(f.fileName)}` : f?.fileUrl || null;

const MIME_LABELS = {
  "application/pdf": "PDF",
  "image/png": "Imagen",
  "image/jpeg": "Imagen",
  "image/jpg": "Imagen",
  "image/webp": "Imagen",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-excel": "Excel",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "text/plain": "Texto",
};

function mimeLabel(mimeType) {
  return MIME_LABELS[mimeType] || "Archivo";
}

function isImage(mimeType) {
  return String(mimeType).startsWith("image/");
}

function isPdf(mimeType) {
  return mimeType === "application/pdf";
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BibliotecaPage({ currentUser, canUpload, canDelete }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("NOM");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadArea, setUploadArea] = useState("General");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCustomArea, setUploadCustomArea] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [contentFullscreen, setContentFullscreen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  // Prioridad y notificación — subida individual
  const [uploadPriority, setUploadPriority] = useState("baja");
  const [uploadNotify, setUploadNotify] = useState(false);
  // Carga masiva
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkArea, setBulkArea] = useState("General");
  const [bulkCustomArea, setBulkCustomArea] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkErrors, setBulkErrors] = useState([]);
  // Prioridad y notificación — carga masiva
  const [bulkPriority, setBulkPriority] = useState("baja");
  const [bulkNotify, setBulkNotify] = useState(false);
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  // Cargar archivo como blob para preview autenticado
  useEffect(() => {
    if (!previewFile) {
      setPreviewBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setContentFullscreen(false);
      return;
    }
    const url = getFileUrl(previewFile);
    if (!url || (!isImage(previewFile.fileMimeType) && !isPdf(previewFile.fileMimeType))) return;
    let revoked = false;
    setPreviewLoading(true);
    setPreviewBlobUrl(null);
    fetch(url, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (!revoked) setPreviewBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => { if (!revoked) setPreviewBlobUrl(null); })
      .finally(() => { if (!revoked) setPreviewLoading(false); });
    return () => {
      revoked = true;
      setPreviewLoading(false);
    };
  }, [previewFile]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/biblioteca`, { credentials: "include" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error al cargar");
      setFiles(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const areas = useMemo(() => {
    const set = new Set([...PREDEFINED_AREAS, ...files.map((f) => f.area || "General")]);
    return Array.from(set);
  }, [files]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return files.filter((f) => {
      const matchArea = f.area === areaFilter;
      const matchSearch = !q ||
        f.originalName?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.area?.toLowerCase().includes(q);
      return matchArea && matchSearch;
    });
  }, [files, search, areaFilter]);

  const groupedByArea = useMemo(() => {
    const map = new Map();
    filtered.forEach((f) => {
      const area = f.area || "General";
      if (!map.has(area)) map.set(area, []);
      map.get(area).push(f);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    const resolvedArea = uploadArea === "__custom__" ? uploadCustomArea.trim() || "General" : uploadArea;
    const form = new FormData();
    form.append("file", uploadFile);
    form.append("area", resolvedArea);
    form.append("description", uploadDescription);
    form.append("priority", uploadPriority);
    form.append("notifyPlayers", String(uploadNotify));
    try {
      const res = await fetch(`${API_BASE}/biblioteca`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error al subir");
      setFiles((prev) => [...prev, json.data]);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadDescription("");
      setUploadArea("General");
      setUploadCustomArea("");
      setUploadPriority("baja");
      setUploadNotify(false);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_BASE}/biblioteca/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Error al eliminar");
      setFiles((prev) => prev.filter((f) => f.id !== deleteId));
    } finally {
      setDeleteId(null);
    }
  }

  const existingAreas = useMemo(() => {
    const set = new Set([...PREDEFINED_AREAS, ...files.map((f) => f.area || "General").filter(Boolean)]);
    return Array.from(set);
  }, [files]);

  async function handleBulkUpload() {
    if (!bulkFiles.length) return;
    const resolvedArea = bulkArea === "__custom__" ? bulkCustomArea.trim() || "General" : bulkArea;
    setBulkUploading(true);
    setBulkErrors([]);
    setBulkProgress({ done: 0, total: bulkFiles.length });
    const added = [];
    const errors = [];
    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      const form = new FormData();
      form.append("file", file);
      form.append("area", resolvedArea);
      form.append("priority", bulkPriority);
      form.append("notifyPlayers", i === 0 ? String(bulkNotify) : "false");
      try {
        const res = await fetch(`${API_BASE}/biblioteca`, { method: "POST", credentials: "include", body: form });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message || "Error");
        added.push(json.data);
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
      setBulkProgress({ done: i + 1, total: bulkFiles.length });
    }
    if (added.length) setFiles((prev) => [...prev, ...added]);
    setBulkErrors(errors);
    setBulkUploading(false);
    if (!errors.length) {
      setBulkOpen(false);
      setBulkFiles([]);
      setBulkArea("General");
      setBulkCustomArea("");
      setBulkPriority("baja");
      setBulkNotify(false);
    }
  }

  return (
    <div className="biblioteca-page">
      {/* Header bar */}
      <div className="biblioteca-toolbar">
        <div className="biblioteca-search-wrap">
          <Search size={15} className="biblioteca-search-icon" />
          <input
            className="biblioteca-search"
            type="text"
            placeholder="Buscar archivo, área o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button type="button" className="biblioteca-search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          ) : null}
        </div>

        {canUpload ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="primary-button sm-button" onClick={() => setUploadOpen(true)}>
              <Upload size={14} /> Subir archivo
            </button>
            <button type="button" className="primary-button sm-button" onClick={() => setBulkOpen(true)} title="Carga masiva">
              <FolderUp size={14} /> Carga masiva
            </button>
          </div>
        ) : null}
      </div>

      {/* Tabs de área (hojas) */}
      <div className="biblioteca-area-tabs">
        {areas.map((a) => (
          <button
            key={a}
            type="button"
            className={`biblioteca-area-tab${areaFilter === a && !showWelcome ? " active" : ""}`}
            onClick={() => { setAreaFilter(a); setShowWelcome(false); }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Welcome image — shown until user picks a tab */}
      {showWelcome ? (
        <div className="biblioteca-welcome-cover">
          <img src={bibliotecaWelcome} alt="Biblioteca" className="biblioteca-welcome-img" />
        </div>
      ) : loading ? (
        <div className="biblioteca-loading">
          <Loader2 size={24} className="spin" />
          <span>Cargando biblioteca…</span>
        </div>
      ) : error ? (
        <div className="biblioteca-error">
          <p>{error}</p>
          <button type="button" className="primary-button sm-button" onClick={fetchFiles}>Reintentar</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="biblioteca-empty">
          <BookOpen size={40} />
          <p>{files.length === 0 ? "La biblioteca está vacía." : "No hay archivos que coincidan con la búsqueda."}</p>
          {canUpload && files.length === 0 ? (
            <button type="button" className="primary-button sm-button" onClick={() => setUploadOpen(true)}>
              <Upload size={14} /> Subir primer archivo
            </button>
          ) : null}
        </div>
      ) : (
        <div className="biblioteca-groups">
          {groupedByArea.map(([area, areaFiles]) => (
            <section key={area} className="biblioteca-area-section">
              <h3 className="biblioteca-area-title">{area} <span>{areaFiles.length}</span></h3>
              <div className="biblioteca-files-grid">
                {areaFiles.map((f) => (
                  <div key={f.id} className="biblioteca-file-card">
                    <button
                      type="button"
                      className="biblioteca-file-preview-btn"
                      onClick={() => setPreviewFile(f)}
                      title="Ver archivo"
                    >
                      {isImage(f.fileMimeType) ? (
                        <img src={f.fileThumbUrl || getFileUrl(f)} alt={f.originalName} className="biblioteca-thumb" />
                      ) : (
                        <div className="biblioteca-file-icon">
                          <FileText size={28} />
                          <span className="biblioteca-mime-badge">{mimeLabel(f.fileMimeType)}</span>
                        </div>
                      )}
                    </button>
                    <div className="biblioteca-file-info">
                      <p className="biblioteca-file-name" title={f.originalName}>{f.originalName}</p>
                      {f.description ? <p className="biblioteca-file-desc">{f.description}</p> : null}
                      <p className="biblioteca-file-meta">{formatDate(f.uploadedAt)} · {formatBytes(f.bytes)}</p>
                    </div>
                    <div className="biblioteca-file-actions">
                      <a
                        href={getFileUrl(f)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-button"
                        title="Abrir en pestaña"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <a
                        href={getFileUrl(f)}
                        download={f.originalName}
                        className="icon-button"
                        title="Descargar"
                      >
                        <Download size={14} />
                      </a>
                      {canDelete ? (
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => setDeleteId(f.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewFile ? (
        <div className="biblioteca-preview-backdrop" onClick={() => setPreviewFile(null)}>
          <div className="biblioteca-preview-panel" onClick={(e) => e.stopPropagation()}>
            <div className="biblioteca-preview-header">
              <span className="biblioteca-preview-title">{previewFile.originalName}</span>
              <div className="biblioteca-preview-header-actions">
                <button
                  type="button"
                  className="icon-button"
                  title={contentFullscreen ? "Reducir" : "Expandir archivo"}
                  onClick={() => setContentFullscreen((v) => !v)}
                >
                  {contentFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <a
                  href={getFileUrl(previewFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-button"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink size={15} />
                </a>
                <a href={getFileUrl(previewFile)} download={previewFile.originalName} className="icon-button" title="Descargar">
                  <Download size={15} />
                </a>
                <button type="button" className="icon-button" onClick={() => setPreviewFile(null)} title="Cerrar">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="biblioteca-preview-body">
              {previewLoading ? (
                <div className="biblioteca-loading"><Loader2 size={24} className="spin" /><span>Cargando…</span></div>
              ) : isImage(previewFile.fileMimeType) ? (
                <img
                  src={previewBlobUrl || getFileUrl(previewFile)}
                  alt={previewFile.originalName}
                  className={contentFullscreen ? "biblioteca-content-fullscreen" : "biblioteca-preview-img"}
                />
              ) : isPdf(previewFile.fileMimeType) ? (
                <embed
                  src={previewBlobUrl || getFileUrl(previewFile)}
                  type="application/pdf"
                  className={contentFullscreen ? "biblioteca-content-fullscreen" : "biblioteca-preview-iframe"}
                />
              ) : (
                <div className="biblioteca-preview-unsupported">
                  <FileText size={48} />
                  <p>Vista previa no disponible para este tipo de archivo.</p>
                  <a
                    href={getFileUrl(previewFile)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button sm-button"
                  >
                    <ExternalLink size={14} /> Abrir en nueva pestaña
                  </a>
                </div>
              )}
            </div>
            {previewFile.description ? (
              <div className="biblioteca-preview-footer">{previewFile.description}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        title="Subir archivo a la biblioteca"
        confirmLabel={uploading ? "Subiendo…" : "Subir archivo"}
        onConfirm={handleUpload}
        confirmDisabled={!uploadFile || uploading}
        onClose={() => { setUploadOpen(false); setUploadFile(null); setUploadError(null); setUploadPriority("baja"); setUploadNotify(false); }}
        className="biblioteca-upload-modal"
      >
        <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field-group">
            <label>Hoja / Sección</label>
            <select
              className="field-input"
              value={uploadArea}
              onChange={(e) => setUploadArea(e.target.value)}
            >
              {existingAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              <option value="__custom__">+ Nueva sección…</option>
            </select>
          </div>
          {uploadArea === "__custom__" ? (
            <div className="field-group">
              <label>Nombre de la nueva sección</label>
              <input
                className="field-input"
                type="text"
                placeholder="Ej. Recursos Humanos"
                value={uploadCustomArea}
                onChange={(e) => setUploadCustomArea(e.target.value)}
              />
            </div>
          ) : null}
          <div className="field-group">
            <label>Descripción (opcional)</label>
            <input
              className="field-input"
              type="text"
              placeholder="Ej. HAT actualizado Q1 2026"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Prioridad del documento</label>
            <div className="biblioteca-priority-selector">
              {[["alta", "🔴 Alta"], ["media", "🟡 Media"], ["baja", "⚪ Baja"]].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  className={`biblioteca-priority-btn ${val}${uploadPriority === val ? " active" : ""}`}
                  onClick={() => setUploadPriority(val)}
                >{lbl}</button>
              ))}
            </div>
          </div>
          <div className="field-group biblioteca-notify-row">
            <span>Notificar a todos los players</span>
            <button
              type="button"
              role="switch"
              aria-checked={uploadNotify}
              className={`biblioteca-switch${uploadNotify ? " on" : ""}`}
              onClick={() => setUploadNotify((v) => !v)}
            />
          </div>
          <div className="field-group">
            <label>Archivo</label>
            <div className="biblioteca-upload-dropzone" onClick={() => fileInputRef.current?.click()}>
              {uploadFile ? (
                <span className="biblioteca-upload-filename"><FileText size={14} /> {uploadFile.name}</span>
              ) : (
                <span className="biblioteca-upload-placeholder"><Upload size={16} /> Haz clic para seleccionar archivo</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.txt"
              style={{ display: "none" }}
              onChange={(e) => { setUploadFile(e.target.files[0] || null); e.target.value = ""; }}
            />
          </div>
          {uploadError ? <p className="biblioteca-upload-error">{uploadError}</p> : null}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(deleteId)}
        title="Eliminar archivo"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      >
        <p>¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Carga masiva */}
      <Modal
        open={bulkOpen}
        title="Carga masiva de archivos"
        confirmLabel={bulkUploading ? `Subiendo ${bulkProgress.done}/${bulkProgress.total}…` : "Subir todos"}
        onConfirm={handleBulkUpload}
        confirmDisabled={!bulkFiles.length || bulkUploading}
        onClose={() => { if (!bulkUploading) { setBulkOpen(false); setBulkFiles([]); setBulkErrors([]); setBulkArea("General"); setBulkCustomArea(""); setBulkPriority("baja"); setBulkNotify(false); } }}
        className="biblioteca-upload-modal"
      >
        <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field-group">
            <label>Hoja / Sección para todos los archivos</label>
            <select className="field-input" value={bulkArea} onChange={(e) => setBulkArea(e.target.value)}>
              {existingAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              <option value="__custom__">+ Nueva sección…</option>
            </select>
          </div>
          {bulkArea === "__custom__" ? (
            <div className="field-group">
              <label>Nombre de la nueva sección</label>
              <input className="field-input" type="text" placeholder="Ej. Normas Internas" value={bulkCustomArea} onChange={(e) => setBulkCustomArea(e.target.value)} />
            </div>
          ) : null}
          <div className="field-group">
            <label>Prioridad de los archivos</label>
            <div className="biblioteca-priority-selector">
              {[["alta", "🔴 Alta"], ["media", "🟡 Media"], ["baja", "⚪ Baja"]].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  className={`biblioteca-priority-btn ${val}${bulkPriority === val ? " active" : ""}`}
                  onClick={() => setBulkPriority(val)}
                >{lbl}</button>
              ))}
            </div>
          </div>
          <div className="field-group biblioteca-notify-row">
            <span>Notificar a todos los players</span>
            <button
              type="button"
              role="switch"
              aria-checked={bulkNotify}
              className={`biblioteca-switch${bulkNotify ? " on" : ""}`}
              onClick={() => setBulkNotify((v) => !v)}
            />
          </div>
          <div className="field-group">
            <label>Archivos ({bulkFiles.length} seleccionados)</label>
            <div
              className="biblioteca-upload-dropzone"
              onClick={() => bulkFileInputRef.current?.click()}
            >
              {bulkFiles.length ? (
                <div className="biblioteca-bulk-list">
                  {bulkFiles.map((f, i) => (
                    <span key={i} className="biblioteca-bulk-item"><FileText size={12} /> {f.name}</span>
                  ))}
                </div>
              ) : (
                <span className="biblioteca-upload-placeholder"><FolderUp size={16} /> Haz clic para seleccionar archivos (puedes seleccionar varios)</span>
              )}
            </div>
            <input
              ref={bulkFileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.txt"
              style={{ display: "none" }}
              onChange={(e) => { setBulkFiles(Array.from(e.target.files)); e.target.value = ""; }}
            />
          </div>
          {bulkUploading ? (
            <div className="biblioteca-bulk-progress">
              <div className="biblioteca-bulk-bar" style={{ width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%` }} />
              <span>{bulkProgress.done} de {bulkProgress.total} archivos</span>
            </div>
          ) : null}
          {bulkErrors.length ? (
            <div className="biblioteca-upload-error">
              {bulkErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
