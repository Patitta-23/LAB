// -----------------------------------------------------------------------
// TokTickIT API Client — Lab 2
// All /api/* calls go through Vite proxy → http://localhost:3000
// -----------------------------------------------------------------------

// For server-side absolute URLs only (e.g. download links in <a href>)
const rawUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API_BASE = rawUrl.replace(/["']/g, "").replace(/\/+$/, "");

// ── Types ──────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface Requester {
  id: number;
  name: string;
  email: string;
  department: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  categoryId: number;
  requesterId: number;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string };
}

export interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  ticketId: number;
  createdAt: string;
  deletedAt: string | null;
  deleteReason: string | null;
}

export interface TicketDetail extends Ticket {
  attachments: Attachment[];
}

export interface TicketListResponse {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketListParams {
  search?: string;
  status?: TicketStatus | "";
  categoryId?: string;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  requesterId: number,
  options: RequestInit = {}
): Promise<T> {
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

export async function checkSystem(): Promise<SystemStatus> {
  let healthRes: Response;
  try {
    healthRes = await fetch("/api/health");
  } catch {
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

export async function fetchRequesters(): Promise<Requester[]> {
  const res = await fetch("/api/requesters");
  if (!res.ok) throw new Error(`Failed to fetch requesters: HTTP ${res.status}`);
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error(`Failed to fetch categories: HTTP ${res.status}`);
  return res.json();
}

// ── Feature E — Create Ticket ──────────────────────────────────────────

export async function createTicket(
  requesterId: number,
  data: FormData
): Promise<Ticket> {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "X-Requester-Id": String(requesterId) },
    body: data,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Feature F — My Tickets ─────────────────────────────────────────────

export async function fetchTickets(
  requesterId: number,
  params: TicketListParams = {}
): Promise<TicketListResponse> {
  const q = new URLSearchParams();
  if (params.search)     q.set("search",     params.search);
  if (params.status)     q.set("status",     params.status);
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.sortBy)     q.set("sortBy",     params.sortBy);
  if (params.sortOrder)  q.set("sortOrder",  params.sortOrder);
  if (params.page)       q.set("page",       String(params.page));
  if (params.limit)      q.set("limit",      String(params.limit));

  return apiFetch<TicketListResponse>(
    `/api/tickets?${q.toString()}`,
    requesterId
  );
}

export async function fetchTicketById(
  requesterId: number,
  ticketId: number
): Promise<TicketDetail> {
  return apiFetch<TicketDetail>(`/api/tickets/${ticketId}`, requesterId);
}

// ── Feature G — Attachments ────────────────────────────────────────────

export async function uploadAttachments(
  requesterId: number,
  ticketId: number,
  files: File[]
): Promise<Attachment[]> {
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

export async function deleteAttachment(
  requesterId: number,
  attachmentId: number,
  reason: string
): Promise<void> {
  await apiFetch(`/api/attachments/${attachmentId}`, requesterId, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function getDownloadUrl(attachmentId: number): string {
  return `${API_BASE}/api/attachments/${attachmentId}/download`;
}
