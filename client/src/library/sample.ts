import { garmentDataUrl } from "./garments";
import { nameColor } from "./color";
import type { GarmentType, WardrobeItem } from "./types";

const SAMPLE: Array<[string, GarmentType, string, string]> = [
  ["Everyday tee", "tee", "#E7E1D5", "A quiet base layer with soft drape."],
  ["Oxford shirt", "shirt", "#9DB4CE", "Crisp cotton with a relaxed collar."],
  ["Merino knit", "knit", "#758151", "Fine-gauge knit for cooler afternoons."],
  ["Heavyweight hoodie", "hoodie", "#4A4A48", "Weekend comfort with structure."],
  ["Tailored trousers", "trousers", "#2E3340", "Clean line, mid-weight wool blend."],
  ["Straight jeans", "jeans", "#3E5878", "Dark wash, easy straight leg."],
  ["Linen shorts", "shorts", "#D6C7A8", "Lightweight for warm days."],
  ["Utility jacket", "jacket", "#B05139", "A warm note for between-season days."],
  ["Wool overcoat", "coat", "#8A7358", "The piece that finishes a cold-weather look."],
  ["Unstructured blazer", "blazer", "#2E2E2E", "Smart without being stiff."],
  ["White sneakers", "sneakers", "#F1EEE7", "Clean, minimal, goes with everything."],
  ["Leather loafers", "loafers", "#5A3D2B", "Polished and comfortable."],
  ["Chelsea boots", "boots", "#3A2B22", "Sturdy, weatherproof, dressed-up."],
  ["Canvas tote", "bag", "#C9B79A", "Carry-everything companion."],
];

export function buildSampleWardrobe(): WardrobeItem[] {
  const now = Date.now();
  return SAMPLE.map(([name, type, hex, notes], i) => ({
    id: `sample-${i + 1}`,
    name,
    type,
    colorHex: hex,
    colorName: nameColor(hex),
    notes,
    image: garmentDataUrl(type, hex),
    sample: true,
    createdAt: now - i,
  }));
}
