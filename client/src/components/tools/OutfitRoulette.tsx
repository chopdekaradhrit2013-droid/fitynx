import * as React from "react";
import { useStore, actions, uid } from "@/lib/store";
import { spinOutfitRoulette, type RouletteFilters } from "@/lib/roulette";
import { LookCard } from "@/components/site/LookCard";
import { Button } from "@/components/ui/button";
import { Dices, Sparkles, CalendarPlus, Check, RotateCw } from "lucide-react";
import { toast } from "sonner";
import type { Look } from "@/lib/types";

const OCCASIONS = ["Everyday", "Office", "Date night", "Weekend", "Dinner out", "Travel"];
const VIBES = [
  { value: "polished", label: "Polished" },
  { value: "relaxed", label: "Relaxed" },
  { value: "minimal", label: "Minimal" },
  { value: "expressive", label: "Expressive" },
] as const;

export function OutfitRoulette() {
  const items = useStore(s => s.items);

  const [filters, setFilters] = React.useState<RouletteFilters>({
    occasion: "Everyday",
    vibe: "polished",
    includeOuterwear: false,
  });

  const [spinning, setSpinning] = React.useState(false);
  const [currentLook, setCurrentLook] = React.useState<Look | null>(null);
  const [scheduled, setScheduled] = React.useState(false);

  const handleSpin = () => {
    setSpinning(true);
    setScheduled(false);

    // Dynamic slot reel delay
    setTimeout(() => {
      const result = spinOutfitRoulette(items, filters);
      if (result.look) {
        actions.setLooks([result.look]);
        setCurrentLook(result.look);
        toast.success(`Roulette decided: "${result.look.title}"`);
      } else {
        toast.error(result.error || "Could not assemble an outfit.");
      }
      setSpinning(false);
    }, 550);
  };

  const handleWearToday = () => {
    if (!currentLook) return;
    const today = new Date().toISOString().split("T")[0];
    actions.addPlan({
      id: uid(),
      lookId: currentLook.id,
      date: today,
      note: `Decided via Outfit Roulette (${filters.occasion})`,
    });
    setScheduled(true);
    toast.success("Scheduled on your Outfit Calendar for today!");
  };

  return (
    <div className="space-y-8">
      {/* Decider Control Board */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-accent/10 p-6 md:p-8">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#F26A4B]/10 text-[#F26A4B]">
              <Dices className="size-3.5" />
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">
              Quick Decider Roulette
            </p>
          </div>
          <h3 className="font-serif text-3xl font-normal md:text-4xl">Decide my outfit in 10 seconds.</h3>
          <p className="text-sm text-muted-foreground">
            Eliminate morning choice fatigue. Pick your destination and let our fashion algorithm assemble a foolproof high-scoring look.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Where are you headed?</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OCCASIONS.map(occ => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, occasion: occ }))}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    filters.occasion === occ
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Desired Vibe</label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {VIBES.map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setFilters(f => ({ ...f, vibe: v.value }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    filters.vibe === v.value
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={spinning || items.length === 0}
            className="w-full gap-2 sm:w-auto text-sm font-medium"
          >
            <Dices className={`size-4 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "Spinning Closet Pieces..." : "Spin Outfit Roulette"}
          </Button>

          {currentLook && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleWearToday}
              disabled={scheduled}
              className="gap-2"
            >
              {scheduled ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span>Locked for Today</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="size-4 text-[#F26A4B]" />
                  <span>Wear This Today (Add to Calendar)</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Result Display */}
      {currentLook ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Roulette Selected Outcome
            </p>
            <button
              onClick={handleSpin}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="size-3" />
              <span>Spin Again</span>
            </button>
          </div>
          <LookCard look={currentLook} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Dices className="mx-auto size-10 text-muted-foreground/40" />
          <h4 className="mt-4 font-serif text-xl font-normal">Ready to spin?</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Click the spin button above and get a complete, balanced look without endless scrolling.
          </p>
        </div>
      )}
    </div>
  );
}

