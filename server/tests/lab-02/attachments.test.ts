// server/tests/lab-02/attachments.test.ts
// Test matrix: T-18, T-19, T-20, T-21 (AC-05)
// DELETE /api/attachments/:id — soft-delete with reason (BR-08, BR-09)
// GET /api/attachments/:id/download — blocks soft-deleted

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

// ─── mock helpers ─────────────────────────────────────────────────────────────
const mockAttachment = {
  id: 5,
  ticketId: 1,
  filename: "screenshot.png",
  mimeType: "image/png",
  sizeBytes: 204800,
  storagePath: "/tmp/screenshot.png",
  deletedAt: null,
  deleteReason: null,
  createdAt: new Date().toISOString(),
  ticket: { id: 1, requesterId: 1 },
};

const findUniqueMock = vi.fn();
const updateMock = vi.fn();

function setupPrismaMock(attachmentOverride?: Partial<typeof mockAttachment>) {
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
    attachment: {
      findUnique: findUniqueMock.mockResolvedValue({
        ...mockAttachment,
        ...attachmentOverride,
      }),
      update: updateMock.mockResolvedValue({ ...mockAttachment, deletedAt: new Date() }),
    },
  } as any);
}

afterEach(() => {
  vi.restoreAllMocks();
  findUniqueMock.mockReset();
  updateMock.mockReset();
});

// ─── T-18: soft-delete with valid reason → 200 ───────────────────────────────
describe("DELETE /api/attachments/:id — soft-delete (AC-05)", () => {
  beforeEach(() => setupPrismaMock());

  it("T-18: returns 200 when reason is >= 10 characters", async () => {
    const res = await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "Uploaded the wrong file by mistake" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("attachmentId", 5);
    expect(res.body.message).toBe("Attachment removed");
  });

  // T-19: soft-deleted attachment should not appear in ticket detail
  it("T-19: sets deletedAt on the attachment record (soft-delete, not hard-delete)", async () => {
    await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "Uploaded the wrong file by mistake" });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });

  it("T-19b: stores the deleteReason in the database (BR-08)", async () => {
    const reason = "Uploaded the wrong file by mistake";
    await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deleteReason: reason }),
      })
    );
  });

  // T-20: reason < 10 chars → 400
  it("T-20: returns 400 when reason is fewer than 10 characters", async () => {
    const res = await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "too short" }); // 9 chars

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 characters/);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("T-20b: returns 400 when reason is empty", async () => {
    const res = await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "" });

    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  // T-21: attachment belongs to a different requester → 403 (BR-02)
  it("T-21: returns 403 when attachment belongs to another requester's ticket", async () => {
    findUniqueMock.mockResolvedValueOnce({
      ...mockAttachment,
      ticket: { id: 1, requesterId: 99 }, // different requester
    });

    const res = await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "Uploaded the wrong file by mistake" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when attachment does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete("/api/attachments/9999")
      .set("X-Requester-Id", "1")
      .send({ reason: "Valid reason here for deletion" });

    expect(res.status).toBe(404);
  });

  it("returns 404 when attachment is already soft-deleted (BR-09)", async () => {
    findUniqueMock.mockResolvedValueOnce({
      ...mockAttachment,
      deletedAt: new Date(), // already deleted
    });

    const res = await request(app)
      .delete("/api/attachments/5")
      .set("X-Requester-Id", "1")
      .send({ reason: "Valid reason here for deletion" });

    expect(res.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });
});

// ─── GET /api/attachments/:id/download — blocks soft-deleted ─────────────────
describe("GET /api/attachments/:id/download", () => {
  it("returns 404 when attachment is soft-deleted (BR-09)", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      attachment: {
        findUnique: vi.fn().mockResolvedValue({
          ...mockAttachment,
          deletedAt: new Date(),
        }),
      },
    } as any);

    const res = await request(app)
      .get("/api/attachments/5/download")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(404);
  });

  it("returns 403 when attachment belongs to another requester (BR-02)", async () => {
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      attachment: {
        findUnique: vi.fn().mockResolvedValue({
          ...mockAttachment,
          ticket: { id: 1, requesterId: 99 },
        }),
      },
    } as any);

    const res = await request(app)
      .get("/api/attachments/5/download")
      .set("X-Requester-Id", "1");

    expect(res.status).toBe(403);
  });

  it("returns 400 when X-Requester-Id header is missing", async () => {
    const res = await request(app).get("/api/attachments/5/download");
    expect(res.status).toBe(400);
  });
});
