import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 3 — Authentication Integration Tests", () => {
  const prisma = getPrisma();

  beforeEach(async () => {
    // Ensure test users exist with hashed password "Password1"
    const hash = await bcrypt.hash("Password1", 10);

    await prisma.user.upsert({
      where: { email: "alice.auth@toktickit.com" },
      update: { passwordHash: hash, isActive: true, mustChangePassword: false, role: "Requester" },
      create: {
        name: "Alice Test",
        email: "alice.auth@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
        mustChangePassword: false,
      },
    });

    await prisma.user.upsert({
      where: { email: "bob.staff@toktickit.com" },
      update: { passwordHash: hash, isActive: true, mustChangePassword: false, role: "IT_Staff" },
      create: {
        name: "Bob IT Staff",
        email: "bob.staff@toktickit.com",
        passwordHash: hash,
        role: "IT_Staff",
        isActive: true,
        mustChangePassword: false,
      },
    });

    await prisma.user.upsert({
      where: { email: "carol.mustchange@toktickit.com" },
      update: { passwordHash: hash, isActive: true, mustChangePassword: true, role: "Requester" },
      create: {
        name: "Carol MustChange",
        email: "carol.mustchange@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: true,
        mustChangePassword: true,
      },
    });

    await prisma.user.upsert({
      where: { email: "inactive.user@toktickit.com" },
      update: { passwordHash: hash, isActive: false, mustChangePassword: false, role: "Requester" },
      create: {
        name: "Inactive Account",
        email: "inactive.user@toktickit.com",
        passwordHash: hash,
        role: "Requester",
        isActive: false,
        mustChangePassword: false,
      },
    });
  });

  // AUTH-01: Login valid credentials (Requester)
  it("AUTH-01: logs in successfully with valid Requester credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice.auth@toktickit.com", password: "Password1" });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("alice.auth@toktickit.com");
    expect(res.body.user.role).toBe("Requester");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  // AUTH-02: Login valid credentials (IT Staff)
  it("AUTH-02: logs in successfully with IT Staff role", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob.staff@toktickit.com", password: "Password1" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("IT_Staff");
  });

  // AUTH-04: Wrong password
  it("AUTH-04: returns 401 on wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice.auth@toktickit.com", password: "WrongPassword123" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // AUTH-05: Unknown email
  it("AUTH-05: returns 401 on unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@toktickit.com", password: "Password1" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // AUTH-06: Inactive account
  it("AUTH-06: returns 403 on deactivated account", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inactive.user@toktickit.com", password: "Password1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/deactivated/i);
  });

  // AUTH-07: mustChangePassword = true
  it("AUTH-07: returns mustChangePassword: true for initial login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "carol.mustchange@toktickit.com", password: "Password1" });

    expect(res.status).toBe(200);
    expect(res.body.user.mustChangePassword).toBe(true);
  });

  // AUTH-08 & AUTH-09: GET /api/auth/me
  it("AUTH-08 & AUTH-09: returns user session info on GET /api/auth/me, 401 if unauthenticated", async () => {
    // Unauthenticated
    const unauthRes = await request(app).get("/api/auth/me");
    expect(unauthRes.status).toBe(401);

    // Login to get cookie session
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: "alice.auth@toktickit.com", password: "Password1" });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("alice.auth@toktickit.com");
  });

  // AUTH-10: POST /api/auth/logout
  it("AUTH-10: destroys session on logout", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: "alice.auth@toktickit.com", password: "Password1" });

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(401);
  });

  // AUTH-11 to AUTH-14: Password change tests
  it("AUTH-11 to AUTH-14: validates password change requirements", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: "carol.mustchange@toktickit.com", password: "Password1" });

    // Mismatched passwords
    const resMismatch = await agent
      .post("/api/auth/change-password")
      .send({ newPassword: "NewPassword1", confirmPassword: "NewPassword2" });
    expect(resMismatch.status).toBe(400);
    expect(resMismatch.body.error).toMatch(/do not match/i);

    // Too short
    const resShort = await agent
      .post("/api/auth/change-password")
      .send({ newPassword: "Pass1", confirmPassword: "Pass1" });
    expect(resShort.status).toBe(400);

    // No uppercase
    const resNoUpper = await agent
      .post("/api/auth/change-password")
      .send({ newPassword: "password123", confirmPassword: "password123" });
    expect(resNoUpper.status).toBe(400);

    // Valid change
    const resValid = await agent
      .post("/api/auth/change-password")
      .send({ newPassword: "NewPassword1", confirmPassword: "NewPassword1" });
    expect(resValid.status).toBe(200);

    // Verify mustChangePassword is now false
    const meRes = await agent.get("/api/auth/me");
    expect(meRes.body.mustChangePassword).toBe(false);
  });
});
