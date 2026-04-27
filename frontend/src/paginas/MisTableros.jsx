import ReturnsReconditionScanner from "../features/boards/ReturnsReconditionScanner.jsx";

export default function MisTableros({ contexto }) {
  const {
    visibleControlBoards,
    customBoardSearch,
    setCustomBoardSearch,
    selectedCustomBoard,
    filteredVisibleControlBoards,
    setSelectedCustomBoardId,
    selectedCustomBoardDisplay,
    selectedCustomBoardHistoryOptions,
    selectedCustomBoardSnapshot,
    selectedCustomBoardViewId,
    setSelectedCustomBoardViewId,
    isHistoricalCustomBoardView,
    canChangeSelectedBoardOperationalContext,
    customBoardMetrics,
    StatTile,
    customBoardActionsMenuRef,
    createBoardRow,
    selectedBoardActionPermissions,
    Plus,
    Menu,
    customBoardActionsMenuOpen,
    setCustomBoardActionsMenuOpen,
    exportSelectedBoardToExcel,
    previewSelectedBoardPdf,
    exportSelectedBoardToPdf,
    userMap,
    boardRuntimeFeedback,
    selectedCustomBoardSections,
    renderBoardFieldLabel,
    canEditBoardRowRecord,
    currentUser,
    normalizedPermissions,
    canOperateBoardRowRecord,
    STATUS_FINISHED,
    STATUS_PENDING,
    STATUS_PAUSED,
    STATUS_RUNNING,
    getBoardFieldValue,
    getFieldColorRule,
    getBoardFieldCellStyle,
    getBoardAssignmentSummary,
    getOrderedBoardColumns,
    buildSelectOptions,
    state,
    InventoryLookupInput,
    updateBoardRowValue,
    visibleUsers,
    requestJson,
    applyRemoteWarehouseState,
    setState,
    setLoginDirectory,
    skipNextSyncRef,
    setSyncStatus,
    setBoardRuntimeFeedback,
    updateBoardOperationalContext,
    StatusBadge,
    formatDurationClock,
    getElapsedSeconds,
    now,
    changeBoardRowStatus,
    Play,
    openBoardPauseModal,
    PauseCircle,
    openFinishBoardRowConfirm,
    Square,
    setDeleteBoardRowState,
    Trash2,
    LayoutDashboard,
    ROLE_JR,
    formatDate,
  } = contexto;

  function normalizeTimeInput24h(value, strict = false) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const normalized = raw
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, "")
      .replace(/an$/g, "am")
      .replace(/pn$/g, "pm");

    const amPmMatch = normalized.match(/^(\d{1,2})(?::?(\d{1,2}))?(am|pm)$/);
    if (amPmMatch) {
      const hourValue = Number.parseInt(amPmMatch[1], 10);
      const minuteValue = Number.parseInt(amPmMatch[2] || "0", 10);
      if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return strict ? "" : raw;
      let hour24 = hourValue;
      if (amPmMatch[3] === "pm") hour24 = hourValue === 12 ? 12 : hourValue + 12;
      if (amPmMatch[3] === "am") hour24 = hourValue === 12 ? 0 : hourValue;
      if (hour24 < 0 || hour24 > 23 || minuteValue < 0 || minuteValue > 59) return strict ? "" : raw;
      return `${String(hour24).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}`;
    }

    const compactDigits = normalized.replace(/[^\d:]/g, "");
    if (!compactDigits) return strict ? "" : "";

    if (!strict) {
      if (compactDigits.includes(":")) {
        const [hoursPart = "", minutesPart = ""] = compactDigits.split(":");
        return `${hoursPart.slice(0, 2)}${compactDigits.includes(":") ? ":" : ""}${minutesPart.slice(0, 2)}`;
      }
      if (compactDigits.length <= 2) return compactDigits;
      return `${compactDigits.slice(0, 2)}:${compactDigits.slice(2, 4)}`;
    }

    let hours = "";
    let minutes = "";
    if (compactDigits.includes(":")) {
      const [hoursPart = "", minutesPart = ""] = compactDigits.split(":");
      hours = hoursPart.slice(0, 2);
      minutes = minutesPart.slice(0, 2);
    } else {
      const digitsOnly = compactDigits.replace(":", "");
      if (digitsOnly.length < 3) return "";
      hours = digitsOnly.slice(0, 2);
      minutes = digitsOnly.slice(2, 4);
    }

    if (hours.length !== 2 || minutes.length !== 2) return "";
    const hourValue = Number.parseInt(hours, 10);
    const minuteValue = Number.parseInt(minutes, 10);
    if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue)) return "";
    if (hourValue < 0 || hourValue > 23 || minuteValue < 0 || minuteValue > 59) return "";
    return `${String(hourValue).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}`;
  }

  const auxLabels = {
    assignee: "Player",
    status: "Estado",
    time: "Tiempo",
    workflow: "Acciones",
  };
  const defaultAuxWidths = {
    assignee: 220,
    status: 150,
    time: 130,
    totalTime: 130,
    efficiency: 120,
    workflow: 190,
  };
  const auxMinWidths = {
    assignee: 190,
    status: 140,
    time: 120,
    totalTime: 120,
    efficiency: 100,
    workflow: 160,
  };
  const getAuxColumnStyle = (auxId) => {
    const configured = Number(selectedCustomBoard?.settings?.auxColumnWidths?.[auxId] || 0);
    const baseWidth = Number.isFinite(configured) && configured >= 90 ? Math.round(configured) : defaultAuxWidths[auxId] || 160;
    const widthPx = Math.max(auxMinWidths[auxId] || 120, baseWidth);
    return { minWidth: `${widthPx}px`, width: `${widthPx}px` };
  };
  const getFieldColumnStyle = (field) => {
    const baseStyle = getBoardFieldCellStyle(field) || {};
    if (baseStyle.width) return baseStyle;
    if (baseStyle.minWidth) return { ...baseStyle, width: baseStyle.minWidth };
    return baseStyle;
  };
  const formatFieldLabel = typeof renderBoardFieldLabel === "function"
    ? renderBoardFieldLabel
    : (label, required = false) => `${label}${required ? " *" : ""}`;
  const boardView = selectedCustomBoardDisplay || selectedCustomBoard;
  const isBoardOwner = Boolean(selectedCustomBoard && currentUser && (currentUser.role === "Lead" || selectedCustomBoard.createdById === currentUser.id || selectedCustomBoard.ownerId === currentUser.id));
  const boardColumns = boardView ? getOrderedBoardColumns(boardView, isBoardOwner) : [];
  const boardOperationalContextType = String(boardView?.settings?.operationalContextType || "none");
  const boardOperationalContextLabel = String(boardView?.settings?.operationalContextLabel || "").trim()
    || (boardOperationalContextType === "cleaningSite" ? "Sede de limpieza" : "Ubicación operativa");
  const boardOperationalContextOptions = boardOperationalContextType === "cleaningSite"
    ? ["C1", "C2", "C3"]
    : Array.isArray(boardView?.settings?.operationalContextOptions)
      ? boardView.settings.operationalContextOptions.map((option) => String(option || "").trim()).filter(Boolean)
      : [];
  const boardOperationalContextValue = String(boardView?.settings?.operationalContextValue || "").trim();
  const boardNameText = String(boardView?.name || "").toLowerCase();
  const boardCategoryText = String(boardView?.category || "").toLowerCase();
  const boardDescriptionText = String(boardView?.description || "").toLowerCase();
  const boardLooksCleaning = [boardNameText, boardCategoryText, boardDescriptionText].some((text) => text.includes("limp"));
  const boardLooksReturnsRecondition = [boardNameText, boardCategoryText, boardDescriptionText].some((text) => /(devol|reacond|maquila)/.test(text));
  const isCleaningRelatedBoard = boardOperationalContextType === "cleaningSite" || boardLooksCleaning;
  const visibleBoardColumns = boardColumns;

  // Compute available cleaning naves from inventory items that have activity consumptions
  const cleaningNaveOptions = (() => {
    const cleaningItems = (state.inventoryItems || []).filter(
      (item) => item.domain === "cleaning" && (item.activityConsumptions || []).length > 0
    );
    return [...new Set(cleaningItems.map((item) => item.cleaningSite).filter(Boolean))].sort();
  })();

  const showCleaningNaveSelector = isCleaningRelatedBoard;
  const effectiveCleaningNaves = (cleaningNaveOptions.length > 0)
    ? cleaningNaveOptions
    : ["C1", "C2", "C3"];
  const cleaningNaveValue = boardOperationalContextValue || effectiveCleaningNaves[0] || "C3";

  return (
    <section className="admin-page-layout mis-tableros-shell">
      {selectedCustomBoard ? (
        <>
          <div className="inventory-stat-grid custom-board-stat-grid">
            <StatTile label="Filas" value={customBoardMetrics?.totalRows || 0} className="custom-board-stat-tile" />
            <StatTile label="En curso" value={customBoardMetrics?.running || 0} tone="soft" className="custom-board-stat-tile" />
            <StatTile label="Terminadas" value={customBoardMetrics?.completed || 0} tone="success" className="custom-board-stat-tile" />
          </div>

          <article className="surface-card full-width table-card admin-surface-card board-pdf-root" data-board-pdf-root="selected">
            <div className="card-header-row">
              <div>
                <h3>{boardView?.name || selectedCustomBoard.name}</h3>
                <div className="saved-board-list">
                  <span className={isHistoricalCustomBoardView ? "chip" : "chip success"}>{isHistoricalCustomBoardView ? "Histórico" : "Semana actual"}</span>
                  <span className="chip">{isHistoricalCustomBoardView ? selectedCustomBoardSnapshot?.weekName : "Operación activa"}</span>
                </div>
              </div>
              <div className="toolbar-actions custom-board-toolbar-actions board-pdf-hide">
                {filteredVisibleControlBoards.length > 1 ? (
                  <label className="board-top-select min-width">
                    <span>Tablero</span>
                    <select value={selectedCustomBoard.id} onChange={(event) => {
                      setSelectedCustomBoardId(event.target.value);
                      setSelectedCustomBoardViewId("current");
                    }}>
                      {filteredVisibleControlBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                    </select>
                  </label>
                ) : null}
                <div className="board-context-inline-filters">
                  <label className="board-top-select min-width board-week-select-inline">
                    <span>Semana</span>
                    <select value={selectedCustomBoardViewId} onChange={(event) => setSelectedCustomBoardViewId(event.target.value)}>
                      <option value="current">Semana actual</option>
                      {selectedCustomBoardHistoryOptions.map((snapshot) => (
                        <option key={snapshot.id} value={snapshot.id}>{snapshot.weekName}</option>
                      ))}
                    </select>
                  </label>
                  {showCleaningNaveSelector ? (
                    <label className="board-top-select min-width board-cleaning-site-select-inline">
                      <span>Nave de limpieza</span>
                      <select
                        value={cleaningNaveValue}
                        onChange={(event) => updateBoardOperationalContext(selectedCustomBoard.id, event.target.value)}
                        disabled={isHistoricalCustomBoardView || !canChangeSelectedBoardOperationalContext}
                      >
                        {effectiveCleaningNaves.map((nave) => <option key={nave} value={nave}>{nave}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
                {!showCleaningNaveSelector && boardOperationalContextType !== "none" ? (
                  <label className="board-top-select min-width">
                    <span>{boardOperationalContextLabel}</span>
                    <select
                      value={boardOperationalContextValue}
                      onChange={(event) => updateBoardOperationalContext(selectedCustomBoard.id, event.target.value)}
                      disabled={isHistoricalCustomBoardView || !canChangeSelectedBoardOperationalContext}
                    >
                      {boardOperationalContextOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ) : null}
                <div className="custom-board-actions-menu-shell" ref={customBoardActionsMenuRef}>
                  <button
                    type="button"
                    className="primary-button custom-board-add-row-button"
                    title="Nueva fila"
                    aria-label="Nueva fila"
                    onClick={() => createBoardRow(selectedCustomBoard.id)}
                    disabled={isHistoricalCustomBoardView || !selectedBoardActionPermissions.createBoardRow}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button custom-board-menu-trigger"
                    aria-label="Abrir acciones del tablero"
                    aria-expanded={customBoardActionsMenuOpen}
                    onClick={() => setCustomBoardActionsMenuOpen((current) => !current)}
                    disabled={isHistoricalCustomBoardView}
                  >
                    <Menu size={16} />
                  </button>
                  {customBoardActionsMenuOpen && !isHistoricalCustomBoardView ? (
                    <div className="custom-board-actions-dropdown">
                      <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); exportSelectedBoardToExcel(); }} disabled={!selectedBoardActionPermissions.exportBoardExcel}>
                        Exportar Excel
                      </button>
                      <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); previewSelectedBoardPdf(); }} disabled={!selectedBoardActionPermissions.previewBoardPdf}>
                        Vista PDF
                      </button>
                      <button type="button" className="custom-board-menu-item" onClick={() => { setCustomBoardActionsMenuOpen(false); exportSelectedBoardToPdf(); }} disabled={!selectedBoardActionPermissions.exportBoardPdf}>
                        Exportar PDF
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="board-meta-inline board-meta-inline-header">
              <span>Creó · {userMap.get(boardView?.createdById)?.name || "N/A"}</span>
              <span>Player principal · {userMap.get(boardView?.ownerId)?.name || "N/A"}</span>
              <span>{getBoardAssignmentSummary(boardView, userMap)}</span>
              {boardOperationalContextType !== "none" && boardOperationalContextValue ? <span>{boardOperationalContextLabel} · {boardOperationalContextValue}</span> : null}
              {isHistoricalCustomBoardView ? <span>Corte · {formatDate(selectedCustomBoardSnapshot?.startDate)} - {formatDate(selectedCustomBoardSnapshot?.endDate)}</span> : null}
            </div>
            {isHistoricalCustomBoardView ? <p className="subtle-line">Vista histórica en solo lectura. El tablero activo ya quedó limpio para la semana actual.</p> : null}
            <p className="required-legend"><span className="required-mark" aria-hidden="true">*</span> obligatorio</p>

            {boardLooksReturnsRecondition ? (
              <ReturnsReconditionScanner
                boardView={boardView}
                currentUser={currentUser}
                inventoryItems={state.inventoryItems || []}
                state={state}
                requestJson={requestJson}
                applyRemoteWarehouseState={applyRemoteWarehouseState}
                setState={setState}
                setLoginDirectory={setLoginDirectory}
                skipNextSyncRef={skipNextSyncRef}
                setSyncStatus={setSyncStatus}
                setBoardRuntimeFeedback={setBoardRuntimeFeedback}
                disabled={isHistoricalCustomBoardView}
              />
            ) : null}

            <div className="table-wrap">
              <table className="admin-table-clean board-runtime-table">
                <thead>
                  {selectedCustomBoardSections.length && !boardLooksReturnsRecondition ? (
                    <tr className="board-pdf-hide">
                      {selectedCustomBoardSections.map((section, index) => (
                        <th key={`${section.name}-${index}`} colSpan={section.span} className="board-section-header-cell" style={{ backgroundColor: section.color }}>
                          {section.name}
                        </th>
                      ))}
                    </tr>
                  ) : null}
                  <tr>
                    {visibleBoardColumns.map((column) => (
                      <th key={column.token} className={column.kind !== "field" && column.id === "workflow" ? "board-pdf-hide" : ""} style={column.kind === "field" ? getFieldColumnStyle(column.field) : getAuxColumnStyle(column.id)} title={column.kind === "field" ? `${column.field.helpText || column.field.label}${column.field.required ? " · Obligatorio" : ""}` : column.label}>
                        {column.kind === "field" ? formatFieldLabel(column.field.label, column.field.required) : column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(boardView?.rows || []).map((row) => {
                    const rowCaptureEnabled = !isHistoricalCustomBoardView && canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const rowWorkflowEnabled = !isHistoricalCustomBoardView && canOperateBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const rowDeleteEnabled = !isHistoricalCustomBoardView && row.status !== STATUS_FINISHED && canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const isFinishedRow = row.status === STATUS_FINISHED;
                    const rowFieldEditable = rowCaptureEnabled && !isFinishedRow;
                    const canStartRow = row.status === STATUS_PENDING || row.status === STATUS_PAUSED;
                    const canPauseRow = row.status === STATUS_RUNNING;
                    const canFinishRow = row.status === STATUS_RUNNING;
                    return (
                      <tr key={row.id}>
                        {visibleBoardColumns.map((column) => {
                          if (column.kind !== "field") {
                            if (column.id === "assignee") {
                              return (
                                <td key={`${row.id}-${column.token}`} style={getAuxColumnStyle(column.id)}>
                                  <select value={row.responsibleId || ""} onChange={(event) => {
                                    if (!rowFieldEditable) return;
                                    requestJson(`/warehouse/boards/${selectedCustomBoard.id}/rows/${row.id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ responsibleId: event.target.value }),
                                    }).then((remoteState) => {
                                      applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
                                    }).catch((error) => {
                                      setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar el responsable de la fila." });
                                    });
                                  }} disabled={!rowFieldEditable} style={{ width: "100%" }}>
                                    {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                  </select>
                                </td>
                              );
                            }

                            if (column.id === "status") {
                              return <td key={`${row.id}-${column.token}`} style={getAuxColumnStyle(column.id)}><StatusBadge status={row.status || STATUS_PENDING} /></td>;
                            }

                            if (column.id === "time") {
                              const effectiveNow = row.status === STATUS_FINISHED && row.endTime ? new Date(row.endTime).getTime() : now;
                              return <td key={`${row.id}-${column.token}`} style={getAuxColumnStyle(column.id)}>{formatDurationClock(getElapsedSeconds(row, effectiveNow))}</td>;
                            }

                            if (column.id === "totalTime") {
                              const effectiveNow = row.status === STATUS_FINISHED && row.endTime ? new Date(row.endTime).getTime() : now;
                              const prodSecs = getElapsedSeconds(row, effectiveNow);
                              const totalSecs = row.startTime
                                ? Math.max(prodSecs, Math.floor((effectiveNow - new Date(row.startTime).getTime()) / 1000))
                                : 0;
                              return <td key={`${row.id}-${column.token}`} style={getAuxColumnStyle(column.id)}>{formatDurationClock(totalSecs)}</td>;
                            }

                            if (column.id === "efficiency") {
                              const effectiveNow = row.status === STATUS_FINISHED && row.endTime ? new Date(row.endTime).getTime() : now;
                              const prodSecs = getElapsedSeconds(row, effectiveNow);
                              const totalSecs = row.startTime
                                ? Math.max(prodSecs, Math.floor((effectiveNow - new Date(row.startTime).getTime()) / 1000))
                                : prodSecs;
                              const pct = totalSecs > 0 ? Math.round((prodSecs / totalSecs) * 100) : (row.startTime ? 100 : 0);
                              const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
                              return (
                                <td key={`${row.id}-${column.token}`} style={getAuxColumnStyle(column.id)}>
                                  <span style={{ color, fontWeight: 600 }}>{row.startTime ? `${pct}%` : "—"}</span>
                                </td>
                              );
                            }

                            return (
                              <td key={`${row.id}-${column.token}`} className="board-workflow-cell board-pdf-hide" style={getAuxColumnStyle(column.id)}>
                                <div className="row-actions compact board-workflow-actions">
                                  {canStartRow ? (
                                    <button type="button" className="board-action-button start icon-only" title={row.status === STATUS_PAUSED ? "Reanudar" : "Iniciar"} aria-label={row.status === STATUS_PAUSED ? "Reanudar" : "Iniciar"} onClick={() => changeBoardRowStatus(selectedCustomBoard.id, row.id, STATUS_RUNNING)} disabled={!rowWorkflowEnabled}>
                                      <Play size={13} />
                                    </button>
                                  ) : null}
                                  {canPauseRow ? (
                                    <button type="button" className="board-action-button pause icon-only" title="Pausar" aria-label="Pausar" onClick={() => openBoardPauseModal(selectedCustomBoard.id, row.id)} disabled={!rowWorkflowEnabled}>
                                      <PauseCircle size={13} />
                                    </button>
                                  ) : null}
                                  {canFinishRow ? (
                                    <button type="button" className="board-action-button finish icon-only" title="Finalizar" aria-label="Finalizar" onClick={() => openFinishBoardRowConfirm(selectedCustomBoard.id, row.id)} disabled={!rowWorkflowEnabled}>
                                      <Square size={13} />
                                    </button>
                                  ) : null}
                                  {isFinishedRow ? (
                                    <button type="button" className="board-action-button finish icon-only static" title="Terminado" aria-label="Terminado" disabled>
                                      <Square size={13} />
                                    </button>
                                  ) : null}
                                  <button type="button" className={`board-action-button delete icon-only ${rowDeleteEnabled ? "enabled" : "locked"}`.trim()} title={rowDeleteEnabled ? "Eliminar fila" : "Las filas terminadas no se pueden eliminar"} aria-label={rowDeleteEnabled ? "Eliminar fila" : "Las filas terminadas no se pueden eliminar"} onClick={() => {
                                    if (!rowDeleteEnabled) return;
                                    setDeleteBoardRowState({ open: true, boardId: selectedCustomBoard.id, rowId: row.id });
                                  }} disabled={!rowDeleteEnabled}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            );
                          }

                          const field = column.field;
                          const value = getBoardFieldValue(boardView, row, field);
                          const rule = getFieldColorRule(field, value);
                          const columnStyle = getFieldColumnStyle(field);
                          const controlStyle = { width: "100%" };
                          const style = rule ? { ...getBoardFieldCellStyle(field), backgroundColor: rule.color, color: rule.textColor || "inherit", borderRadius: "0.75rem", padding: "0.45rem 0.6rem", display: "inline-flex" } : getBoardFieldCellStyle(field);
                          const isBoardActivityListField = field.type === "select" && field.optionSource === "catalogByCategory";
                          const options = buildSelectOptions(field, state);

                          if (field.type === "inventoryLookup") {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <InventoryLookupInput
                                  inventoryItems={state.inventoryItems || []}
                                  value={row.values?.[field.id] || ""}
                                  onChange={(nextValue) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, nextValue)}
                                  placeholder={field.placeholder || "Buscar por código o nombre"}
                                  style={controlStyle}
                                  title={field.helpText || field.label}
                                  disabled={!rowFieldEditable}
                                />
                              </td>
                            );
                          }

                          if (isBoardActivityListField) {
                            return <td key={field.id} style={columnStyle}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Actividad"} style={rule ? { ...controlStyle, backgroundColor: rule.color, color: rule.textColor || "inherit" } : controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "select") {
                            const groupedOptions = options.reduce((accumulator, option) => {
                              const groupName = option.group || "Opciones";
                              if (!accumulator[groupName]) accumulator[groupName] = [];
                              accumulator[groupName].push(option);
                              return accumulator;
                            }, {});
                            return (
                              <td key={field.id} style={columnStyle}>
                                <select value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable}>
                                  <option value="">Seleccionar...</option>
                                  {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                                    <optgroup key={groupName} label={groupName}>
                                      {groupOptions.map((option) => <option key={`${groupName}-${option.value}`} value={option.value}>{option.label}</option>)}
                                    </optgroup>
                                  ))}
                                </select>
                              </td>
                            );
                          }

                          if (["number", "currency", "percentage"].includes(field.type)) {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <input
                                  type="number"
                                  value={row.values?.[field.id] ?? ""}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;
                                    updateBoardRowValue(selectedCustomBoard.id, row.id, field, rawValue === "" ? "" : Number(rawValue));
                                  }}
                                  placeholder={field.placeholder || "Escribe un valor"}
                                  style={controlStyle}
                                  title={field.helpText || field.label}
                                  disabled={!rowFieldEditable}
                                />
                              </td>
                            );
                          }

                          if (field.type === "textarea") {
                            return <td key={field.id} style={columnStyle}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Escribe una nota"} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "date") {
                            return <td key={field.id} style={columnStyle}><input type="date" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "time") {
                            const rawTimeValue = String(row.values?.[field.id] || "");
                            return (
                              <td key={field.id} style={columnStyle}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={normalizeTimeInput24h(rawTimeValue, false)}
                                  onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, normalizeTimeInput24h(event.target.value, false))}
                                  onBlur={(event) => {
                                    const normalizedValue = normalizeTimeInput24h(event.target.value, true);
                                    if (normalizedValue && normalizedValue !== rawTimeValue) {
                                      updateBoardRowValue(selectedCustomBoard.id, row.id, field, normalizedValue);
                                    }
                                  }}
                                  placeholder={field.placeholder || "HH:mm"}
                                  style={controlStyle}
                                  title={field.helpText || field.label}
                                  disabled={!rowFieldEditable}
                                />
                              </td>
                            );
                          }

                          if (field.type === "email") {
                            return <td key={field.id} style={columnStyle}><input type="email" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "nombre@empresa.com"} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "phone") {
                            return <td key={field.id} style={columnStyle}><input type="tel" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Ej: 5512345678"} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "url") {
                            return <td key={field.id} style={columnStyle}><input type="url" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "https://..."} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                          }

                          if (field.type === "boolean") {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <select value={row.values?.[field.id] || "No"} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable}>
                                  <option value="Si">Sí</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "status") {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <select value={row.values?.[field.id] || STATUS_PENDING} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable}>
                                  <option value={STATUS_PENDING}>{STATUS_PENDING}</option>
                                  <option value={STATUS_RUNNING}>{STATUS_RUNNING}</option>
                                  <option value={STATUS_PAUSED}>{STATUS_PAUSED}</option>
                                  <option value={STATUS_FINISHED}>{STATUS_FINISHED}</option>
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "user") {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <select value={row.values?.[field.id] || row.responsibleId || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable}>
                                  <option value="">Seleccionar player...</option>
                                  {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "rating") {
                            const ratingVal = Math.min(5, Math.max(0, Number(row.values?.[field.id] || 0)));
                            return (
                              <td key={field.id} style={columnStyle}>
                                <div style={{ display: "flex", gap: "2px" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => rowFieldEditable && updateBoardRowValue(selectedCustomBoard.id, row.id, field, star)}
                                      style={{ background: "none", border: "none", cursor: rowFieldEditable ? "pointer" : "default", fontSize: "16px", padding: "0", color: star <= ratingVal ? "#f59e0b" : "#d1d5db" }}
                                      disabled={!rowFieldEditable}
                                      aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
                                    >★</button>
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          if (field.type === "progress") {
                            const rawProgressValue = row.values?.[field.id];
                            const hasProgressValue = rawProgressValue !== "" && rawProgressValue !== null && rawProgressValue !== undefined;
                            const progVal = hasProgressValue ? Math.min(100, Math.max(0, Number(rawProgressValue))) : 0;
                            const progressInputValue = hasProgressValue ? progVal : "";
                            const progColor = progVal >= 80 ? "#16a34a" : progVal >= 50 ? "#d97706" : "#dc2626";
                            return (
                              <td key={field.id} style={columnStyle}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden" }}>
                                    <div style={{ width: `${progVal}%`, height: "100%", background: progColor, borderRadius: "999px", transition: "width 0.2s" }} />
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={progressInputValue}
                                    onChange={(event) => {
                                      if (!rowFieldEditable) return;
                                      const rawValue = event.target.value;
                                      if (rawValue === "") {
                                        updateBoardRowValue(selectedCustomBoard.id, row.id, field, "");
                                        return;
                                      }
                                      const numericValue = Number(rawValue);
                                      updateBoardRowValue(selectedCustomBoard.id, row.id, field, Math.min(100, Math.max(0, numericValue)));
                                    }}
                                    style={{ width: "44px", fontSize: "11px", textAlign: "right", border: "none", background: "transparent" }}
                                    disabled={!rowFieldEditable}
                                  />
                                  <span style={{ fontSize: "11px", color: "#6b7280" }}>%</span>
                                </div>
                              </td>
                            );
                          }

                          if (field.type === "counter") {
                            const counterVal = Number(row.values?.[field.id] || 0);
                            return (
                              <td key={field.id} style={columnStyle}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button type="button" onClick={() => rowFieldEditable && updateBoardRowValue(selectedCustomBoard.id, row.id, field, Math.max(0, counterVal - 1))} disabled={!rowFieldEditable || counterVal <= 0} style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                                  <span style={{ minWidth: "28px", textAlign: "center", fontWeight: 600, fontSize: "13px" }}>{counterVal}</span>
                                  <button type="button" onClick={() => rowFieldEditable && updateBoardRowValue(selectedCustomBoard.id, row.id, field, counterVal + 1)} disabled={!rowFieldEditable} style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                                </div>
                              </td>
                            );
                          }

                          if (field.type === "tags") {
                            return (
                              <td key={field.id} style={columnStyle}>
                                <input
                                  value={row.values?.[field.id] || ""}
                                  onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)}
                                  placeholder={field.placeholder || "tag1, tag2, tag3"}
                                  style={controlStyle}
                                  title={field.helpText || field.label}
                                  disabled={!rowFieldEditable}
                                />
                              </td>
                            );
                          }

                          if (field.type === "formula" || field.type === "inventoryProperty") {
                            return <td key={field.id} style={columnStyle}><span style={style}>{String(value || 0)}</span></td>;
                          }

                          return <td key={field.id} style={columnStyle}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Captura un valor"} style={rule ? { ...controlStyle, backgroundColor: rule.color, color: rule.textColor || "inherit" } : controlStyle} title={field.helpText || field.label} disabled={!rowFieldEditable} /></td>;
                        })}
                      </tr>
                    );
                  })}
                  {!(boardView?.rows || []).length ? (
                    <tr>
                      <td colSpan={visibleBoardColumns.length || 1}>
                        <span className="subtle-line">{isHistoricalCustomBoardView ? "No hubo filas registradas en esa semana para este tablero." : "Este tablero aún no tiene filas."}</span>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : (
        <article className="surface-card empty-state">
          <LayoutDashboard size={44} />
          <h3>No tienes tableros asignados</h3>
          <p>{currentUser.role === ROLE_JR ? "Tu líder aún no te asigna un tablero." : "Crea un tablero desde Creador de tableros para comenzar."}</p>
        </article>
      )}
    </section>
  );
}
