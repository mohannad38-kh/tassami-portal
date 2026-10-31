import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { localSqlitePlugin } from "./localSqlitePlugin";

const rawPort = process.env.PORT ?? "4173";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// تحديد مجلد العمل بشكل يتوافق مع جميع إصدارات Node.js
const currentDir = typeof __dirname !== "undefined" ? __dirname : path.resolve();
const basePath = process.env.NODE_ENV === "production" ? (process.env.BASE_PATH ?? "/") : "./";

export default defineConfig({
  base: basePath,
  publicDir: "public",
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production"
      ? [localSqlitePlugin(path.resolve(currentDir, "..", ".."))]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(currentDir, "src"),
      "@assets": path.resolve(currentDir, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: currentDir,
  build: {
    outDir: path.resolve(currentDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});