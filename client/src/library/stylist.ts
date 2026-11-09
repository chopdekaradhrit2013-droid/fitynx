import { hueDistance, isNeutral } from "./color";
import { GARMENT_TYPES, type Group, type Look, type LookItem, type WardrobeItem } from "./types";
import { uid } from "./store";

export interface Brief {
  occasion: string;
  vibe: "polished" | "relaxed" | "minimal" | "expressive";
  weather: "hot" | "mild" | "cool" | "cold" | "rainy";
  colors: string;
  note: string;
}

export const VIBES: Array<{ value: Brief["vibe"]; label: string }> = [
  { value: "polished", label: "Polished" },
  { value: "relaxed", label: "Relaxed" },
  { value: "minimal", label: "Minimal" },
  { value: "expressive", label: "Expressive" },
];

export const WEATHER: Array<{ value: Brief["weather"]; label: string }> = [
  { value: "hot", label: "Hot" },
  { value: "mild", label: "Mild" },
  { value: "cool", label: "Cool" },
  { value: "cold", label: "Cold" },
  { value: "rainy", label: "Rainy" },
];

export const OCCASIONS = ["Everyday", "Office", "Dinner out", "Date night", "Weekend", "Event / formal", "Travel"];

const TARGET_FORMALITY: Record<string, number> = {
  everyday: 1, office: 3, dinner: 2.5, date: 2.8, weekend: 0.8, event: 3.8, formal: 3.8, travel: 1,
};

function targetFormality(occasion: string, vibe: Brief["vibe"]) {
  const key = Object.keys(TARGET_FORMALITY).find(k => occasion.toLowerCase().includes(k));
  const base = key ? TARGET_FORMALITY[key] : 1.5;
  return base + (vibe === "polished" ? 0.5 : vibe === "relaxed" ? -0.5 : 0);
}

function targetWarmth(w: Brief["weather"]) {
  return { hot: 0.4, mild: 1.4, cool: 2.2, cold: 3.2, rainy: 2 }[w];
}

const hasOuter = (w: Brief["weather"]) => w === "cool" || w === "cold" || w === "rainy";

function colorPairScore(a: string, b: string) {
  const na = isNeutral(a), nb = isNeutral(b);
  if (na && nb) return 1;
  if (na || nb) return 0.9;
  const d = hueDistance(a, b);
  if (d < 25) return 0.85;      // tonal
  if (d > 150) return 0.8;      // complementary
  if (d > 100 && d < 140) return 0.6; // triadic-ish
  return 0.3;                   // clashing mid-range
}

function paletteScore(items: WardrobeItem[]) {
  let total = 0, n = 0;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { total += colorPairScore(items[i].colorHex, items[j].colorHex); n++; }
  const accents = items.filter(i => !isNeutral(i.colorHex)).length;
  const accentPenalty = accents > 2 ? (accents - 2) * 0.18 : 0;
  return Math.max(0, (n ? total / n : 1) - accentPenalty);
}

function colorPreferenceBonus(items: WardrobeItem[], prefs: string) {
  const words = prefs.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
  if (!words.length) return 0;
  return items.some(i => words.some(w => i.colorName.toLowerCase().includes(w) || i.name.toLowerCase().includes(w))) ? 0.12 : 0;
}

