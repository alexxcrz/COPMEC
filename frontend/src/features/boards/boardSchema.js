export const boardColumns = [
  {
    id: "col-name",
    key: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Ej: Proyecto Andino",
  },
  {
    id: "col-budget",
    key: "budget",
    label: "Presupuesto",
    type: "number",
    placeholder: "0",
  },
  {
    id: "col-status",
    key: "status",
    label: "Estado",
    type: "select",
    options: [
      { value: "planning", label: "Planificacion", color: "#dbeafe", textColor: "#1e3a8a" },
      { value: "progress", label: "En progreso", color: "#fef3c7", textColor: "#92400e" },
      { value: "done", label: "Completado", color: "#e8eff6", textColor: "#2d4f72" },
    ],
  },
  {
    id: "col-dueDate",
    key: "dueDate",
    label: "Fecha",
    type: "date",
  },
  {
    id: "col-file",
    key: "attachment",
    label: "Archivo",
    type: "file",
  },
  {
    id: "col-done",
    key: "completed",
    label: "Check",
    type: "checkbox",
  },
];

export function createEmptyRowFromColumns(columns, index) {
  const cells = columns.reduce((acc, column) => {
    if (column.type === "checkbox") {
      acc[column.key] = false;
      return acc;
    }

    if (column.type === "file") {
      acc[column.key] = null;
      return acc;
    }

    if (column.type === "select") {
      acc[column.key] = column.options?.[0]?.value || "";
      return acc;
    }

    acc[column.key] = "";
    return acc;
  }, {});

  return {
    id: `row-${Date.now()}-${index}`,
    cells,
  };
}

export function createEmptyRow(index) {
  return createEmptyRowFromColumns(boardColumns, index);
}

export function createSeedRows() {
  return [
    {
      id: "row-1",
      cells: {
        name: "Cliente ACME",
        budget: 1200,
        status: "progress",
        dueDate: "2026-04-02",
        attachment: null,
        completed: false,
      },
    },
    {
      id: "row-2",
      cells: {
        name: "Obra Norte",
        budget: 3400,
        status: "done",
        dueDate: "2026-04-20",
        attachment: null,
        completed: true,
      },
    },
    createEmptyRow(3),
  ];
}
