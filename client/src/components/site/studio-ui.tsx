import { Link } from "wouter";
import * as React from "react";
import { ArrowUpRight, Shirt } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl leading-none tracking-[-0.06em] md:text-6xl">{title}</h1>
        {text && <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="mx-auto flex size-10 items-center justify-center text-primary">{icon}</div>
      <h2 className="mt-4 font-serif text-3xl tracking-[-0.04em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}

export function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">{children} <ArrowUpRight className="size-4" /></Link>;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const itemImage = (i: WardrobeItem) => i.cutout || i.image;

export function Thumb({ item, className }: { item: WardrobeItem; className?: string }) {
  const src = itemImage(item);
  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-lg bg-background", className)}>
      {src ? (
        <img src={src} alt={item.name} loading="lazy" className="h-full w-full object-contain p-1.5" />
      ) : (
        <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
          <Shirt className="size-4 opacity-50" />
          <span className="mt-1 text-[8px] uppercase tracking-wider">No photo</span>
        </div>
      )}
    </div>
  );
}
