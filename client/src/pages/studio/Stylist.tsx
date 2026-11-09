import { LookCard } from "@/components/site/LookCard";
import { EmptyState, Field, LinkButton, PageHeader } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { actions, uid, useStore } from "@/lib/store";
import { composeLooks, OCCASIONS, VIBES, WEATHER, type Brief } from "@/lib/stylist";
import { api, getSavedGeminiKey } from "@/lib/api";
import type { Look } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CloudSun,
  Dices,
  Loader2,
  Palette,
  Scale,
  Shirt,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { WeatherDecider } from "@/components/tools/WeatherDecider";
import { ColorHarmonyMatcher } from "@/components/tools/ColorHarmonyMatcher";
import { OutfitRoulette } from "@/components/tools/OutfitRoulette";
import { OutfitFaceOff } from "@/components/tools/OutfitFaceOff";

type StylistTab = "brief" | "weather" | "harmony" | "roulette" | "faceoff";

const TOOLS = [
  { id: "brief" as StylistTab, label: "Stylist Studio", icon: Sparkles, desc: "Custom brief & Gemini AI" },
  { id: "weather" as StylistTab, label: "Weather Decider", icon: CloudSun, desc: "Live climate & layering" },
  { id: "harmony" as StylistTab, label: "Color Harmony", icon: Palette, desc: "Anchor piece matching" },
  { id: "roulette" as StylistTab, label: "Outfit Roulette", icon: Dices, desc: "10-second fast decision" },
  { id: "faceoff" as StylistTab, label: "Outfit Face-Off", icon: Scale, desc: "A vs B comparison" },
];

