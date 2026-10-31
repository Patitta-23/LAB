/**
 * Lab 4 — Requester Actions Tests
 * Tests: RAC-01 … RAC-07
 * Specification: docs/lab-04/tests.md
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
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
}

// ── Setup ────────────────────────────────────────────────────────────────

let inProgressTicketId: number;
let pendingTicketId: number;
let closedTicketId: number;
let otherTicketId: number;

let requesterId: number;
let otherRequesterId: number;

beforeEach(async () => {
  const prisma = getPrisma();
  const hash = await bcrypt.hash("Password1", 10);

  // Clean up
  await prisma.publicComment.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.lab3Ticket.deleteMany({ where: { title: { startsWith: "RAC " } } });

  // Upsert test users
  const requester = await prisma.user.upsert({
    where: { email: "rac-requester@test.com" },
    update: { passwordHash: hash, role: "Requester", isActive: true },
    create: { name: "RAC Requester", email: "rac-requester@test.com", passwordHash: hash, role: "Requester", isActive: true },
  });

  const otherRequester = await prisma.user.upsert({
    where: { email: "rac-other@test.com" },
    update: { passwordHash: hash, role: "Requester", isActive: true },
    create: { name: "RAC Other Requester", email: "rac-other@test.com", passwordHash: hash, role: "Requester", isActive: true },
  });

  await prisma.user.upsert({
    where: { email: "rac-itstaff@test.com" },
    update: { passwordHash: hash, role: "IT_Staff", isActive: true },
    create: { name: "RAC IT Staff", email: "rac-itstaff@test.com", passwordHash: hash, role: "IT_Staff", isActive: true },
  });

  await prisma.user.upsert({
    where: { email: "rac-admin@test.com" },
    update: { passwordHash: hash, role: "Administrator", isActive: true },
    create: { name: "RAC Admin", email: "rac-admin@test.com", passwordHash: hash, role: "Administrator", isActive: true },
  });

  requesterId = requester.id;
  otherRequesterId = otherRequester.id;

  const category = await prisma.category.findFirst();
  const catId = category?.id ?? 1;

  // Tickets for test cases
  const inProgressTicket = await prisma.lab3Ticket.create({
    data: {
      title: "RAC IN_PROGRESS Ticket",
      description: "Testing resolve from IN_PROGRESS",
      status: "IN_PROGRESS",
      categoryId: catId,
      requesterId: requester.id,
    },
  });
  inProgressTicketId = inProgressTicket.id;

  const pendingTicket = await prisma.lab3Ticket.create({
    data: {
      title: "RAC PENDING Ticket",
      description: "Testing resolve from PENDING",
      status: "PENDING",
      categoryId: catId,
      requesterId: requester.id,
    },
  });
  pendingTicketId = pendingTicket.id;

  const closedTicket = await prisma.lab3Ticket.create({
    data: {
      title: "RAC CLOSED Ticket",
      description: "Testing resolve from CLOSED",
      status: "CLOSED",
      categoryId: catId,
      requesterId: requester.id,
    },
  });
  closedTicketId = closedTicket.id;

  const otherTicket = await prisma.lab3Ticket.create({
    data: {
      title: "RAC Other User Ticket",
      description: "Belongs to other requester for IDOR test",
      status: "IN_PROGRESS",
      categoryId: catId,
      requesterId: otherRequester.id,
    },
  });
  otherTicketId = otherTicket.id;
});

// ─────────────────────────────────────────────────────────────────────────
// Requester Actions (RAC-01 … RAC-07)
// ─────────────────────────────────────────────────────────────────────────

describe("Lab 4 — Requester Actions (RAC-01 … RAC-07)", () => {
  it("RAC-01: Requester resolves own IN_PROGRESS ticket → 200, status = RESOLVED", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${inProgressTicketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
    expect(res.body.id).toBe(inProgressTicketId);

    // Verify in database
    const prisma = getPrisma();
    const updated = await prisma.lab3Ticket.findUnique({ where: { id: inProgressTicketId } });
    expect(updated?.status).toBe("RESOLVED");
  });

  it("RAC-02: Requester resolves own PENDING ticket → 200, status = RESOLVED", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${pendingTicketId}/resolve`)
      .expect(200);

    expect(res.body.status).toBe("RESOLVED");
    expect(res.body.id).toBe(pendingTicketId);

    // Verify in database
    const prisma = getPrisma();
    const updated = await prisma.lab3Ticket.findUnique({ where: { id: pendingTicketId } });
    expect(updated?.status).toBe("RESOLVED");
  });

  it("RAC-03: Requester resolves CLOSED ticket → 400 NOT_RESOLVABLE", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${closedTicketId}/resolve`)
      .expect(400);

    expect(res.body.code).toBe("NOT_RESOLVABLE");
  });

  it("RAC-04: Requester resolves another user's ticket → IDOR 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${otherTicketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RAC-05: IT Staff cannot use resolve endpoint → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${inProgressTicketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RAC-06: Admin cannot use resolve endpoint → 403 FORBIDDEN", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rac-admin@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${inProgressTicketId}/resolve`)
      .expect(403);

    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("RAC-07: Unauthenticated resolve request → 401 UNAUTHENTICATED", async () => {
    const res = await request(app)
      .post(`/api/tickets/${inProgressTicketId}/resolve`)
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });
});
