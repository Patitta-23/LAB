import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 3 — IT Staff Ticket Queue & Workflow Tests", () => {
  const prisma = getPrisma();
  let requesterAgent: ReturnType<typeof request.agent>;
  let itStaffAgent: ReturnType<typeof request.agent>;
  let itStaffUserId: number;
  let sampleTicketId: number;

  beforeEach(async () => {
    const hash = await bcrypt.hash("Password1", 10);

    // Create test Users
    const requester = await prisma.user.upsert({
      where: { email: "alice.itstafftest@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: {
        name: "Alice Requester",
        email: "alice.itstafftest@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
      },
    });

    const itStaff = await prisma.user.upsert({
      where: { email: "eve.itstafftest@toktickit.com" },
      update: { passwordHash: hash, role: "IT_Staff", isActive: true },
      create: {
        name: "Eve IT Staff",
        email: "eve.itstafftest@toktickit.com",
        passwordHash: hash,
        role: "IT_Staff",
        isActive: true,
      },
    });

    itStaffUserId = itStaff.id;

    // Get a category
    const category = await prisma.category.findFirst();

    // Create a sample ticket
    const ticket = await prisma.lab3Ticket.create({
      data: {
        title: "Screen flickering on external monitor",
        description: "Whenever I plug in HDMI, the screen flickers randomly.",
        categoryId: category?.id ?? 1,
        requesterId: requester.id,
        status: "OPEN",
        itPriority: "MEDIUM",
      },
    });

    sampleTicketId = ticket.id;

    // Setup authenticated session agents
    requesterAgent = request.agent(app);
    await requesterAgent.post("/api/auth/login").send({
      email: "alice.itstafftest@toktickit.com",
      password: "Password1",
    });

    itStaffAgent = request.agent(app);
    await itStaffAgent.post("/api/auth/login").send({
      email: "eve.itstafftest@toktickit.com",
      password: "Password1",
    });
  });

  // RBAC-01: Requester cannot access IT Staff queue
  it("RBAC-01: returns 403 when a Requester tries to access IT Staff queue", async () => {
    const res = await requesterAgent.get("/api/it-staff/tickets");
    expect(res.status).toBe(403);
  });

  // IT-01: Get all tickets (IT Staff)
  it("IT-01: IT Staff can list all tickets in queue", async () => {
    const res = await itStaffAgent.get("/api/it-staff/tickets");
    expect(res.status).toBe(200);
    expect(res.body.tickets).toBeDefined();
    expect(Array.isArray(res.body.tickets)).toBe(true);
    expect(res.body.tickets.length).toBeGreaterThan(0);
  });

  // IT-02: Search tickets
  it("IT-02: filters tickets by search term", async () => {
    const res = await itStaffAgent.get("/api/it-staff/tickets?search=flickering");
    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThan(0);
    expect(res.body.tickets[0].title).toMatch(/flickering/i);
  });

  // IT-03: Filter by status
  it("IT-03: filters tickets by status", async () => {
    const res = await itStaffAgent.get("/api/it-staff/tickets?status=OPEN");
    expect(res.status).toBe(200);
    expect(res.body.tickets.every((t: any) => t.status === "OPEN")).toBe(true);
  });

  // IT-05: Claim ticket
  it("IT-05: IT Staff can claim an unassigned ticket", async () => {
    const res = await itStaffAgent.post(`/api/it-staff/tickets/${sampleTicketId}/claim`);
    expect(res.status).toBe(200);
    expect(res.body.assignedStaff).toBeDefined();
    expect(res.body.assignedStaff.id).toBe(itStaffUserId);
  });

  // IT-07 & IT-08: Status transitions
  it("IT-07 & IT-08: enforces valid status transitions (OPEN -> IN_PROGRESS is valid, OPEN -> RESOLVED is invalid)", async () => {
    // Invalid: OPEN -> RESOLVED
    const resInvalid = await itStaffAgent
      .patch(`/api/it-staff/tickets/${sampleTicketId}`)
      .send({ status: "RESOLVED" });

    expect(resInvalid.status).toBe(400);
    expect(resInvalid.body.error).toMatch(/invalid status transition/i);

    // Valid: OPEN -> IN_PROGRESS
    const resValid = await itStaffAgent
      .patch(`/api/it-staff/tickets/${sampleTicketId}`)
      .send({ status: "IN_PROGRESS" });

    expect(resValid.status).toBe(200);
    expect(resValid.body.ticket.status).toBe("IN_PROGRESS");

    // Valid: IN_PROGRESS -> RESOLVED
    const resResolved = await itStaffAgent
      .patch(`/api/it-staff/tickets/${sampleTicketId}`)
      .send({ status: "RESOLVED" });

    expect(resResolved.status).toBe(200);
    expect(resResolved.body.ticket.status).toBe("RESOLVED");
  });

  // IT-11: Set IT Priority
  it("IT-11: updates IT Priority to HIGH", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${sampleTicketId}`)
      .send({ itPriority: "HIGH" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.itPriority).toBe("HIGH");
  });

  // IT-12: Add public comment
  it("IT-12: adds a public comment visible to both Requester and IT Staff", async () => {
    const commentRes = await itStaffAgent
      .post(`/api/tickets/${sampleTicketId}/comments`)
      .send({ content: "Please try restarting the monitor." });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.comment.content).toBe("Please try restarting the monitor.");

    // Requester gets public comments
    const reqCommentsRes = await requesterAgent.get(`/api/tickets/${sampleTicketId}/comments`);
    expect(reqCommentsRes.status).toBe(200);
    expect(reqCommentsRes.body.comments.length).toBeGreaterThan(0);
  });

  // IT-13 & IT-14: Add internal note (IT only)
  it("IT-13 & IT-14: adds internal note visible in IT detail, but hidden from Requester", async () => {
    const noteRes = await itStaffAgent
      .post(`/api/it-staff/tickets/${sampleTicketId}/notes`)
      .send({ content: "Internal Note: User hardware may be damaged." });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.note.content).toBe("Internal Note: User hardware may be damaged.");

    // IT Staff detail includes internal notes
    const itDetailRes = await itStaffAgent.get(`/api/it-staff/tickets/${sampleTicketId}`);
    expect(itDetailRes.status).toBe(200);
    expect(itDetailRes.body.internalNotes).toBeDefined();
    expect(itDetailRes.body.internalNotes.length).toBeGreaterThan(0);

    // Requester cannot access /api/it-staff/tickets/:id
    const reqAccessRes = await requesterAgent.get(`/api/it-staff/tickets/${sampleTicketId}`);
    expect(reqAccessRes.status).toBe(403);
  });
});
