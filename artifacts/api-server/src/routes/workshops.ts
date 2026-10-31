import { Router, type IRouter } from "express";
import { db, workshopsTable, workshopRegistrationsTable, workshopEvaluationsTable, trainersTable, membersTable, usersTable, certificatesTable } from "@workspace/db";
import { eq, count, avg, inArray } from "drizzle-orm";
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
  const { title, description, trainerId, workshopDate, location, capacity, imageUrl } = req.body ?? {};
  const date = typeof workshopDate === "string" ? new Date(workshopDate) : null;
  if (typeof title !== "string" || !title.trim() || title.length > 200 || !date || Number.isNaN(date.getTime()) ||
      (description != null && (typeof description !== "string" || description.length > 20000)) ||
      (location != null && (typeof location !== "string" || location.length > 500)) ||
      (imageUrl != null && (typeof imageUrl !== "string" || imageUrl.length > 2048)) ||
      (capacity != null && (!Number.isSafeInteger(capacity) || capacity <= 0)) ||
      (trainerId != null && (!Number.isSafeInteger(trainerId) || trainerId <= 0))) {
    res.status(400).json({ error: "Invalid workshop details" }); return;
  }
  if (trainerId != null) {
    const [trainer] = await db.select({ id: trainersTable.id }).from(trainersTable).where(eq(trainersTable.id, trainerId));
    if (!trainer) { res.status(404).json({ error: "Trainer not found" }); return; }
  }
  const [workshop] = await db.insert(workshopsTable).values({ title: title.trim(), description: description ?? null, trainerId: trainerId ?? null, workshopDate: date, location: location ?? null, capacity: capacity ?? null, imageUrl: imageUrl ?? null }).returning();
  res.status(201).json(await formatWorkshop(workshop));
});

router.get("/workshops/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }
  const [workshop] = await db.select().from(workshopsTable).where(eq(workshopsTable.id, id));
  if (!workshop) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatWorkshop(workshop));
});

router.patch("/workshops/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }
  const { title, description, trainerId, workshopDate, location, capacity, status, imageUrl } = req.body ?? {};
  const updateData: Record<string, unknown> = {};
  if (title !== undefined) { if (typeof title !== "string" || !title.trim() || title.length > 200) { res.status(400).json({ error: "Invalid title" }); return; } updateData.title = title.trim(); }
  if (description !== undefined) { if (description !== null && (typeof description !== "string" || description.length > 20000)) { res.status(400).json({ error: "Invalid description" }); return; } updateData.description = description; }
  if (trainerId !== undefined) {
    if (trainerId !== null && (!Number.isSafeInteger(trainerId) || trainerId <= 0)) { res.status(400).json({ error: "Invalid trainerId" }); return; }
    if (trainerId !== null) { const [trainer] = await db.select({ id: trainersTable.id }).from(trainersTable).where(eq(trainersTable.id, trainerId)); if (!trainer) { res.status(404).json({ error: "Trainer not found" }); return; } }
    updateData.trainerId = trainerId;
  }
  if (workshopDate !== undefined) { const date = typeof workshopDate === "string" ? new Date(workshopDate) : null; if (!date || Number.isNaN(date.getTime())) { res.status(400).json({ error: "Invalid workshopDate" }); return; } updateData.workshopDate = date; }
  if (location !== undefined) { if (location !== null && (typeof location !== "string" || location.length > 500)) { res.status(400).json({ error: "Invalid location" }); return; } updateData.location = location; }
  if (capacity !== undefined) { if (capacity !== null && (!Number.isSafeInteger(capacity) || capacity <= 0)) { res.status(400).json({ error: "Invalid capacity" }); return; } updateData.capacity = capacity; }
  if (status !== undefined) { if (!["upcoming", "ongoing", "completed", "cancelled"].includes(status)) { res.status(400).json({ error: "Invalid status" }); return; } updateData.status = status; }
  if (imageUrl !== undefined) { if (imageUrl !== null && (typeof imageUrl !== "string" || imageUrl.length > 2048)) { res.status(400).json({ error: "Invalid imageUrl" }); return; } updateData.imageUrl = imageUrl; }
  if (!Object.keys(updateData).length) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(workshopsTable).set(updateData).where(eq(workshopsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatWorkshop(updated));
});

