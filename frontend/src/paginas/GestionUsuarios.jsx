export default function GestionUsuarios({ contexto }) {
  const {
    creatableRoles,
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
    usersByAreaGroups,
    boardAssignmentsByUser,
    usersCreatedByMap,
    usersByCreatorGroups,
    currentUser,
    Pencil,
    Trash2,
  } = contexto;

  return (
    <section className="users-page-layout">
      <article className="users-hero-card">
        <div>
          <h3>Administrador</h3>
          <p>Gestiona players, accesos y permisos directos por persona desde un solo lugar.</p>
        </div>
        {creatableRoles.length ? <button type="button" className="primary-button" onClick={openCreateUser} disabled={!actionPermissions.manageUsers}><Plus size={16} /> Crear player</button> : null}
      </article>

      <section className="page-grid">
        <div className="users-stat-grid full-width">
          <StatTile label="Total players" value={userStats.total} />
          <StatTile label="Players activos" value={userStats.active} tone="success" />
          <StatTile label="Administradores" value={userStats.admins} tone="soft" />
          <StatTile label="Inactivos" value={userStats.inactive} tone="danger" />
        </div>

        <article className="surface-card full-width table-card users-surface-card">
          <div className="card-header-row">
            <div>
              <h3>Players bajo tu control</h3>
              <p>Crea y administra únicamente los perfiles que tu rol interno puede delegar.</p>
            </div>
            <span className="chip primary">{filteredUsers.length} visibles</span>
          </div>

          <div className="filter-bar inline-toolbar users-toolbar">
            <label className="users-search-field">
              <span>Buscar</span>
              <div className="users-search-input-wrap">
                <Search size={16} />
                <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar player..." />
              </div>
            </label>
            <label>
              <span>Rol interno</span>
              <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                <option>Todos los roles</option>
                {USER_ROLES.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
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
                    <th>Reporta a</th>
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
                            <span className="subtle-line">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getUserJobTitle(user) || "Sin cargo"}</td>
                      <td>{getUserArea(user) || "Sin área"}</td>
                      <td><span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span></td>
                      <td>{userMap.get(user.managerId)?.name || "Sin líder"}</td>
                      <td>
                        <button type="button" className={user.isActive ? "user-status-toggle active" : "user-status-toggle"} onClick={() => toggleUserActive(user.id)}>
                          <span className="user-status-dot" />
                          {user.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td>
                        <div className="row-actions compact">
                          <button type="button" className="user-row-button" onClick={() => openEditUser(user)} disabled={!actionPermissions.manageUsers}><Pencil size={15} /> Editar</button>
                          <button type="button" className="user-row-button danger" onClick={() => setDeleteUserId(user.id)} disabled={!actionPermissions.deleteUsers}><Trash2 size={15} /> Eliminar</button>
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
              {usersByAreaGroups.map((group) => (
                <article key={group.area} className="surface-card" style={{ minWidth: "320px", flex: "1 1 360px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{group.area}</h3>
                      <p>{group.users.length} player(s) visibles en esta área.</p>
                    </div>
                    <span className="chip primary">{group.users.filter((user) => user.isActive).length} activos</span>
                  </div>
                  <div className="saved-board-list board-builder-launch-list">
                    {group.users.map((user) => (
                      <article key={user.id} className="surface-card">
                        <div className="card-header-row">
                          <div className="user-name-cell">
                            <span className="avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                            <div>
                              <strong>{user.name}</strong>
                              <span className="subtle-line">{user.email}</span>
                            </div>
                          </div>
                          <span className={`user-role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                        </div>
                        <div className="saved-board-list board-builder-launch-list">
                          <span className="chip">Cargo · {getUserJobTitle(user) || "Sin cargo"}</span>
                          <span className="chip">Líder · {userMap.get(user.managerId)?.name || "Sin líder"}</span>
                          <span className="chip">Creado por · {userMap.get(user.createdById)?.name || "Sin registro"}</span>
                          <span className="chip">Tableros · {boardAssignmentsByUser.get(user.id) || 0}</span>
                          <span className="chip">Asignados · {usersCreatedByMap.get(user.id) || 0}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {usersViewTab === "creator" ? (
            <div className="saved-board-list permissions-preset-list">
              {usersByCreatorGroups.map((group) => (
                <article key={group.creatorId} className="surface-card" style={{ minWidth: "320px", flex: "1 1 360px" }}>
                  <div className="card-header-row">
                    <div>
                      <h3>{group.creatorName}</h3>
                      <p>{group.creatorArea} · {group.users.length} player(s) creados bajo este responsable.</p>
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
                          <span className="chip">Reporta a · {userMap.get(user.managerId)?.name || "Sin líder"}</span>
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
            <span>Mostrando players visibles para tu jerarquía</span>
            <span>{currentUser.role} · Control delegado</span>
          </div>
        </article>
      </section>
    </section>
  );
}
