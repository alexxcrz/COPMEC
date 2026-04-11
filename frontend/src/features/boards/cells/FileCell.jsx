import { Paperclip, Upload } from "lucide-react";
import "./FileCell.css";

export function FileCell({ value, loading, onUpload, onPreview }) {
  return (
    <div className="file-cell-wrap">
      <label className="file-upload-button">
        <Upload size={14} />
        <span>{loading ? "Subiendo..." : "Subir"}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload(file);
            }
            event.target.value = "";
          }}
        />
      </label>

      {value ? (
        <button type="button" className="file-preview-button" onClick={() => onPreview(value)}>
          {value.thumbUrl ? (
            <img src={value.thumbUrl} alt={value.name || "Archivo"} className="file-thumb" />
          ) : (
            <Paperclip size={15} />
          )}
          <span className="file-name">{value.name || "Archivo"}</span>
        </button>
      ) : (
        <span className="file-empty">Sin archivo</span>
      )}
    </div>
  );
}
