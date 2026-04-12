import { ArrowUp, Menu, Package, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";

export function WarehouseInventoryPage(props) {
  const {
    inventoryFileInputRef,
    handleInventoryImport,
    inventoryTab,
    setInventoryTab,
    INVENTORY_DOMAIN_BASE,
    INVENTORY_DOMAIN_CLEANING,
    INVENTORY_DOMAIN_ORDERS,
    inventoryActionsMenuRef,
    openCreateInventoryItem,
    currentInventoryManagePermission,
    inventoryActionsMenuOpen,
    setInventoryActionsMenuOpen,
    currentInventoryImportPermission,
    downloadInventoryTemplate,
    inventoryImportFeedback,
    inventoryStats,
    StatTile,
    currentInventoryItems,
    inventorySearch,
    setInventorySearch,
    catalogMap,
    InventoryStockBar,
    openInventoryMovement,
    INVENTORY_MOVEMENT_TRANSFER,
    INVENTORY_MOVEMENT_RESTOCK,
    openEditInventoryItem,
    setDeleteInventoryId,
    currentInventoryMovements,
    INVENTORY_MOVEMENT_TRANSFER: INVENTORY_MOVEMENT_TRANSFER_CONST,
    lowStockInventoryItems,
    inventoryLinkedCleaningRows,
  } = props;

  return (
    <section className="inventory-page-layout">
      <input ref={inventoryFileInputRef} type="file" accept=".csv,.xlsx,.xls" className="inventory-file-input" onChange={handleInventoryImport} />
      <article className="inventory-hero-card">
        <div>
          <h3>Inventario</h3>
        </div>
      </article>

      <article className="surface-card admin-tabs full-width admin-tabs-shell">
        <div className="card-header-row">
          <div className="tab-strip">
            <button type="button" className={inventoryTab === INVENTORY_DOMAIN_BASE ? "tab active" : "tab"} onClick={() => setInventoryTab(INVENTORY_DOMAIN_BASE)}>Productos</button>
            <button type="button" className={inventoryTab === INVENTORY_DOMAIN_CLEANING ? "tab active" : "tab"} onClick={() => setInventoryTab(INVENTORY_DOMAIN_CLEANING)}>Insumos de limpieza</button>
            <button type="button" className={inventoryTab === INVENTORY_DOMAIN_ORDERS ? "tab active" : "tab"} onClick={() => setInventoryTab(INVENTORY_DOMAIN_ORDERS)}>Insumos para pedidos</button>
          </div>
          <div className="custom-board-actions-menu-shell" ref={inventoryActionsMenuRef}>
            <button
              type="button"
              className="primary-button custom-board-add-row-button"
              title="Agregar artículo"
              aria-label="Agregar artículo"
              onClick={() => openCreateInventoryItem(inventoryTab)}
              disabled={!currentInventoryManagePermission}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="icon-button custom-board-menu-trigger"
              aria-label="Abrir acciones de inventario"
              aria-expanded={inventoryActionsMenuOpen}
              onClick={() => setInventoryActionsMenuOpen((current) => !current)}
              disabled={!currentInventoryImportPermission}
            >
              <Menu size={16} />
            </button>
            {inventoryActionsMenuOpen ? (
              <div className="custom-board-actions-dropdown">
                <button type="button" className="custom-board-menu-item" onClick={() => { setInventoryActionsMenuOpen(false); downloadInventoryTemplate(); }} disabled={!currentInventoryImportPermission}>
                  Plantilla Excel
                </button>
                <button type="button" className="custom-board-menu-item" onClick={() => { setInventoryActionsMenuOpen(false); inventoryFileInputRef.current?.click(); }} disabled={!currentInventoryImportPermission}>
                  Importar CSV / Excel
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {inventoryImportFeedback.message ? <p className={`inventory-import-feedback ${inventoryImportFeedback.tone}`}>{inventoryImportFeedback.message}</p> : null}

      <div className="inventory-stat-grid">
        <StatTile label="Artículos registrados" value={inventoryStats.total} />
        {inventoryTab === INVENTORY_DOMAIN_BASE ? (
          <>
            <StatTile label="Piezas por caja" value={inventoryStats.totalPiecesPerBox} tone="soft" />
            <StatTile label="Cajas por tarima" value={inventoryStats.totalBoxesPerPallet} tone="success" />
          </>
        ) : (
          <>
            <StatTile label="Stock total" value={inventoryStats.totalStockUnits} tone="soft" />
            <StatTile label="Bajo mínimo" value={inventoryStats.lowStockCount} tone="danger" />
            <StatTile label="Movimientos" value={inventoryStats.movementCount} tone="success" />
          </>
        )}
      </div>

      <section className="page-grid">
        <article className="surface-card inventory-surface-card full-width table-card">
          <div className="card-header-row">
            <div>
              <h3>{inventoryTab === INVENTORY_DOMAIN_CLEANING ? "Insumos de limpieza" : inventoryTab === INVENTORY_DOMAIN_ORDERS ? "Insumos para pedidos" : "Productos"}</h3>
              <p>{inventoryTab === INVENTORY_DOMAIN_CLEANING ? "Liga insumos a actividades del catálogo y descuéntalos al iniciar cada limpieza." : inventoryTab === INVENTORY_DOMAIN_ORDERS ? "Controla transferencias por nave, responsable y resguardo." : "Catálogo base de producto y presentación para operación y logística."}</p>
            </div>
            <label className="users-search-field inventory-search-field">
              <span>Buscar</span>
              <div className="users-search-input-wrap">
                <Search size={16} />
                <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Buscar por código, nombre o ubicación..." />
              </div>
            </label>
            {inventorySearch ? (
              <button type="button" className="icon-button" onClick={() => setInventorySearch("")}>
                <RotateCcw size={15} /> Limpiar búsqueda
              </button>
            ) : null}
          </div>

          {!currentInventoryItems.length ? (
            <div className="empty-state inventory-empty-state">
              <Package size={42} />
              <h3>No hay coincidencias en esta pestaña</h3>
              <p>Ajusta la búsqueda o registra un artículo nuevo para continuar.</p>
              <button type="button" className="primary-button" onClick={() => openCreateInventoryItem(inventoryTab)}>
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="inventory-table-clean">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Presentación</th>
                    <th>{inventoryTab === INVENTORY_DOMAIN_BASE ? "Piezas por caja" : "Stock"}</th>
                    <th>{inventoryTab === INVENTORY_DOMAIN_BASE ? "Cajas por tarima" : "Ubicación"}</th>
                    <th>Control</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInventoryItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className="inventory-code-badge">{item.code}</span></td>
                      <td>
                        <div>
                          <strong>{item.name}</strong>
                          {inventoryTab === INVENTORY_DOMAIN_CLEANING && item.activityCatalogIds.length ? <span className="subtle-line">{item.activityCatalogIds.map((catalogId) => catalogMap.get(catalogId)?.name || catalogId).join(" · ")}</span> : null}
                        </div>
                      </td>
                      <td>{item.presentation}</td>
                      <td style={inventoryTab === INVENTORY_DOMAIN_BASE ? undefined : { minWidth: "220px" }}>
                        {inventoryTab === INVENTORY_DOMAIN_BASE ? item.piecesPerBox : <InventoryStockBar current={item.stockUnits} minimum={item.minStockUnits} unitLabel={item.unitLabel} />}
                      </td>
                      <td>{inventoryTab === INVENTORY_DOMAIN_BASE ? item.boxesPerPallet : item.storageLocation || "Sin ubicación"}</td>
                      <td>
                        <div className="saved-board-list board-builder-launch-list">
                          <span className="chip">Caja · {item.piecesPerBox}</span>
                          <span className="chip">Tarima · {item.boxesPerPallet}</span>
                          {inventoryTab === INVENTORY_DOMAIN_CLEANING && item.consumptionPerStart ? <span className="chip">Consumo auto · {item.consumptionPerStart}</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="row-actions compact">
                          {inventoryTab !== INVENTORY_DOMAIN_BASE ? <button type="button" className="icon-button" onClick={() => openInventoryMovement(item, inventoryTab === INVENTORY_DOMAIN_ORDERS ? INVENTORY_MOVEMENT_TRANSFER : INVENTORY_MOVEMENT_RESTOCK)} disabled={!currentInventoryManagePermission}><ArrowUp size={15} /> Movimiento</button> : null}
                          <button type="button" className="icon-button" onClick={() => openEditInventoryItem(item)} disabled={!currentInventoryManagePermission}><Pencil size={15} /> Editar</button>
                          <button type="button" className="icon-button danger" onClick={() => setDeleteInventoryId(item.id)} disabled={!currentInventoryManagePermission}><Trash2 size={15} /> Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="surface-card inventory-surface-card table-card">
          <div className="card-header-row">
            <div>
              <h3>{inventoryTab === INVENTORY_DOMAIN_BASE ? "Resumen logístico" : inventoryTab === INVENTORY_DOMAIN_ORDERS ? "Transferencias recientes" : "Alertas de stock"}</h3>
              <p>{inventoryTab === INVENTORY_DOMAIN_BASE ? "Vista general del inventario base sin control de stock." : inventoryTab === INVENTORY_DOMAIN_ORDERS ? "Quién tomó material, hacia qué nave se movió y dónde queda resguardado." : "Lista rápida de compras o reabasto por debajo del mínimo."}</p>
            </div>
            <span className="chip primary">{inventoryTab === INVENTORY_DOMAIN_BASE ? currentInventoryItems.length : inventoryTab === INVENTORY_DOMAIN_ORDERS ? currentInventoryMovements.filter((movement) => movement.movementType === INVENTORY_MOVEMENT_TRANSFER_CONST).length : lowStockInventoryItems.length}</span>
          </div>
          <div className="saved-board-list board-builder-launch-list">
            {inventoryTab === INVENTORY_DOMAIN_BASE ? currentInventoryItems.slice(0, 8).map((item) => (
              <article key={item.id} className="surface-card">
                <div className="card-header-row">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.code} · {item.presentation || "Sin presentación"}</p>
                  </div>
                  <span className="chip">{item.piecesPerBox} x caja</span>
                </div>
                <p className="subtle-line">{item.boxesPerPallet} cajas por tarima</p>
              </article>
            )) : inventoryTab === INVENTORY_DOMAIN_ORDERS ? currentInventoryMovements.filter((movement) => movement.movementType === INVENTORY_MOVEMENT_TRANSFER_CONST).slice(0, 8).map((movement) => (
              <article key={movement.id} className="surface-card">
                <div className="card-header-row">
                  <div>
                    <strong>{movement.itemName || movement.itemCode}</strong>
                    <p>{movement.quantity} {movement.unitLabel || "pzas"} · {movement.warehouse || "Nave no definida"}</p>
                  </div>
                  <span className="chip">{movement.recipientName || "Sin responsable"}</span>
                </div>
                <p className="subtle-line">Resguardo: {movement.storageLocation || "Sin ubicación"}</p>
              </article>
            )) : lowStockInventoryItems.map((item) => (
              <article key={item.id} className="surface-card">
                <div className="card-header-row">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.code} · {item.storageLocation || "Sin ubicación"}</p>
                  </div>
                  <span className="chip danger">{item.stockUnits}/{item.minStockUnits}</span>
                </div>
                <InventoryStockBar current={item.stockUnits} minimum={item.minStockUnits} unitLabel={item.unitLabel} />
              </article>
            ))}
            {inventoryTab === INVENTORY_DOMAIN_BASE && !currentInventoryItems.length ? <p className="subtle-line">No hay artículos base para mostrar.</p> : null}
            {inventoryTab === INVENTORY_DOMAIN_CLEANING && !lowStockInventoryItems.length ? <p className="subtle-line">No hay artículos por debajo del mínimo en esta pestaña.</p> : null}
            {inventoryTab === INVENTORY_DOMAIN_ORDERS && !currentInventoryMovements.filter((movement) => movement.movementType === INVENTORY_MOVEMENT_TRANSFER_CONST).length ? <p className="subtle-line">No hay transferencias registradas todavía.</p> : null}
          </div>
        </article>

        {inventoryTab === INVENTORY_DOMAIN_CLEANING ? (
          <article className="surface-card inventory-surface-card full-width table-card">
            <div className="card-header-row">
              <div>
                <h3>Consumo automático por actividad</h3>
                <p>Estos insumos se descuentan cuando una actividad de limpieza ligada al catálogo se inicia por primera vez.</p>
              </div>
            </div>
            <div className="saved-board-list permissions-preset-list">
              {inventoryLinkedCleaningRows.map((item) => (
                <article key={item.id} className="surface-card" style={{ minWidth: "320px", flex: "1 1 360px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.consumptionPerStart} {item.unitLabel} por inicio.</p>
                    </div>
                    <span className="chip primary">{item.stockUnits} disponibles</span>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {item.activityCatalogIds.map((catalogId) => <span key={`${item.id}-${catalogId}`} className="chip">{catalogMap.get(catalogId)?.name || catalogId}</span>)}
                  </div>
                </article>
              ))}
              {!inventoryLinkedCleaningRows.length ? <p className="subtle-line">Asigna actividades del catálogo a un insumo para habilitar el descuento automático.</p> : null}
            </div>
          </article>
        ) : null}
      </section>
    </section>
  );
}