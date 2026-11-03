import { Router, type IRouter } from "express";
import { db, eventsTable, eventRegistrationsTable, volunteerHoursTable, certificatesTable, galleryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/events", async (_req, res): Promise<void> => {
  try {
    const events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
    res.json(events);
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch events");
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/events", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, description, eventDate, location, capacity } = req.body ?? {};
  const date = typeof eventDate === "string" ? new Date(eventDate) : null;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 200 ||
    !date ||
    Number.isNaN(date.getTime()) ||
    (description !== undefined && description !== null && (typeof description !== "string" || description.length > 20000)) ||
    (location !== undefined && location !== null && (typeof location !== "string" || location.length > 500)) ||
    (capacity !== undefined && (!Number.isSafeInteger(capacity) || capacity <= 0))
  ) {
    res.status(400).json({ error: "Enter a valid title, date, description, location, and capacity" });
    return;
  }

  const user = (req as Request & { user: JwtPayload }).user;
  const [event] = await db.insert(eventsTable).values({
    title: title.trim(),
    description: description ?? null,
    eventDate: date,
    location: location ?? null,
    capacity: capacity ?? null,
    createdBy: user.userId,
  }).returning();
  res.status(201).json(event);
});

router.patch("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const { title, description, eventDate, location, capacity, status } = req.body ?? {};
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.length > 200) {
      res.status(400).json({ error: "Invalid title" });
      return;
    }
    updateData.title = title.trim();
  }
  if (description !== undefined) {
    if (description !== null && (typeof description !== "string" || description.length > 20000)) {
      res.status(400).json({ error: "Invalid description" });
      return;
    }
    updateData.description = description;
  }
  if (eventDate !== undefined) {
    const date = typeof eventDate === "string" ? new Date(eventDate) : null;
    if (!date || Number.isNaN(date.getTime())) {
      res.status(400).json({ error: "Invalid eventDate" });
      return;
    }
    updateData.eventDate = date;
  }
  if (location !== undefined) {
    if (location !== null && (typeof location !== "string" || location.length > 500)) {
      res.status(400).json({ error: "Invalid location" });
      return;
    }
    updateData.location = location;
  }
  if (capacity !== undefined) {
    if (capacity !== null && (!Number.isSafeInteger(capacity) || capacity <= 0)) {
      res.status(400).json({ error: "Invalid capacity" });
      return;
    }
    updateData.capacity = capacity;
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    updateData.status = status;
  }
  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [event] = await db.update(eventsTable).set(updateData).where(eq(eventsTable.id, id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

router.delete("/events/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const [event] = await db.select({ id: eventsTable.id }).from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const [registration] = await db.select({ id: eventRegistrationsTable.id })
    .from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id)).limit(1);
  const [volunteerHour] = await db.select({ id: volunteerHoursTable.id })
    .from(volunteerHoursTable).where(eq(volunteerHoursTable.eventId, id)).limit(1);
  const [certificate] = await db.select({ id: certificatesTable.id })
    .from(certificatesTable).where(eq(certificatesTable.eventId, id)).limit(1);
  if (registration || volunteerHour || certificate) {
    res.status(409).json({ error: "This event has registrations, volunteer hours, or certificates and cannot be deleted" });
    return;
  }

  await db.update(galleryTable).set({ eventId: null }).where(eq(galleryTable.eventId, String(id)));
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.sendStatus(204);
});

export default router;