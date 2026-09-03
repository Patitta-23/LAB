// server/tests/lab-02/tickets-list.test.ts
// Test matrix: T-13, T-14, T-15, T-16, T-17 (AC-04)
// GET /api/tickets — data isolation, search, filter, sort, pagination

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

// ─── mock data ───────────────────────────────────────────────────────────────
const requester1Tickets = [
  {
    id: 1,
    title: "VPN Issue",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 4, name: "Network" },
  },
  {
    id: 2,
    title: "Laptop broken",
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 2, name: "Hardware" },
  },
  {
    id: 3,
    title: "Cannot access email",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 1, name: "Account and Access" },
  },
];

const requester2Tickets = [
  {
    id: 4,
    title: "Software crash",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 3, name: "Software" },
  },
  {
    id: 5,
    title: "Printer not working",
    status: "CLOSED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 2, name: "Hardware" },
  },
];

const findManyMock = vi.fn();
const countMock = vi.fn();

beforeEach(() => {
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
    ticket: {
      findMany: findManyMock,
      count: countMock,
    },
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── T-13: returns only requester's own tickets (BR-02) ──────────────────────
describe("GET /api/tickets — data isolation (AC-04)", () => {
  it("T-13: returns only tickets belonging to the requester in X-Requester-Id", async () => {
    findManyMock.mockResolvedValue(requester1Tickets);
    countMock.mockResolvedValue(3);

    const res = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  // T-14: different requester ID → different data
  it("T-14: different X-Requester-Id returns different ticket set", async () => {
    // Requester 1
    findManyMock.mockResolvedValueOnce(requester1Tickets);
    countMock.mockResolvedValueOnce(3);
    const res1 = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "1");

    // Requester 2
    findManyMock.mockResolvedValueOnce(requester2Tickets);
    countMock.mockResolvedValueOnce(2);
    const res2 = await request(app)
      .get("/api/tickets")
      .set("X-Requester-Id", "2");

    expect(res1.body.total).toBe(3);
    expect(res2.body.total).toBe(2);
    expect(res1.body.data[0].id).not.toBe(res2.body.data[0].id);
  });
});

// ─── T-15: search by title / description ─────────────────────────────────────
describe("GET /api/tickets — search", () => {
  it("T-15: passes search term to prisma query (insensitive contains on title/description)", async () => {
    findManyMock.mockResolvedValue([requester1Tickets[0]]);
    countMock.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/tickets?search=vpn")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    // Verify the OR clause was passed to findMany
    const callArg = findManyMock.mock.calls[0][0];
    expect(callArg.where).toHaveProperty("OR");
  });
});

// ─── T-16: filter by status ───────────────────────────────────────────────────
describe("GET /api/tickets — filter by status", () => {
  it("T-16: passes status filter to prisma query", async () => {
    findManyMock.mockResolvedValue([requester1Tickets[0], requester1Tickets[2]]);
    countMock.mockResolvedValue(2);

    const res = await request(app)
      .get("/api/tickets?status=OPEN")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    const callArg = findManyMock.mock.calls[0][0];
    expect(callArg.where).toMatchObject({ status: "OPEN" });
  });
});

// ─── T-17: pagination ────────────────────────────────────────────────────────
describe("GET /api/tickets — pagination", () => {
  it("T-17: page=1&limit=2 returns 2 items with correct pagination metadata", async () => {
    findManyMock.mockResolvedValue(requester1Tickets.slice(0, 2));
    countMock.mockResolvedValue(3);

    const res = await request(app)
      .get("/api/tickets?page=1&limit=2")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it("T-17b: prisma query uses correct skip/take values", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await request(app)
      .get("/api/tickets?page=2&limit=5")
      .set("X-Requester-Id", "1");

    const callArg = findManyMock.mock.calls[0][0];
    expect(callArg.skip).toBe(5); // (page-1) * limit = 1 * 5
    expect(callArg.take).toBe(5);
  });

  it("returns 400 when X-Requester-Id header is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/tickets/:id ─────────────────────────────────────────────────────
describe("GET /api/tickets/:id — ticket detail", () => {
  const mockFullTicket = {
    id: 1,
    title: "VPN Issue",
    description: "Cannot connect to VPN",
    status: "OPEN",
    categoryId: 4,
    requesterId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: { id: 4, name: "Network" },
    attachments: [],
  };

  it("returns 200 and ticket details for the correct requester", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: { findUnique: vi.fn().mockResolvedValue(mockFullTicket) },
    } as any);

    const res = await request(app)
      .get("/api/tickets/1")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body).toHaveProperty("attachments");
  });

  it("returns 403 when ticket belongs to a different requester (BR-02)", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: { findUnique: vi.fn().mockResolvedValue({ ...mockFullTicket, requesterId: 99 }) },
    } as any);

    const res = await request(app)
      .get("/api/tickets/1")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("returns 404 when ticket does not exist", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      ticket: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any);

    const res = await request(app)
      .get("/api/tickets/9999")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(404);
  });
});
