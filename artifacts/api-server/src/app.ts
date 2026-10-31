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

import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const isProduction = process.env.NODE_ENV === "production";

// تسجيل الطلبات
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
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// The deployed frontend and API share one origin. Always allow that exact
// origin even when no separate CORS_ORIGINS list is configured.
const appOrigin = process.env.APP_BASE_URL
  ? new URL(process.env.APP_BASE_URL).origin
  : null;
const renderOrigin = process.env.RENDER_EXTERNAL_URL
  ? new URL(process.env.RENDER_EXTERNAL_URL).origin
  : null;
const allowedOrigins = new Set([
  ...configuredOrigins,
  appOrigin,
  renderOrigin,
].filter((origin): origin is string => Boolean(origin)));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProduction && allowedOrigins.size === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
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

// API غير موجود
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// تشغيل الواجهة الأمامية في الإنتاج
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

    const isCorsError =
      error.message === "Origin not allowed by CORS";

    res.status(isCorsError ? 403 : 500).json({
      success: false,
      message: isProduction
        ? "Internal server error"
        : error.message,
    });
  },
);

// تصدير التطبيق
export default app;

