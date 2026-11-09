export interface Rgb { r: number; g: number; b: number }

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl({ r, g, b }: Rgb) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

export function nameColor(hex: string): string {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  if (l < 0.13) return "Black";
  if (l > 0.9 && s < 0.25) return "White";
  if (s < 0.1) {
    if (l < 0.3) return "Charcoal";
    if (l < 0.62) return "Grey";
    return "Light grey";
  }
  if (s < 0.28 && l > 0.72) return h > 25 && h < 70 ? "Cream" : "Stone";
  if (s < 0.3 && h >= 20 && h < 60) return l < 0.35 ? "Espresso" : l < 0.62 ? "Taupe" : "Sand";
  if (h < 14 || h >= 346) return l < 0.3 ? "Burgundy" : l > 0.7 ? "Blush" : s < 0.65 && l < 0.6 ? "Brick" : "Red";
  if (h < 40) return l < 0.35 ? "Brown" : l > 0.7 ? "Peach" : s > 0.55 ? "Rust" : "Camel";
  if (h < 65) return l > 0.65 ? "Butter" : l < 0.4 ? "Olive" : "Mustard";
  if (h < 160) return l < 0.3 ? "Forest" : l > 0.7 ? "Mint" : s < 0.35 ? "Sage" : "Green";
  if (h < 200) return "Teal";
  if (h < 250) return l < 0.3 ? "Navy" : l > 0.7 ? "Sky" : "Blue";
  if (h < 290) return l < 0.35 ? "Plum" : "Lavender";
  return l > 0.7 ? "Pink" : "Magenta";
}

const NEUTRAL_NAMES = new Set(["Black", "White", "Charcoal", "Grey", "Light grey", "Cream", "Stone", "Taupe", "Sand", "Espresso", "Brown", "Camel", "Navy"]);

/** Neutrals in the wardrobe sense: black, white, greys, beiges, browns and navy. */
export function isNeutral(hex: string) {
  const { s, l } = rgbToHsl(hexToRgb(hex));
  return s < 0.12 || l < 0.14 || l > 0.9 || NEUTRAL_NAMES.has(nameColor(hex));
}

/** Perceived hue distance in degrees (0-180). */
export function hueDistance(a: string, b: string) {
  const ha = rgbToHsl(hexToRgb(a)).h, hb = rgbToHsl(hexToRgb(b)).h;
  const d = Math.abs(ha - hb);
  return d > 180 ? 360 - d : d;
}
