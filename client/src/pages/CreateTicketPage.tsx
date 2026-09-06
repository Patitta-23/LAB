import React, { useState, useEffect, useRef } from "react";
import { Category, fetchCategories, createTicket, Requester } from "../api";

interface Props {
  requester?: Requester | null;
  requesterId: number;
  onSuccess: (ticketId: number) => void;
  onCancel: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const RELATED_SYSTEMS = [
  "Corporate Laptop",
  "Campus Wi-Fi",
  "VPN",
  "Email",
  "LEB2 App",
  "Grade Submission App",
  "Printer",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

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

export default function CreateTicketPage({ requester, requesterId, onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title,       setTitle]       = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [relatedSystem, setRelatedSystem] = useState("Corporate Laptop");
  const [priority,      setPriority]      = useState("Medium");
  const [description, setDescription] = useState("");
  const [files,       setFiles]       = useState<File[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim())       e.title       = "Title is required.";
    if (!categoryId)         e.categoryId  = "Please select a category.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setAttachmentError("");
    const arr = Array.from(incoming);
    const valid: File[] = [];
    const newErrs: string[] = [];

    for (const f of arr) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const isAllowedExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);
      const isAllowedType = ALLOWED_TYPES.includes(f.type) || isAllowedExt;

      if (!isAllowedType) {
        newErrs.push("Unsupported file type. Only JPG, PNG, WEBP, and PDF are allowed.");
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        newErrs.push("File size exceeds 5MB.");
        continue;
      }
      valid.push(f);
    }

    const currentCount = files.length;
    if (currentCount + valid.length > MAX_FILES) {
      const allowedSlots = Math.max(0, MAX_FILES - currentCount);
      newErrs.push(`You can attach at most ${MAX_FILES} files.`);
      setFiles([...files, ...valid.slice(0, allowedSlots)]);
    } else {
      setFiles([...files, ...valid]);
    }

