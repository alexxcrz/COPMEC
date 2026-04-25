const ACTIVE_BOX_STORAGE_PREFIX = "copmec_returns_recondition_active_box";
// --- Tarima/caja state helpers ---
// const ACTIVE_TARIMA_STORAGE_PREFIX = "copmec_returns_recondition_active_tarima"; // Eliminada duplicada
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function ReturnsReconditionScanner({
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
  // IDs de tarimas cerradas ocultas hasta cierre de semana
  const [hiddenTarimaIds, setHiddenTarimaIds] = useState([]);
  const scanRef = useRef(null);
  const lotInputRef = useRef(null);
  const expiryInputRef = useRef(null);
  const autoScanTimeoutRef = useRef(null);
  const modalAutoCommitRef = useRef(false);
  const [scanValue, setScanValue] = useState("");
  const [activeBox, setActiveBox] = useState(null);
  const [activeTarima, setActiveTarima] = useState(null);
  const [completedBoxes, setCompletedBoxes] = useState([]);
  const [pendingItem, setPendingItem] = useState(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupForm, setSetupForm] = useState({ palletNumber: "", tarimaNumber: "", flowType: "devolucion", targetPieces: 50 });
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [lotForm, setLotForm] = useState({ lot: "", expiry: "", pieces: 1, selectedLotKey: "" });
  const [nowTick, setNowTick] = useState(() => Date.now());

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

    if (disabled || lotModalOpen || setupModalOpen) return undefined;
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
  }, [scanValue, disabled, lotModalOpen, setupModalOpen, inventoryItems]);

  const inventoryMapById = useMemo(
    () => new Map((inventoryItems || []).map((item) => [item.id, item])),
    [inventoryItems],
  );

  const activeProducts = useMemo(
    () => Object.values(activeBox?.products || {})
      .filter((p) => !p.tarimaId || !hiddenTarimaIds.includes(p.tarimaId) === false)
      .sort((a, b) => Number(a.firstCapturedAt || 0) - Number(b.firstCapturedAt || 0)),
    [activeBox, hiddenTarimaIds],
  );
    // Cierre de tarima: ocultar productos de la tarima cerrada
    async function finishActiveTarimaManually() {
      if (!activeTarima) return;
      const hasProducts = Object.keys(activeTarima.products || {}).length > 0;
      if (!hasProducts) {
        setBoardRuntimeFeedback({ tone: "danger", message: "No puedes terminar una tarima vacía." });
        return;
      }
      await closeCurrentBox({
        ...activeTarima,
        products: Object.values(activeTarima.products || {}),
      });
      setHiddenTarimaIds((prev) => [...prev, activeTarima.id]);
      setBoardRuntimeFeedback({ tone: "success", message: "Tarima terminada manualmente y PDF generado." });
    }
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

  useEffect(() => {
    if (!boardId || disabled || activeBox) return;
    try {
      const raw = localStorage.getItem(`${ACTIVE_TARIMA_STORAGE_PREFIX}:${boardId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.stoppedAt || parsed.closedAt) return;
      setActiveBox(parsed);
      setBoardRuntimeFeedback({ tone: "success", message: `Caja ${parsed.palletNumber || "activa"} recuperada tras recarga.` });
    } catch {
      // Ignore corrupted local state.
    }
  }, [activeBox, activeBoxStorageKey, boardId, disabled, setBoardRuntimeFeedback]);

  useEffect(() => {
    if (!boardId) return;
    try {
      if (activeBox && !activeBox.stoppedAt && !activeBox.closedAt) {
        localStorage.setItem(activeBoxStorageKey, JSON.stringify(activeBox));
      } else {
        localStorage.removeItem(activeBoxStorageKey);
      }
    } catch {
      // Ignore localStorage write errors.
    }
  }, [activeBox, activeBoxStorageKey, boardId]);

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
    setActiveBox(null);
    try {
      localStorage.removeItem(activeBoxStorageKey);
    } catch {
      // Ignore localStorage cleanup errors.
    }
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
    setBoardRuntimeFeedback({ tone: "success", message: "Caja terminada manualmente y PDF generado." });
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

  function handleScanSubmit() {
    if (disabled) return;
    const raw = String(scanValue || "").trim();
    if (!raw) return;
    const found = findInventoryItemByQuery(inventoryItems, raw);
    if (!found) {
      setBoardRuntimeFeedback({ tone: "danger", message: `No existe ese código en inventario: ${raw}` });
      setScanValue("");
      return;
    }

    setScanValue("");
    if (!activeBox) {
      setPendingItem(found);
      setSetupModalOpen(true);
      return;
    }

    const currentProduct = activeBox.products?.[found.id] || null;
    const preferredLot = getPreferredLotFromProduct(currentProduct);
    const isDoubleScanSameProduct = Boolean(preferredLot) && activeBox.lastScannedItemId === found.id;

    if (isDoubleScanSameProduct) {
      void commitLotEntry(found, preferredLot.lot, preferredLot.expiry, 1, { closeModal: false, successMode: "auto" });
      return;
    }

    setActiveBox((current) => (current ? { ...current, lastScannedItemId: found.id } : current));
    openLotModalForItem(found, currentProduct);
  }

  function startBoxAndContinue() {
    const palletNumber = String(setupForm.palletNumber || "").trim();
    const targetPieces = Math.max(1, Number(setupForm.targetPieces || 0));
    if (!palletNumber || !targetPieces) return;

    const nextBox = {
      id: `box-${Date.now()}`,
      palletNumber,
      flowType: setupForm.flowType,
      targetPieces,
      reviewerName: currentUser?.name || "N/A",
      startedAt: new Date().toISOString(),
      stoppedAt: "",
      timerRowId: "",
      persistedRowIds: [],
      products: {},
      totalPieces: 0,
      lastScannedItemId: "",
    };

    setActiveBox(nextBox);
    setSetupModalOpen(false);
    if (pendingItem) openLotModalForItem(pendingItem);
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

    setActiveBox(nextBox);
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
          <h4>Modo escaneo · Devoluciones / Reacondicionado</h4>
          <p>Escanea código, captura lote y caducidad. El foco se mantiene en el escáner.</p>
        </div>
        <div className="saved-board-list">
          <span className="chip">Caja activa: {activeBox?.palletNumber || "-"}</span>
          <span className="chip">Meta de caja: {activeBox?.targetPieces || 0}</span>
          <span className="chip primary">Acumulado: {activePieces}</span>
          <span className="chip">Tiempo: {formatElapsedMs(elapsedMs)}</span>
          {activeBox ? (
            <button type="button" className="icon-button" onClick={() => { void finishActiveBoxManually(); }} disabled={disabled}>
              Terminar caja
            </button>
          ) : null}
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
          placeholder={disabled ? "Vista histórica en solo lectura" : "Escanea o escribe código (auto-registro sin Enter)"}
          disabled={disabled || lotModalOpen || setupModalOpen}
        />
      </div>

      <div className="returns-scan-cards">
        {activeProducts.length ? activeProducts.map((product) => (
          <article key={product.itemId} className="returns-scan-card">
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
            <div className="saved-board-list" style={{ marginBottom: "0.5rem" }}>
              <span className="chip">Workflow: {activeBox?.flowType === "reacondicionado" ? "Reacondicionado" : "Devolución"}</span>
              <span className="chip">Caja: {activeBox?.palletNumber || "-"}</span>
              <span className="chip">Fila tablero: {product.rowId || "pendiente"}</span>
              <span className="chip">Lotes: {product.lots.length}</span>
            </div>
            <div className="table-wrap">
              <table className="inventory-table-clean">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Caducidad</th>
                    <th>Piezas</th>
                  </tr>
                </thead>
                <tbody>
                  {product.lots.map((lot) => (
                    <tr key={`${product.itemId}-${lot.lot}-${lot.expiry}`}>
                      <td>{lot.lot}</td>
                      <td>{lot.expiry}</td>
                      <td>{lot.pieces}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )) : <p className="subtle-line">Aún no hay productos escaneados en esta caja.</p>}
      </div>

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
