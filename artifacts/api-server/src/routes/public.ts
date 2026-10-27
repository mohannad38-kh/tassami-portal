import { Router, type IRouter } from "express";
import { db, partnersTable, galleryTable, joinRequestsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

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
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  const [partner] = await db.insert(partnersTable).values({ name, logoUrl, website, partnerType }).returning();
  res.status(201).json(partner);
});

router.patch("/partners/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, logoUrl, website, partnerType } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name != null) updateData.name = name;
  if (logoUrl != null) updateData.logoUrl = logoUrl;
  if (website != null) updateData.website = website;
  if (partnerType != null) updateData.partnerType = partnerType;
  const [updated] = await db.update(partnersTable).set(updateData).where(eq(partnersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/partners/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(partnersTable).where(eq(partnersTable.id, id));
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
  if (!imageUrl) { res.status(400).json({ error: "imageUrl required" }); return; }
  const [item] = await db.insert(galleryTable).values({ title, imageUrl, eventId: eventId ? String(eventId) : undefined }).returning();
  res.status(201).json({ id: item.id, title: item.title ?? null, imageUrl: item.imageUrl, eventId: item.eventId ? parseInt(item.eventId) : null, eventTitle: null, createdAt: item.createdAt });
});

router.delete("/gallery/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(galleryTable).where(eq(galleryTable.id, id));
  res.sendStatus(204);
});

export default router;
