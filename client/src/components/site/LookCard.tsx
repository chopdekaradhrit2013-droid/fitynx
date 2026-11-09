import { actions, useStore } from "@/lib/store";
import type { Look } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { Thumb } from "./studio-ui";

export function LookCard({ look, footer }: { look: Look; footer?: React.ReactNode }) {
  const items = useStore(s => s.items);
  const pieces = look.items.map(li => ({ ...li, item: items.find(i => i.id === li.itemId) }));
  const missing = pieces.filter(p => !p.item).length;
  return (
    <article className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-2xl tracking-[-0.03em] md:text-3xl">{look.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{look.rationale}</p>
        </div>
        <button onClick={() => actions.toggleSaved(look.id)} aria-pressed={look.saved} aria-label={look.saved ? "Remove from saved looks" : "Save look"} className={cn("shrink-0 rounded-full border p-2.5 transition-colors", look.saved ? "border-[#F26A4B] bg-[#F26A4B] text-white" : "border-border text-muted-foreground hover:text-foreground")}>
          <Heart className={cn("size-4", look.saved && "fill-current")} />
        </button>
      </div>
      <div className="mt-5 grid grid-flow-col auto-cols-[minmax(84px,1fr)] gap-3 overflow-x-auto pb-1">
        {pieces.map(p => p.item ? (
          <figure key={p.itemId} className="min-w-0">
            <Thumb item={p.item} className="aspect-[4/5] border border-border" />
            <figcaption className="mt-2"><span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{p.role}</span><span className="block truncate text-xs">{p.item.name}</span></figcaption>
          </figure>
        ) : null)}
      </div>
      {missing > 0 && <p className="mt-3 text-xs text-muted-foreground">{missing} {missing === 1 ? "piece" : "pieces"} in this look {missing === 1 ? "has" : "have"} since been removed from your wardrobe.</p>}
      <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
        <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em]">Colour &amp; fit</dt><dd className="mt-1.5 text-foreground/80">{look.coordination}</dd></div>
        <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em]">Finish</dt><dd className="mt-1.5 text-foreground/80">{look.finishing}</dd></div>
        <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em]">Styling note</dt><dd className="mt-1.5 text-foreground/80">{look.tip}</dd></div>
      </dl>
      <div className="mt-5 flex flex-col justify-between gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-center">
        <span><b className="text-foreground">{look.score.toFixed(1)}</b> / 10 · {look.scoreNote}</span>
        {footer}
      </div>
    </article>
  );
}
