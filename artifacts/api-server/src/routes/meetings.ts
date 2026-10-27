import { Router, type IRouter } from "express";
import { db, meetingsTable, meetingAttendeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

const router: IRouter = Router();

async function formatMeeting(m: typeof meetingsTable.$inferSelect) {
  const [{ cnt }] = await db.select({ cnt: count() }).from(meetingAttendeesTable).where(eq(meetingAttendeesTable.meetingId, m.id));
  return {
    id: m.id,
    title: m.title,
    meetingDate: m.meetingDate,
    location: m.location ?? null,
    agenda: m.agenda ?? null,
    minutes: m.minutes ?? null,
    decisions: m.decisions ?? null,
    status: m.status,
    attendeeCount: Number(cnt),
    createdAt: m.createdAt,
  };
}

router.get("/meetings", authMiddleware, requireRole("secretary"), async (_req, res): Promise<void> => {
  const meetings = await db.select().from(meetingsTable).orderBy(meetingsTable.meetingDate);
  const result = await Promise.all(meetings.map(formatMeeting));
  res.json(result);
});

router.post("/meetings", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, meetingDate, location, agenda } = req.body;
  if (!title || !meetingDate) { res.status(400).json({ error: "Title and meetingDate required" }); return; }
  const [meeting] = await db.insert(meetingsTable).values({ title, meetingDate: new Date(meetingDate), location, agenda }).returning();
  res.status(201).json(await formatMeeting(meeting));
});

router.get("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [meeting] = await db.select().from(meetingsTable).where(eq(meetingsTable.id, id));
  if (!meeting) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMeeting(meeting));
});

router.patch("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, meetingDate, location, agenda, minutes, decisions, status } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (meetingDate != null) updateData.meetingDate = new Date(meetingDate);
  if (location != null) updateData.location = location;
  if (agenda != null) updateData.agenda = agenda;
  if (minutes != null) updateData.minutes = minutes;
  if (decisions != null) updateData.decisions = decisions;
  if (status != null) updateData.status = status;
  const [updated] = await db.update(meetingsTable).set(updateData).where(eq(meetingsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMeeting(updated));
});

router.delete("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(meetingsTable).where(eq(meetingsTable.id, id));
  res.sendStatus(204);
});

export default router;
