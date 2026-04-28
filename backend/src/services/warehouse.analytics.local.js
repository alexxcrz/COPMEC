function clampNonNegativeInteger(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.round(numberValue));
}

function minutesBetween(startDate, endDate) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return clampNonNegativeInteger((endMs - startMs) / 60000);
}

function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeStatus(rawStatus) {
  const raw = String(rawStatus || "").trim().toLowerCase();
  if (["c", "terminado", "finalizado", "finished"].includes(raw)) return "Finalizado";
  if (["r", "en curso", "en proceso", "running"].includes(raw)) return "En proceso";
  if (["p", "pausado", "paused"].includes(raw)) return "Pausado";
  return "Pendiente";
}

function startOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(dateValue, amount) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + amount);
  return date;
}

function sameOrBefore(left, right) {
  return new Date(left).getTime() <= new Date(right).getTime();
}

function parseJornadaFromState(state) {
  const startHour = clampNonNegativeInteger(state?.system?.operational?.pauseControl?.workHours?.startHour);
  const endHour = clampNonNegativeInteger(state?.system?.operational?.pauseControl?.workHours?.endHour);
  const safeStart = Math.min(23, Math.max(0, startHour || 8));
  const safeEnd = Math.min(23, Math.max(safeStart + 1, endHour || 16));
  return {
    hora_inicio: `${String(safeStart).padStart(2, "0")}:00`,
    hora_fin: `${String(safeEnd).padStart(2, "0")}:00`,
    horas_teoricas: clampNonNegativeInteger(safeEnd - safeStart) || 8,
    incluye_comida: false,
  };
}

function buildJornadaWindow(dayDate, jornadaConfig) {
  const [startHour] = String(jornadaConfig.hora_inicio || "08:00").split(":").map(Number);
  const [endHour] = String(jornadaConfig.hora_fin || "16:00").split(":").map(Number);

  const windowStart = new Date(dayDate);
  windowStart.setHours(startHour || 8, 0, 0, 0);

  const windowEnd = new Date(dayDate);
  windowEnd.setHours(endHour || 16, 0, 0, 0);

  return { windowStart, windowEnd };
}

function splitActivityIntoDailySegments(activity, jornadaConfig) {
  const segments = [];
  const startIso = toIsoOrNull(activity.fecha_inicio);
  const endIso = toIsoOrNull(activity.fecha_fin);
  if (!startIso || !endIso) return segments;

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  if (endDate <= startDate) return segments;

  let dayCursor = startOfDay(startDate);
  const endDay = startOfDay(endDate);

  while (sameOrBefore(dayCursor, endDay)) {
    const dayStart = startOfDay(dayCursor);
    const dayEnd = endOfDay(dayCursor);

    const activityDayStart = new Date(Math.max(startDate.getTime(), dayStart.getTime()));
    const activityDayEnd = new Date(Math.min(endDate.getTime(), dayEnd.getTime()));

    if (activityDayEnd > activityDayStart) {
      const { windowStart, windowEnd } = buildJornadaWindow(dayCursor, jornadaConfig);

      const beforeEnd = new Date(Math.min(activityDayEnd.getTime(), windowStart.getTime()));
      if (beforeEnd > activityDayStart) {
        segments.push({
          id: `seg-${activity.id}-${segments.length + 1}`,
          actividad_id: activity.id,
          fecha: dayStart.toISOString().slice(0, 10),
          hora_inicio: activityDayStart.toISOString(),
          hora_fin: beforeEnd.toISOString(),
          minutos: minutesBetween(activityDayStart, beforeEnd),
          tipo_segmento: "productivo",
          dentro_jornada: false,
        });
      }

      const insideStart = new Date(Math.max(activityDayStart.getTime(), windowStart.getTime()));
      const insideEnd = new Date(Math.min(activityDayEnd.getTime(), windowEnd.getTime()));
      if (insideEnd > insideStart) {
        segments.push({
          id: `seg-${activity.id}-${segments.length + 1}`,
          actividad_id: activity.id,
          fecha: dayStart.toISOString().slice(0, 10),
          hora_inicio: insideStart.toISOString(),
          hora_fin: insideEnd.toISOString(),
          minutos: minutesBetween(insideStart, insideEnd),
          tipo_segmento: "productivo",
          dentro_jornada: true,
        });
      }

      const afterStart = new Date(Math.max(activityDayStart.getTime(), windowEnd.getTime()));
      if (activityDayEnd > afterStart) {
        segments.push({
          id: `seg-${activity.id}-${segments.length + 1}`,
          actividad_id: activity.id,
          fecha: dayStart.toISOString().slice(0, 10),
          hora_inicio: afterStart.toISOString(),
          hora_fin: activityDayEnd.toISOString(),
          minutos: minutesBetween(afterStart, activityDayEnd),
          tipo_segmento: "productivo",
          dentro_jornada: false,
        });
      }
    }

    dayCursor = addDays(dayCursor, 1);
  }

  return segments;
}

