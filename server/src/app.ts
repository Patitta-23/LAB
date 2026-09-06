import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPrisma } from "./prisma.js";
import { requesterRouter } from "./routes/requesterRoutes.js";

export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// File upload configuration — Feature E (multer, BR-06, BR-07)
// ---------------------------------------------------------------------------
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // BR-06: 5 MB
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

// Helper: parse X-Requester-Id header
function getRequesterId(req: Request): number | null {
  const id = parseInt(String(req.headers["x-requester-id"]), 10);
  return isNaN(id) ? null : id;
}

// ---------------------------------------------------------------------------
// Lab 1 routes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Lab 2 Feature D — GET /api/requesters (router extracted per Clean Code review)
// ---------------------------------------------------------------------------
app.use("/api/requesters", requesterRouter);

// ---------------------------------------------------------------------------
// Lab 2 Feature E — POST /api/tickets (BR-01, BR-03, BR-04, BR-05, BR-06, BR-07)
// ---------------------------------------------------------------------------
app.post("/api/tickets", upload.array("attachments", 5), async (req: Request, res: Response) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    res.status(400).json({ error: "Missing or invalid X-Requester-Id header" });
    return;
  }

  const { title, categoryId, description } = req.body;
  const errors: string[] = [];
  if (!title || String(title).trim() === "")           errors.push("Title is required");
  if (!description || String(description).trim() === "") errors.push("Description is required");
  if (!categoryId || isNaN(parseInt(categoryId)))       errors.push("A valid Category is required");

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
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
      },
      include: { category: true },
    });

    res.status(201).json(ticket);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
