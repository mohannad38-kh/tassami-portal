import { Router, type IRouter } from "express";
import { db, certificatesTable, usersTable, eventsTable, workshopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware, effectiveRole } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router: IRouter = Router();

async function formatCertificate(cert: typeof certificatesTable.$inferSelect) {
  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, cert.recipientId));
  let eventTitle: string | null = null;
  let workshopTitle: string | null = null;
  if (cert.eventId) {
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, cert.eventId));
    eventTitle = event?.title ?? null;
  }
  if (cert.workshopId) {
    const [workshop] = await db.select().from(workshopsTable).where(eq(workshopsTable.id, cert.workshopId));
    workshopTitle = workshop?.title ?? null;
  }
  return {
    id: cert.id,
    type: cert.type,
    recipientId: cert.recipientId,
    recipientName: recipient?.name ?? "Unknown",
    eventId: cert.eventId ?? null,
    eventTitle,
    workshopId: cert.workshopId ?? null,
    workshopTitle,
    verifyCode: cert.verifyCode,
    issuedAt: cert.issuedAt,
  };
}

router.get("/certificates", authMiddleware, requireRole("member"), async (req, res): Promise<void> => {
  const user = (req as Request & { user: JwtPayload }).user;
  const isSecretary = effectiveRole(user) !== "member";
  const { memberId } = req.query;
  let certs = await db.select().from(certificatesTable).orderBy(certificatesTable.issuedAt);
  if (!isSecretary) {
    certs = certs.filter((cert) => cert.recipientId === user.userId);
  } else if (memberId !== undefined) {
    const parsedUserId = Number(memberId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) { res.status(400).json({ error: "Invalid memberId" }); return; }
    certs = certs.filter((cert) => cert.recipientId === parsedUserId);
  }
  res.json(await Promise.all(certs.map(formatCertificate)));
});

router.get("/certificates/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid certificate id" }); return; }
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, id));
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }
  const user = (req as Request & { user?: JwtPayload }).user;
  if (!user || (effectiveRole(user) === "member" && cert.recipientId !== user.userId)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  res.json(await formatCertificate(cert));
});

router.get("/certificates/verify/:code", async (req, res): Promise<void> => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.verifyCode, code));
  if (!cert) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.json(await formatCertificate(cert));
});

export default router;
