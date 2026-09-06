import React, { useState, useEffect, useRef } from "react";
import { Requester, fetchRequesters } from "../api";

interface Props {
  requester: Requester | null;
  onChange: (r: Requester) => void;
  onOpenSelectPage?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function RequesterSelector({ requester, onChange, onOpenSelectPage }: Props) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRequesters()
      .then((data) => {
        setRequesters(data);
        if (!requester && data.length > 0) onChange(data[0]);
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
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return (
      <div className="requester-btn" style={{ opacity: 0.6, cursor: "default" }}>
        <div className="skeleton" style={{ width: 26, height: 26, borderRadius: "50%" }} />
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading…</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        className="requester-btn"
        title="Cannot reach the server. Make sure Docker is running."
        style={{ background: "var(--color-error-pale)", borderColor: "var(--color-error)", cursor: "default" }}
      >
        <span style={{ fontSize: 15 }}>⚠</span>
        <span style={{ fontSize: 13, color: "var(--color-error)" }}>Server offline</span>
      </div>
    );
  }

  return (
    <div className="requester-selector" ref={ref} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        id="requester-selector-btn"
        className="requester-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="requester-avatar">
          {requester ? getInitials(requester.name) : "?"}
        </div>
        <span>{requester?.name ?? "Select Requester"}</span>
        <span className={`requester-chevron${open ? " open" : ""}`}>▼</span>
      </button>

      {onOpenSelectPage && (
        <button
          type="button"
          id="nav-change-requester-btn"
          className="btn-change-requester"
          onClick={onOpenSelectPage}
          title="Change Development Requester"
        >
          ⇄ Change Requester
        </button>
      )}


      {open && (
        <div className="requester-dropdown" role="listbox" aria-label="Select Requester">
          <div className="requester-dropdown-header">Acting as</div>
          {requesters.map((r) => (
            <div
              key={r.id}
              id={`requester-option-${r.id}`}
              className={`requester-option${r.id === requester?.id ? " selected" : ""}`}
              role="option"
              aria-selected={r.id === requester?.id}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              <div className="requester-avatar">{getInitials(r.name)}</div>
              <div className="requester-option-info">
                <div className="requester-option-name">{r.name}</div>
                <div className="requester-option-dept">{r.department}</div>
              </div>
              {r.id === requester?.id && (
                <span style={{ color: "var(--color-primary)", fontSize: 14 }}>✓</span>
              )}
            </div>
          ))}

          {onOpenSelectPage && (
            <div
              className="requester-dropdown-footer"
              style={{
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
              }}
              onClick={() => {
                setOpen(false);
                onOpenSelectPage();
              }}
            >
              <span>⚙ Switch Requester Screen…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
