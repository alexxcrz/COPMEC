import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../components/Modal";

export default function TablerosCreados({ contexto }) {
  const {
    visibleControlBoards,
    state,
    userMap,
    setSelectedCustomBoardId,
    setPage,
    PAGE_CUSTOM_BOARDS,
    LayoutDashboard,
    actionPermissions,
    canDoBoardAction,
    currentUser,
    duplicateBoardRecord,
    Copy,
    canEditBoard,
    getBoardAssignmentSummary,
    openCreateBoardBuilder,
    openEditBoardBuilder,
    openCatalogCreate,
    openCatalogEdit,
    softDeleteCatalog,
    exportCatalogToCsv,
    importCatalogFromCsv,
    getActivityFrequencyLabel,
    Plus,
    Pencil,
    setDeleteBoardId,
    Trash2,
    ROLE_LEAD,
  } = contexto;

  const activeCatalogItems = state.catalog.filter((item) => !item.isDeleted);
  const [creatorTab, setCreatorTab] = useState("boards");
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("General");
  const [selectedBoardCreatorId, setSelectedBoardCreatorId] = useState("all");
  const [createListModal, setCreateListModal] = useState({ open: false, name: "", error: "" });
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null); // { type: "ok"|"error", text: string }
  const catalogImportRef = useRef(null);
  const isLeadCreatorView = currentUser?.role === ROLE_LEAD;

  const catalogCategories = useMemo(() => {
    const categories = new Set(["General"]);
    activeCatalogItems.forEach((item) => {
      const category = String(item.category || "General").trim() || "General";
      if (category !== "General") categories.add(category);
    });
    return Array.from(categories.values());
  }, [activeCatalogItems]);

  const filteredCatalogItems = useMemo(() => {
    if (selectedCatalogCategory === "General") return activeCatalogItems;
    return activeCatalogItems.filter((item) => (String(item.category || "General").trim() || "General") === selectedCatalogCategory);
  }, [activeCatalogItems, selectedCatalogCategory]);

  const boardCreatorTabs = useMemo(() => {
    if (!isLeadCreatorView) return [];
    const grouped = new Map();
    visibleControlBoards.forEach((board) => {
      const creatorId = board.createdById || "unknown";
      if (!grouped.has(creatorId)) {
        grouped.set(creatorId, {
          creatorId,
          creatorName: userMap.get(creatorId)?.name || "Sin creador",
          total: 0,
        });
      }
      grouped.get(creatorId).total += 1;
    });

    return [{ creatorId: "all", creatorName: "Todos", total: visibleControlBoards.length }]
      .concat(Array.from(grouped.values()).sort((left, right) => left.creatorName.localeCompare(right.creatorName, "es-MX")));
  }, [isLeadCreatorView, userMap, visibleControlBoards]);

  const visibleCreatorBoards = useMemo(() => {
    if (!isLeadCreatorView || selectedBoardCreatorId === "all") return visibleControlBoards;
    return visibleControlBoards.filter((board) => (board.createdById || "unknown") === selectedBoardCreatorId);
  }, [isLeadCreatorView, selectedBoardCreatorId, visibleControlBoards]);

  useEffect(() => {
    if (!isLeadCreatorView) return;
    if (!boardCreatorTabs.some((item) => item.creatorId === selectedBoardCreatorId)) {
      setSelectedBoardCreatorId("all");
    }
  }, [boardCreatorTabs, isLeadCreatorView, selectedBoardCreatorId]);

  function handleOpenCreateCategoryModal() {
    setCreateListModal({ open: true, name: "", error: "" });
  }

  async function handleCatalogImportChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setIsImporting(true);
    setImportMessage(null);
    try {
      const count = await importCatalogFromCsv(file);
      setImportMessage({ type: "ok", text: `${count} actividad${count !== 1 ? "es" : ""} importada${count !== 1 ? "s" : ""} correctamente.` });
    } catch (err) {
      setImportMessage({ type: "error", text: err?.message || "Error al importar el archivo." });
    } finally {
      setIsImporting(false);
    }
  }

  function handleCloseCreateCategoryModal() {
    setCreateListModal({ open: false, name: "", error: "" });
  }

  function handleConfirmCreateCategory() {
    const normalized = String(createListModal.name || "").trim();
    if (!normalized) return;
    const alreadyExists = catalogCategories.some((category) => category.toLowerCase() === normalized.toLowerCase());
    if (alreadyExists) {
      setCreateListModal((current) => ({ ...current, error: "Esa lista ya existe. Usa otro nombre." }));
      return;
    }

    setSelectedCatalogCategory(normalized);
    handleCloseCreateCategoryModal();
    openCatalogCreate(normalized);
  }

  return (
    <section className="page-grid created-boards-page">
      <article className="surface-card admin-tabs full-width admin-tabs-shell">
        <div className="creator-tabs-header">
          <div className="tab-strip">
            <button type="button" className={creatorTab === "boards" ? "tab active" : "tab"} onClick={() => setCreatorTab("boards")}>Tableros</button>
            <button type="button" className={creatorTab === "catalog" ? "tab active" : "tab"} onClick={() => setCreatorTab("catalog")}>Catálogo de actividades</button>
          </div>
          <div className="creator-tabs-actions">
            {creatorTab === "boards" ? (
              <button type="button" className="primary-button" onClick={openCreateBoardBuilder} disabled={!actionPermissions.createBoard}>
                <Plus size={16} /> Crear tablero
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {creatorTab === "boards" ? (
        <>
          {isLeadCreatorView ? (
            <article className="surface-card full-width compact-surface-card">
              <div className="saved-board-list board-creator-tabs">
                {boardCreatorTabs.map((item) => (
                  <button
                    key={item.creatorId}
                    type="button"
                    className={selectedBoardCreatorId === item.creatorId ? "tab active" : "tab"}
                    onClick={() => setSelectedBoardCreatorId(item.creatorId)}
                  >
                    {item.creatorName} ({item.total})
                  </button>
                ))}
              </div>
            </article>
          ) : null}

          <div className="created-board-grid full-width">
            {visibleCreatorBoards.length ? visibleCreatorBoards.map((board) => (
              <article key={board.id} className="created-board-card surface-card">
                <div className="created-board-card-top">
                  <div className="created-board-card-head">
                    <strong>{board.name}</strong>
                    <p>{board.description || "Sin descripción."}</p>
                  </div>
                  <div className="saved-board-list created-board-card-stats">
                    <span className="chip primary">Campos: {(board.fields || []).length}</span>
                    <span className="chip">Filas: {(board.rows || []).length}</span>
                  </div>
                </div>
                <div className="board-meta-inline created-board-card-meta">
                  <span>Player principal · {userMap.get(board.ownerId)?.name || "N/A"}</span>
                  <span>Creó · {userMap.get(board.createdById)?.name || "N/A"}</span>
                  <span>{getBoardAssignmentSummary(board, userMap)}</span>
                </div>
                <div className="toolbar-actions">
                  <button type="button" className="primary-button created-board-open-action" onClick={() => {
                    setSelectedCustomBoardId(board.id);
                    setPage(PAGE_CUSTOM_BOARDS);
                  }}>
                    <LayoutDashboard size={16} /> Abrir en Mis tableros
                  </button>
                  {(actionPermissions.duplicateBoardWithRows || actionPermissions.duplicateBoard) && canDoBoardAction(currentUser, board) ? (
                    <button type="button" className="icon-button" onClick={() => duplicateBoardRecord(board, false)}>
                      <Copy size={15} /> Duplicar
                    </button>
                  ) : null}

                  {actionPermissions.editBoard && canEditBoard(currentUser, board) ? (
                    <button type="button" className="icon-button" onClick={() => openEditBoardBuilder(board)}>
                      <Pencil size={15} /> Editar tablero
                    </button>
                  ) : null}
                  {actionPermissions.deleteBoard && canEditBoard(currentUser, board) ? (
                    <button type="button" className="icon-button danger created-board-delete-action" onClick={() => setDeleteBoardId(board.id)}>
                      <Trash2 size={15} /> Eliminar tablero
                    </button>
                  ) : null}
                </div>
              </article>
            )) : (
              <article className="surface-card empty-state full-width">
                <LayoutDashboard size={44} />
                <h3>No hay tableros visibles</h3>
                <p>{isLeadCreatorView && selectedBoardCreatorId !== "all" ? "Ese creador todavía no tiene tableros visibles en esta vista." : "Crea un tablero desde aquí o asigna acceso para empezar."}</p>
              </article>
            )}
          </div>
        </>
      ) : null}

      {creatorTab === "catalog" ? (
        <article className="surface-card full-width table-card admin-surface-card">
          <div className="card-header-row">
            <div>
              <h3>Catálogo de actividades</h3>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="icon-button sm-button" title="Exportar catálogo a CSV" onClick={exportCatalogToCsv} disabled={!activeCatalogItems.length}>
                ↓ Exportar CSV
              </button>
              <button type="button" className="icon-button sm-button" title="Importar actividades desde CSV" onClick={() => catalogImportRef.current?.click()} disabled={isImporting || !actionPermissions.createCatalog}>
                {isImporting ? "Importando…" : "↑ Importar CSV"}
              </button>
              <input ref={catalogImportRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCatalogImportChange} />
              {importMessage ? (
                <span style={{ fontSize: "0.78rem", color: importMessage.type === "ok" ? "var(--color-success, #16a34a)" : "var(--color-error, #dc2626)", marginLeft: 4 }}>
                  {importMessage.text}
                </span>
              ) : null}
              {selectedCatalogCategory === "General" ? (
                <button type="button" className="primary-button sm-button" onClick={handleOpenCreateCategoryModal} disabled={!actionPermissions.createCatalog}>
                  <Plus size={14} /> Crear lista
                </button>
              ) : (
                <button type="button" className="primary-button sm-button" onClick={() => openCatalogCreate(selectedCatalogCategory)} disabled={!actionPermissions.createCatalog}>
                  <Plus size={14} /> Agregar actividad
                </button>
              )}
            </div>
          </div>
          <div className="saved-board-list board-builder-launch-list">
            {catalogCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={selectedCatalogCategory === category ? "tab active" : "tab"}
                onClick={() => setSelectedCatalogCategory(category)}
              >
                {category === "General" ? "General (todas las listas)" : category}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="admin-table-clean">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Grupo</th>
                  <th>Frecuencia</th>
                  <th>Tiempo límite</th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalogItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><span className="chip">{item.category || "General"}</span></td>
                    <td>{getActivityFrequencyLabel(item.frequency)}</td>
                    <td>{item.timeLimitMinutes} min</td>
                    <td>{item.isMandatory ? "Obligatoria" : "Ocasional"}</td>
                    <td>
                      <div className="row-actions compact">
                        <button type="button" className="icon-button" onClick={() => openCatalogEdit(item)} disabled={!actionPermissions.editCatalog}>
                          <Pencil size={15} /> Editar
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => softDeleteCatalog(item.id)} disabled={!actionPermissions.deleteCatalog}>
                          <Trash2 size={15} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredCatalogItems.length ? (
                  <tr>
                    <td colSpan={6}>
                      <span className="subtle-line">
                        {selectedCatalogCategory === "General"
                          ? "No hay actividades registradas todavía."
                          : `No hay actividades en la lista ${selectedCatalogCategory}. Usa \"Agregar actividad\" para crear la primera.`}
                      </span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <Modal
        open={createListModal.open}
        title="Nueva lista de actividades"
        confirmLabel="Crear y agregar actividad"
        cancelLabel="Cancelar"
        onClose={handleCloseCreateCategoryModal}
        onConfirm={handleConfirmCreateCategory}
      >
        <p className="subtle-line">Define el nombre de la lista para agrupar actividades.</p>
        <label className="app-modal-field">
          <span>Nombre de la lista</span>
          <input
            value={createListModal.name}
            onChange={(event) => setCreateListModal((current) => ({ ...current, name: event.target.value, error: "" }))}
            placeholder="Ej: Limpieza, Seguridad, Producción"
            autoFocus
          />
        </label>
        {createListModal.error ? <p className="validation-text">{createListModal.error}</p> : null}
      </Modal>
    </section>
  );
}
