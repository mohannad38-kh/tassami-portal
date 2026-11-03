import { Router, type IRouter } from "express";
import { db, departmentsTable, joinRequestsTable, membersTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
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
  try {
    const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.id);
    const result = await Promise.all(depts.map(formatDept));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to load departments" });
  }
});

router.post("/departments", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { name, description } = req.body ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 160 ||
    (description !== undefined && description !== null && (typeof description !== "string" || description.length > 2000))
  ) {
    res.status(400).json({ error: "A department name and valid description are required" });
    return;
  }
  const [department] = await db.insert(departmentsTable).values({
    name: name.trim(),
    description: description ?? null,
  }).returning();
  res.status(201).json(await formatDept(department));
});

router.delete("/departments/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid department id" });
    return;
  }

  const [department] = await db.select({ id: departmentsTable.id, headId: departmentsTable.headId })
    .from(departmentsTable).where(eq(departmentsTable.id, id));
  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const [member] = await db.select({ id: membersTable.id })
    .from(membersTable).where(eq(membersTable.departmentId, id)).limit(1);
  const [user] = await db.select({ id: usersTable.id })
    .from(usersTable).where(eq(usersTable.departmentId, id)).limit(1);
  const [joinRequest] = await db.select({ id: joinRequestsTable.id })
    .from(joinRequestsTable).where(eq(joinRequestsTable.departmentId, id)).limit(1);
  if (member || user || joinRequest || department.headId !== null) {
    res.status(409).json({ error: "This department is assigned to users, members, or join requests and cannot be deleted yet" });
    return;
  }

  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.sendStatus(204);
});

export default router;