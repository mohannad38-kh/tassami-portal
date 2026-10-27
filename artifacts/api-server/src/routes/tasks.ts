import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
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
  const { assignedTo, status } = req.query;
  let tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  if (assignedTo) tasks = tasks.filter((t) => t.assignedTo === Number(assignedTo));
  if (status) tasks = tasks.filter((t) => t.status === status);
  const result = await Promise.all(tasks.map(formatTask));
  res.json(result);
});

router.post("/tasks", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const { title, description, assignedTo, dueDate, priority } = req.body;
  if (!title) { res.status(400).json({ error: "Title required" }); return; }
  const [task] = await db.insert(tasksTable).values({ title, description, assignedTo, dueDate, priority, createdBy: user.userId }).returning();
  res.status(201).json(await formatTask(task));
});

router.get("/tasks/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  if (!task) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatTask(task));
});

router.patch("/tasks/:id", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, description, assignedTo, dueDate, status, progress, priority } = req.body;
  const updateData: Record<string, unknown> = {};
  if (title != null) updateData.title = title;
  if (description != null) updateData.description = description;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
  if (dueDate !== undefined) updateData.dueDate = dueDate;
  if (status != null) updateData.status = status;
  if (progress != null) updateData.progress = progress;
  if (priority != null) updateData.priority = priority;
  const [updated] = await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatTask(updated));
});

router.delete("/tasks/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.sendStatus(204);
});

export default router;
