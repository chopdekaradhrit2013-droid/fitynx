"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat";

export interface RailGarment {
  id: string;
  name: string;
  category?: string;
  description?: string;
  kind?: GarmentKind;
  color?: string;
  trim?: string;
  image?: string;
  backImage?: string;
  sideImage?: string;
  tag?: string;
  details?: string[];
}

export interface ClothingRailHeroLabels {
  front: string;
  back: string;
  close: string;
  show: string;
}

export interface ClothingRailHeroProps extends React.ComponentProps<"section"> {
  items: RailGarment[];
  eyebrow?: string;
  heading?: string;
  caption?: string;
  action?: React.ReactNode;
  autoplay?: boolean;
  interval?: number;
  hanger?: "wood" | "matte" | "none";
  labels?: ClothingRailHeroLabels;
  onOpenChange?: (index: number | null) => void;
}

const DEFAULT_LABELS: ClothingRailHeroLabels = { front: "Front", back: "Back", close: "Close", show: "Show details" };

function GarmentFallback({ item, back }: { item: RailGarment; back?: boolean }) {
  const color = item.color || "#CFC8B8";
  const trim = item.trim || "#2E2E2E";
  const kind = item.kind || "tee";
  const long = kind === "coat" || kind === "jacket";
  const hood = kind === "hoodie";
  return (
    <svg viewBox="0 0 200 310" className="h-full w-full" role="img" aria-label={item.name}>
      <path d={long ? "M62 50 L24 78 38 116 54 106 48 288 Q100 300 152 288 L146 106 162 116 176 78 138 50 120 38 Q100 55 80 38Z" : "M72 42 L38 55 18 92 42 109 54 95 48 238 Q100 250 152 238 L146 95 158 109 182 92 162 55 128 42 Q100 58 72 42Z"} fill={color} stroke={trim} strokeWidth="2" />
      {hood && <path d="M72 44 Q100 10 128 44 Q119 62 100 63 Q81 62 72 44Z" fill={color} stroke={trim} strokeWidth="2" />}
      {!back && <path d={long ? "M100 66 L100 286 M70 100 L70 270 M130 100 L130 270" : "M100 64 L100 236 M68 110 L68 224 M132 110 L132 224"} stroke={trim} strokeOpacity=".38" strokeWidth="2" />}
      {kind === "shirt" && <><circle cx="100" cy="82" r="3" fill={trim} /><circle cx="100" cy="105" r="3" fill={trim} /><circle cx="100" cy="128" r="3" fill={trim} /></>}
    </svg>
  );
}

function GarmentVisual({ item, back, className }: { item: RailGarment; back?: boolean; className?: string }) {
  const source = back ? item.backImage || item.image : item.image;
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center", className)}>
      {source ? <img src={source} alt="" className="max-h-full max-w-full object-contain drop-shadow-[0_18px_18px_rgba(30,30,30,0.13)]" /> : <GarmentFallback item={item} back={back} />}
    </div>
  );
}