    if (newErrs.length > 0) {
      setAttachmentError(newErrs.join(" "));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGlobalError("");
    try {
      const fd = new FormData();
      fd.append("title",       title.trim());
      // Prepend metadata tags so Ticket Detail can preserve Related System & Requested Priority
      const formattedDescription = `[Related System: ${relatedSystem}] [Priority: ${priority}]\n\n${description.trim()}`;
      fd.append("description", formattedDescription);
      fd.append("categoryId",  categoryId);
      fd.append("relatedSystem", relatedSystem);
      fd.append("requestedPriority", priority);
      files.forEach((f) => fd.append("attachments", f));

      const ticket = await createTicket(requesterId, fd);
      onSuccess(ticket.id);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("connect") || msg.includes("502") || msg.includes("504")) {
        setGlobalError("Cannot connect to server. Please try again.");
      } else {
        setGlobalError(err.message ?? "Cannot connect to server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>New Ticket</h1>
          <p>Describe your IT issue and our team will help you out</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            id="btn-preview-api-failure"
            className="btn btn-sm"
            style={{ fontSize: "11px", padding: "4px 8px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "4px", cursor: "pointer" }}
            onClick={() => {
              setGlobalError("Cannot connect to server. Please try again.");
            }}
            title="Preview safe error callout for Report Item 5"
          >
            Preview Server Error
          </button>
          <button
            type="button"
            id="btn-preview-attachment-error"
            className="btn btn-sm"
            style={{ fontSize: "11px", padding: "4px 8px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", borderRadius: "4px", cursor: "pointer" }}
            onClick={() => {
              setAttachmentError("Unsupported file type. Only JPG, PNG, WEBP, and PDF are allowed.");
              if (files.length === 0) {
                const dummy = new File(["sample binary image content"], "wifi_error_log.png", { type: "image/png" });
                setFiles([dummy]);
              }
            }}
            title="Preview attachment error message & valid file chip for Report Item 6"
          >
            Preview File Error
          </button>
          <button
            type="button"
            id="btn-preview-busy"
            className="btn btn-sm"
            style={{ fontSize: "11px", padding: "4px 8px", background: "#e0e7ff", border: "1px solid #c7d2fe", color: "#3730a3", borderRadius: "4px", cursor: "pointer" }}
            onClick={() => {
              setSubmitting(true);
              setTimeout(() => setSubmitting(false), 5000);
            }}
            title="Preview busy submitting state for report screenshot"
          >
            Preview Busy (5s)
          </button>
          <button id="btn-cancel-create" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            ← Back
          </button>
        </div>
      </div>


      <form id="create-ticket-form" onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", maxWidth: 760 }}>

          {/* Global Error */}
          {globalError && (
            <div className="alert alert-error" id="create-ticket-error">
              ⚠ {globalError}
            </div>
          )}

          {/* Main Fields Card */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
                Ticket Details
              </h2>
            </div>
            <div className="card-body">

              {/* Row 1: Read-Only System Context (Requester & Date) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                {/* Requester */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="input-requester">
                    Requester (Auto-populated)
                  </label>
                  <input
                    id="input-requester"
                    className="form-control form-control-readonly"
                    type="text"
                    value={requester ? `${requester.name} (${requester.department})` : "Current Requester"}
                    readOnly
                    disabled
                    title="Populated from the Development Requester selected before entering the application"
                  />
                </div>

                {/* Ticket Date */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="input-ticket-date">
                    Ticket Date
                  </label>
                  <input
                    id="input-ticket-date"
                    className="form-control form-control-readonly"
                    type="text"
                    value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-title">
                  Title (Summary) <span className="required">*</span>
                </label>
                <input
                  id="input-title"
                  className={`form-control${errors.title ? " error" : ""}`}
                  type="text"
                  placeholder="Brief description of the issue"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((prev) => ({ ...prev, title: "" })); }}
                  disabled={submitting}
                />
                {errors.title && <span className="form-error">⚠ {errors.title}</span>}
              </div>

              {/* Row 2: Category, Related System, Requested Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                {/* Category */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="select-category">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="select-category"
                    className={`form-control${errors.categoryId ? " error" : ""}`}
                    value={categoryId}
                    onChange={(e) => { setCategoryId(e.target.value); setErrors((prev) => ({ ...prev, categoryId: "" })); }}
                    disabled={submitting}
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <span className="form-error">⚠ {errors.categoryId}</span>}
                </div>

                {/* Related System */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="select-related-system">
                    Related System
                  </label>
                  <select
                    id="select-related-system"
                    className="form-control"
                    value={relatedSystem}
                    onChange={(e) => setRelatedSystem(e.target.value)}
                    disabled={submitting}
                  >
                    {RELATED_SYSTEMS.map((sys) => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                </div>

                {/* Requested Priority */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="select-priority">
                    Requested Priority
                  </label>
                  <select
                    id="select-priority"
                    className="form-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={submitting}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="textarea-description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="textarea-description"
                  className={`form-control${errors.description ? " error" : ""}`}
                  placeholder="Please describe the issue in detail — include steps to reproduce, error messages, etc."
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: "" })); }}
                  rows={5}
                  disabled={submitting}
                />
                {errors.description && <span className="form-error">⚠ {errors.description}</span>}
              </div>
            </div>
          </div>


          {/* Attachments Card */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
                Attachments
              </h2>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {files.length}/{MAX_FILES} files
              </span>
            </div>
            <div className="card-body">
              {/* Drop Zone */}
              {files.length < MAX_FILES && (
                <div
                  id="upload-zone"
                  className={`upload-zone${dragOver ? " drag-over" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    addFiles(e.dataTransfer.files);
                  }}
                >
                  <div className="upload-zone-icon">📁</div>
                  <div className="upload-zone-text">
                    <strong>Click to browse</strong> or drag & drop files here
                  </div>
                  <div className="upload-zone-hint">
                    JPEG, PNG, WebP, PDF — max 5 MB each, up to {MAX_FILES} files
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="input-file-upload"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </div>
              )}

              {/* Attachment Error Message */}
              {attachmentError && (
                <div
                  id="attachment-error-msg"
                  className="form-error"
                  style={{
                    marginTop: "var(--space-2)",
                    padding: "8px 12px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "var(--radius-md)",
                    color: "#991b1b",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>⚠</span>
                  <span>{attachmentError}</span>
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="file-list" style={{ marginTop: files.length < MAX_FILES ? "var(--space-3)" : 0 }}>
                  {files.map((f, i) => (
                    <div key={i} className="file-chip" id={`file-chip-${i}`}>
                      <span>{fileIcon(f.type)}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.7, marginRight: 4 }}>{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        className="file-chip-remove"
                        onClick={() => setConfirmRemoveIndex(i)}
                        aria-label={`Remove ${f.name}`}
                        id={`btn-remove-file-${i}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", alignItems: "center" }}>
            <button
              type="button"
              id="btn-cancel-submit"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-ticket"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              aria-busy={submitting}
              style={{ minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {submitting ? (
                <>
                  <span
                    className="loading-spinner"
                    aria-hidden="true"
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255, 255, 255, 0.35)",
                      borderTopColor: "#ffffff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Submitting…</span>
                </>
              ) : (
                "Submit Ticket"
              )}
            </button>
          </div>

        </div>
      </form>

      {/* ── Confirm Remove Modal ─────────────────────────────────── */}
      {confirmRemoveIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setConfirmRemoveIndex(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Dialog box */}
          <div
            style={{
              position: "relative",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
              padding: "var(--space-8)",
              maxWidth: 400,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
              animation: "modalIn 0.18s ease",
            }}
          >
            {/* Icon */}
            <div style={{ textAlign: "center", fontSize: 40 }}>🗑️</div>

            {/* Title */}
            <div style={{ textAlign: "center" }}>
              <h2
                id="confirm-remove-title"
                style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }}
              >
                Remove Attachment?
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
                Are you sure you want to remove&nbsp;
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {files[confirmRemoveIndex]?.name}
                </strong>?
                <br />This cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <button
                id="btn-confirm-remove-cancel"
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmRemoveIndex(null)}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-remove-confirm"
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setFiles((prev) => prev.filter((_, j) => j !== confirmRemoveIndex));
                  setConfirmRemoveIndex(null);
                }}
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

