import { Brand } from "@/components/site/Brand";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CalendarDays, Heart, Loader2, Menu, Moon, Settings as SettingsIcon, Shirt, Sparkles, Sun, X } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "wouter";
import NotFound from "../NotFound";
import Plan from "./Plan";
import Saved from "./Saved";
import Settings from "./Settings";
import StylistPage from "./Stylist";
import Wardrobe from "./Wardrobe";

const NAV = [
  { key: "wardrobe", href: "/app", label: "Wardrobe", icon: Shirt },
  { key: "stylist", href: "/app/stylist", label: "Stylist", icon: Sparkles },
  { key: "saved", href: "/app/saved", label: "Saved looks", icon: Heart },
  { key: "calendar", href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { key: "settings", href: "/app/settings", label: "Settings", icon: SettingsIcon },
] as const;

export default function Studio() {
  const params = useParams() as { section?: string };
  const section = params.section ?? "wardrobe";
  const [navOpen, setNavOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const ready = useStore(s => s.ready);
  const count = useStore(s => s.items.length);
  const persistError = useStore(s => s.persistError);
  const valid = NAV.some(n => n.key === section);

  React.useEffect(() => { setNavOpen(false); }, [section]);
  React.useEffect(() => { document.title = `${NAV.find(n => n.key === section)?.label ?? "Studio"} · FITYNX`; }, [section]);
  if (!valid) return <NotFound />;

  const today = new Intl.DateTimeFormat("en", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());

  return (
    <div className="min-h-screen bg-background text-foreground">
      {navOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 transition-transform lg:translate-x-0", navOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between">
          <Brand />
          <button className="rounded-full p-2 text-muted-foreground lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close navigation"><X className="size-4" /></button>
        </div>
        <nav className="mt-10 space-y-1" aria-label="Studio">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">The studio</p>
          {NAV.map(n => (
            <Link key={n.key} href={n.href} aria-current={section === n.key ? "page" : undefined} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors", section === n.key ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")}>
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Your closet</p>
            <p className="mt-2 font-serif text-3xl tracking-[-0.04em]">{count}<span className="ml-2 font-sans text-xs tracking-normal text-muted-foreground">{count === 1 ? "piece" : "pieces"}</span></p>
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Stored privately on this device.</p>
          </div>
          <Link href="/" className="block text-xs text-muted-foreground hover:text-foreground">← Back to fitynx.com</Link>
        </div>
      </aside>

      <main className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 text-muted-foreground lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{today}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
        </header>
        {persistError && <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-5 py-2 text-xs text-destructive md:px-8">Your browser is blocking local storage, so changes won’t be kept after you close this tab. Disable private browsing or allow site data to save your wardrobe.</div>}
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-12">
          {!ready ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div> :
            section === "wardrobe" ? <Wardrobe /> : section === "stylist" ? <StylistPage /> : section === "saved" ? <Saved /> : section === "calendar" ? <Plan /> : <Settings />}
        </div>
      </main>
    </div>
  );
}
