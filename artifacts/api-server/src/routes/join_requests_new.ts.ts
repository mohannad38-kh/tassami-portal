import { Router, type IRouter } from "express";
import {
  db,
  departmentsTable,
  joinRequestsTable,
  membersTable,
  usersTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import {
  authMiddleware,
  hashPassword,
  requireRole,
  signPasswordSetupToken,
} from "../lib/auth";
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
  passwordSetupUrl?: string,
): Promise<{ emailSent: boolean; emailMessage?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  const passwordSetupSection = passwordSetupUrl
    ? `<p style="font-size:16px;line-height:1.8">لإنشاء كلمة مرور حسابك والدخول إلى بوابة المتطوعين، اضغط على الرابط التالي خلال 24 ساعة:</p><p style="margin:28px 0"><a href="${escapeHtml(passwordSetupUrl)}" style="display:inline-block;background:#702632;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">إنشاء كلمة المرور</a></p><p style="font-size:14px;line-height:1.8;color:#666">إذا لم يظهر الزر، انسخ هذا الرابط وافتحه في المتصفح:<br><a href="${escapeHtml(passwordSetupUrl)}" dir="ltr">${escapeHtml(passwordSetupUrl)}</a></p>`
    : `<p style="font-size:16px;line-height:1.8">يمكنك استخدام حسابك الحالي للدخول إلى بوابة المتطوعين.</p>`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#382a20"><h2 style="color:#702632">مرحباً ${escapeHtml(name)} 🎉</h2><p style="font-size:16px;line-height:1.8">يسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمامك إلى <strong style="color:#a27a37">مبادرة تسامي التطوعية</strong>.</p>${passwordSetupSection}<p style="font-size:16px;line-height:1.8">لإكمال إجراءات الانتساب، يرجى تعبئة نموذج الانتساب الرسمي:</p><p style="margin:28px 0"><a href="${enrollmentFormUrl}" style="display:inline-block;background:#702632;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">تعبئة نموذج الانتساب</a></p><p style="font-size:14px;line-height:1.8;color:#666">رابط النموذج:<br><a href="${enrollmentFormUrl}" dir="ltr">${enrollmentFormUrl}</a></p><p style="font-size:14px;color:#888;margin-top:30px">فريق مبادرة تسامي</p></div>`;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: "تم قبول طلب انضمامك إلى مبادرة تسامي",
        html,
      });
      if (error) {
        console.error("Failed to send approval email with Resend:", error.message);
        return {
          emailSent: false,
          emailMessage: "تعذر إرسال البريد عبر Resend. تحقق من إعدادات المرسل على الخادم.",
        };
      }
      return { emailSent: true };
    } catch (error) {
      console.error("Failed to send approval email with Resend:", error);
      return {
        emailSent: false,
        emailMessage: "تعذر إرسال البريد عبر Resend. تحقق من إعدادات البريد ثم أعد المحاولة.",
      };
    }
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    ""
  ).replace(/\s/g, "");
  if (!gmailUser || !gmailAppPassword) {
    return {
      emailSent: false,
      emailMessage: "البريد لم يُرسل. أضف RESEND_API_KEY وRESEND_FROM_EMAIL إلى إعدادات الخادم.",
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
      html,
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

router.get("/join-requests", authMiddleware, requireRole("join_manager"), async (req, res): Promise<void> => {
  const { status } = req.query;
  if (status !== undefined && (typeof status !== "string" || !["pending", "approved", "rejected"].includes(status))) {
    res.status(400).json({ error: "Invalid join request status" });
    return;
  }
  let requests = await db.select().from(joinRequestsTable).orderBy(joinRequestsTable.createdAt);
  if (typeof status === "string") requests = requests.filter((r) => r.status === status);
  res.json(requests);
});

router.post("/join-requests", async (req, res): Promise<void> => {
  const { name, email, phone, message, departmentId, password } = req.body;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 120 ||
    typeof email !== "string" ||
    !email.trim() ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 40)) ||
    (message !== undefined && message !== null && (typeof message !== "string" || message.length > 2000)) ||
    !Number.isSafeInteger(departmentId) ||
    departmentId < 1 ||
    typeof password !== "string" ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    res.status(400).json({
      error: "Enter a valid name, email, department, and password (12 characters minimum, 72 UTF-8 bytes maximum)",
    });
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

  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.transaction(async (tx) => {
    // Serialize submissions for the same normalized email across concurrent requests.
    // The transaction-scoped lock is released automatically on commit or rollback.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${normalizedEmail})::bigint)`);

    const [pendingRequest] = await tx
      .select({ id: joinRequestsTable.id })
      .from(joinRequestsTable)
      .where(and(
        sql`lower(${joinRequestsTable.email}) = ${normalizedEmail}`,
        eq(joinRequestsTable.status, "pending"),
      ))
      .limit(1);
    if (pendingRequest) return { request: null, conflict: true };

    const [existingUser] = await tx
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`);

    if (existingUser && existingUser.isActive) {
      return { request: null, conflict: true };
    }

    if (!existingUser) {
      const passwordHash = await hashPassword(password);
      const [createdUser] = await tx
        .insert(usersTable)
        .values({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "member",
          phone: typeof phone === "string" ? phone.trim() : null,
          departmentId,
          isActive: false,
        })
        .onConflictDoNothing()
        .returning({ id: usersTable.id });

      if (!createdUser) {
        const [concurrentUser] = await tx
          .select({ isActive: usersTable.isActive })
          .from(usersTable)
          .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`);
        if (concurrentUser?.isActive) {
          return { request: null, conflict: true };
        }
      }
    }

    const [request] = await tx
      .insert(joinRequestsTable)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        phone: typeof phone === "string" ? phone.trim() : null,
        message: typeof message === "string" ? message.trim() : null,
        departmentId,
      })
      .returning();

    return { request, conflict: false };
  });

  if (result.conflict || !result.request) {
    res.status(409).json({
      error: "ACCOUNT_EXISTS_OR_PENDING",
    });
    return;
  }

  const { request } = result;
  res.status(201).json(request);
});

