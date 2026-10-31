import { Router, type IRouter } from "express";
import { db, membersTable, usersTable, departmentsTable, volunteerHoursTable } from "@workspace/db";
import { eq, sum } from "drizzle-orm";
import { authMiddleware, requireRole, effectiveRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function formatMember(m: typeof membersTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, m.userId));
  let deptName: string | null = null;
  if (m.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, m.departmentId));
    deptName = dept?.name ?? null;
  }
  const hoursResult = await db
    .select({ total: sum(volunteerHoursTable.hours) })
    .from(volunteerHoursTable)
    .where(eq(volunteerHoursTable.memberId, m.id));
  const totalHours = Number(hoursResult[0]?.total ?? 0);
  return {
    id: m.id,
    userId: m.userId,
    userName: user?.name ?? null,
    userEmail: user?.email ?? null,
    userPhone: user?.phone ?? null,
    membershipNumber: m.membershipNumber,
    status: m.status,
    departmentId: m.departmentId ?? null,
    departmentName: deptName,
    totalVolunteerHours: totalHours,
    qrCode: m.qrCode ?? null,
    createdAt: m.createdAt,
  };
}

router.get("/members", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { status, departmentId } = req.query;
  let members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
  if (status) members = members.filter((m) => m.status === status);
  if (departmentId) members = members.filter((m) => m.departmentId === Number(departmentId));
  const result = await Promise.all(members.map(formatMember));
  res.json(result);
});

router.post("/members", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { userId, departmentId } = req.body;
  if (!Number.isSafeInteger(userId) || userId < 1 || (departmentId !== undefined && departmentId !== null && (!Number.isSafeInteger(departmentId) || departmentId < 1))) { res.status(400).json({ error: "Valid userId and departmentId are required" }); return; }
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [existingMember] = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.userId, userId));
  if (existingMember) { res.status(409).json({ error: "User already has a membership" }); return; }
  if (departmentId != null) { const [department] = await db.select({ id: departmentsTable.id }).from(departmentsTable).where(eq(departmentsTable.id, departmentId)); if (!department) { res.status(400).json({ error: "Department not found" }); return; } }
  const membershipNumber = `TSM-${String(Date.now()).slice(-6)}-${nanoid(4).toUpperCase()}`;
  const qrCode = `TSM-QR-${nanoid(12)}`;
  const [member] = await db
    .insert(membersTable)
    .values({ userId, departmentId, membershipNumber, qrCode })
    .returning();
  res.status(201).json(await formatMember(member));
});

router.get("/members/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid member ID" }); return; }
  const user = (req as typeof req & { user: JwtPayload }).user;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  if (effectiveRole(user) !== "secretary" && member.userId !== user.userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  res.json(await formatMember(member));
});

router.patch("/members/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid member ID" }); return; }
  const { status, departmentId } = req.body;
  const updateData: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!["active", "pending", "rejected"].includes(status)) { res.status(400).json({ error: "Invalid membership status" }); return; }
    updateData.status = status;
  }
  if (departmentId !== undefined) {
    if (departmentId !== null && (!Number.isSafeInteger(departmentId) || departmentId < 1)) { res.status(400).json({ error: "Invalid department ID" }); return; }
    if (departmentId !== null) {
      const [department] = await db.select({ id: departmentsTable.id }).from(departmentsTable).where(eq(departmentsTable.id, departmentId));
      if (!department) { res.status(400).json({ error: "Department not found" }); return; }
    }
    updateData.departmentId = departmentId;
  }
  if (Object.keys(updateData).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(membersTable).set(updateData).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMember(updated));
});

router.delete("/members/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid member ID" }); return; }
  const [deleted] = await db.delete(membersTable).where(eq(membersTable.id, id)).returning({ id: membersTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/members/:id/approve", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid member ID" }); return; }
  const [updated] = await db.update(membersTable).set({ status: "active" }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMember(updated));
});

router.post("/members/:id/reject", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Invalid member ID" }); return; }
  const [updated] = await db.update(membersTable).set({ status: "rejected" }).where(eq(membersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMember(updated));
});

export default router;