interface Candidate { items: Array<{ item: WardrobeItem; role: string }>; score: number; parts: { palette: number; formality: number; weather: number; avgFormality: number; accents: number } }

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export function composeLooks(wardrobe: WardrobeItem[], brief: Brief): { looks: Look[]; message?: string } {
  const by = (g: Group) => wardrobe.filter(i => GARMENT_TYPES[i.type].group === g);
  const tops = by("top"), bottoms = by("bottom"), outers = by("outerwear"), dresses = by("dress"), shoes = by("shoes"), accs = by("accessory");

  const canBuild = dresses.length > 0 || (tops.length > 0 && bottoms.length > 0);
  if (!canBuild) {
    return { looks: [], message: "To compose a complete look FITYNX needs at least a top and a bottom (or a dress). Add a few more pieces and try again." };
  }

  const fTarget = targetFormality(brief.occasion, brief.vibe);
  const wTarget = targetWarmth(brief.weather);
  const needOuter = hasOuter(brief.weather);
  const candidates: Candidate[] = [];

  const bases: Array<Array<{ item: WardrobeItem; role: string }>> = [];
  for (const t of tops) for (const b of bottoms) bases.push([{ item: t, role: "Top" }, { item: b, role: "Bottom" }]);
  for (const d of dresses) bases.push([{ item: d, role: "Dress" }]);

  for (const base of bases) {
    const outerOptions: Array<WardrobeItem | null> = needOuter && outers.length ? outers : outers.length && Math.random() > 0.65 ? [null, ...outers] : [null];
    const shoeOptions: Array<WardrobeItem | null> = shoes.length ? shoes : [null];
    for (const o of outerOptions) {
      for (const s of shoeOptions) {
        const parts = [...base];
        if (o) parts.push({ item: o, role: "Layer" });
        if (s) parts.push({ item: s, role: "Shoes" });
        if (accs.length && Math.random() > 0.4) parts.push({ item: pick(accs), role: "Finish" });
        const items = parts.map(p => p.item);
        const palette = paletteScore(items);
        const avgFormality = items.filter(i => GARMENT_TYPES[i.type].group !== "accessory").reduce((a, i) => a + GARMENT_TYPES[i.type].formality, 0) / Math.max(1, items.filter(i => GARMENT_TYPES[i.type].group !== "accessory").length);
        const dressLevels = items.filter(i => GARMENT_TYPES[i.type].group !== "accessory").map(i => GARMENT_TYPES[i.type].formality);
        const spread = Math.max(...dressLevels) - Math.min(...dressLevels);
        const formality = Math.max(0, 1 - Math.abs(avgFormality - fTarget) / 3 - (spread > 2 ? (spread - 2) * 0.14 : 0));
        const clothes = items.filter(i => ["top", "bottom", "outerwear", "dress"].includes(GARMENT_TYPES[i.type].group));
        const warmth = clothes.reduce((a, i) => a + GARMENT_TYPES[i.type].warmth, 0) / Math.max(1, clothes.length) + (o ? 0.5 : 0);
        const weather = Math.max(0, 1 - Math.abs(warmth - wTarget) / 3) - (brief.weather === "hot" && o ? 0.25 : 0) - (needOuter && !o && outers.length ? 0.2 : 0) - (brief.weather === "hot" && s?.type === "boots" ? 0.3 : 0) - (brief.weather === "cold" && s?.type === "sneakers" ? 0.08 : 0);
        const vibeBonus = brief.vibe === "minimal" ? (items.filter(i => !isNeutral(i.colorHex)).length <= 1 ? 0.1 : -0.05) : brief.vibe === "expressive" ? (items.some(i => !isNeutral(i.colorHex)) ? 0.1 : -0.05) : 0;
        const total = palette * 0.36 + formality * 0.34 + weather * 0.3 + vibeBonus + colorPreferenceBonus(items, brief.colors) + (s ? 0.04 : 0) + Math.random() * 0.04;
        candidates.push({ items: parts, score: total, parts: { palette, formality, weather, avgFormality, accents: items.filter(i => !isNeutral(i.colorHex)).length } });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const chosen: Candidate[] = [];
  for (const c of candidates) {
    if (chosen.length >= 3) break;
    const ids = new Set(c.items.map(p => p.item.id));
    // Keep the looks meaningfully different: no more than half the pieces shared.
    const tooSimilar = chosen.some(o => o.items.filter(p => ids.has(p.item.id)).length > Math.ceil(c.items.length / 2));
    if (!tooSimilar) chosen.push(c);
  }
  if (!chosen.length && candidates[0]) chosen.push(candidates[0]);

  const used = new Set<string>();
  const looks = chosen.map((c, idx) => toLook(c, brief, idx, fTarget, used));
  const hints: string[] = [];
  if (!shoes.length) hints.push("shoes");
  if (needOuter && !outers.length) hints.push("an outer layer");
  return { looks, message: hints.length ? `These looks would be stronger with ${hints.join(" and ")} in your wardrobe.` : undefined };
}

const TITLE_BANK = {
  formal: ["The considered edit", "Quiet authority", "Sharp, softly"],
  casual: ["Easy rhythm", "The off-duty uniform", "Soft landing"],
  tonal: ["Tonal and clean", "Less, better", "The quiet palette"],
  accent: ["Colour with intent", "One good note", "The accent edit"],
};

function pickTitle(c: Candidate, used: Set<string>) {
  const pools = [c.parts.accents === 1 ? TITLE_BANK.accent : c.parts.accents === 0 ? TITLE_BANK.tonal : TITLE_BANK.formal, c.parts.avgFormality >= 2.5 ? TITLE_BANK.formal : TITLE_BANK.casual, TITLE_BANK.tonal, TITLE_BANK.casual];
  for (const pool of pools) for (const t of pool) if (!used.has(t)) { used.add(t); return t; }
  return "Another way to wear it";
}

function describePalette(items: WardrobeItem[], palette: number) {
  const names = Array.from(new Set(items.map(i => i.colorName.toLowerCase())));
  const neutrals = items.filter(i => isNeutral(i.colorHex)).length;
  const accent = items.find(i => !isNeutral(i.colorHex));
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.slice(-1)}` : names[0];
  if (neutrals === items.length) return `An all-neutral palette (${list}) keeps everything calm and easy to wear.`;
  if (accent && neutrals === items.length - 1) return `${accent.colorName} is the single accent, supported by neutrals so it reads as intentional.`;
  if (palette >= 0.8) return `The ${list} palette sits comfortably together, so the pieces feel related rather than matched.`;
  if (palette >= 0.62) return `A balanced mix of ${list}; let one piece lead and keep the rest quiet.`;
  return `A bolder mix of ${list} — keep accessories minimal so the colours don’t compete.`;
}

function formalityLine(c: Candidate, brief: Brief, target: number) {
  const diff = c.parts.avgFormality - target;
  const occ = brief.occasion.toLowerCase();
  if (Math.abs(diff) <= 0.6) return `The level of polish suits “${occ}”.`;
  if (diff > 0) return `A touch dressier than “${occ}” needs — easy to dial down by swapping the top layer.`;
  return `A little more relaxed than “${occ}” calls for; this is the closest balance from the pieces you own.`;
}

function toLook(c: Candidate, brief: Brief, idx: number, fTarget: number, used: Set<string>): Look {
  const items = c.items.map(p => p.item);
  const main = c.items.filter(p => p.role !== "Finish");
  const piece = (p: { item: WardrobeItem }) => p.item.name.toLowerCase();
  const weatherLine = {
    hot: "Light, breathable pieces keep it comfortable in the heat.",
    mild: "The weight suits mild conditions without feeling overdressed.",
    cool: "Layering gives you control as the temperature shifts.",
    cold: "The heavier layers are chosen to keep you properly warm.",
    rainy: "A sturdier layer and closed shoes handle the wet.",
  }[brief.weather];
  const shoe = items.find(i => GARMENT_TYPES[i.type].group === "shoes");
  const finish = shoe ? `Finish with your ${shoe.name.toLowerCase()}.` : "Add clean, simple shoes to complete the line.";
  const tips = [
    "Half-tuck the top to define the waist.",
    "Roll the sleeves once for an easier proportion.",
    "Keep accessories to a single statement piece.",
    "Steam the main layer — it lifts the whole look.",
  ];
  const score = Math.round(Math.min(9.6, 4.8 + c.score * 4.2) * 10) / 10;
  return {
    id: uid(),
    title: pickTitle(c, used),
    occasion: brief.occasion,
    rationale: `${main.map(piece).slice(0, 4).join(", ").replace(/, ([^,]*)$/, " and $1")} come together as a complete outfit for ${brief.occasion.toLowerCase()}. ${weatherLine}`,
    coordination: `${describePalette(items, c.parts.palette)} ${formalityLine(c, brief, fTarget)}`,
    finishing: finish,
    tip: tips[(idx + items.length) % tips.length],
    score,
    scoreNote: `Palette ${Math.round(c.parts.palette * 100)}% · Occasion ${Math.round(c.parts.formality * 100)}% · Weather ${Math.round(c.parts.weather * 100)}%`,
    items: c.items.map<LookItem>(p => ({ itemId: p.item.id, role: p.role })),
    saved: false,
    createdAt: Date.now(),
  };
}
