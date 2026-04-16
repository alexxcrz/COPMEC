import { useEffect, useMemo, useState } from "react";
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
              <button type="button" className="primary-button" onClick={openCreateBoardBuilder} disabled={!actionPermissions.saveBoard}>
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
                <div>
                  <strong>{board.name}</strong>
                  <p>{board.description || "Sin descripción."}</p>
                </div>
                <div className="saved-board-list">
                  <span className="chip primary">Campos: {(board.fields || []).length}</span>
                  <span className="chip">Filas: {(board.rows || []).length}</span>
                </div>
                <div className="board-meta-inline">
                  <span>Player principal · {userMap.get(board.ownerId)?.name || "N/A"}</span>
                  <span>Creó · {userMap.get(board.createdById)?.name || "N/A"}</span>
                  <span>{getBoardAssignmentSummary(board, userMap)}</span>
                </div>
                <div className="toolbar-actions">
                  <button type="button" className="primary-button" onClick={() => {
                    setSelectedCustomBoardId(board.id);
                    setPage(PAGE_CUSTOM_BOARDS);
                  }}>
                    <LayoutDashboard size={16} /> Abrir en Mis tableros
                  </button>
                  {actionPermissions.duplicateBoard && canDoBoardAction(currentUser, board) ? (
                    <button type="button" className="icon-button" onClick={() => duplicateBoardRecord(board)}>
                      <Copy size={15} /> Duplicar
                    </button>
                  ) : null}
                  {actionPermissions.duplicateBoardWithRows && canDoBoardAction(currentUser, board) ? (
                    <button type="button" className="icon-button" onClick={() => duplicateBoardRecord(board, true)}>
                      <Copy size={15} /> Duplicar con filas
                    </button>
                  ) : null}
                  {actionPermissions.saveBoard && canEditBoard(currentUser, board) ? (
                    <button type="button" className="icon-button" onClick={() => openEditBoardBuilder(board)}>
                      <Pencil size={15} /> Editar tablero
                    </button>
                  ) : null}
                  {actionPermissions.deleteBoard && canEditBoard(currentUser, board) ? (
                    <button type="button" className="icon-button danger" onClick={() => setDeleteBoardId(board.id)}>
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
              {selectedCatalogCategory === "General" ? (
                <button type="button" className="primary-button sm-button" onClick={handleOpenCreateCategoryModal} disabled={!actionPermissions.manageCatalog}>
                  <Plus size={14} /> Crear lista
                </button>
              ) : (
                <button type="button" className="primary-button sm-button" onClick={() => openCatalogCreate(selectedCatalogCategory)} disabled={!actionPermissions.manageCatalog}>
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
                        <button type="button" className="icon-button" onClick={() => openCatalogEdit(item)} disabled={!actionPermissions.manageCatalog}>
                          <Pencil size={15} /> Editar
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => softDeleteCatalog(item.id)} disabled={!actionPermissions.manageCatalog}>
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
