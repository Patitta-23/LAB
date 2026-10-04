import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const commentRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/comments
// Get all public comments for a ticket
// ---------------------------------------------------------------------------
commentRouter.get("/:id/comments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  try {
    const prisma = getPrisma();
    const ticket = await prisma.lab3Ticket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }

    // Role check: Requester can only view comments on their own ticket
    if (req.session.userRole === "Requester" && ticket.requesterId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden." });
      return;
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(200).json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/comments
// Add a public comment to a ticket
// ---------------------------------------------------------------------------
commentRouter.post("/:id/comments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  const { content } = req.body;
  if (!content || String(content).trim() === "") {
    res.status(400).json({ error: "Comment content is required." });
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

    // Role check: Requester can only comment on their own ticket
    if (req.session.userRole === "Requester" && ticket.requesterId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden." });
      return;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: currentUserId,
        content: String(content).trim(),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});