function mapLegacyActivities(state, nowIso, catalogById) {
  return (state?.activities || []).map((activity) => {
    const status = normalizeStatus(activity.status);
    const startIso = toIsoOrNull(activity.startTime || activity.activityDate || activity.createdAt);
    const endIso = toIsoOrNull(
      activity.endTime
      || (status === "Pausado" ? activity.lastResumedAt : null)
      || (status === "Finalizado" ? activity.endTime : nowIso),
    );

    const catalogItem = catalogById.get(String(activity.catalogActivityId || ""));

    return {
      id: `act-${activity.id}`,
      fuente: "activities",
      actividad_ref_id: activity.id,
      usuario_id: activity.responsibleId || null,
      area_id: null,
      estado_raw: activity.status || "",
      estado_norm: status,
      fecha_inicio: startIso,
      fecha_fin: endIso,
      sla_minutos_objetivo: clampNonNegativeInteger(catalogItem?.timeLimitMinutes || 0),
      nombre_actividad: String(catalogItem?.name || "Actividad").trim() || "Actividad",
      creado_en: toIsoOrNull(activity.createdAt) || startIso,
      accumulatedSeconds: clampNonNegativeInteger(activity.accumulatedSeconds || 0),
    };
  });
}

function mapBoardRowsAsActivities(state, nowIso, catalogByName) {
  const activities = [];
  (state?.controlBoards || []).forEach((board) => {
    (board?.rows || []).forEach((row) => {
      const status = normalizeStatus(row.status);
      const startIso = toIsoOrNull(row.startTime || row.createdAt);
      const endIso = toIsoOrNull(
        row.endTime
        || (status === "Pausado" && row.startTime ? new Date(new Date(row.startTime).getTime() + (clampNonNegativeInteger(row.accumulatedSeconds) * 1000)).toISOString() : null)
        || (status === "En proceso" ? nowIso : null),
      );

      const activityName = Object.values(row?.values || {}).find((value) => String(value || "").trim()) || board?.name || "Actividad";
      const catalogItem = catalogByName.get(String(activityName || "").trim().toLowerCase());

      activities.push({
        id: `row-${board.id}-${row.id}`,
        fuente: "controlBoards",
        actividad_ref_id: row.id,
        board_id: board.id,
        usuario_id: row.responsibleId || null,
        area_id: null,
        estado_raw: row.status || "",
        estado_norm: status,
        fecha_inicio: startIso,
        fecha_fin: endIso,
        sla_minutos_objetivo: clampNonNegativeInteger(catalogItem?.timeLimitMinutes || 0),
        nombre_actividad: String(activityName || "Actividad").trim() || "Actividad",
        creado_en: toIsoOrNull(row.createdAt) || startIso,
        accumulatedSeconds: clampNonNegativeInteger(row.accumulatedSeconds || 0),
      });
    });
  });
  return activities;
}

