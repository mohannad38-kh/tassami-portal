import { Router, type IRouter } from "express";
import { db, departmentsTable, joinRequestsTable, membersTable, usersTable } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

async function formatDept(dept: typeof departmentsTable.$inferSelect) {
  let headName: string | null = null;
  if (dept.headId) {
    const [head] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, dept.headId));
    headName = head?.name ?? null;
  }
  const members = await db
    .select({ email: usersTable.email })
    .from(membersTable)
    .innerJoin(usersTable, eq(membersTable.userId, usersTable.id))
    .where(
      and(
        eq(membersTable.departmentId, dept.id),
        eq(membersTable.status, "active"),
      ),
    );
  const approvedRequests = await db
    .select({ email: joinRequestsTable.email })
    .from(joinRequestsTable)
    .where(
      and(
        eq(joinRequestsTable.departmentId, dept.id),
        eq(joinRequestsTable.status, "approved"),
      ),
    );
  const memberEmails = new Set(
    members.map(({ email }) => email.trim().toLowerCase()),
  );
  for (const { email } of approvedRequests) {
    memberEmails.add(email.trim().toLowerCase());
  }
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description ?? null,
    headId: dept.headId ?? null,
    headName,
    memberCount: memberEmails.size,
    createdAt: dept.createdAt,
  };
}

router.get("/departments", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.id);
  const result = await Promise.all(depts.map(formatDept));
  res.json(result);
});

router.post("/departments", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { name, description, headId } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  const [dept] = await db.insert(departmentsTable).values({ name, description, headId }).returning();
  res.status(201).json(await formatDept(dept));
});

router.get("/departments/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!dept) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatDept(dept));
});

router.patch("/departments/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, description, headId } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name != null) updateData.name = name;
  if (description != null) updateData.description = description;
  if (headId !== undefined) updateData.headId = headId;
  const [updated] = await db.update(departmentsTable).set(updateData).where(eq(departmentsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatDept(updated));
});

router.delete("/departments/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.sendStatus(204);
});

router.get("/departments/:id/members", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const members = await db.select().from(membersTable).where(eq(membersTable.departmentId, id));
  const userIds = members.map((m) => m.userId);
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  res.json(
    members.map((m) => {
      const u = userMap[m.userId];
      return {
        id: m.id,
        userId: m.userId,
        userName: u?.name ?? null,
        userEmail: u?.email ?? null,
        userPhone: u?.phone ?? null,
        membershipNumber: m.membershipNumber,
        status: m.status,
        departmentId: m.departmentId ?? null,
        departmentName: null,
        totalVolunteerHours: 0,
        qrCode: m.qrCode ?? null,
        createdAt: m.createdAt,
      };
    })
  );
});

export default router;
