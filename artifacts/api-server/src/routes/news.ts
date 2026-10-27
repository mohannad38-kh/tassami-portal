import { Router, type IRouter } from "express";
import { db, newsTable, announcementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function formatNews(n: typeof newsTable.$inferSelect) {
  let authorName: string | null = null;
  if (n.authorId) {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, n.authorId));
    authorName = author?.name ?? null;
  }
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    imageUrl: n.imageUrl ?? null,
    authorId: n.authorId ?? null,
    authorName,
    publishedAt: n.publishedAt?.toISOString() ?? null,
    createdAt: n.createdAt,
  };
}

router.get("/news", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const newsItems = await db.select().from(newsTable).orderBy(newsTable.createdAt);
  const result = await Promise.all(newsItems.map(formatNews));
  res.json(result.reverse());
});

router.post("/news", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { title, body, imageUrl } = req.body;
  if (!title || !body) { res.status(400).json({ error: "Title and body required" }); return; }
  const [newsItem] = await db.insert(newsTable).values({ title, body, imageUrl, authorId: user.userId, publishedAt: new Date() }).returning();
  res.status(201).json(await formatNews(newsItem));
});

router.get("/news/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [newsItem] = await db.select().from(newsTable).where(eq(newsTable.id, id));
  if (!newsItem) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatNews(newsItem));
});

router.patch("/news/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, body, imageUrl } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (body != null) updateData.body = body;
  if (imageUrl != null) updateData.imageUrl = imageUrl;
  const [updated] = await db.update(newsTable).set(updateData).where(eq(newsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatNews(updated));
});

router.delete("/news/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(newsTable).where(eq(newsTable.id, id));
  res.sendStatus(204);
});

// Announcements
async function formatAnnouncement(a: typeof announcementsTable.$inferSelect) {
  let authorName: string | null = null;
  if (a.authorId) {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, a.authorId));
    authorName = author?.name ?? null;
  }
  return { id: a.id, title: a.title, body: a.body, targetRole: a.targetRole ?? null, authorId: a.authorId ?? null, authorName, createdAt: a.createdAt };
}

router.get("/announcements", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const items = await db.select().from(announcementsTable).orderBy(announcementsTable.createdAt);
  const result = await Promise.all(items.map(formatAnnouncement));
  res.json(result.reverse());
});

router.post("/announcements", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { title, body, targetRole } = req.body;
  if (!title || !body) { res.status(400).json({ error: "Title and body required" }); return; }
  const [announcement] = await db.insert(announcementsTable).values({ title, body, targetRole, authorId: user.userId }).returning();
  res.status(201).json(await formatAnnouncement(announcement));
});

router.patch("/announcements/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, body, targetRole } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (body != null) updateData.body = body;
  if (targetRole != null) updateData.targetRole = targetRole;
  const [updated] = await db.update(announcementsTable).set(updateData).where(eq(announcementsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatAnnouncement(updated));
});

router.delete("/announcements/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.sendStatus(204);
});

export default router;
