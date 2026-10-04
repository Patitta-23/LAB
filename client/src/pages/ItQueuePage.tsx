import React, { useState, useEffect, useCallback } from "react";
import { itStaffApi, type Lab3Ticket, type TicketStatus, type ItPriority } from "../api";

// ── Badge helpers per ui-spec.md §1 ─────────────────────────────────────

const STATUS_COLORS: Record<TicketStatus, { bg: string; color: string }> = {
  OPEN:        { bg: "#EAF4FE", color: "#1A6FAC" },
  IN_PROGRESS: { bg: "#FEF9E7", color: "#D4A017" },
  RESOLVED:    { bg: "#E8F5EF", color: "#2D7A5B" },
  CLOSED:      { bg: "#F2F2F2", color: "#6B7C74" },
};

const PRIORITY_COLORS: Record<ItPriority, { bg: string; color: string }> = {
  LOW:      { bg: "#E8F5EF", color: "#2D7A5B" },
  MEDIUM:   { bg: "#FEF9E7", color: "#D4A017" },
  HIGH:     { bg: "#FDEDEC", color: "#C0392B" },
  CRITICAL: { bg: "#8E1515", color: "#FFFFFF" },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_COLORS[status] ?? { bg: "#F2F2F2", color: "#6B7C74" };
  return (
    <span style={{ ...styles.badge, background: c.bg, color: c.color }}>
      {status.replace("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ItPriority | null }) {
  if (!priority) return <span style={{ color: "#6B7C74", fontSize: "0.8rem" }}>—</span>;
  const c = PRIORITY_COLORS[priority];
  return (
    <span style={{ ...styles.badge, background: c.bg, color: c.color }}>
      {priority}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}hr ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  onViewTicket: (id: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ItQueuePage({ onViewTicket }: Props) {
  const [tickets, setTickets] = useState<Lab3Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ItPriority | "">("");
  const [sortField, setSortField] = useState<"createdAt" | "updatedAt" | "priority">("updatedAt");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await itStaffApi.getTickets({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sort: sortField,
        order: "desc",
        page,
        limit: 10,
      });
      setTickets(res.tickets);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, sortField, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page on filter change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v as TicketStatus | ""); setPage(1); };
  const handlePriority = (v: string) => { setPriorityFilter(v as ItPriority | ""); setPage(1); };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Ticket Queue</h1>
          <p style={styles.subtitle}>{total} ticket{total !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              id="queue-search"
              type="search"
              placeholder="Search by ticket number or summary…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            id="queue-filter-status"
            value={statusFilter}
            onChange={(e) => handleStatus(e.target.value)}
            style={styles.select}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            id="queue-filter-priority"
            value={priorityFilter}
            onChange={(e) => handlePriority(e.target.value)}
            style={styles.select}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            id="queue-sort"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as typeof sortField)}
            style={styles.select}
          >
            <option value="updatedAt">Sort: Last Updated</option>
            <option value="createdAt">Sort: Created At</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorCallout}>⚠️ {error}</div>
      )}

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Ticket #", "Summary", "Category", "Status", "IT Priority", "Assignee", "Last Updated"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.loadingCell}>
                    <div style={styles.spinnerWrapper}>
                      <span style={styles.spinner} />
                      <span style={{ color: "#6B7C74" }}>Loading tickets…</span>
                    </div>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    <div>
                      <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>📭</p>
                      <p style={{ color: "#6B7C74" }}>No tickets found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    style={styles.row}
                    onClick={() => onViewTicket(t.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onViewTicket(t.id)}
                    aria-label={`View ticket ${t.ticketNumber}`}
                  >
                    <td style={{ ...styles.td, ...styles.ticketNo }}>
                      #{t.ticketNumber}
                    </td>
                    <td style={{ ...styles.td, maxWidth: 240 }}>
                      <span style={styles.summaryText} title={t.title}>{t.title}</span>
                    </td>
                    <td style={styles.td}>{t.category?.name ?? "—"}</td>
                    <td style={styles.td}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={styles.td}>
                      <PriorityBadge priority={t.itPriority} />
                    </td>
                    <td style={styles.td}>
                      {t.assignedStaff ? (
                        <span style={styles.assignee}>{t.assignedStaff.name}</span>
                      ) : (
                        <span style={styles.unassigned}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, ...styles.timeAgo }}>
                      {timeAgo(t.updatedAt)}
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

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} style={styles.dots}>…</span>
                ) : (
                  <button
                    key={p}
                    style={{
                      ...styles.pageBtn,
                      ...(p === page ? styles.pageBtnActive : {}),
                    }}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </button>
                )
              )}

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

// ── Styles ────────────────────────────────────────────────────────────────

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
    flex: "1 1 220px",
    minWidth: 160,
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
  tableWrapper: {
    overflowX: "auto" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.875rem",
  },
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
  row: {
    cursor: "pointer",
    transition: "background 0.1s",
    outline: "none",
  },
  td: {
    padding: "0.875rem 1rem",
    borderBottom: "1px solid #EEF2F0",
    color: "#1A2E26",
    verticalAlign: "middle",
    whiteSpace: "nowrap" as const,
  },
  ticketNo: {
    fontFamily: "monospace",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "#2D7A5B",
  },
  summaryText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
    whiteSpace: "nowrap" as const,
  },
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
  },
  assignee: {
    fontSize: "0.875rem",
    color: "#1A2E26",
    fontWeight: 500,
  },
  unassigned: {
    fontSize: "0.8rem",
    color: "#6B7C74",
    fontStyle: "italic",
  },
  timeAgo: {
    fontSize: "0.8rem",
    color: "#6B7C74",
  },
  loadingCell: {
    padding: "3rem",
    textAlign: "center" as const,
  },
  spinnerWrapper: {
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
  emptyCell: {
    padding: "3rem",
    textAlign: "center" as const,
    color: "#6B7C74",
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
    transition: "all 0.15s",
  },
  pageBtnActive: {
    background: "#2D7A5B",
    color: "#fff",
    borderColor: "#2D7A5B",
    fontWeight: 600,
  },
  dots: {
    padding: "0.4rem 0.2rem",
    color: "#6B7C74",
    fontSize: "0.875rem",
  },
};
