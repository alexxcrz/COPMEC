export const OPERATIONAL_INSPECTION_TEMPLATE = {
  id: "operational-inspection-v1",
  name: "Checklist - Inspeccion Operativa",
  version: 1,
  incidenceRules: {
    createOnNoOk: true,
    requirePhotoOnNoOk: true,
    autoAssignToReporter: true,
    defaultStatus: "abierta",
    defaultPriority: "media",
  },
  metadataFields: [
    { key: "area", label: "Area", required: true },
    { key: "date", label: "Fecha", required: true },
    { key: "responsable", label: "Responsable", required: true },
    { key: "shift", label: "Turno", required: false },
    { key: "process", label: "Proceso/Tablero", required: false },
  ],
  sections: [
    {
      id: "naves",
      title: "Revision de Naves",
      incidenceCategory: "Infraestructura",
      checks: [
        { id: "naves-condiciones-generales", label: "Condiciones generales de la nave" },
        { id: "naves-salitre", label: "Presencia de salitre en muros/estructuras" },
        { id: "naves-racks", label: "Estado de racks (sin golpes o danos)" },
        { id: "naves-orden-limpieza", label: "Orden y limpieza" },
      ],
    },
    {
      id: "cisternas",
      title: "Revision de Cisternas",
      incidenceCategory: "Infraestructura",
      checks: [
        { id: "cisternas-nivel-agua", label: "Nivel de agua adecuado" },
        { id: "cisternas-sin-fugas", label: "Sin fugas visibles" },
        { id: "cisternas-tapas", label: "Tapas en buen estado" },
        { id: "cisternas-limpieza", label: "Limpieza general" },
      ],
    },
    {
      id: "tanques-montacargas",
      title: "Revision de Tanques y Montacargas",
      incidenceCategory: "Equipo / Herramienta",
      checks: [
        { id: "tanques-estado", label: "Estado de tanques" },
        { id: "tanques-sin-fugas", label: "Sin fugas en tanques" },
        { id: "montacargas-cambio-tanque", label: "Cambio de tanque de montacargas realizado" },
        { id: "montacargas-funcionamiento", label: "Funcionamiento correcto del montacargas" },
      ],
    },
    {
      id: "oficinas-limpieza",
      title: "Revision de Oficinas y Limpieza",
      incidenceCategory: "Limpieza",
      checks: [
        { id: "oficinas-wc-viernes", label: "Limpieza de cajas de WC (viernes de cada semana)" },
        { id: "oficinas-muebles", label: "Chequeo de muebles (estado general)" },
        { id: "oficinas-electricos", label: "Chequeo de aparatos electricos (funcionamiento y estado)" },
      ],
    },
  ],
};

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? new Date().toISOString() : asDate.toISOString();
}

export function createOperationalInspectionDraft(template = OPERATIONAL_INSPECTION_TEMPLATE) {
  const checkMap = {};
  for (const section of template.sections || []) {
    for (const check of section.checks || []) {
      checkMap[check.id] = {
        status: "pending", // pending | ok | no_ok | na
        notes: "",
        severity: "media", // baja | media | alta | critica
        photos: [],
      };
    }
  }

  return {
    templateId: template.id,
    metadata: {
      area: "",
      date: new Date().toISOString().slice(0, 10),
      responsable: "",
      shift: "",
      process: "",
    },
    checks: checkMap,
    observations: "",
  };
}

export function validateOperationalInspection(draft, template = OPERATIONAL_INSPECTION_TEMPLATE) {
  const errors = [];
  const metadata = draft?.metadata || {};

  for (const field of template.metadataFields || []) {
    if (!field.required) continue;
    if (!String(metadata[field.key] || "").trim()) {
      errors.push(`Falta campo obligatorio: ${field.label}.`);
    }
  }

  for (const section of template.sections || []) {
    for (const check of section.checks || []) {
      const state = draft?.checks?.[check.id];
      if (!state) {
        errors.push(`Falta estado del check: ${check.label}.`);
        continue;
      }
      if (state.status === "pending") {
        errors.push(`Marca resultado para: ${check.label}.`);
      }
      if (state.status === "no_ok" && template.incidenceRules?.requirePhotoOnNoOk) {
        if (!Array.isArray(state.photos) || state.photos.length === 0) {
          errors.push(`Debes adjuntar evidencia para incidencia: ${check.label}.`);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function buildIncidenciasFromOperationalInspection({
  draft,
  template = OPERATIONAL_INSPECTION_TEMPLATE,
  currentUser,
}) {
  const incidencias = [];
  const metadata = draft?.metadata || {};
  const reporterId = String(currentUser?.id || "").trim();
  const reporterName = String(currentUser?.name || "").trim();

  for (const section of template.sections || []) {
    for (const check of section.checks || []) {
      const state = draft?.checks?.[check.id];
      if (!state || state.status !== "no_ok") continue;

      const notes = String(state.notes || "").trim();
      const photos = Array.isArray(state.photos) ? state.photos : [];
      const photoLines = photos
        .map((photo, index) => `- Evidencia ${index + 1}: ${String(photo?.url || photo?.secureUrl || "").trim()}`)
        .filter((line) => !line.endsWith(": "));

      const descriptionParts = [
        notes || "Hallazgo detectado durante checklist de inspeccion operativa.",
        "",
        `Origen: ${template.name}`,
        `Seccion: ${section.title}`,
        `Check: ${check.label}`,
        `Area inspeccion: ${String(metadata.area || "").trim() || "N/A"}`,
        `Responsable inspeccion: ${String(metadata.responsable || "").trim() || reporterName || "N/A"}`,
        `Fecha inspeccion: ${toIsoDate(metadata.date)}`,
        `Turno: ${String(metadata.shift || "").trim() || "N/A"}`,
        `Proceso/Tablero: ${String(metadata.process || "").trim() || "N/A"}`,
      ];

      if (photoLines.length > 0) {
        descriptionParts.push("", "Evidencias:", ...photoLines);
      }

      incidencias.push({
        title: `[Inspeccion] ${check.label}`,
        description: descriptionParts.join("\n"),
        category: section.incidenceCategory || "Otro",
        area: String(metadata.area || section.title || "").trim(),
        priority: ["baja", "media", "alta", "critica"].includes(state.severity) ? state.severity : template.incidenceRules.defaultPriority || "media",
        status: template.incidenceRules.defaultStatus || "abierta",
        assignedToId: template.incidenceRules.autoAssignToReporter ? reporterId : "",
        assignedToName: template.incidenceRules.autoAssignToReporter ? reporterName : "",
      });
    }
  }

  return incidencias;
}

export async function createIncidenciasFromOperationalInspection({
  draft,
  template = OPERATIONAL_INSPECTION_TEMPLATE,
  currentUser,
  requestJson,
}) {
  const payloads = buildIncidenciasFromOperationalInspection({ draft, template, currentUser });
  const results = [];

  for (const payload of payloads) {
    const response = await requestJson("/warehouse/incidencias", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    results.push({ payload, response });
  }

  return {
    created: payloads.length,
    payloads,
    results,
  };
}
