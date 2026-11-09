import { hexToRgb, rgbToHsl, isNeutral, hueDistance, nameColor } from "./color";
import { GARMENT_TYPES, type WardrobeItem, type Look, type LookItem } from "./types";
import { uid } from "./store";

export type HarmonyMode = "complementary" | "analogous" | "monochromatic" | "neutral" | "split";

export interface HarmonyScheme {
  id: HarmonyMode;
  name: string;
  tagline: string;
  description: string;
  colorWheelExplanation: string;
  accentColorName?: string;
  matches: WardrobeItem[];
}

/** Check if two colors match a specific color harmony mode */
export function checkHarmony(anchorHex: string, targetHex: string, mode: HarmonyMode): boolean {
  const d = hueDistance(anchorHex, targetHex);
  const aNeutral = isNeutral(anchorHex);
  const tNeutral = isNeutral(targetHex);

  switch (mode) {
    case "neutral":
      // Either one is neutral, or both are neutrals
      return aNeutral || tNeutral;

    case "monochromatic":
      // Similar hue, regardless of saturation/lightness
      if (aNeutral && tNeutral) return true;
      if (aNeutral !== tNeutral) return false;
      return d <= 25;

    case "analogous":
      // Neighboring hues on the wheel (25° - 55°)
      if (aNeutral || tNeutral) return false;
      return d > 20 && d <= 55;

    case "complementary":
      // Direct opposites on color wheel (145° - 180°)
      if (aNeutral || tNeutral) return false;
      return d >= 145;

    case "split":
      // Split complementary (110° - 144°)
      if (aNeutral || tNeutral) return false;
      return d >= 110 && d < 145;

    default:
      return false;
  }
}

export function getHarmoniesForAnchor(anchor: WardrobeItem, wardrobe: WardrobeItem[]): HarmonyScheme[] {
  const otherItems = wardrobe.filter(i => i.id !== anchor.id);
  const anchorHex = anchor.colorHex;
  const anchorColor = anchor.colorName;
  const anchorIsNeutral = isNeutral(anchorHex);

  const schemes: HarmonyScheme[] = [
    {
      id: "complementary",
      name: "Complementary Contrast",
      tagline: "Bold & dynamic opposites",
      description: anchorIsNeutral
        ? `${anchorColor} is a versatile neutral that provides grounding contrast against vibrant accent shades.`
        : `Pairs opposite hues on the color wheel to make ${anchorColor} pop with energy and confidence.`,
      colorWheelExplanation: "Opposites (180°) create maximum visual excitement without clashing when one leads.",
      matches: otherItems.filter(i => checkHarmony(anchorHex, i.colorHex, "complementary")),
    },
    {
      id: "analogous",
      name: "Analogous Rhythm",
      tagline: "Subtle & cohesive neighbors",
      description: `Pairs ${anchorColor} with neighboring colors on the color wheel for a calm, editorial flow.`,
      colorWheelExplanation: "Adjacent hues (30°-45° apart) naturally transition into one another, creating serene depth.",
      matches: otherItems.filter(i => checkHarmony(anchorHex, i.colorHex, "analogous")),
    },
    {
      id: "monochromatic",
      name: "Monochromatic Tone",
      tagline: "Elevated, single-hue depth",
      description: `Different tones and depths of ${anchorColor}. One of the quietest, most sophisticated ways to dress.`,
      colorWheelExplanation: "Varying tints, tones, and shades of the same base hue give architectural elegance.",
      matches: otherItems.filter(i => checkHarmony(anchorHex, i.colorHex, "monochromatic")),
    },
    {
      id: "neutral",
      name: "Neutral Grounding",
      tagline: "Effortless, foolproof foundation",
      description: anchorIsNeutral
        ? `Pairs ${anchorColor} with other clean neutrals (black, white, camel, grey, navy).`
        : `Grounds the vibrant ${anchorColor} with timeless neutrals so it remains the hero piece.`,
      colorWheelExplanation: "Neutrals balance saturation and give your eyes room to appreciate the silhouette.",
      matches: otherItems.filter(i => checkHarmony(anchorHex, i.colorHex, "neutral")),
    },
    {
      id: "split",
      name: "Split-Complementary",
      tagline: "Nuanced, high-fashion balance",
      description: `Combines ${anchorColor} with the two colors adjacent to its direct complement for visual interest with less contrast friction.`,
      colorWheelExplanation: "Offers high contrast like a complement, but with softened tension for an intentional fashion look.",
      matches: otherItems.filter(i => checkHarmony(anchorHex, i.colorHex, "split")),
    },
  ];

  return schemes;
}

