import { Router, type IRouter } from "express";
import { db, workshopsTable, workshopRegistrationsTable, workshopEvaluationsTable, trainersTable, membersTable, usersTable, certificatesTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function formatWorkshop(w: typeof workshopsTable.$inferSelect) {
  let trainerName: string | null = null;
  if (w.trainerId) {
    const [trainer] = await db.select().from(trainersTable).where(eq(trainersTable.id, w.trainerId));
    trainerName = trainer?.name ?? null;
  }
  const [{ count: registered }] = await db
    .select({ count: count() })
    .from(workshopRegistrationsTable)
    .where(eq(workshopRegistrationsTable.workshopId, w.id));
  const [{ avg: rating }] = await db
    .select({ avg: avg(workshopEvaluationsTable.rating) })
    .from(workshopEvaluationsTable)
    .where(eq(workshopEvaluationsTable.workshopId, w.id));
  return {
    id: w.id,
    title: w.title,
    description: w.description ?? null,
    trainerId: w.trainerId ?? null,
    trainerName,
    workshopDate: w.workshopDate,
    location: w.location ?? null,
    capacity: w.capacity ?? null,
    registeredCount: Number(registered),
    status: w.status,
    imageUrl: w.imageUrl ?? null,
    averageRating: rating ? Number(rating) : null,
    createdAt: w.createdAt,
  };
}

router.get("/workshops", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const workshops = await db.select().from(workshopsTable).orderBy(workshopsTable.workshopDate);
  const result = await Promise.all(workshops.map(formatWorkshop));
  res.json(result);
});

router.post("/workshops", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, description, trainerId, workshopDate, location, capacity, imageUrl } = req.body;
  if (!title || !workshopDate) { res.status(400).json({ error: "Title and workshopDate required" }); return; }
  const [workshop] = await db.insert(workshopsTable).values({ title, description, trainerId, workshopDate: new Date(workshopDate), location, capacity, imageUrl }).returning();
  res.status(201).json(await formatWorkshop(workshop));
});

router.get("/workshops/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [workshop] = await db.select().from(workshopsTable).where(eq(workshopsTable.id, id));
  if (!workshop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatWorkshop(workshop));
});

router.patch("/workshops/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, description, trainerId, workshopDate, location, capacity, status, imageUrl } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (description != null) updateData.description = description;
  if (trainerId !== undefined) updateData.trainerId = trainerId;
  if (workshopDate != null) updateData.workshopDate = new Date(workshopDate);
  if (location != null) updateData.location = location;
  if (capacity != null) updateData.capacity = capacity;
  if (status != null) updateData.status = status;
  if (imageUrl != null) updateData.imageUrl = imageUrl;
  const [updated] = await db.update(workshopsTable).set(updateData).where(eq(workshopsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatWorkshop(updated));
});

router.delete("/workshops/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(workshopsTable).where(eq(workshopsTable.id, id));
  res.sendStatus(204);
});

router.post("/workshops/:id/register", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = parseInt(raw, 10);
  const { memberId } = req.body;
  if (!memberId) { res.status(400).json({ error: "memberId required" }); return; }
  const [reg] = await db.insert(workshopRegistrationsTable).values({ workshopId, memberId }).returning();
  res.status(201).json({ id: reg.id, workshopId: reg.workshopId, memberId: reg.memberId, status: reg.status, attended: reg.attended === "true", createdAt: reg.createdAt, memberName: null });
});

router.get("/workshops/:id/registrations", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = parseInt(raw, 10);
  const regs = await db.select().from(workshopRegistrationsTable).where(eq(workshopRegistrationsTable.workshopId, workshopId));
  const members = await db.select().from(membersTable);
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  res.json(regs.map((r) => {
    const member = memberMap[r.memberId];
    const user = member ? userMap[member.userId] : null;
    return { id: r.id, workshopId: r.workshopId, memberId: r.memberId, memberName: user?.name ?? null, status: r.status, attended: r.attended === "true", createdAt: r.createdAt };
  }));
});

router.post("/workshops/:id/evaluate", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = parseInt(raw, 10);
  const { memberId, rating, comment } = req.body;
  if (!memberId || !rating) { res.status(400).json({ error: "memberId and rating required" }); return; }
  const [evaluation] = await db.insert(workshopEvaluationsTable).values({ workshopId, memberId, rating, comment }).returning();
  // Issue certificate
  const verifyCode = nanoid(16);
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  if (member) {
    await db.insert(certificatesTable).values({ type: "workshop", recipientId: member.userId, workshopId, verifyCode });
  }
  res.status(201).json(evaluation);
});

// Trainers
router.get("/trainers", optionalAuthMiddleware, async (_req, res): Promise<void> => {
  const trainers = await db.select().from(trainersTable).orderBy(trainersTable.name);
  res.json(trainers);
});

router.post("/trainers", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { name, bio, phone, email, avatarUrl } = req.body;
  if (!name) { res.status(400).json({ error: "Name required" }); return; }
  const [trainer] = await db.insert(trainersTable).values({ name, bio, phone, email, avatarUrl }).returning();
  res.status(201).json(trainer);
});

router.patch("/trainers/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, bio, phone, email, avatarUrl } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name != null) updateData.name = name;
  if (bio != null) updateData.bio = bio;
  if (phone != null) updateData.phone = phone;
  if (email != null) updateData.email = email;
  if (avatarUrl != null) updateData.avatarUrl = avatarUrl;
  const [updated] = await db.update(trainersTable).set(updateData).where(eq(trainersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/trainers/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(trainersTable).where(eq(trainersTable.id, id));
  res.sendStatus(204);
});

export default router;
