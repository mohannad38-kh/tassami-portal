import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, effectiveRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function formatTask(t: typeof tasksTable.$inferSelect) {
  let assigneeName: string | null = null;
  if (t.assignedTo) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, t.assignedTo));
    assigneeName = user?.name ?? null;
  }
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    assignedTo: t.assignedTo ?? null,
    assigneeName,
    createdBy: t.createdBy ?? null,
    dueDate: t.dueDate ?? null,
    status: t.status,
    progress: t.progress,
    priority: t.priority ?? null,
    createdAt: t.createdAt,
  };
}

router.get("/tasks", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isSecretary = ["secretary", "vice_president", "president", "super_admin"].includes(effectiveRole(user));
  const { assignedTo, status } = req.query;
  let tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  if (!isSecretary) tasks = tasks.filter((task) => task.assignedTo === user.userId);
  else if (assignedTo !== undefined) {
    const parsedUserId = Number(assignedTo);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) { res.status(400).json({ error: "Invalid assignedTo" }); return; }
    tasks = tasks.filter((task) => task.assignedTo === parsedUserId);
  }
  if (status !== undefined) {
    if (typeof status !== "string" || !["pending", "in_progress", "completed", "cancelled"].includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    tasks = tasks.filter((task) => task.status === status);
  }
  res.json(await Promise.all(tasks.map(formatTask)));
});

router.post("/tasks", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { title, description, assignedTo, dueDate, priority } = req.body;
  if (typeof title !== "string" || !title.trim() || title.length > 200) { res.status(400).json({ error: "A title of 1-200 characters is required" }); return; }
  if (description !== undefined && description !== null && (typeof description !== "string" || description.length > 5000)) { res.status(400).json({ error: "Description must be 5000 characters or fewer" }); return; }
  if (assignedTo !== undefined && assignedTo !== null && (!Number.isSafeInteger(assignedTo) || assignedTo <= 0)) { res.status(400).json({ error: "Invalid assignedTo" }); return; }
  if (assignedTo != null) { const [assignee] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, assignedTo)); if (!assignee) { res.status(400).json({ error: "Assignee not found" }); return; } }
  if (dueDate !== undefined && dueDate !== null && !isValidDateOnly(dueDate)) { res.status(400).json({ error: "Invalid dueDate; expected YYYY-MM-DD" }); return; }
  if (priority !== undefined && !["low", "medium", "high"].includes(priority)) { res.status(400).json({ error: "Invalid priority" }); return; }
  const [task] = await db.insert(tasksTable).values({ title: title.trim(), description: description ?? null, assignedTo: assignedTo ?? null, dueDate: dueDate ?? null, priority: priority ?? "medium", createdBy: user.userId }).returning();
  res.status(201).json(await formatTask(task));
});

router.get("/tasks/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid task id" }); return; }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) { res.status(404).json({ error: "Not found" }); return; }
  const user = (req as Request & { user: JwtPayload }).user;
  if (!["secretary", "vice_president", "president", "super_admin"].includes(effectiveRole(user)) && task.assignedTo !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  res.json(await formatTask(task));
});

router.patch("/tasks/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid task id" }); return; }
  const user = (req as Request & { user: JwtPayload }).user;
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) { res.status(404).json({ error: "Not found" }); return; }
  const body = req.body ?? {};
  const isSecretary = ["secretary", "vice_president", "president", "super_admin"].includes(effectiveRole(user));
  const updateData: Record<string, unknown> = {};
  if (isSecretary) {
    const allowed = ["title", "description", "assignedTo", "dueDate", "status", "progress", "priority"];
    if (Object.keys(body).some((key) => !allowed.includes(key))) { res.status(400).json({ error: "Unsupported task field" }); return; }
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200) { res.status(400).json({ error: "Invalid title" }); return; }
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (body.description !== null && (typeof body.description !== "string" || body.description.length > 5000)) { res.status(400).json({ error: "Invalid description" }); return; }
      updateData.description = body.description;
    }
    if (body.assignedTo !== undefined) {
      if (body.assignedTo !== null && (!Number.isSafeInteger(body.assignedTo) || body.assignedTo <= 0)) { res.status(400).json({ error: "Invalid assignedTo" }); return; }
      if (body.assignedTo !== null) { const [assignee] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, body.assignedTo)); if (!assignee) { res.status(400).json({ error: "Assignee not found" }); return; } }
      updateData.assignedTo = body.assignedTo;
    }
    if (body.dueDate !== undefined) {
      if (body.dueDate !== null && !isValidDateOnly(body.dueDate)) { res.status(400).json({ error: "Invalid dueDate; expected YYYY-MM-DD" }); return; }
      updateData.dueDate = body.dueDate;
    }
    if (body.status !== undefined) {
      if (!["pending", "in_progress", "completed", "cancelled"].includes(body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
      updateData.status = body.status;
    }
    if (body.progress !== undefined) {
      if (!Number.isInteger(body.progress) || body.progress < 0 || body.progress > 100) { res.status(400).json({ error: "Progress must be between 0 and 100" }); return; }
      updateData.progress = body.progress;
    }
    if (body.priority !== undefined) {
      if (!["low", "medium", "high"].includes(body.priority)) { res.status(400).json({ error: "Invalid priority" }); return; }
      updateData.priority = body.priority;
    }
  } else {
    if (task.assignedTo !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (Object.keys(body).some((key) => !["status", "progress"].includes(key))) { res.status(403).json({ error: "Members may only update their task status and progress" }); return; }
    if (body.status !== undefined) {
      if (!["pending", "in_progress", "completed"].includes(body.status)) { res.status(400).json({ error: "Invalid status" }); return; }
      updateData.status = body.status;
    }
    if (body.progress !== undefined) {
      if (!Number.isInteger(body.progress) || body.progress < 0 || body.progress > 100) { res.status(400).json({ error: "Progress must be between 0 and 100" }); return; }
      updateData.progress = body.progress;
    }
  }
  if (Object.keys(updateData).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [updated] = await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, id)).returning();
  res.json(await formatTask(updated));
});

router.delete("/tasks/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid task id" }); return; }
  const [deleted] = await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning({ id: tasksTable.id });
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
