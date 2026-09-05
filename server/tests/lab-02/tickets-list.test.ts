// server/tests/lab-02/tickets-list.test.ts
// Test matrix: T-13, T-14, T-15, T-16, T-17 (AC-04)
// GET /api/tickets — data isolation, search, filter, sort, pagination
// GET /api/tickets/:id — detail, 403/404

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

const r1Tickets = [
  { id: 1, title: "VPN Issue",          status: "OPEN",        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 4, name: "Network" } },
  { id: 2, title: "Laptop broken",      status: "IN_PROGRESS", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 2, name: "Hardware" } },
  { id: 3, title: "Cannot access email",status: "OPEN",        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 1, name: "Account and Access" } },
];
const r2Tickets = [
  { id: 4, title: "Software crash",     status: "OPEN",   createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 3, name: "Software" } },
  { id: 5, title: "Printer not working",status: "CLOSED", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 2, name: "Hardware" } },
];

const findManyMock = vi.fn();
const countMock    = vi.fn();

beforeEach(() => {
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
    ticket: { findMany: findManyMock, count: countMock },
  } as any);
});

afterEach(() => { vi.restoreAllMocks(); });

describe("GET /api/tickets — data isolation (AC-04)", () => {
  it("T-13: returns only tickets belonging to the current requester", async () => {
    findManyMock.mockResolvedValue(r1Tickets);
    countMock.mockResolvedValue(3);
    const res = await request(app).get("/api/tickets").set("X-Requester-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(3);
  });

  it("T-14: different X-Requester-Id returns different ticket set", async () => {
    findManyMock.mockResolvedValueOnce(r1Tickets).mockResolvedValueOnce(r2Tickets);
    countMock.mockResolvedValueOnce(3).mockResolvedValueOnce(2);
    const res1 = await request(app).get("/api/tickets").set("X-Requester-Id", "1");
    const res2 = await request(app).get("/api/tickets").set("X-Requester-Id", "2");
    expect(res1.body.total).toBe(3);
    expect(res2.body.total).toBe(2);
  });
});

describe("GET /api/tickets — search & filter", () => {
  it("T-15: passes OR search clause to prisma for title/description", async () => {
    findManyMock.mockResolvedValue([r1Tickets[0]]);
    countMock.mockResolvedValue(1);
    await request(app).get("/api/tickets?search=vpn").set("X-Requester-Id", "1");
    expect(findManyMock.mock.calls[0][0].where).toHaveProperty("OR");
  });

  it("T-16: passes status filter to prisma query", async () => {
    findManyMock.mockResolvedValue([r1Tickets[0], r1Tickets[2]]);
    countMock.mockResolvedValue(2);
    await request(app).get("/api/tickets?status=OPEN").set("X-Requester-Id", "1");
    expect(findManyMock.mock.calls[0][0].where).toMatchObject({ status: "OPEN" });
  });
});

describe("GET /api/tickets — pagination (BR-10)", () => {
  it("T-17: returns correct pagination metadata", async () => {
    findManyMock.mockResolvedValue(r1Tickets.slice(0, 2));
    countMock.mockResolvedValue(3);
    const res = await request(app).get("/api/tickets?page=1&limit=2").set("X-Requester-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.totalPages).toBe(2);
  });

  it("T-17b: uses correct skip/take values for page=2&limit=5", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
    await request(app).get("/api/tickets?page=2&limit=5").set("X-Requester-Id", "1");
    expect(findManyMock.mock.calls[0][0].skip).toBe(5);
    expect(findManyMock.mock.calls[0][0].take).toBe(5);
  });

  it("returns 400 when X-Requester-Id is missing", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/tickets/:id", () => {
  const fullTicket = { id: 1, title: "VPN Issue", description: "Cannot connect", status: "OPEN", categoryId: 4, requesterId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), category: { id: 4, name: "Network" } };

  it("returns 200 and ticket for correct requester", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({ ticket: { findUnique: vi.fn().mockResolvedValue(fullTicket) } } as any);
    const res = await request(app).get("/api/tickets/1").set("X-Requester-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 403 when ticket belongs to different requester (BR-02)", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({ ticket: { findUnique: vi.fn().mockResolvedValue({ ...fullTicket, requesterId: 99 }) } } as any);
    const res = await request(app).get("/api/tickets/1").set("X-Requester-Id", "1");
    expect(res.status).toBe(403);
  });

  it("returns 404 when ticket does not exist", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({ ticket: { findUnique: vi.fn().mockResolvedValue(null) } } as any);
    const res = await request(app).get("/api/tickets/9999").set("X-Requester-Id", "1");
    expect(res.status).toBe(404);
  });
});