router.get("/join-requests/:id", authMiddleware, requireRole("join_manager"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid join request ID" });
    return;
  }
  const [request] = await db.select().from(joinRequestsTable).where(eq(joinRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  res.json(request);
});

router.patch("/join-requests/:id", authMiddleware, requireRole("join_manager"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  const { status } = req.body;
  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "Status must be approved or rejected" });
    return;
  }
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid join request ID" });
    return;
  }

  let passwordSetupToken: string | undefined;
  let needsPasswordSetup = false;
  let hasExistingAccount = false;

  const updated = await db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(joinRequestsTable)
      .where(eq(joinRequestsTable.id, id));
    if (!request) return null;

    const normalizedEmail = request.email.trim().toLowerCase();
    const [updatedRequest] = await tx
      .update(joinRequestsTable)
      .set({ status })
      .where(and(eq(joinRequestsTable.id, id), eq(joinRequestsTable.status, "pending")))
      .returning();
    if (!updatedRequest) return { notPending: true };

    if (status !== "approved") return updatedRequest;

    const [existingUser] = await tx
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${normalizedEmail}`);

    let user = existingUser;
    if (!user) {
      const temporaryPassword = randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(temporaryPassword);
      const [createdUser] = await tx
        .insert(usersTable)
        .values({
          name: request.name,
          email: normalizedEmail,
          passwordHash,
          role: "member",
          phone: request.phone,
          departmentId: request.departmentId,
          isActive: false,
        })
        .returning();
      user = createdUser;
      needsPasswordSetup = true;

      const membershipNumber = `TSM-${String(Date.now()).slice(-6)}-${nanoid(4).toUpperCase()}`;
      await tx.insert(membersTable).values({
        userId: user.id,
        departmentId: request.departmentId,
        membershipNumber,
        status: "active",
        qrCode: `TSM-QR-${nanoid(12)}`,
      });
    } else {
      if (user.role === "member" && !user.isActive) {
        await tx
          .update(usersTable)
          .set({ isActive: true, departmentId: request.departmentId })
          .where(eq(usersTable.id, user.id));

        if (request.departmentId !== null) {
          const [membership] = await tx
            .select({ id: membersTable.id })
            .from(membersTable)
            .where(
              and(
                eq(membersTable.userId, user.id),
                eq(membersTable.departmentId, request.departmentId),
              ),
            )
            .limit(1);

          if (!membership) {
            const membershipNumber = `TSM-${String(Date.now()).slice(-6)}-${nanoid(4).toUpperCase()}`;
            await tx.insert(membersTable).values({
              userId: user.id,
              departmentId: request.departmentId,
              membershipNumber,
              status: "active",
              qrCode: `TSM-QR-${nanoid(12)}`,
            });
          }
        }
      } else {
        hasExistingAccount = true;
      }
    }

    if (needsPasswordSetup) {
      passwordSetupToken = signPasswordSetupToken({
        userId: user.id,
        email: user.email,
        purpose: "password_setup",
      });
    }

    return updatedRequest;
  });

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  if ("notPending" in updated) { res.status(409).json({ error: "Join request has already been processed" }); return; }

  let emailResult: { emailSent: boolean; emailMessage?: string } = { emailSent: false };
  if (status === "approved") {
    const appBaseUrl =
      process.env.APP_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://tassami-portal-1-8prm.onrender.com"
        : "http://localhost:4173");
    const passwordSetupUrl = passwordSetupToken
      ? new URL(
          `/set-password?token=${encodeURIComponent(passwordSetupToken)}`,
          appBaseUrl,
        ).toString()
      : undefined;

    emailResult = await sendApprovalEmail(
      updated.name,
      updated.email,
      passwordSetupUrl,
    );
  }

  res.json({ ...updated, ...emailResult, hasExistingAccount });
});

export default router;