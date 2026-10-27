import { Router, type IRouter } from "express";
import { db, eventsTable, eventRegistrationsTable, membersTable, usersTable, certificatesTable, volunteerHoursTable, activityLogTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function formatEvent(event: typeof eventsTable.$inferSelect) {
  const [{ count: registered }] = await db
    .select({ count: count() })
    .from(eventRegistrationsTable)
    .where(eq(eventRegistrationsTable.eventId, event.id));
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    eventDate: event.eventDate,
    location: event.location ?? null,
    capacity: event.capacity ?? null,
    registeredCount: Number(registered),
    status: event.status,
    imageUrl: event.imageUrl ?? null,
    createdAt: event.createdAt,
  };
}

router.get("/events", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const { status } = req.query;
  let events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
  if (status) events = events.filter((e) => e.status === status);
  const result = await Promise.all(events.map(formatEvent));
  res.json(result);
});

router.post("/events", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, description, eventDate, location, capacity, imageUrl } = req.body;
  if (!title || !eventDate) { res.status(400).json({ error: "Title and eventDate required" }); return; }
  const [event] = await db.insert(eventsTable).values({ title, description, eventDate: new Date(eventDate), location, capacity, imageUrl }).returning();
  await db.insert(activityLogTable).values({ type: "event_created", description: `تم إنشاء فعالية: ${title}` });
  res.status(201).json(await formatEvent(event));
});

router.get("/events/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatEvent(event));
});

router.patch("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, description, eventDate, location, capacity, status, imageUrl } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (description != null) updateData.description = description;
  if (eventDate != null) updateData.eventDate = new Date(eventDate);
  if (location != null) updateData.location = location;
  if (capacity != null) updateData.capacity = capacity;
  if (status != null) updateData.status = status;
  if (imageUrl != null) updateData.imageUrl = imageUrl;
  const [updated] = await db.update(eventsTable).set(updateData).where(eq(eventsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatEvent(updated));
});

router.delete("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

router.post("/events/:id/register", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = parseInt(raw, 10);
  const { memberId } = req.body;
  if (!memberId) { res.status(400).json({ error: "memberId required" }); return; }
  const [reg] = await db.insert(eventRegistrationsTable).values({ eventId, memberId }).returning();
  res.status(201).json({ id: reg.id, eventId: reg.eventId, memberId: reg.memberId, status: reg.status, attended: reg.attended === "true", createdAt: reg.createdAt, memberName: null });
});

router.get("/events/:id/registrations", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = parseInt(raw, 10);
  const regs = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, eventId));
  const memberIds = regs.map((r) => r.memberId);
  const members = memberIds.length > 0 ? await db.select().from(membersTable) : [];
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const userIds = members.map((m) => m.userId);
  const users = userIds.length > 0 ? await db.select().from(usersTable) : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  res.json(regs.map((r) => {
    const member = memberMap[r.memberId];
    const user = member ? userMap[member.userId] : null;
    return { id: r.id, eventId: r.eventId, memberId: r.memberId, memberName: user?.name ?? null, status: r.status, attended: r.attended === "true", createdAt: r.createdAt };
  }));
});

router.post("/events/:id/attendance", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = parseInt(raw, 10);
  const { qrCode } = req.body;
  const member = await db.select().from(membersTable).where(eq(membersTable.qrCode, qrCode));
  if (!member[0]) { res.status(404).json({ error: "Member not found" }); return; }
  const regs = await db.select().from(eventRegistrationsTable)
    .where(eq(eventRegistrationsTable.eventId, eventId));
  const reg = regs.find((r) => r.memberId === member[0].id);
  if (!reg) { res.status(404).json({ error: "Registration not found" }); return; }
  const [updated] = await db.update(eventRegistrationsTable)
    .set({ attended: "true" })
    .where(eq(eventRegistrationsTable.id, reg.id))
    .returning();
  // Issue certificate
  const verifyCode = nanoid(16);
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
  await db.insert(certificatesTable).values({ type: "event", recipientId: member[0].userId, eventId, verifyCode });
  // Log volunteer hours (2 hours default)
  await db.insert(volunteerHoursTable).values({ memberId: member[0].id, eventId, hours: "2", activityDate: new Date().toISOString().slice(0, 10), description: `حضور فعالية: ${event?.title}` });
  res.json({ id: updated.id, eventId: updated.eventId, memberId: updated.memberId, status: updated.status, attended: true, createdAt: updated.createdAt, memberName: null });
});

export default router;
