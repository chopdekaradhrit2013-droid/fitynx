export type Group = "top" | "bottom" | "outerwear" | "dress" | "shoes" | "accessory";

export type GarmentType =
  | "tee" | "shirt" | "knit" | "hoodie"
  | "trousers" | "jeans" | "shorts" | "skirt"
  | "jacket" | "coat" | "blazer"
  | "dress"
  | "sneakers" | "boots" | "loafers"
  | "bag" | "scarf" | "cap";

export interface GarmentTypeInfo { label: string; group: Group; formality: number; warmth: number }

/** formality: 0 casual → 4 formal · warmth: 0 light → 4 heavy */
export const GARMENT_TYPES: Record<GarmentType, GarmentTypeInfo> = {
  tee: { label: "T-shirt", group: "top", formality: 0, warmth: 0 },
  shirt: { label: "Shirt", group: "top", formality: 2, warmth: 1 },
  knit: { label: "Knit / sweater", group: "top", formality: 2, warmth: 3 },
  hoodie: { label: "Hoodie", group: "top", formality: 0, warmth: 3 },
  trousers: { label: "Trousers", group: "bottom", formality: 3, warmth: 2 },
  jeans: { label: "Jeans", group: "bottom", formality: 1, warmth: 2 },
  shorts: { label: "Shorts", group: "bottom", formality: 0, warmth: 0 },
  skirt: { label: "Skirt", group: "bottom", formality: 2, warmth: 1 },
  jacket: { label: "Jacket", group: "outerwear", formality: 1, warmth: 2 },
  coat: { label: "Coat", group: "outerwear", formality: 3, warmth: 4 },
  blazer: { label: "Blazer", group: "outerwear", formality: 4, warmth: 2 },
  dress: { label: "Dress", group: "dress", formality: 3, warmth: 1 },
  sneakers: { label: "Sneakers", group: "shoes", formality: 0, warmth: 1 },
  boots: { label: "Boots", group: "shoes", formality: 2, warmth: 3 },
  loafers: { label: "Loafers / dress shoes", group: "shoes", formality: 4, warmth: 1 },
  bag: { label: "Bag", group: "accessory", formality: 2, warmth: 0 },
  scarf: { label: "Scarf", group: "accessory", formality: 2, warmth: 3 },
  cap: { label: "Cap / hat", group: "accessory", formality: 0, warmth: 1 },
};

export const GROUP_LABELS: Record<Group, string> = {
  top: "Tops", bottom: "Bottoms", outerwear: "Outerwear", dress: "Dresses", shoes: "Shoes", accessory: "Accessories",
};

export interface WardrobeItem {
  id: string;
  name: string;
  type: GarmentType;
  colorName: string;
  colorHex: string;
  notes: string;
  /** Resized original photo (data URL). */
  image: string;
  /** Background-removed PNG (data URL) when automatic cut-out succeeded. */
  cutout?: string;
  sample?: boolean;
  price?: number;
  wearCount?: number;
  lastWorn?: number;
  createdAt: number;
}

export interface LookItem { itemId: string; role: string }

export interface Look {
  id: string;
  title: string;
  occasion: string;
  rationale: string;
  coordination: string;
  finishing: string;
  tip: string;
  score: number;
  scoreNote: string;
  items: LookItem[];
  saved: boolean;
  createdAt: number;
}

export interface PlanEntry { id: string; lookId: string; date: string; note: string }
