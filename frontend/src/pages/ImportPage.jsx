import { useState } from "react";
import { Modal } from "../components/Modal";
import { importBoardFile } from "../services/import.service";
import "./ImportPage.css";

export function ImportPage({ workspaces, selectedWorkspaceId, onWorkspaceChange, onImported }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultBoard, setResultBoard] = useState(null);

  async function handleImport() {
    if (!selectedFile) {
      setError("Selecciona un archivo CSV o XLSX para continuar.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const board = await importBoardFile(selectedFile);
      setResultBoard(board);
    } catch (importError) {
      setError(importError.message || "No se pudo importar el archivo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="import-page">
      <h2>Importador CSV/XLSX</h2>
        <p>
          Carga un archivo con encabezados para crear automaticamente el tablero en COPMEC.
        </p>

      <label className="import-file-field">
        <span>Archivo de origen</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
      </label>

      <label className="import-file-field">
        <span>Area de trabajo destino</span>
        <select
          value={selectedWorkspaceId}
          onChange={(event) => onWorkspaceChange?.(event.target.value)}
        >
          {(workspaces || []).map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="import-button" onClick={handleImport} disabled={loading}>
        {loading ? "Importando..." : "Importar y crear tablero"}
      </button>

      {error ? <p className="import-error">{error}</p> : null}

      <Modal
        open={Boolean(resultBoard)}
        title="Importacion completada"
        confirmLabel="Ir al tablero"
        cancelLabel="Cerrar"
        onClose={() => setResultBoard(null)}
        onConfirm={() => {
          if (resultBoard) {
            onImported?.(resultBoard, selectedWorkspaceId, resultBoard.formulaLibrary || []);
          }
          setResultBoard(null);
        }}
      >
        <p>Se creo el tablero {resultBoard?.name}.</p>
        <p>
          Columnas detectadas: {resultBoard?.columns?.length || 0}. Filas cargadas:{" "}
          {resultBoard?.rows?.length || 0}.
        </p>
      </Modal>
    </section>
  );
}
