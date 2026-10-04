import React, { useState, useEffect, useCallback } from "react";
import {
  itStaffApi,
  commentsApi,
  type Lab3TicketDetail,
  type TicketStatus,
  type ItPriority,
  type PublicComment,
  type InternalNote,
} from "../api";
import { useAuth } from "../context/AuthContext";

// ── Status transition rules per BR-10 ────────────────────────────────────

const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  OPEN:        ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED", "CLOSED"],
  RESOLVED:    ["CLOSED"],
  CLOSED:      [],
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<TicketStatus, { bg: string; color: string }> = {
  OPEN:        { bg: "#EAF4FE", color: "#1A6FAC" },
  IN_PROGRESS: { bg: "#FEF9E7", color: "#D4A017" },
  RESOLVED:    { bg: "#E8F5EF", color: "#2D7A5B" },
  CLOSED:      { bg: "#F2F2F2", color: "#6B7C74" },
};

const PRIORITY_COLORS: Record<ItPriority, { bg: string; color: string }> = {
  LOW:      { bg: "#E8F5EF", color: "#2D7A5B" },
  MEDIUM:   { bg: "#FEF9E7", color: "#D4A017" },
  HIGH:     { bg: "#FDEDEC", color: "#C0392B" },
  CRITICAL: { bg: "#8E1515", color: "#FFFFFF" },
};

