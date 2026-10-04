import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import "./index.css";
import RequesterSelector from "./components/RequesterSelector";
import SelectRequesterPage from "./pages/SelectRequesterPage";
import TicketListPage from "./pages/TicketListPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
function getInitialPage(savedRequester) {
    if (!savedRequester)
        return { name: "select-requester" };
    const path = window.location.pathname;
    const matchDetail = path.match(/^\/tickets\/(\d+)$/);
    if (matchDetail) {
        return { name: "detail", ticketId: parseInt(matchDetail[1], 10) };
    }
    const searchParams = new URLSearchParams(window.location.search);
    const qTicketId = searchParams.get("ticketId");
    if (qTicketId && !isNaN(parseInt(qTicketId, 10))) {
        return { name: "detail", ticketId: parseInt(qTicketId, 10) };
    }
    if (path === "/tickets/new") {
        return { name: "create" };
    }
    return { name: "list" };
}
export default function App() {
    const [requester, setRequester] = useState(() => {
        try {
            const saved = localStorage.getItem("toktickit_requester");
            return saved ? JSON.parse(saved) : null;
        }
        catch {
            return null;
        }
    });
    const [page, setPage] = useState(() => {
        try {
            const saved = localStorage.getItem("toktickit_requester");
            const req = saved ? JSON.parse(saved) : null;
            return getInitialPage(req);
        }
        catch {
            return { name: "select-requester" };
        }
    });
    const navigateTo = (newPage) => {
        setPage(newPage);
        if (newPage.name === "detail") {
            window.history.pushState(null, "", `/tickets/${newPage.ticketId}`);
        }
        else if (newPage.name === "create") {
            window.history.pushState(null, "", "/tickets/new");
        }
        else if (newPage.name === "list") {
            window.history.pushState(null, "", "/");
        }
    };
    useEffect(() => {
        const onPop = () => {
            setPage(getInitialPage(requester));
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, [requester]);
    const handleSelectRequester = (r) => {
        setRequester(r);
        try {
            localStorage.setItem("toktickit_requester", JSON.stringify(r));
        }
        catch (err) {
            console.error("Failed to save requester to storage", err);
        }
        navigateTo({ name: "list" });
    };
    const handleRequesterChangeFromNavbar = (r) => {
        setRequester(r);
        try {
            localStorage.setItem("toktickit_requester", JSON.stringify(r));
        }
        catch (err) {
            console.error("Failed to save requester to storage", err);
        }
    };
    const currentPage = page.name;
    return (_jsxs("div", { className: "app-layout", children: [_jsx("nav", { className: "navbar", role: "navigation", "aria-label": "Main navigation", children: _jsxs("div", { className: "navbar-inner", children: [_jsxs("a", { className: "navbar-brand", href: "#", id: "navbar-brand", onClick: (e) => {
                                e.preventDefault();
                                navigateTo(requester ? { name: "list" } : { name: "select-requester" });
                            }, children: [_jsx("div", { className: "navbar-logo", "aria-hidden": "true", children: "TT" }), _jsx("span", { className: "navbar-title", children: "TokTickIT" })] }), _jsxs("div", { className: "navbar-nav", children: [_jsx("button", { id: "nav-my-tickets", className: `nav-link${currentPage === "list" ? " active" : ""}`, onClick: () => navigateTo({ name: "list" }), disabled: !requester, children: "My Tickets" }), _jsx("button", { id: "nav-new-ticket", className: `nav-link${currentPage === "create" ? " active" : ""}`, onClick: () => navigateTo({ name: "create" }), disabled: !requester, children: "+ New Ticket" })] }), _jsx(RequesterSelector, { requester: requester, onChange: handleRequesterChangeFromNavbar, onOpenSelectPage: () => navigateTo({ name: "select-requester" }) })] }) }), _jsx("main", { style: { flex: 1 }, children: page.name === "select-requester" ? (_jsx(SelectRequesterPage, { currentRequester: requester, onSelect: handleSelectRequester, onCancel: () => {
                        if (requester) {
                            navigateTo({ name: "list" });
                        }
                    } })) : !requester ? (
                /* If navigating to other pages without requester, redirect to selection */
                _jsx(SelectRequesterPage, { currentRequester: null, onSelect: handleSelectRequester, onCancel: () => { } })) : (_jsxs("div", { className: "page-container", children: [page.name === "list" && (_jsx(TicketListPage, { requesterId: requester.id, onSelectTicket: (id) => navigateTo({ name: "detail", ticketId: id }), onCreateNew: () => navigateTo({ name: "create" }) })), page.name === "create" && (_jsx(CreateTicketPage, { requester: requester, requesterId: requester.id, onSuccess: (ticketId) => navigateTo({ name: "detail", ticketId }), onCancel: () => navigateTo({ name: "list" }) })), page.name === "detail" && (_jsx(TicketDetailPage, { requesterId: requester.id, ticketId: page.ticketId, onBack: () => navigateTo({ name: "list" }) }))] })) }), _jsx("footer", { style: {
                    borderTop: "1px solid var(--color-border)",
                    padding: "var(--space-4) var(--space-6)",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--color-text-disabled)",
                }, children: "TokTickIT \u2014 CPE 334 Lab 2 \u00B7 Internal IT Service Desk" })] }));
}
