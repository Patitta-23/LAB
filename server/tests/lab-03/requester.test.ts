import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 3 — Requester Integration & Resolve Ticket Tests", () => {
  const prisma = getPrisma();
  let requesterAgent: ReturnType<typeof request.agent>;
  let otherRequesterAgent: ReturnType<typeof request.agent>;
  let user1Id: number;
  let user2Id: number;
  let sampleTicketId: number;

  beforeEach(async () => {
    const hash = await bcrypt.hash("Password1", 10);

    const user1 = await prisma.user.upsert({
      where: { email: "alice.reqtest@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: {
        name: "Alice Requester",
        email: "alice.reqtest@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: "bob.reqtest@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: {
        name: "Bob Requester",
        email: "bob.reqtest@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
      },
    });

    user1Id = user1.id;
    user2Id = user2.id;

    const category = await prisma.category.findFirst();

    const ticket = await prisma.lab3Ticket.create({
      data: {
        title: "Printer paper jam in 3rd floor office",
        description: "Paper is stuck inside feed roller.",
        categoryId: category?.id ?? 1,
        requesterId: user1Id,
        status: "OPEN",
      },
    });

    sampleTicketId = ticket.id;

    requesterAgent = request.agent(app);
    await requesterAgent.post("/api/auth/login").send({
      email: "alice.reqtest@toktickit.com",
      password: "Password1",
    });

    otherRequesterAgent = request.agent(app);
    await otherRequesterAgent.post("/api/auth/login").send({
      email: "bob.reqtest@toktickit.com",
      password: "Password1",
    });
  });

  it("REQA-01: Requester can mark their own ticket as RESOLVED (Problem Appears Resolved)", async () => {
    const res = await requesterAgent.post(`/api/tickets/${sampleTicketId}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });

  it("REQA-02: Requester cannot mark another user's ticket as RESOLVED", async () => {
    const res = await otherRequesterAgent.post(`/api/tickets/${sampleTicketId}/resolve`);
    expect(res.status).toBe(403);
  });

  it("REQA-03: Requester can post public comment on their own ticket", async () => {
    const res = await requesterAgent
      .post(`/api/tickets/${sampleTicketId}/comments`)
      .send({ content: "I pulled out the jammed paper myself, thanks!" });

    expect(res.status).toBe(201);
    expect(res.body.comment.content).toBe("I pulled out the jammed paper myself, thanks!");
  });

  it("REQA-04: Requester cannot post public comment on another user's ticket", async () => {
    const res = await otherRequesterAgent
      .post(`/api/tickets/${sampleTicketId}/comments`)
      .send({ content: "Attempting unauthorized comment" });

    expect(res.status).toBe(403);
  });
});
