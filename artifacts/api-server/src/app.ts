import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "./lib/db";
import { users } from "@workspace/shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const asyncScrypt = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await asyncScrypt(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// دالة تهيئة المشرف العام تلقائياً عند تشغيل السيرفر
async function seedSuperAdmin() {
  try {
    const email = "mohannadkhaloof38@gmail.com";
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const hashedPassword = await hashPassword("121Aqra6$");

    if (existing.length === 0) {
      await db.insert(users).values({
        name: "مهند الخلوف",
        email,
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
      });
      logger.info("Super admin created successfully on startup.");
    } else {
      await db.update(users)
        .set({ role: "super_admin", password: hashedPassword, isActive: true })
        .where(eq(users.email, email));
      logger.info("Super admin updated successfully on startup.");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed super admin");
  }
}

// تنفيذ التهيئة عند تشغيل التطبيق
seedSuperAdmin();

const app: Express = express();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../tasami/dist",
  );
  app.use(express.static(frontendDirectory));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(path.join(frontendDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

export default app;