// -----------------------------------------------------------------------
// TokTickIT API Client — Lab 3
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

export type UserRole = "Requester" | "IT_Staff" | "Administrator";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}

/** @deprecated Lab 2 only — removed in Lab 3 (BR-15) */
export interface Requester {
  id: number;
  name: string;
  email: string;
  department: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type ItPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  categoryId: number;
  requesterId: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  _count?: { attachments: number };
}

/** Lab 3 Ticket as returned by IT Staff queue */
export interface Lab3Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  category: Category;
  status: TicketStatus;
  itPriority: ItPriority | null;
  assignedStaff: { id: number; name: string } | null;
  requester: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PublicComment {
  id: number;
  author: { id: number; name: string; role: UserRole };
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: number;
  author: { id: number; name: string; role: UserRole };
  content: string;
  createdAt: string;
}

export interface Lab3TicketDetail extends Lab3Ticket {
  description: string;
  attachments: Attachment[];
  publicComments: PublicComment[];
  internalNotes: InternalNote[];
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export function formatTicketNumber(id: number, createdAt?: string): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : 2026;
  return `TKT-${year}-${String(id).padStart(6, "0")}`;
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
  isActive?: boolean;
  fileSize?: number;
  downloadUrl?: string;
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

export interface Lab3TicketListResponse {
  tickets: Lab3Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Lab3TicketListParams {
  search?: string;
  status?: TicketStatus | "";
  category?: string;
  priority?: ItPriority | "";
  assigneeId?: string;
  sort?: "createdAt" | "updatedAt" | "priority";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

/** @deprecated Lab 2 helper that passes X-Requester-Id header. Use apiFetch() for Lab 3. */
async function apiFetchLegacy<T>(
  path: string,
  requesterId: number,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: "include",
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

// ── Feature D — Requesters (Lab 2 only) ───────────────────────────────

/** @deprecated Use authApi.getMe() instead */
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

// ── Lab 3 — Authentication API ─────────────────────────────────────────

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    return apiFetch<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },

  async getMe(): Promise<AuthUser> {
    return apiFetch<AuthUser>("/api/auth/me");
  },

  async changePassword(newPassword: string, confirmPassword: string): Promise<void> {
    await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword, confirmPassword }),
    });
  },
};

// ── Lab 3 — IT Staff API ───────────────────────────────────────────────

export const itStaffApi = {
  async getTickets(params: Lab3TicketListParams = {}): Promise<Lab3TicketListResponse> {
    const q = new URLSearchParams();
    if (params.search)     q.set("search",     params.search);
    if (params.status)     q.set("status",     params.status);
    if (params.category)   q.set("category",   params.category);
    if (params.priority)   q.set("priority",   params.priority);
    if (params.assigneeId) q.set("assigneeId", params.assigneeId);
    if (params.sort)       q.set("sort",       params.sort);
    if (params.order)      q.set("order",      params.order);
    if (params.page)       q.set("page",       String(params.page));
    if (params.limit)      q.set("limit",      String(params.limit));
    return apiFetch<Lab3TicketListResponse>(`/api/it-staff/tickets?${q.toString()}`);
  },

  async getTicketById(id: number): Promise<Lab3TicketDetail> {
    return apiFetch<Lab3TicketDetail>(`/api/it-staff/tickets/${id}`);
  },

  async patchTicket(
    id: number,
    data: { assignedStaffId?: number | null; itPriority?: ItPriority; status?: TicketStatus }
  ): Promise<{ message: string }> {
    return apiFetch(`/api/it-staff/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async claimTicket(id: number): Promise<{ message: string; assignedStaff: { id: number; name: string } }> {
    return apiFetch(`/api/it-staff/tickets/${id}/claim`, { method: "POST" });
  },

  async addNote(ticketId: number, content: string): Promise<{ note: InternalNote }> {
    return apiFetch(`/api/it-staff/tickets/${ticketId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};

// ── Lab 3 — Comments API ───────────────────────────────────────────────

export const commentsApi = {
  async getComments(ticketId: number): Promise<{ comments: PublicComment[] }> {
    return apiFetch(`/api/tickets/${ticketId}/comments`);
  },

  async addComment(ticketId: number, content: string): Promise<{ comment: PublicComment }> {
    return apiFetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  async resolveTicket(ticketId: number): Promise<{ message: string; status: string }> {
    return apiFetch(`/api/tickets/${ticketId}/resolve`, { method: "POST" });
  },
};

// ── Lab 3 — Admin API ──────────────────────────────────────────────────

export const adminApi = {
  async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}): Promise<AdminUserListResponse> {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.role)   q.set("role",   params.role);
    if (params.status) q.set("status", params.status);
    if (params.page)   q.set("page",   String(params.page));
    if (params.limit)  q.set("limit",  String(params.limit));
    return apiFetch<AdminUserListResponse>(`/api/admin/users?${q.toString()}`);
  },

  async createUser(data: { name: string; email: string; role: UserRole; password: string }): Promise<{ user: AdminUser }> {
    return apiFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: number, data: { name?: string; email?: string; role?: UserRole }): Promise<{ user: AdminUser }> {
    return apiFetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async toggleActive(id: number): Promise<{ message: string; isActive: boolean }> {
    return apiFetch(`/api/admin/users/${id}/toggle-active`, { method: "PATCH" });
  },

  async resetPassword(id: number, newPassword: string): Promise<{ message: string }> {
    return apiFetch(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },
};

// ── Feature E — Create Ticket (Lab 2 — Requester) ─────────────────────

export async function createTicket(requesterId: number, data: FormData): Promise<Ticket> {
  let res: Response;
  try {
    res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "X-Requester-Id": String(requesterId) },
      body: data,
    });
  } catch {
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

// ── Feature F — My Tickets (Lab 2 — Requester) ────────────────────────

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

  return apiFetchLegacy<TicketListResponse>(
    `/api/tickets?${q.toString()}`,
    requesterId
  );
}

export async function fetchTicketById(
  requesterId: number,
  ticketId: number
): Promise<TicketDetail> {
  return apiFetchLegacy<TicketDetail>(`/api/tickets/${ticketId}`, requesterId);
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
  await apiFetchLegacy(`/api/attachments/${attachmentId}`, requesterId, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export function getDownloadUrl(attachmentId: number): string {
  return `${API_BASE}/api/attachments/${attachmentId}/download`;
}