function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span style={{ ...styles.badge, background: bg, color }}>{text}</span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  ticketId: number;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ItTicketDetailPage({ ticketId, onBack }: Props) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Lab3TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [selectedPriority, setSelectedPriority] = useState<ItPriority | "">("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  // Comments / Notes
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [noteSending, setNoteSending] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await itStaffApi.getTicketById(ticketId);
      setTicket(t);
      setSelectedStatus(t.status);
      setSelectedPriority(t.itPriority ?? "");
      setSelectedAssigneeId(t.assignedStaff?.id != null ? String(t.assignedStaff.id) : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    setSaveMsg(null);
    setSaveError(null);
    try {
      await itStaffApi.patchTicket(ticket.id, {
        status: selectedStatus || undefined,
        itPriority: selectedPriority || undefined,
        assignedStaffId: selectedAssigneeId ? Number(selectedAssigneeId) : undefined,
      });
      setSaveMsg("Changes saved successfully.");
      await loadTicket();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleClaim = async () => {
    if (!ticket) return;
    setClaiming(true);
    try {
      await itStaffApi.claimTicket(ticket.id);
      await loadTicket();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to claim.");
    } finally {
      setClaiming(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;
    setCommentSending(true);
    try {
      await commentsApi.addComment(ticket.id, newComment.trim());
      setNewComment("");
      await loadTicket();
    } catch {
      // ignore
    } finally {
      setCommentSending(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !ticket) return;
    setNoteSending(true);
    try {
      await itStaffApi.addNote(ticket.id, newNote.trim());
      setNewNote("");
      await loadTicket();
    } catch {
      // ignore
    } finally {
      setNoteSending(false);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.centerPage}>
        <span style={styles.spinner} />
        <p style={{ color: "#6B7C74" }}>Loading ticket…</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={styles.centerPage}>
        <p style={{ color: "#C0392B" }}>⚠️ {error ?? "Ticket not found."}</p>
        <button style={styles.backBtn} onClick={onBack}>← Back to Queue</button>
      </div>
    );
  }

  const statusC = STATUS_COLORS[ticket.status];
  const priorityC = ticket.itPriority ? PRIORITY_COLORS[ticket.itPriority] : null;
  const nextStatuses = NEXT_STATUSES[ticket.status];
  const isAlreadyAssignedToMe = ticket.assignedStaff?.id === user?.id;

  return (
    <div style={styles.page}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <button style={styles.breadcrumbBtn} onClick={onBack}>Ticket Queue</button>
        <span style={styles.breadcrumbSep}>›</span>
        <span style={styles.breadcrumbCurrent}>#{ticket.ticketNumber}</span>
      </div>

      <div style={styles.twoCol}>
        {/* ── Left Column ── */}
        <div style={styles.leftCol}>
          {/* Header */}
          <div style={styles.ticketHeader}>
            <div style={styles.ticketNumRow}>
              <span style={styles.ticketNum}>#{ticket.ticketNumber}</span>
              <Badge
                text={STATUS_LABELS[ticket.status]}
                bg={statusC.bg}
                color={statusC.color}
              />
              {ticket.itPriority && priorityC && (
                <Badge
                  text={ticket.itPriority}
                  bg={priorityC.bg}
                  color={priorityC.color}
                />
              )}
            </div>
            <h1 style={styles.ticketTitle}>{ticket.title}</h1>
            <div style={styles.metaGrid}>
              <span style={styles.metaLabel}>Requester</span>
              <span style={styles.metaValue}>{ticket.requester.name}</span>
              <span style={styles.metaLabel}>Category</span>
              <span style={styles.metaValue}>{ticket.category?.name ?? "—"}</span>
              <span style={styles.metaLabel}>Created</span>
              <span style={styles.metaValue}>{formatDate(ticket.createdAt)}</span>
              <span style={styles.metaLabel}>Last Updated</span>
              <span style={styles.metaValue}>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          {/* Description */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Description</h2>
            <p style={styles.description}>{ticket.description}</p>
          </div>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Attachments</h2>
              <div style={styles.attachmentList}>
                {ticket.attachments
                  .filter((a) => a.isActive !== false && !a.deletedAt)
                  .map((a) => (
                    <div key={a.id} style={styles.attachmentRow}>
                      <span style={styles.attachIcon}>📄</span>
                      <span style={styles.attachName}>{a.filename}</span>
                      <a
                        href={a.downloadUrl ?? `/api/attachments/${a.id}/download`}
                        download
                        style={styles.downloadBtn}
                      >
                        ⬇ Download
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Public Comments */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Public Comments</h2>
            <div style={styles.commentThread}>
              {ticket.publicComments.length === 0 ? (
                <p style={styles.emptyThread}>No comments yet.</p>
              ) : (
                ticket.publicComments.map((c: PublicComment) => (
                  <div key={c.id} style={styles.commentBubble}>
                    <div style={styles.commentMeta}>
                      <strong>{c.author.name}</strong>
                      <span style={styles.commentRole}>{c.author.role.replace("_", " ")}</span>
                      <span style={styles.commentTime}>{formatDate(c.createdAt)}</span>
                    </div>
                    <p style={styles.commentContent}>{c.content}</p>
                  </div>
                ))
              )}
            </div>
            <div style={styles.addCommentRow}>
              <textarea
                id="add-public-comment"
                placeholder="Write a public comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={styles.textarea}
                rows={2}
              />
              <button
                id="send-public-comment"
                style={{ ...styles.sendBtn, opacity: commentSending ? 0.7 : 1 }}
                onClick={handleAddComment}
                disabled={commentSending || !newComment.trim()}
              >
                {commentSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>

          {/* Internal Notes (IT Staff / Admin only) */}
          <div style={{ ...styles.section, ...styles.internalSection }}>
            <h2 style={{ ...styles.sectionTitle, color: "#7C3AED" }}>
              🔒 Internal Notes <span style={styles.internalBadge}>IT Staff only</span>
            </h2>
            <div style={styles.commentThread}>
              {ticket.internalNotes.length === 0 ? (
                <p style={styles.emptyThread}>No internal notes yet.</p>
              ) : (
                ticket.internalNotes.map((n: InternalNote) => (
                  <div key={n.id} style={{ ...styles.commentBubble, borderLeft: "3px solid #7C3AED" }}>
                    <div style={styles.commentMeta}>
                      <strong>{n.author.name}</strong>
                      <span style={{ ...styles.commentRole, color: "#7C3AED" }}>{n.author.role.replace("_", " ")}</span>
                      <span style={styles.commentTime}>{formatDate(n.createdAt)}</span>
                    </div>
                    <p style={styles.commentContent}>{n.content}</p>
                  </div>
                ))
              )}
            </div>
            <div style={styles.addCommentRow}>
              <textarea
                id="add-internal-note"
                placeholder="Write an internal note (not visible to requester)…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ ...styles.textarea, borderColor: "#C4A8E8" }}
                rows={2}
              />
              <button
                id="send-internal-note"
                style={{ ...styles.sendBtn, background: "#7C3AED", opacity: noteSending ? 0.7 : 1 }}
                onClick={handleAddNote}
                disabled={noteSending || !newNote.trim()}
              >
                {noteSending ? "Sending…" : "Add Note"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div style={styles.rightCol}>
          <div style={styles.controlCard}>
            <h2 style={styles.controlTitle}>Manage Ticket</h2>

            {/* Claim */}
            {!isAlreadyAssignedToMe && (
              <button
                id="claim-ticket-btn"
                style={{ ...styles.claimBtn, opacity: claiming ? 0.7 : 1 }}
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? "Claiming…" : "🙋 Claim Ticket"}
              </button>
            )}
            {isAlreadyAssignedToMe && (
              <div style={styles.claimedBadge}>✅ Assigned to you</div>
            )}

            {/* Assignee */}
            <div style={styles.controlField}>
              <label htmlFor="assignee-select" style={styles.controlLabel}>Assignee</label>
              <select
                id="assignee-select"
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                style={styles.controlSelect}
              >
                <option value="">Unassigned</option>
                {/* Show current assignee at minimum */}
                {ticket.assignedStaff && (
                  <option value={String(ticket.assignedStaff.id)}>
                    {ticket.assignedStaff.name}
                  </option>
                )}
                {user && !ticket.assignedStaff && (
                  <option value={String(user.id)}>{user.name} (me)</option>
                )}
              </select>
            </div>

            {/* IT Priority */}
            <div style={styles.controlField}>
              <label htmlFor="priority-select" style={styles.controlLabel}>IT Priority</label>
              <select
                id="priority-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as ItPriority | "")}
                style={styles.controlSelect}
              >
                <option value="">— Not Set —</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Status */}
            <div style={styles.controlField}>
              <label htmlFor="status-select" style={styles.controlLabel}>Status</label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                style={styles.controlSelect}
              >
                {/* Current status always available */}
                <option value={ticket.status}>{STATUS_LABELS[ticket.status]} (current)</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Messages */}
            {saveMsg && (
              <div style={styles.successMsg}>✅ {saveMsg}</div>
            )}
            {saveError && (
              <div style={styles.errorMsg}>⚠️ {saveError}</div>
            )}

            {/* Save */}
            <button
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "2rem 1.25rem",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  centerPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "1rem",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #D0DED8",
    borderTopColor: "#2D7A5B",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    fontSize: "0.875rem",
    color: "#6B7C74",
  },
  breadcrumbBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#2D7A5B",
    fontWeight: 500,
    fontSize: "0.875rem",
    padding: 0,
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  breadcrumbSep: { color: "#D0DED8" },
  breadcrumbCurrent: { color: "#1A2E26", fontWeight: 600 },
  backBtn: {
    background: "none",
    border: "1px solid #D0DED8",
    borderRadius: 8,
    cursor: "pointer",
    padding: "0.5rem 1rem",
    color: "#2D7A5B",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  twoCol: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    flexWrap: "wrap" as const,
  },
  leftCol: {
    flex: "1 1 560px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  rightCol: {
    flex: "0 0 280px",
    minWidth: 240,
  },
  ticketHeader: {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D0DED8",
    padding: "1.5rem",
    boxShadow: "0 1px 6px rgba(45,122,91,0.05)",
  },
  ticketNumRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
    flexWrap: "wrap" as const,
  },
  ticketNum: {
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: "0.875rem",
    color: "#2D7A5B",
  },
  ticketTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#1A2E26",
    margin: "0 0 1rem",
    lineHeight: 1.3,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "0.4rem 0.75rem",
    fontSize: "0.875rem",
  },
  metaLabel: {
    color: "#6B7C74",
    fontWeight: 600,
  },
  metaValue: {
    color: "#1A2E26",
  },
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.65rem",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  section: {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D0DED8",
    padding: "1.25rem 1.5rem",
    boxShadow: "0 1px 6px rgba(45,122,91,0.05)",
  },
  internalSection: {
    borderColor: "#C4A8E8",
    background: "#FDFBFF",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1A2E26",
    margin: "0 0 0.75rem",
  },
  description: {
    fontSize: "0.9rem",
    color: "#1A2E26",
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  attachmentList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  attachmentRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#F4F7F5",
    borderRadius: 8,
    fontSize: "0.875rem",
  },
  attachIcon: { fontSize: "1rem" },
  attachName: { flex: 1, color: "#1A2E26", fontWeight: 500 },
  downloadBtn: {
    background: "#2D7A5B",
    color: "#fff",
    padding: "0.25rem 0.7rem",
    borderRadius: 8,
    fontSize: "0.8rem",
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  commentThread: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  commentBubble: {
    background: "#F4F7F5",
    borderRadius: 10,
    padding: "0.75rem 1rem",
    borderLeft: "3px solid #2D7A5B",
  },
  commentMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.35rem",
    fontSize: "0.8rem",
    flexWrap: "wrap" as const,
  },
  commentRole: {
    background: "#E8F5EF",
    color: "#2D7A5B",
    padding: "0.1rem 0.4rem",
    borderRadius: 10,
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  commentTime: {
    color: "#6B7C74",
    marginLeft: "auto",
  },
  commentContent: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#1A2E26",
    lineHeight: 1.5,
  },
  emptyThread: {
    color: "#6B7C74",
    fontSize: "0.875rem",
    fontStyle: "italic",
    margin: 0,
  },
  addCommentRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    padding: "0.6rem 0.75rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 10,
    fontSize: "0.875rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    resize: "vertical" as const,
    fontFamily: "'Inter', 'Outfit', sans-serif",
    lineHeight: 1.5,
  },
  sendBtn: {
    background: "#2D7A5B",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0.6rem 1.1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    whiteSpace: "nowrap" as const,
  },
  internalBadge: {
    background: "#EDE9FE",
    color: "#7C3AED",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "0.15rem 0.5rem",
    borderRadius: 10,
    marginLeft: "0.5rem",
  },
  controlCard: {
    background: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #D0DED8",
    padding: "1.25rem",
    boxShadow: "0 1px 6px rgba(45,122,91,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  controlTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1A2E26",
    margin: 0,
  },
  claimBtn: {
    background: "linear-gradient(135deg, #2D7A5B 0%, #1F5C42 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0.65rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(45,122,91,0.25)",
    fontFamily: "'Inter', 'Outfit', sans-serif",
  },
  claimedBadge: {
    background: "#E8F5EF",
    color: "#2D7A5B",
    borderRadius: 10,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    textAlign: "center" as const,
  },
  controlField: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  controlLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6B7C74",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  controlSelect: {
    padding: "0.55rem 0.75rem",
    border: "1.5px solid #D0DED8",
    borderRadius: 8,
    fontSize: "0.875rem",
    color: "#1A2E26",
    background: "#FAFCFB",
    outline: "none",
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    width: "100%",
  },
  successMsg: {
    background: "#E8F5EF",
    border: "1px solid #B8D9CB",
    color: "#2D7A5B",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  errorMsg: {
    background: "#FDEDEC",
    border: "1px solid #C0392B",
    color: "#C0392B",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  saveBtn: {
    background: "linear-gradient(135deg, #1A6FAC 0%, #155887 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0.65rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', 'Outfit', sans-serif",
    boxShadow: "0 4px 12px rgba(26,111,172,0.25)",
  },
};
