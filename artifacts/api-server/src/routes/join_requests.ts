import { Router, type IRouter } from "express";
import { db, departmentsTable, joinRequestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import * as nodemailer from "nodemailer";

const router: IRouter = Router();
const enrollmentFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeuZHDFLgSEaiRzP_mAuyRZOrL8uvSvPt4euy_HGOCTyKN_UA/viewform?pli=1";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

async function sendApprovalEmail(
  name: string,
  email: string,
): Promise<{ emailSent: boolean; emailMessage?: string }> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    ""
  ).replace(/\s/g, "");
  if (!gmailUser || !gmailAppPassword) {
    return {
      emailSent: false,
      emailMessage: "إعدادات بريد Gmail غير مكتملة على الخادم.",
    };
  }
  if (gmailAppPassword.length !== 16) {
    return {
      emailSent: false,
      emailMessage: "كلمة مرور تطبيق Gmail غير صحيحة؛ يجب أن تتكون من 16 حرفاً.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
    await transporter.sendMail({
      from: gmailUser,
      to: email,
      subject: "تم قبول طلب انضمامك إلى مبادرة تسامي",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#382a20"><h2 style="color:#702632">مرحباً ${escapeHtml(name)} 🎉</h2><p style="font-size:16px;line-height:1.8">يسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمامك إلى <strong style="color:#a27a37">مبادرة تسامي التطوعية</strong>.</p><p style="font-size:16px;line-height:1.8">لإكمال إجراءات الانتساب، يرجى تعبئة نموذج الانتساب الرسمي من الرابط التالي:</p><p style="margin:28px 0"><a href="${enrollmentFormUrl}" style="display:inline-block;background:#702632;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">تعبئة نموذج الانتساب</a></p><p style="font-size:14px;line-height:1.8;color:#666">إذا لم يظهر الزر، انسخ هذا الرابط وافتحه في المتصفح:<br><a href="${enrollmentFormUrl}" dir="ltr">${enrollmentFormUrl}</a></p><p style="font-size:14px;color:#888;margin-top:30px">فريق مبادرة تسامي</p></div>`,
    });
    console.log("Approval email sent to:", email);
    return { emailSent: true };
  } catch (err) {
    console.error("Failed to send approval email:", err);
    return {
      emailSent: false,
      emailMessage:
        "تم قبول الطلب، لكن تعذر إرسال البريد. تحقق من إعدادات Gmail على الخادم ثم أعد المحاولة.",
    };
  }
}

router.get("/join-requests", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const { status } = req.query;
  let requests = await db.select().from(joinRequestsTable).orderBy(joinRequestsTable.createdAt);
  if (status) requests = requests.filter((r) => r.status === status);
  res.json(requests);
});

router.post("/join-requests", async (req, res): Promise<void> => {
  const { name, email, phone, message, departmentId } = req.body;
  if (!name || !email || !Number.isSafeInteger(departmentId) || departmentId < 1) {
    res.status(400).json({ error: "Name, email, and a valid department are required" });
    return;
  }
  const [department] = await db
    .select({ id: departmentsTable.id })
    .from(departmentsTable)
    .where(eq(departmentsTable.id, departmentId));
  if (!department) {
    res.status(400).json({ error: "Select a valid department" });
    return;
  }
  const [request] = await db
    .insert(joinRequestsTable)
    .values({ name, email, phone, message, departmentId })
    .returning();
  res.status(201).json(request);
});

router.get("/join-requests/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [request] = await db.select().from(joinRequestsTable).where(eq(joinRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  res.json(request);
});

router.patch("/join-requests/:id", authMiddleware, requireRole("secretary"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status } = req.body;
  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "Status must be approved or rejected" });
    return;
  }
  const [updated] = await db.update(joinRequestsTable).set({ status }).where(eq(joinRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  let emailResult: { emailSent: boolean; emailMessage?: string } = { emailSent: false };
  if (status === "approved") {
    emailResult = await sendApprovalEmail(updated.name, updated.email);
  }
  res.json({ ...updated, ...emailResult });
});

export default router;