function attachDataQualityFlags(activities, jornadaConfig) {
  const errors = [];
  const duplicateKeys = new Map();

  const checkedActivities = activities.map((activity) => {
    const issues = [];

    if (!activity.fecha_inicio) issues.push({ code: "FECHA_INICIO_VACIA", severity: "alta", message: "La actividad no tiene fecha de inicio." });
    if (activity.fecha_fin && activity.fecha_inicio && new Date(activity.fecha_fin) < new Date(activity.fecha_inicio)) {
      issues.push({ code: "RANGO_FECHA_INVALIDO", severity: "alta", message: "fecha_fin es menor que fecha_inicio." });
    }

    const jornadaMaxMinutes = clampNonNegativeInteger(jornadaConfig.horas_teoricas * 60);
    const reportedMinutes = activity.accumulatedSeconds > 0
      ? clampNonNegativeInteger(activity.accumulatedSeconds / 60)
      : minutesBetween(activity.fecha_inicio, activity.fecha_fin);
    if (reportedMinutes > (jornadaMaxMinutes * 3)) {
      issues.push({ code: "TIEMPO_ANORMAL", severity: "media", message: "Tiempo reportado excede jornada lógica esperada." });
    }

    const duplicateKey = [activity.usuario_id || "na", activity.nombre_actividad, activity.fecha_inicio || "na", activity.fecha_fin || "na"].join("|");
    duplicateKeys.set(duplicateKey, (duplicateKeys.get(duplicateKey) || 0) + 1);

    const nextActivity = {
      ...activity,
      confiable: issues.length === 0,
      motivo_no_confiable: issues.map((entry) => entry.message).join(" | ") || null,
    };

    issues.forEach((entry) => {
      errors.push({
        id: `err-${activity.id}-${errors.length + 1}`,
        actividad_id: activity.id,
        codigo_error: entry.code,
        severidad: entry.severity,
        descripcion: entry.message,
      });
    });

    return nextActivity;
  });

  checkedActivities.forEach((activity) => {
    const duplicateKey = [activity.usuario_id || "na", activity.nombre_actividad, activity.fecha_inicio || "na", activity.fecha_fin || "na"].join("|");
    if ((duplicateKeys.get(duplicateKey) || 0) > 1) {
      activity.confiable = false;
      activity.motivo_no_confiable = [activity.motivo_no_confiable, "Registro potencialmente duplicado."].filter(Boolean).join(" | ");
      errors.push({
        id: `err-${activity.id}-${errors.length + 1}`,
        actividad_id: activity.id,
        codigo_error: "DUPLICADO",
        severidad: "media",
        descripcion: "Registro potencialmente duplicado por usuario, actividad y rango de tiempo.",
      });
    }
  });

  return { activities: checkedActivities, errors };
}

function buildPauseSegmentsFromLogs(state) {
  return (state?.pauseLogs || []).map((log, index) => {
    const startIso = toIsoOrNull(log.pausedAt);
    const endIso = toIsoOrNull(log.resumedAt);
    const pausedMinutes = clampNonNegativeInteger((log.pauseDurationSeconds || 0) / 60);
    return {
      id: `pause-${index + 1}`,
      actividad_ref_id: log.weekActivityId || null,
      hora_inicio: startIso,
      hora_fin: endIso,
      minutos: pausedMinutes,
      razon: String(log.pauseReason || "").trim() || null,
    };
  }).filter((item) => item.hora_inicio && item.hora_fin && item.minutos > 0);
}

