import { Modal } from "../components/Modal.jsx";

export default function GestionUsuarios({ contexto }) {
  const {
    creatableRoles,
    allRoles,
    customRoles,
    openCreateUser,
    actionPermissions,
    Plus,
    userStats,
    StatTile,
    filteredUsers,
    userSearch,
    setUserSearch,
    Search,
    userRoleFilter,
    setUserRoleFilter,
    USER_ROLES,
    usersViewTab,
    setUsersViewTab,
    getUserJobTitle,
    getUserArea,
    getRoleBadgeClass,
    userMap,
    toggleUserActive,
    openEditUser,
    setDeleteUserId,
    transferLeadTargetId,
    setTransferLeadTargetId,
    transferLead,
    BOOTSTRAP_MASTER_ID,
    usersByAreaGroups,
    boardAssignmentsByUser,
    usersCreatedByMap,
    usersByCreatorGroups,
    currentUser,
    Pencil,
    Trash2,
    roleModalOpen,
    roleModalName,
    setRoleModalName,
    roleModalEditId,
    roleModalError,
    roleSaving,
    openCreateRoleModal,
    openEditRoleModal,
    submitRoleModal,
    handleDeleteCustomRole,
    setRoleModalOpen,
    deleteArea,
    handleAddAreaOption,
    rootAreaOptions,
    splitAreaAndSubArea,
    ROLE_LEAD,
  } = contexto;

  return (
    <section className="users-page-layout">
      <article className="users-hero-card">
        <div>
          <h3>Players</h3>
          <p>Consulta perfiles, accesos y permisos desde un solo lugar.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {creatableRoles.length ? <button type="button" className="primary-button" onClick={openCreateUser} disabled={!actionPermissions.createUsers}><Plus size={16} /> Nuevo perfil</button> : null}
          {actionPermissions.managePermissions ? <button type="button" className="primary-button" onClick={openCreateRoleModal}><Plus size={16} /> Nuevo rol</button> : null}
        </div>
      </article>

      <section className="page-grid">
        <div className="users-stat-grid full-width">
          <StatTile label="Total de perfiles" value={userStats.total} />
          <StatTile label="Perfiles activos" value={userStats.active} tone="success" />
          <StatTile label="Roles de gestión" value={userStats.admins} tone="soft" />
          <StatTile label="Perfiles inactivos" value={userStats.inactive} tone="danger" />
        </div>

        <article className="surface-card full-width table-card users-surface-card">
          <div className="card-header-row users-card-header">
            <div className="users-card-heading">
              <h3>Perfiles disponibles</h3>
              <p>Consulta y organiza los perfiles visibles según el acceso actual.</p>
            </div>
            <div className="filter-bar inline-toolbar users-toolbar users-toolbar-inline">
              <label className="users-search-field">
                <span>Buscar</span>
                <div className="users-search-input-wrap">
                  <Search size={16} />
                  <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar perfil..." />
                </div>
              </label>
              <label>
                <span>Rol interno</span>
                <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                  <option>Todos los roles</option>
                  {(allRoles || USER_ROLES).map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
            </div>
            <span className="chip primary users-visibility-chip">{filteredUsers.length} visibles</span>
          </div>

          <div className="tab-strip">
            <button type="button" className={usersViewTab === "table" ? "tab active" : "tab"} onClick={() => setUsersViewTab("table")}>Tabla</button>
            <button type="button" className={usersViewTab === "area" ? "tab active" : "tab"} onClick={() => setUsersViewTab("area")}>Por área</button>
            <button type="button" className={usersViewTab === "creator" ? "tab active" : "tab"} onClick={() => setUsersViewTab("creator")}>Por creador</button>
          </div>

          {usersViewTab === "table" ? (
            <div className="table-wrap">
              <table className="users-table-clean">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Área</th>
                    <th>Rol interno</th>
                    <th>Referencia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <span className="avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{user.name.toUpperCase()}</strong>
                            <span className="subtle-line">Player de acceso · {user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getUserJobTitle(user) || "Sin cargo"}</td>
                      <td>{getUserArea(user) || "Sin área"}</td>
                      <td><span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span></td>
                      <td>{userMap.get(user.managerId)?.name || "Sin asignar"}</td>
                      <td>
                        <button type="button" className={user.isActive ? "user-status-toggle active" : "user-status-toggle"} onClick={() => toggleUserActive(user.id)}>
                          <span className="user-status-dot" />
                          {user.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td>
                        <div className="row-actions compact">
                          <button type="button" className="user-row-button" onClick={() => openEditUser(user)} disabled={!actionPermissions.editUsers}><Pencil size={15} /> Editar</button>
                          {currentUser?.role === "Lead" && user.role !== "Lead" ? (
                            <button type="button" className="user-row-button" onClick={() => setTransferLeadTargetId(user.id)}>Hacer Lead</button>
                          ) : null}
                          {user.createdById !== BOOTSTRAP_MASTER_ID ? <button type="button" className="user-row-button danger" onClick={() => setDeleteUserId(user.id)} disabled={!actionPermissions.deleteUsers}><Trash2 size={15} /> Eliminar</button> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {usersViewTab === "area" ? (
            <div className="saved-board-list permissions-preset-list">
              {usersByAreaGroups.map((group) => {
                const { area: rootArea, subArea } = splitAreaAndSubArea ? splitAreaAndSubArea(group.area) : { area: group.area, subArea: "" };
                const isSubArea = Boolean(subArea);
                return (
                <article key={group.area} className="surface-card" style={{ minWidth: "320px", flex: "1 1 360px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{group.area}</h3>
                      <p>{group.users.length} perfil(es) visibles en esta área.</p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span className="chip primary">{group.users.filter((user) => user.isActive).length} activos</span>
                      {currentUser?.role === ROLE_LEAD ? (
                        <>
                          {!isSubArea ? <button type="button" className="icon-button" title="Agregar subárea" onClick={() => handleAddAreaOption(group.area)}><Plus size={14} /></button> : null}
                          <button type="button" className="icon-button danger" title={isSubArea ? "Eliminar subárea" : "Eliminar área y subáreas"} onClick={() => deleteArea(group.area)}><Trash2 size={14} /></button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {group.users.map((user) => (
                      <article key={user.id} className="surface-card">
                        <div className="card-header-row">
                          <div className="user-name-cell">
                            <span className="avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                            <div>
                              <strong>{user.name}</strong>
                              <span className="subtle-line">Player de acceso · {user.email}</span>
                            </div>
                          </div>
                          <span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                        </div>
                        <div className="saved-board-list board-builder-launch-list">
                          <span className="chip">Cargo · {getUserJobTitle(user) || "Sin cargo"}</span>
                          <span className="chip">Referencia · {userMap.get(user.managerId)?.name || "Sin asignar"}</span>
                          <span className="chip">Creado por · {userMap.get(user.createdById)?.name || "Sin registro"}</span>
                          <span className="chip">Tableros · {boardAssignmentsByUser.get(user.id) || 0}</span>
                          <span className="chip">Perfiles creados · {usersCreatedByMap.get(user.id) || 0}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              );
              })}
            </div>
          ) : null}

          {usersViewTab === "creator" ? (
            <div className="saved-board-list permissions-preset-list">
              {usersByCreatorGroups.map((group) => (
                <article key={group.creatorId} className="surface-card" style={{ minWidth: "320px", flex: "1 1 360px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{group.creatorName}</h3>
                      <p>{group.creatorArea} · {group.users.length} perfil(es) creados por este player.</p>
                    </div>
                    <span className="chip primary">{group.users.filter((user) => user.isActive).length} activos</span>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {group.users.map((user) => (
                      <article key={user.id} className="surface-card">
                        <div className="card-header-row">
                          <div>
                            <strong>{user.name}</strong>
                            <p>{getUserArea(user) || "Sin área"} · {getUserJobTitle(user) || "Sin cargo"}</p>
                          </div>
                          <span className={user.isActive ? "chip success" : "chip"}>{user.isActive ? "Activo" : "Inactivo"}</span>
                        </div>
                        <div className="saved-board-list board-builder-launch-list">
                          <span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                          <span className="chip">Referencia · {userMap.get(user.managerId)?.name || "Sin asignar"}</span>
                          <span className="chip">Tableros · {boardAssignmentsByUser.get(user.id) || 0}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="users-table-footer">
            <span>Mostrando perfiles disponibles en esta vista</span>
            <span>{currentUser.role} · Acceso actual</span>
          </div>
        </article>

        {/* ── Gestión de roles personalizados ── */}
        {actionPermissions.managePermissions && customRoles.length > 0 ? (
          <article className="surface-card full-width">
            <div className="card-header-row">
              <div>
                <h3>Roles personalizados</h3>
              </div>
            </div>

            <div className="saved-board-list board-builder-launch-list" style={{ marginTop: "0.75rem" }}>
              {customRoles.map((role) => (
                <div key={role.id} className="surface-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{role.name}</strong>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                      Creado el {new Date(role.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="icon-button" title="Editar nombre" onClick={() => openEditRoleModal(role)}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="icon-button danger" title="Eliminar rol" onClick={() => handleDeleteCustomRole(role.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <Modal
        open={roleModalOpen}
        title={roleModalEditId ? "Editar rol personalizado" : "Nuevo rol personalizado"}
        confirmLabel={roleSaving ? "Guardando…" : roleModalEditId ? "Guardar cambios" : "Crear rol"}
        cancelLabel="Cancelar"
        onClose={() => setRoleModalOpen(false)}
        onConfirm={submitRoleModal}
        confirmDisabled={roleSaving || !roleModalName.trim()}
      >
        <div className="modal-form-grid">
          <label className="app-modal-field app-modal-field-full">
            <span>Nombre del rol</span>
            <input
              type="text"
              placeholder="Ej. Auditor, Coordinador regional…"
              value={roleModalName}
              onChange={(e) => setRoleModalName(e.target.value)}
              autoFocus
            />
          </label>
          {roleModalError ? <p className="validation-text app-modal-field-full">{roleModalError}</p> : null}
        </div>
      </Modal>
    </section>
  );
}
