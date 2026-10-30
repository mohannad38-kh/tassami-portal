import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, effectiveRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

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
  if (status) tasks = tasks.filter((task) => task.status === status);
  res.json(await Promise.all(tasks.map(formatTask)));
});

router.post("/tasks", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { title, description, assignedTo, dueDate, priority } = req.body;
  if (typeof title !== "string" || !title.trim() || title.length > 200) { res.status(400).json({ error: "A title of 1-200 characters is required" }); return; }
  if (assignedTo !== undefined && assignedTo !== null && (!Number.isInteger(Number(assignedTo)) || Number(assignedTo) <= 0)) { res.status(400).json({ error: "Invalid assignedTo" }); return; }
  const [task] = await db.insert(tasksTable).values({ title: title.trim(), description: typeof description === "string" ? description : null, assignedTo: assignedTo == null ? null : Number(assignedTo), dueDate: typeof dueDate === "string" ? dueDate : null, priority: ["low", "medium", "high"].includes(priority) ? priority : "medium", createdBy: user.userId }).returning();
  res.status(201).json(await formatTask(task));
});

router.get("/tasks/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid task id" }); return; }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) { res.status(404).json({ error: "Not found" }); return; }
  const user = (req as Request & { user: JwtPayload }).user;
  if (effectiveRole(user) === "member" && task.assignedTo !== user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
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
      if (body.description !== null && typeof body.description !== "string") { res.status(400).json({ error: "Invalid description" }); return; }
      updateData.description = body.description;
    }
    if (body.assignedTo !== undefined) {
      if (body.assignedTo !== null && (!Number.isInteger(Number(body.assignedTo)) || Number(body.assignedTo) <= 0)) { res.status(400).json({ error: "Invalid assignedTo" }); return; }
      updateData.assignedTo = body.assignedTo === null ? null : Number(body.assignedTo);
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
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
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.sendStatus(204);
});

export default router;
