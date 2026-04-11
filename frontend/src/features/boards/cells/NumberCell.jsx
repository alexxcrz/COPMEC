import { useState } from "react";
import "./NumberCell.css";

export function NumberCell({ value, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  function commit() {
    const parsed = draft === "" ? "" : Number(draft);
    onCommit(Number.isFinite(parsed) || parsed === "" ? parsed : value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" className="number-inline-button" onClick={() => setEditing(true)}>
        {value === "" || value === null || value === undefined ? "0" : value}
      </button>
    );
  }

  return (
    <div className="number-cell-wrap">
      <input
        className="number-inline-input"
        autoFocus
        type="number"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
      />

    </div>
  );
}
