import React, { useState, useEffect, useCallback } from "react";
import { adminApi, type AdminUser, type UserRole } from "../api";

// ── Helpers ────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  Requester:     { bg: "#E8F5EF", color: "#2D7A5B" },
  IT_Staff:      { bg: "#EAF4FE", color: "#1A6FAC" },
  Administrator: { bg: "#F3E8FE", color: "#7C3AED" },
};

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_BADGE[role];
  return (
    <span style={{ ...styles.badge, background: c.bg, color: c.color }}>
      {role === "IT_Staff" ? "IT Staff" : role}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Modal ──────────────────────────────────────────────────────────────

interface CreateEditModalProps {
  user: AdminUser | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}

function CreateEditModal({ user, onClose, onSaved }: CreateEditModalProps) {
  const isEdit = user != null;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "Requester");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await adminApi.updateUser(user!.id, { name, email, role });
      } else {
        await adminApi.createUser({ name, email, role, password });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEdit ? "Edit User" : "Create New User"}</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              placeholder="Alice Smith"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="alice@example.com"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={styles.select}
            >
              <option value="Requester">Requester</option>
              <option value="IT_Staff">IT Staff</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          {!isEdit && (
            <div style={styles.field}>
              <label style={styles.label}>Initial Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Temp password…"
              />
              <p style={styles.hint}>User will be required to change this on first login.</p>
            </div>
          )}

          {error && (
            <div style={styles.errorCallout}>⚠️ {error}</div>
          )}

          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Deactivate Modal ────────────────────────────────────────────

