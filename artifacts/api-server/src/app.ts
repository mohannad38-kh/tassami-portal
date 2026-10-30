
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomBytes, scrypt as cryptoScrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";

import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "./db";
import { users } from "./db/schema";
const asyncScrypt = promisify(cryptoScrypt);

const app: Express = express();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const isProduction = process.env.NODE_ENV === "production";

// تشفير كلمات المرور
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");

  const hash = (await asyncScrypt(
    password,
    salt,
    64,
  )) as Buffer;

  return `${hash.toString("hex")}.${salt}`;
}

// إنشاء المشرف العام عند أول تشغيل فقط
async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    logger.warn("Super admin configuration is missing.");
    return;
  }

  if (password.length < 12) {
    throw new Error("Super admin password must be at least 12 characters.");
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    logger.info("Super admin already exists.");
    return;
  }

  const hashedPassword = await hashPassword(password);

  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
    role: "super_admin",
    isActive: true,
  });

  logger.info("Super admin created successfully.");
}

// إعدادات تسجيل الطلبات
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// إعدادات CORS
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProduction && allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// معالجة البيانات
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// مسارات API
app.use("/api", router);

// التعامل مع مسارات API غير الموجودة
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// تشغيل الواجهة الأمامية في وضع الإنتاج
if (isProduction) {
  const frontendDirectory = path.resolve(
    dirname,
    "../../tasami/dist",
  );

  app.use(express.static(frontendDirectory));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(
      path.join(frontendDirectory, "index.html"),
      (error) => {
        if (error) {
          next(error);
        }
      },
    );
  });
}

// معالج الأخطاء العام
app.use(
  (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    logger.error({ err: error }, "Application error");

    const isCorsError = error.message === "Origin not allowed by CORS";

    res.status(isCorsError ? 403 : 500).json({
      success: false,
      message: isProduction
        ? "Internal server error"
        : error.message,
    });
  },
);

// تهيئة التطبيق
export async function initializeApp(): Promise<Express> {
  await seedSuperAdmin();
  return app;
}

export default app;