export default function StylistPage() {
  const items = useStore(s => s.items);
  const storedLooks = useStore(s => s.looks);
  const [activeTab, setActiveTab] = React.useState<StylistTab>("brief");
  const [brief, setBrief] = React.useState<Brief>({
    occasion: "Everyday",
    vibe: "polished",
    weather: "mild",
    colors: "",
    note: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | undefined>();
  const [currentIds, setCurrentIds] = React.useState<string[]>([]);
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) => setBrief(b => ({ ...b, [k]: v }));

  const current = currentIds.map(id => storedLooks.find(l => l.id === id)).filter((l): l is Look => !!l);

  const run = (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      const { looks, message } = composeLooks(items, brief);
      setMessage(message);
      if (looks.length) {
        actions.setLooks(looks);
        setCurrentIds(looks.map(l => l.id));
      } else {
        setCurrentIds([]);
      }
      setBusy(false);
    }, 450);
  };

  const runGemini = async () => {
    setBusy(true);
    try {
      const apiKey = getSavedGeminiKey() || undefined;
      const res = await api.ai.style(brief, items, apiKey);
      if (res?.look) {
        const gl = res.look;
        const validItemIds = (gl.itemIds || []).filter((id: string) => items.some(i => i.id === id));
        const newLook: Look = {
          id: uid(),
          title: gl.title || `${brief.vibe} ${brief.occasion}`,
          occasion: brief.occasion,
          rationale: gl.rationale || "Balanced proportion and tone.",
          coordination: gl.coordination || "Tonal and complementary balance.",
          finishing: gl.finishing || "",
          tip: gl.tip || "",
          score: typeof gl.score === "number" ? gl.score : 96,
          scoreNote: gl.scoreNote || "Gemini AI recommended",
          items: validItemIds.map((id: string) => ({ itemId: id, role: "piece" })),
          saved: false,
          createdAt: Date.now(),
        };
        actions.setLooks([newLook, ...storedLooks]);
        setCurrentIds([newLook.id]);
        setMessage(`Gemini curated: "${newLook.title}"`);
        toast.success("Gemini composed your look!");
      }
    } catch (err) {
      toast.info(err instanceof Error ? err.message : "Falling back to instant local styling.");
      run();
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-10">
        <PageHeader eyebrow="The stylist" title="Ask for a feeling." />
        <EmptyState
          icon={<Shirt className="size-7" />}
          title="No clothes uploaded yet"
          text="Your wardrobe is empty. The stylist only builds outfits from photos of clothes you have uploaded. Upload your pieces in the Wardrobe to start composing looks."
          action={<LinkButton href="/app">Upload clothes to wardrobe</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The stylist & decision suite"
        title="Decide what to wear."
        text="A suite of free intelligent tools to help you pick the right outfit every day—by live weather, color theory harmony, roulette, or custom brief."
      />

      {/* Free Tools Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3 scrollbar-none">
        {TOOLS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "group flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-primary-foreground" : "text-[#F26A4B]")} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Brief & Gemini Studio */}
      {activeTab === "brief" && (
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={run} className="h-fit rounded-2xl border border-border bg-card p-5 md:p-7">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Brief your stylist
              </p>
              <Sparkles className="size-4 text-[#F26A4B]" />
            </div>
            <div className="mt-6 space-y-5">
              <Field label="Occasion">
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map(o => (
                    <button
                      type="button"
                      key={o}
                      aria-pressed={brief.occasion === o}
                      onClick={() => set("occasion", o)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        brief.occasion === o
                          ? "border-primary bg-primary text-primary-foreground font-medium"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Feeling">
                <div className="grid grid-cols-2 gap-2">
                  {VIBES.map(v => (
                    <button
                      type="button"
                      key={v.value}
                      aria-pressed={brief.vibe === v.value}
                      onClick={() => set("vibe", v.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm transition-colors",
                        brief.vibe === v.value
                          ? "border-primary bg-primary text-primary-foreground font-medium"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Weather">
                <div className="flex flex-wrap gap-2">
                  {WEATHER.map(w => (
                    <button
                      type="button"
                      key={w.value}
                      aria-pressed={brief.weather === w.value}
                      onClick={() => set("weather", w.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        brief.weather === w.value
                          ? "border-primary bg-primary text-primary-foreground font-medium"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Colours you’d like to wear" hint="Optional — e.g. “navy, olive”">
                <input
                  className="studio-input"
                  value={brief.colors}
                  onChange={e => set("colors", e.target.value)}
                  maxLength={80}
                />
              </Field>
            </div>
            <div className="mt-7 flex flex-col gap-2.5">
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Composing…
                  </>
                ) : (
                  <>
                    <WandSparkles className="size-4" /> Instant Compose
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={runGemini}
                disabled={busy}
                className="w-full text-xs"
              >
                <Sparkles className="size-3.5 text-[#F26A4B]" /> Consult Gemini AI Stylist
              </Button>
            </div>
          </form>

          <div className="min-h-[420px]">
            {current.length === 0 ? (
              <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                    Your next look
                  </p>
                  <h2 className="mt-5 max-w-md font-serif text-4xl leading-tight tracking-[-0.05em] md:text-5xl">
                    Tell me where the day is taking you.
                  </h2>
                  <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/70">
                    {message ??
                      "FITYNX will look across your pieces and explain why each combination works."}
                  </p>
                </div>
                <div className="border-t border-primary-foreground/20 pt-5 text-[10px] uppercase tracking-[0.16em] text-primary-foreground/60">
                  Up to 3 complete looks · {items.length} pieces available
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Composed for “{brief.occasion}”
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {current.length} {current.length === 1 ? "look" : "looks"}
                  </span>
                </div>
                {current.map(l => (
                  <LookCard key={l.id} look={l} />
                ))}
                {message && <p className="text-xs leading-5 text-muted-foreground">{message}</p>}
                <Button variant="outline" onClick={() => run()} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />} Shuffle
                  new looks
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Weather Decider */}
      {activeTab === "weather" && <WeatherDecider />}

      {/* Tab 3: Color Harmony Matcher */}
      {activeTab === "harmony" && <ColorHarmonyMatcher />}

      {/* Tab 4: Outfit Roulette */}
      {activeTab === "roulette" && <OutfitRoulette />}

      {/* Tab 5: Outfit Face-Off */}
      {activeTab === "faceoff" && <OutfitFaceOff />}
    </div>
  );
}