router.delete("/workshops/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }
  const [deleted] = await db.delete(workshopsTable).where(eq(workshopsTable.id, id)).returning({ id: workshopsTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/workshops/:id/register", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = Number(raw);
  const user = (req as typeof req & { user: { userId: number } }).user;
  if (!Number.isSafeInteger(workshopId) || workshopId <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }

  // Resolve the member from the verified session; never trust a client-supplied memberId.
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, user.userId));
  if (!member || member.status !== "active") { res.status(403).json({ error: "An active membership is required" }); return; }
  const registration = await db.transaction(async (tx) => {
    // Lock the parent workshop so simultaneous requests are serialized.
    const [workshop] = await tx.select().from(workshopsTable).where(eq(workshopsTable.id, workshopId)).for("update");
    if (!workshop) return { error: "not_found" as const };
    if (workshop.status !== "upcoming" || workshop.workshopDate <= new Date()) return { error: "closed" as const };

    const registrations = await tx.select().from(workshopRegistrationsTable).where(eq(workshopRegistrationsTable.workshopId, workshopId));
    if (registrations.some((registration) => registration.memberId === member.id)) return { error: "duplicate" as const };
    if (workshop.capacity != null && registrations.filter((registration) => registration.status === "registered").length >= workshop.capacity) return { error: "full" as const };

    const [reg] = await tx.insert(workshopRegistrationsTable).values({ workshopId, memberId: member.id }).returning();
    return { reg };
  });
  if ("error" in registration) {
    if (registration.error === "not_found") { res.status(404).json({ error: "Workshop not found" }); return; }
    if (registration.error === "closed") { res.status(409).json({ error: "Registration is closed" }); return; }
    if (registration.error === "duplicate") { res.status(409).json({ error: "Already registered" }); return; }
    res.status(409).json({ error: "Workshop is full" }); return;
  }
  const reg = registration.reg;
  res.status(201).json({ id: reg.id, workshopId: reg.workshopId, memberId: reg.memberId, status: reg.status, attended: reg.attended === "true", createdAt: reg.createdAt, memberName: null });
});

router.get("/workshops/:id/registrations", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = Number(raw);
  if (!Number.isSafeInteger(workshopId) || workshopId <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }
  const regs = await db.select().from(workshopRegistrationsTable).where(eq(workshopRegistrationsTable.workshopId, workshopId));
  const memberIds = regs.map((r) => r.memberId);
  const members = memberIds.length ? await db.select().from(membersTable).where(inArray(membersTable.id, memberIds)) : [];
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const userIds = members.map((m) => m.userId);
  const users = userIds.length ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds)) : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  res.json(regs.map((r) => {
    const member = memberMap[r.memberId];
    const user = member ? userMap[member.userId] : null;
    return { id: r.id, workshopId: r.workshopId, memberId: r.memberId, memberName: user?.name ?? null, status: r.status, attended: r.attended === "true", createdAt: r.createdAt };
  }));
});

