import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// File upload configuration (multer)
// BR-06: max 5 MB per file, BR-07: allowed MIME types
// ---------------------------------------------------------------------------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ---------------------------------------------------------------------------
// Helper: get requester ID from X-Requester-Id header
// ---------------------------------------------------------------------------
function getRequesterId(req: Request): number | null {
  const raw = req.headers["x-requester-id"];
  const id = parseInt(String(raw), 10);
  return isNaN(id) ? null : id;
}

// ===========================================================================
// Lab 1 routes
// ===========================================================================

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================================================================
// Lab 2 — Feature D: Development Requester Context
// ===========================================================================

// GET /api/requesters — return only ACTIVE requesters (BR-11)
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requester.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, department: true },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================================================================
// Lab 2 — Feature E: Create Ticket
// ===========================================================================

// POST /api/tickets — create a new ticket (BR-01, BR-03, BR-04)
app.post(
  "/api/tickets",
  upload.array("attachments", 5),
  async (req: Request, res: Response) => {
    const requesterId = getRequesterId(req);
    if (!requesterId) {
      res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
      return;
    }

    const { title, categoryId, description } = req.body;
    const errors: string[] = [];
    if (!title || String(title).trim() === "") errors.push("Title is required");
    if (!description || String(description).trim() === "") errors.push("Description is required");
    if (!categoryId || isNaN(parseInt(categoryId))) errors.push("A valid Category is required");

    if (errors.length > 0) {
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }

    try {
      const files = (req.files as Express.Multer.File[]) ?? [];

      // BR-05: max 5 attachments (multer already limits array to 5 but double-check)
      if (files.length > 5) {
        res.status(422).json({ error: "Attachment limit exceeded", details: "Maximum 5 attachments per ticket" });
        return;
      }

      const ticket = await getPrisma().ticket.create({
        data: {
          title: String(title).trim(),
          description: String(description).trim(),
          categoryId: parseInt(categoryId),
          requesterId,
          attachments: {
            create: files.map((f) => ({
              filename: f.originalname,
              mimeType: f.mimetype,
              sizeBytes: f.size,
              storagePath: f.path,
            })),
          },
        },
        include: { category: true, attachments: true },
      });

      res.status(201).json(ticket);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ===========================================================================
// Lab 2 — Feature F: My Tickets (list, search, filter, sort, paginate)
// ===========================================================================

// GET /api/tickets — list tickets for the current requester (BR-02)
app.get("/api/tickets", async (req: Request, res: Response) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
    return;
  }

  const { search, status, categoryId, sortBy, sortOrder, page, limit } = req.query;

  const pageNum = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit ?? "10"), 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const orderField = sortBy === "updatedAt" ? "updatedAt" : "createdAt";
  const orderDir = sortOrder === "asc" ? "asc" : "desc";

  // Build where clause
  const where: Record<string, unknown> = { requesterId };
  if (status) where["status"] = status;
  if (categoryId && !isNaN(parseInt(String(categoryId)))) {
    where["categoryId"] = parseInt(String(categoryId));
  }
  if (search) {
    where["OR"] = [
      { title: { contains: String(search), mode: "insensitive" } },
      { description: { contains: String(search), mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await Promise.all([
      getPrisma().ticket.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
        },
      }),
      getPrisma().ticket.count({ where }),
    ]);

    res.status(200).json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tickets/:id — ticket detail (must belong to requester, BR-02)
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
    return;
  }

  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  try {
    const ticket = await getPrisma().ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        attachments: {
          where: { deletedAt: null }, // BR-09: hide soft-deleted attachments
          select: {
            id: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // BR-02: ticket must belong to this requester
    if (ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================================================================
// Lab 2 — Feature G: Attachments
// ===========================================================================

// POST /api/tickets/:id/attachments — upload more attachments (BR-05, BR-06, BR-07)
app.post(
  "/api/tickets/:id/attachments",
  upload.array("attachments", 5),
  async (req: Request, res: Response) => {
    const requesterId = getRequesterId(req);
    if (!requesterId) {
      res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    try {
      const ticket = await getPrisma().ticket.findUnique({
        where: { id: ticketId },
        include: { attachments: { where: { deletedAt: null } } },
      });

      if (!ticket) {
        res.status(404).json({ error: "Ticket not found" });
        return;
      }
      if (ticket.requesterId !== requesterId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const files = (req.files as Express.Multer.File[]) ?? [];
      const currentCount = ticket.attachments.length;
      const incoming = files.length;

      // BR-05: total active attachments must not exceed 5
      if (currentCount + incoming > 5) {
        res.status(422).json({
          error: "Attachment limit exceeded",
          details: `This ticket already has ${currentCount} attachment${currentCount !== 1 ? "s" : ""}. You can add at most ${5 - currentCount} more.`,
        });
        return;
      }

      const created = await getPrisma().$transaction(
        files.map((f) =>
          getPrisma().attachment.create({
            data: {
              ticketId,
              filename: f.originalname,
              mimeType: f.mimetype,
              sizeBytes: f.size,
              storagePath: f.path,
            },
          })
        )
      );

      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/attachments/:id — soft-delete with reason (BR-08, BR-09)
app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
    return;
  }

  const attachmentId = parseInt(req.params.id, 10);
  if (isNaN(attachmentId)) {
    res.status(400).json({ error: "Invalid attachment ID" });
    return;
  }

  const { reason } = req.body;
  if (!reason || String(reason).trim().length < 10) {
    res.status(400).json({ error: "Reason must be at least 10 characters" });
    return;
  }

  try {
    const attachment = await getPrisma().attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.deletedAt) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }
    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await getPrisma().attachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date(), deleteReason: String(reason).trim() },
    });

    res.status(200).json({ message: "Attachment removed", attachmentId });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/attachments/:id/download — stream file (blocks soft-deleted)
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
    return;
  }

  const attachmentId = parseInt(req.params.id, 10);
  if (isNaN(attachmentId)) {
    res.status(400).json({ error: "Invalid attachment ID" });
    return;
  }

  try {
    const attachment = await getPrisma().attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.deletedAt) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }
    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
    res.sendFile(path.resolve(attachment.storagePath));
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
