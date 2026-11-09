import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { db } from "../db.js";
import type { WardrobeItemRecord } from "../types.js";

const router = Router();

// Apply auth to all wardrobe routes
router.use(requireAuth);

// GET /api/wardrobe - List user's wardrobe items
router.get("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const items = db.getWardrobeItems(userId);
  res.json({ items });
});

// POST /api/wardrobe - Add one or more pieces
router.post("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const body = req.body;

  const rawList: any[] = Array.isArray(body.items) ? body.items : [body];
  const now = Date.now();

  const toAdd: WardrobeItemRecord[] = rawList.map((item: any, index: number) => ({
    id: item.id || `item_${now}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    name: (item.name || "Untitled piece").trim(),
    type: item.type || "tee",
    colorHex: item.colorHex || "#000000",
    colorName: item.colorName || "Black",
    notes: item.notes || "",
    image: item.image || "",
    cutout: item.cutout || undefined,
    createdAt: item.createdAt || now - index,
  }));

  const added = db.addWardrobeItems(toAdd);
  res.status(201).json({ items: added });
});

// PATCH /api/wardrobe/:id - Update a piece
router.patch("/:id", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const patch = req.body;

  const updated = db.updateWardrobeItem(userId, id, patch);
  if (!updated) {
    res.status(404).json({ error: "Wardrobe item not found" });
    return;
  }

  res.json({ item: updated });
});

// DELETE /api/wardrobe/:id - Delete a piece
router.delete("/:id", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const deleted = db.deleteWardrobeItem(userId, id);
  if (!deleted) {
    res.status(404).json({ error: "Wardrobe item not found" });
    return;
  }

  res.json({ success: true });
});

// DELETE /api/wardrobe - Erase all data for user
router.delete("/", (req: AuthenticatedRequest, res): void => {
  const userId = req.user!.id;
  db.wipeUserData(userId);
  res.json({ success: true, message: "All wardrobe data erased" });
});

export default router;
