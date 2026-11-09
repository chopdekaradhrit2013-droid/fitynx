import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { db } from "../db.js";
import type { PlanRecord } from "../types.js";

const router = Router();

router.use(requireAuth);

// GET /api/plans - Get calendar plans
router.get("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const plans = db.getPlans(userId);
  res.json({ plans });
});

// POST /api/plans - Add an entry
router.post("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const { lookId, date, note, id } = req.body;

  if (!lookId || !date) {
    res.status(400).json({ error: "lookId and date are required" });
    return;
  }

  const newPlan: PlanRecord = {
    id: id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    lookId,
    date,
    note: note || "",
    createdAt: Date.now(),
  };

  const added = db.addPlan(newPlan);
  res.status(201).json({ plan: added });
});

// DELETE /api/plans/:id - Remove an entry
router.delete("/:id", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const deleted = db.deletePlan(userId, id);
  if (!deleted) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
