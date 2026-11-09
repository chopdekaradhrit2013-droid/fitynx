import * as React from "react";
import { useStore, actions } from "@/lib/store";
import { getHarmoniesForAnchor, composeAnchorLook, type HarmonyScheme, type HarmonyMode } from "@/lib/harmony";
import { Thumb } from "@/components/site/studio-ui";
import { LookCard } from "@/components/site/LookCard";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles, Layers, ArrowRight, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { WardrobeItem, Look } from "@/lib/types";

export function ColorHarmonyMatcher() {
  const items = useStore(s => s.items);

  const [anchorId, setAnchorId] = React.useState<string>(items[0]?.id || "");
  const [activeMode, setActiveMode] = React.useState<HarmonyMode>("complementary");
  const [composedLook, setComposedLook] = React.useState<Look | null>(null);

  const anchor = items.find(i => i.id === anchorId) || items[0];

  const schemes: HarmonyScheme[] = React.useMemo(() => {
    if (!anchor) return [];
    return getHarmoniesForAnchor(anchor, items);
  }, [anchor, items]);

  const currentScheme = schemes.find(s => s.id === activeMode) || schemes[0];

  const handlePairSelect = (partner: WardrobeItem) => {
    if (!anchor || !currentScheme) return;
    const look = composeAnchorLook(anchor, partner, currentScheme, items);
    actions.setLooks([look]);
    setComposedLook(look);
    toast.success(`Composed: ${look.title}`);
  };

  if (items.length < 2) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Palette className="mx-auto size-10 text-muted-foreground/60" />
        <h3 className="mt-4 font-serif text-2xl font-normal">Add more clothes to match harmonies</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Color theory matching requires at least 2 garments in your wardrobe to compute harmonic relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Anchor Selector Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">
              Step 1 · Choose Your Anchor Piece
            </p>
            <h3 className="font-serif text-3xl font-normal">What piece do you want to wear today?</h3>
            <p className="text-sm text-muted-foreground">
              Pick the hero piece. Our color theory engine will scan your closet and find harmonic partners.
            </p>
          </div>

          {/* Anchor Display Pill */}
          {anchor && (
            <div className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-accent/30 p-3">
              <Thumb item={anchor} className="size-14 border border-border" />
              <div>
                <p className="font-medium text-sm">{anchor.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="inline-block size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: anchor.colorHex }}
                  />
                  <span>{anchor.colorName}</span>
                  <span>·</span>
                  <span className="capitalize">{anchor.type}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anchor Quick Horizontal Carousel */}
        <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {items.map(item => {
            const isSelected = item.id === anchor?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAnchorId(item.id);
                  setComposedLook(null);
                }}
                className={`group flex shrink-0 items-center gap-2.5 rounded-xl border p-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <Thumb item={item} className="size-10 border border-border/60" />
                <div className="text-left pr-2">
                  <p className="max-w-[110px] truncate text-xs font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.colorName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Harmony Theory Tabs */}
      {anchor && currentScheme && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">
              Step 2 · Select Color Theory Harmony Mode
            </p>
            <div className="flex flex-wrap gap-2">
              {schemes.map(sch => {
                const isActive = sch.id === activeMode;
                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => {
                      setActiveMode(sch.id);
                      setComposedLook(null);
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>{sch.name}</span>
                    <span className="ml-2 opacity-75 font-mono text-[10px]">({sch.matches.length})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Harmony Explanation Box */}
          <div className="rounded-xl border border-border/80 bg-accent/20 p-5">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-[#F26A4B]" />
              <h4 className="font-serif text-lg font-medium">{currentScheme.name}</h4>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {currentScheme.tagline}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{currentScheme.description}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/80 italic">{currentScheme.colorWheelExplanation}</p>
          </div>

          {/* Matching Closet Items Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Matching Pieces in Your Wardrobe ({currentScheme.matches.length})
              </p>
              <span className="text-xs text-muted-foreground">Click any piece to assemble an outfit</span>
            </div>

            {currentScheme.matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No direct {currentScheme.name.toLowerCase()} matches found for {anchor.colorName} in your current wardrobe pieces.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Try switching to <strong>Neutral Grounding</strong> or <strong>Monochromatic</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {currentScheme.matches.map(partner => (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => handlePairSelect(partner)}
                    className="group relative flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center transition-all hover:border-primary hover:shadow-md"
                  >
                    <Thumb item={partner} className="size-20 border border-border group-hover:scale-105 transition-transform" />
                    <p className="mt-2.5 max-w-full truncate text-xs font-medium">{partner.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span
                        className="size-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: partner.colorHex }}
                      />
                      <span>{partner.colorName}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Assemble Look</span>
                      <ArrowRight className="size-2.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composed Outfit Preview */}
          {composedLook && (
            <div className="mt-8 space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="size-4 text-[#F26A4B]" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">
                    Harmonized Complete Outfit
                  </p>
                </div>
              </div>
              <LookCard look={composedLook} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
