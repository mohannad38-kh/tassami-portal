import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export interface PasswordResetPayload {
  userId: number;
  email: string;
  purpose: "password_reset";
  passwordVersion: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, signingSecret, { expiresIn: "7d" });
}

export function signPasswordSetupToken(
  payload: PasswordSetupPayload,
): string {
  return jwt.sign(payload, signingSecret, { expiresIn: "24h" });
}

export function signPasswordResetToken(
  payload: Omit<PasswordResetPayload, "passwordVersion"> & { passwordHash: string },
): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      purpose: payload.purpose,
      passwordVersion: passwordVersion(payload.passwordHash),
    },
    signingSecret,
    { expiresIn: "1h" },
  );
}

export function verifyPasswordSetupToken(
  token: string,
): PasswordSetupPayload | null {
  const payload = verifyPasswordToken(token, "password_setup");
  return payload ? { ...payload, purpose: "password_setup" } : null;
}

export function verifyPasswordResetToken(
  token: string,
): PasswordResetPayload | null {
  const payload = verifyPasswordToken(token, "password_reset");
  if (!payload || typeof payload.passwordVersion !== "string") {
    return null;
  }
  return {
    userId: payload.userId,
    email: payload.email,
    purpose: "password_reset",
    passwordVersion: payload.passwordVersion,
  };
}

function verifyPasswordToken(
  token: string,
  purpose: PasswordSetupPayload["purpose"] | PasswordResetPayload["purpose"],
): { userId: number; email: string; passwordVersion?: string } | null {
  try {
    const payload = jwt.verify(token, signingSecret);
    if (
      typeof payload === "string" ||
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      payload.purpose !== purpose
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      ...(typeof payload.passwordVersion === "string"
        ? { passwordVersion: payload.passwordVersion }
        : {}),
    };
  } catch {
    return null;
  }
}

export function passwordVersion(passwordHash: string): string {
  return createHmac("sha256", signingSecret).update(passwordHash).digest("hex");
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

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyToken(authHeader.slice(7));
    const [user] = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
    }).from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Account is inactive or unavailable" });
      return;
    }
    (req as Request & { user: JwtPayload }).user = {
      userId: user.id,
      email: user.email,
      role: effectiveRole(user),
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(authHeader.slice(7));
      const [user] = await db.select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
      }).from(usersTable).where(eq(usersTable.id, payload.userId));
      if (user?.isActive) {
        (req as Request & { user: JwtPayload }).user = {
          userId: user.id,
          email: user.email,
          role: effectiveRole(user),
        };
      }
    } catch {
      // Invalid or unavailable optional sessions remain anonymous.
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

function adminRoleRevokedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_ROLE_REVOKED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function effectiveRole(user: Pick<JwtPayload, "email" | "role">): string {
  const email = user.email.trim().toLowerCase();
  if (adminRoleRevokedEmails().has(email)) {
    return "member";
  }
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
