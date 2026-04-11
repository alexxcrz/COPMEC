import "./SelectCell.css";

export function SelectCell({ value, options, onChange }) {
  const selected = options.find((item) => item.value === value) || options[0];

  return (
    <div className="select-cell-wrap">
      <span className="select-badge" style={{ backgroundColor: selected.color, color: selected.textColor }}>
        {selected.label}
      </span>
      <select
        className="select-cell-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
