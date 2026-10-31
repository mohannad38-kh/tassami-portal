import { Router, type IRouter } from "express";
import { db, usersTable, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, hashPassword, effectiveRole } from "../lib/auth";

const VALID_ROLES = new Set([
  "member",
  "join_manager",
  "dept_head",
  "secretary",
  "vice_president",
  "president",
  "super_admin",
]);
import { Resend } from "resend"; // استيراد المكتبة

const router: IRouter = Router();
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function formatUser(
  user: typeof usersTable.$inferSelect,
  deptName?: string | null,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    departmentId: user.departmentId ?? null,
    departmentName: deptName ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

router.get(
  "/users",
  authMiddleware,
  requireRole("secretary"),
  async (req, res): Promise<void> => {
    const { role, departmentId } = req.query;
    let users = await db.select().from(usersTable);
    if (role) users = users.filter((u) => u.role === role);
    if (departmentId)
      users = users.filter((u) => u.departmentId === Number(departmentId));
    const departments = await db.select().from(departmentsTable);
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
    res.json(
      users.map((u) =>
        formatUser(u, u.departmentId ? deptMap[u.departmentId] : null),
      ),
    );
  },
);

router.post(
  "/users",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res): Promise<void> => {
    const { name, email, password, role, phone, departmentId } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72 ||
      typeof role !== "string" ||
      !VALID_ROLES.has(role)
    ) {
      res.status(400).json({ error: "Enter valid user details and a valid role; password must be 12–72 UTF-8 bytes" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role, phone: phone ?? null, departmentId: departmentId ?? null })
      .returning();
    res.status(201).json(formatUser(user));
  },
);

router.get(
  "/users/:id",
  authMiddleware,
  requireRole("secretary"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    let deptName: string | null = null;
    if (user.departmentId) {
      const [dept] = await db
        .select()
        .from(departmentsTable)
        .where(eq(departmentsTable.id, user.departmentId));
      deptName = dept?.name ?? null;
    }
    res.json(formatUser(user, deptName));
  },
);

router.patch(
  "/users/:id",
  authMiddleware,
  requireRole("secretary"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    const { name, email, role, phone, departmentId, isActive } = req.body;
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const [oldUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!oldUser) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const currentUser = (req as typeof req & {
      user?: { email: string; role: string };
    }).user;
    if (isActive !== undefined && (!currentUser || effectiveRole(currentUser) !== "super_admin")) {
      res.status(403).json({ error: "Only a super administrator can activate or deactivate accounts" });
      return;
    }
    if (name !== undefined && (typeof name !== "string" || !name.trim() || name.length > 120)) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    if (email !== undefined && (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 40)) {
      res.status(400).json({ error: "Invalid phone" });
      return;
    }
    if (departmentId !== undefined && departmentId !== null && (!Number.isSafeInteger(departmentId) || departmentId < 1)) {
      res.status(400).json({ error: "Invalid department ID" });
      return;
    }
    if (isActive !== undefined && typeof isActive !== "boolean") {
      res.status(400).json({ error: "isActive must be a boolean" });
      return;
    }
    if (role != null) {
      if (!currentUser || effectiveRole(currentUser) !== "super_admin") {
        res.status(403).json({ error: "Only a super administrator can change user roles" });
        return;
      }
      if (typeof role !== "string" || !VALID_ROLES.has(role)) {
        res.status(400).json({ error: "Invalid user role" });
        return;
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name != null) updateData.name = name;
    if (email != null) updateData.email = email.trim().toLowerCase();
    if (role != null) updateData.role = role;
    if (phone != null) updateData.phone = phone;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (isActive != null) updateData.isActive = isActive;

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning();

    // منطق إرسال الإيميل
    if (isActive === true && oldUser.isActive === false) {
      if (!resend) {
        console.warn("Activation email was not sent because RESEND_API_KEY is not configured.");
      } else {
        try {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: updated.email,
            subject: "تم قبولك في منصة تسامي",
            html: `<p>أهلاً ${updated.name}، نود إبلاغك بأنه تم قبول طلبك في منصة تسامي وتفعيل حسابك بنجاح!</p>`,
          });
        } catch (e) {
          console.error("Email error:", e);
        }
      }
    }

    res.json(formatUser(updated));
  },
);

router.delete(
  "/users/:id",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
