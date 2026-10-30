import { Router, type IRouter } from "express";
import { db, meetingsTable, meetingAttendeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

const router: IRouter = Router();
const STATUSES = ["scheduled", "completed", "cancelled"] as const;
const validId = (raw: string | string[]): number => {
  const id = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
};
const validDate = (value: unknown): Date | null => {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const validText = (value: unknown, max: number): boolean =>
  value === null || (typeof value === "string" && value.length <= max);

async function formatMeeting(m: typeof meetingsTable.$inferSelect) {
  const [{ cnt }] = await db.select({ cnt: count() }).from(meetingAttendeesTable).where(eq(meetingAttendeesTable.meetingId, m.id));
  return { id: m.id, title: m.title, meetingDate: m.meetingDate, location: m.location ?? null, agenda: m.agenda ?? null, minutes: m.minutes ?? null, decisions: m.decisions ?? null, status: m.status, attendeeCount: Number(cnt), createdAt: m.createdAt };
}
router.get("/meetings", authMiddleware, requireRole("secretary"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(meetingsTable).orderBy(meetingsTable.meetingDate);
  res.json(await Promise.all(rows.map(formatMeeting)));
});
router.post("/meetings", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { title, meetingDate, location, agenda } = req.body ?? {};
  const date = validDate(meetingDate);
  if (typeof title !== "string" || !title.trim() || title.length > 200 || !date ||
      (location !== undefined && !validText(location, 500)) || (agenda !== undefined && !validText(agenda, 20000))) {
    res.status(400).json({ error: "Valid title, meetingDate, location, and agenda are required" }); return;
  }
  const [row] = await db.insert(meetingsTable).values({ title: title.trim(), meetingDate: date, location: location ?? null, agenda: agenda ?? null }).returning();
  res.status(201).json(await formatMeeting(row));
});
router.get("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const id = validId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid meeting id" }); return; }
  const [row] = await db.select().from(meetingsTable).where(eq(meetingsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMeeting(row));
});
router.patch("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const id = validId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid meeting id" }); return; }
  const { title, meetingDate, location, agenda, minutes, decisions, status } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim() || title.length > 200) { res.status(400).json({ error: "Invalid title" }); return; }
    data.title = title.trim();
  }
  if (meetingDate !== undefined) {
    const date = validDate(meetingDate);
    if (!date) { res.status(400).json({ error: "Invalid meetingDate" }); return; }
    data.meetingDate = date;
  }
  for (const [key, value, max] of [["location", location, 500], ["agenda", agenda, 20000], ["minutes", minutes, 50000], ["decisions", decisions, 50000]] as const) {
    if (value !== undefined) {
      if (!validText(value, max)) { res.status(400).json({ error: "Invalid " + key }); return; }
      data[key] = value;
    }
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !(STATUSES as readonly string[]).includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    data.status = status;
  }
  if (!Object.keys(data).length) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [row] = await db.update(meetingsTable).set(data).where(eq(meetingsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatMeeting(row));
});
router.delete("/meetings/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const id = validId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid meeting id" }); return; }
  const [row] = await db.delete(meetingsTable).where(eq(meetingsTable.id, id)).returning({ id: meetingsTable.id });
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});
export default router;
