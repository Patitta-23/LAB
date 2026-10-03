import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { fetchTicketById, deleteAttachment, getDownloadUrl, uploadAttachments, formatTicketNumber } from "../api";
const STATUS_LABELS = {
    OPEN: "New", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed",
};
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
function StatusBadge({ status }) {
    return _jsx("span", { className: `badge badge-${status}`, children: STATUS_LABELS[status] });
}
function fileIcon(mime) {
    if (mime === "application/pdf")
        return "📄";
    if (mime.startsWith("image/"))
        return "🖼️";
    return "📎";
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 ** 2)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
function formatDateTime(iso) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
}
function RemoveModal({ attachment, onConfirm, onClose }) {
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
        }
        catch (e) {
            setError(e.message ?? "Failed to remove attachment.");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "modal-overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "remove-modal-title", children: _jsxs("div", { className: "modal", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { className: "modal-title", id: "remove-modal-title", children: "Remove Attachment" }), _jsx("button", { className: "modal-close", onClick: onClose, "aria-label": "Close", id: "btn-modal-close", children: "\u00D7" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("p", { style: { fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }, children: ["You are about to remove ", _jsx("strong", { style: { color: "var(--color-text-primary)" }, children: attachment.filename }), ". This action cannot be undone."] }), _jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsxs("label", { className: "form-label", htmlFor: "textarea-remove-reason", children: ["Reason ", _jsx("span", { className: "required", children: "*" }), _jsx("span", { style: { fontSize: 11, color: "var(--color-text-disabled)", fontWeight: 400, marginLeft: 6 }, children: "min. 10 characters" })] }), _jsx("textarea", { id: "textarea-remove-reason", className: `form-control${error ? " error" : ""}`, placeholder: "Explain why this file should be removed\u2026", rows: 3, value: reason, onChange: (e) => { setReason(e.target.value); setError(""); }, disabled: loading }), error && _jsxs("span", { className: "form-error", children: ["\u26A0 ", error] })] })] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { id: "btn-modal-cancel", className: "btn btn-ghost btn-sm", onClick: onClose, disabled: loading, children: "Cancel" }), _jsx("button", { id: "btn-modal-confirm-remove", className: "btn btn-sm", style: { background: "var(--color-error)", color: "white", border: "none", fontWeight: 600, borderRadius: "var(--radius-md)", padding: "var(--space-1) var(--space-4)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }, onClick: handleConfirm, disabled: loading, children: loading ? "Removing…" : "Confirm Remove" })] })] }) }));
}
// ── Main ──────────────────────────────────────────────────────────────
export default function TicketDetailPage({ requesterId, ticketId, onBack }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removing, setRemoving] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef(null);
    useEffect(() => {
        load();
    }, [requesterId, ticketId]);
    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await fetchTicketById(requesterId, ticketId);
            setTicket(data);
        }
        catch (e) {
            setError(e.message ?? "Failed to load ticket.");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleRemove(reason) {
        if (!removing)
            return;
        await deleteAttachment(requesterId, removing.id, reason);
        setRemoving(null);
        setSuccessMsg(`Attachment "${removing.filename}" removed.`);
        setTimeout(() => setSuccessMsg(""), 4000);
        await load();
    }
    async function handleFileUpload(e) {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0 || !ticket)
            return;
        setUploadError("");
        const incoming = Array.from(fileList);
        const activeCount = ticket.attachments?.filter((a) => !a.deletedAt).length ?? 0;
        const remainingSlots = MAX_FILES - activeCount;
        if (remainingSlots <= 0) {
            setUploadError(`Maximum limit of ${MAX_FILES} attachments reached.`);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
            return;
        }
        const validFiles = [];
        const errs = [];
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
            if (errs.length > 0)
                setUploadError(errs.join(" "));
            if (fileInputRef.current)
                fileInputRef.current.value = "";
            return;
        }
        setUploading(true);
        try {
            await uploadAttachments(requesterId, ticket.id, validFiles);
            setSuccessMsg(`Successfully uploaded ${validFiles.length} file(s).`);
            setTimeout(() => setSuccessMsg(""), 4000);
            await load();
        }
        catch (err) {
            setUploadError(err.message ?? "Failed to upload attachments.");
        }
        finally {
            setUploading(false);
            if (fileInputRef.current)
                fileInputRef.current.value = "";
        }
    }
    if (loading) {
        return (_jsxs("div", { children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("div", { className: "skeleton", style: { height: 28, width: 280, marginBottom: 8 } }), _jsx("div", { className: "skeleton", style: { height: 14, width: 180 } })] }) }), _jsxs("div", { className: "detail-layout", children: [_jsx("div", { className: "card", style: { padding: "var(--space-6)" }, children: Array.from({ length: 4 }).map((_, i) => (_jsxs("div", { style: { marginBottom: "var(--space-5)" }, children: [_jsx("div", { className: "skeleton", style: { height: 12, width: 80, marginBottom: 8 } }), _jsx("div", { className: "skeleton", style: { height: 16, width: "70%" } })] }, i))) }), _jsxs("div", { className: "card", style: { padding: "var(--space-6)" }, children: [_jsx("div", { className: "skeleton", style: { height: 12, width: 100, marginBottom: "var(--space-4)" } }), Array.from({ length: 2 }).map((_, i) => (_jsx("div", { className: "skeleton", style: { height: 64, marginBottom: "var(--space-2)", borderRadius: "var(--radius-md)" } }, i)))] })] })] }));
    }
    if (error) {
        const isForbidden = error.toLowerCase().includes("forbidden") ||
            error.toLowerCase().includes("access denied") ||
            error.toLowerCase().includes("403");
        if (isForbidden) {
            return (_jsx("div", { style: { maxWidth: 600, margin: "var(--space-8) auto" }, children: _jsxs("div", { className: "card", style: { textAlign: "center", padding: "var(--space-8) var(--space-6)" }, children: [_jsx("div", { style: { fontSize: 52, marginBottom: "var(--space-3)" }, children: "\uD83D\uDEAB" }), _jsx("h2", { id: "forbidden-heading", style: { fontSize: 20, color: "#991b1b", marginBottom: "var(--space-2)" }, children: "Access Denied (403 Forbidden)" }), _jsx("p", { style: { color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "var(--space-5)" }, children: "You do not have permission to view this ticket. This ticket belongs to another requester." }), _jsx("button", { id: "btn-forbidden-back", className: "btn btn-secondary", onClick: onBack, children: "\u2190 Back to My Tickets" })] }) }));
        }
        return (_jsxs("div", { children: [_jsx("div", { className: "page-header", children: _jsx("button", { className: "btn btn-ghost", onClick: onBack, children: "\u2190 Back" }) }), _jsxs("div", { className: "alert alert-error", children: ["\u26A0 ", error] })] }));
    }
    if (!ticket)
        return null;
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
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("button", { id: "btn-back-to-list", className: "btn btn-ghost btn-sm", onClick: onBack, style: { marginBottom: "var(--space-3)" }, children: "\u2190 My Tickets" }), _jsx("h1", { style: { fontSize: 22, maxWidth: 700 }, children: ticket.title }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)" }, children: [_jsx(StatusBadge, { status: ticket.status }), _jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", fontFamily: "monospace" }, children: ticket.ticketNumber || formatTicketNumber(ticket.id, ticket.createdAt) }), _jsx("span", { style: { fontSize: 13, color: "var(--color-text-secondary)" }, children: ticket.category.name })] })] }) }), successMsg && (_jsx("div", { className: "alert alert-success", id: "detail-success-banner", children: successMsg })), _jsxs("div", { className: "detail-layout", children: [_jsx("div", { className: "card", children: _jsxs("div", { className: "card-body", children: [_jsx("p", { className: "detail-section-title", children: "Ticket Information" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }, children: [_jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Category" }), _jsx("span", { className: "detail-field-value", children: ticket.category.name })] }), _jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Related System" }), _jsx("span", { className: "detail-field-value", children: relatedSystem })] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }, children: [_jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Status" }), _jsx("span", { className: "detail-field-value", children: _jsx(StatusBadge, { status: ticket.status }) })] }), _jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Requested Priority" }), _jsx("span", { className: "detail-field-value", children: _jsx("span", { className: `badge badge-priority-${requestedPriority}`, children: requestedPriority }) })] })] }), _jsxs("div", { className: "detail-field", children: [_jsx("span", { className: "detail-field-label", children: "Description" }), _jsx("span", { className: "detail-field-value", style: { whiteSpace: "pre-wrap" }, children: cleanDescription || ticket.description })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)" }, children: [_jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Created" }), _jsx("span", { className: "detail-field-value", children: formatDateTime(ticket.createdAt) })] }), _jsxs("div", { className: "detail-field", style: { marginBottom: 0 }, children: [_jsx("span", { className: "detail-field-label", children: "Last Updated" }), _jsx("span", { className: "detail-field-value", children: formatDateTime(ticket.updatedAt) })] })] })] }) }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)" }, children: [_jsx("h2", { style: { fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }, children: "Attachments" }), _jsxs("span", { style: { fontSize: 12, color: "var(--color-text-secondary)" }, children: [activeAttachments.length, " / ", MAX_FILES, " files"] })] }), activeAttachments.length < MAX_FILES && (_jsx("button", { id: "btn-add-attachment", className: "btn btn-secondary btn-sm", onClick: () => fileInputRef.current?.click(), disabled: uploading, style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: uploading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner", style: { width: 12, height: 12, borderWidth: 2 } }), _jsx("span", { children: "Uploading\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "+" }), _jsx("span", { children: "Add Attachment" })] })) }))] }), uploadError && (_jsxs("div", { className: "alert alert-error", style: { margin: "var(--space-3) var(--space-4)" }, children: ["\u26A0 ", uploadError] })), _jsxs("div", { className: "card-body", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, multiple: true, accept: ".pdf,.png,.jpg,.jpeg", style: { display: "none" } }), allAttachments.length === 0 ? (_jsxs("div", { className: "empty-state", style: { padding: "var(--space-8) var(--space-4)" }, children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCCE" }), _jsx("div", { className: "empty-title", style: { fontSize: 14 }, children: "No attachments" }), _jsx("div", { className: "empty-desc", style: { fontSize: 13, marginBottom: "var(--space-3)" }, children: "No files were attached to this ticket." }), _jsx("button", { id: "btn-empty-add-attachment", className: "btn btn-secondary btn-sm", onClick: () => fileInputRef.current?.click(), disabled: uploading, style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: uploading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner", style: { width: 12, height: 12, borderWidth: 2 } }), _jsx("span", { children: "Uploading\u2026" })] })) : (_jsx("span", { children: "+ Add Attachment" })) })] })) : (allAttachments.map((att) => {
                                        const isDeleted = Boolean(att.deletedAt);
                                        return (_jsxs("div", { className: `attachment-card${isDeleted ? " attachment-deleted" : ""}`, id: `attachment-card-${att.id}`, style: {
                                                opacity: isDeleted ? 0.75 : 1,
                                                background: isDeleted ? "var(--color-bg-secondary)" : undefined,
                                            }, children: [_jsx("div", { className: "attachment-icon", children: fileIcon(att.mimeType) }), _jsxs("div", { className: "attachment-info", style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }, children: [_jsx("span", { className: "attachment-name", title: att.filename, style: {
                                                                        color: isDeleted ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                                                                        textDecoration: isDeleted ? "line-through" : "none",
                                                                    }, children: att.filename }), isDeleted && (_jsx("span", { className: "badge", id: `badge-removed-${att.id}`, style: {
                                                                        background: "#f3f4f6",
                                                                        color: "#6b7280",
                                                                        fontSize: 11,
                                                                        padding: "2px 8px",
                                                                        fontWeight: 600,
                                                                        borderRadius: "var(--radius-full)",
                                                                    }, children: "Removed" }))] }), _jsxs("div", { className: "attachment-size", style: { fontSize: 12, color: "var(--color-text-secondary)" }, children: [formatBytes(att.sizeBytes), isDeleted && att.deleteReason && (_jsxs("span", { style: { marginLeft: 6, fontStyle: "italic", color: "#6b7280" }, children: ["\u2022 Reason: ", att.deleteReason] }))] })] }), _jsx("div", { className: "attachment-actions", children: isDeleted ? (_jsx("button", { id: `btn-download-${att.id}-disabled`, className: "btn btn-sm", disabled: true, style: {
                                                            background: "#e5e7eb",
                                                            color: "#9ca3af",
                                                            cursor: "not-allowed",
                                                            border: "none",
                                                            fontWeight: 500,
                                                        }, title: "This file was removed and cannot be downloaded", children: "\u2193 Download" })) : (_jsxs(_Fragment, { children: [_jsx("a", { id: `btn-download-${att.id}`, href: getDownloadUrl(att.id), className: "btn btn-sm", style: {
                                                                    background: "var(--color-primary)",
                                                                    color: "white",
                                                                    textDecoration: "none",
                                                                    fontWeight: 600,
                                                                    border: "none",
                                                                }, download: att.filename, children: "\u2193 Download" }), _jsx("button", { id: `btn-remove-${att.id}`, className: "btn btn-danger btn-sm", onClick: () => setRemoving(att), children: "Remove" })] })) })] }, att.id));
                                    }))] })] })] }), removing && (_jsx(RemoveModal, { attachment: removing, onConfirm: handleRemove, onClose: () => setRemoving(null) }))] }));
}