/** Composes a complete outfit look around an anchor piece and a selected harmony pair */
export function composeAnchorLook(
  anchor: WardrobeItem,
  partner: WardrobeItem,
  scheme: HarmonyScheme,
  wardrobe: WardrobeItem[]
): Look {
  const selected = [anchor, partner];
  const selectedIds = new Set(selected.map(i => i.id));
  const anchorGroup = GARMENT_TYPES[anchor.type].group;
  const partnerGroup = GARMENT_TYPES[partner.type].group;

  const hasTop = anchorGroup === "top" || partnerGroup === "top";
  const hasBottom = anchorGroup === "bottom" || partnerGroup === "bottom";
  const hasShoes = anchorGroup === "shoes" || partnerGroup === "shoes";
  const hasDress = anchorGroup === "dress" || partnerGroup === "dress";

  // Fill missing essential pieces
  const remaining = wardrobe.filter(i => !selectedIds.has(i.id));

  if (!hasDress && !hasTop) {
    const candidateTop = remaining.find(i => GARMENT_TYPES[i.type].group === "top" && isNeutral(i.colorHex)) ||
      remaining.find(i => GARMENT_TYPES[i.type].group === "top");
    if (candidateTop) {
      selected.push(candidateTop);
      selectedIds.add(candidateTop.id);
    }
  }

  if (!hasDress && !hasBottom) {
    const candidateBottom = remaining.find(i => !selectedIds.has(i.id) && GARMENT_TYPES[i.type].group === "bottom" && isNeutral(i.colorHex)) ||
      remaining.find(i => !selectedIds.has(i.id) && GARMENT_TYPES[i.type].group === "bottom");
    if (candidateBottom) {
      selected.push(candidateBottom);
      selectedIds.add(candidateBottom.id);
    }
  }

  if (!hasShoes) {
    const candidateShoes = remaining.find(i => !selectedIds.has(i.id) && GARMENT_TYPES[i.type].group === "shoes");
    if (candidateShoes) {
      selected.push(candidateShoes);
      selectedIds.add(candidateShoes.id);
    }
  }

  const itemsWithRole: LookItem[] = selected.map(i => {
    let role = "Piece";
    const g = GARMENT_TYPES[i.type].group;
    if (i.id === anchor.id) role = "Anchor";
    else if (i.id === partner.id) role = "Harmonic Pair";
    else if (g === "top") role = "Top";
    else if (g === "bottom") role = "Bottom";
    else if (g === "outerwear") role = "Layer";
    else if (g === "shoes") role = "Shoes";
    return { itemId: i.id, role };
  });

  return {
    id: uid(),
    title: `${scheme.name}: ${anchor.name} & ${partner.name}`,
    occasion: "Versatile",
    rationale: `Built around ${anchor.name} (${anchor.colorName}) as the anchor piece, balanced with ${partner.name} (${partner.colorName}).`,
    coordination: scheme.description,
    finishing: `Keep accessories understated to let the ${scheme.name.toLowerCase()} palette lead.`,
    tip: `Color rule: ${scheme.colorWheelExplanation}`,
    score: 9.4,
    scoreNote: `Color Harmony: ${scheme.name} (Calculated from color wheel degrees)`,
    items: itemsWithRole,
    saved: false,
    createdAt: Date.now(),
  };
}
