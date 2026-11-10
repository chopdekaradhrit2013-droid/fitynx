import { Router } from "express";
import { comparePassword, generateToken, hashPassword, requireAuth, type AuthenticatedRequest } from "../auth.js";
import { db } from "../db.js";
import type { UserRecord } from "../types.js";

const router = Router();

// Sign up with Email and Password
router.post("/signup", async (req, res): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanName) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      // If user already exists and entered the matching password, log them in seamlessly!
      if (existing.passwordHash && (await comparePassword(password, existing.passwordHash))) {
        const token = generateToken(existing);
        const safeUser = db.toSafeUser(existing);
        res.json({ user: safeUser, token });
        return;
      }
      res.status(400).json({ error: "An account with this email already exists. Please sign in." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      provider: "email",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    db.createUser(newUser);
    const token = generateToken(newUser);
    const safeUser = db.toSafeUser(newUser);

    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error("Sign up error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Sign in with Email and Password
router.post("/signin", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    let user = db.getUserByEmail(cleanEmail);
    if (!user) {
      // Seamless onboarding: automatically create account if it doesn't exist yet
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      const derivedName = cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Studio Member";
      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: derivedName,
        email: cleanEmail,
        provider: "email",
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };

      user = db.createUser(newUser);
      const token = generateToken(user);
      const safeUser = db.toSafeUser(user);

      res.status(201).json({ user: safeUser, token, isNewUser: true });
      return;
    }

    if (!user.passwordHash) {
      // Set password hash if account had no password previously
      user.passwordHash = await hashPassword(password);
      db.updateUser(user.id, { passwordHash: user.passwordHash });
    } else {
      const match = await comparePassword(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ error: "Incorrect password. Please try again." });
        return;
      }
    }

    const token = generateToken(user);
    const safeUser = db.toSafeUser(user);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Sign in error:", err);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Instant guest session
router.post("/guest", async (_req, res): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const guestUser: UserRecord = {
      id: `usr_guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "Studio Guest",
      email: `guest_${Date.now()}@fitynx.local`,
      provider: "email",
      createdAt: now,
      updatedAt: now,
    };
    db.createUser(guestUser);
    const token = generateToken(guestUser);
    const safeUser = db.toSafeUser(guestUser);
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error("Guest session error:", err);
    res.status(500).json({ error: "Failed to create guest session" });
  }
});

// Get current user profile
router.get("/me", requireAuth, (req: AuthenticatedRequest, res): void => {
  const safeUser = db.toSafeUser(req.user!);
  res.json({ user: safeUser });
});

// Update user profile
router.patch("/profile", requireAuth, (req: AuthenticatedRequest, res): void => {
  const { name, avatar } = req.body;
  const updates: Partial<UserRecord> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof avatar === "string") updates.avatar = avatar.trim();

  const updated = db.updateUser(req.user!.id, updates);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: db.toSafeUser(updated) });
});

// Sign out
router.post("/signout", (_req, res): void => {
  res.json({ success: true });
});

export default router;

