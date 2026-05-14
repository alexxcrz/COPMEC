import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function MantenimientoInsumosForm({ inventoryItems = [], onSubmit, disabled, activityId }) {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [quantities, setQuantities] = useState({});
  const [generalNote, setGeneralNote] = useState("Uso en mantenimiento");

  function toggleItemSelection(itemId) {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
        setQuantities((q) => {
          const copy = { ...q };
          delete copy[itemId];
          return copy;
        });
      } else {
        next.add(itemId);
        setQuantities((q) => ({ ...q, [itemId]: "" }));
      }
      return next;
    });
  }

  function updateQuantity(itemId, quantity) {
    setQuantities((current) => ({ ...current, [itemId]: quantity }));
  }

  function handleSubmit() {
    const pendingEntries = Array.from(selectedItems)
      .map((itemId) => ({
        itemId,
        quantity: Number(quantities[itemId] || 0),
        note: String(generalNote || "Uso en mantenimiento").trim(),
        ...(activityId ? { activityId } : {}),
      }))
      .filter((entry) => entry.quantity > 0);

    if (!pendingEntries.length || disabled) return;
    onSubmit(pendingEntries);
    setSelectedItems(new Set());
    setQuantities({});
    setGeneralNote("Uso en mantenimiento");
  }

  const canSubmit = selectedItems.size > 0 && Array.from(selectedItems).some((itemId) => Number(quantities[itemId] || 0) > 0);

  return (
    <section className="surface-card inventory-surface-card table-card maintenance-usage-shell">
      <div className="card-header-row">
        <div>
          <h3>Seleccionar insumos de mantenimiento</h3>
          <p>Selecciona los insumos usados y especifica las cantidades. Todo quedará en un solo registro.</p>
        </div>
      </div>
      <div className="maintenance-selection-grid">
        {inventoryItems.map((item) => (
          <div key={item.id} className="maintenance-item-row">
            <label className="maintenance-item-label">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleItemSelection(item.id)}
                disabled={disabled}
              />
              <span>{item.name || item.id}</span>
            </label>
            {selectedItems.has(item.id) && (
              <input
                type="number"
                min="0"
                step="1"
                value={quantities[item.id] || ""}
                disabled={disabled}
                onChange={(event) => updateQuantity(item.id, event.target.value)}
                placeholder="Cantidad"
                className="maintenance-quantity-input"
              />
            )}
          </div>
        ))}
      </div>
      <div className="maintenance-general-note">
        <label>Nota general</label>
        <input
          type="text"
          value={generalNote}
          disabled={disabled}
          onChange={(event) => setGeneralNote(event.target.value)}
          placeholder="Opcional"
        />
      </div>
      <div className="maintenance-usage-footer">
        <button type="button" className="primary-button" onClick={handleSubmit} disabled={!canSubmit || disabled}>
          Registrar uso
        </button>
      </div>
    </section>
  );
}
