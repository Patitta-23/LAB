import { Router, Request, Response } from "express";
import { getPrisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Feature D — GET /api/requesters (BR-11)
// Returns only active requesters, sorted alphabetically by name.
// ---------------------------------------------------------------------------
export const requesterRouter = Router();

requesterRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requester.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, department: true },
    });
    res.status(200).json(requesters);
  } catch (error) {
    console.error("Error fetching requesters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
