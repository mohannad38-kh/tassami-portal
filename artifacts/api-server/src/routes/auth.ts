import { Router, type IRouter } from "express";
import { db, joinRequestsTable, usersTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import {
  signToken,
  comparePassword,
  hashPassword,
  authMiddleware,
  verifyPasswordSetupToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
  passwordVersion,
  effectiveRole,
} from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

router.post("/auth/password-reset/request", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: "Password reset email is not configured" });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      isActive: usersTable.isActive,
      passwordHash: usersTable.passwordHash,
    })
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${email}`);
  if (!user?.isActive) {
    res.json({ ok: true });
    return;
  }

  const appBaseUrl = process.env.APP_BASE_URL || "https://tassami-portal.onrender.com";
  const token = signPasswordResetToken({
    userId: user.id,
    email: user.email,
    purpose: "password_reset",
    passwordHash: user.passwordHash,
  });
  const resetUrl = new URL(
    `/reset-password?token=${encodeURIComponent(token)}`,
    appBaseUrl,
  ).toString();
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev",
    to: user.email,
    subject: "رابط إعادة تعيين كلمة مرور حساب تسامي",
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#382a20"><h2 style="color:#702632">إعادة تعيين كلمة المرور</h2><p style="font-size:16px;line-height:1.8">وصلنا طلب لإعادة تعيين كلمة مرور حسابك. استخدم الرابط التالي خلال ساعة واحدة:</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#702632;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">تعيين كلمة مرور جديدة</a></p><p style="font-size:14px;color:#666">إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p></div>`,
  });
  if (error) {
    console.error("Failed to send password reset email:", error.message);
  }

  res.json({ ok: true });
});

router.post("/auth/password-reset/confirm", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (typeof token !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "A reset token and password are required" });
    return;
  }
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    res.status(400).json({
      error: "Password must be at least 12 characters and no more than 72 UTF-8 bytes",
    });
    return;
  }

  const resetPayload = verifyPasswordResetToken(token);
  if (!resetPayload) {
    res.status(400).json({ error: "This password reset link is invalid or expired" });
    return;
  }

  const [currentUser] = await db
    .select({
      id: usersTable.id,
      passwordHash: usersTable.passwordHash,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, resetPayload.userId),
        eq(usersTable.email, resetPayload.email),
        eq(usersTable.isActive, true),
      ),
    );
  if (
    !currentUser ||
    passwordVersion(currentUser.passwordHash) !== resetPayload.passwordVersion
  ) {
    res.status(400).json({ error: "This password reset link is invalid or expired" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [updatedUser] = await db
    .update(usersTable)
    .set({ passwordHash })
    .where(
      and(
        eq(usersTable.id, resetPayload.userId),
        eq(usersTable.email, resetPayload.email),
        eq(usersTable.isActive, true),
        eq(usersTable.passwordHash, currentUser.passwordHash),
      ),
    )
    .returning({ id: usersTable.id });
  if (!updatedUser) {
    res.status(400).json({ error: "This password reset link is invalid or expired" });
    return;
  }

  res.json({ ok: true });
});

router.post("/auth/set-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (typeof token !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "A setup token and password are required" });
    return;
  }
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    res.status(400).json({
      error: "Password must be at least 12 characters and no more than 72 UTF-8 bytes",
    });
    return;
  }

  const setupPayload = verifyPasswordSetupToken(token);
  if (!setupPayload) {
    res.status(400).json({ error: "This password setup link is invalid or expired" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .update(usersTable)
    .set({ passwordHash, isActive: true })
    .where(
      and(
        eq(usersTable.id, setupPayload.userId),
        eq(usersTable.email, setupPayload.email),
        eq(usersTable.isActive, false),
      ),
    )
    .returning({ id: usersTable.id });
  if (!user) {
    res.status(400).json({ error: "This password setup link has already been used" });
    return;
  }

  res.json({ ok: true });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  // البحث عن المستخدم في قاعدة البيانات
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // التحقق من كلمة السر
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (!user.isActive) {
    const [latestRequest] = await db
      .select({ status: joinRequestsTable.status })
      .from(joinRequestsTable)
      .where(sql`lower(${joinRequestsTable.email}) = ${user.email.toLowerCase()}`)
      .orderBy(desc(joinRequestsTable.createdAt))
      .limit(1);
    if (latestRequest?.status === "pending") {
      res.status(403).json({ error: "ACCOUNT_PENDING_APPROVAL" });
      return;
    }
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // إنشاء التوكن (Token) بعد نجاح الدخول
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: effectiveRole(user),
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole(user),
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      departmentId: user.departmentId ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

// بقية الدوال (Logout, Me, Change Password) تبقى كما هي بدون تغيير
router.post("/auth/logout", (_req, res): void => {
  res.json({ ok: true });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, user.userId));
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: effectiveRole(dbUser),
    phone: dbUser.phone ?? null,
    avatarUrl: dbUser.avatarUrl ?? null,
    departmentId: dbUser.departmentId ?? null,
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
  });
});

// (دالة تغيير كلمة السر تبقى كما هي)
// ...

export default router;
