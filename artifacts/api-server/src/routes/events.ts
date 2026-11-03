import { Router, type IRouter } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

const DEFAULT_EVENTS = [
  {
    title: "ملتقى الشباب المبدع",
    description: "ملتقى يجمع المبدعين لعرض أفكارهم ومشاريعهم التطوعية.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 50,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 7),
  },
  {
    title: "يوم التطوع البيئي",
    description: "مبادرة ميدانية لنشر الوعي البيئي وتنظيف المساحات العامة.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 100,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 14),
  },
  {
    title: "ورشة لتعلم اساسيات البرمجة والروبوتات",
    description: "ورشة تعليمية وتطبيقية حول مفاهيم البرمجة وبناء الروبوتات.",
    location: "سيتم الإعلان عنها لاحقاً",
    capacity: 30,
    status: "published",
    eventDate: new Date(Date.now() + 86400000 * 21),
  },
];

router.get("/events", async (_req, res): Promise<void> => {
  try {
    let events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
    
    if (events.length === 0) {
      await db.insert(eventsTable).values(DEFAULT_EVENTS);
      events = await db.select().from(eventsTable).orderBy(eventsTable.eventDate);
    }

    res.json(events);
  } catch (error) {
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

export default router;