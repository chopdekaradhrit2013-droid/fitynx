import { PageHeader } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { actions, useStore } from "@/lib/store";
import { api, getSavedGeminiKey, saveGeminiKey } from "@/lib/api";
import { Check, Download, Eye, EyeOff, Key, LogOut, Moon, ShieldCheck, Sparkles, Sun, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function Card({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <h2 className="mt-4 font-serif text-2xl tracking-[-0.03em]">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  const [geminiKey, setGeminiKey] = useState(getSavedGeminiKey() || "");
  const [showKey, setShowKey] = useState(false);
  const [serverAiStatus, setServerAiStatus] = useState<string>("Checking...");
  const [serverActive, setServerActive] = useState(false);

  useEffect(() => {
    api.ai.status()
      .then(res => {
        setServerActive(res.active);
        setServerAiStatus(res.active ? "Gemini 2.0 Flash Connected (Server)" : "No server key detected");
      })
      .catch(() => {
        setServerAiStatus("Offline / Local mode active");
      });
  }, []);

  const items = useStore(s => s.items);
  const looks = useStore(s => s.looks);
  const plan = useStore(s => s.plan);

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), user: user?.email, items, looks, plan }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitynx-${user?.name?.toLowerCase().replace(/\s+/g, "-") || "wardrobe"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await signOut();
    toast("Signed out successfully");
    setLocation("/");
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="The studio"
        title="Settings."
        text="Manage your account, data export and local storage controls."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Account Details */}
        <Card label="Account" title={user ? user.name : "Your Account"}>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="size-12 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#F26A4B] text-base font-medium text-white">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Member Account
                  </span>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-destructive hover:text-destructive">
                  <LogOut className="size-4" /> Sign out
                </Button>
              </div>
            </div>
          ) : (
            <p>Not signed in.</p>
          )}
        </Card>

        {/* Google Gemini AI */}
        <Card label="Intelligence" title="Google Gemini AI">
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Sparkles className="size-4 text-[#F26A4B]" />
              {serverActive || geminiKey ? "Gemini 2.0 Flash Active" : "Local Rules-Based AI Active"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your Gemini API key to enable visual garment fabric detection, automated styling descriptions, and Google Lens queries.
            </p>
            <div className="relative mt-2">
              <Key className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type={showKey ? "text" : "password"}
                placeholder="AIzaSy... (Gemini API Key)"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-20 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-[11px]"
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  saveGeminiKey(geminiKey);
                  toast.success(geminiKey ? "Saved Gemini API key!" : "Cleared Gemini API key");
                }}
              >
                Save key
              </Button>
              {geminiKey && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setGeminiKey("");
                    saveGeminiKey(null);
                    toast("Cleared key");
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card label="Privacy" title="Private on-device & personal storage">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Photos, wardrobe details, and saved looks are linked to your personal account and stored securely. Your closet remains strictly yours.
          </p>
          <p className="mt-3">
            Use export at any time to keep a local JSON backup of your pieces, looks, and calendar.
          </p>
        </Card>

        {/* Your Data */}
        <Card label="Your data" title={`${items.length} pieces · ${looks.filter(l => l.saved).length} saved looks · ${plan.length} planned`}>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportData} disabled={!items.length}>
              <Download className="size-4" /> Export JSON
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card label="Appearance" title="Theme">
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} Switch to {theme === "dark" ? "light" : "dark"}
          </Button>
        </Card>

        {/* Danger zone */}
        <Card label="Danger zone" title="Erase everything">
          <p>Permanently deletes your wardrobe, looks, and calendar for this account.</p>
          <Button
            variant="outline"
            className="mt-4 text-destructive hover:text-destructive"
            onClick={async () => {
              if (window.confirm("Erase your entire wardrobe, saved looks, and calendar? This cannot be undone.")) {
                await actions.wipe();
                toast("All data erased");
              }
            }}
          >
            <Trash2 className="size-4" /> Erase all data
          </Button>
        </Card>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        How the stylist works: looks are composed on-device by a rules-based engine that scores colour harmony, occasion formality and weather suitability across the pieces you own. Garment colour is read from your photo; background removal works best on a plain backdrop.
      </p>
    </div>
  );
}
