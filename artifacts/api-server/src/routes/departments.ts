import { Router, type IRouter } from "express";
import { db, departmentsTable, joinRequestsTable, membersTable, usersTable } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

// الأقسام الافتراضية المطلوبة
const DEFAULT_DEPARTMENTS = [
  { name: "قسم الورسات", description: "قسم من أقسام مبادرة تسامي." },
  { name: "القسم الأكاديمي", description: "قسم من أقسام مبادرة تسامي." },
  { name: "القسم الإعلامي", description: "قسم من أقسام مبادرة تسامي." },
  { name: "قسم تكنولوجيا المعلومات", description: "قسم من أقسام مبادرة تسامي." },
  { name: "قسم التصميم", description: "قسم من أقسام مبادرة تسامي." },
];

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
    let depts = await db.select().from(departmentsTable).orderBy(departmentsTable.id);
    
    // إدخال الأقسام تلقائياً إن كانت قاعدة البيانات فارغة
    if (depts.length === 0) {
      await db.insert(departmentsTable).values(DEFAULT_DEPARTMENTS);
      depts = await db.select().from(departmentsTable).orderBy(departmentsTable.id);
    }

    const result = await Promise.all(depts.map(formatDept));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to load departments" });
  }
});

export default router;