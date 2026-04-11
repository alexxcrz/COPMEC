import { useState } from "react";
import "./TextCell.css";

export function TextCell({ value, placeholder, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" className="cell-inline-button" onClick={() => setEditing(true)}>
        {value || <span className="cell-placeholder">{placeholder || "Sin valor"}</span>}
      </button>
    );
  }

  return (
    <input
      className="cell-inline-input"
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit();
        }

        if (event.key === "Escape") {
          setDraft(value || "");
          setEditing(false);
        }
      }}
      placeholder={placeholder || "Sin valor"}
    />
  );
}
