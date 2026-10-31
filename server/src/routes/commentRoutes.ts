import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const commentRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/comments
// Get comments for a ticket.
// - Requester: own ticket only → PUBLIC comments only (Internal Notes filtered out)
// - IT_Staff / Administrator: all tickets → PUBLIC + INTERNAL (BR-08, AC-07, AC-08)
// ---------------------------------------------------------------------------
commentRouter.get("/:id/comments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID.", code: "INVALID_ID" });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found.", code: "NOT_FOUND" });
      return;
    }

    const role = req.session.userRole;
    const userId = req.session.userId;

    // Requester can only see their own ticket (IDOR, BR-11)
    if (role === "Requester" && ticket.requesterId !== userId) {
      res.status(403).json({ error: "Forbidden.", code: "FORBIDDEN" });
      return;
    }

    // Build comment list from PublicComment + InternalNote, unified
    const [publicComments, internalNotes] = await Promise.all([
      prisma.publicComment.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      }),
      // Internal Notes: only fetch for IT_Staff and Administrator (BR-08, AC-08)
      role !== "Requester"
        ? prisma.internalNote.findMany({
            where: { ticketId },
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, role: true } } },
          })
        : Promise.resolve([]),
    ]);

    // Merge and sort chronologically with type tag
    const comments = [
      ...publicComments.map((c) => ({ ...c, type: "PUBLIC" as const })),
      ...internalNotes.map((n) => ({ ...n, type: "INTERNAL" as const })),
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.status(200).json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/comments
// Add a comment to a ticket.
// - type: "PUBLIC"   → stored in PublicComment (all roles)
// - type: "INTERNAL" → stored in InternalNote (IT_Staff + Administrator only)
// - Requester: type is forced to PUBLIC; attempting INTERNAL → 403 (AC-09)
// ---------------------------------------------------------------------------
commentRouter.post("/:id/comments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID.", code: "INVALID_ID" });
    return;
  }

  const currentUserId = req.session.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthenticated.", code: "UNAUTHENTICATED" });
    return;
  }

  const role = req.session.userRole;
  const { content, type } = req.body;

  // Validate content
  if (!content || String(content).trim() === "") {
    res.status(422).json({ error: "Comment content is required.", code: "VALIDATION_ERROR" });
    return;
  }

  // Requester cannot post Internal Notes (AC-09, BR-09)
  if (role === "Requester" && type === "INTERNAL") {
    res.status(403).json({ error: "Requesters cannot post internal notes.", code: "FORBIDDEN" });
    return;
  }

  // Determine effective type: Requester always gets PUBLIC
  const effectiveType: "PUBLIC" | "INTERNAL" =
    role === "Requester" ? "PUBLIC" : (type === "INTERNAL" ? "INTERNAL" : "PUBLIC");

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found.", code: "NOT_FOUND" });
      return;
    }

    // Requester can only comment on their own ticket (IDOR, BR-11)
    if (role === "Requester" && ticket.requesterId !== currentUserId) {
      res.status(403).json({ error: "Forbidden.", code: "FORBIDDEN" });
      return;
    }

    if (effectiveType === "INTERNAL") {
      const note = await prisma.internalNote.create({
        data: { ticketId, authorId: currentUserId, content: String(content).trim() },
        include: { author: { select: { id: true, name: true, role: true } } },
      });
      res.status(201).json({ comment: { ...note, type: "INTERNAL" } });
    } else {
      const comment = await prisma.publicComment.create({
        data: { ticketId, authorId: currentUserId, content: String(content).trim() },
        include: { author: { select: { id: true, name: true, role: true } } },
      });
      res.status(201).json({ comment: { ...comment, type: "PUBLIC" } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/resolve
// Requester marks ticket as RESOLVED ("Problem Appears Resolved")
// - Requester only, own ticket only (AC-10, BR-06)
// - Ticket must be in resolvable state: IN_PROGRESS | PENDING | RESOLVED
// ---------------------------------------------------------------------------
commentRouter.post("/:id/resolve", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID.", code: "INVALID_ID" });
    return;
  }

  const role = req.session.userRole;

  // Only Requester can use this endpoint (IT_Staff / Admin → 403)
  if (role !== "Requester") {
    res.status(403).json({ error: "Only Requesters can mark tickets as resolved.", code: "FORBIDDEN" });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found.", code: "NOT_FOUND" });
      return;
    }

    // IDOR: Requester can only resolve their own ticket
    if (ticket.requesterId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden.", code: "FORBIDDEN" });
      return;
    }

    // Resolvable states only
    const resolvableStates = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"];
    if (!resolvableStates.includes(ticket.status)) {
      res.status(400).json({
        error: `Ticket cannot be resolved from status: ${ticket.status}.`,
        code: "NOT_RESOLVABLE",
      });
      return;
    }

    const updated = await prisma.lab3Ticket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED" },
      select: { id: true, status: true, updatedAt: true },
    });

    res.status(200).json({ message: "Ticket marked as resolved.", status: updated.status, id: updated.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});
