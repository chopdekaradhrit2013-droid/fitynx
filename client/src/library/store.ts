import { useSyncExternalStore } from "react";
import type { Look, PlanEntry, WardrobeItem } from "./types";

/**
 * Tiny persistent store. Photos can be large, so everything lives in IndexedDB;
 * nothing is ever sent to a server.
 */
interface State { items: WardrobeItem[]; looks: Look[]; plan: PlanEntry[]; ready: boolean; persistError: boolean }

const DB_NAME = "fitynx";
const STORE = "kv";
const KEYS = ["items", "looks", "plan"] as const;

let state: State = { items: [], looks: [], plan: [], ready: false, persistError: false };
const listeners = new Set<() => void>();

function emit() { listeners.forEach(l => l()); }
function set(patch: Partial<State>) { state = { ...state, ...patch }; emit(); }

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
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key: string, value: unknown) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let writeQueue: Promise<unknown> = Promise.resolve();
function persist(key: (typeof KEYS)[number]) {
  const value = state[key];
  writeQueue = writeQueue.then(() => dbPut(key, value)).then(
    () => { if (state.persistError) set({ persistError: false }); },
    () => set({ persistError: true }),
  );
}

export async function initStore() {
  try {
    const [items, looks, plan] = await Promise.all(KEYS.map(k => dbGet<unknown[]>(k)));
    set({ items: (items as WardrobeItem[]) ?? [], looks: (looks as Look[]) ?? [], plan: (plan as PlanEntry[]) ?? [], ready: true });
  } catch {
    set({ ready: true, persistError: true });
  }
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const actions = {
  addItems(items: WardrobeItem[]) { set({ items: [...items, ...state.items] }); persist("items"); },
  updateItem(id: string, patch: Partial<WardrobeItem>) { set({ items: state.items.map(i => (i.id === id ? { ...i, ...patch } : i)) }); persist("items"); },
  removeItem(id: string) {
    set({ items: state.items.filter(i => i.id !== id) });
    persist("items");
  },
  clearSamples() { set({ items: state.items.filter(i => !i.sample) }); persist("items"); },
  setLooks(looks: Look[]) {
    const planned = new Set(state.plan.map(p => p.lookId));
    const keep = state.looks.filter(l => (l.saved || planned.has(l.id)) && !looks.some(n => n.id === l.id));
    set({ looks: [...looks, ...keep].slice(0, 80) });
    persist("looks");
  },
  toggleSaved(id: string) { set({ looks: state.looks.map(l => (l.id === id ? { ...l, saved: !l.saved } : l)) }); persist("looks"); },
  addPlan(entry: PlanEntry) { set({ plan: [...state.plan, entry].sort((a, b) => a.date.localeCompare(b.date)) }); persist("plan"); },
  removePlan(id: string) { set({ plan: state.plan.filter(p => p.id !== id) }); persist("plan"); },
  async wipe() {
    set({ items: [], looks: [], plan: [] });
    KEYS.forEach(persist);
    await writeQueue;
  },
};

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
