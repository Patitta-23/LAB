// server/tests/lab-02/requesters.test.ts
// Test matrix: T-01 (AC-01)
// GET /api/requesters — returns only ACTIVE requesters (BR-11)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

const mockActiveRequesters = [
  { id: 1, name: "David Lee",         email: "david.lee@company.com",         department: "HR"          },
  { id: 2, name: "Jennifer Anderson", email: "jennifer.anderson@company.com", department: "Finance"      },
  { id: 3, name: "Michael Brown",     email: "michael.brown@company.com",     department: "Engineering"  },
  { id: 4, name: "Sarah Johnson",     email: "sarah.johnson@company.com",     department: "Marketing"    },
];

const findManyMock = vi.fn();

beforeEach(() => {
  findManyMock.mockResolvedValue(mockActiveRequesters);
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
    requester: { findMany: findManyMock },
  } as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/requesters", () => {
  it("T-01: returns 200 and a list of active requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);
  });

  it("T-01b: each requester has id, name, email, and department", async () => {
    const res = await request(app).get("/api/requesters");
    for (const r of res.body) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("name");
      expect(r).toHaveProperty("email");
      expect(r).toHaveProperty("department");
    }
  });

  it("T-01c: query filters by isActive:true — inactive requester excluded (BR-11)", async () => {
    await request(app).get("/api/requesters");
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });

  it("T-01d: returns 500 when database throws", async () => {
    findManyMock.mockRejectedValueOnce(new Error("DB error"));
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
