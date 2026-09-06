import React, { useState, useEffect } from "react";
import "./index.css";
import { Requester } from "./api";
import RequesterSelector from "./components/RequesterSelector";
import SelectRequesterPage from "./pages/SelectRequesterPage";
import TicketListPage from "./pages/TicketListPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";

type Page =
  | { name: "select-requester" }
  | { name: "list" }
  | { name: "create" }
  | { name: "detail"; ticketId: number };

function getInitialPage(savedRequester: Requester | null): Page {
  if (!savedRequester) return { name: "select-requester" };
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
  const [requester, setRequester] = useState<Requester | null>(() => {
    try {
      const saved = localStorage.getItem("toktickit_requester");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState<Page>(() => {
    try {
      const saved = localStorage.getItem("toktickit_requester");
      const req = saved ? JSON.parse(saved) : null;
      return getInitialPage(req);
    } catch {
      return { name: "select-requester" };
    }
  });

  const navigateTo = (newPage: Page) => {
    setPage(newPage);
    if (newPage.name === "detail") {
      window.history.pushState(null, "", `/tickets/${newPage.ticketId}`);
    } else if (newPage.name === "create") {
      window.history.pushState(null, "", "/tickets/new");
    } else if (newPage.name === "list") {
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

  const handleSelectRequester = (r: Requester) => {
    setRequester(r);
    try {
      localStorage.setItem("toktickit_requester", JSON.stringify(r));
    } catch (err) {
      console.error("Failed to save requester to storage", err);
    }
    navigateTo({ name: "list" });
  };

  const handleRequesterChangeFromNavbar = (r: Requester) => {
    setRequester(r);
    try {
      localStorage.setItem("toktickit_requester", JSON.stringify(r));
    } catch (err) {
      console.error("Failed to save requester to storage", err);
    }
  };

  const currentPage = page.name;

  return (
    <div className="app-layout">
      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          {/* Brand */}
          <a
            className="navbar-brand"
            href="#"
            id="navbar-brand"
            onClick={(e) => {
              e.preventDefault();
              navigateTo(requester ? { name: "list" } : { name: "select-requester" });
            }}
          >
            <div className="navbar-logo" aria-hidden="true">TT</div>
            <span className="navbar-title">TokTickIT</span>
          </a>

          {/* Nav Links */}
          <div className="navbar-nav">
            <button
              id="nav-my-tickets"
              className={`nav-link${currentPage === "list" ? " active" : ""}`}
              onClick={() => navigateTo({ name: "list" })}
              disabled={!requester}
            >
              My Tickets
            </button>
            <button
              id="nav-new-ticket"
              className={`nav-link${currentPage === "create" ? " active" : ""}`}
              onClick={() => navigateTo({ name: "create" })}
              disabled={!requester}
            >
              + New Ticket
            </button>
          </div>

          {/* Requester Selector */}
          <RequesterSelector
            requester={requester}
            onChange={handleRequesterChangeFromNavbar}
            onOpenSelectPage={() => navigateTo({ name: "select-requester" })}
          />
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────── */}
      <main style={{ flex: 1 }}>
        {page.name === "select-requester" ? (
          <SelectRequesterPage
            currentRequester={requester}
            onSelect={handleSelectRequester}
            onCancel={() => {
              if (requester) {
                navigateTo({ name: "list" });
              }
            }}
          />
        ) : !requester ? (
          /* If navigating to other pages without requester, redirect to selection */
          <SelectRequesterPage
            currentRequester={null}
            onSelect={handleSelectRequester}
            onCancel={() => {}}
          />
        ) : (
          <div className="page-container">
            {page.name === "list" && (
              <TicketListPage
                requesterId={requester.id}
                onSelectTicket={(id) => navigateTo({ name: "detail", ticketId: id })}
                onCreateNew={() => navigateTo({ name: "create" })}
              />
            )}
            {page.name === "create" && (
              <CreateTicketPage
                requester={requester}
                requesterId={requester.id}
                onSuccess={(ticketId) => navigateTo({ name: "detail", ticketId })}
                onCancel={() => navigateTo({ name: "list" })}
              />
            )}

            {page.name === "detail" && (
              <TicketDetailPage
                requesterId={requester.id}
                ticketId={page.ticketId}
                onBack={() => navigateTo({ name: "list" })}
              />
            )}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "var(--space-4) var(--space-6)",
          textAlign: "center",
          fontSize: 12,
          color: "var(--color-text-disabled)",
        }}
      >
        TokTickIT — CPE 334 Lab 2 · Internal IT Service Desk
      </footer>
    </div>
  );
}

