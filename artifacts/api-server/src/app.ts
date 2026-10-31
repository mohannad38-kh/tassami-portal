import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

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

// مسارات الـ API الأساسية
app.use("/api", router);

// --- خدمة ملفات الواجهة الأمامية (Frontend Dist) ---
const frontendDistPath = path.resolve(__dirname, "../../tasami/dist");
app.use(express.static(frontendDistPath));

// التوجيه النهائي المتوافق تماماً مع Express 5 لخدمة SPA
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendDistPath, "index.html"));
  }
  next();
});
// ---------------------------------------------------

export default app;