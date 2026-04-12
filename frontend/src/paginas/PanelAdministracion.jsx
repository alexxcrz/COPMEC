export default function PanelAdministracion({ contexto }) {
  const {
    state,
    adminReportRows,
    StatTile,
    adminTab,
    setAdminTab,
    actionPermissions,
    openCatalogCreate,
    Plus,
    openCatalogEdit,
    Pencil,
    softDeleteCatalog,
    Trash2,
    catalogWeekGroups,
    getActivityFrequencyLabel,
    weeklyAreaCoverageRows,
    formatDate,
    setEditWeekId,
    openCreateBoardBuilder,
    editableVisibleBoards,
    filteredBoardTemplates,
    openEditBoardBuilder,
    PERMISSION_PRESETS,
    applyPermissionPreset,
    Settings,
    permissionFileInputRef,
    handlePermissionImport,
    exportPermissionRules,
    Download,
    Upload,
    permissionsFeedback,
    USER_ROLES,
    NAV_ITEMS,
    normalizedPermissions,
    togglePermissionRole,
    ACTION_DEFINITIONS,
    departmentOptions,
    updatePermissionEntry,
    activeAssignableUsers,
    selectedPermissionBoard,
    setSelectedPermissionBoardId,
    updateBoardAssignment,
    userMap,
    filteredAuditLog,
    auditFilters,
    setAuditFilters,
    formatDateTime,
    securityEvents,
    securityEventsStatus,
  } = contexto;

  return (
    <section className="admin-page-layout">
      <article className="admin-hero-card">
        <div>
          <h3>Constructor</h3>
          <p>Gestión central del catálogo, semanas, reportes y control operativo.</p>
        </div>
        <span className="chip success">Modo administrador</span>
      </article>

      <div className="admin-stat-strip">
        <StatTile label="Actividades activas" value={state.catalog.filter((item) => !item.isDeleted).length} />
        <StatTile label="Semanas registradas" value={state.weeks.length} tone="soft" />
        <StatTile label="Excesos detectados" value={adminReportRows.reduce((sum, row) => sum + row.excessCount, 0)} tone="danger" />
        <StatTile label="Tableros operativos" value={state.controlBoards.length} tone="success" />
      </div>

      <article className="surface-card admin-tabs full-width admin-tabs-shell">
        <div className="tab-strip">
          <button type="button" className={adminTab === "catalog" ? "tab active" : "tab"} onClick={() => setAdminTab("catalog")}>Catálogo de actividades</button>
          <button type="button" className={adminTab === "weeks" ? "tab active" : "tab"} onClick={() => setAdminTab("weeks")}>Gestión de semanas</button>
        </div>
      </article>

      <article className="surface-card board-builder-launch-card full-width admin-surface-card">
        <div className="card-header-row">
          <div>
            <h3>Constructor de tableros</h3>
            <p>El acceso para crear o editar tableros sigue aquí, solo sin una pestaña extra.</p>
          </div>
          <button type="button" className="primary-button" onClick={openCreateBoardBuilder} disabled={!actionPermissions.saveBoard}>
            <Plus size={16} /> Nuevo tablero
          </button>
        </div>
        <div className="saved-board-list">
          <span className="chip primary">Editables por ti: {editableVisibleBoards.length}</span>
          <span className="chip">Plantillas visibles: {filteredBoardTemplates.length}</span>
        </div>
        <div className="saved-board-list board-builder-launch-list">
          {editableVisibleBoards.slice(0, 8).map((board) => (
            <button key={board.id} type="button" className="icon-button" onClick={() => openEditBoardBuilder(board)}>
              <Pencil size={14} /> {board.name}
            </button>
          ))}
          {!editableVisibleBoards.length ? <span className="subtle-line">No tienes tableros editables en este momento.</span> : null}
        </div>
      </article>

      {adminTab === "catalog" ? (
        <article className="surface-card full-width table-card admin-surface-card">
          <div className="card-header-row">
            <div>
              <h3>Catálogo maestro de actividades</h3>
              <p>Actividades reutilizables para semanas nuevas y reportes.</p>
            </div>
            <button type="button" className="primary-button" onClick={openCatalogCreate} disabled={!actionPermissions.manageCatalog}>
              <Plus size={16} /> Agregar actividad
            </button>
          </div>
          <div className="table-wrap">
            <table className="admin-table-clean">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Frecuencia</th>
                  <th>Tiempo límite</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.catalog.filter((item) => !item.isDeleted).map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{getActivityFrequencyLabel(item.frequency)}</td>
                    <td>{item.timeLimitMinutes} min</td>
                    <td>{item.isMandatory ? "Obligatoria" : "Ocasional"}</td>
                    <td><span className="chip success">Activa</span></td>
                    <td>
                      <div className="row-actions compact">
                        <button type="button" className="icon-button" onClick={() => openCatalogEdit(item)} disabled={!actionPermissions.manageCatalog}><Pencil size={15} /> Editar</button>
                        <button type="button" className="icon-button danger" onClick={() => softDeleteCatalog(item.id)} disabled={!actionPermissions.manageCatalog}><Trash2 size={15} /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {adminTab === "weeks" ? (
        <>
          <article className="surface-card full-width table-card admin-surface-card">
            <div className="card-header-row">
              <div>
                <h3>Gestión de semanas</h3>
                <p>Controla por semana lo que sale del catálogo y revisa cómo queda distribuido por área.</p>
              </div>
            </div>
            <div className="saved-board-list permissions-preset-list">
              {catalogWeekGroups.map((group) => (
                <article key={group.key} className="surface-card" style={{ minWidth: "280px", flex: "1 1 320px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{group.label}</h3>
                      <p>{group.description}</p>
                    </div>
                    <span className="chip primary">{group.items.length}</span>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {group.items.map((item) => (
                      <span key={item.id} className="chip">{item.name} · {getActivityFrequencyLabel(item.frequency)} · {item.timeLimitMinutes} min</span>
                    ))}
                    {!group.items.length ? <span className="subtle-line">Sin actividades en esta categoría.</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card">
            <div className="card-header-row">
              <div>
                <h3>Semanas operativas</h3>
                <p>Abre cada semana para agregar actividades del catálogo y verificar su cobertura por área.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="admin-table-clean">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Fechas</th>
                    <th>Actividades</th>
                    <th>Áreas cubiertas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyAreaCoverageRows.map((week) => (
                    <tr key={week.id}>
                      <td>{week.name}</td>
                      <td>{formatDate(week.startDate)} - {formatDate(week.endDate)}</td>
                      <td>{state.activities.filter((activity) => activity.weekId === week.id).length} actividades</td>
                      <td>
                        <div className="saved-board-list board-builder-launch-list">
                          {week.areas.slice(0, 4).map((entry) => <span key={`${week.id}-${entry.area}`} className="chip">{entry.area} · {entry.total}</span>)}
                          {!week.areas.length ? <span className="subtle-line">Sin asignación por área</span> : null}
                        </div>
                      </td>
                      <td><span className={week.isActive ? "chip success" : "chip"}>{week.isActive ? "Activa" : "Cerrada"}</span></td>
                      <td>
                        <button type="button" className="icon-button" onClick={() => setEditWeekId(week.id)} disabled={!actionPermissions.manageWeeks}>
                          <Pencil size={15} /> Editar semana
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}

      {adminTab === "__legacy_permissions__" && actionPermissions.managePermissions ? (
        <>
          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Presets rápidos</h3>
                <p>Aplica una base completa y luego afina usuarios o departamentos si lo necesitas.</p>
              </div>
            </div>
            <div className="saved-board-list permissions-preset-list">
              {PERMISSION_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className="icon-button" onClick={() => applyPermissionPreset(preset.id)}>
                  <Settings size={15} /> {preset.label}
                </button>
              ))}
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Respaldo de reglas</h3>
                <p>Exporta permisos globales y por tablero para moverlos o restaurarlos cuando lo necesites.</p>
              </div>
              <div className="toolbar-actions">
                <input ref={permissionFileInputRef} type="file" accept="application/json,.json" className="inventory-file-input" onChange={handlePermissionImport} />
                <button type="button" className="icon-button" onClick={exportPermissionRules}>
                  <Download size={15} /> Exportar JSON
                </button>
                <button type="button" className="icon-button" onClick={() => permissionFileInputRef.current?.click()}>
                  <Upload size={15} /> Importar JSON
                </button>
              </div>
            </div>
            {permissionsFeedback.message ? <p className={permissionsFeedback.tone === "danger" ? "validation-text" : "inline-success-message"}>{permissionsFeedback.message}</p> : null}
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Matriz rápida por rol</h3>
                <p>Activa o desactiva acceso por rol sin entrar al detalle fino de usuarios o departamentos.</p>
              </div>
            </div>
            <div className="table-wrap permissions-matrix-wrap">
              <table className="admin-table-clean permissions-matrix-table">
                <thead>
                  <tr>
                    <th>Pestaña</th>
                    {USER_ROLES.map((role) => <th key={role}>{role}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {NAV_ITEMS.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.label}</strong></td>
                      {USER_ROLES.map((role) => (
                        <td key={role}>
                          <input type="checkbox" checked={(normalizedPermissions.pages[item.id]?.roles || []).includes(role)} onChange={() => togglePermissionRole("pages", item.id, role)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-wrap permissions-matrix-wrap">
              <table className="admin-table-clean permissions-matrix-table">
                <thead>
                  <tr>
                    <th>Acción</th>
                    {USER_ROLES.map((role) => <th key={role}>{role}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ACTION_DEFINITIONS.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.label}</strong>
                        <span className="subtle-line">{item.category}</span>
                      </td>
                      {USER_ROLES.map((role) => (
                        <td key={role}>
                          <input type="checkbox" checked={(normalizedPermissions.actions[item.id]?.roles || []).includes(role)} onChange={() => togglePermissionRole("actions", item.id, role)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Ajustes finos por pestaña</h3>
                <p>Define quién puede ver cada área usando roles, players específicos o áreas completas.</p>
              </div>
            </div>
            <div className="permissions-grid">
              {NAV_ITEMS.map((item) => (
                <article key={item.id} className="permission-entry-card">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.id}</p>
                  </div>
                  <label className="app-modal-field">
                    <span>Roles</span>
                    <select multiple value={normalizedPermissions.pages[item.id]?.roles || []} onChange={(event) => updatePermissionEntry("pages", item.id, "roles", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field">
                    <span>Players</span>
                    <select multiple value={normalizedPermissions.pages[item.id]?.userIds || []} onChange={(event) => updatePermissionEntry("pages", item.id, "userIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {state.users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field">
                    <span>Áreas</span>
                    <select multiple value={normalizedPermissions.pages[item.id]?.departments || []} onChange={(event) => updatePermissionEntry("pages", item.id, "departments", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Ajustes finos por acción</h3>
                <p>Controla qué acciones puede ejecutar cada player sin depender sólo del rol.</p>
              </div>
            </div>
            <div className="permissions-grid">
              {ACTION_DEFINITIONS.map((item) => (
                <article key={item.id} className="permission-entry-card">
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.category}</p>
                  </div>
                  <label className="app-modal-field">
                    <span>Roles</span>
                    <select multiple value={normalizedPermissions.actions[item.id]?.roles || []} onChange={(event) => updatePermissionEntry("actions", item.id, "roles", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field">
                    <span>Players</span>
                    <select multiple value={normalizedPermissions.actions[item.id]?.userIds || []} onChange={(event) => updatePermissionEntry("actions", item.id, "userIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {state.users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field">
                    <span>Áreas</span>
                    <select multiple value={normalizedPermissions.actions[item.id]?.departments || []} onChange={(event) => updatePermissionEntry("actions", item.id, "departments", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                      {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Asignación por tablero</h3>
                <p>Selecciona qué players quedan asignados. Los players asignados pueden hacer todo dentro de ese tablero.</p>
              </div>
              {selectedPermissionBoard ? <span className="chip primary">{1 + (selectedPermissionBoard.accessUserIds || []).length} persona(s) con control</span> : null}
            </div>
            {selectedPermissionBoard ? (
              <div className="permissions-board-shell">
                <div className="builder-template-toolbar permissions-board-toolbar">
                  <label className="app-modal-field builder-card">
                    <span>Tablero</span>
                    <select value={selectedPermissionBoard.id} onChange={(event) => setSelectedPermissionBoardId(event.target.value)}>
                      {(state.controlBoards || []).map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                    </select>
                  </label>
                  <label className="app-modal-field builder-card permissions-toggle-card">
                    <span>Player principal</span>
                    <select value={selectedPermissionBoard.ownerId || ""} onChange={(event) => updateBoardAssignment(selectedPermissionBoard.id, "ownerId", event.target.value)}>
                      {activeAssignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="permissions-grid">
                  <article className="permission-entry-card">
                    <div>
                      <strong>Personas asignadas</strong>
                      <p>Quien aparezca aquí podrá ver, capturar, editar, exportar y mover el flujo de este tablero.</p>
                    </div>
                    <label className="app-modal-field">
                      <span>Players con acceso total</span>
                      <select multiple value={selectedPermissionBoard.accessUserIds || []} onChange={(event) => updateBoardAssignment(selectedPermissionBoard.id, "accessUserIds", Array.from(event.target.selectedOptions).map((option) => option.value))}>
                        {activeAssignableUsers.filter((user) => user.id !== selectedPermissionBoard.ownerId).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                      </select>
                    </label>
                    <div className="saved-board-list">
                      <span className="chip primary">Player principal: {userMap.get(selectedPermissionBoard.ownerId)?.name || "Sin player"}</span>
                      {(selectedPermissionBoard.accessUserIds || []).map((userId) => <span key={userId} className="chip success">Acceso total: {userMap.get(userId)?.name || "N/A"}</span>)}
                    </div>
                  </article>
                </div>
              </div>
            ) : (
              <p className="inline-message">Aún no hay tableros guardados para asignar personas.</p>
            )}
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Auditoría reciente</h3>
                <p>Revisa quién cambió permisos o plantillas y en qué momento lo hizo.</p>
              </div>
              <span className="chip primary">{filteredAuditLog.length} de {(state.auditLog || []).length} eventos</span>
            </div>
            <div className="builder-template-toolbar permissions-audit-toolbar">
              <label className="app-modal-field builder-card">
                <span>Usuario</span>
                <select value={auditFilters.userId} onChange={(event) => setAuditFilters((current) => ({ ...current, userId: event.target.value }))}>
                  <option value="all">Todos</option>
                  {state.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </label>
              <label className="app-modal-field builder-card">
                <span>Ámbito</span>
                <select value={auditFilters.scope} onChange={(event) => setAuditFilters((current) => ({ ...current, scope: event.target.value }))}>
                  <option value="all">Todos</option>
                  {Array.from(new Set((state.auditLog || []).map((entry) => entry.scope).filter(Boolean))).map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                </select>
              </label>
              <label className="app-modal-field builder-card">
                <span>Periodo</span>
                <select value={auditFilters.period} onChange={(event) => setAuditFilters((current) => ({ ...current, period: event.target.value }))}>
                  <option value="all">Todo el historial</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                </select>
              </label>
              <label className="app-modal-field builder-card builder-card-wide">
                <span>Buscar detalle</span>
                <input value={auditFilters.search} onChange={(event) => setAuditFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Usuario, acción o detalle" />
              </label>
            </div>
            <div className="table-wrap permissions-matrix-wrap">
              <table className="admin-table-clean permissions-matrix-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Ámbito</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLog.slice(0, 40).map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{entry.userName || userMap.get(entry.userId)?.name || "Sistema"}</td>
                      <td><span className="chip">{entry.scope}</span></td>
                      <td>{entry.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="surface-card full-width table-card admin-surface-card permissions-card">
            <div className="card-header-row">
              <div>
                <h3>Eventos de seguridad</h3>
                <p>Registro técnico de autenticación, accesos bloqueados y operaciones sensibles del backend.</p>
              </div>
              <span className="chip primary">{securityEvents.length} eventos</span>
            </div>
            {securityEventsStatus === "loading" ? <p className="inline-message">Cargando eventos de seguridad...</p> : null}
            {securityEventsStatus === "error" ? <p className="validation-text">No se pudieron cargar los eventos de seguridad.</p> : null}
            {securityEvents.length ? (
              <div className="table-wrap permissions-matrix-wrap">
                <table className="admin-table-clean permissions-matrix-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Evento</th>
                      <th>Usuario</th>
                      <th>Ruta</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.slice(0, 60).map((entry, index) => (
                      <tr key={`${entry.timestamp || "evt"}-${entry.eventType || index}-${index}`}>
                        <td>{entry.timestamp ? formatDateTime(entry.timestamp) : "N/A"}</td>
                        <td><span className="chip">{entry.eventType || "evento"}</span></td>
                        <td>{entry.userId ? userMap.get(entry.userId)?.name || entry.userId : entry.authType || "anónimo"}</td>
                        <td>{entry.method || ""} {entry.path || ""}</td>
                        <td>{Object.entries(entry.details || {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || entry.origin || entry.ip || "Sin detalle"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : securityEventsStatus === "ready" ? <p className="inline-message">Aún no hay eventos de seguridad registrados.</p> : null}
          </article>
        </>
      ) : null}
    </section>
  );
}
