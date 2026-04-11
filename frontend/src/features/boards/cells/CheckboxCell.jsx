import "./CheckboxCell.css";

export function CheckboxCell({ checked, onToggle }) {
  return (
    <label className="checkbox-cell-wrap">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onToggle(event.target.checked)} />
      <span>{checked ? "Si" : "No"}</span>
    </label>
  );
}
