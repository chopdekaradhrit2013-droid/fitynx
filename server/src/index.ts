import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import wardrobeRoutes from "./routes/wardrobe.js";
import looksRoutes from "./routes/looks.js";
import plansRoutes from "./routes/plans.js";
import lensRoutes from "./routes/lens.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// High limit for base64-encoded garment photos and cutouts
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/looks", looksRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/lens", lensRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`[FITYNX Server] Running on http://localhost:${PORT}`);
});

export default app;