interface ConfirmToggleModalProps {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

function ConfirmToggleModal({ user, onClose, onSaved }: ConfirmToggleModalProps) {
  const isActive = user.isActive;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await adminApi.toggleActive(user.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {isActive ? "Deactivate User" : "Activate User"}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={{ margin: "1rem 0", color: "#1A2E26", fontSize: "0.9rem" }}>
          {isActive
            ? `Are you sure you want to deactivate ${user.name}? They will no longer be able to log in.`
            : `Are you sure you want to activate ${user.name}? They will be able to log in again.`}
        </p>

        {error && (
          <div style={{ ...styles.errorCallout, marginBottom: "1rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            style={{
              ...styles.primaryBtn,
              background: isActive ? "#C0392B" : "#2D7A5B",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Processing…"
              : isActive
              ? "Confirm Deactivate"
              : "Confirm Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password Modal ────────────────────────────────────────────────

interface ResetPasswordModalProps {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

function ResetPasswordModal({ user, onClose, onSaved }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi.resetPassword(user.id, newPassword);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Reset Password</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={{ margin: "0.5rem 0 1rem", color: "#6B7C74", fontSize: "0.875rem" }}>
          Set a temporary password for <strong>{user.name}</strong>. They will be required to change it on next login.
        </p>
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.field}>
            <label style={styles.label}>New Temporary Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Min 8 chars…"
            />
          </div>
          {error && <div style={styles.errorCallout}>⚠️ {error}</div>}
          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              style={{ ...styles.primaryBtn, background: "#D4A017", opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main AdminUsersPage ──────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [createEditUser, setCreateEditUser] = useState<AdminUser | null | false>(false); // false = closed
  const [toggleUser, setToggleUser] = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async () => {
    if (!toggleUser) return;
    setToggleLoading(true);
    try {
      await adminApi.toggleActive(toggleUser.id);
      setToggleUser(null);
      await fetchUsers();
    } catch {
      // ignore
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Modals */}
      {createEditUser !== false && (
        <CreateEditModal
          user={createEditUser}
          onClose={() => setCreateEditUser(false)}
          onSaved={() => { setCreateEditUser(false); fetchUsers(); }}
        />
      )}
      {toggleUser && (
        <ConfirmToggleModal
          user={toggleUser}
          onClose={() => setToggleUser(null)}
          onSaved={() => { setToggleUser(null); fetchUsers(); }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSaved={() => { setResetUser(null); fetchUsers(); }}
        />
      )}

      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>User Management</h1>
          <p style={styles.subtitle}>{total} user{total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          id="create-user-btn"
          style={styles.createBtn}
          onClick={() => setCreateEditUser(null)}
        >
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={styles.searchInput}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={styles.select}
          >
            <option value="">All Roles</option>
            <option value="Requester">Requester</option>
            <option value="IT_Staff">IT Staff</option>
            <option value="Administrator">Administrator</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={styles.select}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && <div style={styles.errorCallout}>⚠️ {error}</div>}

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Name", "Email", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={styles.centerCell}>
                    <div style={styles.loadingRow}>
                      <span style={styles.spinner} />
                      <span style={{ color: "#6B7C74" }}>Loading users…</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.centerCell}>
                    <p>👤 No users found.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={styles.row}>
                    <td style={styles.td}>
                      <span style={styles.userName}>{u.name}</span>
                      {u.mustChangePassword && (
                        <span style={styles.mustChangeBadge} title="Must change password">🔑</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: "#6B7C74" }}>{u.email}</td>
                    <td style={styles.td}><RoleBadge role={u.role} /></td>
                    <td style={styles.td}>
                      {u.isActive ? (
                        <span style={styles.activeStatus}>✅ Active</span>
                      ) : (
                        <span style={styles.inactiveStatus}>⛔ Inactive</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: "#6B7C74", fontSize: "0.8rem" }}>
                      {formatDate(u.lastLoginAt)}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          style={styles.editBtn}
                          onClick={() => setCreateEditUser(u)}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.resetBtn}
                          onClick={() => setResetUser(u)}
                        >
                          Reset PW
                        </button>
                        <button
                          style={{
                            ...styles.toggleBtn,
                            background: u.isActive ? "#FDEDEC" : "#E8F5EF",
                            color: u.isActive ? "#C0392B" : "#2D7A5B",
                          }}
                          onClick={() => setToggleUser(u)}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              style={{ ...styles.pageBtn, opacity: page <= 1 ? 0.4 : 1 }}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              style={{ ...styles.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "2rem 1.25rem",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#1A2E26",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#6B7C74",
    margin: "0.25rem 0 0",
  },
  createBtn: {
    background: "linear-gradient(135deg, #2D7A5B 0%, #1F5C42 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0.65rem 1.25rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(45,122,91,0.25)",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  filtersCard: {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D0DED8",
    padding: "1rem 1.25rem",
    marginBottom: "1rem",
    boxShadow: "0 1px 6px rgba(45,122,91,0.05)",
  },
  filterRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
    alignItems: "center",
  },
  searchWrapper: {
    position: "relative",
    flex: "1 1 200px",
  },
  searchIcon: {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.9rem",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    paddingLeft: "2.25rem",
    paddingRight: "0.75rem",
    paddingTop: "0.55rem",
    paddingBottom: "0.55rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 8,
    fontSize: "0.875rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    boxSizing: "border-box",
  },
  select: {
    padding: "0.55rem 0.75rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 8,
    fontSize: "0.875rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  errorCallout: {
    background: "#FDEDEC",
    border: "1px solid #C0392B",
    color: "#C0392B",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  tableCard: {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D0DED8",
    boxShadow: "0 1px 6px rgba(45,122,91,0.05)",
    overflow: "hidden",
  },
  tableWrapper: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.875rem" },
  th: {
    padding: "0.875rem 1rem",
    textAlign: "left" as const,
    fontWeight: 600,
    fontSize: "0.75rem",
    color: "#6B7C74",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    borderBottom: "1px solid #D0DED8",
    background: "#F4F7F5",
    whiteSpace: "nowrap" as const,
  },
  row: {},
  td: {
    padding: "0.875rem 1rem",
    borderBottom: "1px solid #EEF2F0",
    color: "#1A2E26",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.65rem",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  userName: { fontWeight: 600 },
  mustChangeBadge: {
    marginLeft: "0.4rem",
    fontSize: "0.8rem",
    cursor: "help",
  },
  activeStatus: { fontSize: "0.8rem", color: "#2D7A5B", fontWeight: 600 },
  inactiveStatus: { fontSize: "0.8rem", color: "#C0392B", fontWeight: 600 },
  actionRow: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap" as const,
  },
  editBtn: {
    background: "#EAF4FE",
    color: "#1A6FAC",
    border: "none",
    borderRadius: 7,
    padding: "0.3rem 0.65rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  resetBtn: {
    background: "#FEF9E7",
    color: "#D4A017",
    border: "none",
    borderRadius: 7,
    padding: "0.3rem 0.65rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  toggleBtn: {
    border: "none",
    borderRadius: 7,
    padding: "0.3rem 0.65rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  centerCell: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "#6B7C74",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid #D0DED8",
    borderTopColor: "#2D7A5B",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    padding: "1rem",
    borderTop: "1px solid #EEF2F0",
    flexWrap: "wrap" as const,
  },
  pageBtn: {
    padding: "0.4rem 0.7rem",
    border: "1px solid #D0DED8",
    borderRadius: 8,
    background: "#fff",
    color: "#1A2E26",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  pageBtnActive: {
    background: "#2D7A5B",
    color: "#fff",
    borderColor: "#2D7A5B",
    fontWeight: 600,
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    padding: "1.75rem",
    width: "100%",
    maxWidth: 500,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1A2E26",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    color: "#6B7C74",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6B7C74",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  input: {
    padding: "0.65rem 0.9rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 8,
    fontSize: "0.9rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  hint: {
    margin: "0.2rem 0 0",
    fontSize: "0.75rem",
    color: "#6B7C74",
    fontStyle: "italic",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  cancelBtn: {
    background: "none",
    border: "1px solid #D0DED8",
    borderRadius: 8,
    padding: "0.55rem 1rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: "#6B7C74",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #2D7A5B 0%, #1F5C42 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "0.55rem 1.25rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
};
