import { Router, type IRouter } from "express";
import { db, usersTable, departmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, hashPassword } from "../lib/auth";
import { Resend } from "resend"; // استيراد المكتبة

const router: IRouter = Router();
const resend = new Resend(process.env.RESEND_API_KEY); // تفعيل الخدمة

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
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role, phone, departmentId })
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
    const id = parseInt(raw, 10);
    const { name, email, role, phone, departmentId, isActive } = req.body;

    const [oldUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!oldUser) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (name != null) updateData.name = name;
    if (email != null) updateData.email = email;
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

    res.json(formatUser(updated));
  },
);

router.delete(
  "/users/:id",
  authMiddleware,
  requireRole("super_admin"),
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.sendStatus(204);
  },
);

export default router;
