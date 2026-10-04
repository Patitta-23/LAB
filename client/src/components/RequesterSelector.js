import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { fetchRequesters } from "../api";
function getInitials(name) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}
export default function RequesterSelector({ requester, onChange, onOpenSelectPage }) {
    const [requesters, setRequesters] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        fetchRequesters()
            .then((data) => {
            setRequesters(data);
            if (!requester && data.length > 0)
                onChange(data[0]);
        })
            .catch(() => {
            setFetchError(true);
            // Fallback: still allow app to render with a placeholder
            if (!requester) {
                onChange({ id: 0, name: "Guest", email: "", department: "N/A" });
            }
        })
            .finally(() => setLoading(false));
    }, []);
    // Close dropdown on outside click
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    if (loading) {
        return (_jsxs("div", { className: "requester-btn", style: { opacity: 0.6, cursor: "default" }, children: [_jsx("div", { className: "skeleton", style: { width: 26, height: 26, borderRadius: "50%" } }), _jsx("span", { style: { fontSize: 13, color: "var(--color-text-secondary)" }, children: "Loading\u2026" })] }));
    }
    if (fetchError) {
        return (_jsxs("div", { className: "requester-btn", title: "Cannot reach the server. Make sure Docker is running.", style: { background: "var(--color-error-pale)", borderColor: "var(--color-error)", cursor: "default" }, children: [_jsx("span", { style: { fontSize: 15 }, children: "\u26A0" }), _jsx("span", { style: { fontSize: 13, color: "var(--color-error)" }, children: "Server offline" })] }));
    }
    return (_jsxs("div", { className: "requester-selector", ref: ref, style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsxs("button", { id: "requester-selector-btn", className: "requester-btn", onClick: () => setOpen((o) => !o), "aria-haspopup": "listbox", "aria-expanded": open, children: [_jsx("div", { className: "requester-avatar", children: requester ? getInitials(requester.name) : "?" }), _jsx("span", { children: requester?.name ?? "Select Requester" }), _jsx("span", { className: `requester-chevron${open ? " open" : ""}`, children: "\u25BC" })] }), onOpenSelectPage && (_jsx("button", { type: "button", id: "nav-change-requester-btn", className: "btn-change-requester", onClick: onOpenSelectPage, title: "Change Development Requester", children: "\u21C4 Change Requester" })), open && (_jsxs("div", { className: "requester-dropdown", role: "listbox", "aria-label": "Select Requester", children: [_jsx("div", { className: "requester-dropdown-header", children: "Acting as" }), requesters.map((r) => (_jsxs("div", { id: `requester-option-${r.id}`, className: `requester-option${r.id === requester?.id ? " selected" : ""}`, role: "option", "aria-selected": r.id === requester?.id, onClick: () => {
                            onChange(r);
                            setOpen(false);
                        }, children: [_jsx("div", { className: "requester-avatar", children: getInitials(r.name) }), _jsxs("div", { className: "requester-option-info", children: [_jsx("div", { className: "requester-option-name", children: r.name }), _jsx("div", { className: "requester-option-dept", children: r.department })] }), r.id === requester?.id && (_jsx("span", { style: { color: "var(--color-primary)", fontSize: 14 }, children: "\u2713" }))] }, r.id))), onOpenSelectPage && (_jsx("div", { className: "requester-dropdown-footer", style: {
                            borderTop: "1px solid var(--color-border)",
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "var(--color-primary)",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "var(--color-surface)",
                        }, onClick: () => {
                            setOpen(false);
                            onOpenSelectPage();
                        }, children: _jsx("span", { children: "\u2699 Switch Requester Screen\u2026" }) }))] }))] }));
}
