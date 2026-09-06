import React, { useState, useEffect } from "react";
import { Ticket, TicketListParams, TicketStatus, Category, fetchTickets, fetchCategories, formatTicketNumber } from "../api";

// ── Style constants ──────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--color-primary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
  background: "transparent",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-4)",
  verticalAlign: "middle",
};

interface Props {
  requesterId: number;
  onSelectTicket: (id: number) => void;
  onCreateNew: () => void;
}

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "",           label: "All Statuses" },
  { value: "OPEN",        label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED",    label: "Resolved" },
  { value: "CLOSED",      label: "Closed" },
];

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "New", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};

const STATUS_COLORS: Record<TicketStatus, { bg: string; color: string; border: string }> = {
  OPEN:        { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  IN_PROGRESS: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  RESOLVED:    { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  CLOSED:      { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={`badge badge-${status}`}
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function TicketListPage({ requesterId, onSelectTicket, onCreateNew }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState<TicketStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy,     setSortBy]     = useState<"createdAt" | "updatedAt">("createdAt");
  const [sortOrder,  setSortOrder]  = useState<"asc" | "desc">("desc");
  const [page,       setPage]       = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [requesterId, search, status, categoryId, sortBy, sortOrder, page]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params: TicketListParams = {
        search: search || undefined,
        status: status || undefined,
        categoryId: categoryId || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      };
      const res = await fetchTickets(requesterId, params);
      setTickets(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e.message ?? "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCategoryId("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  const hasActiveFilter = search || status || categoryId;

  function handleSortToggle(field: "createdAt" | "updatedAt") {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function SortIcon({ field }: { field: "createdAt" | "updatedAt" }) {
    if (sortBy !== field) return <span style={{ opacity: 0.3, fontSize: 10 }}>⇅</span>;
    return <span style={{ fontSize: 10, color: "var(--color-primary)" }}>{sortOrder === "asc" ? "↑" : "↓"}</span>;
  }

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>My Tickets</h1>
          <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
            View and track all of your support requests.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          {hasActiveFilter && (
            <button
              id="btn-clear-filters"
              className="btn btn-ghost"
              onClick={clearFilters}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              ↺ Clear Filters
            </button>
          )}
          <button
            id="btn-create-ticket"
            className="btn btn-primary"
            onClick={onCreateNew}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create Ticket
          </button>
        </div>
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────── */}
      <div
        className="card"
        style={{ marginBottom: "var(--space-4)", padding: "var(--space-4) var(--space-5)" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end" }}>
          {/* Search */}
          <div className="search-input-wrap" style={{ flex: "1 1 220px", minWidth: 180 }}>
            <span className="search-icon">🔍</span>
            <input
              id="input-search-tickets"
              className="form-control"
              placeholder="Search by ticket number or summary…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Category
            </label>
            <select
              id="select-category-filter"
              className="form-control filter-select"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              style={{ minWidth: 140 }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Current Status
            </label>
            <select
              id="select-status-filter"
              className="form-control filter-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value as TicketStatus | ""); setPage(1); }}
              style={{ minWidth: 140 }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error" id="tickets-error-banner">
          ⚠ {error}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                <th style={{ ...thStyle, width: 148 }}>Ticket No.</th>
                <th
                  id="th-sort-created"
                  style={{ ...thStyle, width: 150, cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortToggle("createdAt")}
                >
                  Created Date <SortIcon field="createdAt" />
                </th>
                <th style={{ ...thStyle }}>Summary</th>
                <th style={{ ...thStyle, width: 110 }}>Category</th>
                <th style={{ ...thStyle, width: 120 }}>Current Status</th>
                <th
                  id="th-sort-updated"
                  style={{ ...thStyle, width: 150, cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSortToggle("updatedAt")}
                >
                  Last Updated <SortIcon field="updatedAt" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {[140, 140, 240, 90, 110, 140].map((w, j) => (
                      <td key={j} style={tdStyle}>
                        <div className="skeleton" style={{ height: 14, width: w, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <div className="empty-title">No tickets found</div>
                      <div className="empty-desc">
                        {search || status || categoryId
                          ? "Try adjusting your filters."
                          : "You haven't submitted any tickets yet."}
                      </div>
                      {!search && !status && !categoryId && (
                        <button className="btn btn-primary" onClick={onCreateNew}>
                          Submit your first ticket
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const ticketNo = (t as any).ticketNumber || formatTicketNumber(t.id, t.createdAt);
                  return (
                    <tr
                      key={t.id}
                      id={`ticket-row-${t.id}`}
                      onClick={() => onSelectTicket(t.id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && onSelectTicket(t.id)}
                      style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer", transition: "background 0.12s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-2, #f8fafc)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {/* Ticket No. */}
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }}>
                          {ticketNo}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {formatDateTime(t.createdAt)}
                      </td>

                      {/* Summary */}
                      <td style={tdStyle}>
                        <span
                          className="td-title-text"
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            color: "var(--color-text-primary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            maxWidth: 320,
                          }}
                        >
                          {t.title}
                        </span>
                      </td>

                      {/* Category */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--color-text-secondary)",
                            background: "var(--color-surface-2, #f1f5f9)",
                            borderRadius: 6,
                            padding: "2px 8px",
                            display: "inline-block",
                          }}
                        >
                          {t.category.name}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        <StatusBadge status={t.status} />
                      </td>

                      {/* Last Updated */}
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {formatDateTime(t.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────── */}
        {!loading && total > 0 && (
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-3)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              Showing {start} to {end} of {total} tickets
            </span>
            <div className="pagination-controls" style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                id="btn-page-prev"
                className="page-chip"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ‹ Previous
              </button>
              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`ell-${i}`} style={{ padding: "0 6px", color: "var(--color-text-secondary)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    id={`btn-page-${p}`}
                    className={`page-chip${p === page ? " active" : ""}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                id="btn-page-next"
                className="page-chip"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
