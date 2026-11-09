export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  provider: "email" | "google";
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<UserRecord, "passwordHash">;

export type GarmentType =
  | "tee" | "shirt" | "knit" | "hoodie"
  | "trousers" | "jeans" | "shorts" | "skirt"
  | "jacket" | "coat" | "blazer"
  | "dress"
  | "sneakers" | "boots" | "loafers"
  | "bag" | "scarf" | "cap";

export interface WardrobeItemRecord {
  id: string;
  userId: string;
  name: string;
  type: GarmentType;
  colorName: string;
  colorHex: string;
  notes: string;
  image: string;
  cutout?: string;
  createdAt: number;
}

export interface LookItemRecord {
  itemId: string;
  role: string;
}

export interface LookRecord {
  id: string;
  userId: string;
  title: string;
  occasion: string;
  rationale: string;
  coordination: string;
  finishing: string;
  tip: string;
  score: number;
  scoreNote: string;
  items: LookItemRecord[];
  saved: boolean;
  createdAt: number;
}

export interface PlanRecord {
  id: string;
  userId: string;
  lookId: string;
  date: string;
  note: string;
  createdAt: number;
}

export interface DatabaseSchema {
  users: UserRecord[];
  wardrobe: WardrobeItemRecord[];
  looks: LookRecord[];
  plans: PlanRecord[];
}

