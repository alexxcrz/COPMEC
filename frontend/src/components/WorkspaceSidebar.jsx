import { FolderTree, Plus } from "lucide-react";
import "./WorkspaceSidebar.css";

export function WorkspaceSidebar({
  workspaces,
  activeWorkspaceId,
  boards,
  activeBoardId,
  onSelectWorkspace,
  onSelectBoard,
  onCreateWorkspace,
  onCreateBoard,
}) {
  return (
    <aside className="workspace-sidebar">
      <header className="workspace-sidebar-header">
        <h2>
          <FolderTree size={18} />
          Areas de trabajo
        </h2>
        <button type="button" className="sidebar-small-button" onClick={onCreateWorkspace}>
          <Plus size={14} /> Area
        </button>
      </header>

      <div className="workspace-list">
        {workspaces.map((workspace) => {
          const workspaceBoards = boards.filter((board) => board.workspaceId === workspace.id);
          const isWorkspaceActive = activeWorkspaceId === workspace.id;

          return (
            <section key={workspace.id} className={`workspace-group ${isWorkspaceActive ? "is-active" : ""}`}>
              <button
                type="button"
                className="workspace-button"
                onClick={() => onSelectWorkspace(workspace.id)}
              >
                {workspace.name}
              </button>

              <div className="workspace-board-list">
                {workspaceBoards.map((board) => (
                  <button
                    key={board.id}
                    type="button"
                    className={`workspace-board-button ${activeBoardId === board.id ? "is-active" : ""}`}
                    onClick={() => onSelectBoard(board.id)}
                  >
                    {board.name}
                  </button>
                ))}

                {workspaceBoards.length === 0 ? (
                  <p className="workspace-empty">Sin tableros en esta area.</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <button type="button" className="sidebar-create-board" onClick={onCreateBoard}>
        <Plus size={16} /> Crear nuevo tablero
      </button>
    </aside>
  );
}
