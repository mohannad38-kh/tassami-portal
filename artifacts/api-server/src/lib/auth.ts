import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && !JWT_SECRET) {
  throw new Error("SESSION_SECRET must be set in production.");
}

const signingSecret = JWT_SECRET ?? "tasami-secret-key-2024";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface PasswordSetupPayload {
  userId: number;
  email: string;
  purpose: "password_setup";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, signingSecret, { expiresIn: "7d" });
}

export function signPasswordSetupToken(
  payload: PasswordSetupPayload,
): string {
  return jwt.sign(payload, signingSecret, { expiresIn: "24h" });
}

export function verifyPasswordSetupToken(
  token: string,
): PasswordSetupPayload | null {
  try {
    const payload = jwt.verify(token, signingSecret);
    if (
      typeof payload === "string" ||
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      payload.purpose !== "password_setup"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      purpose: "password_setup",
    };
  } catch {
    return null;
  }
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, signingSecret) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    (req as Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyToken(token);
      (req as Request & { user: JwtPayload }).user = payload;
    } catch {
      // ignore
    }
  }
  next();
}

const ROLE_HIERARCHY: Record<string, number> = {
  visitor: 0,
  member: 1,
  join_manager: 1.5,
  dept_head: 2,
  secretary: 3,
  vice_president: 4,
  president: 5,
  super_admin: 6,
};

function joinRequestManagerEmails(): Set<string> {
  return new Set(
    (process.env.JOIN_REQUEST_MANAGER_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function superAdminEmails(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function effectiveRole(user: Pick<JwtPayload, "email" | "role">): string {
  const email = user.email.trim().toLowerCase();
  if (superAdminEmails().has(email)) {
    return "super_admin";
  }
  if (
    (ROLE_HIERARCHY[user.role] ?? -1) < ROLE_HIERARCHY.join_manager &&
    joinRequestManagerEmails().has(email)
  ) {
    return "join_manager";
  }
  return user.role;
}

export function requireRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: JwtPayload }).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (
      (ROLE_HIERARCHY[effectiveRole(user)] ?? -1) <
      (ROLE_HIERARCHY[minRole] ?? 0)
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
