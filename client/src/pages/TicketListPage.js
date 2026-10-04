import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchTickets, fetchCategories, formatTicketNumber } from "../api";
// ── Style constants ──────────────────────────────────────────────────────
const thStyle = {
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
const tdStyle = {
    padding: "var(--space-4)",
    verticalAlign: "middle",
};
const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "OPEN", label: "New" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
];
const STATUS_LABELS = {
    OPEN: "New", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};
const STATUS_COLORS = {
    OPEN: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    IN_PROGRESS: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    RESOLVED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    CLOSED: { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
};
function StatusBadge({ status }) {
    const c = STATUS_COLORS[status];
    return (_jsx("span", { className: `badge badge-${status}`, style: {
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            display: "inline-block",
        }, children: STATUS_LABELS[status] }));
}
function formatDateTime(iso) {
    return new Date(iso).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
}
export default function TicketListPage({ requesterId, onSelectTicket, onCreateNew }) {
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
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
            const params = {
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
        }
        catch (e) {
            setError(e.message ?? "Failed to load tickets.");
        }
        finally {
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
    function handleSortToggle(field) {
        if (sortBy === field) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        }
        else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    }
    function SortIcon({ field }) {
        if (sortBy !== field)
            return _jsx("span", { style: { opacity: 0.3, fontSize: 10 }, children: "\u21C5" });
        return _jsx("span", { style: { fontSize: 10, color: "var(--color-primary)" }, children: sortOrder === "asc" ? "↑" : "↓" });
    }
    function getPageNumbers() {
        if (totalPages <= 7)
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [1];
        if (page > 3)
            pages.push("...");
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++)
            pages.push(p);
        if (page < totalPages - 2)
            pages.push("...");
        pages.push(totalPages);
        return pages;
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { style: { margin: 0 }, children: "My Tickets" }), _jsx("p", { style: { margin: "var(--space-1) 0 0", color: "var(--color-text-secondary)", fontSize: 14 }, children: "View and track all of your support requests." })] }), _jsxs("div", { style: { display: "flex", gap: "var(--space-3)", alignItems: "center" }, children: [hasActiveFilter && (_jsx("button", { id: "btn-clear-filters", className: "btn btn-ghost", onClick: clearFilters, style: { display: "flex", alignItems: "center", gap: 6 }, children: "\u21BA Clear Filters" })), _jsxs("button", { id: "btn-create-ticket", className: "btn btn-primary", onClick: onCreateNew, style: { display: "flex", alignItems: "center", gap: 6 }, children: [_jsx("span", { style: { fontSize: 18, lineHeight: 1 }, children: "+" }), " Create Ticket"] })] })] }), _jsx("div", { className: "card", style: { marginBottom: "var(--space-4)", padding: "var(--space-4) var(--space-5)" }, children: _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end" }, children: [_jsxs("div", { className: "search-input-wrap", style: { flex: "1 1 220px", minWidth: 180 }, children: [_jsx("span", { className: "search-icon", children: "\uD83D\uDD0D" }), _jsx("input", { id: "input-search-tickets", className: "form-control", placeholder: "Search by ticket number or summary\u2026", value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); } })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("label", { style: { fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Category" }), _jsxs("select", { id: "select-category-filter", className: "form-control filter-select", value: categoryId, onChange: (e) => { setCategoryId(e.target.value); setPage(1); }, style: { minWidth: 140 }, children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("label", { style: { fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Current Status" }), _jsx("select", { id: "select-status-filter", className: "form-control filter-select", value: status, onChange: (e) => { setStatus(e.target.value); setPage(1); }, style: { minWidth: 140 }, children: STATUS_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })] })] }) }), error && (_jsxs("div", { className: "alert alert-error", id: "tickets-error-banner", children: ["\u26A0 ", error] })), _jsxs("div", { className: "card", style: { overflow: "hidden" }, children: [_jsx("div", { className: "table-wrapper", style: { overflowX: "auto" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 780 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: "2px solid var(--color-border)" }, children: [_jsx("th", { style: { ...thStyle, width: 148 }, children: "Ticket No." }), _jsxs("th", { id: "th-sort-created", style: { ...thStyle, width: 150, cursor: "pointer", userSelect: "none" }, onClick: () => handleSortToggle("createdAt"), children: ["Created Date ", _jsx(SortIcon, { field: "createdAt" })] }), _jsx("th", { style: { ...thStyle }, children: "Summary" }), _jsx("th", { style: { ...thStyle, width: 110 }, children: "Category" }), _jsx("th", { style: { ...thStyle, width: 120 }, children: "Current Status" }), _jsxs("th", { id: "th-sort-updated", style: { ...thStyle, width: 150, cursor: "pointer", userSelect: "none" }, onClick: () => handleSortToggle("updatedAt"), children: ["Last Updated ", _jsx(SortIcon, { field: "updatedAt" })] })] }) }), _jsx("tbody", { children: loading ? (Array.from({ length: 5 }).map((_, i) => (_jsx("tr", { style: { borderBottom: "1px solid var(--color-border)" }, children: [140, 140, 240, 90, 110, 140].map((w, j) => (_jsx("td", { style: tdStyle, children: _jsx("div", { className: "skeleton", style: { height: 14, width: w, borderRadius: 4 } }) }, j))) }, i)))) : tickets.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCED" }), _jsx("div", { className: "empty-title", children: "No tickets found" }), _jsx("div", { className: "empty-desc", children: search || status || categoryId
                                                            ? "Try adjusting your filters."
                                                            : "You haven't submitted any tickets yet." }), !search && !status && !categoryId && (_jsx("button", { className: "btn btn-primary", onClick: onCreateNew, children: "Submit your first ticket" }))] }) }) })) : (tickets.map((t) => {
                                        const ticketNo = t.ticketNumber || formatTicketNumber(t.id, t.createdAt);
                                        return (_jsxs("tr", { id: `ticket-row-${t.id}`, onClick: () => onSelectTicket(t.id), tabIndex: 0, onKeyDown: (e) => e.key === "Enter" && onSelectTicket(t.id), style: { borderBottom: "1px solid var(--color-border)", cursor: "pointer", transition: "background 0.12s" }, onMouseEnter: (e) => (e.currentTarget.style.background = "var(--color-surface-2, #f8fafc)"), onMouseLeave: (e) => (e.currentTarget.style.background = ""), children: [_jsx("td", { style: { ...tdStyle, whiteSpace: "nowrap" }, children: _jsx("span", { style: { fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "var(--color-primary)" }, children: ticketNo }) }), _jsx("td", { style: { ...tdStyle, whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }, children: formatDateTime(t.createdAt) }), _jsx("td", { style: tdStyle, children: _jsx("span", { className: "td-title-text", style: {
                                                            fontWeight: 500,
                                                            fontSize: 14,
                                                            color: "var(--color-text-primary)",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                            maxWidth: 320,
                                                        }, children: t.title }) }), _jsx("td", { style: tdStyle, children: _jsx("span", { style: {
                                                            fontSize: 13,
                                                            color: "var(--color-text-secondary)",
                                                            background: "var(--color-surface-2, #f1f5f9)",
                                                            borderRadius: 6,
                                                            padding: "2px 8px",
                                                            display: "inline-block",
                                                        }, children: t.category.name }) }), _jsx("td", { style: tdStyle, children: _jsx(StatusBadge, { status: t.status }) }), _jsx("td", { style: { ...tdStyle, whiteSpace: "nowrap", fontSize: 13, color: "var(--color-text-secondary)" }, children: formatDateTime(t.updatedAt) })] }, t.id));
                                    })) })] }) }), !loading && total > 0 && (_jsxs("div", { style: {
                            padding: "var(--space-4) var(--space-5)",
                            borderTop: "1px solid var(--color-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "var(--space-3)",
                        }, children: [_jsxs("span", { style: { fontSize: 13, color: "var(--color-text-secondary)" }, children: ["Showing ", start, " to ", end, " of ", total, " tickets"] }), _jsxs("div", { className: "pagination-controls", style: { display: "flex", gap: 4, alignItems: "center" }, children: [_jsx("button", { id: "btn-page-prev", className: "page-chip", onClick: () => setPage((p) => p - 1), disabled: page <= 1, children: "\u2039 Previous" }), getPageNumbers().map((p, i) => p === "..." ? (_jsx("span", { style: { padding: "0 6px", color: "var(--color-text-secondary)" }, children: "\u2026" }, `ell-${i}`)) : (_jsx("button", { id: `btn-page-${p}`, className: `page-chip${p === page ? " active" : ""}`, onClick: () => setPage(p), children: p }, p))), _jsx("button", { id: "btn-page-next", className: "page-chip", onClick: () => setPage((p) => p + 1), disabled: page >= totalPages, children: "Next \u203A" })] })] }))] })] }));
}
