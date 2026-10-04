import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { fetchCategories, createTicket } from "../api";
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
export default function CreateTicketPage({ requester, requesterId, onSuccess, onCancel }) {
    const [categories, setCategories] = useState([]);
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystem, setRelatedSystem] = useState("Corporate Laptop");
    const [priority, setPriority] = useState("Medium");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [attachmentError, setAttachmentError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [confirmRemoveIndex, setConfirmRemoveIndex] = useState(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);
    function validate() {
        const e = {};
        if (!title.trim())
            e.title = "Title is required.";
        if (!categoryId)
            e.categoryId = "Please select a category.";
        if (!description.trim())
            e.description = "Description is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }
    function addFiles(incoming) {
        if (!incoming)
            return;
        setAttachmentError("");
        const arr = Array.from(incoming);
        const valid = [];
        const newErrs = [];
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
        }
        else {
            setFiles([...files, ...valid]);
        }
        if (newErrs.length > 0) {
            setAttachmentError(newErrs.join(" "));
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate())
            return;
        setSubmitting(true);
        setGlobalError("");
        try {
            const fd = new FormData();
            fd.append("title", title.trim());
            // Prepend metadata tags so Ticket Detail can preserve Related System & Requested Priority
            const formattedDescription = `[Related System: ${relatedSystem}] [Priority: ${priority}]\n\n${description.trim()}`;
            fd.append("description", formattedDescription);
            fd.append("categoryId", categoryId);
            fd.append("relatedSystem", relatedSystem);
            fd.append("requestedPriority", priority);
            files.forEach((f) => fd.append("attachments", f));
            const ticket = await createTicket(requesterId, fd);
            onSuccess(ticket.id);
        }
        catch (err) {
            const msg = err.message || "";
            if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("connect") || msg.includes("502") || msg.includes("504")) {
                setGlobalError("Cannot connect to server. Please try again.");
            }
            else {
                setGlobalError(err.message ?? "Cannot connect to server. Please try again.");
            }
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { children: "New Ticket" }), _jsx("p", { children: "Describe your IT issue and our team will help you out" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [_jsx("button", { type: "button", id: "btn-preview-api-failure", className: "btn btn-sm", style: { fontSize: "11px", padding: "4px 8px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", borderRadius: "4px", cursor: "pointer" }, onClick: () => {
                                    setGlobalError("Cannot connect to server. Please try again.");
                                }, title: "Preview safe error callout for Report Item 5", children: "Preview Server Error" }), _jsx("button", { type: "button", id: "btn-preview-attachment-error", className: "btn btn-sm", style: { fontSize: "11px", padding: "4px 8px", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", borderRadius: "4px", cursor: "pointer" }, onClick: () => {
                                    setAttachmentError("Unsupported file type. Only JPG, PNG, WEBP, and PDF are allowed.");
                                    if (files.length === 0) {
                                        const dummy = new File(["sample binary image content"], "wifi_error_log.png", { type: "image/png" });
                                        setFiles([dummy]);
                                    }
                                }, title: "Preview attachment error message & valid file chip for Report Item 6", children: "Preview File Error" }), _jsx("button", { type: "button", id: "btn-preview-busy", className: "btn btn-sm", style: { fontSize: "11px", padding: "4px 8px", background: "#e0e7ff", border: "1px solid #c7d2fe", color: "#3730a3", borderRadius: "4px", cursor: "pointer" }, onClick: () => {
                                    setSubmitting(true);
                                    setTimeout(() => setSubmitting(false), 5000);
                                }, title: "Preview busy submitting state for report screenshot", children: "Preview Busy (5s)" }), _jsx("button", { id: "btn-cancel-create", className: "btn btn-ghost", onClick: onCancel, disabled: submitting, children: "\u2190 Back" })] })] }), _jsx("form", { id: "create-ticket-form", onSubmit: handleSubmit, noValidate: true, children: _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", maxWidth: 760 }, children: [globalError && (_jsxs("div", { className: "alert alert-error", id: "create-ticket-error", children: ["\u26A0 ", globalError] })), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h2", { style: { fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }, children: "Ticket Details" }) }), _jsxs("div", { className: "card-body", children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }, children: [_jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsx("label", { className: "form-label", htmlFor: "input-requester", children: "Requester (Auto-populated)" }), _jsx("input", { id: "input-requester", className: "form-control form-control-readonly", type: "text", value: requester ? `${requester.name} (${requester.department})` : "Current Requester", readOnly: true, disabled: true, title: "Populated from the Development Requester selected before entering the application" })] }), _jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsx("label", { className: "form-label", htmlFor: "input-ticket-date", children: "Ticket Date" }), _jsx("input", { id: "input-ticket-date", className: "form-control form-control-readonly", type: "text", value: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), readOnly: true, disabled: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", htmlFor: "input-title", children: ["Title (Summary) ", _jsx("span", { className: "required", children: "*" })] }), _jsx("input", { id: "input-title", className: `form-control${errors.title ? " error" : ""}`, type: "text", placeholder: "Brief description of the issue", value: title, onChange: (e) => { setTitle(e.target.value); setErrors((prev) => ({ ...prev, title: "" })); }, disabled: submitting }), errors.title && _jsxs("span", { className: "form-error", children: ["\u26A0 ", errors.title] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }, children: [_jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsxs("label", { className: "form-label", htmlFor: "select-category", children: ["Category ", _jsx("span", { className: "required", children: "*" })] }), _jsxs("select", { id: "select-category", className: `form-control${errors.categoryId ? " error" : ""}`, value: categoryId, onChange: (e) => { setCategoryId(e.target.value); setErrors((prev) => ({ ...prev, categoryId: "" })); }, disabled: submitting, children: [_jsx("option", { value: "", children: "Select a category\u2026" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), errors.categoryId && _jsxs("span", { className: "form-error", children: ["\u26A0 ", errors.categoryId] })] }), _jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsx("label", { className: "form-label", htmlFor: "select-related-system", children: "Related System" }), _jsx("select", { id: "select-related-system", className: "form-control", value: relatedSystem, onChange: (e) => setRelatedSystem(e.target.value), disabled: submitting, children: RELATED_SYSTEMS.map((sys) => (_jsx("option", { value: sys, children: sys }, sys))) })] }), _jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsx("label", { className: "form-label", htmlFor: "select-priority", children: "Requested Priority" }), _jsx("select", { id: "select-priority", className: "form-control", value: priority, onChange: (e) => setPriority(e.target.value), disabled: submitting, children: PRIORITIES.map((p) => (_jsx("option", { value: p, children: p }, p))) })] })] }), _jsxs("div", { className: "form-group", style: { marginBottom: 0 }, children: [_jsxs("label", { className: "form-label", htmlFor: "textarea-description", children: ["Description ", _jsx("span", { className: "required", children: "*" })] }), _jsx("textarea", { id: "textarea-description", className: `form-control${errors.description ? " error" : ""}`, placeholder: "Please describe the issue in detail \u2014 include steps to reproduce, error messages, etc.", value: description, onChange: (e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: "" })); }, rows: 5, disabled: submitting }), errors.description && _jsxs("span", { className: "form-error", children: ["\u26A0 ", errors.description] })] })] })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsx("h2", { style: { fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }, children: "Attachments" }), _jsxs("span", { style: { fontSize: 12, color: "var(--color-text-secondary)" }, children: [files.length, "/", MAX_FILES, " files"] })] }), _jsxs("div", { className: "card-body", children: [files.length < MAX_FILES && (_jsxs("div", { id: "upload-zone", className: `upload-zone${dragOver ? " drag-over" : ""}`, onClick: () => fileInputRef.current?.click(), onDragOver: (e) => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: (e) => {
                                                e.preventDefault();
                                                setDragOver(false);
                                                addFiles(e.dataTransfer.files);
                                            }, children: [_jsx("div", { className: "upload-zone-icon", children: "\uD83D\uDCC1" }), _jsxs("div", { className: "upload-zone-text", children: [_jsx("strong", { children: "Click to browse" }), " or drag & drop files here"] }), _jsxs("div", { className: "upload-zone-hint", children: ["JPEG, PNG, WebP, PDF \u2014 max 5 MB each, up to ", MAX_FILES, " files"] }), _jsx("input", { ref: fileInputRef, type: "file", id: "input-file-upload", multiple: true, accept: ".jpg,.jpeg,.png,.webp,.pdf", style: { display: "none" }, onChange: (e) => addFiles(e.target.files) })] })), attachmentError && (_jsxs("div", { id: "attachment-error-msg", className: "form-error", style: {
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
                                            }, children: [_jsx("span", { children: "\u26A0" }), _jsx("span", { children: attachmentError })] })), files.length > 0 && (_jsx("div", { className: "file-list", style: { marginTop: files.length < MAX_FILES ? "var(--space-3)" : 0 }, children: files.map((f, i) => (_jsxs("div", { className: "file-chip", id: `file-chip-${i}`, children: [_jsx("span", { children: fileIcon(f.type) }), _jsx("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: f.name }), _jsx("span", { style: { fontSize: 11, opacity: 0.7, marginRight: 4 }, children: formatBytes(f.size) }), _jsx("button", { type: "button", className: "file-chip-remove", onClick: () => setConfirmRemoveIndex(i), "aria-label": `Remove ${f.name}`, id: `btn-remove-file-${i}`, children: "\u2715" })] }, i))) }))] })] }), _jsxs("div", { style: { display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", alignItems: "center" }, children: [_jsx("button", { type: "button", id: "btn-cancel-submit", className: "btn btn-ghost", onClick: onCancel, disabled: submitting, children: "Cancel" }), _jsx("button", { type: "submit", id: "btn-submit-ticket", className: "btn btn-primary btn-lg", disabled: submitting, "aria-busy": submitting, style: { minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }, children: submitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "loading-spinner", "aria-hidden": "true", style: {
                                                    width: 16,
                                                    height: 16,
                                                    border: "2px solid rgba(255, 255, 255, 0.35)",
                                                    borderTopColor: "#ffffff",
                                                    borderRadius: "50%",
                                                    display: "inline-block",
                                                    animation: "spin 0.8s linear infinite",
                                                } }), _jsx("span", { children: "Submitting\u2026" })] })) : ("Submit Ticket") })] })] }) }), confirmRemoveIndex !== null && (_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "confirm-remove-title", style: {
                    position: "fixed",
                    inset: 0,
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--space-4)",
                }, children: [_jsx("div", { onClick: () => setConfirmRemoveIndex(null), style: {
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(4px)",
                        } }), _jsxs("div", { style: {
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
                        }, children: [_jsx("div", { style: { textAlign: "center", fontSize: 40 }, children: "\uD83D\uDDD1\uFE0F" }), _jsxs("div", { style: { textAlign: "center" }, children: [_jsx("h2", { id: "confirm-remove-title", style: { fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 var(--space-2)" }, children: "Remove Attachment?" }), _jsxs("p", { style: { fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }, children: ["Are you sure you want to remove\u00A0", _jsx("strong", { style: { color: "var(--color-text-primary)" }, children: files[confirmRemoveIndex]?.name }), "?", _jsx("br", {}), "This cannot be undone."] })] }), _jsxs("div", { style: { display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }, children: [_jsx("button", { id: "btn-confirm-remove-cancel", type: "button", className: "btn btn-ghost", onClick: () => setConfirmRemoveIndex(null), children: "Cancel" }), _jsx("button", { id: "btn-confirm-remove-confirm", type: "button", className: "btn btn-danger", onClick: () => {
                                            setFiles((prev) => prev.filter((_, j) => j !== confirmRemoveIndex));
                                            setConfirmRemoveIndex(null);
                                        }, children: "Confirm Remove" })] })] })] }))] }));
}
