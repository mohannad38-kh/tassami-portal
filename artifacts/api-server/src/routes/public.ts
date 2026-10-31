import { Router, type IRouter } from "express";
import { db, partnersTable, galleryTable, joinRequestsTable, eventsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

function validOptionalUrl(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try { const parsed = new URL(value); return parsed.protocol === "https:" || parsed.protocol === "http:"; } catch { return false; }
}

function validId(raw: string): number | null {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get("/public/stats", async (_req, res): Promise<void> => {
  const [{ registeredVolunteers }] = await db
    .select({ registeredVolunteers: count() })
    .from(joinRequestsTable)
    .where(eq(joinRequestsTable.status, "approved"));
  res.json({ registeredVolunteers: Number(registeredVolunteers) });
});

// Partners
router.get("/partners", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const partners = await db.select().from(partnersTable).orderBy(partnersTable.name);
  res.json(partners);
});

router.post("/partners", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { name, logoUrl, website, partnerType } = req.body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 200 || !validOptionalUrl(logoUrl) || !validOptionalUrl(website) || (partnerType !== undefined && (typeof partnerType !== "string" || partnerType.length > 100))) { res.status(400).json({ error: "Valid partner name, URLs, and type are required" }); return; }
  const [partner] = await db.insert(partnersTable).values({ name, logoUrl, website, partnerType }).returning();
  res.status(201).json(partner);
});

router.patch("/partners/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = validId(raw);
  if (!id) { res.status(400).json({ error: "Invalid partner ID" }); return; }
  const { name, logoUrl, website, partnerType } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) { if (typeof name !== "string" || !name.trim() || name.trim().length > 200) { res.status(400).json({ error: "Invalid partner name" }); return; } updateData.name = name.trim(); }
  if (logoUrl !== undefined) { if (!validOptionalUrl(logoUrl)) { res.status(400).json({ error: "Invalid logo URL" }); return; } updateData.logoUrl = logoUrl; }
  if (website !== undefined) { if (!validOptionalUrl(website)) { res.status(400).json({ error: "Invalid website URL" }); return; } updateData.website = website; }
  if (partnerType !== undefined) { if (partnerType !== null && (typeof partnerType !== "string" || partnerType.length > 100)) { res.status(400).json({ error: "Invalid partner type" }); return; } updateData.partnerType = partnerType; }
  if (Object.keys(updateData).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(partnersTable).set(updateData).where(eq(partnersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/partners/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = validId(raw);
  if (!id) { res.status(400).json({ error: "Invalid partner ID" }); return; }
  const [deleted] = await db.delete(partnersTable).where(eq(partnersTable.id, id)).returning({ id: partnersTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Gallery
router.get("/gallery", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const { eventId } = req.query;
  let items = await db.select().from(galleryTable).orderBy(galleryTable.createdAt);
  if (eventId) items = items.filter((i) => i.eventId === String(eventId));
  res.json(items.map((i) => ({ id: i.id, title: i.title ?? null, imageUrl: i.imageUrl, eventId: i.eventId ? parseInt(i.eventId) : null, eventTitle: null, createdAt: i.createdAt })).reverse());
});

router.post("/gallery", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, imageUrl, eventId } = req.body;
  if (!validOptionalUrl(imageUrl) || typeof imageUrl !== "string" || !imageUrl.trim() || (title !== undefined && title !== null && (typeof title !== "string" || title.length > 200))) { res.status(400).json({ error: "Valid image URL and title are required" }); return; }
  if (eventId !== undefined && eventId !== null && eventId !== "") {
    const parsedEventId = Number(eventId);
    if (!Number.isSafeInteger(parsedEventId) || parsedEventId < 1) { res.status(400).json({ error: "Invalid event ID" }); return; }
    const [event] = await db.select({ id: eventsTable.id }).from(eventsTable).where(eq(eventsTable.id, parsedEventId));
    if (!event) { res.status(400).json({ error: "Event not found" }); return; }
  }
  const [item] = await db.insert(galleryTable).values({ title, imageUrl, eventId: eventId ? String(eventId) : undefined }).returning();
  res.status(201).json({ id: item.id, title: item.title ?? null, imageUrl: item.imageUrl, eventId: item.eventId ? parseInt(item.eventId) : null, eventTitle: null, createdAt: item.createdAt });
});

router.delete("/gallery/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = validId(raw);
  if (!id) { res.status(400).json({ error: "Invalid gallery item ID" }); return; }
  const [deleted] = await db.delete(galleryTable).where(eq(galleryTable.id, id)).returning({ id: galleryTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