export default function ClothingRailHero({
  items,
  eyebrow = "Your wardrobe",
  heading = "A closet that moves with you.",
  caption = "Drag across the rail, then open a piece to see the details.",
  action,
  autoplay = false,
  interval = 2400,
  hanger = "matte",
  labels = DEFAULT_LABELS,
  onOpenChange,
  className,
  ...rest
}: ClothingRailHeroProps) {
  const [active, setActive] = React.useState(0);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [back, setBack] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!autoplay || reduced || openIndex !== null || items.length < 2) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % items.length), interval);
    return () => window.clearInterval(timer);
  }, [autoplay, interval, items.length, openIndex, reduced]);

  React.useEffect(() => {
    setBack(false);
  }, [active]);

  const select = (index: number) => {
    setActive(index);
    const child = scrollerRef.current?.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" });
  };

  const open = (index: number) => {
    setActive(index);
    setBack(false);
    setOpenIndex(index);
    onOpenChange?.(index);
  };

  const close = () => {
    setOpenIndex(null);
    onOpenChange?.(null);
  };

  const shift = (direction: number) => select((active + direction + items.length) % items.length);
  const current = items[active];

  return (
    <section className={cn("relative overflow-hidden", className)} {...rest}>
      <div className="flex items-end justify-between gap-6 px-1 pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-2 max-w-xl font-serif text-3xl leading-[1.05] tracking-[-0.04em] text-foreground md:text-5xl">{heading}</h2>
        </div>
        {action}
      </div>

      <div className="relative rounded-[1.15rem] border border-border bg-card px-3 pb-5 pt-6 shadow-[0_18px_45px_rgba(30,30,30,0.07)] md:px-8">
        <div className="pointer-events-none absolute left-8 right-8 top-10 h-px bg-primary/25 md:left-16 md:right-16" />
        <div ref={scrollerRef} className="closet-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-4">
          {items.map((item, index) => {
            const selected = index === active;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`${labels.show}: ${item.name}`}
                onClick={() => open(index)}
                onMouseEnter={() => select(index)}
                className={cn("group relative min-w-[150px] snap-center text-left outline-none transition-transform duration-300 md:min-w-[190px]", selected ? "-translate-y-2" : "translate-y-2 opacity-75 hover:translate-y-0 hover:opacity-100")}
              >
                <span className={cn("absolute left-1/2 top-0 z-10 h-5 w-px -translate-x-1/2 bg-primary/30", hanger === "none" && "hidden")} />
                <span className={cn("absolute left-1/2 top-4 z-10 h-2.5 w-7 -translate-x-1/2 rounded-full border border-primary/25", hanger === "none" && "hidden", hanger === "wood" ? "bg-[#9D795B]" : "bg-primary/30")} />
                <span className="relative mt-5 block aspect-[200/310] overflow-hidden rounded-lg border border-border bg-background/60 p-3 transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <GarmentVisual item={item} back={selected && back} />
                  {item.tag && <span className="absolute bottom-3 right-3 rounded-sm bg-card/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{item.tag}</span>}
                </span>
                <span className="mt-3 block truncate text-sm font-medium text-foreground">{item.name}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{item.category || "Wardrobe piece"}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-4">
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{current ? current.name : caption}</p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous garment" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><ChevronLeft className="size-4" /></button>
            <button type="button" onClick={() => shift(1)} aria-label="Next garment" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><ChevronRight className="size-4" /></button>
            <span className="ml-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">{items.length ? `${String(active + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}` : "00 / 00"}</span>
          </div>
        </div>
      </div>

      {openIndex !== null && current && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-6">
          <button aria-label={labels.close} type="button" onClick={close} className="absolute inset-0 bg-primary/30 backdrop-blur-[2px]" />
          <div role="dialog" aria-modal="true" aria-label={current.name} className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.25rem] border border-border bg-card shadow-2xl md:flex-row md:rounded-[1.25rem]">
            <div className="flex min-h-[360px] flex-1 items-center justify-center bg-background p-8 md:min-h-[620px]">
              <GarmentVisual item={current} back={back} className="max-h-[540px] max-w-[360px]" />
            </div>
            <div className="flex flex-1 flex-col justify-between border-t border-border p-6 md:border-l md:border-t-0 md:p-10">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Wardrobe item</p>
                    <h3 className="mt-3 font-serif text-3xl leading-none tracking-[-0.03em]">{current.name}</h3>
                  </div>
                  <button type="button" onClick={close} aria-label={labels.close} className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
                </div>
                <p className="mt-6 text-sm leading-7 text-muted-foreground">{current.description || "A considered piece in your private wardrobe."}</p>
                <div className="mt-6 flex flex-wrap gap-2">{(current.details || [current.kind || "garment", "AI catalogued"]).map(detail => <span key={detail} className="rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{detail}</span>)}</div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setBack(false)} className={cn("flex-1 rounded-md border px-3 py-2.5 text-sm transition-colors", !back ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}>{labels.front}</button>
                  <button type="button" onClick={() => setBack(true)} className={cn("flex-1 rounded-md border px-3 py-2.5 text-sm transition-colors", back ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}>{labels.back}</button>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{current.tag || "Private wardrobe"}</span><span className="inline-flex items-center gap-1.5"><Eye className="size-3.5" /> {back ? "Back view" : "Front view"}</span></div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
