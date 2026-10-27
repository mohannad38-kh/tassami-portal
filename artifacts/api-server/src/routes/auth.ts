import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, comparePassword, authMiddleware } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

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

  // إنشاء التوكن (Token) بعد نجاح الدخول
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
    role: dbUser.role,
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
