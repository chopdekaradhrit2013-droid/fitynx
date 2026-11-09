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
  const looks = allLooks.filter(l => l.saved);
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
    toast.success(`Planned for ${fmt(date)}`);
  };

  const row = (p: (typeof plan)[number], muted?: boolean) => {
    const look = allLooks.find(l => l.id === p.lookId);
    const pieces = (look?.items ?? []).map(li => items.find(i => i.id === li.itemId)).filter(Boolean).slice(0, 4);
    return (
      <li key={p.id} className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 ${muted ? "opacity-60" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{fmt(p.date)}</p>
          <p className="mt-1.5 truncate font-serif text-xl tracking-[-0.02em]">{look?.title ?? "Look no longer available"}</p>
        </div>
        <div className="hidden gap-1.5 sm:flex">{pieces.map(i => i && <Thumb key={i.id} item={i} className="size-12 border border-border" />)}</div>
        <button onClick={() => actions.removePlan(p.id)} aria-label="Remove from calendar" className="rounded-full p-2 text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="The rhythm" title="Outfit calendar." text="Decide tomorrow’s outfit tonight. Assign a saved look to any day." />
      {looks.length === 0 && plan.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-7" />} title="Your calendar is clear." text="Save a look first, then place it on a day that deserves a little more intention." action={<LinkButton href="/app/stylist">Open the stylist</LinkButton>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
          <div className="h-fit rounded-2xl border border-border bg-card p-5 md:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Plan a look</p>
            <div className="mt-6 space-y-5">
              <Field label="Date"><input type="date" className="studio-input" value={date} min={t} onChange={e => setDate(e.target.value)} /></Field>
              <Field label="Saved look">
                <select className="studio-input" value={lookId} onChange={e => setLookId(e.target.value)}>
                  <option value="">Choose a look…</option>
                  {looks.map(l => <option key={l.id} value={l.id}>{l.title} — {l.occasion}</option>)}
                </select>
              </Field>
              <Button className="w-full" disabled={!lookId || !date} onClick={add}><Plus className="size-4" /> Add to calendar</Button>
            </div>
          </div>
          <div className="space-y-8">
            <section><h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Upcoming</h2>{upcoming.length ? <ul className="space-y-3">{upcoming.map(p => row(p))}</ul> : <p className="text-sm text-muted-foreground">Nothing planned yet.</p>}</section>
            {past.length > 0 && <section><h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Earlier</h2><ul className="space-y-3">{past.slice(0, 8).map(p => row(p, true))}</ul></section>}
          </div>
        </div>
      )}
    </div>
  );
}
