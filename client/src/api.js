// -----------------------------------------------------------------------
// TokTickIT API Client — Lab 2
// All /api/* calls go through Vite proxy → http://localhost:3000
// -----------------------------------------------------------------------
// For server-side absolute URLs only (e.g. download links in <a href>)
const rawUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_BASE = rawUrl.replace(/["']/g, "").replace(/\/+$/, "");
export function formatTicketNumber(id, createdAt) {
    const year = createdAt ? new Date(createdAt).getFullYear() : 2026;
    return `TKT-${year}-${String(id).padStart(6, "0")}`;
}
// ── Helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, requesterId, options = {}) {
    // Use relative path to go through Vite proxy — avoids CORS
    const res = await fetch(path, {
        ...options,
        headers: {
            "X-Requester-Id": String(requesterId),
            ...(options.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}
// ── Lab 1 ──────────────────────────────────────────────────────────────
export async function checkSystem() {
    let healthRes;
    try {
        healthRes = await fetch("/api/health");
    }
    catch {
        throw new Error("Cannot connect to the server. Please make sure the server is running.");
    }
    if (!healthRes.ok) {
        throw new Error(`Server responded with status ${healthRes.status}.`);
    }
    const categoriesRes = await fetch("/api/categories");
    if (!categoriesRes.ok) {
        throw new Error(`Categories fetch failed with status ${categoriesRes.status}.`);
    }
    const categories = await categoriesRes.json();
    return { online: true, categories };
}
// ── Feature D — Requesters ─────────────────────────────────────────────
export async function fetchRequesters() {
    const res = await fetch("/api/requesters");
    if (!res.ok)
        throw new Error(`Failed to fetch requesters: HTTP ${res.status}`);
    return res.json();
}
export async function fetchCategories() {
    const res = await fetch("/api/categories");
    if (!res.ok)
        throw new Error(`Failed to fetch categories: HTTP ${res.status}`);
    return res.json();
}
// ── Feature E — Create Ticket ──────────────────────────────────────────
export async function createTicket(requesterId, data) {
    let res;
    try {
        res = await fetch("/api/tickets", {
            method: "POST",
            headers: { "X-Requester-Id": String(requesterId) },
            body: data,
        });
    }
    catch {
        throw new Error("Cannot connect to server. Please try again.");
    }
    if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
            throw new Error("Cannot connect to server. Please try again.");
        }
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}
// ── Feature F — My Tickets ─────────────────────────────────────────────
export async function fetchTickets(requesterId, params = {}) {
    const q = new URLSearchParams();
    if (params.search)
        q.set("search", params.search);
    if (params.status)
        q.set("status", params.status);
    if (params.categoryId)
        q.set("categoryId", params.categoryId);
    if (params.sortBy)
        q.set("sortBy", params.sortBy);
    if (params.sortOrder)
        q.set("sortOrder", params.sortOrder);
    if (params.page)
        q.set("page", String(params.page));
    if (params.limit)
        q.set("limit", String(params.limit));
    return apiFetch(`/api/tickets?${q.toString()}`, requesterId);
}
export async function fetchTicketById(requesterId, ticketId) {
    return apiFetch(`/api/tickets/${ticketId}`, requesterId);
}
// ── Feature G — Attachments ────────────────────────────────────────────
export async function uploadAttachments(requesterId, ticketId, files) {
    const fd = new FormData();
    files.forEach((f) => fd.append("attachments", f));
    const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: { "X-Requester-Id": String(requesterId) },
        body: fd,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}
export async function deleteAttachment(requesterId, attachmentId, reason) {
    await apiFetch(`/api/attachments/${attachmentId}`, requesterId, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
    });
}
export function getDownloadUrl(attachmentId) {
    return `${API_BASE}/api/attachments/${attachmentId}/download`;
}
