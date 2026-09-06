import React, { useState } from "react";
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
    const saved = localStorage.getItem("toktickit_requester");
    return saved ? { name: "list" } : { name: "select-requester" };
  });

  const handleSelectRequester = (r: Requester) => {
    setRequester(r);
    try {
      localStorage.setItem("toktickit_requester", JSON.stringify(r));
    } catch (err) {
      console.error("Failed to save requester to storage", err);
    }
    setPage({ name: "list" });
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
              setPage(requester ? { name: "list" } : { name: "select-requester" });
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
              onClick={() => setPage({ name: "list" })}
              disabled={!requester}
            >
              My Tickets
            </button>
            <button
              id="nav-new-ticket"
              className={`nav-link${currentPage === "create" ? " active" : ""}`}
              onClick={() => setPage({ name: "create" })}
              disabled={!requester}
            >
              + New Ticket
            </button>
          </div>

          {/* Requester Selector */}
          <RequesterSelector
            requester={requester}
            onChange={handleRequesterChangeFromNavbar}
            onOpenSelectPage={() => setPage({ name: "select-requester" })}
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
                setPage({ name: "list" });
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
                onSelectTicket={(id) => setPage({ name: "detail", ticketId: id })}
                onCreateNew={() => setPage({ name: "create" })}
              />
            )}
            {page.name === "create" && (
              <CreateTicketPage
                requesterId={requester.id}
                onSuccess={(ticketId) => setPage({ name: "detail", ticketId })}
                onCancel={() => setPage({ name: "list" })}
              />
            )}
            {page.name === "detail" && (
              <TicketDetailPage
                requesterId={requester.id}
                ticketId={page.ticketId}
                onBack={() => setPage({ name: "list" })}
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

