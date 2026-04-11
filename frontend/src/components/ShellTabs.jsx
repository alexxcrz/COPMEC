import { FileSpreadsheet, LayoutGrid } from "lucide-react";
import "./ShellTabs.css";

const items = [
  { key: "board", label: "Tablero", icon: LayoutGrid },
  { key: "import", label: "Importador", icon: FileSpreadsheet },
];

export function ShellTabs({ activeTab, onChange }) {
  return (
    <nav className="shell-tabs" aria-label="Navegacion principal COPMEC">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`shell-tab-button ${active ? "is-active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
