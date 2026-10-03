import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import bcrypt from "bcrypt";

describe("Lab 3 — Admin User Management Integration Tests", () => {
  const prisma = getPrisma();
  let adminAgent: ReturnType<typeof request.agent>;
  let itStaffAgent: ReturnType<typeof request.agent>;
  let requesterAgent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    const hash = await bcrypt.hash("Password1", 10);

    // Ensure Admin user
    await prisma.user.upsert({
      where: { email: "admin.test@toktickit.com" },
      update: { passwordHash: hash, role: "Administrator", isActive: true },
      create: {
        name: "Admin Tester",
        email: "admin.test@toktickit.com",
        passwordHash: hash,
        role: "Administrator",
        isActive: true,
      },
    });

    // Ensure IT Staff user
    await prisma.user.upsert({
      where: { email: "itstaff.test@toktickit.com" },
      update: { passwordHash: hash, role: "IT_Staff", isActive: true },
      create: {
        name: "IT Staff Tester",
        email: "itstaff.test@toktickit.com",
        passwordHash: hash,
        role: "IT_Staff",
        isActive: true,
      },
    });

    // Ensure Requester user
    await prisma.user.upsert({
      where: { email: "requester.test@toktickit.com" },
      update: { passwordHash: hash, role: "Requester", isActive: true },
      create: {
        name: "Requester Tester",
        email: "requester.test@toktickit.com",
        passwordHash: hash,
        role: "Requester",
      },
    });

    await prisma.user.deleteMany({
      where: { email: "new.employee@toktickit.com" },
    });

    // Authenticate Agents
    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: "admin.test@toktickit.com",
      password: "Password1",
    });

    itStaffAgent = request.agent(app);
    await itStaffAgent.post("/api/auth/login").send({
      email: "itstaff.test@toktickit.com",
      password: "Password1",
    });

    requesterAgent = request.agent(app);
    await requesterAgent.post("/api/auth/login").send({
      email: "requester.test@toktickit.com",
      password: "Password1",
    });
  });

  // RBAC-02 & RBAC-03: Non-admins cannot access admin endpoints
  it("RBAC-02 & RBAC-03: returns 403 when Requester or IT Staff accesses /api/admin/users", async () => {
    const reqRes = await requesterAgent.get("/api/admin/users");
    expect(reqRes.status).toBe(403);

    const itRes = await itStaffAgent.get("/api/admin/users");
    expect(itRes.status).toBe(403);
  });

  // ADMIN-01: Get all users (Admin)
  it("ADMIN-01: Admin can list all users in system", async () => {
    const res = await adminAgent.get("/api/admin/users");
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  // ADMIN-02: Search users by name or email
  it("ADMIN-02: filters users by search query", async () => {
    const res = await adminAgent.get("/api/admin/users?search=admin.test");
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].email).toBe("admin.test@toktickit.com");
  });

  // ADMIN-03: Filter users by role
  it("ADMIN-03: filters users by role", async () => {
    const res = await adminAgent.get("/api/admin/users?role=IT_Staff");
    expect(res.status).toBe(200);
    expect(res.body.users.every((u: any) => u.role === "IT_Staff")).toBe(true);
  });

  // ADMIN-04: Create user — valid
  it("ADMIN-04: creates a new user with mustChangePassword = true", async () => {
    const newUser = {
      name: "New Employee",
      email: "new.employee@toktickit.com",
      role: "Requester",
      password: "InitialPassword1",
    };

    const res = await adminAgent.post("/api/admin/users").send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("new.employee@toktickit.com");
    expect(res.body.user.mustChangePassword).toBe(true);
  });

  // ADMIN-05: Create user — duplicate email
  it("ADMIN-05: returns 409 Conflict when creating user with existing email", async () => {
    const duplicateUser = {
      name: "Duplicate Employee",
      email: "admin.test@toktickit.com",
      role: "Requester",
      password: "Password1",
    };

    const res = await adminAgent.post("/api/admin/users").send(duplicateUser);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  // ADMIN-06: Create user — missing required field
  it("ADMIN-06: returns 400 Bad Request when required fields are missing", async () => {
    const invalidUser = { name: "Incomplete User" };
    const res = await adminAgent.post("/api/admin/users").send(invalidUser);
    expect(res.status).toBe(400);
  });

  // ADMIN-07: Edit user name/email/role
  it("ADMIN-07: edits existing user details", async () => {
    const targetUser = await prisma.user.findFirst({
      where: { email: "requester.test@toktickit.com" },
    });

    const res = await adminAgent
      .patch(`/api/admin/users/${targetUser?.id}`)
      .send({ name: "Updated Requester Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated Requester Name");
  });

  // ADMIN-08 & ADMIN-09: Toggle active/inactive status
  it("ADMIN-08 & ADMIN-09: toggles user active status and prevents deactivated user from logging in", async () => {
    const targetUser = await prisma.user.findFirst({
      where: { email: "requester.test@toktickit.com" },
    });

    // Toggle to inactive
    const toggleRes = await adminAgent.patch(`/api/admin/users/${targetUser?.id}/toggle-active`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.user.isActive).toBe(false);

    // Deactivated user attempt to login -> 403
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "requester.test@toktickit.com",
      password: "Password1",
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error).toMatch(/deactivated/i);

    // Reactivate for future clean state
    await adminAgent.patch(`/api/admin/users/${targetUser?.id}/toggle-active`);
  });

  // ADMIN-10: Reset password
  it("ADMIN-10: resets user password and sets mustChangePassword = true", async () => {
    const targetUser = await prisma.user.findFirst({
      where: { email: "requester.test@toktickit.com" },
    });

    const resetRes = await adminAgent.post(`/api/admin/users/${targetUser?.id}/reset-password`).send({
      newPassword: "ResetPassword1",
    });

    expect(resetRes.status).toBe(200);

    // Login with new password -> mustChangePassword is true
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "requester.test@toktickit.com",
      password: "ResetPassword1",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.mustChangePassword).toBe(true);
  });
});
