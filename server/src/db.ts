import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import type { DatabaseSchema, LookRecord, PlanRecord, SafeUser, UserRecord, WardrobeItemRecord } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const DB_FILE = path.join(DATA_DIR, "database.json");

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync("password123", salt);

  return {
    users: [
      {
        id: "usr_google_alex",
        name: "Alex Morgan",
        email: "alex.morgan@gmail.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        provider: "google",
        googleId: "google_alex_123",
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: "usr_email_elena",
        name: "Elena Rostova",
        email: "demo@fitynx.com",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        provider: "email",
        passwordHash: demoPasswordHash,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ],
    wardrobe: [],
    looks: [],
    plans: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    ensureDirectoryExists(DATA_DIR);
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.wardrobe) this.data.wardrobe = [];
        if (!this.data.looks) this.data.looks = [];
        if (!this.data.plans) this.data.plans = [];
      } catch (err) {
        console.error("Error reading database, creating new database instance:", err);
        this.data = getInitialDatabase();
        this.save();
      }
    } else {
      this.data = getInitialDatabase();
      this.save();
    }
  }

  private save(): void {
    try {
      ensureDirectoryExists(DATA_DIR);
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Failed to write database file:", err);
    }
  }

  // --- Users ---
  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): UserRecord | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === clean);
  }

  getUserByGoogleId(googleId: string): UserRecord | undefined {
    return this.data.users.find(u => u.googleId === googleId);
  }

  createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      id, // protect id
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[index];
  }

  toSafeUser(user: UserRecord): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // --- Wardrobe ---
  getWardrobeItems(userId: string): WardrobeItemRecord[] {
    return this.data.wardrobe.filter(item => item.userId === userId);
  }

  getWardrobeItem(userId: string, id: string): WardrobeItemRecord | undefined {
    return this.data.wardrobe.find(item => item.userId === userId && item.id === id);
  }

  addWardrobeItems(items: WardrobeItemRecord[]): WardrobeItemRecord[] {
    this.data.wardrobe.unshift(...items);
    this.save();
    return items;
  }

  updateWardrobeItem(userId: string, id: string, patch: Partial<WardrobeItemRecord>): WardrobeItemRecord | undefined {
    const index = this.data.wardrobe.findIndex(i => i.userId === userId && i.id === id);
    if (index === -1) return undefined;

    this.data.wardrobe[index] = {
      ...this.data.wardrobe[index],
      ...patch,
      id,
      userId,
    };
    this.save();
    return this.data.wardrobe[index];
  }

  deleteWardrobeItem(userId: string, id: string): boolean {
    const initialLength = this.data.wardrobe.length;
    this.data.wardrobe = this.data.wardrobe.filter(i => !(i.userId === userId && i.id === id));
    const changed = this.data.wardrobe.length !== initialLength;
    if (changed) this.save();
    return changed;
  }

  // --- Looks ---
  getLooks(userId: string): LookRecord[] {
    return this.data.looks.filter(l => l.userId === userId);
  }

  setLooks(userId: string, incomingLooks: LookRecord[]): LookRecord[] {
    // Keep saved looks and planned looks
    const plannedIds = new Set(this.data.plans.filter(p => p.userId === userId).map(p => p.lookId));
    const current = this.data.looks.filter(l => l.userId === userId);
    const toKeep = current.filter(
      l => (l.saved || plannedIds.has(l.id)) && !incomingLooks.some(n => n.id === l.id)
    );

    const userLooks = [...incomingLooks, ...toKeep].slice(0, 100);
    // Remove old user looks and append new set
    this.data.looks = this.data.looks.filter(l => l.userId !== userId).concat(userLooks);
    this.save();
    return userLooks;
  }

  toggleSavedLook(userId: string, lookId: string): LookRecord | undefined {
    const look = this.data.looks.find(l => l.userId === userId && l.id === lookId);
    if (!look) return undefined;

    look.saved = !look.saved;
    this.save();
    return look;
  }

  // --- Plans ---
  getPlans(userId: string): PlanRecord[] {
    return this.data.plans
      .filter(p => p.userId === userId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  addPlan(plan: PlanRecord): PlanRecord {
    this.data.plans.push(plan);
    this.data.plans.sort((a, b) => a.date.localeCompare(b.date));
    this.save();
    return plan;
  }

  deletePlan(userId: string, planId: string): boolean {
    const initialLength = this.data.plans.length;
    this.data.plans = this.data.plans.filter(p => !(p.userId === userId && p.id === planId));
    const changed = this.data.plans.length !== initialLength;
    if (changed) this.save();
    return changed;
  }

  // --- Wipe Data for User ---
  wipeUserData(userId: string): void {
    this.data.wardrobe = this.data.wardrobe.filter(w => w.userId !== userId);
    this.data.looks = this.data.looks.filter(l => l.userId !== userId);
    this.data.plans = this.data.plans.filter(p => p.userId !== userId);
    this.save();
  }
}

export const db = new Database();

