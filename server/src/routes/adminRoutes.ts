import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { getPrisma } from "../prisma.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const adminRouter = Router();

// Protect all admin routes with Administrator role guard
adminRouter.use(requireAuth, requireRole("Administrator"));

// ---------------------------------------------------------------------------
// GET /api/admin/users
// Paginated list of users with search, filter (role, status), and sort
// ---------------------------------------------------------------------------
adminRouter.get("/users", async (req: Request, res: Response): Promise<void> => {
  const { search, role, status, page, limit } = req.query;

  const pageNum = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit ?? "10"), 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (role) where["role"] = role;
  if (status !== undefined) {
    if (status === "active") where["isActive"] = true;
    if (status === "inactive") where["isActive"] = false;
  }

  if (search) {
    where["OR"] = [
      { name: { contains: String(search), mode: "insensitive" } },
      { email: { contains: String(search), mode: "insensitive" } },
    ];
  }

  try {
    const prisma = getPrisma();
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      users,
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
// POST /api/admin/users
// Create new user (AC-09, mustChangePassword = true)
// ---------------------------------------------------------------------------
adminRouter.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role || !password) {
    res.status(400).json({ error: "Name, email, role, and password are required." });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ error: "User with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        role,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "User created successfully.", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id
// Update user details (name, email, role)
// ---------------------------------------------------------------------------
adminRouter.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID." });
    return;
  }

  const { name, email, role } = req.body;
  const updateData: Record<string, unknown> = {};

  if (name) updateData["name"] = String(name).trim();
  if (role) updateData["role"] = role;
  if (email) updateData["email"] = String(email).toLowerCase().trim();

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    res.status(200).json({ message: "User updated successfully.", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id/toggle-active
// Toggle user active / inactive status (BR-13)
// ---------------------------------------------------------------------------
adminRouter.patch("/users/:id/toggle-active", async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID." });
    return;
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !existing.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully.`,
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/reset-password
// Reset user password & set mustChangePassword = true (BR-14)
// ---------------------------------------------------------------------------
adminRouter.post("/users/:id/reset-password", async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID." });
    return;
  }

  const { newPassword } = req.body;
  const tempPassword = newPassword ?? "Password1";

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const passwordHash = await bcrypt.hash(String(tempPassword), 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    res.status(200).json({
      message: "Password reset successfully. User must change password upon next login.",
      tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});
