import React, { useState } from "react";
import "./index.css";
import { Requester } from "./api";
import RequesterSelector from "./components/RequesterSelector";
import TicketListPage from "./pages/TicketListPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";

type Page =
  | { name: "list" }
  | { name: "create" }
  | { name: "detail"; ticketId: number };

export default function App() {
  const [requester, setRequester] = useState<Requester | null>(null);
  const [page, setPage]           = useState<Page>({ name: "list" });

  const currentPage = page.name;

  return (
    <div className="app-layout">
      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          {/* Brand */}
          <a className="navbar-brand" href="#" id="navbar-brand" onClick={(e) => { e.preventDefault(); setPage({ name: "list" }); }}>
            <div className="navbar-logo" aria-hidden="true">TT</div>
            <span className="navbar-title">TokTickIT</span>
          </a>

          {/* Nav Links */}
          <div className="navbar-nav">
            <button
              id="nav-my-tickets"
              className={`nav-link${currentPage === "list" ? " active" : ""}`}
              onClick={() => setPage({ name: "list" })}
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
          <RequesterSelector requester={requester} onChange={setRequester} />
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────── */}
      <main style={{ flex: 1 }}>
        {!requester ? (
          /* Loading state while requester list loads */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              gap: "var(--space-4)",
            }}
          >
            <div style={{ fontSize: 40, opacity: 0.3 }}>🎫</div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 15 }}>
              Loading TokTickIT…
            </p>
          </div>
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