function computeKpis(activities, segments, pauseSegments) {
  const reliable = activities.filter((activity) => activity.confiable);
  const closed = reliable.filter((activity) => activity.estado_norm === "Finalizado");
  const inProgress = reliable.filter((activity) => activity.estado_norm === "En proceso");
  const paused = reliable.filter((activity) => activity.estado_norm === "Pausado");

  const productiveMinutes = segments
    .filter((segment) => segment.dentro_jornada && segment.tipo_segmento === "productivo")
    .reduce((sum, segment) => sum + clampNonNegativeInteger(segment.minutos), 0);

  const pauseMinutes = pauseSegments.reduce((sum, segment) => sum + clampNonNegativeInteger(segment.minutos), 0);

  const closedMinutes = closed.map((activity) => {
    if (activity.accumulatedSeconds > 0) return clampNonNegativeInteger(activity.accumulatedSeconds / 60);
    return minutesBetween(activity.fecha_inicio, activity.fecha_fin);
  });

  const sorted = [...closedMinutes].sort((left, right) => left - right);
  const median = sorted.length
    ? (sorted.length % 2 === 1
      ? sorted[Math.floor(sorted.length / 2)]
      : (sorted[(sorted.length / 2) - 1] + sorted[sorted.length / 2]) / 2)
    : 0;

  const slaEligible = closed.filter((activity) => activity.sla_minutos_objetivo > 0);
  const slaMet = slaEligible.filter((activity) => {
    const minutes = activity.accumulatedSeconds > 0
      ? clampNonNegativeInteger(activity.accumulatedSeconds / 60)
      : minutesBetween(activity.fecha_inicio, activity.fecha_fin);
    return minutes <= activity.sla_minutos_objetivo;
  });

  const avgMinutes = closedMinutes.length
    ? closedMinutes.reduce((sum, value) => sum + value, 0) / closedMinutes.length
    : 0;

  const efficiency = (productiveMinutes + pauseMinutes) > 0
    ? (productiveMinutes / (productiveMinutes + pauseMinutes)) * 100
    : 0;

  const slaCompliance = slaEligible.length > 0
    ? (slaMet.length / slaEligible.length) * 100
    : 0;

  return {
    registros_totales: activities.length,
    registros_confiables: reliable.length,
    cerrados: closed.length,
    en_proceso: inProgress.length,
    pausados: paused.length,
    tiempo_promedio_min: Number(avgMinutes.toFixed(2)),
    mediana_min: Number(median.toFixed(2)),
    horas_productivas: Number((productiveMinutes / 60).toFixed(2)),
    horas_en_pausa: Number((pauseMinutes / 60).toFixed(2)),
    eficiencia_operativa_pct: Number(efficiency.toFixed(2)),
    cumplimiento_sla_pct: Number(slaCompliance.toFixed(2)),
    fuera_sla_pct: Number((100 - slaCompliance).toFixed(2)),
    pausar_registradas: pauseSegments.length,
  };
}

function buildInsights(activities, segments, errors) {
  const reliable = activities.filter((activity) => activity.confiable);
  const byUser = new Map();
  const byActivity = new Map();

  reliable.forEach((activity) => {
    const userKey = activity.usuario_id || "sin-usuario";
    byUser.set(userKey, (byUser.get(userKey) || 0) + 1);

    const activityKey = activity.nombre_actividad || "Actividad";
    byActivity.set(activityKey, (byActivity.get(activityKey) || 0) + 1);
  });

  const topUser = [...byUser.entries()].sort((a, b) => b[1] - a[1])[0] || ["sin-usuario", 0];
  const topActivity = [...byActivity.entries()].sort((a, b) => b[1] - a[1])[0] || ["Actividad", 0];

  const outsideJornadaMinutes = segments
    .filter((segment) => !segment.dentro_jornada)
    .reduce((sum, segment) => sum + clampNonNegativeInteger(segment.minutos), 0);

  return {
    principal_hallazgo: outsideJornadaMinutes > 0
      ? `Se detectaron ${outsideJornadaMinutes} minutos fuera de jornada (no productivos para KPI).`
      : "No se detectó consumo fuera de jornada en el periodo analizado.",
    usuario_mayor_carga: { usuario_id: topUser[0], registros: topUser[1] },
    actividad_mas_frecuente: { actividad: topActivity[0], registros: topActivity[1] },
    errores_detectados: errors.length,
    recomendacion: errors.length > 0
      ? "Revisar registros no confiables y corregir fechas/duplicados antes de cierre operativo."
      : "Mantener disciplina de captura y continuar monitoreo diario de SLA y pausas.",
  };
}

