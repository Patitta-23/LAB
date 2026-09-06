import React, { useState, useEffect } from "react";
import {
  TicketDetail, Attachment, TicketStatus,
  fetchTicketById, deleteAttachment, getDownloadUrl
} from "../api";

interface Props {
  requesterId: number;
  ticketId: number;
  onBack: () => void;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};

function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}

function fileIcon(mime: string): string {
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  return "📎";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Remove Attachment Modal ────────────────────────────────
interface RemoveModalProps {
  attachment: Attachment;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

function RemoveModal({ attachment, onConfirm, onClose }: RemoveModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(trimmed);
    } catch (e: any) {
      setError(e.message ?? "Failed to remove attachment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="remove-modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" id="remove-modal-title">Remove Attachment</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close" id="btn-modal-close">×</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            You are about to remove <strong style={{ color: "var(--color-text-primary)" }}>{attachment.filename}</strong>.
            This action cannot be undone.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="textarea-remove-reason">
              Reason <span className="required">*</span>
              <span style={{ fontSize: 11, color: "var(--color-text-disabled)", fontWeight: 400, marginLeft: 6 }}>
                min. 10 characters
              </span>
            </label>
            <textarea
              id="textarea-remove-reason"
              className={`form-control${error ? " error" : ""}`}
              placeholder="Explain why this file should be removed…"
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              disabled={loading}
            />
            {error && <span className="form-error">⚠ {error}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <button
            id="btn-modal-cancel"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="btn-modal-confirm-remove"
            className="btn btn-sm"
            style={{ background: "var(--color-error)", color: "white", border: "none", fontWeight: 600, borderRadius: "var(--radius-md)", padding: "var(--space-1) var(--space-4)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Removing…" : "Confirm Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function TicketDetailPage({ requesterId, ticketId, onBack }: Props) {
  const [ticket,   setTicket]   = useState<TicketDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [removing, setRemoving] = useState<Attachment | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    load();
  }, [requesterId, ticketId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTicketById(requesterId, ticketId);
      setTicket(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(reason: string) {
    if (!removing) return;
    await deleteAttachment(requesterId, removing.id, reason);
    setRemoving(null);
    setSuccessMsg(`Attachment "${removing.filename}" removed.`);
    setTimeout(() => setSuccessMsg(""), 4000);
    await load();
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ height: 28, width: 280, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: 180 }} />
          </div>
        </div>
        <div className="detail-layout">
          <div className="card" style={{ padding: "var(--space-6)" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ marginBottom: "var(--space-5)" }}>
                <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: "70%" }} />
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <div className="skeleton" style={{ height: 12, width: 100, marginBottom: "var(--space-4)" }} />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, marginBottom: "var(--space-2)", borderRadius: "var(--radius-md)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
        <div className="alert alert-error">⚠ {error}</div>
      </div>
    );
  }

  if (!ticket) return null;

  const activeAttachments = ticket.attachments?.filter((a) => !a.deletedAt) ?? [];

  // Extract Related System & Priority if formatted into description
  const systemMatch = ticket.description.match(/\[Related System:\s*([^\]]+)\]/);
  const priorityMatch = ticket.description.match(/\[Priority:\s*([^\]]+)\]/);
  const cleanDescription = ticket.description
    .replace(/\[Related System:\s*[^\]]+\]\s*/g, "")
    .replace(/\[Priority:\s*[^\]]+\]\s*/g, "")
    .trim();

  const relatedSystem = systemMatch ? systemMatch[1] : "Corporate Laptop";
  const requestedPriority = priorityMatch ? priorityMatch[1] : "Medium";

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            id="btn-back-to-list"
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ marginBottom: "var(--space-3)" }}
          >
            ← My Tickets
          </button>
          <h1 style={{ fontSize: 22, maxWidth: 700 }}>{ticket.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <StatusBadge status={ticket.status} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              Ticket #{ticket.id}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
              {ticket.category.name}
            </span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="alert alert-success" id="detail-success-banner">{successMsg}</div>
      )}

      {/* Detail Layout */}
      <div className="detail-layout">

        {/* Left — Ticket Details */}
        <div className="card">
          <div className="card-body">
            <p className="detail-section-title">Ticket Information</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Category</span>
                <span className="detail-field-value">{ticket.category.name}</span>
              </div>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Related System</span>
                <span className="detail-field-value">{relatedSystem}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Status</span>
                <span className="detail-field-value"><StatusBadge status={ticket.status} /></span>
              </div>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Requested Priority</span>
                <span className="detail-field-value">
                  <span className={`badge badge-priority-${requestedPriority}`}>{requestedPriority}</span>
                </span>
              </div>
            </div>

            <div className="detail-field">
              <span className="detail-field-label">Description</span>
              <span className="detail-field-value" style={{ whiteSpace: "pre-wrap" }}>{cleanDescription || ticket.description}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)" }}>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Created</span>
                <span className="detail-field-value">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="detail-field" style={{ marginBottom: 0 }}>
                <span className="detail-field-label">Last Updated</span>
                <span className="detail-field-value">{formatDateTime(ticket.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Right — Attachments */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
              Attachments
            </h2>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {activeAttachments.length} file{activeAttachments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="card-body">
            {activeAttachments.length === 0 ? (
              <div className="empty-state" style={{ padding: "var(--space-8) var(--space-4)" }}>
                <div className="empty-icon">📎</div>
                <div className="empty-title" style={{ fontSize: 14 }}>No attachments</div>
                <div className="empty-desc" style={{ fontSize: 13 }}>
                  No files were attached to this ticket.
                </div>
              </div>
            ) : (
              activeAttachments.map((att) => (
                <div key={att.id} className="attachment-card" id={`attachment-card-${att.id}`}>
                  <div className="attachment-icon">{fileIcon(att.mimeType)}</div>
                  <div className="attachment-info">
                    <div className="attachment-name" title={att.filename}>{att.filename}</div>
                    <div className="attachment-size">{formatBytes(att.sizeBytes)}</div>
                  </div>
                  <div className="attachment-actions">
                    <a
                      id={`btn-download-${att.id}`}
                      href={getDownloadUrl(att.id)}
                      className="btn btn-secondary btn-sm"
                      download={att.filename}
                    >
                      ↓ Download
                    </a>
                    <button
                      id={`btn-remove-${att.id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => setRemoving(att)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Remove Modal */}
      {removing && (
        <RemoveModal
          attachment={removing}
          onConfirm={handleRemove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
