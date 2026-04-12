export default function MisTableros({ contexto }) {
  const {
    visibleControlBoards,
    customBoardSearch,
    setCustomBoardSearch,
    selectedCustomBoard,
    filteredVisibleControlBoards,
    setSelectedCustomBoardId,
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
  } = contexto;

  return (
    <section className="admin-page-layout">
      {visibleControlBoards.length > 1 ? (
        <article className="surface-card full-width board-selector-card">
          <div className="builder-template-toolbar board-selector-toolbar">
            <label className="app-modal-field builder-card builder-card-wide">
              <span>Buscar tablero</span>
              <input value={customBoardSearch} onChange={(event) => setCustomBoardSearch(event.target.value)} placeholder="Nombre, descripción o dueño" />
            </label>
            <label className="board-top-select min-width">
              <span>Menú de tableros</span>
              <select value={selectedCustomBoard?.id || ""} onChange={(event) => setSelectedCustomBoardId(event.target.value)}>
                {filteredVisibleControlBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
              </select>
            </label>
          </div>
        </article>
      ) : null}

      {selectedCustomBoard ? (
        <>
          <div className="inventory-stat-grid custom-board-stat-grid">
            <StatTile label="Filas" value={customBoardMetrics?.totalRows || 0} className="custom-board-stat-tile" />
            <StatTile label="En curso" value={customBoardMetrics?.running || 0} tone="soft" className="custom-board-stat-tile" />
            <StatTile label="Terminadas" value={customBoardMetrics?.completed || 0} tone="success" className="custom-board-stat-tile" />
          </div>

          <article className="surface-card full-width table-card admin-surface-card">
            <div className="card-header-row">
              <div>
                <h3>{selectedCustomBoard.name}</h3>
              </div>
              <div className="toolbar-actions custom-board-toolbar-actions">
                {filteredVisibleControlBoards.length > 1 ? (
                  <label className="board-top-select min-width">
                    <span>Tablero</span>
                    <select value={selectedCustomBoard.id} onChange={(event) => setSelectedCustomBoardId(event.target.value)}>
                      {filteredVisibleControlBoards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
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
                    disabled={!selectedBoardActionPermissions.createBoardRow}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button custom-board-menu-trigger"
                    aria-label="Abrir acciones del tablero"
                    aria-expanded={customBoardActionsMenuOpen}
                    onClick={() => setCustomBoardActionsMenuOpen((current) => !current)}
                  >
                    <Menu size={16} />
                  </button>
                  {customBoardActionsMenuOpen ? (
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
              <span>Creó · {userMap.get(selectedCustomBoard.createdById)?.name || "N/A"}</span>
              <span>Player principal · {userMap.get(selectedCustomBoard.ownerId)?.name || "N/A"}</span>
              {(selectedCustomBoard.accessUserIds || []).length ? <span>Acceso · {(selectedCustomBoard.accessUserIds || []).map((userId) => userMap.get(userId)?.name || "N/A").join(", ")}</span> : null}
            </div>
            {boardRuntimeFeedback.message ? <p className={boardRuntimeFeedback.tone === "danger" ? "validation-text" : "inline-success-message"}>{boardRuntimeFeedback.message}</p> : null}
            <p className="required-legend"><span className="required-mark" aria-hidden="true">*</span> obligatorio</p>

            <div className="table-wrap">
              <table className="admin-table-clean">
                <thead>
                  {selectedCustomBoardSections.length ? (
                    <tr>
                      {selectedCustomBoardSections.map((section) => (
                        <th key={section.name} colSpan={section.span} className="board-section-header-cell" style={{ backgroundColor: section.color }}>
                          {section.name}
                        </th>
                      ))}
                      {selectedCustomBoard.settings?.showAssignee !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Player</th> : null}
                      <th className="board-section-header-cell board-section-header-static" colSpan={1}>Seguimiento</th>
                      {selectedCustomBoard.settings?.showDates !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Tiempo</th> : null}
                      {selectedCustomBoard.settings?.showWorkflow !== false ? <th className="board-section-header-cell board-section-header-static" colSpan={1}>Acciones</th> : null}
                    </tr>
                  ) : null}
                  <tr>
                    {(selectedCustomBoard.fields || []).map((field) => <th key={field.id} title={`${field.helpText || field.label}${field.required ? " · Obligatorio" : ""}`}>{renderBoardFieldLabel(field.label, field.required)}</th>)}
                    {selectedCustomBoard.settings?.showAssignee !== false ? <th>Player</th> : null}
                    <th>Estado</th>
                    {selectedCustomBoard.settings?.showDates !== false ? <th>Tiempo</th> : null}
                    {selectedCustomBoard.settings?.showWorkflow !== false ? <th>Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {(selectedCustomBoard.rows || []).map((row) => {
                    const rowCaptureEnabled = canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const rowWorkflowEnabled = canOperateBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const rowDeleteEnabled = row.status !== STATUS_FINISHED && canEditBoardRowRecord(currentUser, selectedCustomBoard, row, normalizedPermissions);
                    const isFinishedRow = row.status === STATUS_FINISHED;
                    const canStartRow = row.status === STATUS_PENDING || row.status === STATUS_PAUSED;
                    const canPauseRow = row.status === STATUS_RUNNING;
                    const canFinishRow = row.status === STATUS_RUNNING;
                    return (
                      <tr key={row.id}>
                        {(selectedCustomBoard.fields || []).map((field) => {
                          const value = getBoardFieldValue(selectedCustomBoard, row, field);
                          const rule = getFieldColorRule(field, value);
                          const style = rule ? { ...getBoardFieldCellStyle(field), backgroundColor: rule.color, color: rule.textColor || "inherit", borderRadius: "0.75rem", padding: "0.45rem 0.6rem", display: "inline-flex" } : getBoardFieldCellStyle(field);
                          const options = buildSelectOptions(field, state);

                          if (field.type === "inventoryLookup") {
                            return (
                              <td key={field.id}>
                                <InventoryLookupInput
                                  inventoryItems={state.inventoryItems || []}
                                  value={row.values?.[field.id] || ""}
                                  onChange={(nextValue) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, nextValue)}
                                  placeholder={field.placeholder || "Buscar por código o nombre"}
                                  style={getBoardFieldCellStyle(field)}
                                  title={field.helpText || field.label}
                                  disabled={!rowCaptureEnabled || isFinishedRow}
                                />
                              </td>
                            );
                          }

                          if (field.type === "select") {
                            return (
                              <td key={field.id}>
                                <select value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                  <option value="">Seleccionar...</option>
                                  {options.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "number") {
                            return <td key={field.id}><input type="number" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, Number(event.target.value || 0))} placeholder={field.placeholder || "Escribe un valor"} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                          }

                          if (field.type === "textarea") {
                            return <td key={field.id}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Escribe una nota"} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                          }

                          if (field.type === "date") {
                            return <td key={field.id}><input type="date" value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                          }

                          if (field.type === "boolean") {
                            return (
                              <td key={field.id}>
                                <select value={row.values?.[field.id] || "No"} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                  <option value="Si">Sí</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "status") {
                            return (
                              <td key={field.id}>
                                <select value={row.values?.[field.id] || STATUS_PENDING} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
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
                              <td key={field.id}>
                                <select value={row.values?.[field.id] || row.responsibleId || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} style={getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled}>
                                  <option value="">Seleccionar usuario...</option>
                                  {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                              </td>
                            );
                          }

                          if (field.type === "formula" || field.type === "inventoryProperty") {
                            return <td key={field.id}><span style={style}>{String(value || 0)}</span></td>;
                          }

                          return <td key={field.id}><input value={row.values?.[field.id] || ""} onChange={(event) => updateBoardRowValue(selectedCustomBoard.id, row.id, field, event.target.value)} placeholder={field.placeholder || "Captura un valor"} style={rule ? { ...getBoardFieldCellStyle(field), backgroundColor: rule.color, color: rule.textColor || "inherit" } : getBoardFieldCellStyle(field)} title={field.helpText || field.label} disabled={!rowCaptureEnabled} /></td>;
                        })}
                        {selectedCustomBoard.settings?.showAssignee !== false ? (
                          <td>
                            <select value={row.responsibleId || ""} onChange={(event) => {
                              if (!rowCaptureEnabled) return;
                              requestJson(`/warehouse/boards/${selectedCustomBoard.id}/rows/${row.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ responsibleId: event.target.value }),
                              }).then((remoteState) => {
                                applyRemoteWarehouseState(remoteState, setState, setLoginDirectory, skipNextSyncRef, setSyncStatus);
                              }).catch((error) => {
                                setBoardRuntimeFeedback({ tone: "danger", message: error?.message || "No se pudo actualizar el responsable de la fila." });
                              });
                            }} disabled={!rowCaptureEnabled}>
                              {visibleUsers.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                          </td>
                        ) : null}
                        <td><StatusBadge status={row.status || STATUS_PENDING} /></td>
                        {selectedCustomBoard.settings?.showDates !== false ? <td>{formatDurationClock(getElapsedSeconds(row, now))}</td> : null}
                        {selectedCustomBoard.settings?.showWorkflow !== false ? (
                          <td className="board-workflow-cell">
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
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : (
        <article className="surface-card empty-state">
          <LayoutDashboard size={44} />
          <h3>{visibleControlBoards.length ? "No se encontró un tablero con ese filtro" : "No tienes tableros asignados"}</h3>
          <p>{visibleControlBoards.length ? "Prueba con otro nombre en el buscador o limpia el filtro." : currentUser.role === ROLE_JR ? "Tu líder aún no te asigna un tablero." : "Crea un tablero desde Creador de tableros para comenzar."}</p>
        </article>
      )}
    </section>
  );
}
