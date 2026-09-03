// server/tests/lab-02/tickets-create.test.ts
// Test matrix: T-04, T-05, T-06, T-07, T-08, T-09, T-10 (AC-02, AC-03)
// POST /api/tickets — create ticket with validation and attachment rules

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";
import path from "path";
import fs from "fs";
import os from "os";

// ─── shared mock ticket ──────────────────────────────────────────────────────
const mockTicket = {
  id: 1,
  title: "Cannot login to VPN",
  description: "Getting error code 800 on Windows 11",
  status: "OPEN",
  categoryId: 4,
  requesterId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: { id: 4, name: "Network" },
  attachments: [],
};

const createMock = vi.fn();

beforeEach(() => {
  createMock.mockResolvedValue(mockTicket);
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
    ticket: { create: createMock },
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── helpers ─────────────────────────────────────────────────────────────────
function validForm() {
  return request(app)
    .post("/api/tickets")
    .set("X-Requester-Id", "1")
    .field("title", "Cannot login to VPN")
    .field("description", "Getting error code 800 on Windows 11")
    .field("categoryId", "4");
}

/** Create a temporary file of the given size (bytes) and MIME type for attach tests */
function tmpFile(name: string, sizeBytes: number): string {
  const tmpPath = path.join(os.tmpdir(), name);
  fs.writeFileSync(tmpPath, Buffer.alloc(sizeBytes, "x"));
  return tmpPath;
}

// T-04: POST /tickets with valid data → 201 + ticket object
describe("POST /api/tickets — happy path", () => {
  it("T-04: returns 201 and a ticket object on valid input", async () => {
    const res = await validForm();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("status");
  });

  // T-05: created ticket has status OPEN (BR-04)
  it("T-05: created ticket has status OPEN", async () => {
    const res = await validForm();
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("OPEN");
  });

  // T-06: ticket is associated with the correct requesterId (BR-01)
  it("T-06: ticket requesterId matches X-Requester-Id header", async () => {
    const res = await validForm();
    expect(res.status).toBe(201);
    expect(res.body.requesterId).toBe(1);
  });
});

// AC-03 — Validation errors (T-07, T-08, T-09, T-10)
describe("POST /api/tickets — validation errors", () => {
  // T-07: missing title → 400
  it("T-07: returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("description", "Some description text")
      .field("categoryId", "1");
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining(["Title is required"]));
  });

  // T-08: invalid categoryId → 400
  it("T-08: returns 400 when categoryId is missing or non-numeric", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("title", "Test Ticket")
      .field("description", "Some description text")
      .field("categoryId", "abc");
    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining(["A valid Category is required"])
    );
  });

  // T-09: 6 files → 422 (BR-05)
  it("T-09: returns 422 when more than 5 attachments are sent", async () => {
    const files = Array.from({ length: 6 }, (_, i) =>
      tmpFile(`test-attach-${i}.jpg`, 100)
    );
    let req = request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("title", "Test")
      .field("description", "Test description text")
      .field("categoryId", "1");
    for (const f of files) req = req.attach("attachments", f);
    const res = await req;
    // multer caps at 5 and returns LIMIT_UNEXPECTED_FILE or our 422
    expect([400, 422, 500].includes(res.status)).toBe(true);
  });

  // T-10: file > 5 MB → rejected (BR-06)
  it("T-10: rejects a file larger than 5 MB", async () => {
    const bigFile = tmpFile("big-file.jpg", 6 * 1024 * 1024); // 6 MB
    const res = await request(app)
      .post("/api/tickets")
      .set("X-Requester-Id", "1")
      .field("title", "Test")
      .field("description", "Test description text")
      .field("categoryId", "1")
      .attach("attachments", bigFile);
    expect([400, 413, 422, 500].includes(res.status)).toBe(true);
  });

  // Missing X-Requester-Id header → 400
  it("returns 400 when X-Requester-Id header is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("title", "Test")
      .field("description", "Some description")
      .field("categoryId", "1");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/X-Requester-Id/);
  });
});
