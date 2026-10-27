import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, type Plugin } from "vite";

const MAX_BODY_SIZE = 16_384;
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENROLLMENT_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeuZHDFLgSEaiRzP_mAuyRZOrL8uvSvPt4euy_HGOCTyKN_UA/viewform?pli=1";

type JoinRequest = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  department_id: number | null;
  department_name: string | null;
  status: string;
  created_at: string;
  approval_email_sent_at: string | null;
};

type AdminSession = { expiresAt: number };

type Nodemailer = {
  createTransport(options: {
    service: string;
    auth: { user: string; pass: string };
  }): {
    sendMail(message: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }): Promise<unknown>;
  };
};

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  data: unknown,
): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function readJsonBody(
  request: import("node:http").IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_SIZE) throw new RangeError("Request body is too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function normalizeJordanMobile(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const digits = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s()-]/g, "");
  if (/^07[789]\d{7}$/.test(digits)) return `+962${digits.slice(1)}`;
  if (/^\+9627[789]\d{7}$/.test(digits)) return digits;
  return null;
}

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

function isLoopbackRequest(request: import("node:http").IncomingMessage): boolean {
  const remoteAddress = request.socket.remoteAddress?.replace(/^::ffff:/, "");
  if (remoteAddress !== "127.0.0.1" && remoteAddress !== "::1") return false;

  const host = request.headers.host;
  if (!host) return false;
  try {
    const hostname = new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "");
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) return false;
    const origin = request.headers.origin;
    return !origin || new URL(origin).host === host;
  } catch {
    return false;
  }
}

