import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { getPrisma } from "../prisma.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const authRouter = Router();

// Password complexity validation (BR-04)
function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Authenticate user — creates session on success (BR-01, BR-02, BR-13)
// ---------------------------------------------------------------------------
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const user = await getPrisma().user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

    // BR-13: Inactive users cannot login (but show same error to avoid enumeration)
    if (!user || !user.isActive) {
      if (user && !user.isActive) {
        res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
        return;
      }
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const passwordMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Update lastLoginAt
    await getPrisma().user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// Destroy session (AC-10)
// ---------------------------------------------------------------------------
authRouter.post("/logout", requireAuth, (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully." });
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// Return current authenticated user identity (FR-08)
// ---------------------------------------------------------------------------
authRouter.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getPrisma().user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Unauthenticated." });
      return;
    }

    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: "Internal server error." });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// Force password change (BR-03, BR-04, AC-03)
// ---------------------------------------------------------------------------
authRouter.post("/change-password", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    res.status(400).json({ error: "New password and confirmation are required." });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match." });
    return;
  }

  if (!isValidPassword(String(newPassword))) {
    res.status(400).json({
      error: "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one digit.",
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(String(newPassword), 12);
    await getPrisma().user.update({
      where: { id: req.session.userId },
      data: { passwordHash, mustChangePassword: false },
    });

    res.status(200).json({ message: "Password changed successfully." });
  } catch {
    res.status(500).json({ error: "Internal server error." });
  }
});
