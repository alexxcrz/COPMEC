import { Copy, LayoutDashboard, Pencil, Trash2 } from "lucide-react";

export function WarehouseCreatedBoardsPage(props) {
  const {
    visibleControlBoards,
    userMap,
    setSelectedCustomBoardId,
    setPage,
    PAGE_CUSTOM_BOARDS,
    actionPermissions,
    canDoBoardAction,
    currentUser,
    duplicateBoardRecord,
    canEditBoard,
    openEditBoardBuilder,
    setDeleteBoardId,
  } = props;

  return (
    <section className="page-grid created-boards-page">
      <article className="admin-hero-card full-width">
        <div>
          <h3>Tableros creados</h3>
          <p>Consulta todos los tableros visibles, su dueño, su creador y entra directo a operarlos en Mis tableros.</p>
        </div>
        <span className="chip success">{visibleControlBoards.length} visibles</span>
      </article>

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
            <p>Crea un tablero desde el constructor o asigna acceso para empezar.</p>
          </article>
        )}
      </div>
    </section>
  );
}