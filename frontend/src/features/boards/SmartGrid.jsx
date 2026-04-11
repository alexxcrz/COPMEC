import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import { CheckboxCell } from "./cells/CheckboxCell";
import { DateCell } from "./cells/DateCell";
import { FileCell } from "./cells/FileCell";
import { NumberCell } from "./cells/NumberCell";
import { SelectCell } from "./cells/SelectCell";
import { TextCell } from "./cells/TextCell";
import { useBoardState } from "./hooks/useBoardState";
import "./SmartGrid.css";

function renderCell(column, row, handlers) {
  const value = row.cells[column.key];

  if (column.type === "text") {
    return <TextCell value={value} placeholder={column.placeholder} onCommit={handlers.onUpdate} />;
  }

  if (column.type === "number") {
    return <NumberCell value={value} onCommit={handlers.onUpdate} />;
  }

  if (column.type === "checkbox") {
    return <CheckboxCell checked={value} onToggle={handlers.onUpdate} />;
  }

  if (column.type === "date") {
    return <DateCell value={value} onCommit={handlers.onUpdate} />;
  }

  if (column.type === "select") {
    return <SelectCell value={value} options={column.options || []} onChange={handlers.onUpdate} />;
  }

  if (column.type === "file") {
    return (
      <FileCell
        value={value}
        loading={handlers.loading}
        onUpload={handlers.onUpload}
        onPreview={handlers.onPreview}
      />
    );
  }

  return "-";
}

export function SmartGrid({ importedBoard }) {
  const {
    boardColumns,
    rows,
    searchRowsResult,
    loadingByCell,
    errorMessage,
    updateCell,
    runGlobalSearch,
    uploadFileCell,
    addManualRow,
    addColumn,
  } = useBoardState(importedBoard);

  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [newColumnType, setNewColumnType] = useState("text");

  function toColumnKey(label) {
    const key = String(label || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    return key || `col_${Date.now()}`;
  }

  async function handleAddColumn() {
    const label = newColumnLabel.trim();
    if (!label) return;

    const key = toColumnKey(label);
    const duplicated = boardColumns.some((column) => column.key === key);
    if (duplicated) return;

    const options =
      newColumnType === "select"
        ? [{ value: "Opcion 1", label: "Opcion 1", color: "#e7f3ef", textColor: "#184444" }]
        : undefined;

    await addColumn({
      label,
      key,
      type: newColumnType,
      options,
    });

    setShowAddColumnModal(false);
    setNewColumnLabel("");
    setNewColumnType("text");
  }

  useEffect(() => {
    if (!importedBoard?.id) return;
    runGlobalSearch(search);
  }, [importedBoard?.id, runGlobalSearch, search]);

  const visibleRows = useMemo(() => {
    if (importedBoard?.id) {
      return searchRowsResult || rows;
    }

    if (!search.trim()) return rows;

    const term = search.trim().toLowerCase();

    return rows.filter((row) =>
      boardColumns.some((column) => {
        const raw = row.cells[column.key];
        if (!raw) return false;
        if (typeof raw === "object") {
          return String(raw.name || raw.url || "").toLowerCase().includes(term);
        }
        return String(raw).toLowerCase().includes(term);
      }),
    );
  }, [boardColumns, importedBoard?.id, rows, search, searchRowsResult]);

  return (
    <section className="smart-grid-shell">
      <header className="smart-grid-header">
        <h3>Grid de trabajo</h3>
        <div className="smart-grid-tools">
          <input
            type="search"
            className="grid-search"
            placeholder="Buscar en filas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="add-row-button" onClick={addManualRow}>
            Agregar fila
          </button>
          <button
            type="button"
            className="add-column-button"
            onClick={() => setShowAddColumnModal(true)}
          >
            Agregar columna
          </button>
        </div>
      </header>

      {errorMessage ? <p className="grid-error">{errorMessage}</p> : null}

      <div className="smart-grid-table-wrap">
        <table className="smart-grid-table">
          <thead>
            <tr>
              {boardColumns.map((column) => (
                <th key={column.id}>{column.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className={row.cells.completed ? "is-checked-row" : ""}>
                {boardColumns.map((column) => {
                  const cellId = `${row.id}-${column.key}`;

                  return (
                    <td key={column.id}>
                      {renderCell(column, row, {
                        loading: Boolean(loadingByCell[cellId]),
                        onUpdate: (value) => updateCell(row.id, column.key, value),
                        onUpload: (file) => uploadFileCell(row.id, column.key, file),
                        onPreview: (value) => setPreviewFile(value),
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={showAddColumnModal}
        title="Agregar nueva columna"
        confirmLabel="Crear columna"
        cancelLabel="Cancelar"
        onClose={() => {
          setShowAddColumnModal(false);
          setNewColumnLabel("");
          setNewColumnType("text");
        }}
        onConfirm={handleAddColumn}
      >
        <label className="smart-grid-modal-field">
          <span>Nombre de columna</span>
          <input
            value={newColumnLabel}
            onChange={(event) => setNewColumnLabel(event.target.value)}
            placeholder="Ej: Solicitud"
          />
        </label>
        <label className="smart-grid-modal-field">
          <span>Tipo</span>
          <select
            value={newColumnType}
            onChange={(event) => setNewColumnType(event.target.value)}
          >
            <option value="text">Texto</option>
            <option value="number">Numero</option>
            <option value="checkbox">Checkbox</option>
            <option value="select">Select</option>
            <option value="date">Fecha</option>
            <option value="file">Archivo</option>
          </select>
        </label>
      </Modal>

      <Modal
        open={Boolean(previewFile)}
        title="Previsualizacion"
        confirmLabel="Cerrar"
        hideCancel
        onClose={() => setPreviewFile(null)}
        onConfirm={() => setPreviewFile(null)}
      >
        {previewFile?.mimeType?.includes("pdf") ? (
          <iframe
            title="Preview PDF"
            src={previewFile.url}
            className="file-preview-frame"
          />
        ) : (
          <img src={previewFile?.url} alt={previewFile?.name || "Archivo"} className="file-preview-image" />
        )}
      </Modal>
    </section>
  );
}