function bearerToken(request: import("node:http").IncomingMessage): string | null {
  const authorization = request.headers.authorization;
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export function localSqlitePlugin(workspaceRoot: string): Plugin {
  return {
    name: "local-sqlite-join-requests",
    configureServer(server) {
      const database = new DatabaseSync(path.join(workspaceRoot, "tasami.sqlite"));
      const schema = readFileSync(
        path.join(workspaceRoot, "lib", "db", "sqlite-schema.sql"),
        "utf8",
      );
      database.exec(schema);

      const joinRequestColumns = database
        .prepare("PRAGMA table_info(join_requests)")
        .all() as Array<{ name: string }>;
      if (!joinRequestColumns.some((column) => column.name === "approval_email_sent_at")) {
        database.exec("ALTER TABLE join_requests ADD COLUMN approval_email_sent_at TEXT");
      }
      if (!joinRequestColumns.some((column) => column.name === "department_id")) {
        database.exec("ALTER TABLE join_requests ADD COLUMN department_id INTEGER");
      }

      const defaultDepartments = [
        ["القسم الإعلامي", "قسم الإعلام والتواصل في مبادرة تسامي."],
        ["القسم الأكاديمي", "القسم الأكاديمي في مبادرة تسامي."],
        ["قسم الورشات", "قسم الورشات والتدريب في مبادرة تسامي."],
        ["قسم التصميم", "قسم التصميم في مبادرة تسامي."],
        ["قسم تكنولوجيا المعلومات", "قسم تكنولوجيا المعلومات في مبادرة تسامي."],
      ];
      const departmentCount = database
        .prepare("SELECT COUNT(*) AS count FROM departments")
        .get() as { count: number };
      if (Number(departmentCount.count) === 0) {
        const insertDepartment = database.prepare(
          "INSERT INTO departments (name, description) VALUES (?, ?)",
        );
        for (const [name, description] of defaultDepartments) {
          insertDepartment.run(name, description);
        }
      }

      const config = loadEnv(
        server.config.mode,
        path.join(workspaceRoot, "artifacts", "tasami"),
        "",
      );
      const adminEmail = (config.ADMIN_EMAIL || config.GMAIL_USER || "").trim().toLowerCase();
      const gmailUser = config.GMAIL_USER?.trim() || "";
      const gmailAppPassword = config.GMAIL_APP_PASSWORD?.replace(/\s/g, "") || "";
      const requireFromApiServer = createRequire(
        path.join(workspaceRoot, "artifacts", "api-server", "package.json"),
      );
      const nodemailer = requireFromApiServer("nodemailer") as Nodemailer;
      const sessions = new Map<string, AdminSession>();
      const loginAttempts = new Map<string, { count: number; windowStartedAt: number }>();
      const getAdminAccount = database.prepare(
        "SELECT email, password_salt, password_hash FROM local_admin_account WHERE id = 1",
      );
      const createAdminAccount = database.prepare(
        "INSERT INTO local_admin_account (id, email, password_salt, password_hash) VALUES (1, ?, ?, ?)",
      );
      const pendingRequests = database.prepare(
        `SELECT jr.id, jr.name, jr.email, jr.phone, jr.message, jr.status,
                jr.created_at, jr.approval_email_sent_at, jr.department_id,
                d.name AS department_name
         FROM join_requests jr
         LEFT JOIN departments d ON d.id = jr.department_id
         ORDER BY jr.created_at DESC`,
      );
      const getRequest = database.prepare(
        `SELECT jr.id, jr.name, jr.email, jr.phone, jr.message, jr.status,
                jr.created_at, jr.approval_email_sent_at, jr.department_id,
                d.name AS department_name
         FROM join_requests jr
         LEFT JOIN departments d ON d.id = jr.department_id
         WHERE jr.id = ?`,
      );
      const insertRequest = database.prepare(
        "INSERT INTO join_requests (name, email, phone, message, department_id) VALUES (?, ?, ?, ?, ?)",
      );
      const updateRequest = database.prepare(
        "UPDATE join_requests SET status = ?, approval_email_sent_at = NULL WHERE id = ?",
      );
      const markEmailSent = database.prepare(
        "UPDATE join_requests SET approval_email_sent_at = CURRENT_TIMESTAMP WHERE id = ?",
      );
      const countApprovedRequests = database.prepare(
        "SELECT COUNT(*) AS count FROM join_requests WHERE trim(status) = 'approved'",
      );
      const listDepartments = database.prepare(
        `SELECT d.id, d.name, d.description, d.head_id, d.created_at,
                (SELECT COUNT(DISTINCT lower(trim(email))) FROM (
                   SELECT jr.email FROM join_requests jr
                   WHERE jr.department_id = d.id AND trim(jr.status) = 'approved'
                   UNION ALL
                   SELECT u.email FROM members m
                   JOIN users u ON u.id = m.user_id
                   WHERE m.department_id = d.id AND m.status = 'active'
                 )) AS member_count
         FROM departments d
         ORDER BY d.id`,
      );
      const getDepartment = database.prepare(
        "SELECT id, name FROM departments WHERE id = ?",
      );

      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || "/", "http://localhost");
        const pathname = url.pathname;
        if (!pathname.startsWith("/local-api/")) {
          next();
          return;
        }

        if (!isLoopbackRequest(request)) {
          sendJson(response, 403, { error: "Local-only access" });
          return;
        }

        if (pathname === "/local-api/public/stats" && request.method === "GET") {
          const result = countApprovedRequests.get() as { count: number };
          sendJson(response, 200, { registeredVolunteers: Number(result.count) });
          return;
        }

        if (pathname === "/local-api/public/departments" && request.method === "GET") {
          const departments = listDepartments.all() as Array<{
            id: number;
            name: string;
            description: string | null;
            head_id: number | null;
            created_at: string;
            member_count: number;
          }>;
          sendJson(
            response,
            200,
            departments.map((department) => ({
              id: department.id,
              name: department.name,
              description: department.description,
              headId: department.head_id,
              headName: null,
              memberCount: Number(department.member_count),
              createdAt: department.created_at,
            })),
          );
          return;
        }

        if (pathname === "/local-api/admin/status" && request.method === "GET") {
          sendJson(response, 200, {
            needsSetup: !getAdminAccount.get(),
            email: adminEmail,
          });
          return;
        }

        if (pathname === "/local-api/admin/setup" && request.method === "POST") {
          try {
            const body = await readJsonBody(request);
            const data =
              typeof body === "object" && body !== null && !Array.isArray(body)
                ? (body as Record<string, unknown>)
                : {};
            const password = typeof data.password === "string" ? data.password : "";
            if (!adminEmail) {
              sendJson(response, 503, { error: "Admin email is not configured" });
              return;
            }
            if (getAdminAccount.get()) {
              sendJson(response, 409, { error: "The admin account has already been set up" });
              return;
            }
            if (password.length < 12) {
              sendJson(response, 400, { error: "Choose a password with at least 12 characters" });
              return;
            }
            const passwordSalt = randomBytes(16);
            const passwordHash = scryptSync(password, passwordSalt, 64);
            createAdminAccount.run(
              adminEmail,
              passwordSalt.toString("hex"),
              passwordHash.toString("hex"),
            );
            const token = randomBytes(32).toString("hex");
            sessions.set(token, { expiresAt: Date.now() + SESSION_LIFETIME_MS });
            sendJson(response, 201, { token, email: adminEmail });
          } catch (error) {
            console.error("Failed to set up the local admin account:", error);
            sendJson(response, 400, { error: "Could not set up the admin account" });
          }
          return;
        }

        if (pathname === "/local-api/join-requests" && request.method === "POST") {
          try {
            const body = await readJsonBody(request);
            if (typeof body !== "object" || body === null || Array.isArray(body)) {
              sendJson(response, 400, { error: "Invalid request body" });
              return;
            }
            const data = body as Record<string, unknown>;
            const name = typeof data.name === "string" ? data.name.trim() : "";
            const email = typeof data.email === "string" ? data.email.trim() : "";
            if (!name || !EMAIL_PATTERN.test(email)) {
              sendJson(response, 400, { error: "Enter a name and a valid email address" });
              return;
            }
            let phone: string | null = null;
            if (typeof data.phone === "string" && data.phone.trim()) {
              phone = normalizeJordanMobile(data.phone);
              if (!phone) {
                sendJson(response, 400, {
                  error: "Enter a valid Jordanian mobile number, such as +962 79 123 4567",
                });
                return;
              }
            }
            const message =
              typeof data.message === "string" ? data.message.trim() || null : null;
            const departmentId =
              typeof data.departmentId === "number" && Number.isSafeInteger(data.departmentId)
                ? data.departmentId
                : 0;
            const department = getDepartment.get(departmentId) as
              | { id: number; name: string }
              | undefined;
            if (!department) {
              sendJson(response, 400, { error: "Select a valid department" });
              return;
            }
            const result = insertRequest.run(name, email, phone, message, departmentId);
            sendJson(response, 201, {
              id: Number(result.lastInsertRowid),
              name,
              email,
              phone,
              message,
              departmentId,
              departmentName: department.name,
              status: "pending",
              approvalEmailSentAt: null,
            });
          } catch (error) {
            const tooLarge = error instanceof RangeError;
            console.error("Failed to save a local join request:", error);
            sendJson(response, tooLarge ? 413 : 400, {
              error: tooLarge ? "Request body is too large" : "Could not save the join request",
            });
          }
          return;
        }

        if (pathname === "/local-api/admin/login" && request.method === "POST") {
          const clientAddress = request.socket.remoteAddress || "unknown";
          const now = Date.now();
          const previousAttempts = loginAttempts.get(clientAddress);
          if (
            previousAttempts &&
            now - previousAttempts.windowStartedAt < LOGIN_WINDOW_MS &&
            previousAttempts.count >= MAX_LOGIN_ATTEMPTS
          ) {
            sendJson(response, 429, { error: "Too many login attempts. Try again later." });
            return;
          }

          try {
            const body = await readJsonBody(request);
            const data =
              typeof body === "object" && body !== null && !Array.isArray(body)
                ? (body as Record<string, unknown>)
                : {};
            const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
            const password = typeof data.password === "string" ? data.password : "";
            const account = getAdminAccount.get() as
              | { email: string; password_salt: string; password_hash: string }
              | undefined;
            const passwordSalt = account
              ? Buffer.from(account.password_salt, "hex")
              : randomBytes(16);
            const expectedHash = account
              ? Buffer.from(account.password_hash, "hex")
              : randomBytes(64);
            const passwordHash = scryptSync(password, passwordSalt, 64);
            const validEmail = Boolean(account) && email === account?.email;
            const validPassword =
              passwordHash.length === expectedHash.length &&
              timingSafeEqual(passwordHash, expectedHash);
            if (!validEmail || !validPassword) {
              const attempts =
                previousAttempts && now - previousAttempts.windowStartedAt < LOGIN_WINDOW_MS
                  ? previousAttempts
                  : { count: 0, windowStartedAt: now };
              attempts.count += 1;
              loginAttempts.set(clientAddress, attempts);
              sendJson(response, 401, { error: "Email or password is incorrect" });
              return;
            }

            loginAttempts.delete(clientAddress);
            const token = randomBytes(32).toString("hex");
            sessions.set(token, { expiresAt: now + SESSION_LIFETIME_MS });
            sendJson(response, 200, { token, email: adminEmail });
          } catch (error) {
            console.error("Local admin login failed:", error);
            sendJson(response, 400, { error: "Invalid login request" });
          }
          return;
        }

        const token = bearerToken(request);
        const session = token ? sessions.get(token) : undefined;
        if (token && session && session.expiresAt <= Date.now()) {
          sessions.delete(token);
        }
        if (
          !token ||
          !session ||
          session.expiresAt <= Date.now()
        ) {
          sendJson(response, 401, { error: "Please sign in to manage join requests" });
          return;
        }

        if (pathname === "/local-api/admin/logout" && request.method === "POST") {
          sessions.delete(token);
          sendJson(response, 200, { ok: true });
          return;
        }

        if (pathname === "/local-api/admin/requests" && request.method === "GET") {
          const requests = pendingRequests.all() as JoinRequest[];
          sendJson(
            response,
            200,
            requests.map((item) => ({
              id: item.id,
              name: item.name,
              email: item.email,
              phone: item.phone,
              message: item.message,
              departmentId: item.department_id,
              departmentName: item.department_name,
              status: item.status.trim(),
              createdAt: item.created_at,
              approvalEmailSentAt: item.approval_email_sent_at,
            })),
          );
          return;
        }

        const match = pathname.match(/^\/local-api\/admin\/requests\/(\d+)$/);
        if (match && request.method === "PATCH") {
          try {
            const body = await readJsonBody(request);
            const data =
              typeof body === "object" && body !== null && !Array.isArray(body)
                ? (body as Record<string, unknown>)
                : {};
            const status = typeof data.status === "string" ? data.status.trim() : "";
            if (status !== "approved" && status !== "rejected") {
              sendJson(response, 400, { error: "Status must be approved or rejected" });
              return;
            }

            const id = Number(match[1]);
            const existing = getRequest.get(id) as JoinRequest | undefined;
            if (!existing) {
              sendJson(response, 404, { error: "Join request not found" });
              return;
            }

            if (status === "approved" && !existing.approval_email_sent_at) {
              if (!gmailUser || !gmailAppPassword) {
                updateRequest.run(status, id);
                sendJson(response, 200, {
                  id,
                  status,
                  emailSent: false,
                  message:
                    "تم قبول الطلب، لكن إعدادات بريد الإرسال غير مكتملة. أضف بريد Gmail وكلمة مرور التطبيق إلى ملف الإعداد المحلي، ثم أعد تشغيل الموقع وحاول إعادة الإرسال.",
                });
                return;
              }
              if (gmailAppPassword.length !== 16) {
                updateRequest.run(status, id);
                sendJson(response, 200, {
                  id,
                  status,
                  emailSent: false,
                  message:
                    "تم قبول الطلب، لكن كلمة مرور تطبيق Gmail يجب أن تتكون من 16 حرفاً. أنشئ كلمة مرور تطبيق جديدة في Google، حدّث إعداد البريد المحلي، ثم أعد تشغيل الموقع واختر «إعادة الإرسال».",
                });
                return;
              }

              try {
                const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: { user: gmailUser, pass: gmailAppPassword },
                });
                await transporter.sendMail({
                  from: gmailUser,
                  to: existing.email,
                  subject: "تم قبول طلب انضمامك إلى مبادرة تسامي",
                  html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#382a20"><h2 style="color:#702632">مرحباً ${escapeHtml(existing.name)} 🎉</h2><p style="font-size:16px;line-height:1.8">يسعدنا إبلاغك بأنه تمت الموافقة على طلب انضمامك إلى <strong style="color:#a27a37">مبادرة تسامي التطوعية</strong>.</p><p style="font-size:16px;line-height:1.8">لإكمال إجراءات الانتساب، يرجى تعبئة نموذج الانتساب الرسمي من الرابط التالي:</p><p style="margin:28px 0"><a href="${ENROLLMENT_FORM_URL}" style="display:inline-block;background:#702632;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">تعبئة نموذج الانتساب</a></p><p style="font-size:14px;line-height:1.8;color:#666">إذا لم يظهر الزر، انسخ هذا الرابط وافتحه في المتصفح:<br><a href="${ENROLLMENT_FORM_URL}" dir="ltr">${ENROLLMENT_FORM_URL}</a></p><p style="font-size:14px;color:#888;margin-top:30px">فريق مبادرة تسامي</p></div>`,
                });
                updateRequest.run(status, id);
                markEmailSent.run(id);
                sendJson(response, 200, { id, status, emailSent: true });
              } catch (error) {
                console.error(`Failed to send approval email for request ${id}:`, error);
                updateRequest.run(status, id);
                sendJson(response, 200, {
                  id,
                  status,
                  emailSent: false,
                  message:
                    "تم قبول الطلب، لكن Gmail رفض تسجيل الدخول. تحقق من بريد الإرسال وكلمة مرور التطبيق، ثم أعد تشغيل الموقع وحاول إعادة الإرسال.",
                });
              }
              return;
            }

            updateRequest.run(status, id);
            sendJson(response, 200, {
              id,
              status,
              emailSent: status === "approved" && Boolean(existing.approval_email_sent_at),
            });
          } catch (error) {
            console.error("Failed to update a local join request:", error);
            sendJson(response, 400, { error: "Could not update the join request" });
          }
          return;
        }

        sendJson(response, 404, { error: "Local API route not found" });
      });

      server.httpServer?.once("close", () => {
        sessions.clear();
        database.close();
      });
    },
  };
}
