import { EmptyState, Field, LinkButton, PageHeader, Thumb } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { actions, uid, useStore } from "@/lib/store";
import { CalendarDays, Plus, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmt = (iso: string) => new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "long" }).format(new Date(iso + "T12:00:00"));

export default function Plan() {
  const allLooks = useStore(s => s.looks);
  const savedLooks = allLooks.filter(l => l.saved);
  const recentLooks = allLooks.filter(l => !l.saved).slice(0, 8);
  const plan = useStore(s => s.plan);
  const items = useStore(s => s.items);
  const [date, setDate] = React.useState(today());
  const [lookId, setLookId] = React.useState("");
  const t = today();
  const upcoming = plan.filter(p => p.date >= t);
  const past = plan.filter(p => p.date < t).reverse();

  const add = () => {
    if (!lookId) return;
    actions.addPlan({ id: uid(), lookId, date, note: "" });
    const look = allLooks.find(l => l.id === lookId);
    if (look) {
      actions.logItemsWorn(look.items.map(i => i.itemId));
    }
    toast.success(`Scheduled for ${fmt(date)} · wear logged!`);
  };

  const row = (p: (typeof plan)[number], muted?: boolean) => {
    const look = allLooks.find(l => l.id === p.lookId);
    const pieces = (look?.items ?? []).map(li => items.find(i => i.id === li.itemId)).filter(Boolean).slice(0, 4);
    return (
      <li key={p.id} className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm ${muted ? "opacity-60" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{fmt(p.date)}</p>
          <p className="mt-1.5 truncate font-serif text-xl tracking-[-0.02em]">{look?.title ?? "Look no longer available"}</p>
        </div>
        <div className="hidden gap-1.5 sm:flex">{pieces.map(i => i && <Thumb key={i.id} item={i} className="size-12 border border-border" />)}</div>
        <button
          onClick={() => actions.removePlan(p.id)}
          aria-label="Remove from calendar"
          className="rounded-full p-2 text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-90"
        >
          <X className="size-4" />
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="The rhythm" title="Outfit calendar." text="Decide tomorrow’s outfit tonight. Assign a saved look to any day." />
      {allLooks.length === 0 && plan.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-7" />}
          title={items.length === 0 ? "No clothes uploaded yet" : "Your calendar is clear."}
          text={
            items.length === 0
              ? "You haven’t uploaded any clothes yet. Upload photos of your wardrobe pieces to begin composing and scheduling your daily outfits."
              : "Decide or save a look in the Stylist first, then schedule it for any day."
          }
          action={
            items.length === 0 ? (
              <LinkButton href="/app">Upload clothes to wardrobe</LinkButton>
            ) : (
              <LinkButton href="/app/stylist">Open the stylist</LinkButton>
            )
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div className="h-fit rounded-2xl border border-border bg-card p-5 md:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Plan a look</p>
            <div className="mt-6 space-y-5">
              <Field label="Date"><input type="date" className="studio-input" value={date} min={t} onChange={e => setDate(e.target.value)} /></Field>
              <Field label="Outfit to wear">
                <select className="studio-input" value={lookId} onChange={e => setLookId(e.target.value)}>
                  <option value="">Choose an outfit…</option>
                  {savedLooks.length > 0 && (
                    <optgroup label="Saved Outfits">
                      {savedLooks.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title} — {l.occasion}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {recentLooks.length > 0 && (
                    <optgroup label="Recent Stylist & Roulette Looks">
                      {recentLooks.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title} — {l.occasion}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </Field>
              <Button className="w-full" disabled={!lookId || !date} onClick={add}><Plus className="size-4" /> Add to calendar</Button>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Upcoming</p>
              {upcoming.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">No upcoming outfits planned.</p> : <ul className="mt-4 space-y-2.5">{upcoming.map(p => row(p))}</ul>}
            </div>
            {past.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Past outfits</p>
                <ul className="mt-4 space-y-2.5">{past.map(p => row(p, true))}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
