import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBoardColumn,
  createBoardRow,
  persistCellValue,
} from "../../../services/board.service";
import { searchBoardRows } from "../../../services/import.service";
import { uploadFileToCloudinary } from "../../../services/upload.service";
import {
  boardColumns,
  createEmptyRowFromColumns,
  createSeedRows,
} from "../boardSchema";
import { getNumberMetrics } from "../utils/boardMath";

function isRowEmpty(row) {
  return Object.entries(row.cells).every(([key, value]) => {
    if (key === "status") return false;
    if (key === "completed") return !value;
    return value === "" || value === null;
  });
}

export function useBoardState(importedBoard = null) {
  const [columns, setColumns] = useState(importedBoard?.columns || boardColumns);
  const [rows, setRows] = useState(importedBoard?.rows || createSeedRows);
  const [loadingByCell, setLoadingByCell] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [searchRowsResult, setSearchRowsResult] = useState(null);

  const metricsByColumn = useMemo(() => {
    const numericColumns = columns.filter((column) => column.type === "number");

    return numericColumns.reduce((acc, column) => {
      acc[column.key] = getNumberMetrics(rows, column.key);
      return acc;
    }, {});
  }, [columns, rows]);

  useEffect(() => {
    if (!importedBoard) return;

    setColumns(importedBoard.columns || boardColumns);
    setRows(importedBoard.rows || []);
  }, [importedBoard]);

  function ensureInfiniteRows(updatedRows) {
    if (importedBoard?.id) {
      return updatedRows;
    }

    const lastRow = updatedRows[updatedRows.length - 1];
    if (!lastRow || isRowEmpty(lastRow) === false) {
      return [...updatedRows, createEmptyRowFromColumns(columns, updatedRows.length + 1)];
    }
    return updatedRows;
  }

  async function updateCell(rowId, columnKey, value) {
    setErrorMessage("");

    setRows((previousRows) => {
      const nextRows = previousRows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...row.cells, [columnKey]: value } } : row,
      );

      return ensureInfiniteRows(nextRows);
    });

    try {
      await persistCellValue(importedBoard?.id, rowId, columnKey, value);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo guardar el cambio.");
    }
  }

  async function uploadFileCell(rowId, columnKey, file) {
    const cellKey = `${rowId}-${columnKey}`;
    setLoadingByCell((prev) => ({ ...prev, [cellKey]: true }));
    setErrorMessage("");

    try {
      const result = await uploadFileToCloudinary(file);
      await updateCell(rowId, columnKey, {
        url: result.fileUrl,
        thumbUrl: result.fileThumbUrl,
        mimeType: result.fileMimeType,
        name: result.originalName,
      });
    } catch (error) {
      setErrorMessage(error.message || "Error al subir archivo.");
    } finally {
      setLoadingByCell((prev) => ({ ...prev, [cellKey]: false }));
    }
  }

  async function addManualRow() {
    if (importedBoard?.id) {
      try {
        const newRow = await createBoardRow(importedBoard.id);
        if (newRow) {
          setRows((previousRows) => [...previousRows, newRow]);
        }
      } catch (error) {
        setErrorMessage(error.message || "No se pudo crear la fila.");
      }
      return;
    }

    setRows((previousRows) => [
      ...previousRows,
      createEmptyRowFromColumns(columns, previousRows.length + 1),
    ]);
  }

  const runGlobalSearch = useCallback(async (query) => {
    if (!importedBoard?.id) {
      setSearchRowsResult(null);
      return;
    }

    try {
      const resultRows = await searchBoardRows(importedBoard.id, query);
      setSearchRowsResult(resultRows);
    } catch (error) {
      setErrorMessage(error.message || "No se pudo ejecutar la busqueda global.");
    }
  }, [importedBoard?.id]);

  async function addColumn({ label, key, type, options }) {
    const safeColumn = {
      id: `col-${Date.now()}`,
      label,
      key,
      type,
      options,
    };

    const defaultValue =
      type === "checkbox"
        ? false
        : type === "file"
          ? null
          : type === "select"
            ? options?.[0]?.value || ""
            : "";

    if (importedBoard?.id) {
      try {
        const createdColumn = await createBoardColumn(importedBoard.id, {
          label,
          key,
          type,
          options,
        });

        if (createdColumn) {
          safeColumn.id = createdColumn.id;
        }
      } catch (error) {
        setErrorMessage(error.message || "No se pudo crear la columna.");
        return;
      }
    }

    setColumns((previous) => [...previous, safeColumn]);
    setRows((previousRows) =>
      previousRows.map((row) => ({
        ...row,
        cells: {
          ...row.cells,
          [key]: defaultValue,
        },
      })),
    );
  }

  return {
    boardColumns: columns,
    rows,
    searchRowsResult,
    metricsByColumn,
    loadingByCell,
    errorMessage,
    updateCell,
    runGlobalSearch,
    uploadFileCell,
    addManualRow,
    addColumn,
  };
}
