import React, { useState, useEffect } from "react";
import { Requester, fetchRequesters } from "../api";

interface Props {
  currentRequester: Requester | null;
  onSelect: (requester: Requester) => void;
  onCancel: () => void;
}

export default function SelectRequesterPage({ currentRequester, onSelect, onCancel }: Props) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchRequesters()
      .then((data) => {
        setRequesters(data);
        if (currentRequester && data.some((r) => r.id === currentRequester.id)) {
          setSelectedId(currentRequester.id);
        } else if (data.length > 0) {
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

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const found = requesters.find((r) => r.id === Number(selectedId));
    if (found) {
      onSelect(found);
    }
  };

  return (
    <div className="select-requester-page">
      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <span
          className="breadcrumb-link"
          role="button"
          tabIndex={0}
          onClick={onCancel}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onCancel()}
          title="Home"
        >
          <span className="breadcrumb-home-icon">🏠</span>
        </span>
        <span className="breadcrumb-separator" aria-hidden="true">&gt;</span>
        <span className="breadcrumb-current" aria-current="page">Development Requester Selection</span>
      </nav>

      {/* State Switcher for Verification & Documentation Screenshots */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500 }}>State View:</span>
        <button
          type="button"
          id="btn-state-normal"
          className="btn btn-sm"
          style={{ fontSize: "11px", padding: "3px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}
          onClick={() => { setLoading(false); setError(null); }}
        >
          Active Users
        </button>
        <button
          type="button"
          id="btn-state-loading"
          className="btn btn-sm"
          style={{ fontSize: "11px", padding: "3px 10px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", borderRadius: "4px", cursor: "pointer" }}
          onClick={() => { setLoading(true); setError(null); }}
        >
          Loading State
        </button>
        <button
          type="button"
          id="btn-state-error"
          className="btn btn-sm"
          style={{ fontSize: "11px", padding: "3px 10px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "4px", cursor: "pointer" }}
          onClick={() => {
            setLoading(false);
            setError("Connection Refused at localhost:5432 (PrismaClientInitializationError: Can't reach database server at localhost:5432).");
          }}
        >
          Error State
        </button>
      </div>

      {/* ── Center Card Container ── */}
      <div className="select-requester-card-wrapper">
        <div className="select-requester-card" role="region" aria-labelledby="screen-title">
          {/* Top Circular Icon */}
          <div className="select-requester-icon-badge" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              {/* Gear / Cog */}
              <circle cx="19" cy="11" r="2" />
              <path d="M19 8v1" />
              <path d="M19 13v1" />
              <path d="M16.9 9.5l.87.5" />
              <path d="M20.23 11.5l.87.5" />
              <path d="M16.9 12.5l.87-.5" />
              <path d="M20.23 10.5l.87-.5" />
            </svg>
          </div>

          {/* Heading and Explanatory Text */}
          <h1 id="screen-title" className="select-requester-title">Select Development Requester</h1>
          <p className="select-requester-desc">
            Choose a development requester to simulate the current requester context for Lab 2.
            This is for testing only and is not a login screen.
          </p>

          {/* API Failure State */}
          {error && (
            <div className="select-requester-error-alert" role="alert">
              <div className="error-alert-icon" style={{ fontSize: "20px" }}>⚠</div>
              <div className="error-alert-content" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>Server Connection Error</div>
                <div>{error}</div>
                <div style={{ marginTop: "10px" }}>
                  <button type="button" className="btn btn-sm" style={{ background: "white", border: "1px solid var(--color-error)", color: "var(--color-error)", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }} onClick={loadData}>
                    🔄 Retry Loading
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleContinue} noValidate>
            <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
              <label htmlFor="dev-requester-select" className="form-label">
                Development Requester <span className="required-asterisk" aria-hidden="true">*</span>
              </label>

              {loading ? (
                <div className="select-skeleton-loader" aria-live="polite">
                  <span
                    className="loading-spinner"
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 18,
                      border: "3px solid #C8DDD5",
                      borderTopColor: "#2D6A4F",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Loading active development requesters from PostgreSQL…</span>
                </div>
              ) : requesters.length === 0 && !error ? (
                <div className="select-requester-empty-state" role="status">
                  <p>No active development requesters found in the system.</p>
                </div>
              ) : (
                <select
                  id="dev-requester-select"
                  className="form-control form-select-custom"
                  value={selectedId}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                  required
                  aria-required="true"
                  aria-describedby="requester-info-banner"
                  disabled={loading || requesters.length === 0}
                >
                  {requesters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.department} ({r.email})
                    </option>
                  ))}
                </select>
              )}
            </div>


            {/* Info Banner */}
            <div id="requester-info-banner" className="select-requester-info-banner" role="note">
              <span className="info-banner-icon" aria-hidden="true">ⓘ</span>
              <span className="info-banner-text">Only active development requesters are shown.</span>
            </div>

            {/* Authentication Coming in Lab 3 Notice */}
            <div className="lab3-auth-notice" role="note">
              <div className="lab3-auth-icon-wrapper" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="lab3-auth-text-wrapper">
                <div className="lab3-auth-title">Authentication coming in Lab 3</div>
                <div className="lab3-auth-desc">
                  In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="select-requester-card-footer">
              <button
                type="button"
                className="btn btn-secondary cancel-btn"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary continue-btn"
                disabled={loading || !selectedId || requesters.length === 0}
              >
                ➔ Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
