import { useState } from "react";
import "./DateCell.css";

export function DateCell({ value, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" className="date-inline-button" onClick={() => setEditing(true)}>
        {value || "--/--/----"}
      </button>
    );
  }

  return (
    <input
      className="date-inline-input"
      autoFocus
      type="date"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") {
          setDraft(value || "");
          setEditing(false);
        }
      }}
    />
  );
}
