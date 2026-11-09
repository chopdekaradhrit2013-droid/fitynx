import * as React from "react";
import { useStore, actions, uid } from "@/lib/store";
import { composeLooks } from "@/lib/stylist";
import { LookCard } from "@/components/site/LookCard";
import { Thumb } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { Scale, Check, Sparkles, Trophy, ArrowRight, RotateCw, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import type { Look, WardrobeItem } from "@/lib/types";

export function OutfitFaceOff() {
  const items = useStore(s => s.items);
  const storedLooks = useStore(s => s.looks);

  const [lookA, setLookA] = React.useState<Look | null>(null);
  const [lookB, setLookB] = React.useState<Look | null>(null);
  const [winner, setWinner] = React.useState<"A" | "B" | null>(null);
  const [comparing, setComparing] = React.useState(false);

  const generateContenders = React.useCallback(() => {
    if (items.length < 2) return;
    setComparing(true);
    setWinner(null);

    setTimeout(() => {
      // Compose Look A: Polished
      const resA = composeLooks(items, {
        occasion: "Everyday",
        vibe: "polished",
        weather: "mild",
        colors: "",
        note: "Face-off option A",
      });

      // Compose Look B: Relaxed or Expressive
      const resB = composeLooks(items, {
        occasion: "Everyday",
        vibe: "relaxed",
        weather: "mild",
        colors: "",
        note: "Face-off option B",
      });

      const a = resA.looks[0] || null;
      // Ensure Look B is different from Look A if possible
      const b = resB.looks.find(l => l.id !== a?.id) || resA.looks[1] || resB.looks[0] || null;

      if (a) actions.setLooks([a]);
      if (b) actions.setLooks([b]);

      setLookA(a);
      setLookB(b);
      setComparing(false);
    }, 400);
  }, [items]);

  React.useEffect(() => {
    if (!lookA && !lookB && items.length >= 2) {
      generateContenders();
    }
  }, [items.length, generateContenders, lookA, lookB]);

  const handleSelectWinner = (choice: "A" | "B") => {
    const chosenLook = choice === "A" ? lookA : lookB;
    if (!chosenLook) return;

    setWinner(choice);
    const today = new Date().toISOString().split("T")[0];
    actions.addPlan({
      id: uid(),
      lookId: chosenLook.id,
      date: today,
      note: `Chosen via Outfit Face-Off (Look ${choice})`,
    });
    toast.success(`Look ${choice} won! Scheduled on your calendar for today.`);
  };

  const getPieces = (look: Look | null): WardrobeItem[] => {
    if (!look) return [];
    return look.items
      .map(li => items.find(i => i.id === li.itemId))
      .filter((i): i is WardrobeItem => Boolean(i));
  };

  const piecesA = getPieces(lookA);
  const piecesB = getPieces(lookB);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#F26A4B]/10 text-[#F26A4B]">
                <Scale className="size-3.5" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">
                Outfit Face-Off
              </p>
            </div>
            <h3 className="font-serif text-3xl font-normal">Can't decide between two looks?</h3>
            <p className="text-sm text-muted-foreground">
              Put two distinct outfits head-to-head. Compare their balance, harmony, and pick your daily winner.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={generateContenders}
            disabled={comparing || items.length < 2}
            className="gap-2 shrink-0"
          >
            <RotateCw className={`size-3.5 ${comparing ? "animate-spin" : ""}`} />
            <span>Generate New Contenders</span>
          </Button>
        </div>
      </div>

      {/* Face-Off Arena */}
      {lookA && lookB ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contender A */}
          <div
            className={`relative rounded-2xl border p-6 transition-all ${
              winner === "A"
                ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500 shadow-md"
                : "border-border bg-card"
            }`}
          >
            {winner === "A" && (
              <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                <Trophy className="size-3" />
                <span>Today's Winner</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Look A · Polished Focus
              </span>
            </div>

            <h4 className="mt-2 font-serif text-2xl font-normal">{lookA.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{lookA.rationale}</p>

            {/* Pieces Thumbnails */}
            <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
              {piecesA.map(p => (
                <div key={p.id} className="relative shrink-0">
                  <Thumb item={p} className="size-16 border border-border" />
                  <span
                    className="absolute bottom-1 right-1 size-2.5 rounded-full border border-white"
                    style={{ backgroundColor: p.colorHex }}
                  />
                </div>
              ))}
            </div>

            {/* Score & Notes */}
            <div className="mt-4 rounded-xl bg-accent/30 p-3 text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Stylist Score</span>
                <span className="text-primary font-mono">{lookA.score}/10</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{lookA.scoreNote}</p>
            </div>

            {/* Vote Button */}
            <div className="mt-6">
              <Button
                onClick={() => handleSelectWinner("A")}
                className="w-full gap-2"
                variant={winner === "A" ? "default" : "outline"}
              >
                {winner === "A" ? <Check className="size-4" /> : <CalendarPlus className="size-4" />}
                <span>{winner === "A" ? "Locked for Today" : "Vote Look A & Wear Today"}</span>
              </Button>
            </div>
          </div>

          {/* Contender B */}
          <div
            className={`relative rounded-2xl border p-6 transition-all ${
              winner === "B"
                ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500 shadow-md"
                : "border-border bg-card"
            }`}
          >
            {winner === "B" && (
              <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                <Trophy className="size-3" />
                <span>Today's Winner</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Look B · Relaxed Rhythm
              </span>
            </div>

            <h4 className="mt-2 font-serif text-2xl font-normal">{lookB.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{lookB.rationale}</p>

            {/* Pieces Thumbnails */}
            <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
              {piecesB.map(p => (
                <div key={p.id} className="relative shrink-0">
                  <Thumb item={p} className="size-16 border border-border" />
                  <span
                    className="absolute bottom-1 right-1 size-2.5 rounded-full border border-white"
                    style={{ backgroundColor: p.colorHex }}
                  />
                </div>
              ))}
            </div>

            {/* Score & Notes */}
            <div className="mt-4 rounded-xl bg-accent/30 p-3 text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Stylist Score</span>
                <span className="text-primary font-mono">{lookB.score}/10</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{lookB.scoreNote}</p>
            </div>

            {/* Vote Button */}
            <div className="mt-6">
              <Button
                onClick={() => handleSelectWinner("B")}
                className="w-full gap-2"
                variant={winner === "B" ? "default" : "outline"}
              >
                {winner === "B" ? <Check className="size-4" /> : <CalendarPlus className="size-4" />}
                <span>{winner === "B" ? "Locked for Today" : "Vote Look B & Wear Today"}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Scale className="mx-auto size-10 text-muted-foreground/40" />
          <h4 className="mt-4 font-serif text-xl font-normal">Need more pieces for a face-off</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload at least a top and a bottom to your wardrobe to generate two contrasting looks.
          </p>
        </div>
      )}
    </div>
  );
}

