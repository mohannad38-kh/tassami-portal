import { Router, type IRouter } from "express";
import { db, volunteerHoursTable, membersTable, usersTable, eventsTable } from "@workspace/db";
import { eq, sum, count } from "drizzle-orm";
import { authMiddleware, requireRole, effectiveRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function formatHour(h: typeof volunteerHoursTable.$inferSelect) {
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, h.memberId));
  let memberName: string | null = null;
  if (member) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));
    memberName = user?.name ?? null;
  }
  let eventTitle: string | null = null;
  if (h.eventId) {
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, h.eventId));
    eventTitle = event?.title ?? null;
  }
  return {
    id: h.id,
    memberId: h.memberId,
    memberName,
    eventId: h.eventId ?? null,
    eventTitle,
    hours: Number(h.hours),
    description: h.description ?? null,
    activityDate: h.activityDate,
    createdAt: h.createdAt,
  };
}

async function currentMemberId(userId: number): Promise<number | null> {
  const [member] = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.userId, userId));
  return member?.id ?? null;
}

router.get("/volunteer-hours", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isSecretary = ["secretary", "vice_president", "president", "super_admin"].includes(effectiveRole(user));
  const { memberId } = req.query;
  let hours = await db.select().from(volunteerHoursTable).orderBy(volunteerHoursTable.activityDate);
  if (!isSecretary) {
    const ownMemberId = await currentMemberId(user.userId);
    if (ownMemberId === null) { res.json([]); return; }
    hours = hours.filter((h) => h.memberId === ownMemberId);
  } else if (memberId !== undefined) {
    const parsedMemberId = Number(memberId);
    if (!Number.isInteger(parsedMemberId) || parsedMemberId <= 0) { res.status(400).json({ error: "Invalid memberId" }); return; }
    hours = hours.filter((h) => h.memberId === parsedMemberId);
  }
  res.json(await Promise.all(hours.map(formatHour)));
});

router.post("/volunteer-hours", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { memberId, eventId, hours, description, activityDate } = req.body;
  const parsedMemberId = Number(memberId);
  const parsedHours = Number(hours);
  if (!Number.isInteger(parsedMemberId) || parsedMemberId <= 0 || !Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 24 || typeof activityDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    res.status(400).json({ error: "Valid memberId, hours (0-24), and activityDate (YYYY-MM-DD) are required" }); return;
  }
  const [member] = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.id, parsedMemberId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  const [hour] = await db.insert(volunteerHoursTable).values({ memberId: parsedMemberId, eventId: eventId ? Number(eventId) : null, hours: String(parsedHours), description: typeof description === "string" ? description : null, activityDate }).returning();
  res.status(201).json(await formatHour(hour));
});

router.get("/volunteer-hours/summary", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isSecretary = ["secretary", "vice_president", "president", "super_admin"].includes(effectiveRole(user));
  const members = isSecretary
    ? await db.select().from(membersTable)
    : (await currentMemberId(user.userId)) === null
      ? []
      : await db.select().from(membersTable).where(eq(membersTable.userId, user.userId));
  const result = await Promise.all(
    members.map(async (member) => {
      const [account] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));
      const [{ total }] = await db.select({ total: sum(volunteerHoursTable.hours) }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      const [{ cnt }] = await db.select({ cnt: count() }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      return { memberId: member.id, memberName: account?.name ?? "Unknown", totalHours: Number(total ?? 0), eventCount: Number(cnt) };
    })
  );
  res.json(result.sort((a, b) => b.totalHours - a.totalHours));
});

export default router;
