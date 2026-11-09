import { Router } from "express";
import { comparePassword, generateToken, hashPassword, parseGoogleJwt, requireAuth, type AuthenticatedRequest } from "../auth.js";
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
      if (existing.provider === "google") {
        res.status(400).json({
          error: "An account with this email exists via Google. Please click 'Continue with Google'.",
        });
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

    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      res.status(401).json({ error: "No account found with this email. Please check or sign up." });
      return;
    }

    if (user.provider === "google") {
      res.status(400).json({
        error: "This account was registered with Google. Please use 'Continue with Google'.",
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: "Invalid account authentication configuration." });
      return;
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Incorrect password. Please try again." });
      return;
    }

    const token = generateToken(user);
    const safeUser = db.toSafeUser(user);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Sign in error:", err);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Sign in or Sign up with Google OAuth
router.post("/google", async (req, res): Promise<void> => {
  try {
    const { credential, email, name, avatar, id } = req.body;

    let googleEmail = email;
    let googleName = name;
    let googleAvatar = avatar;
    let googleId = id;

    // If official Google ID token is passed, parse it
    if (typeof credential === "string" && credential.includes(".")) {
      const parsed = parseGoogleJwt(credential);
      if (parsed) {
        googleEmail = parsed.email;
        googleName = parsed.name;
        googleAvatar = parsed.picture;
        googleId = parsed.sub;
      }
    }

    if (!googleEmail || typeof googleEmail !== "string") {
      res.status(400).json({ error: "Missing Google account email" });
      return;
    }

    const cleanEmail = googleEmail.trim().toLowerCase();
    const cleanName = (typeof googleName === "string" && googleName.trim()) || cleanEmail.split("@")[0];

    let user = db.getUserByEmail(cleanEmail);
    const now = new Date().toISOString();

    if (!user) {
      // Create new user via Google
      user = {
        id: googleId ? `usr_g_${googleId}` : `usr_g_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        avatar: googleAvatar,
        provider: "google",
        googleId,
        createdAt: now,
        updatedAt: now,
      };
      db.createUser(user);
    } else {
      // Update existing user with Google details if not already present
      const updates: Partial<UserRecord> = {};
      if (googleAvatar && user.avatar !== googleAvatar) updates.avatar = googleAvatar;
      if (cleanName && user.name !== cleanName) updates.name = cleanName;
      if (googleId && !user.googleId) updates.googleId = googleId;

      if (Object.keys(updates).length > 0) {
        user = db.updateUser(user.id, updates)!;
      }
    }

    const token = generateToken(user);
    const safeUser = db.toSafeUser(user);

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

// Get current user profile
router.get("/me", requireAuth, (req: AuthenticatedRequest, res): void => {
  const safeUser = db.toSafeUser(req.user!);
  res.json({ user: safeUser });
});

// Sign out
router.post("/signout", (_req, res): void => {
  res.json({ success: true });
});

export default router;

