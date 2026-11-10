import type { GarmentType } from "./types";

/** Simple flat-lay garment illustrations, used for the sample wardrobe. */
const SHAPES: Record<GarmentType, string> = {
  tee: `<path d="M72 42 L38 55 18 92 42 109 54 95 48 238 Q100 250 152 238 L146 95 158 109 182 92 162 55 128 42 Q100 58 72 42Z"/>`,
  shirt: `<path d="M72 42 L38 55 14 150 40 156 54 100 48 242 Q100 254 152 242 L146 100 160 156 186 150 162 55 128 42 L100 70Z"/><path d="M100 70 L100 244" class="d"/><circle cx="100" cy="100" r="2.5" class="f"/><circle cx="100" cy="132" r="2.5" class="f"/><circle cx="100" cy="164" r="2.5" class="f"/>`,
  knit: `<path d="M72 42 L36 58 12 170 44 178 54 112 48 244 Q100 256 152 244 L146 112 156 178 188 170 164 58 128 42 Q100 62 72 42Z"/><path d="M48 232 Q100 244 152 232 M16 160 L42 168 M158 168 L184 160" class="d"/>`,
  hoodie: `<path d="M72 46 L36 62 12 176 44 184 54 116 48 246 Q100 258 152 246 L146 116 156 184 188 176 164 62 128 46Z"/><path d="M72 46 Q100 6 128 46 Q118 70 100 72 Q82 70 72 46Z"/><path d="M84 118 L116 118 L112 160 L88 160Z" class="d"/>`,
  trousers: `<path d="M58 20 L142 20 L152 290 L108 290 L100 120 L92 290 L48 290Z"/><path d="M58 38 L142 38" class="d"/>`,
  jeans: `<path d="M58 20 L142 20 L154 290 L108 290 L100 120 L92 290 L46 290Z"/><path d="M58 38 L142 38 M100 38 L100 120" class="d"/><path d="M66 50 Q76 62 84 52" class="d"/>`,
  shorts: `<path d="M56 60 L144 60 L156 180 L110 180 L100 108 L90 180 L44 180Z"/><path d="M56 76 L144 76" class="d"/>`,
  skirt: `<path d="M64 60 L136 60 L170 250 Q100 266 30 250Z"/><path d="M64 76 L136 76" class="d"/>`,
  jacket: `<path d="M62 50 L24 78 38 116 54 106 48 288 Q100 300 152 288 L146 106 162 116 176 78 138 50 120 38 Q100 55 80 38Z"/><path d="M100 54 L100 290 M72 110 L88 128 M128 110 L112 128" class="d"/>`,
  leather_jacket: `<path d="M62 48 L22 76 36 114 54 104 46 288 Q100 300 154 288 L146 104 164 114 178 76 138 48 120 36 Q100 52 80 36Z"/><path d="M84 48 L114 136 L114 290 M68 96 L108 124 M132 96 L114 118" class="d"/><circle cx="72" cy="100" r="2" class="f"/><circle cx="128" cy="100" r="2" class="f"/>`,
  coat: `<path d="M62 46 L22 76 34 220 56 214 50 298 Q100 308 150 298 L144 214 166 220 178 76 138 46 120 34 Q100 52 80 34Z"/><path d="M100 52 L100 298" class="d"/><circle cx="88" cy="130" r="3" class="f"/><circle cx="88" cy="170" r="3" class="f"/><circle cx="88" cy="210" r="3" class="f"/>`,
  blazer: `<path d="M62 46 L24 76 36 214 56 208 50 280 Q100 292 150 280 L144 208 164 214 176 76 138 46 120 34 Q100 52 80 34Z"/><path d="M100 120 L72 40 M100 120 L128 40 M100 120 L100 280" class="d"/><circle cx="104" cy="176" r="3" class="f"/>`,
  dress: `<path d="M78 24 L68 70 L52 100 L30 280 Q100 296 170 280 L148 100 L132 70 L122 24 L110 40 Q100 48 90 40Z"/><path d="M52 100 Q100 112 148 100" class="d"/>`,
  sneakers: `<path d="M20 190 Q24 140 70 134 L100 150 Q130 150 150 168 Q180 172 184 196 L184 214 L20 214Z"/><path d="M20 206 L184 206" class="d"/><path d="M84 142 L96 158 M100 150 L110 164" class="d"/>`,
  boots: `<path d="M64 20 L118 20 L122 160 Q160 166 178 196 L178 226 L64 226Z"/><path d="M64 214 L178 214 M70 60 L116 60" class="d"/>`,
  loafers: `<path d="M18 170 Q30 140 74 140 L112 156 Q160 158 184 182 L184 204 L18 204Z"/><path d="M18 198 L184 198" class="d"/><path d="M80 152 Q110 156 120 170" class="d"/>`,
  bag: `<path d="M44 110 L156 110 L170 270 L30 270Z"/><path d="M72 110 Q72 56 100 56 Q128 56 128 110" fill="none" class="d"/><path d="M44 140 L156 140" class="d"/>`,
  scarf: `<path d="M50 40 Q100 20 150 40 L150 70 Q100 52 50 70Z"/><path d="M96 62 L128 62 L136 270 L102 270Z"/><path d="M104 270 L104 286 M112 270 L112 286 M120 270 L120 286 M128 270 L128 286" class="d"/>`,
  cap: `<path d="M40 150 Q44 70 100 66 Q156 70 160 150Z"/><path d="M30 150 Q100 134 176 156 Q170 170 100 164 Q50 166 30 150Z"/>`,
};

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

export function garmentDataUrl(type: GarmentType, color: string) {
  const stroke = shade(color, -0.35);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 310"><style>.g path:not(.d),.g circle:not(.f){fill:${color};stroke:${stroke};stroke-width:2;stroke-linejoin:round}.g .d{fill:none;stroke:${stroke};stroke-opacity:.55;stroke-width:2;stroke-linecap:round}.g .f{fill:${stroke}}</style><g class="g">${SHAPES[type]}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
