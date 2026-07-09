import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { dbService } from "./src/backend/services/dbService.js";
import { startReminderScheduler } from "./src/backend/services/reminderScheduler.js";
import authRoutes from "./src/backend/routes/authRoutes.js";
import jobRoutes from "./src/backend/routes/jobRoutes.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize DB Service (Mongo or full local File fallback)
  await dbService.initialize();

  // Start automatic interview reminder scheduler (24h + 1h before interview)
  startReminderScheduler(dbService.useMongo);

  // CORS — allow requests from Vercel frontend (set FRONTEND_URL in Render env vars)
  const allowedOrigins = [
    process.env.FRONTEND_URL,          // e.g. https://your-app.vercel.app
    "http://localhost:3000",            // local dev
    "http://localhost:5173",            // vite dev fallback
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed.`));
      }
    },
    credentials: true,
  }));

  // Parse request payloads — 10MB limit for file uploads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging Middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // REST API Definitions
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);

  // Global Express Error Handler
  app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error occurred.",
    });
  });

  // Create a single HTTP server that both Express and Vite HMR will share.
  // This eliminates the need for a separate WebSocket port (24678).
  const httpServer = http.createServer(app);

  // Integrate Vite Dev Server Middleware or Production Asset Server
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server integrating into Express...");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.SERVE_FRONTEND !== "false") {
    // Production: serve static React build (when frontend is NOT on Vercel)
    console.log("Production Mode: serving static frontend assets.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // API-only mode (frontend is on Vercel — SERVE_FRONTEND=false)
    console.log("API-only mode: frontend is hosted separately on Vercel.");
  }

  // Start listening with clear error handling
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Job Tracker Pro is live! → http://localhost:${PORT}`);
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use. Run: npm run dev (it auto-clears ports)\n`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error("Fatal: failed to bootstrap server:", err);
  process.exit(1);
});