router.post("/workshops/:id/attendance", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = Number(raw);
  const { qrCode } = req.body ?? {};
  if (!Number.isSafeInteger(workshopId) || workshopId <= 0) { res.status(400).json({ error: "Invalid workshop id" }); return; }
  if (typeof qrCode !== "string" || !qrCode.trim() || qrCode.length > 500) { res.status(400).json({ error: "Invalid QR code" }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.qrCode, qrCode.trim()));
  if (!member || member.status !== "active") { res.status(404).json({ error: "Active member not found" }); return; }

  const result = await db.transaction(async (tx) => {
    const [workshop] = await tx.select().from(workshopsTable).where(eq(workshopsTable.id, workshopId)).for("update");
    if (!workshop) return { error: "not_found" as const };
    const registrations = await tx.select().from(workshopRegistrationsTable).where(eq(workshopRegistrationsTable.workshopId, workshopId));
    const registration = registrations.find((item) => item.memberId === member.id);
    if (!registration || registration.status !== "registered") return { error: "registration_not_found" as const };
    if (registration.attended === "true") return { registration, alreadyAttended: true as const };
    const [updated] = await tx.update(workshopRegistrationsTable).set({ attended: "true" })
      .where(eq(workshopRegistrationsTable.id, registration.id)).returning();
    if (!updated) throw new Error("Could not update workshop attendance");
    return { registration: updated, alreadyAttended: false as const };
  });

  if ("error" in result) {
    if (result.error === "not_found") { res.status(404).json({ error: "Workshop not found" }); return; }
    res.status(404).json({ error: "Registration not found" }); return;
  }
  const registration = result.registration;
  res.status(result.alreadyAttended ? 200 : 200).json({
    id: registration.id, workshopId: registration.workshopId, memberId: registration.memberId,
    status: registration.status, attended: registration.attended === "true",
    alreadyAttended: result.alreadyAttended, createdAt: registration.createdAt,
  });
});
router.post("/workshops/:id/evaluate", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const workshopId = Number(raw);
  const user = (req as typeof req & { user: { userId: number } }).user;
  const { rating, comment } = req.body;

  if (!Number.isSafeInteger(workshopId) || workshopId <= 0) {
    res.status(400).json({ error: "Invalid workshop id" });
    return;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be an integer from 1 to 5" });
    return;
  }
  if (comment != null && (typeof comment !== "string" || comment.length > 2000)) {
    res.status(400).json({ error: "Comment must be a string of at most 2000 characters" });
    return;
  }

  // Resolve the member from the authenticated session, not from client input.
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, user.userId));
  if (!member || member.status !== "active") {
    res.status(403).json({ error: "An active membership is required" });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [workshop] = await tx.select().from(workshopsTable)
      .where(eq(workshopsTable.id, workshopId)).for("update");
    if (!workshop) return { error: "not_found" as const };

    const registrations = await tx.select().from(workshopRegistrationsTable)
      .where(eq(workshopRegistrationsTable.workshopId, workshopId));
    const registration = registrations.find((item) => item.memberId === member.id);
    if (!registration || registration.attended !== "true") {
      return { error: "attendance_required" as const };
    }

    const [existingEvaluation] = await tx.select().from(workshopEvaluationsTable)
      .where(eq(workshopEvaluationsTable.memberId, member.id))
      .then(async (rows) => [rows.find((item) => item.workshopId === workshopId)]);
    if (existingEvaluation) return { error: "already_evaluated" as const };

    const [evaluation] = await tx.insert(workshopEvaluationsTable)
      .values({ workshopId, memberId: member.id, rating, comment: comment ?? null })
      .returning();

    const [existingCertificate] = await tx.select().from(certificatesTable)
      .where(eq(certificatesTable.recipientId, member.userId))
      .then(async (rows) => [rows.find((item) => item.type === "workshop" && item.workshopId === workshopId)]);
    if (!existingCertificate) {
      await tx.insert(certificatesTable).values({
        type: "workshop",
        recipientId: member.userId,
        workshopId,
        verifyCode: nanoid(16),
      });
    }
    return { evaluation };
  });

  if ("error" in result) {
    if (result.error === "not_found") { res.status(404).json({ error: "Workshop not found" }); return; }
    if (result.error === "attendance_required") { res.status(403).json({ error: "Workshop attendance is required before evaluation" }); return; }
    res.status(409).json({ error: "Workshop already evaluated" });
    return;
  }
  res.status(201).json(result.evaluation);
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
