import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
const ACTIVE_BOX_STORAGE_PREFIX = "copmec_returns_recondition_active_box";
// --- Tarima/caja state helpers ---
// const ACTIVE_TARIMA_STORAGE_PREFIX = "copmec_returns_recondition_active_tarima"; // Eliminada duplicada
// ...existing code...
// Clave para persistir el orden de productos por caja
const PRODUCT_ORDER_STORAGE_PREFIX = "copmec_returns_recondition_product_order";
const PRODUCT_WIDTH_STORAGE_PREFIX = "copmec_returns_recondition_product_width";
import { Modal } from "../../components/Modal";
import { findInventoryItemByQuery, normalizeKey, formatElapsedMs } from "../../utils/utilidades.jsx";

const ACTIVE_TARIMA_STORAGE_PREFIX = "copmec_returns_recondition_active_tarima";

function normalizeExpiryInput(value) {
  return String(value || "").trim().toUpperCase();
}

function safeParseLotHistory(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        lot: String(entry?.lot || "").trim(),
        expiry: normalizeExpiryInput(entry?.expiry),
        updatedAt: String(entry?.updatedAt || "").trim(),
      }))
      .filter((entry) => entry.lot && entry.expiry);
  } catch {
    return [];
  }
}

async function toDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ...existing code...
// Error boundary solo en desarrollo para evitar ReferenceError y mostrar mensaje amigable
function DevErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null);
  try {
    if (err) throw err;
    return children;
  } catch (e) {
    if (!err) setErr(e);
    return <div style={{color:'#b91c1c',background:'#fff0f0',padding:24,borderRadius:16}}><b>Error en ReturnsReconditionScanner:</b><br/>{String(e.message || e)}</div>;
  }
}

// ...existing code...

export default function ReturnsReconditionScanner(props) {
  if (import.meta.env && import.meta.env.DEV) {
    return <DevErrorBoundary><ReturnsReconditionScannerInner {...props} /></DevErrorBoundary>;
  }
  return <ReturnsReconditionScannerInner {...props} />;
}

