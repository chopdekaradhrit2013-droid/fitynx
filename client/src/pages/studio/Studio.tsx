import { Brand } from "@/components/site/Brand";
import { UserMenu } from "@/components/site/UserMenu";
import { AiStylistDrawer } from "@/components/site/AiStylistDrawer";
import { PullCordLamp } from "@/components/site/PullCordLamp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CalendarDays, Heart, Loader2, LogOut, Menu, Moon, Settings as SettingsIcon, Shirt, Sparkles, Sun, X } from "lucide-react";
import * as React from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
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
  const [stylistChatOpen, setStylistChatOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const ready = useStore(s => s.ready);
  const count = useStore(s => s.items.length);
  const persistError = useStore(s => s.persistError);
  const valid = NAV.some(n => n.key === section);

  React.useEffect(() => { setNavOpen(false); }, [section]);
  React.useEffect(() => { document.title = `${NAV.find(n => n.key === section)?.label ?? "Studio"} · FITYNX`; }, [section]);
  if (!valid) return <NotFound />;

  const today = new Intl.DateTimeFormat("en", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());

  const handleSignOut = async () => {
    await signOut();
    toast("Signed out successfully");
    setLocation("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Backdrop with smooth fade */}
      <div
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          navOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:w-[260px] lg:translate-x-0 lg:shadow-none",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <button
            className="rounded-full p-2 text-muted-foreground transition-all duration-200 active:scale-90 hover:bg-sidebar-accent hover:text-foreground lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="mt-8 space-y-1.5" aria-label="Studio">
          <p
            className={cn(
              "mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              navOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0 lg:translate-x-0 lg:opacity-100"
            )}
            style={{ transitionDelay: navOpen ? "30ms" : "0ms" }}
          >
            The studio
          </p>
          {NAV.map((n, idx) => (
            <Link
              key={n.key}
              href={n.href}
              aria-current={section === n.key ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                section === n.key
                  ? "bg-sidebar-accent font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                // Staggered slide in on mobile drawer open
                "transition-[transform,opacity,background-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                navOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0 lg:translate-x-0 lg:opacity-100"
              )}
              style={{
                transitionDelay: navOpen ? `${60 + idx * 35}ms` : "0ms",
              }}
            >
              <n.icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto space-y-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            navOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 lg:translate-y-0 lg:opacity-100"
          )}
          style={{
            transitionDelay: navOpen ? `${60 + NAV.length * 35 + 30}ms` : "0ms",
          }}
        >
          {/* User profile card */}
          {user && (
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 transition-colors hover:bg-sidebar-accent/60">
              <div className="flex items-center gap-2.5">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="size-8 rounded-full object-cover ring-1 ring-border" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#F26A4B] text-[11px] font-semibold text-white">
                    {initials}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
                  <p className="truncate font-mono text-[9px] text-muted-foreground">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out"
                  className="rounded-md p-1.5 text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-90"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-sidebar-border/60 pt-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wider">
                  Signed in
                </span>
                <span className="text-[10px] text-primary">Active</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3.5 transition-all duration-200">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Your closet</p>
            <p className="mt-1 font-serif text-2xl tracking-[-0.04em]">{count}<span className="ml-2 font-sans text-xs tracking-normal text-muted-foreground">{count === 1 ? "piece" : "pieces"}</span></p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Saved privately to your account.</p>
          </div>
          <Link href="/" className="block text-xs text-muted-foreground transition-colors hover:text-foreground active:scale-[0.98]">← Back to fitynx.com</Link>
        </div>
      </aside>

      <main className="lg:pl-[260px]">
        <header className="relative sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          {/* Artisanal hanging lamp pull-cord for light/dark mode */}
          <PullCordLamp className="absolute -top-1 right-24 sm:right-32" />
          <div className="flex items-center gap-3">
            <button
              className="rounded-full p-2 text-muted-foreground transition-all duration-200 active:scale-90 hover:bg-accent hover:text-foreground lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{today}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStylistChatOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs h-8 border-primary/40 hover:bg-primary/10"
            >
              <Sparkles className="size-3.5 text-[#F26A4B]" />
              <span className="hidden sm:inline">Ask Stylist</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <UserMenu compact />
          </div>
        </header>
        {persistError && <div role="alert" className="border-b border-destructive/30 bg-destructive/10 px-5 py-2 text-xs text-destructive md:px-8">Your browser is blocking local storage, so changes won’t be kept after you close this tab. Disable private browsing or allow site data to save your wardrobe.</div>}
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-12">
          {!ready ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div> :
            section === "wardrobe" ? <Wardrobe /> : section === "stylist" ? <StylistPage /> : section === "saved" ? <Saved /> : section === "calendar" ? <Plan /> : <Settings />}
        </div>
      </main>

      {/* Floating Ask Stylist Button */}
      <button
        type="button"
        onClick={() => setStylistChatOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2.5 text-xs font-medium text-foreground shadow-xl transition-all duration-200 hover:scale-105 hover:border-primary active:scale-95"
      >
        <Sparkles className="size-4 text-[#F26A4B] animate-pulse" />
        <span>Ask Stylist</span>
      </button>

      {/* AI Stylist Drawer */}
      <AiStylistDrawer open={stylistChatOpen} onClose={() => setStylistChatOpen(false)} />
    </div>
  );
}
