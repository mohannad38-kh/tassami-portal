import { Router, type IRouter } from "express";
import { db, volunteerHoursTable, membersTable, usersTable, eventsTable } from "@workspace/db";
import { eq, sum, count } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

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

router.get("/volunteer-hours", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const { memberId } = req.query;
  let hours = await db.select().from(volunteerHoursTable).orderBy(volunteerHoursTable.activityDate);
  if (memberId) hours = hours.filter((h) => h.memberId === Number(memberId));
  const result = await Promise.all(hours.map(formatHour));
  res.json(result);
});

router.post("/volunteer-hours", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { memberId, eventId, hours, description, activityDate } = req.body;
  if (!memberId || !hours || !activityDate) { res.status(400).json({ error: "memberId, hours, activityDate required" }); return; }
  const [hour] = await db.insert(volunteerHoursTable).values({ memberId, eventId, hours: String(hours), description, activityDate }).returning();
  res.status(201).json(await formatHour(hour));
});

router.get("/volunteer-hours/summary", authMiddleware, requireRole("member"), async (_req, res): Promise<void> => {
  const members = await db.select().from(membersTable);
  const result = await Promise.all(
    members.map(async (member) => {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));
      const [{ total }] = await db.select({ total: sum(volunteerHoursTable.hours) }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      const [{ cnt }] = await db.select({ cnt: count() }).from(volunteerHoursTable).where(eq(volunteerHoursTable.memberId, member.id));
      return { memberId: member.id, memberName: user?.name ?? "Unknown", totalHours: Number(total ?? 0), eventCount: Number(cnt) };
    })
  );
  res.json(result.sort((a, b) => b.totalHours - a.totalHours));
});

export default router;
