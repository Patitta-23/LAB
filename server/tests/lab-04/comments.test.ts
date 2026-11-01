/**
 * Lab 4 — Branch 3: Unified Comments Endpoint Tests
 * Tests: CMT-01 … CMT-10 + /resolve endpoint (RSLV-01 … RSLV-06)
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

// ── Helpers ──────────────────────────────────────────────────────────────

async function loginAs(
  agent: ReturnType<typeof request.agent>,
  email: string,
  password: string
) {
  await agent
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);
}

// ── Setup ────────────────────────────────────────────────────────────────

let ticketId: number;
let otherTicketId: number;

// User IDs
let requesterId: number;
let otherRequesterId: number;
let itStaffId: number;
let adminId: number;

beforeEach(async () => {
  const prisma = getPrisma();
  const hash = await bcrypt.hash("Password1", 10);

  // Clean up in order of dependencies (only CMT test data)
  await prisma.publicComment.deleteMany({ where: { ticket: { title: { startsWith: "CMT " } } } });
  await prisma.internalNote.deleteMany({ where: { ticket: { title: { startsWith: "CMT " } } } });
  await prisma.lab3Ticket.deleteMany({ where: { title: { startsWith: "CMT " } } });

  // Upsert users (safe for repeated beforeEach)
  const requester = await prisma.user.upsert({
    where: { email: "cmt-test-requester@test.com" },
    update: { passwordHash: hash, role: "Requester", isActive: true },
    create: { name: "CMT Requester", email: "cmt-test-requester@test.com", passwordHash: hash, role: "Requester", isActive: true },
  });
  const otherRequester = await prisma.user.upsert({
    where: { email: "cmt-test-other@test.com" },
    update: { passwordHash: hash, role: "Requester", isActive: true },
    create: { name: "CMT OtherReq", email: "cmt-test-other@test.com", passwordHash: hash, role: "Requester", isActive: true },
  });
  const itStaff = await prisma.user.upsert({
    where: { email: "cmt-test-itstaff@test.com" },
    update: { passwordHash: hash, role: "IT_Staff", isActive: true },
    create: { name: "CMT IT Staff", email: "cmt-test-itstaff@test.com", passwordHash: hash, role: "IT_Staff", isActive: true },
  });
  const admin = await prisma.user.upsert({
    where: { email: "cmt-test-admin@test.com" },
    update: { passwordHash: hash, role: "Administrator", isActive: true },
    create: { name: "CMT Admin", email: "cmt-test-admin@test.com", passwordHash: hash, role: "Administrator", isActive: true },
  });

  requesterId = requester.id;
  otherRequesterId = otherRequester.id;
  itStaffId = itStaff.id;
  adminId = admin.id;

  // Create tickets
  const category = await prisma.category.findFirst();
  const catId = category?.id ?? 1;

  const ticket = await prisma.lab3Ticket.create({
    data: {
      title: "CMT Test Ticket",
      description: "For comment tests",
      status: "IN_PROGRESS",
      categoryId: catId,
      requesterId: requester.id,
    },
  });
  const otherTicket = await prisma.lab3Ticket.create({
    data: {
      title: "CMT Other Ticket",
      description: "Belongs to other requester",
      status: "IN_PROGRESS",
      categoryId: catId,
      requesterId: otherRequester.id,
    },
  });

  ticketId = ticket.id;
  otherTicketId = otherTicket.id;
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/tickets/:id/comments
// ─────────────────────────────────────────────────────────────────────────

describe("POST /api/tickets/:id/comments", () => {
  it("CMT-01: IT Staff adds Public Comment → 201, type=PUBLIC", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "Public update from IT Staff", type: "PUBLIC" })
      .expect(201);

    expect(res.body.comment).toMatchObject({
      content: "Public update from IT Staff",
      type: "PUBLIC",
    });
    expect(res.body.comment.author.role).toBe("IT_Staff");
  });

  it("CMT-02: IT Staff adds Internal Note → 201, type=INTERNAL", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "Internal note for team", type: "INTERNAL" })
      .expect(201);

    expect(res.body.comment).toMatchObject({
      content: "Internal note for team",
      type: "INTERNAL",
    });
  });

  it("CMT-03: Requester adds Public Comment on own ticket → 201", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "User comment on own ticket", type: "PUBLIC" })
      .expect(201);

    expect(res.body.comment).toMatchObject({
      content: "User comment on own ticket",
      type: "PUBLIC",
    });
    expect(res.body.comment.author.role).toBe("Requester");
  });

  it("CMT-04: Requester attempts Internal Note → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "Trying to post internal note", type: "INTERNAL" })
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("CMT-09: Empty content → 422 VALIDATION_ERROR", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "   ", type: "PUBLIC" })
      .expect(422);

    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("CMT-10: Ticket not found → 404 NOT_FOUND", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .post("/api/tickets/999999/comments")
      .send({ content: "Ghost comment", type: "PUBLIC" })
      .expect(404);

    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("Requester commenting on another's ticket → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${otherTicketId}/comments`)
      .send({ content: "Snooping", type: "PUBLIC" })
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("Unauthenticated POST → 401", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "No auth", type: "PUBLIC" })
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/tickets/:id/comments
// ─────────────────────────────────────────────────────────────────────────

describe("GET /api/tickets/:id/comments", () => {
  beforeEach(async () => {
    // Seed one public comment + one internal note
    const prisma = getPrisma();
    await prisma.publicComment.create({
      data: { ticketId, authorId: itStaffId, content: "Visible public comment" },
    });
    await prisma.internalNote.create({
      data: { ticketId, authorId: itStaffId, content: "Secret internal note" },
    });
  });

  it("CMT-05: IT Staff GET comments → sees PUBLIC + INTERNAL", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .get(`/api/tickets/${ticketId}/comments`)
      .expect(200);

    const types = res.body.comments.map((c: any) => c.type);
    expect(types).toContain("PUBLIC");
    expect(types).toContain("INTERNAL");
    expect(res.body.comments.length).toBe(2);
  });

  it("CMT-06: Requester GET own ticket comments → sees PUBLIC only (no INTERNAL)", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .get(`/api/tickets/${ticketId}/comments`)
      .expect(200);

    const types = res.body.comments.map((c: any) => c.type);
    expect(types).not.toContain("INTERNAL");
    expect(types.every((t: string) => t === "PUBLIC")).toBe(true);
    expect(res.body.comments.length).toBe(1);
  });

  it("CMT-07: Admin GET comments → sees PUBLIC + INTERNAL", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-admin@test.com", "Password1");

    const res = await agent
      .get(`/api/tickets/${ticketId}/comments`)
      .expect(200);

    const types = res.body.comments.map((c: any) => c.type);
    expect(types).toContain("PUBLIC");
    expect(types).toContain("INTERNAL");
    expect(res.body.comments.length).toBe(2);
  });

  it("CMT-08: Requester GET comments on another's ticket → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .get(`/api/tickets/${otherTicketId}/comments`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("GET comments returns chronological order", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .get(`/api/tickets/${ticketId}/comments`)
      .expect(200);

    const times = res.body.comments.map((c: any) => new Date(c.createdAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
    }
  });

  it("Unauthenticated GET → 401", async () => {
    await request(app)
      .get(`/api/tickets/${ticketId}/comments`)
      .expect(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/tickets/:id/resolve
// ─────────────────────────────────────────────────────────────────────────

describe("POST /api/tickets/:id/resolve", () => {
  it("RSLV-01: Requester resolves own IN_PROGRESS ticket → 200, status=RESOLVED", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
    expect(res.body.id).toBe(ticketId);
  });

  it("RSLV-02: IT Staff tries resolve → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RSLV-03: Admin tries resolve → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-admin@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RSLV-04: CLOSED ticket → 400 NOT_RESOLVABLE", async () => {
    const prisma = getPrisma();
    await prisma.lab3Ticket.update({ where: { id: ticketId }, data: { status: "CLOSED" } });

    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(400);

    expect(res.body.code).toBe("NOT_RESOLVABLE");
  });

  it("RSLV-04b: OPEN ticket is also resolvable → 200", async () => {
    const prisma = getPrisma();
    await prisma.lab3Ticket.update({ where: { id: ticketId }, data: { status: "OPEN" } });

    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
  });

  it("RSLV-05: IDOR — Requester resolves another's ticket → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${otherTicketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RSLV-06: Unauthenticated → 401", async () => {
    await request(app)
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(401);
  });

  it("RSLV-01b: PENDING ticket is also resolvable → 200", async () => {
    const prisma = getPrisma();
    await prisma.lab3Ticket.update({ where: { id: ticketId }, data: { status: "PENDING" } });

    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
  });

  it("RSLV-01c: RESOLVED ticket resolve again → 200 (idempotent)", async () => {
    const prisma = getPrisma();
    await prisma.lab3Ticket.update({ where: { id: ticketId }, data: { status: "RESOLVED" } });

    const agent = request.agent(app);
    await loginAs(agent, "cmt-test-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
  });
});
