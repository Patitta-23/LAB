import React, { useState, useEffect } from "react";
import { Ticket, TicketListParams, TicketStatus, Category, fetchTickets, fetchCategories, formatTicketNumber } from "../api";

interface Props {
  requesterId: number;
  onSelectTicket: (id: number) => void;
  onCreateNew: () => void;
}

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "OPEN",        label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED",    label: "Resolved" },
  { value: "CLOSED",      label: "Closed" },
];

function StatusBadge({ status }: { status: TicketStatus }) {
  const labels: Record<TicketStatus, string> = {
    OPEN: "New", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
  };
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
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

  function handleSortToggle(field: "createdAt" | "updatedAt") {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function SortIndicator({ field }: { field: "createdAt" | "updatedAt" }) {
    if (sortBy !== field) return <span style={{ opacity: 0.3 }}> ↕</span>;
    return <span> {sortOrder === "asc" ? "↑" : "↓"}</span>;
  }

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Tickets</h1>
          <p>Track and manage your IT support requests</p>
        </div>
        <button id="btn-create-ticket" className="btn btn-primary" onClick={onCreateNew}>
          + New Ticket
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="input-search-tickets"
            className="form-control"
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          id="select-status-filter"
          className="form-control filter-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value as TicketStatus | ""); setPage(1); }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          id="select-category-filter"
          className="form-control filter-select"
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error" id="tickets-error-banner">
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="td-id" style={{ width: 140 }}>Ticket #</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th
                  className={sortBy === "createdAt" ? "sort-active" : ""}
                  onClick={() => handleSortToggle("createdAt")}
                  id="th-sort-created"
                >
                  Created<SortIndicator field="createdAt" />
                </th>
                <th
                  className={sortBy === "updatedAt" ? "sort-active" : ""}
                  onClick={() => handleSortToggle("updatedAt")}
                  id="th-sort-updated"
                >
                  Updated<SortIndicator field="updatedAt" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 14, width: j === 1 ? "80%" : j === 0 ? 30 : "60%" }}
                        />
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
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    id={`ticket-row-${t.id}`}
                    onClick={() => onSelectTicket(t.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onSelectTicket(t.id)}
                  >
                    <td className="td-id" style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
                      {(t as any).ticketNumber || formatTicketNumber(t.id, t.createdAt)}
                    </td>
                    <td className="td-title">
                      <span className="td-title-text">{t.title}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                        {t.category.name}
                      </span>
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="td-date">{formatDate(t.createdAt)}</td>
                    <td className="td-date">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ padding: "var(--space-4) var(--space-5)" }}>
            <div className="pagination">
              <span className="pagination-info">
                Showing {start}–{end} of {total} tickets
              </span>
              <div className="pagination-controls">
                <button
                  id="btn-page-prev"
                  className="page-chip"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2)
                  .map((p) => (
                    <button
                      key={p}
                      id={`btn-page-${p}`}
                      className={`page-chip${p === page ? " active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  id="btn-page-next"
                  className="page-chip"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
