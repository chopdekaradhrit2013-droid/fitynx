import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { db } from "../db.js";
import type { LookRecord } from "../types.js";

const router = Router();

router.use(requireAuth);

// GET /api/looks - Get looks for current user
router.get("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const looks = db.getLooks(userId);
  res.json({ looks });
});

// POST /api/looks - Update or set composed looks
router.post("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const { looks } = req.body;

  if (!Array.isArray(looks)) {
    res.status(400).json({ error: "Expected array of looks" });
    return;
  }

  const formatted: LookRecord[] = looks.map((l: any) => ({
    id: l.id || `look_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    title: l.title || "Untitled Look",
    occasion: l.occasion || "Everyday",
    rationale: l.rationale || "",
    coordination: l.coordination || "",
    finishing: l.finishing || "",
    tip: l.tip || "",
    score: typeof l.score === "number" ? l.score : 8.5,
    scoreNote: l.scoreNote || "",
    items: Array.isArray(l.items) ? l.items : [],
    saved: !!l.saved,
    createdAt: l.createdAt || Date.now(),
  }));

  const updated = db.setLooks(userId, formatted);
  res.json({ looks: updated });
});

// PATCH /api/looks/:id/toggle - Toggle saved status
router.patch("/:id/toggle", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const toggled = db.toggleSavedLook(userId, id);
  if (!toggled) {
    res.status(404).json({ error: "Look not found" });
    return;
  }

  res.json({ look: toggled });
});

export default router;