function ReturnsReconditionScannerInner({
  boardView,
  currentUser,
  inventoryItems,
  requestJson,
  applyRemoteWarehouseState,
  setState,
  setLoginDirectory,
  skipNextSyncRef,
  setSyncStatus,
  setBoardRuntimeFeedback,
  disabled,
}) {
  // Estado para el orden de productos (drag & drop)
  const [productOrder, setProductOrder] = useState([]);
  const [productWidths, setProductWidths] = useState({});
  const [hiddenTarimaIds, setHiddenTarimaIds] = useState([]);
  const scanRef = useRef(null);
  const lotInputRef = useRef(null);
  const expiryInputRef = useRef(null);
  const autoScanTimeoutRef = useRef(null);
  const modalAutoCommitRef = useRef(false);
  const pauseCheckIntervalRef = useRef(null);
  
  const [scanValue, setScanValue] = useState("");
  const [activeTarima, setActiveTarima] = useState(null);
  const [activeBoxId, setActiveBoxId] = useState(null);
  const [completedBoxes, setCompletedBoxes] = useState([]);
  const [pendingItem, setPendingItem] = useState(null);
  const [systemPaused, setSystemPaused] = useState(false);
  
  // Modales
  const [tarimaModalOpen, setTarimaModalOpen] = useState(false);
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [lotModalOpen, setLotModalOpen] = useState(false);
  
  const [tarimaForm, setTarimaForm] = useState({ tarimaNumber: "", flowType: "devolucion" });
  const [boxForm, setBoxForm] = useState({ boxNumber: "", targetPieces: 50 });
  const [setupForm, setSetupForm] = useState({ palletNumber: "", tarimaNumber: "", flowType: "devolucion", targetPieces: 50 });
  const [lotForm, setLotForm] = useState({ lot: "", expiry: "", pieces: 1, selectedLotKey: "" });
  
  const [nowTick, setNowTick] = useState(() => Date.now());
  
  // Obtener caja activa
  const activeBox = useMemo(() => {
    if (!activeTarima || !activeBoxId) return null;
    return activeTarima.boxes?.find((b) => b.id === activeBoxId) || null;
  }, [activeTarima, activeBoxId]);

  // Pausa automática por horario México (16:00-08:00)
  useEffect(() => {
    const checkPause = () => {
      const now = new Date();
      const mexicoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
      const hours = mexicoTime.getHours();
      const shouldPause = hours >= 16 || hours < 8;
      setSystemPaused(shouldPause);
    };
    checkPause();
    pauseCheckIntervalRef.current = setInterval(checkPause, 60000);
    return () => {
      if (pauseCheckIntervalRef.current) clearInterval(pauseCheckIntervalRef.current);
    };
  }, []);
  
  // Cargar anchos guardados al montar/cambiar caja
  useEffect(() => {
    if (!activeBox?.id) return;
    try {
      const raw = localStorage.getItem(`${PRODUCT_WIDTH_STORAGE_PREFIX}:${activeBox.id}`);
      if (raw) setProductWidths(JSON.parse(raw));
      else setProductWidths({});
    } catch {
      setProductWidths({});
    }
  }, [activeBox?.id]);

  // Guardar anchos al cambiar
  useEffect(() => {
    if (!activeBox?.id) return;
    try {
      localStorage.setItem(`${PRODUCT_WIDTH_STORAGE_PREFIX}:${activeBox.id}`, JSON.stringify(productWidths));
    } catch {}
  }, [productWidths, activeBox?.id]);

  // Handler para cambiar el ancho de un producto/caja
  const handleResizeProduct = (itemId, newWidth) => {
    setProductWidths((widths) => ({ ...widths, [itemId]: Math.max(180, Math.min(800, Math.round(newWidth))) }));
  };

  // Cargar orden guardado al montar/cambiar caja
  useEffect(() => {
    if (!activeBox?.id) return;
    try {
      const raw = localStorage.getItem(`${PRODUCT_ORDER_STORAGE_PREFIX}:${activeBox.id}`);
      if (raw) setProductOrder(JSON.parse(raw));
      else setProductOrder([]);
    } catch {
      setProductOrder([]);
    }
  }, [activeBox?.id]);

  // Guardar orden al cambiar
  useEffect(() => {
    if (!activeBox?.id) return;
    try {
      localStorage.setItem(`${PRODUCT_ORDER_STORAGE_PREFIX}:${activeBox.id}`, JSON.stringify(productOrder));
    } catch {}
  }, [productOrder, activeBox?.id]);

  // Función para reordenar productos
  const moveProduct = useCallback((fromIdx, toIdx) => {
    setProductOrder((order) => {
      const baseProducts = Object.values(activeBox?.products || {});
      const arr = order.length ? [...order] : baseProducts.map((p) => p.itemId);
      const [removed] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, removed);
      return arr;
    });
  }, [activeBox?.products]);

  const boardLabel = String(boardView?.name || "Proceso").trim() || "Proceso";

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!activeBox?.startedAt || activeBox?.stoppedAt) return undefined;
    const timer = globalThis.setInterval(() => setNowTick(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, [activeBox?.startedAt, activeBox?.stoppedAt]);

  useEffect(() => {
    if (disabled) return;
    scanRef.current?.focus();
  }, [activeBox, disabled, lotModalOpen, setupModalOpen]);

  useEffect(() => {
    if (!lotModalOpen) return;
    const focusTimer = globalThis.setTimeout(() => {
      lotInputRef.current?.focus();
      lotInputRef.current?.select?.();
    }, 20);
    return () => globalThis.clearTimeout(focusTimer);
  }, [lotModalOpen, pendingItem?.id]);

  useEffect(() => {
    if (autoScanTimeoutRef.current) {
      globalThis.clearTimeout(autoScanTimeoutRef.current);
      autoScanTimeoutRef.current = null;
    }

    if (disabled || lotModalOpen || setupModalOpen || tarimaModalOpen || boxModalOpen) return undefined;
    const raw = String(scanValue || "").trim();
    if (!raw) return undefined;

    const found = findInventoryItemByQuery(inventoryItems, raw);
    if (!found) return undefined;

    autoScanTimeoutRef.current = globalThis.setTimeout(() => {
      handleScanSubmit();
    }, 180);

    return () => {
      if (autoScanTimeoutRef.current) {
        globalThis.clearTimeout(autoScanTimeoutRef.current);
        autoScanTimeoutRef.current = null;
      }
    };
  }, [scanValue, disabled, lotModalOpen, setupModalOpen, tarimaModalOpen, boxModalOpen, inventoryItems]);

  const inventoryMapById = useMemo(
    () => new Map((inventoryItems || []).map((item) => [item.id, item])),
    [inventoryItems],
  );

  const activeBox = useMemo(() => {
    if (!activeTarima || !activeBoxId) return null;
    return (activeTarima.boxes || []).find((box) => box.id === activeBoxId) || null;
  }, [activeTarima, activeBoxId]);

  // Ordenar productos según productOrder
  const activeProducts = useMemo(() => {
    const products = Object.values(activeBox?.products || {})
      .filter((p) => !p.tarimaId || !hiddenTarimaIds.includes(p.tarimaId) === false);
    if (!productOrder.length) return products.sort((a, b) => Number(a.firstCapturedAt || 0) - Number(b.firstCapturedAt || 0));
    const map = new Map(products.map((p) => [p.itemId, p]));
    return productOrder.map((id) => map.get(id)).filter(Boolean).concat(products.filter((p) => !productOrder.includes(p.itemId)));
  }, [activeBox, hiddenTarimaIds, productOrder]);
    // Cierre de tarima: ocultar productos de la tarima cerrada

  const activePieces = useMemo(
    () => activeProducts.reduce((acc, product) => acc + Number(product.totalPieces || 0), 0),
    [activeProducts],
  );
  const elapsedMs = activeBox?.startedAt
    ? (activeBox?.stoppedAt ? new Date(activeBox.stoppedAt).getTime() : nowTick) - new Date(activeBox.startedAt).getTime()
    : 0;

  const boardFieldMap = useMemo(
    () => new Map((boardView?.fields || []).map((field) => [normalizeKey(field.label), field])),
    [boardView?.fields],
  );

  const boardId = boardView?.id || "";
  const activeBoxStorageKey = `${ACTIVE_BOX_STORAGE_PREFIX}:${boardId || "default"}`;

  const pendingLotOptions = useMemo(() => {
    if (!pendingItem) return [];
    const product = activeBox?.products?.[pendingItem.id] || null;
    const merged = [];
    const knownKeys = new Set();

    const pushEntry = (entry) => {
      const lot = String(entry?.lot || "").trim();
      const expiry = normalizeExpiryInput(entry?.expiry);
      if (!lot || !expiry) return;
      const key = `${normalizeKey(lot)}::${expiry}`;
      if (knownKeys.has(key)) return;
      knownKeys.add(key);
      merged.push({ key, lot, expiry, label: `${lot} · ${expiry}` });
    };

    (Array.isArray(product?.lots) ? product.lots : []).forEach(pushEntry);
    getItemLotHistory(pendingItem).forEach(pushEntry);
    return merged;
  }, [pendingItem, activeBox]);

  function getItemLotHistory(item) {
    return safeParseLotHistory(item?.customFields?.lotesCaducidades);
  }

  // Cargar tarima desde localStorage al montar
  useEffect(() => {
    if (!boardId || disabled || activeTarima) return;
    try {
      const raw = localStorage.getItem(`${ACTIVE_TARIMA_STORAGE_PREFIX}:${boardId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.stoppedAt || parsed.closedAt) return;
      setActiveTarima(parsed);
      if (parsed.boxes && parsed.boxes.length > 0) {
        setActiveBoxId(parsed.boxes[0].id);
        setBoardRuntimeFeedback({ tone: "success", message: `Tarima ${parsed.tarimaNumber || "activa"} recuperada tras recarga.` });
      }
    } catch {
      // Ignore corrupted local state.
    }
  }, [activeTarima, boardId, disabled, setBoardRuntimeFeedback]);

  // Guardar tarima en localStorage
  useEffect(() => {
    if (!boardId) return;
    try {
      if (activeTarima && !activeTarima.stoppedAt && !activeTarima.closedAt) {
        localStorage.setItem(`${ACTIVE_TARIMA_STORAGE_PREFIX}:${boardId}`, JSON.stringify(activeTarima));
      } else {
        localStorage.removeItem(`${ACTIVE_TARIMA_STORAGE_PREFIX}:${boardId}`);
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [activeTarima, boardId]);

  useEffect(() => {
    if (!lotModalOpen || !pendingItem) return undefined;
    const scannedText = String(lotForm.lot || "").trim();
    if (!scannedText) return undefined;
    if (normalizeKey(scannedText) !== normalizeKey(pendingItem.code)) return undefined;

    const timer = globalThis.setTimeout(() => {
      void tryAutoAddPendingCode(scannedText);
    }, 120);
    return () => globalThis.clearTimeout(timer);
  }, [lotModalOpen, lotForm.lot, lotForm.expiry, pendingItem?.id, pendingItem?.code, pendingLotOptions]);

  async function persistLotHistory(item, lot, expiry) {
    const normalizedExpiry = normalizeExpiryInput(expiry);
    if (!item?.id || !lot || !normalizedExpiry) return;
    const current = getItemLotHistory(item);
    const duplicate = current.some((entry) => normalizeKey(entry.lot) === normalizeKey(lot) && normalizeExpiryInput(entry.expiry) === normalizedExpiry);
    if (duplicate) return;

    const next = [{ lot, expiry: normalizedExpiry, updatedAt: new Date().toISOString() }, ...current].slice(0, 300);
    const payload = {
      ...item,
      customFields: {
        ...(item.customFields || {}),
        lote: lot,
        caducidad: normalizedExpiry,
      },
    };
    // Si necesitas persistir tarima, hazlo fuera del objeto:
    // localStorage.setItem(`${ACTIVE_TARIMA_STORAGE_PREFIX}:${boardId}`, JSON.stringify(activeTarima));

    try {
      const result = await requestJson(`/warehouse/inventory/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const remoteState = result?.data?.state || result?.state || null;
      if (remoteState) {
        applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
      }
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo guardar lote/caducidad en inventario." });
    }
  }

  function buildBoardRowValues(box, item, product) {
    const fieldTarima = boardFieldMap.get("tarima");
    const fieldTipo = boardFieldMap.get("tipo de flujo");
    const fieldProducto = boardFieldMap.get("producto");
    const fieldLote = boardFieldMap.get("lote");
    const fieldCaducidad = boardFieldMap.get("caducidad");
    const fieldPiezas = boardFieldMap.get("piezas");
    const fieldMeta = boardFieldMap.get("meta de caja");
    const lots = Array.isArray(product?.lots) ? product.lots : [];
    const lotSummary = lots.map((entry) => String(entry?.lot || "").trim()).filter(Boolean).join(" | ");
    const expirySummary = lots.map((entry) => normalizeExpiryInput(entry?.expiry)).filter(Boolean).join(" | ");

    return {
      ...(fieldTarima ? { [fieldTarima.id]: box.palletNumber } : {}),
      ...(fieldTipo ? { [fieldTipo.id]: box.flowType === "reacondicionado" ? "Reacondicionado" : "Devolución" } : {}),
      ...(fieldProducto ? { [fieldProducto.id]: item.id } : {}),
      ...(fieldLote ? { [fieldLote.id]: lotSummary } : {}),
      ...(fieldCaducidad ? { [fieldCaducidad.id]: expirySummary } : {}),
      ...(fieldPiezas ? { [fieldPiezas.id]: Number(product?.totalPieces || 0) } : {}),
      ...(fieldMeta ? { [fieldMeta.id]: box.targetPieces } : {}),
    };
  }

  async function createBoardDetailRow(box, item, product, status = "") {
    if (!boardId) return;
    const createdState = await requestJson(`/warehouse/boards/${boardId}/rows`, {
      method: "POST",
    });
    const createdBoard = (createdState?.controlBoards || []).find((entry) => entry.id === boardId);
    const createdRow = createdBoard?.rows?.[createdBoard.rows.length - 1];
    if (!createdRow?.id) return "";

    applyRemoteWarehouseState(createdState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);

    const patchedState = await requestJson(`/warehouse/boards/${boardId}/rows/${createdRow.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...(status ? { status } : {}),
        values: buildBoardRowValues(box, item, product),
      }),
    });
    applyRemoteWarehouseState(patchedState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    return createdRow.id;
  }

  async function updateBoardDetailRow(rowId, box, item, product, status = "") {
    if (!boardId || !rowId) return rowId;
    const patchedState = await requestJson(`/warehouse/boards/${boardId}/rows/${rowId}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...(status ? { status } : {}),
        values: buildBoardRowValues(box, item, product),
      }),
    });
    applyRemoteWarehouseState(patchedState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    return rowId;
  }

  async function closeBoardWorkflowRows(box) {
    if (!boardId) return;
    const rowIds = Array.from(new Set([...(box?.persistedRowIds || []), ...(box?.timerRowId ? [box.timerRowId] : [])].filter(Boolean)));
    if (!rowIds.length) return;

    for (const rowId of rowIds) {
      const patchedState = await requestJson(`/warehouse/boards/${boardId}/rows/${rowId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Terminado" }),
      });
      applyRemoteWarehouseState(patchedState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
    }
  }

  async function exportClosedBoxPdf(box) {
    try {
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default || autoTableModule;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const marginX = 40;
      let y = 48;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${boardLabel} · Caja ${box.palletNumber}`, marginX, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Revisó: ${box.reviewerName}`, marginX, y);
      y += 13;
      doc.text(`Flujo: ${box.flowType === "reacondicionado" ? "Reacondicionado" : "Devolución"}`, marginX, y);
      y += 13;
      doc.text(`Piezas objetivo: ${box.targetPieces} · Piezas reales: ${box.totalPieces}`, marginX, y);
      y += 18;
      doc.text(`Tiempo total: ${formatElapsedMs(new Date(box.stoppedAt).getTime() - new Date(box.startedAt).getTime())}`, marginX, y);
      y += 18;

      const productCodes = Array.from(new Set(
        box.products.map((product) => String(product.code || "").trim()).filter(Boolean),
      ));
      const qrByCode = new Map();
      await Promise.all(productCodes.map(async (productCode) => {
        try {
          const qrUrl = `https://quickchart.io/qr?size=120&text=${encodeURIComponent(productCode)}`;
          const qrDataUrl = await toDataUrl(qrUrl);
          qrByCode.set(productCode, qrDataUrl);
        } catch {
          qrByCode.set(productCode, "");
        }
      }));

      const rows = [];
      box.products.forEach((product) => {
        const productCode = String(product.code || "").trim();
        if (!product.lots.length) {
          rows.push({
            qrDataUrl: qrByCode.get(productCode) || "",
            code: productCode,
            name: product.name,
            presentation: product.presentation || "-",
            lot: "-",
            expiry: "-",
            pieces: String(product.totalPieces),
          });
          return;
        }
        product.lots.forEach((lot, index) => {
          rows.push({
            qrDataUrl: index === 0 ? (qrByCode.get(productCode) || "") : "",
            code: index === 0 ? productCode : "",
            name: index === 0 ? product.name : "",
            presentation: index === 0 ? product.presentation || "-" : "",
            lot: lot.lot,
            expiry: lot.expiry,
            pieces: String(lot.pieces),
          });
        });
      });

      autoTable(doc, {
        startY: y,
        head: [["QR", "Código", "Nombre", "Presentación", "Lote", "Caducidad", "Piezas"]],
        body: rows,
        columns: [
          { header: "QR", dataKey: "qrDataUrl" },
          { header: "Código", dataKey: "code" },
          { header: "Nombre", dataKey: "name" },
          { header: "Presentación", dataKey: "presentation" },
          { header: "Lote", dataKey: "lot" },
          { header: "Caducidad", dataKey: "expiry" },
          { header: "Piezas", dataKey: "pieces" },
        ],
        styles: { fontSize: 8, cellPadding: 4, valign: "middle" },
        headStyles: { fillColor: [3, 33, 33] },
        columnStyles: {
          qrDataUrl: { cellWidth: 56, minCellHeight: 44 },
          code: { cellWidth: 90 },
          name: { cellWidth: 190 },
          presentation: { cellWidth: 110 },
          lot: { cellWidth: 100 },
          expiry: { cellWidth: 95 },
          pieces: { cellWidth: 60, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.dataKey === "qrDataUrl") {
            data.cell.text = [""];
          }
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.dataKey !== "qrDataUrl") return;
          const qrDataUrl = data.row.raw?.qrDataUrl;
          if (!qrDataUrl) return;
          const qrSize = Math.min(34, data.cell.height - 8, data.cell.width - 8);
          const qrX = data.cell.x + ((data.cell.width - qrSize) / 2);
          const qrY = data.cell.y + ((data.cell.height - qrSize) / 2);
          doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
        },
      });

      const blob = doc.output("blob");
      doc.save(`caja-${box.palletNumber}-${box.flowType}.pdf`);
      await printPdfBlob(blob);
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo generar el PDF de la caja." });
    }
  }

  async function closeCurrentBox(box) {
    const payload = {
      ...box,
      closedAt: new Date().toISOString(),
      stoppedAt: new Date().toISOString(),
      totalPieces: box.totalPieces,
      products: box.products,
    };
    await closeBoardWorkflowRows(payload);
    setCompletedBoxes((current) => [payload, ...current].slice(0, 20));
    
    // Remover caja de tarima
    setActiveTarima((current) => {
      if (!current) return current;
      const updatedBoxes = current.boxes.filter((b) => b.id !== box.id);
      return { ...current, boxes: updatedBoxes };
    });
    
    setActiveBoxId(null);
    await exportClosedBoxPdf(payload);
  }

  async function finishActiveBoxManually() {
    if (!activeBox) return;
    const hasProducts = Object.keys(activeBox.products || {}).length > 0;
    if (!hasProducts) {
      setBoardRuntimeFeedback({ tone: "danger", message: "No puedes terminar una caja vacía." });
      return;
    }
    await closeCurrentBox({
      ...activeBox,
      products: Object.values(activeBox.products || {}),
    });
    setBoardRuntimeFeedback({ tone: "success", message: "Caja terminada y PDF generado." });
  }
  
  async function finishActiveTarimaManually() {
    if (!activeTarima) return;
    const allBoxes = activeTarima.boxes || [];
    if (allBoxes.length === 0) {
      setBoardRuntimeFeedback({ tone: "danger", message: "No hay cajas en esta tarima." });
      return;
    }
    
    // Generar PDF consolidado de tarima
    for (const box of allBoxes) {
      if (Object.keys(box.products || {}).length > 0) {
        await closeCurrentBox({
          ...box,
          products: Object.values(box.products || {}),
        });
      }
    }
    
    // Marcar tarima como cerrada
    setActiveTarima((current) => (current ? { ...current, closedAt: new Date().toISOString(), stoppedAt: new Date().toISOString() } : null));
    setActiveBoxId(null);
    setBoardRuntimeFeedback({ tone: "success", message: `Tarima ${activeTarima.tarimaNumber} cerrada completamente. PDF consolidado generado.` });
  }

  function getPreferredLotFromProduct(product) {
    const lots = Array.isArray(product?.lots) ? product.lots : [];
    if (!lots.length) return null;
    const preferredKey = String(product?.lastLotKey || "").trim();
    if (preferredKey) {
      const matched = lots.find((entry) => `${normalizeKey(entry.lot)}::${normalizeExpiryInput(entry.expiry)}` === preferredKey);
      if (matched) return matched;
    }
    return lots[lots.length - 1] || lots[0] || null;
  }

  function openLotModalForItem(item, product = null) {
    const history = getItemLotHistory(item);
    const preferredLot = getPreferredLotFromProduct(product);
    const selectedLotKey = preferredLot ? `${normalizeKey(preferredLot.lot)}::${normalizeExpiryInput(preferredLot.expiry)}` : "";
    setPendingItem(item);
    setLotForm({
      lot: preferredLot?.lot || history[0]?.lot || "",
      expiry: preferredLot?.expiry || history[0]?.expiry || "",
      pieces: 1,
      selectedLotKey,
    });
    setLotModalOpen(true);
  }

  function openLotModalForProduct(product) {
    const item = inventoryMapById.get(product?.itemId || "") || null;
    if (!item) return;
    openLotModalForItem(item, product);
  }

  // Crear nueva tarima
  function startNewTarima() {
    if (!tarimaForm.tarimaNumber) {
      setBoardRuntimeFeedback({ tone: "danger", message: "Ingresa número de tarima." });
      return;
    }
    const newTarima = {
      id: `tarima-${Date.now()}`,
      tarimaNumber: tarimaForm.tarimaNumber,
      flowType: tarimaForm.flowType,
      boxes: [],
      startedAt: new Date().toISOString(),
      totalPieces: 0,
    };
    setActiveTarima(newTarima);
    setTarimaModalOpen(false);
    setTarimaForm({ tarimaNumber: "", flowType: "devolucion" });
    setBoardRuntimeFeedback({ tone: "success", message: `Tarima ${tarimaForm.tarimaNumber} iniciada.` });
    setBoxModalOpen(true);
  }
  
  // Crear nueva caja dentro de tarima
  function addNewBoxToTarima() {
    if (!activeTarima) {
      setBoardRuntimeFeedback({ tone: "danger", message: "Primero crea una tarima." });
      return;
    }
    if (!boxForm.boxNumber) {
      setBoardRuntimeFeedback({ tone: "danger", message: "Ingresa número de caja." });
      return;
    }
    const newBox = {
      id: `box-${Date.now()}`,
      palletNumber: boxForm.boxNumber,
      targetPieces: Math.max(1, boxForm.targetPieces),
      products: {},
      totalPieces: 0,
      startedAt: new Date().toISOString(),
      persistedRowIds: [],
      timerRowId: "",
    };
    const updatedTarima = {
      ...activeTarima,
      boxes: [...(activeTarima.boxes || []), newBox],
    };
    setActiveTarima(updatedTarima);
    setActiveBoxId(newBox.id);
    setBoxModalOpen(false);
    setBoxForm({ boxNumber: "", targetPieces: 50 });
    setBoardRuntimeFeedback({ tone: "success", message: `Caja ${boxForm.boxNumber} agregada.` });
  }
  
  function handleScanSubmit() {
    if (disabled || systemPaused) {
      if (systemPaused) {
        setBoardRuntimeFeedback({ tone: "warning", message: "Sistema pausado automáticamente. Se reanudará a las 08:00 hrs México." });
      }
      return;
    }
    
    const raw = String(scanValue || "").trim();
    if (!raw) return;
    const found = findInventoryItemByQuery(inventoryItems, raw);
    if (!found) {
      setBoardRuntimeFeedback({ tone: "danger", message: `No existe ese código en inventario: ${raw}` });
      setScanValue("");
      return;
    }

    setScanValue("");
    
    // Si no hay tarima, abrir modal de tarima
    if (!activeTarima) {
      setPendingItem(found);
      setTarimaModalOpen(true);
      return;
    }
    
    // Si hay tarima pero no hay caja, abrir modal de caja
    if (!activeBox) {
      setPendingItem(found);
      setBoxModalOpen(true);
      return;
    }

    const currentProduct = activeBox.products?.[found.id] || null;
    const preferredLot = getPreferredLotFromProduct(currentProduct);
    const isDoubleScanSameProduct = Boolean(preferredLot) && activeBox.lastScannedItemId === found.id;

    if (isDoubleScanSameProduct) {
      void commitLotEntry(found, preferredLot.lot, preferredLot.expiry, 1, { closeModal: false, successMode: "auto" });
      return;
    }
    
    // Si escanea producto diferente, preguntar si abre nueva caja
    const hasOtherProducts = Object.keys(activeBox.products || {}).length > 0;
    const isDifferentProduct = hasOtherProducts && !currentProduct;
    
    if (isDifferentProduct) {
      setPendingItem(found);
      // Auto-open box modal para new caja
      setBoxModalOpen(true);
      return;
    }

    setActiveTarima((current) => {
      if (!current) return current;
      const updatedBoxes = current.boxes.map((b) => {
        if (b.id === activeBoxId) {
          return { ...b, lastScannedItemId: found.id };
        }
        return b;
      });
      return { ...current, boxes: updatedBoxes };
    });
    
    openLotModalForItem(found, currentProduct);
  }

  async function commitLotEntry(itemRef, lotValue, expiryValue, piecesValue, options = {}) {
    if (!activeBox || !itemRef) return;
    const lot = String(lotValue || "").trim();
    const expiry = normalizeExpiryInput(expiryValue);
    const pieces = Math.max(1, Number(piecesValue || 0));
    if (!lot || !expiry || !pieces) return;

    const item = inventoryMapById.get(itemRef.id) || itemRef;
    const currentProduct = activeBox.products[item.id] || {
      itemId: item.id,
      code: item.code,
      name: item.name,
      presentation: item.presentation,
      totalPieces: 0,
      lots: [],
      rowId: "",
      lastLotKey: "",
      firstCapturedAt: Date.now(),
      tarimaId: activeTarima?.id || null,
    };

    const lotIndex = currentProduct.lots.findIndex((entry) => normalizeKey(entry.lot) === normalizeKey(lot) && normalizeExpiryInput(entry.expiry) === expiry);
    const nextLots = [...currentProduct.lots];
    if (lotIndex >= 0) {
      nextLots[lotIndex] = { ...nextLots[lotIndex], pieces: Number(nextLots[lotIndex].pieces || 0) + pieces };
    } else {
      nextLots.push({ lot, expiry, pieces });
    }

    const nextProduct = {
      ...currentProduct,
      totalPieces: Number(currentProduct.totalPieces || 0) + pieces,
      lots: nextLots,
      lastLotKey: `${normalizeKey(lot)}::${expiry}`,
    };

    const nextProducts = {
      ...activeBox.products,
      [item.id]: nextProduct,
    };

    const totalPieces = Object.values(nextProducts).reduce((acc, product) => acc + Number(product.totalPieces || 0), 0);
    const shouldCreateTimerRow = !activeBox.timerRowId;
    let rowId = currentProduct.rowId || "";

    try {
      if (!rowId) {
        rowId = await createBoardDetailRow(activeBox, item, nextProduct, shouldCreateTimerRow ? "En curso" : "");
      } else {
        rowId = await updateBoardDetailRow(rowId, activeBox, item, nextProduct, "");
      }
    } catch (error) {
      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo guardar la captura en el tablero." });
      return;
    }

    const persistedRowIds = Array.from(new Set([...(activeBox.persistedRowIds || []), ...(rowId ? [rowId] : [])]));
    const nextProductWithRow = {
      ...nextProduct,
      rowId: rowId || currentProduct.rowId || "",
    };
    const nextProductsWithRow = {
      ...nextProducts,
      [item.id]: nextProductWithRow,
    };

    const nextBox = {
      ...activeBox,
      timerRowId: activeBox.timerRowId || rowId,
      persistedRowIds,
      products: nextProductsWithRow,
      totalPieces,
      lastScannedItemId: item.id,
    };

    // Actualizar tarima con la caja modificada
    setActiveTarima((current) => {
      if (!current) return current;
      const updatedBoxes = current.boxes.map((b) => (b.id === activeBoxId ? nextBox : b));
      const newTotalPieces = updatedBoxes.reduce((acc, b) => acc + (b.totalPieces || 0), 0);
      return { ...current, boxes: updatedBoxes, totalPieces: newTotalPieces };
    });
    if (options.closeModal !== false) {
      setLotModalOpen(false);
      setPendingItem(null);
    }
    persistLotHistory(item, lot, expiry);

    if (totalPieces >= Number(activeBox.targetPieces || 0)) {
      await closeCurrentBox({
        ...nextBox,
        products: Object.values(nextBox.products),
      });
      setBoardRuntimeFeedback({ tone: "success", message: `Caja ${nextBox.palletNumber} cerrada automáticamente y PDF generado.` });
      return;
    }

    if (options.successMode === "auto") {
      setBoardRuntimeFeedback({ tone: "success", message: `+1 pieza en ${item.code} con lote ${lot}.` });
    }
    scanRef.current?.focus();
  }

  async function registerScannedItemLot() {
    if (!pendingItem) return;
    await commitLotEntry(pendingItem, lotForm.lot, lotForm.expiry, lotForm.pieces, { closeModal: true, successMode: "manual" });
  }

  async function tryAutoAddPendingCode(scannedText) {
    if (!pendingItem) return false;
    if (normalizeKey(scannedText) !== normalizeKey(pendingItem.code)) return false;
    if (modalAutoCommitRef.current) return true;

    const fallback = pendingLotOptions[0] || null;
    const lotToUseRaw = String(lotForm.lot || "").trim();
    const lotToUse = normalizeKey(lotToUseRaw) === normalizeKey(pendingItem.code)
      ? String(fallback?.lot || "").trim()
      : lotToUseRaw;
    const expiryToUse = normalizeExpiryInput(lotForm.expiry || fallback?.expiry || "");

    if (!lotToUse || !expiryToUse) {
      setBoardRuntimeFeedback({ tone: "danger", message: "Primero selecciona o captura lote y caducidad para auto-agregar por escaneo." });
      return true;
    }

    modalAutoCommitRef.current = true;
    try {
      await commitLotEntry(pendingItem, lotToUse, expiryToUse, 1, { closeModal: true, successMode: "auto" });
    } finally {
      modalAutoCommitRef.current = false;
    }
    return true;
  }

  async function handleModalLotSubmit() {
    if (!pendingItem) return;
    const scannedText = String(lotForm.lot || "").trim();
    if (!scannedText) return;

    const wasAutoAdded = await tryAutoAddPendingCode(scannedText);
    if (wasAutoAdded) return;

    // Any other text is considered a lot value.
    setLotForm((current) => ({ ...current, selectedLotKey: "", lot: scannedText }));
    expiryInputRef.current?.focus();
  }

  return (
    <section className="returns-scan-shell board-pdf-hide">
      <div className="returns-scan-head">
        <div>
          <h4>Modo escaneo · {activeTarima ? `Tarima ${activeTarima.tarimaNumber}` : "Inicio escaneo"}</h4>
          <p>{activeTarima ? `Flujo: ${activeTarima.flowType === "reacondicionado" ? "Reacondicionado" : "Devolución"}` : "Escanea un código para crear tarima"}</p>
        </div>
        <div className="saved-board-list">
          {systemPaused && (
            <span className="chip" style={{ background: "#fee2e2", color: "#991b1b" }}>⏸ Pausado automáticamente (16:00-08:00 hrs MX)</span>
          )}
          {activeTarima && (
            <>
              <span className="chip">Tarima: {activeTarima.tarimaNumber}</span>
              <span className="chip">Cajas: {(activeTarima.boxes || []).length}</span>
              <span className="chip primary">Total acumulado: {activeTarima.totalPieces || 0}</span>
              {activeBox && (
                <>
                  <span className="chip">Caja activa: {activeBox.palletNumber}</span>
                  <span className="chip">Meta caja: {activeBox.targetPieces}</span>
                  <span className="chip">Caja actual: {activePieces}</span>
                </>
              )}
              <button type="button" className="icon-button" onClick={() => { void finishActiveTarimaManually(); }} disabled={disabled || !activeTarima}>
                Terminar Tarima
              </button>
            </>
          )}
        </div>
      </div>

      <div className="returns-scan-bar">
        <input
          ref={scanRef}
          className="returns-scan-input"
          value={scanValue}
          onChange={(event) => setScanValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleScanSubmit();
            }
          }}
          placeholder={disabled ? "Vista histórica en solo lectura" : systemPaused ? "Sistema pausado (reanudar 08:00 hrs MX)" : "Escanea o escribe código (auto-registro)"}
          disabled={disabled || systemPaused || lotModalOpen || tarimaModalOpen || boxModalOpen}
        />
      </div>

      {/* Cajas de Tarima */}
      {activeTarima && (activeTarima.boxes || []).length > 0 ? (
        <div className="returns-scan-boxes-grid">
          {(activeTarima.boxes || []).map((box) => (
            <div key={box.id} className={`returns-scan-box-section ${activeBoxId === box.id ? "active" : ""}`}>
              <div className="returns-scan-box-header">
                <strong>Caja: {box.palletNumber}</strong>
                <span className="chip primary">{box.totalPieces}/{box.targetPieces} pzas</span>
                {activeBoxId !== box.id && (
                  <button type="button" className="icon-button" onClick={() => setActiveBoxId(box.id)}>
                    Activar
                  </button>
                )}
                {activeBoxId === box.id && (
                  <button type="button" className="icon-button" onClick={() => { void finishActiveBoxManually(); }} disabled={disabled || Object.keys(box.products || {}).length === 0}>
                    Terminar Caja
                  </button>
                )}
              </div>
              
              {activeBoxId === box.id && (
                <div className="returns-scan-cards">
                  {activeProducts.length ? activeProducts.map((product, idx) => {
                    const width = productWidths[product.itemId] || 320;
                    return (
                      <article
                        key={product.itemId}
                        className="returns-scan-card"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", idx);
                        }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          const fromIdx = Number(e.dataTransfer.getData("text/plain"));
                          if (fromIdx !== idx) moveProduct(fromIdx, idx);
                        }}
                        style={{ cursor: "grab", opacity: 1, width: width + "px", minWidth: "180px", maxWidth: "800px", position: "relative" }}
                      >
                        <div className="returns-scan-card-head">
                          <strong>{product.code} · {product.name}</strong>
                          <div className="saved-board-list">
                            <span className="chip primary">{product.totalPieces} pzas</span>
                            <button type="button" className="icon-button" onClick={() => openLotModalForProduct(product)}>
                              Cambiar lote
                            </button>
                          </div>
                        </div>
                        <p>{product.presentation || "Sin presentación"}</p>
                        <div className="returns-scan-lot-table" role="table" aria-label={`Lotes de ${product.name}`}>
                          <div className="returns-scan-lot-header" role="row">
                            <span role="columnheader">Lote</span>
                            <span role="columnheader">Caducidad</span>
                            <span role="columnheader">Piezas</span>
                          </div>
                          <div className="returns-scan-lot-body" role="rowgroup">
                            {product.lots.map((lot) => (
                              <div className="returns-scan-lot-row" role="row" key={`${product.itemId}-${lot.lot}-${lot.expiry}`}>
                                <span role="cell" data-label="Lote">{lot.lot}</span>
                                <span role="cell" data-label="Caducidad">{lot.expiry}</span>
                                <span role="cell" data-label="Piezas">{lot.pieces}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "10px",
                            height: "100%",
                            cursor: "ew-resize",
                            zIndex: 10,
                            userSelect: "none",
                          }}
                          onMouseDown={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startWidth = width;
                            function onMouseMove(ev) {
                              const delta = ev.clientX - startX;
                              handleResizeProduct(product.itemId, startWidth + delta);
                            }
                            function onMouseUp() {
                              window.removeEventListener("mousemove", onMouseMove);
                              window.removeEventListener("mouseup", onMouseUp);
                            }
                            window.addEventListener("mousemove", onMouseMove);
                            window.addEventListener("mouseup", onMouseUp);
                          }}
                          title="Arrastra para ajustar el ancho"
                          aria-label="Arrastra para ajustar el ancho"
                        />
                      </article>
                    );
                  }) : <p className="subtle-line">Aún no hay productos en esta caja.</p>}
                </div>
              )}
            </div>
          ))}
          <div style={{ padding: "1rem", textAlign: "center" }}>
            <button type="button" className="icon-button" onClick={() => setBoxModalOpen(true)} disabled={disabled || systemPaused}>
              + Nueva Caja
            </button>
          </div>
        </div>
      ) : (
        <p className="subtle-line">{activeTarima ? "Sin cajas aún. Escanea un código para crear la primera caja." : "Sin tarima activa."}</p>
      )}

      {/* Modal Tarima Inicial */}
      <Modal
        open={tarimaModalOpen}
        title="Nueva Tarima"
        confirmLabel="Crear Tarima"
        cancelLabel="Cancelar"
        onClose={() => { setTarimaModalOpen(false); setPendingItem(null); }}
        onConfirm={startNewTarima}
      >
        <div className="returns-scan-modal-grid">
          <label className="app-modal-field">
            <span>Número de Tarima</span>
            <input value={tarimaForm.tarimaNumber} onChange={(event) => setTarimaForm((current) => ({ ...current, tarimaNumber: event.target.value }))} placeholder="Ej: TARIMA-001" />
          </label>
          <label className="app-modal-field">
            <span>Tipo de Flujo</span>
            <select value={tarimaForm.flowType} onChange={(event) => setTarimaForm((current) => ({ ...current, flowType: event.target.value }))}>
              <option value="devolucion">Devolución</option>
              <option value="reacondicionado">Reacondicionado</option>
            </select>
          </label>
        </div>
      </Modal>

      {/* Modal Nueva Caja */}
      <Modal
        open={boxModalOpen}
        title="Nueva Caja"
        confirmLabel="Agregar Caja"
        cancelLabel="Cancelar"
        onClose={() => { setBoxModalOpen(false); setPendingItem(null); }}
        onConfirm={addNewBoxToTarima}
      >
        <div className="returns-scan-modal-grid">
          <label className="app-modal-field">
            <span>Número de Caja</span>
            <input value={boxForm.boxNumber} onChange={(event) => setBoxForm((current) => ({ ...current, boxNumber: event.target.value }))} placeholder="Ej: CAJ-001" />
          </label>
          <label className="app-modal-field">
            <span>Meta de Piezas</span>
            <input type="number" min="1" value={boxForm.targetPieces} onChange={(event) => setBoxForm((current) => ({ ...current, targetPieces: Number(event.target.value || 50) }))} />
          </label>
        </div>
      </Modal>

      <Modal
        open={setupModalOpen}
        title="Nueva caja"
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        onClose={() => { setSetupModalOpen(false); setPendingItem(null); }}
        onConfirm={startBoxAndContinue}
      >
        <div className="returns-scan-modal-grid">
          <label className="app-modal-field">
            <span>Número de caja</span>
            <input value={setupForm.palletNumber} onChange={(event) => setSetupForm((current) => ({ ...current, palletNumber: event.target.value }))} placeholder="Ej: CAJ-001" />
          </label>
          <label className="app-modal-field">
            <span>Tipo de flujo</span>
            <select value={setupForm.flowType} onChange={(event) => setSetupForm((current) => ({ ...current, flowType: event.target.value }))}>
              <option value="devolucion">Devolución</option>
              <option value="reacondicionado">Reacondicionado</option>
            </select>
          </label>
          <label className="app-modal-field">
            <span>Piezas meta por caja</span>
            <input type="number" min="1" value={setupForm.targetPieces} onChange={(event) => setSetupForm((current) => ({ ...current, targetPieces: Number(event.target.value || 1) }))} />
          </label>
        </div>
      </Modal>

      <Modal
        open={lotModalOpen}
        title={`Registrar lote · ${pendingItem?.code || ""}`}
        confirmLabel="Guardar lote"
        cancelLabel="Cancelar"
        onClose={() => { setLotModalOpen(false); setPendingItem(null); }}
        onConfirm={registerScannedItemLot}
      >
        <div className="saved-board-list" style={{ marginBottom: "0.5rem" }}>
          <span className="chip">Escanea mismo código para +1 automático</span>
          <span className="chip">Código activo: {pendingItem?.code || "-"}</span>
        </div>
        <div className="returns-scan-modal-grid">
          <label className="app-modal-field">
            <span>Lotes guardados</span>
            <select
              value={lotForm.selectedLotKey}
              onChange={(event) => {
                const selectedKey = String(event.target.value || "");
                const selected = pendingLotOptions.find((entry) => entry.key === selectedKey);
                if (!selected) {
                  setLotForm((current) => ({ ...current, selectedLotKey: "" }));
                  return;
                }
                setLotForm((current) => ({
                  ...current,
                  selectedLotKey: selected.key,
                  lot: selected.lot,
                  expiry: selected.expiry,
                }));
              }}
            >
              <option value="">Selecciona un lote guardado</option>
              {pendingLotOptions.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label}</option>
              ))}
            </select>
          </label>
          <label className="app-modal-field">
            <span>Lote</span>
            <input
              ref={lotInputRef}
              value={lotForm.lot}
              onChange={(event) => setLotForm((current) => ({ ...current, selectedLotKey: "", lot: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void handleModalLotSubmit();
              }}
              placeholder="Ej: L2304A"
            />
          </label>
          <label className="app-modal-field">
            <span>Caducidad</span>
            <input
              ref={expiryInputRef}
              value={lotForm.expiry}
              onChange={(event) => setLotForm((current) => ({ ...current, selectedLotKey: "", expiry: normalizeExpiryInput(event.target.value) }))}
              placeholder="Ej: AGO-2026"
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <label className="app-modal-field">
            <span>Piezas</span>
            <input type="number" min="1" value={lotForm.pieces} onChange={(event) => setLotForm((current) => ({ ...current, pieces: Number(event.target.value || 1) }))} />
          </label>
        </div>
        {pendingItem ? (
          <div className="returns-scan-history">
            <strong>Lotes recientes guardados para este producto</strong>
            <div className="saved-board-list">
              {getItemLotHistory(pendingItem).length ? getItemLotHistory(pendingItem).slice(0, 8).map((entry) => (
                <button
                  key={`${entry.lot}-${entry.expiry}`}
                  type="button"
                  className="chip"
                  onClick={() => setLotForm((current) => ({ ...current, lot: entry.lot, expiry: normalizeExpiryInput(entry.expiry) }))}
                >
                  {entry.lot} · {entry.expiry}
                </button>
              )) : <span className="chip">Sin historial todavía</span>}
            </div>
          </div>
        ) : null}
      </Modal>

      {completedBoxes.length ? (
        <div className="returns-scan-history">
          <strong>Cajas cerradas recientes</strong>
          <div className="saved-board-list">
            {completedBoxes.map((box) => <span key={box.id} className="chip">{box.palletNumber} · {box.totalPieces} pzas</span>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
