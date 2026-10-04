import { Request, Response, NextFunction } from "express";

// Extend express session to include userId and userRole
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

// ---------------------------------------------------------------------------
// requireAuth — returns 401 if no active session
// ---------------------------------------------------------------------------
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthenticated." });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// requireRole — returns 403 if user's role not in allowed list
// ---------------------------------------------------------------------------
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Unauthenticated." });
      return;
    }
    if (!roles.includes(req.session.userRole ?? "")) {
      res.status(403).json({ error: "Forbidden. Insufficient permissions." });
      return;
    }
    next();
  };
}
