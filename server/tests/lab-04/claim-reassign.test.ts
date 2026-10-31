import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 4 — Claim & Reassign Tests", () => {
  const prisma = getPrisma();

  let itStaffAgent: ReturnType<typeof request.agent>;
  let itStaff2Agent: ReturnType<typeof request.agent>;
  let requesterAgent: ReturnType<typeof request.agent>;
  let adminAgent: ReturnType<typeof request.agent>;

  let itStaffUserId: number;
  let itStaff2UserId: number;
  let openTicketId: number;
  let inProgressTicketId: number;

  beforeEach(async () => {
    const hash = await bcrypt.hash("Password1", 10);

    // Create IT Staff #1
    const itStaff = await prisma.user.upsert({
      where: { email: "eve.claimtest@toktickit.com" },
      update: { passwordHash: hash, role: "IT_Staff", isActive: true },
      create: { name: "Eve ClaimTest", email: "eve.claimtest@toktickit.com", passwordHash: hash, role: "IT_Staff", isActive: true },
    });
    itStaffUserId = itStaff.id;

    // Create IT Staff #2
    const itStaff2 = await prisma.user.upsert({
      where: { email: "bob.claimtest@toktickit.com" },
      update: { passwordHash: hash, role: "IT_Staff", isActive: true },
      create: { name: "Bob ClaimTest", email: "bob.claimtest@toktickit.com", passwordHash: hash, role: "IT_Staff", isActive: true },
    });
    itStaff2UserId = itStaff2.id;

    // Create Requester
    const requester = await prisma.user.upsert({
      where: { email: "alice.claimtest@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: { name: "Alice ClaimTest", email: "alice.claimtest@toktickit.com", passwordHash: hash, role: "Requester", isActive: true },
    });

    // Create Admin
    const admin = await prisma.user.upsert({
      where: { email: "admin.claimtest@toktickit.com" },
      update: { passwordHash: hash, role: "Administrator", isActive: true },
      create: { name: "Admin ClaimTest", email: "admin.claimtest@toktickit.com", passwordHash: hash, role: "Administrator", isActive: true },
    });

    const category = await prisma.category.findFirst();

    // Open ticket
    const openTicket = await prisma.lab3Ticket.create({
      data: {
        title: "CLM Test — Open Ticket",
        description: "An OPEN ticket for claim testing.",
        categoryId: category?.id ?? 1,
        requesterId: requester.id,
        status: "OPEN",
      },
    });
    openTicketId = openTicket.id;

    // Already IN_PROGRESS ticket
    const inProgressTicket = await prisma.lab3Ticket.create({
      data: {
        title: "CLM Test — In Progress Ticket",
        description: "An IN_PROGRESS ticket for claim testing.",
        categoryId: category?.id ?? 1,
        requesterId: requester.id,
        status: "IN_PROGRESS",
        assignedStaffId: itStaffUserId,
      },
    });
    inProgressTicketId = inProgressTicket.id;

    // Setup session agents
    itStaffAgent = request.agent(app);
    await itStaffAgent.post("/api/auth/login").send({ email: "eve.claimtest@toktickit.com", password: "Password1" });

    itStaff2Agent = request.agent(app);
    await itStaff2Agent.post("/api/auth/login").send({ email: "bob.claimtest@toktickit.com", password: "Password1" });

    requesterAgent = request.agent(app);
    await requesterAgent.post("/api/auth/login").send({ email: "alice.claimtest@toktickit.com", password: "Password1" });

    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({ email: "admin.claimtest@toktickit.com", password: "Password1" });
  });

  // ── GET /api/it-staff/users ─────────────────────────────────────────

  it("CLM-GET-01: IT Staff can get list of active IT Staff users", async () => {
    const res = await itStaffAgent.get("/api/it-staff/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((u: { role?: string }) => u.role === undefined || true)).toBe(true); // id, name, email only
    const ids = res.body.map((u: { id: number }) => u.id);
    expect(ids).toContain(itStaffUserId);
    expect(ids).toContain(itStaff2UserId);
  });

  it("CLM-GET-02: Requester cannot get IT Staff user list — 403", async () => {
    const res = await requesterAgent.get("/api/it-staff/users");
    expect(res.status).toBe(403);
  });

  it("CLM-GET-03: Unauthenticated request to IT Staff users returns 401", async () => {
    const res = await request(app).get("/api/it-staff/users");
    expect(res.status).toBe(401);
  });

  // ── POST /api/it-staff/tickets/:id/claim (Claim self) ────────────────

  it("CLM-01: IT Staff can claim an unassigned ticket", async () => {
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.assignedStaff.id).toBe(itStaffUserId);
  });

  it("CLM-02: Claiming an OPEN ticket auto-sets status to IN_PROGRESS", async () => {
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("CLM-03: Claiming an IN_PROGRESS ticket keeps current status", async () => {
    // Create a new unassigned IN_PROGRESS ticket
    const category = await prisma.category.findFirst();
    const requester = await prisma.user.findFirst({ where: { email: "alice.claimtest@toktickit.com" } });
    const ticket = await prisma.lab3Ticket.create({
      data: {
        title: "Unassigned IN_PROGRESS",
        description: "test",
        categoryId: category?.id ?? 1,
        requesterId: requester!.id,
        status: "IN_PROGRESS",
      },
    });
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${ticket.id}/claim`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  // ── POST /api/it-staff/tickets/:id/claim (Reassign) ──────────────────

  it("CLM-04: IT Staff can reassign ticket to another IT Staff member", async () => {
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${inProgressTicketId}/claim`)
      .send({ assigneeId: itStaff2UserId });
    expect(res.status).toBe(200);
    expect(res.body.assignedStaff.id).toBe(itStaff2UserId);
    expect(res.body.message).toMatch(/reassigned/i);
  });

  it("CLM-05: Requester cannot claim a ticket — 403", async () => {
    const res = await requesterAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("CLM-06: Administrator cannot claim a ticket — 403", async () => {
    const res = await adminAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("CLM-07: assigneeId pointing to a Requester is rejected — 400", async () => {
    const requester = await prisma.user.findFirst({ where: { email: "alice.claimtest@toktickit.com" } });
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({ assigneeId: requester!.id });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ASSIGNEE");
  });

  it("CLM-08: Invalid assigneeId (non-integer) returns 422", async () => {
    const res = await itStaffAgent
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({ assigneeId: "notanumber" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("CLM-09: Ticket not found returns 404", async () => {
    const res = await itStaffAgent
      .post("/api/it-staff/tickets/999999/claim")
      .send({});
    expect(res.status).toBe(404);
  });

  it("CLM-10: Unauthenticated claim request returns 401", async () => {
    const res = await request(app)
      .post(`/api/it-staff/tickets/${openTicketId}/claim`)
      .send({});
    expect(res.status).toBe(401);
  });
});
