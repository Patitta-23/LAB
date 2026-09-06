import React, { useState, useEffect, useRef } from "react";
import { Category, fetchCategories, createTicket } from "../api";

interface Props {
  requesterId: number;
  onSuccess: (ticketId: number) => void;
  onCancel: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

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

export default function CreateTicketPage({ requesterId, onSuccess, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title,       setTitle]       = useState("");
  const [categoryId,  setCategoryId]  = useState("");
  const [description, setDescription] = useState("");
  const [files,       setFiles]       = useState<File[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [dragOver,    setDragOver]    = useState(false);
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
    const arr = Array.from(incoming);
    const valid: File[] = [];
    const newErrs: string[] = [];

    for (const f of arr) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        newErrs.push(`"${f.name}" is not an allowed file type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        newErrs.push(`"${f.name}" exceeds 5 MB limit.`);
        continue;
      }
      valid.push(f);
    }

    const combined = [...files, ...valid];
    if (combined.length > MAX_FILES) {
      setGlobalError(`You can attach at most ${MAX_FILES} files.`);
      setFiles(combined.slice(0, MAX_FILES));
    } else {
      if (newErrs.length > 0) setGlobalError(newErrs.join(" "));
      else setGlobalError("");
      setFiles(combined);
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
      fd.append("description", description.trim());
      fd.append("categoryId",  categoryId);
      files.forEach((f) => fd.append("attachments", f));

      const ticket = await createTicket(requesterId, fd);
      onSuccess(ticket.id);
    } catch (err: any) {
      setGlobalError(err.message ?? "Failed to create ticket. Please try again.");
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
        <button id="btn-cancel-create" className="btn btn-ghost" onClick={onCancel}>
          ← Back
        </button>
      </div>

      <form id="create-ticket-form" onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", maxWidth: 680 }}>

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
              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="input-title">
                  Title <span className="required">*</span>
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

              {/* Category */}
              <div className="form-group">
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
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
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
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
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
            >
              {submitting ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
