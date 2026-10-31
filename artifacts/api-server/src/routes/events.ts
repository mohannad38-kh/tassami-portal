import { Router, type IRouter } from "express";
import { db, eventsTable, eventRegistrationsTable, membersTable, usersTable, certificatesTable, volunteerHoursTable, activityLogTable } from "@workspace/db";
import { eq, count, inArray } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";
import { nanoid } from "nanoid";

const router: IRouter = Router();

const EVENT_STATUSES = ["upcoming", "completed", "cancelled"] as const;
function parsePositiveId(raw: string): number | null {
  if (!/^\\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
function validDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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
  if (status !== undefined && (typeof status !== "string" || !EVENT_STATUSES.includes(status as typeof EVENT_STATUSES[number]))) {
    res.status(400).json({ error: "Invalid event status" }); return;
  }
  let events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
  if (status) events = events.filter((e) => e.status === status);
  const result = await Promise.all(events.map(formatEvent));
  res.json(result);
});

router.post("/events", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, description, eventDate, location, capacity, imageUrl } = req.body ?? {};
  const date = validDate(eventDate);
  if (typeof title !== "string" || !title.trim() || title.length > 200 || !date ||
      (description != null && (typeof description !== "string" || description.length > 20000)) ||
      (location != null && (typeof location !== "string" || location.length > 500)) ||
      (capacity != null && (!Number.isSafeInteger(capacity) || capacity <= 0)) ||
      (imageUrl != null && (typeof imageUrl !== "string" || imageUrl.length > 2048))) {
    res.status(400).json({ error: "Invalid event details" }); return;
  }
  const [event] = await db.insert(eventsTable).values({ title: title.trim(), description: description ?? null, eventDate: date, location: location ?? null, capacity: capacity ?? null, imageUrl: imageUrl ?? null }).returning();
  await db.insert(activityLogTable).values({ type: "event_created", description: `تم إنشاء فعالية: ${title}` });
  res.status(201).json(await formatEvent(event));
});

router.get("/events/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parsePositiveId(raw);
  if (id === null) { res.status(400).json({ error: "Invalid event id" }); return; }
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatEvent(event));
});

router.patch("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parsePositiveId(raw);
  if (id === null) { res.status(400).json({ error: "Invalid event id" }); return; }
  const { title, description, eventDate, location, capacity, status, imageUrl } = req.body ?? {};
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.length > 200) { res.status(400).json({ error: "Invalid title" }); return; }
    updateData.title = title.trim();
  }
  if (description !== undefined) {
    if (description !== null && (typeof description !== "string" || description.length > 20000)) { res.status(400).json({ error: "Invalid description" }); return; }
    updateData.description = description;
  }
  if (eventDate !== undefined) {
    const date = validDate(eventDate);
    if (!date) { res.status(400).json({ error: "Invalid eventDate" }); return; }
    updateData.eventDate = date;
  }
  if (location !== undefined) {
    if (location !== null && (typeof location !== "string" || location.length > 500)) { res.status(400).json({ error: "Invalid location" }); return; }
    updateData.location = location;
  }
  if (capacity !== undefined) {
    if (capacity !== null && (!Number.isSafeInteger(capacity) || capacity <= 0)) { res.status(400).json({ error: "Invalid capacity" }); return; }
    updateData.capacity = capacity;
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !EVENT_STATUSES.includes(status as typeof EVENT_STATUSES[number])) { res.status(400).json({ error: "Invalid status" }); return; }
    updateData.status = status;
  }
  if (imageUrl !== undefined) {
    if (imageUrl !== null && (typeof imageUrl !== "string" || imageUrl.length > 2048)) { res.status(400).json({ error: "Invalid imageUrl" }); return; }
    updateData.imageUrl = imageUrl;
  }
  if (!Object.keys(updateData).length) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(eventsTable).set(updateData).where(eq(eventsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatEvent(updated));
});

