import React, { useState, useEffect, useRef } from "react";
import {
  TicketDetail, Attachment, TicketStatus, PublicComment,
  fetchTicketById, deleteAttachment, getDownloadUrl, uploadAttachments, formatTicketNumber,
  commentsApi,
} from "../api";

interface Props {
  requesterId: number;
  ticketId: number;
  onBack: () => void;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "New", IN_PROGRESS: "In Progress", PENDING: "Pending", RESOLVED: "Resolved", CLOSED: "Closed",
};

const RESOLVABLE_STATUSES: TicketStatus[] = ["IN_PROGRESS", "PENDING", "RESOLVED"];

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

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
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Comments state ─────────────────────────────────────────────────
  const [comments,       setComments]       = useState<PublicComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment,     setNewComment]     = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentError,   setCommentError]   = useState("");

  // ── Resolve state ──────────────────────────────────────────────────
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [resolving,          setResolving]           = useState(false);
  const [resolveError,       setResolveError]        = useState("");

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

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const res = await commentsApi.getComments(ticketId);
      setComments(res.comments);
    } catch {
      // Silently fail — comments are supplementary
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    if (ticketId) loadComments();
  }, [ticketId]);

  async function handleRemove(reason: string) {
    if (!removing) return;
    await deleteAttachment(requesterId, removing.id, reason);
    setRemoving(null);
    setSuccessMsg(`Attachment "${removing.filename}" removed.`);
    setTimeout(() => setSuccessMsg(""), 4000);
    await load();
  }

  async function handleAddComment() {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setCommentSending(true);
    setCommentError("");
    try {
      await commentsApi.addComment(ticketId, trimmed, "PUBLIC");
      setNewComment("");
      await loadComments();
    } catch (e: any) {
      setCommentError(e.message ?? "Failed to send comment.");
    } finally {
      setCommentSending(false);
    }
  }

  async function handleResolve() {
    setResolving(true);
    setResolveError("");
    try {
      await commentsApi.resolveTicket(ticketId);
      setShowResolveConfirm(false);
      setSuccessMsg("Ticket marked as resolved.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (e: any) {
      setResolveError(e.message ?? "Failed to resolve ticket.");
      setShowResolveConfirm(false);
    } finally {
      setResolving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !ticket) return;

    setUploadError("");
    const incoming = Array.from(fileList);
    const activeCount = ticket.attachments?.filter((a) => !a.deletedAt).length ?? 0;
    const remainingSlots = MAX_FILES - activeCount;

    if (remainingSlots <= 0) {
      setUploadError(`Maximum limit of ${MAX_FILES} attachments reached.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validFiles: File[] = [];
    const errs: string[] = [];

    for (const f of incoming) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errs.push(`"${f.name}" is not an allowed file type (allowed: PDF, PNG, JPG).`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errs.push(`"${f.name}" exceeds 5 MB limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length > remainingSlots) {
      errs.push(`You can only add up to ${remainingSlots} more file(s).`);
      validFiles.splice(remainingSlots);
    }

    if (validFiles.length === 0) {
      if (errs.length > 0) setUploadError(errs.join(" "));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await uploadAttachments(requesterId, ticket.id, validFiles);
      setSuccessMsg(`Successfully uploaded ${validFiles.length} file(s).`);
      setTimeout(() => setSuccessMsg(""), 4000);
      await load();
    } catch (err: any) {
      setUploadError(err.message ?? "Failed to upload attachments.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
    const isForbidden =
      error.toLowerCase().includes("forbidden") ||
      error.toLowerCase().includes("access denied") ||
      error.toLowerCase().includes("403");

    if (isForbidden) {
      return (
        <div style={{ maxWidth: 600, margin: "var(--space-8) auto" }}>
          <div className="card" style={{ textAlign: "center", padding: "var(--space-8) var(--space-6)" }}>
            <div style={{ fontSize: 52, marginBottom: "var(--space-3)" }}>🚫</div>
            <h2 id="forbidden-heading" style={{ fontSize: 20, color: "#991b1b", marginBottom: "var(--space-2)" }}>
              Access Denied (403 Forbidden)
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "var(--space-5)" }}>
              You do not have permission to view this ticket. This ticket belongs to another requester.
            </p>
            <button id="btn-forbidden-back" className="btn btn-secondary" onClick={onBack}>
              ← Back to My Tickets
            </button>
          </div>
        </div>
      );
    }

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

  const allAttachments = ticket.attachments ?? [];
  const activeAttachments = allAttachments.filter((a) => !a.deletedAt);

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
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", fontFamily: "monospace" }}>
              {(ticket as any).ticketNumber || formatTicketNumber(ticket.id, ticket.createdAt)}
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
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                Attachments
              </h2>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {activeAttachments.length} / {MAX_FILES} files
              </span>
            </div>
            {activeAttachments.length < MAX_FILES && (
              <button
                id="btn-add-attachment"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>Add Attachment</span>
                  </>
                )}
              </button>
            )}
          </div>
          {uploadError && (
            <div className="alert alert-error" style={{ margin: "var(--space-3) var(--space-4)" }}>
              ⚠ {uploadError}
            </div>
          )}
          <div className="card-body">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: "none" }}
            />
            {allAttachments.length === 0 ? (
              <div className="empty-state" style={{ padding: "var(--space-8) var(--space-4)" }}>
                <div className="empty-icon">📎</div>
                <div className="empty-title" style={{ fontSize: 14 }}>No attachments</div>
                <div className="empty-desc" style={{ fontSize: 13, marginBottom: "var(--space-3)" }}>
                  No files were attached to this ticket.
                </div>
                <button
                  id="btn-empty-add-attachment"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {uploading ? (
                    <>
                      <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <span>+ Add Attachment</span>
                  )}
                </button>
              </div>
            ) : (
              allAttachments.map((att) => {
                const isDeleted = Boolean(att.deletedAt);
                return (
                  <div
                    key={att.id}
                    className={`attachment-card${isDeleted ? " attachment-deleted" : ""}`}
                    id={`attachment-card-${att.id}`}
                    style={{
                      opacity: isDeleted ? 0.75 : 1,
                      background: isDeleted ? "var(--color-bg-secondary)" : undefined,
                    }}
                  >
                    <div className="attachment-icon">{fileIcon(att.mimeType)}</div>
                    <div className="attachment-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                        <span
                          className="attachment-name"
                          title={att.filename}
                          style={{
                            color: isDeleted ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                            textDecoration: isDeleted ? "line-through" : "none",
                          }}
                        >
                          {att.filename}
                        </span>
                        {isDeleted && (
                          <span
                            className="badge"
                            id={`badge-removed-${att.id}`}
                            style={{
                              background: "#f3f4f6",
                              color: "#6b7280",
                              fontSize: 11,
                              padding: "2px 8px",
                              fontWeight: 600,
                              borderRadius: "var(--radius-full)",
                            }}
                          >
                            Removed
                          </span>
                        )}
                      </div>
                      <div className="attachment-size" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {formatBytes(att.sizeBytes)}
                        {isDeleted && att.deleteReason && (
                          <span style={{ marginLeft: 6, fontStyle: "italic", color: "#6b7280" }}>
                            • Reason: {att.deleteReason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="attachment-actions">
                      {isDeleted ? (
                        <button
                          id={`btn-download-${att.id}-disabled`}
                          className="btn btn-sm"
                          disabled
                          style={{
                            background: "#e5e7eb",
                            color: "#9ca3af",
                            cursor: "not-allowed",
                            border: "none",
                            fontWeight: 500,
                          }}
                          title="This file was removed and cannot be downloaded"
                        >
                          ↓ Download
                        </button>
                      ) : (
                        <>
                          <a
                            id={`btn-download-${att.id}`}
                            href={getDownloadUrl(att.id)}
                            className="btn btn-sm"
                            style={{
                              background: "var(--color-primary)",
                              color: "white",
                              textDecoration: "none",
                              fontWeight: 600,
                              border: "none",
                            }}
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Public Comments ─────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: "var(--space-5)" }}>
        <div className="card-header">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            Comments
          </h2>
        </div>
        <div className="card-body">
          {commentsLoading ? (
            <div style={{ padding: "var(--space-4)", color: "var(--color-text-secondary)", fontSize: 14 }}>Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-6) var(--space-4)" }}>
              <div className="empty-icon">💬</div>
              <div className="empty-title" style={{ fontSize: 14 }}>No comments yet</div>
              <div className="empty-desc" style={{ fontSize: 13 }}>Be the first to leave a comment on this ticket.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  id={`comment-${c.id}`}
                  style={{
                    background: "var(--color-bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3) var(--space-4)",
                    borderLeft: "3px solid var(--color-primary)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                      {c.author.name}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div style={{ borderTop: comments.length > 0 ? "1px solid var(--color-border)" : "none", paddingTop: comments.length > 0 ? "var(--space-4)" : 0 }}>
            <div className="form-group" style={{ marginBottom: "var(--space-2)" }}>
              <label className="form-label" htmlFor="textarea-new-comment">Add a Comment</label>
              <textarea
                id="textarea-new-comment"
                className={`form-control${commentError ? " error" : ""}`}
                rows={3}
                placeholder="Write your comment here…"
                value={newComment}
                onChange={(e) => { setNewComment(e.target.value); setCommentError(""); }}
                disabled={commentSending}
              />
              {commentError && <span className="form-error">⚠ {commentError}</span>}
            </div>
            <button
              id="btn-send-comment"
              className="btn btn-primary btn-sm"
              onClick={handleAddComment}
              disabled={commentSending || !newComment.trim()}
            >
              {commentSending ? "Sending…" : "Send Comment"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Problem Appears Resolved ─────────────────────────────────── */}
      {ticket && RESOLVABLE_STATUSES.includes(ticket.status) && (
        <div
          className="card"
          style={{
            marginTop: "var(--space-4)",
            borderLeft: "4px solid var(--color-success, #16a34a)",
            padding: "var(--space-4) var(--space-5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Problem Appears Resolved?
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                If your issue has been fixed, you can mark this ticket as resolved.
              </div>
            </div>
            <button
              id="btn-problem-resolved"
              className="btn btn-sm"
              style={{ background: "#16a34a", color: "white", border: "none", fontWeight: 600, minWidth: 160, borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-4)", cursor: resolving ? "not-allowed" : "pointer", opacity: resolving ? 0.6 : 1 }}
              onClick={() => setShowResolveConfirm(true)}
              disabled={resolving}
            >
              ✓ Problem Appears Resolved
            </button>
          </div>
          {resolveError && (
            <div className="alert alert-error" style={{ marginTop: "var(--space-3)", marginBottom: 0 }}>⚠ {resolveError}</div>
          )}
        </div>
      )}

      {/* Resolve Confirm Dialog */}
      {showResolveConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="resolve-modal-title">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="resolve-modal-title">Confirm Resolution</h2>
              <button className="modal-close" onClick={() => setShowResolveConfirm(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                Are you sure the problem has been resolved? This will mark the ticket as <strong>Resolved</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button id="btn-resolve-cancel" className="btn btn-ghost btn-sm" onClick={() => setShowResolveConfirm(false)} disabled={resolving}>
                Cancel
              </button>
              <button
                id="btn-resolve-confirm"
                className="btn btn-sm"
                style={{ background: "#16a34a", color: "white", border: "none", fontWeight: 600, borderRadius: "var(--radius-md)", padding: "var(--space-1) var(--space-4)", cursor: resolving ? "not-allowed" : "pointer", opacity: resolving ? 0.6 : 1 }}
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving ? "Resolving…" : "Yes, Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}

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
