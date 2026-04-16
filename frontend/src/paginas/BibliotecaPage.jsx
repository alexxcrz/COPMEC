import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Modal } from "../components/Modal.jsx";
import "./BibliotecaPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "/api";

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

export default function BibliotecaPage({ currentUser, canManage }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadArea, setUploadArea] = useState("General");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCustomArea, setUploadCustomArea] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

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
    const set = new Set(files.map((f) => f.area || "General"));
    return ["Todas", ...Array.from(set).sort()];
  }, [files]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return files.filter((f) => {
      const matchArea = areaFilter === "Todas" || f.area === areaFilter;
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
    const set = new Set(files.map((f) => f.area || "General").filter(Boolean));
    set.add("General");
    return Array.from(set).sort();
  }, [files]);

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

        <div className="biblioteca-area-filter-wrap">
          <Filter size={14} />
          <select
            className="biblioteca-area-select"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {canManage ? (
          <button type="button" className="primary-button sm-button" onClick={() => setUploadOpen(true)}>
            <Upload size={14} /> Subir archivo
          </button>
        ) : null}
      </div>

      {/* Body */}
      {loading ? (
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
          {canManage && files.length === 0 ? (
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
                        <img src={f.fileThumbUrl || f.fileUrl} alt={f.originalName} className="biblioteca-thumb" />
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
                        href={f.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-button"
                        title="Abrir en pestaña"
                      >
                        <ExternalLink size={14} />
                      </a>
                      {canManage ? (
                        <>
                          <a
                            href={f.fileUrl}
                            download={f.originalName}
                            className="icon-button"
                            title="Descargar"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => setDeleteId(f.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
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
                <a
                  href={previewFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-button"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink size={15} />
                </a>
                {canManage ? (
                  <a href={previewFile.fileUrl} download={previewFile.originalName} className="icon-button" title="Descargar">
                    <Download size={15} />
                  </a>
                ) : null}
                <button type="button" className="icon-button" onClick={() => setPreviewFile(null)} title="Cerrar">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="biblioteca-preview-body">
              {isImage(previewFile.fileMimeType) ? (
                <img src={previewFile.fileUrl} alt={previewFile.originalName} className="biblioteca-preview-img" />
              ) : isPdf(previewFile.fileMimeType) ? (
                <iframe
                  src={previewFile.fileUrl}
                  title={previewFile.originalName}
                  className="biblioteca-preview-iframe"
                />
              ) : (
                <div className="biblioteca-preview-unsupported">
                  <FileText size={48} />
                  <p>Vista previa no disponible para este tipo de archivo.</p>
                  <a
                    href={previewFile.fileUrl}
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
        onClose={() => { setUploadOpen(false); setUploadFile(null); setUploadError(null); }}
        className="biblioteca-upload-modal"
      >
        <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="field-group">
            <label>Área</label>
            <select
              className="field-input"
              value={uploadArea}
              onChange={(e) => setUploadArea(e.target.value)}
            >
              {existingAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              <option value="__custom__">+ Nueva área…</option>
            </select>
          </div>
          {uploadArea === "__custom__" ? (
            <div className="field-group">
              <label>Nombre del área nueva</label>
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
    </div>
  );
}
