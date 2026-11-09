import { hexToRgb, nameColor, rgbToHex } from "./color";
import { GARMENT_TYPES, type GarmentType } from "./types";

export interface Analysis {
  image: string;
  cutout?: string;
  colorHex: string;
  colorName: string;
  type: GarmentType;
  typeGuessed: boolean;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn’t be read as an image."));
    img.src = src;
  });
}

export function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function draw(img: HTMLImageElement, max: number) {
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

export async function generateAiCutout(imageSource: string | Blob | File): Promise<string | undefined> {
  try {
    const { removeBackground: aiRemoveBackground } = await import("@imgly/background-removal");
    const blob = await aiRemoveBackground(imageSource, {
      publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
    });
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => resolve(URL.createObjectURL(blob));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("AI cutout via @imgly/background-removal failed or skipped, trying local canvas:", err);
    return undefined;
  }
}

/** Flood-fill from the image border to remove a plain background. Returns null if the result looks unreliable. */
function removeBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number): string | null {
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  // Estimate background colour from the border.
  let br = 0, bg = 0, bb = 0, n = 0;
  const sample = (x: number, y: number) => { const i = (y * w + x) * 4; br += px[i]; bg += px[i + 1]; bb += px[i + 2]; n++; };
  for (let x = 0; x < w; x += 3) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y += 3) { sample(0, y); sample(w - 1, y); }
  br /= n; bg /= n; bb /= n;

  const tol = 64;
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const near = (p: number) => {
    const i = p * 4;
    return Math.abs(px[i] - br) + Math.abs(px[i + 1] - bg) + Math.abs(px[i + 2] - bb) < tol * 1.8;
  };
  const push = (x: number, y: number) => { const p = y * w + x; if (!visited[p] && near(p)) { visited[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  let removed = 0;
  for (let p = 0; p < w * h; p++) if (visited[p]) removed++;
  const ratio = removed / (w * h);
  if (ratio < 0.08 || ratio > 0.94) return null;

  // Soften the edge by one pixel: pixels touching removed area get half alpha.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (visited[p]) { px[p * 4 + 3] = 0; continue; }
      if (visited[p - 1] || visited[p + 1] || visited[p - w] || visited[p + w]) px[p * 4 + 3] = 140;
    }
  }
  for (let p = 0; p < w * h; p++) if (visited[p]) px[p * 4 + 3] = 0;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  out.getContext("2d")!.putImageData(data, 0, 0);
  return out.toDataURL("image/png");
}

function dominantColor(ctx: CanvasRenderingContext2D, w: number, h: number, alphaMask?: Uint8ClampedArray) {
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<number, { r: number; g: number; b: number; c: number }>();
  const mx = w * 0.22, my = h * 0.18;
  for (let y = Math.floor(my); y < h - my; y += 2) {
    for (let x = Math.floor(mx); x < w - mx; x += 2) {
      const i = (y * w + x) * 4;
      if ((alphaMask ? alphaMask[i + 3] : data[i + 3]) < 200) continue;
      const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
      const b = buckets.get(key) ?? { r: 0, g: 0, b: 0, c: 0 };
      b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2]; b.c++;
      buckets.set(key, b);
    }
  }
  let best: { r: number; g: number; b: number; c: number } | null = null;
  buckets.forEach(b => { if (!best || b.c > best.c) best = b; });
  const pick = best as { r: number; g: number; b: number; c: number } | null;
  if (!pick) return "#8E8A83";
  return rgbToHex({ r: pick.r / pick.c, g: pick.g / pick.c, b: pick.b / pick.c });
}

const KEYWORDS: Array<[RegExp, GarmentType]> = [
  [/t-?shirt|tee\b/i, "tee"], [/hood/i, "hoodie"], [/sweater|knit|jumper|cardigan|pullover/i, "knit"],
  [/shirt|blouse|polo/i, "shirt"], [/jean|denim/i, "jeans"], [/short/i, "shorts"], [/skirt/i, "skirt"],
  [/trouser|pant|chino|slack/i, "trousers"], [/blazer/i, "blazer"], [/coat|parka|trench/i, "coat"],
  [/jacket|bomber|overshirt|windbreaker/i, "jacket"], [/dress|gown/i, "dress"],
  [/sneaker|trainer/i, "sneakers"], [/boot/i, "boots"], [/loafer|oxford|derby|shoe/i, "loafers"],
  [/bag|tote|backpack/i, "bag"], [/scarf|stole/i, "scarf"], [/cap|hat|beanie/i, "cap"],
];

export function guessType(fileName: string): GarmentType | null {
  for (const [re, t] of KEYWORDS) if (re.test(fileName)) return t;
  return null;
}

export async function analyzeFile(file: File): Promise<Analysis> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn’t an image.`);
  if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is larger than 15 MB.`);
  const src = await readFile(file);
  const img = await loadImage(src);
  const main = draw(img, 900);
  const image = main.canvas.toDataURL("image/jpeg", 0.86);

  let cutout: string | undefined;

  // 1. Try AI neural-network background removal
  try {
    cutout = await generateAiCutout(file);
  } catch {
    // continue to fallback
  }

  // 2. Fallback to smart canvas background removal
  if (!cutout) {
    try {
      const small = draw(img, 640);
      const result = removeBackground(small.canvas, small.ctx, small.w, small.h);
      if (result) cutout = result;
    } catch { /* cut-out is optional */ }
  }

  let colorHex: string;
  if (cutout) {
    const cImg = await loadImage(cutout);
    const c = draw(cImg, 240);
    colorHex = dominantColor(c.ctx, c.w, c.h);
  } else {
    const c = draw(img, 240);
    colorHex = dominantColor(c.ctx, c.w, c.h);
  }
  const guess = guessType(file.name);
  return { image, cutout, colorHex, colorName: nameColor(colorHex), type: guess ?? "tee", typeGuessed: !!guess };
}

export function defaultName(colorName: string, type: GarmentType) {
  return `${colorName} ${GARMENT_TYPES[type].label.split(" /")[0].toLowerCase()}`.replace(/^./, c => c.toUpperCase());
}

export { hexToRgb };
