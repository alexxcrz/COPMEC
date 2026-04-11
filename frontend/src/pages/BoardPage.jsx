import "./BoardPage.css";
import { SmartGrid } from "../features/boards/SmartGrid";

export function BoardPage({ importedBoard }) {
  return (
    <section className="board-page">
      <header className="board-page-header">
        <h2>Tablero Inteligente</h2>
        <p>
          {importedBoard
            ? `Tablero activo: ${importedBoard.name}`
            : "Edicion inline, autoguardado optimista, archivos y calculos en footer."}
        </p>
      </header>

      <SmartGrid
        importedBoard={importedBoard}
      />
    </section>
  );
}
