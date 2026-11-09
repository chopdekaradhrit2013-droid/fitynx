import { GARMENT_TYPES, type Group, type Look, type LookItem, type WardrobeItem } from "./types";
import { uid } from "./store";
import { hueDistance, isNeutral } from "./color";

export interface RouletteFilters {
  occasion: string;
  vibe: "relaxed" | "polished" | "minimal" | "expressive";
  includeOuterwear?: boolean;
}

export function spinOutfitRoulette(
  wardrobe: WardrobeItem[],
  filters: RouletteFilters
): { look: Look | null; error?: string } {
  if (wardrobe.length === 0) {
    return { look: null, error: "Your wardrobe is empty. Upload clothes to spin the decider." };
  }

  const byGroup = (g: Group) => wardrobe.filter(i => GARMENT_TYPES[i.type].group === g);
  const tops = byGroup("top");
  const bottoms = byGroup("bottom");
  const outers = byGroup("outerwear");
  const dresses = byGroup("dress");
  const shoes = byGroup("shoes");
  const accs = byGroup("accessory");

  const canBuild = dresses.length > 0 || (tops.length > 0 && bottoms.length > 0);
  if (!canBuild) {
    return { look: null, error: "Add at least a top and a bottom (or a dress) to spin for an outfit." };
  }

  // Shuffle array helper
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const candidateLooks: Array<{ items: LookItem[]; score: number; rationale: string }> = [];

  // 1. Choose base: dress OR top + bottom
  const useDress = dresses.length > 0 && (tops.length === 0 || Math.random() > 0.6);

  if (useDress) {
    for (const d of shuffle(dresses).slice(0, 5)) {
      const parts: LookItem[] = [{ itemId: d.id, role: "Dress" }];
      const sh = shuffle(shoes)[0];
      if (sh) parts.push({ itemId: sh.id, role: "Shoes" });
      if (outers.length && (filters.includeOuterwear || Math.random() > 0.5)) {
        parts.push({ itemId: shuffle(outers)[0].id, role: "Layer" });
      }
      if (accs.length && Math.random() > 0.4) {
        parts.push({ itemId: shuffle(accs)[0].id, role: "Accent" });
      }
      candidateLooks.push({
        items: parts,
        score: 9.3,
        rationale: `One-and-done effortless dressing centered on ${d.name}.`,
      });
    }
  } else {
    for (const t of shuffle(tops).slice(0, 6)) {
      for (const b of shuffle(bottoms).slice(0, 6)) {
        const parts: LookItem[] = [
          { itemId: t.id, role: "Top" },
          { itemId: b.id, role: "Bottom" },
        ];
        // Score color harmony
        const d = hueDistance(t.colorHex, b.colorHex);
        const tNeu = isNeutral(t.colorHex);
        const bNeu = isNeutral(b.colorHex);
        let harmonyScore = 8.5;
        if (tNeu && bNeu) harmonyScore = 9.2;
        else if (tNeu || bNeu) harmonyScore = 9.4;
        else if (d < 30 || d > 140) harmonyScore = 9.0;
        else harmonyScore = 8.0;

        const sh = shuffle(shoes)[0];
        if (sh) parts.push({ itemId: sh.id, role: "Shoes" });

        if (outers.length && (filters.includeOuterwear || Math.random() > 0.5)) {
          const out = shuffle(outers)[0];
          parts.push({ itemId: out.id, role: "Layer" });
        }

        if (accs.length && Math.random() > 0.5) {
          parts.push({ itemId: shuffle(accs)[0].id, role: "Detail" });
        }

        candidateLooks.push({
          items: parts,
          score: harmonyScore,
          rationale: `Proportional pairing of ${t.name} with ${b.name}.`,
        });
      }
    }
  }

  if (candidateLooks.length === 0) {
    return { look: null, error: "Could not assemble an outfit from current pieces." };
  }

  // Sort by score and pick from top 3 for variety
  candidateLooks.sort((a, b) => b.score - a.score);
  const picked = candidateLooks[Math.floor(Math.random() * Math.min(candidateLooks.length, 3))];

  const itemsMap = new Map(wardrobe.map(i => [i.id, i]));
  const lookItems = picked.items.map(p => itemsMap.get(p.itemId)).filter(Boolean) as WardrobeItem[];
  const itemNames = lookItems.map(i => i.name).join(", ").replace(/, ([^,]*)$/, " & $1");

  const titles = [
    `The 10-Second Uniform`,
    `Effortless ${filters.occasion} Edit`,
    `The Fast Decision`,
    `Instant ${filters.vibe.charAt(0).toUpperCase() + filters.vibe.slice(1)} Cut`,
  ];

  const look: Look = {
    id: uid(),
    title: titles[Math.floor(Math.random() * titles.length)],
    occasion: filters.occasion,
    rationale: `${itemNames} locked in for quick, foolproof ${filters.occasion.toLowerCase()} dressing.`,
    coordination: `Balanced tonal interplay keeping the line sharp and effortless.`,
    finishing: `Slip into this look without overthinking — ready in seconds.`,
    tip: `Confidence is 80% of fit. Wear it with conviction.`,
    score: picked.score,
    scoreNote: `Roulette confidence score: ${Math.round(picked.score * 10)}% match`,
    items: picked.items,
    saved: false,
    createdAt: Date.now(),
  };

  return { look };
}