router.delete("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parsePositiveId(raw);
  if (id === null) { res.status(400).json({ error: "Invalid event id" }); return; }
  const [deleted] = await db.delete(eventsTable).where(eq(eventsTable.id, id)).returning({ id: eventsTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/events/:id/register", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = Number(raw);
  const user = (req as typeof req & { user: { userId: number } }).user;
  if (!Number.isSafeInteger(eventId) || eventId <= 0) { res.status(400).json({ error: "Invalid event id" }); return; }

  // Resolve the member from the verified session; never trust a client-supplied memberId.
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, user.userId));
  if (!member || member.status !== "active") { res.status(403).json({ error: "An active membership is required" }); return; }
  const registration = await db.transaction(async (tx) => {
    // Lock the parent event so simultaneous requests for this event are serialized.
    const [event] = await tx.select().from(eventsTable).where(eq(eventsTable.id, eventId)).for("update");
    if (!event) return { error: "not_found" as const };
    if (event.status !== "upcoming" || event.eventDate <= new Date()) return { error: "closed" as const };

    const registrations = await tx.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, eventId));
    if (registrations.some((registration) => registration.memberId === member.id)) return { error: "duplicate" as const };
    if (event.capacity != null && registrations.filter((registration) => registration.status === "registered").length >= event.capacity) return { error: "full" as const };

    const [reg] = await tx.insert(eventRegistrationsTable).values({ eventId, memberId: member.id }).returning();
    return { reg };
  });
  if ("error" in registration) {
    if (registration.error === "not_found") { res.status(404).json({ error: "Event not found" }); return; }
    if (registration.error === "closed") { res.status(409).json({ error: "Registration is closed" }); return; }
    if (registration.error === "duplicate") { res.status(409).json({ error: "Already registered" }); return; }
    res.status(409).json({ error: "Event is full" }); return;
  }
  const reg = registration.reg;
  res.status(201).json({ id: reg.id, eventId: reg.eventId, memberId: reg.memberId, status: reg.status, attended: reg.attended === "true", createdAt: reg.createdAt, memberName: null });
});

router.get("/events/:id/registrations", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = parsePositiveId(raw);
  if (eventId === null) { res.status(400).json({ error: "Invalid event id" }); return; }
  const regs = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, eventId));
  const memberIds = regs.map((r) => r.memberId);
  const members = memberIds.length > 0 ? await db.select().from(membersTable).where(inArray(membersTable.id, memberIds)) : [];
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const userIds = members.map((m) => m.userId);
  const users = userIds.length > 0 ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  res.json(regs.map((r) => {
    const member = memberMap[r.memberId];
    const user = member ? userMap[member.userId] : null;
    return { id: r.id, eventId: r.eventId, memberId: r.memberId, memberName: user?.name ?? null, status: r.status, attended: r.attended === "true", createdAt: r.createdAt };
  }));
});

router.post("/events/:id/attendance", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const eventId = parsePositiveId(raw);
  const { qrCode } = req.body ?? {};
  if (eventId === null) { res.status(400).json({ error: "Invalid event id" }); return; }
  if (typeof qrCode !== "string" || !qrCode.trim() || qrCode.length > 500) {
    res.status(400).json({ error: "Invalid QR code" }); return;
  }
  const member = await db.select().from(membersTable).where(eq(membersTable.qrCode, qrCode.trim()));
  if (!member[0]) { res.status(404).json({ error: "Member not found" }); return; }
  const attendance = await db.transaction(async (tx) => {
    // Serialize attendance scans for this event and issue records only once.
    const [event] = await tx.select().from(eventsTable).where(eq(eventsTable.id, eventId)).for("update");
    if (!event) return { error: "event_not_found" as const };
    const regs = await tx.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, eventId));
    const reg = regs.find((r) => r.memberId === member[0].id);
    if (!reg) return { error: "registration_not_found" as const };
    if (reg.attended === "true") return { reg, alreadyAttended: true as const };

    const [updated] = await tx.update(eventRegistrationsTable)
      .set({ attended: "true" })
      .where(eq(eventRegistrationsTable.id, reg.id))
      .returning();
    if (!updated) throw new Error("Could not update event attendance");
    await tx.insert(certificatesTable).values({ type: "event", recipientId: member[0].userId, eventId, verifyCode: nanoid(16) });
    await tx.insert(volunteerHoursTable).values({
      memberId: member[0].id, eventId, hours: "2",
      activityDate: new Date().toISOString().slice(0, 10),
      description: `حضور فعالية: ${event.title}`,
    });
    return { reg: updated, alreadyAttended: false as const };
  });
  if ("error" in attendance) {
    if (attendance.error === "event_not_found") { res.status(404).json({ error: "Event not found" }); return; }
    res.status(404).json({ error: "Registration not found" }); return;
  }
  const updated = attendance.reg;
  res.json({ id: updated.id, eventId: updated.eventId, memberId: updated.memberId, status: updated.status, attended: true, createdAt: updated.createdAt, memberName: null });
});

export default router;
