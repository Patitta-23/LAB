import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchRequesters } from "../api";
export default function SelectRequesterPage({ currentRequester, onSelect, onCancel }) {
    const [requesters, setRequesters] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadData = () => {
        setLoading(true);
        setError(null);
        fetchRequesters()
            .then((data) => {
            setRequesters(data);
            if (currentRequester && data.some((r) => r.id === currentRequester.id)) {
                setSelectedId(currentRequester.id);
            }
            else if (data.length > 0) {
                setSelectedId(data[0].id);
            }
        })
            .catch((err) => {
            console.error("Failed to load requesters", err);
            setError("Unable to connect to the backend server or database. Please ensure PostgreSQL is running.");
        })
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleContinue = (e) => {
        e.preventDefault();
        if (!selectedId)
            return;
        const found = requesters.find((r) => r.id === Number(selectedId));
        if (found) {
            onSelect(found);
        }
    };
    return (_jsxs("div", { className: "select-requester-page", children: [_jsxs("nav", { className: "breadcrumb-nav", "aria-label": "Breadcrumb", children: [_jsx("span", { className: "breadcrumb-link", role: "button", tabIndex: 0, onClick: onCancel, onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && onCancel(), title: "Home", children: _jsx("span", { className: "breadcrumb-home-icon", children: "\uD83C\uDFE0" }) }), _jsx("span", { className: "breadcrumb-separator", "aria-hidden": "true", children: ">" }), _jsx("span", { className: "breadcrumb-current", "aria-current": "page", children: "Development Requester Selection" })] }), _jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500 }, children: "State View:" }), _jsx("button", { type: "button", id: "btn-state-normal", className: "btn btn-sm", style: { fontSize: "11px", padding: "3px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }, onClick: () => { setLoading(false); setError(null); }, children: "Active Users" }), _jsx("button", { type: "button", id: "btn-state-loading", className: "btn btn-sm", style: { fontSize: "11px", padding: "3px 10px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", borderRadius: "4px", cursor: "pointer" }, onClick: () => { setLoading(true); setError(null); }, children: "Loading State" }), _jsx("button", { type: "button", id: "btn-state-error", className: "btn btn-sm", style: { fontSize: "11px", padding: "3px 10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "4px", cursor: "pointer" }, onClick: () => {
                            setLoading(false);
                            setError("Connection Refused at localhost:5432 (PrismaClientInitializationError: Can't reach database server at localhost:5432).");
                        }, children: "Error State" })] }), _jsx("div", { className: "select-requester-card-wrapper", children: _jsxs("div", { className: "select-requester-card", role: "region", "aria-labelledby": "screen-title", children: [_jsx("div", { className: "select-requester-icon-badge", "aria-hidden": "true", children: _jsxs("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "9", cy: "7", r: "4" }), _jsx("circle", { cx: "19", cy: "11", r: "2" }), _jsx("path", { d: "M19 8v1" }), _jsx("path", { d: "M19 13v1" }), _jsx("path", { d: "M16.9 9.5l.87.5" }), _jsx("path", { d: "M20.23 11.5l.87.5" }), _jsx("path", { d: "M16.9 12.5l.87-.5" }), _jsx("path", { d: "M20.23 10.5l.87-.5" })] }) }), _jsx("h1", { id: "screen-title", className: "select-requester-title", children: "Select Development Requester" }), _jsx("p", { className: "select-requester-desc", children: "Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen." }), error && (_jsxs("div", { className: "select-requester-error-alert", role: "alert", children: [_jsx("div", { className: "error-alert-icon", style: { fontSize: "20px" }, children: "\u26A0" }), _jsxs("div", { className: "error-alert-content", style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 600, marginBottom: "4px" }, children: "Server Connection Error" }), _jsx("div", { children: error }), _jsx("div", { style: { marginTop: "10px" }, children: _jsx("button", { type: "button", className: "btn btn-sm", style: { background: "white", border: "1px solid var(--color-error)", color: "var(--color-error)", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }, onClick: loadData, children: "\uD83D\uDD04 Retry Loading" }) })] })] })), _jsxs("form", { onSubmit: handleContinue, noValidate: true, children: [_jsxs("div", { className: "form-group", style: { marginBottom: "var(--space-4)" }, children: [_jsxs("label", { htmlFor: "dev-requester-select", className: "form-label", children: ["Development Requester ", _jsx("span", { className: "required-asterisk", "aria-hidden": "true", children: "*" })] }), loading ? (_jsxs("div", { className: "select-skeleton-loader", "aria-live": "polite", children: [_jsx("span", { className: "loading-spinner", "aria-hidden": "true", style: {
                                                        width: 18,
                                                        height: 18,
                                                        border: "3px solid #C8DDD5",
                                                        borderTopColor: "#2D6A4F",
                                                        borderRadius: "50%",
                                                        display: "inline-block",
                                                        animation: "spin 0.8s linear infinite",
                                                    } }), _jsx("span", { children: "Loading active development requesters from PostgreSQL\u2026" })] })) : requesters.length === 0 && !error ? (_jsx("div", { className: "select-requester-empty-state", role: "status", children: _jsx("p", { children: "No active development requesters found in the system." }) })) : (_jsx("select", { id: "dev-requester-select", className: "form-control form-select-custom", value: selectedId, onChange: (e) => setSelectedId(Number(e.target.value)), required: true, "aria-required": "true", "aria-describedby": "requester-info-banner", disabled: loading || requesters.length === 0, children: requesters.map((r) => (_jsxs("option", { value: r.id, children: [r.name, " \u2014 ", r.department, " (", r.email, ")"] }, r.id))) }))] }), _jsxs("div", { id: "requester-info-banner", className: "select-requester-info-banner", role: "note", children: [_jsx("span", { className: "info-banner-icon", "aria-hidden": "true", children: "\u24D8" }), _jsx("span", { className: "info-banner-text", children: "Only active development requesters are shown." })] }), _jsxs("div", { className: "lab3-auth-notice", role: "note", children: [_jsx("div", { className: "lab3-auth-icon-wrapper", "aria-hidden": "true", children: _jsx("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }) }), _jsxs("div", { className: "lab3-auth-text-wrapper", children: [_jsx("div", { className: "lab3-auth-title", children: "Authentication coming in Lab 3" }), _jsx("div", { className: "lab3-auth-desc", children: "In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account." })] })] }), _jsxs("div", { className: "select-requester-card-footer", children: [_jsx("button", { type: "button", className: "btn btn-secondary cancel-btn", onClick: onCancel, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-primary continue-btn", disabled: loading || !selectedId || requesters.length === 0, children: "\u2794 Continue" })] })] })] }) })] }));
}
