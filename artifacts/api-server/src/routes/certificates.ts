import { Router, type IRouter } from "express";
import { db, certificatesTable, usersTable, eventsTable, workshopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, optionalAuthMiddleware } from "../lib/auth";

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
  const { memberId } = req.query;
  let certs = await db.select().from(certificatesTable).orderBy(certificatesTable.issuedAt);
  if (memberId) certs = certs.filter((c) => c.recipientId === Number(memberId));
  const result = await Promise.all(certs.map(formatCertificate));
  res.json(result);
});

router.get("/certificates/:id", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, id));
  if (!cert) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatCertificate(cert));
});

router.get("/certificates/verify/:code", async (req, res): Promise<void> => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.verifyCode, code));
  if (!cert) { res.status(404).json({ error: "Certificate not found" }); return; }
  res.json(await formatCertificate(cert));
});

export default router;
