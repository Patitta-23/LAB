/**
 * Lab 4 — RBAC Evidence Tests
 * Verifies that all Lab 4 endpoints enforce role-based access control.
 * Wrong-role requests must return 403 FORBIDDEN.
 *
 * RBAC-L4-01 … RBAC-L4-09
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

let ticketId: number;

beforeEach(async () => {
  const prisma = getPrisma();
  const hash = await bcrypt.hash("Password1", 10);

  // Clean up existing RBAC test data
  await prisma.publicComment.deleteMany({ where: { ticket: { title: { startsWith: "RBAC4 " } } } });
  await prisma.internalNote.deleteMany({ where: { ticket: { title: { startsWith: "RBAC4 " } } } });
  await prisma.lab3Ticket.deleteMany({ where: { title: { startsWith: "RBAC4 " } } });

  // Upsert users
  const requester = await prisma.user.upsert({
    where: { email: "rbac4-requester@test.com" },
    update: { passwordHash: hash, role: "Requester", isActive: true },
    create: { name: "RBAC4 Requester", email: "rbac4-requester@test.com", passwordHash: hash, role: "Requester", isActive: true },
  });
  const itStaff = await prisma.user.upsert({
    where: { email: "rbac4-itstaff@test.com" },
    update: { passwordHash: hash, role: "IT_Staff", isActive: true },
    create: { name: "RBAC4 ITStaff", email: "rbac4-itstaff@test.com", passwordHash: hash, role: "IT_Staff", isActive: true },
  });
  await prisma.user.upsert({
    where: { email: "rbac4-admin@test.com" },
    update: { passwordHash: hash, role: "Administrator", isActive: true },
    create: { name: "RBAC4 Admin", email: "rbac4-admin@test.com", passwordHash: hash, role: "Administrator", isActive: true },
  });

  const category = await prisma.category.findFirst();
  const ticket = await prisma.lab3Ticket.create({
    data: {
      title: "RBAC4 Test Ticket",
      description: "For RBAC testing",
      status: "IN_PROGRESS",
      categoryId: category?.id ?? 1,
      requesterId: requester.id,
      assignedStaffId: itStaff.id,
    },
  });
  ticketId = ticket.id;
});

// ─────────────────────────────────────────────────────────────────────────

describe("Lab 4 — RBAC Evidence Tests (RBAC-L4-01 … RBAC-L4-09)", () => {
  // RBAC-L4-01: Requester cannot claim/reassign ticket (IT_Staff only)
  it("RBAC-L4-01: POST /api/it-staff/tickets/:id/claim by Requester → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/it-staff/tickets/${ticketId}/claim`)
      .send({});

    expect(res.status).toBe(403);
  });

  // RBAC-L4-02: Admin cannot claim/reassign ticket (IT_Staff only)
  it("RBAC-L4-02: POST /api/it-staff/tickets/:id/claim by Admin → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-admin@test.com", "Password1");

    const res = await agent
      .post(`/api/it-staff/tickets/${ticketId}/claim`)
      .send({});

    expect(res.status).toBe(403);
  });

  // RBAC-L4-03: Requester cannot change ticket status (IT_Staff only)
  it("RBAC-L4-03: PATCH /api/it-staff/tickets/:id/status by Requester → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-requester@test.com", "Password1");

    const res = await agent
      .patch(`/api/it-staff/tickets/${ticketId}/status`)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(403);
  });

  // RBAC-L4-04: Admin cannot change ticket status (IT_Staff only)
  it("RBAC-L4-04: PATCH /api/it-staff/tickets/:id/status by Admin → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-admin@test.com", "Password1");

    const res = await agent
      .patch(`/api/it-staff/tickets/${ticketId}/status`)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(403);
  });

  // RBAC-L4-05: Requester cannot change IT priority (IT_Staff/Admin only)
  it("RBAC-L4-05: PATCH /api/it-staff/tickets/:id/priority by Requester → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-requester@test.com", "Password1");

    const res = await agent
      .patch(`/api/it-staff/tickets/${ticketId}/priority`)
      .send({ itPriority: "HIGH" });

    expect(res.status).toBe(403);
  });

  // RBAC-L4-06: IT Staff cannot resolve ticket (Requester only)
  it("RBAC-L4-06: POST /api/tickets/:id/resolve by IT Staff → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-itstaff@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/resolve`);

    expect(res.status).toBe(403);
  });

  // RBAC-L4-07: Requester cannot post internal note (type: INTERNAL)
  it("RBAC-L4-07: POST /api/tickets/:id/comments (type: INTERNAL) by Requester → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-requester@test.com", "Password1");

    const res = await agent
      .post(`/api/tickets/${ticketId}/comments`)
      .send({ content: "Trying internal note", type: "INTERNAL" });

    expect(res.status).toBe(403);
  });

  // RBAC-L4-08: Requester cannot fetch IT Staff users list
  it("RBAC-L4-08: GET /api/it-staff/users by Requester → 403", async () => {
    const agent = request.agent(app);
    await loginAs(agent, "rbac4-requester@test.com", "Password1");

    const res = await agent
      .get("/api/it-staff/users");

    expect(res.status).toBe(403);
  });

  // RBAC-L4-09: Unauthenticated requests are rejected with 401
  it("RBAC-L4-09: Unauthenticated request to /claim → 401", async () => {
    const res = await request(app)
      .post(`/api/it-staff/tickets/${ticketId}/claim`)
      .send({});

    expect(res.status).toBe(401);
  });
});
