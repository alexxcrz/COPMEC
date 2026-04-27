import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Upload } from "lucide-react";
import { Modal } from "./Modal";
import { uploadFileToCloudinary } from "../services/upload.service";
import { normalizeBoardEvidenceValue, normalizeBoardMultiSelectDetailValue } from "../utils/utilidades.jsx";

function isImageEvidence(evidence) {
  return String(evidence?.mimeType || "").toLowerCase().startsWith("image/");
}

function isVideoEvidence(evidence) {
  return String(evidence?.mimeType || "").toLowerCase().startsWith("video/");
}

export function BoardMultiSelectDetailCell({ field, value, options, disabled, onChange }) {
  const selections = normalizeBoardMultiSelectDetailValue(value);
  const selectedMap = useMemo(() => new Map(selections.map((item) => [item.option, item])), [selections]);

  function handleToggleOption(option) {
    const optionValue = String(option.value || "").trim();
    if (!optionValue) return;
    if (selectedMap.has(optionValue)) {
      onChange(selections.filter((item) => item.option !== optionValue));
      return;
    }
    onChange([...selections, { option: optionValue, label: option.label || optionValue, detail: "" }]);
  }

  function handleDetailChange(option, detail) {
    const optionValue = String(option.value || "").trim();
    onChange(selections.map((item) => (item.option === optionValue ? { ...item, label: option.label || optionValue, detail } : item)));
  }

  return (
    <div style={{ display: "grid", gap: "0.3rem", minWidth: 0 }}>
      {(options || []).map((option) => {
        const optionValue = String(option.value || "").trim();
        const selectedItem = selectedMap.get(optionValue) || null;
        const isSelected = Boolean(selectedItem);
        return (
          <div key={optionValue} style={{ border: "1px solid rgba(162,170,181,0.28)", borderRadius: "0.8rem", padding: "0.35rem 0.45rem", display: "grid", gap: "0.3rem", background: isSelected ? "rgba(3,33,33,0.04)" : "#fff" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", fontWeight: 600, color: "#244040" }}>
              <input type="checkbox" checked={isSelected} onChange={() => handleToggleOption(option)} disabled={disabled} />
              <span>{option.label || optionValue}</span>
            </label>
            {isSelected ? (
              <input
                type="text"
                inputMode="text"
                value={selectedItem?.detail || ""}
                onChange={(event) => handleDetailChange(option, event.target.value)}
                placeholder={field.placeholder || "Dato adicional"}
                disabled={disabled}
                style={{ width: "100%" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function BoardEvidenceCell({ value, disabled, onChange, label }) {
  const fileInputRef = useRef(null);
  const evidences = normalizeBoardEvidenceValue(value);
  const latestValueRef = useRef(evidences);
  const [uploading, setUploading] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null);

  useEffect(() => {
    latestValueRef.current = normalizeBoardEvidenceValue(value);
  }, [value]);

  const displayItems = pendingItems.concat(evidences);
  const viewerItems = evidences;
  const activeViewerItem = viewerIndex === null ? null : viewerItems[viewerIndex] || null;

  async function handleFileSelection(event) {
    const files = Array.from(event.target.files || []).filter(Boolean);
    if (!files.length) return;
    setUploading(true);

    try {
      for (const file of files) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const tempUrl = URL.createObjectURL(file);
        setPendingItems((current) => current.concat([{
          id: tempId,
          url: tempUrl,
          thumbnailUrl: tempUrl,
          mimeType: file.type,
          name: file.name,
          isPending: true,
        }]));

        try {
          const uploaded = await uploadFileToCloudinary(file);
          const nextItem = {
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
            mimeType: uploaded.fileMimeType || file.type,
            name: uploaded.originalName || file.name,
            publicId: uploaded.publicId || "",
          };
          const nextValue = latestValueRef.current.concat([nextItem]);
          latestValueRef.current = nextValue;
          onChange(nextValue);
        } finally {
          URL.revokeObjectURL(tempUrl);
          setPendingItems((current) => current.filter((item) => item.id !== tempId));
        }
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleOpenPicker() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function openViewerAt(index) {
    if (!viewerItems.length) return;
    setViewerIndex(index);
  }

  function moveViewer(step) {
    setViewerIndex((current) => {
      if (current === null || !viewerItems.length) return current;
      return (current + step + viewerItems.length) % viewerItems.length;
    });
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelection}
        disabled={disabled || uploading}
      />
      <div style={{ display: "grid", gap: "0.4rem", minWidth: 0 }}>
        <button
          type="button"
          onClick={handleOpenPicker}
          disabled={disabled || uploading}
          style={{
            width: "100%",
            minHeight: "96px",
            borderRadius: "1rem",
            border: "1px dashed rgba(22,89,71,0.32)",
            background: "#fff",
            padding: "0.45rem",
            display: "grid",
            gap: "0.35rem",
            alignContent: displayItems.length ? "start" : "center",
            cursor: disabled ? "default" : "pointer",
            overflow: "hidden",
          }}
          title={disabled ? label || "Evidencias" : "Agregar evidencias"}
        >
          {displayItems.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.35rem" }}>
              {displayItems.slice(0, 4).map((item, index) => {
                const previewStyle = { width: "100%", height: "62px", borderRadius: "0.7rem", objectFit: "cover", background: "#f3f5f8" };
                const evidenceIndex = evidences.findIndex((evidence) => evidence.url === item.url && evidence.name === item.name);
                return (
                  <div key={`${item.url}-${item.name}-${index}`} style={{ position: "relative" }}>
                    {isImageEvidence(item) ? (
                      <img src={item.thumbnailUrl || item.url} alt={item.name || "Evidencia"} style={previewStyle} />
                    ) : isVideoEvidence(item) ? (
                      <video src={item.url} poster={item.thumbnailUrl || undefined} style={previewStyle} muted playsInline preload="metadata" />
                    ) : (
                      <div style={{ ...previewStyle, display: "grid", placeItems: "center" }}><ImageIcon size={20} /></div>
                    )}
                    {!item.isPending && evidenceIndex >= 0 ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          openViewerAt(evidenceIndex);
                        }}
                        style={{ position: "absolute", inset: 0, border: 0, background: "transparent", cursor: "pointer" }}
                        aria-label={`Ver evidencia ${item.name || index + 1}`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", justifyItems: "center", gap: "0.25rem", color: "#456060" }}>
              <Upload size={18} />
              <strong style={{ fontSize: "0.82rem" }}>{uploading ? "Subiendo..." : "Agregar evidencias"}</strong>
              <span style={{ fontSize: "0.74rem" }}>Foto o video</span>
            </div>
          )}
        </button>
        {displayItems.length ? (
          <button type="button" className="icon-button" onClick={handleOpenPicker} disabled={disabled || uploading}>
            <Plus size={14} /> {uploading ? "Subiendo..." : "Agregar más"}
          </button>
        ) : null}
      </div>

      <Modal
        open={viewerIndex !== null && Boolean(activeViewerItem)}
        title={label || "Evidencias"}
        onClose={() => setViewerIndex(null)}
        confirmLabel="Cerrar"
        hideCancel
        footerActions={viewerItems.length > 1 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginRight: "auto" }}>
            <button type="button" className="icon-button" onClick={() => moveViewer(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "0.82rem", color: "#5b6b73" }}>{(viewerIndex || 0) + 1} / {viewerItems.length}</span>
            <button type="button" className="icon-button" onClick={() => moveViewer(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      >
        {activeViewerItem ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ minHeight: "360px", maxHeight: "65vh", display: "grid", placeItems: "center", background: "#0f1720", borderRadius: "1rem", overflow: "hidden" }}>
              {isImageEvidence(activeViewerItem) ? (
                <img src={activeViewerItem.url} alt={activeViewerItem.name || "Evidencia"} style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain" }} />
              ) : isVideoEvidence(activeViewerItem) ? (
                <video src={activeViewerItem.url} poster={activeViewerItem.thumbnailUrl || undefined} style={{ maxWidth: "100%", maxHeight: "65vh" }} controls autoPlay />
              ) : (
                <a href={activeViewerItem.url} target="_blank" rel="noreferrer" className="icon-button">Abrir archivo</a>
              )}
            </div>
            <div>
              <strong>{activeViewerItem.name || "Evidencia"}</strong>
              <p className="subtle-line" style={{ marginTop: "0.2rem" }}>{activeViewerItem.mimeType || "Archivo"}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}