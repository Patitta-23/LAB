import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 4 — Status Transition & IT Priority Tests", () => {
  const prisma = getPrisma();

  let itStaffAgent: ReturnType<typeof request.agent>;
  let adminAgent: ReturnType<typeof request.agent>;
  let requesterAgent: ReturnType<typeof request.agent>;

  let openTicketId: number;
  let inProgressTicketId: number;
  let pendingTicketId: number;
  let resolvedTicketId: number;
  let closedTicketId: number;

  beforeEach(async () => {
    const hash = await bcrypt.hash("Password1", 10);

    const requester = await prisma.user.upsert({
      where: { email: "alice.statustest@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: { name: "Alice StatusTest", email: "alice.statustest@toktickit.com", passwordHash: hash, role: "Requester", isActive: true },
    });

    const itStaff = await prisma.user.upsert({
      where: { email: "eve.statustest@toktickit.com" },
      update: { passwordHash: hash, role: "IT_Staff", isActive: true },
      create: { name: "Eve StatusTest", email: "eve.statustest@toktickit.com", passwordHash: hash, role: "IT_Staff", isActive: true },
    });

    await prisma.user.upsert({
      where: { email: "admin.statustest@toktickit.com" },
      update: { passwordHash: hash, role: "Administrator", isActive: true },
      create: { name: "Admin StatusTest", email: "admin.statustest@toktickit.com", passwordHash: hash, role: "Administrator", isActive: true },
    });

    const cat = await prisma.category.findFirst();
    const catId = cat?.id ?? 1;

    const makeTicket = (status: string, priority?: string) =>
      prisma.lab3Ticket.create({
        data: {
          title: `StatusTest ticket [${status}]`,
          description: "Status transition test",
          categoryId: catId,
          requesterId: requester.id,
          assignedStaffId: itStaff.id,
          status: status as "OPEN" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED",
          itPriority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined,
        },
      });

    openTicketId       = (await makeTicket("OPEN")).id;
    inProgressTicketId = (await makeTicket("IN_PROGRESS")).id;
    pendingTicketId    = (await makeTicket("PENDING")).id;
    resolvedTicketId   = (await makeTicket("RESOLVED")).id;
    closedTicketId     = (await makeTicket("CLOSED")).id;

    itStaffAgent = request.agent(app);
    await itStaffAgent.post("/api/auth/login").send({ email: "eve.statustest@toktickit.com", password: "Password1" });

    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({ email: "admin.statustest@toktickit.com", password: "Password1" });

    requesterAgent = request.agent(app);
    await requesterAgent.post("/api/auth/login").send({ email: "alice.statustest@toktickit.com", password: "Password1" });
  });

  // ── Status Transitions (Valid) ────────────────────────────────────────

  it("STS-01: OPEN → IN_PROGRESS (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("STS-02: IN_PROGRESS → PENDING (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${inProgressTicketId}/status`)
      .send({ status: "PENDING" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PENDING");
  });

  it("STS-03: IN_PROGRESS → RESOLVED (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${inProgressTicketId}/status`)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });

  it("STS-04: IN_PROGRESS → CLOSED (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${inProgressTicketId}/status`)
      .send({ status: "CLOSED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
  });

  it("STS-05: PENDING → IN_PROGRESS (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${pendingTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("STS-06: PENDING → RESOLVED (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${pendingTicketId}/status`)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });

  it("STS-07: RESOLVED → CLOSED (valid)", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${resolvedTicketId}/status`)
      .send({ status: "CLOSED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
  });

  // ── Status Transitions (Invalid) ──────────────────────────────────────

  it("STS-08: OPEN → RESOLVED (invalid transition) → 400", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "RESOLVED" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TRANSITION");
  });

  it("STS-09: OPEN → CLOSED (invalid transition) → 400", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "CLOSED" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TRANSITION");
  });

  it("STS-10: CLOSED → IN_PROGRESS (invalid — closed is terminal) → 400", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${closedTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_TRANSITION");
  });

  it("STS-11: Requester cannot change status → 403", async () => {
    const res = await requesterAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(403);
  });

  it("STS-12: Administrator cannot change status → 403", async () => {
    const res = await adminAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(403);
  });

  it("STS-13: Invalid status value → 422", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "FLYING" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("STS-14: Missing status field → 422", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({});
    expect(res.status).toBe(422);
  });

  it("STS-15: Ticket not found → 404", async () => {
    const res = await itStaffAgent
      .patch("/api/it-staff/tickets/999999/status")
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(404);
  });

  it("STS-16: Unauthenticated → 401", async () => {
    const res = await request(app)
      .patch(`/api/it-staff/tickets/${openTicketId}/status`)
      .send({ status: "IN_PROGRESS" });
    expect(res.status).toBe(401);
  });

  // ── IT Priority Change ────────────────────────────────────────────────

  it("STS-17: IT Staff can change priority to HIGH", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe("HIGH");
  });

  it("STS-18: Administrator can change priority", async () => {
    const res = await adminAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
      .send({ itPriority: "CRITICAL" });
    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe("CRITICAL");
  });

  it("STS-19: Requester cannot change priority → 403", async () => {
    const res = await requesterAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(403);
  });

  it("STS-20: Invalid priority value → 422", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
      .send({ itPriority: "EXTREME" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("STS-21: Missing itPriority field → 422", async () => {
    const res = await itStaffAgent
      .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
      .send({});
    expect(res.status).toBe(422);
  });

  it("STS-22: Priority ticket not found → 404", async () => {
    const res = await itStaffAgent
      .patch("/api/it-staff/tickets/999999/priority")
      .send({ itPriority: "HIGH" });
    expect(res.status).toBe(404);
  });

  it("STS-23: All four priority values accepted", async () => {
    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    for (const p of priorities) {
      const res = await itStaffAgent
        .patch(`/api/it-staff/tickets/${openTicketId}/priority`)
        .send({ itPriority: p });
      expect(res.status).toBe(200);
      expect(res.body.itPriority).toBe(p);
    }
  });
});
