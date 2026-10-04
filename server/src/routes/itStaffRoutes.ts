import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const itStaffRouter = Router();

// Protect all IT Staff routes with IT_Staff or Administrator role guard
itStaffRouter.use(requireAuth, requireRole("IT_Staff", "Administrator"));

// Valid status transitions map per BR-10
const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED", "CLOSED", "CANCELLED", "OPEN"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"], // Reopen if needed
  CANCELLED: [],
};

// ---------------------------------------------------------------------------
// GET /api/it-staff/tickets
// List all tickets in IT queue with search, filter, sort, and pagination
// ---------------------------------------------------------------------------
itStaffRouter.get("/tickets", async (req: Request, res: Response): Promise<void> => {
  const { search, status, category, priority, assigneeId, sort, order, page, limit } = req.query;

  const pageNum = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit ?? "10"), 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const sortField = sort === "updatedAt" ? "updatedAt" : sort === "priority" ? "itPriority" : "createdAt";
  const sortDir = order === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};

  if (status) where["status"] = status;
  if (category && !isNaN(parseInt(String(category)))) {
    where["categoryId"] = parseInt(String(category));
  }
  if (priority) where["itPriority"] = priority;
  if (assigneeId && !isNaN(parseInt(String(assigneeId)))) {
    where["assignedStaffId"] = parseInt(String(assigneeId));
  }

  if (search) {
    where["OR"] = [
      { title: { contains: String(search), mode: "insensitive" } },
      { description: { contains: String(search), mode: "insensitive" } },
    ];
  }

  try {
    const prisma = getPrisma();
    const [tickets, total] = await Promise.all([
      prisma.lab3Ticket.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lab3Ticket.count({ where }),
    ]);

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNumber: `TK-${1000 + t.id}`,
      title: t.title,
      category: t.category,
      status: t.status,
      itPriority: t.itPriority,
      assignedStaff: t.assignedStaff,
      requester: t.requester,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.status(200).json({
      tickets: formattedTickets,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/it-staff/tickets/:id
// Get ticket details including attachments, public comments, and internal notes
// ---------------------------------------------------------------------------
itStaffRouter.get("/tickets/:id", async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        attachments: {
          where: { deletedAt: null },
          select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
        },
        publicComments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
        internalNotes: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    res.status(200).json({
      id: ticket.id,
      ticketNumber: `TK-${1000 + ticket.id}`,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      itPriority: ticket.itPriority,
      assignedStaff: ticket.assignedStaff,
      requester: ticket.requester,
      attachments: ticket.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        fileSize: a.sizeBytes,
        mimeType: a.mimeType,
        downloadUrl: `/api/attachments/${a.id}/download`,
        isActive: true,
      })),
      publicComments: ticket.publicComments,
      internalNotes: ticket.internalNotes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/it-staff/tickets/:id
// Update status (with validation), IT priority, or assigned staff
// ---------------------------------------------------------------------------
itStaffRouter.patch("/tickets/:id", async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  const { status, itPriority, assignedStaffId } = req.body;

  try {
    const prisma = getPrisma();
    const existingTicket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });

    if (!existingTicket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (status && status !== existingTicket.status) {
      const allowed = VALID_TRANSITIONS[existingTicket.status] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          error: `Invalid status transition from ${existingTicket.status} to ${status}.`,
        });
        return;
      }
      updateData["status"] = status;
    }

    if (itPriority) {
      updateData["itPriority"] = itPriority;
    }

    if (assignedStaffId !== undefined) {
      if (assignedStaffId === null) {
        updateData["assignedStaffId"] = null;
      } else {
        const staffUser = await prisma.user.findUnique({
          where: { id: parseInt(String(assignedStaffId), 10) },
        });
        if (!staffUser || (staffUser.role !== "IT_Staff" && staffUser.role !== "Administrator")) {
          res.status(400).json({ error: "Assigned user must be an IT Staff or Administrator." });
          return;
        }
        updateData["assignedStaffId"] = staffUser.id;
      }
    }

    const updatedTicket = await prisma.lab3Ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({
      message: "Ticket updated successfully.",
      ticket: updatedTicket,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/it-staff/tickets/:id/claim
// Assign ticket to current logged-in IT Staff member
// ---------------------------------------------------------------------------
itStaffRouter.post("/tickets/:id/claim", async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  const currentUserId = req.session.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthenticated." });
    return;
  }

  try {
    const prisma = getPrisma();
    const existingTicket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });

    if (!existingTicket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, name: true, email: true },
    });

    const updatedTicket = await prisma.lab3Ticket.update({
      where: { id: ticketId },
      data: { assignedStaffId: currentUserId },
    });

    res.status(200).json({
      message: "Ticket claimed successfully.",
      assignedStaff: currentUser,
      ticket: updatedTicket,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/it-staff/tickets/:id/notes
// Add IT-only internal note
// ---------------------------------------------------------------------------
itStaffRouter.post("/tickets/:id/notes", async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  const { content } = req.body;
  if (!content || String(content).trim() === "") {
    res.status(400).json({ error: "Note content is required." });
    return;
  }

  const currentUserId = req.session.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthenticated." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: currentUserId,
        content: String(content).trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});
