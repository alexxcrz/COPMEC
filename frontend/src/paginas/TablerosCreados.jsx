import { useState } from "react";

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
  } = contexto;

  const activeCatalogItems = state.catalog.filter((item) => !item.isDeleted);
  const [creatorTab, setCreatorTab] = useState("boards");

  return (
    <section className="page-grid created-boards-page">
      <article className="admin-hero-card full-width">
        <div>
          <h3>Creador de tableros</h3>
          <p>Desde aquí creas, editas y administras tableros y también el catálogo de actividades.</p>
          <div className="saved-board-list">
            <span className="chip primary">Editables por ti: {visibleControlBoards.filter((board) => canEditBoard(currentUser, board)).length}</span>
            <span className="chip">Total visibles: {visibleControlBoards.length}</span>
          </div>
        </div>
        <span className="chip success">{visibleControlBoards.length} visibles</span>
      </article>

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
            {creatorTab === "catalog" ? (
              <button type="button" className="primary-button" onClick={openCatalogCreate} disabled={!actionPermissions.manageCatalog}>
                <Plus size={16} /> Agregar actividad
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {creatorTab === "boards" ? (
        <>
          <div className="created-board-grid full-width">
            {visibleControlBoards.length ? visibleControlBoards.map((board) => (
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
                  {(board.accessUserIds || []).length ? <span>Acceso · {(board.accessUserIds || []).map((userId) => userMap.get(userId)?.name || "N/A").join(", ")}</span> : null}
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
                <p>Crea un tablero desde aquí o asigna acceso para empezar.</p>
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
              <p>Aquí quedó concentrado el catálogo de actividades.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="admin-table-clean">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Frecuencia</th>
                  <th>Tiempo límite</th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeCatalogItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
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
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
