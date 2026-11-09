import { useSyncExternalStore } from "react";
import { api, getAuthToken } from "./api";
import type { Look, PlanEntry, WardrobeItem } from "./types";

interface State {
  items: WardrobeItem[];
  looks: Look[];
  plan: PlanEntry[];
  ready: boolean;
  persistError: boolean;
  userId: string | null;
}

const DB_NAME = "fitynx";
const STORE = "kv";
const KEYS = ["items", "looks", "plan"] as const;

let currentUserId: string | null = null;
let state: State = { items: [], looks: [], plan: [], ready: false, persistError: false, userId: null };
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }
function set(patch: Partial<State>) { state = { ...state, ...patch }; emit(); }

function getStorageKey(key: string): string {
  return currentUserId ? `usr_${currentUserId}_${key}` : key;
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function dbPut(key: string, value: unknown) {
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore local cache error
  }
}

let writeQueue: Promise<unknown> = Promise.resolve();
function persistLocal(key: (typeof KEYS)[number]) {
  const value = state[key];
  const storageKey = getStorageKey(key);
  writeQueue = writeQueue.then(() => dbPut(storageKey, value));
}

export async function initStore(userId: string | null = null) {
  currentUserId = userId;
  set({ ready: false, userId });

  if (!userId) {
    set({ items: [], looks: [], plan: [], ready: true });
    return;
  }

  // 1. Try loading cached data from IndexedDB for instantaneous UI response
  try {
    const [cachedItems, cachedLooks, cachedPlan] = await Promise.all(
      KEYS.map(k => dbGet<unknown[]>(getStorageKey(k)))
    );

    if (cachedItems !== undefined) {
      const cleanItems = ((cachedItems as WardrobeItem[]) ?? []).filter(
        i => !i.sample && !i.id.startsWith("sample-")
      );
      set({
        items: cleanItems,
        looks: (cachedLooks as Look[]) ?? [],
        plan: (cachedPlan as PlanEntry[]) ?? [],
        ready: true,
      });
    }
  } catch {
    // continue to server fetch
  }

  // 2. Fetch authoritative data from the backend server
  const token = getAuthToken();
  if (token) {
    try {
      const [wardrobeRes, looksRes, plansRes] = await Promise.all([
        api.wardrobe.list(),
        api.looks.list(),
        api.plans.list(),
      ]);

      const serverItems = (wardrobeRes.items || []).filter(i => !i.sample && !i.id.startsWith("sample-"));
      const serverLooks = looksRes.looks || [];
      const serverPlans = plansRes.plans || [];

      set({
        items: serverItems,
        looks: serverLooks,
        plan: serverPlans,
        ready: true,
      });

      // Update local cache
      KEYS.forEach(persistLocal);
      return;
    } catch (err) {
      console.warn("Could not synchronize with backend server, using offline local state:", err);
    }
  }

  set({ ready: true });
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const actions = {
  async addItems(items: WardrobeItem[]) {
    const valid = items.filter(i => !i.sample && !i.id.startsWith("sample-"));
    const updated = [...valid, ...state.items];
    set({ items: updated });
    persistLocal("items");

    // Persist to backend server
    if (getAuthToken()) {
      try {
        await api.wardrobe.add(valid);
      } catch (err) {
        console.error("Backend error saving items:", err);
      }
    }
  },

  async updateItem(id: string, patch: Partial<WardrobeItem>) {
    const updated = state.items.map(i => (i.id === id ? { ...i, ...patch } : i));
    set({ items: updated });
    persistLocal("items");

    if (getAuthToken()) {
      try {
        await api.wardrobe.update(id, patch);
      } catch (err) {
        console.error("Backend error updating item:", err);
      }
    }
  },

  async removeItem(id: string) {
    const updated = state.items.filter(i => i.id !== id);
    set({ items: updated });
    persistLocal("items");

    if (getAuthToken()) {
      try {
        await api.wardrobe.delete(id);
      } catch (err) {
        console.error("Backend error removing item:", err);
      }
    }
  },

  async logItemsWorn(itemIds: string[]) {
    const now = Date.now();
    const updated = state.items.map(item => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          wearCount: (item.wearCount || 0) + 1,
          lastWorn: now,
        };
      }
      return item;
    });
    set({ items: updated });
    persistLocal("items");

    if (getAuthToken()) {
      itemIds.forEach(id => {
        const it = updated.find(i => i.id === id);
        if (it) {
          api.wardrobe.update(id, { wearCount: it.wearCount, lastWorn: it.lastWorn }).catch(() => {});
        }
      });
    }
  },

  clearSamples() {
    const clean = state.items.filter(i => !i.sample && !i.id.startsWith("sample-"));
    set({ items: clean });
    persistLocal("items");
  },

  async setLooks(looks: Look[]) {
    const planned = new Set(state.plan.map(p => p.lookId));
    const keep = state.looks.filter(l => (l.saved || planned.has(l.id)) && !looks.some(n => n.id === l.id));
    const updated = [...looks, ...keep].slice(0, 80);
    set({ looks: updated });
    persistLocal("looks");

    if (getAuthToken()) {
      try {
        await api.looks.save(updated);
      } catch (err) {
        console.error("Backend error saving looks:", err);
      }
    }
  },

  async saveLook(look: Look) {
    const existing = state.looks.filter(l => l.id !== look.id);
    const updated = [{ ...look, saved: true }, ...existing].slice(0, 80);
    set({ looks: updated });
    persistLocal("looks");

    if (getAuthToken()) {
      try {
        await api.looks.save(updated);
      } catch (err) {
        console.error("Backend error saving single look:", err);
      }
    }
  },

  async toggleSaved(id: string) {
    const updated = state.looks.map(l => (l.id === id ? { ...l, saved: !l.saved } : l));
    set({ looks: updated });
    persistLocal("looks");

    if (getAuthToken()) {
      try {
        await api.looks.toggle(id);
      } catch (err) {
        console.error("Backend error toggling look:", err);
      }
    }
  },

  async addPlan(entry: PlanEntry) {
    const updated = [...state.plan, entry].sort((a, b) => a.date.localeCompare(b.date));
    set({ plan: updated });
    persistLocal("plan");

    if (getAuthToken()) {
      try {
        await api.plans.add(entry);
      } catch (err) {
        console.error("Backend error adding plan:", err);
      }
    }
  },

  async removePlan(id: string) {
    const updated = state.plan.filter(p => p.id !== id);
    set({ plan: updated });
    persistLocal("plan");

    if (getAuthToken()) {
      try {
        await api.plans.delete(id);
      } catch (err) {
        console.error("Backend error removing plan:", err);
      }
    }
  },

  async wipe() {
    set({ items: [], looks: [], plan: [] });
    KEYS.forEach(persistLocal);
    await writeQueue;

    if (getAuthToken()) {
      try {
        await api.wardrobe.wipe();
      } catch (err) {
        console.error("Backend error wiping data:", err);
      }
    }
  },
};

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