export function buildOperationalAnalyticsFromLocalState(state, options = {}) {
  const nowIso = toIsoOrNull(options.now || new Date().toISOString()) || new Date().toISOString();
  const jornada = parseJornadaFromState(state || {});

  const catalogById = new Map((state?.catalog || []).map((item) => [String(item.id || ""), item]));
  const catalogByName = new Map((state?.catalog || []).map((item) => [String(item?.name || "").trim().toLowerCase(), item]));

  const unifiedActivitiesRaw = [
    ...mapLegacyActivities(state || {}, nowIso, catalogById),
    ...mapBoardRowsAsActivities(state || {}, nowIso, catalogByName),
  ];

  const { activities, errors } = attachDataQualityFlags(unifiedActivitiesRaw, jornada);

  const segmented = activities.flatMap((activity) => splitActivityIntoDailySegments(activity, jornada));
  const pauseSegments = buildPauseSegmentsFromLogs(state || {});

  const segmentos_tiempo = segmented.concat(
    pauseSegments.map((pauseSegment, index) => ({
      id: `seg-pause-${index + 1}`,
      actividad_id: pauseSegment.actividad_ref_id ? `act-${pauseSegment.actividad_ref_id}` : `pause-unknown-${index + 1}`,
      fecha: String(pauseSegment.hora_inicio).slice(0, 10),
      hora_inicio: pauseSegment.hora_inicio,
      hora_fin: pauseSegment.hora_fin,
      minutos: pauseSegment.minutos,
      tipo_segmento: "pausa",
      dentro_jornada: true,
    })),
  );

  const kpis = computeKpis(activities, segmentos_tiempo, pauseSegments);
  const insights = buildInsights(activities, segmentos_tiempo, errors);

  const actividades = activities.map((activity) => {
    const totalMin = activity.accumulatedSeconds > 0
      ? clampNonNegativeInteger(activity.accumulatedSeconds / 60)
      : minutesBetween(activity.fecha_inicio, activity.fecha_fin);

    const productiveWithin = segmentos_tiempo
      .filter((segment) => segment.actividad_id === activity.id && segment.tipo_segmento === "productivo" && segment.dentro_jornada)
      .reduce((sum, segment) => sum + clampNonNegativeInteger(segment.minutos), 0);

    const pauseMin = pauseSegments
      .filter((pauseSegment) => activity.actividad_ref_id && pauseSegment.actividad_ref_id === activity.actividad_ref_id)
      .reduce((sum, pauseSegment) => sum + clampNonNegativeInteger(pauseSegment.minutos), 0);

    return {
      id: activity.id,
      actividad_ref_id: activity.actividad_ref_id,
      fuente: activity.fuente,
      usuario_id: activity.usuario_id,
      area_id: activity.area_id,
      estado_raw: activity.estado_raw,
      estado_norm: activity.estado_norm,
      fecha_inicio: activity.fecha_inicio,
      fecha_fin: activity.fecha_fin,
      tiempo_total_min: totalMin,
      tiempo_dentro_jornada_min: productiveWithin,
      tiempo_pausa_min: pauseMin,
      sla_minutos_objetivo: activity.sla_minutos_objetivo,
      nombre_actividad: activity.nombre_actividad,
      confiable: activity.confiable,
      motivo_no_confiable: activity.motivo_no_confiable,
      creado_en: activity.creado_en,
    };
  });

  return {
    generado_en: nowIso,
    configuracion_jornada: jornada,
    actividades,
    segmentos_tiempo,
    errores_detectados: errors,
    kpis,
    insights,
  };
}
