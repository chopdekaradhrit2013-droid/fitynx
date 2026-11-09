import { PageHeader } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { actions, useStore } from "@/lib/store";
import { Download, KeyRound, LogOut, Moon, ShieldCheck, Sun, Trash2, UserCheck } from "lucide-react";
import React, { useState } from "react";
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
  const { user, signOut, googleClientId, setGoogleClientId } = useAuth();
  const [, setLocation] = useLocation();

  const items = useStore(s => s.items);
  const looks = useStore(s => s.looks);
  const plan = useStore(s => s.plan);

  const [clientIdInput, setClientIdInput] = useState(googleClientId || "");

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

  const handleSaveGoogleClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(clientIdInput.trim());
    toast.success("Google Client ID updated");
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="The studio"
        title="Settings."
        text="Manage your account, Google OAuth configuration, data export and storage controls."
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
                    {user.provider === "google" ? "Google OAuth" : "Email Account"}
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

        {/* Google OAuth Configuration */}
        <Card label="Integrations" title="Google OAuth">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sign in with Google uses standard Google Identity Services. If you have your own Google Cloud Client ID, you can configure it below or via <code className="font-mono text-primary">VITE_GOOGLE_CLIENT_ID</code>.
          </p>
          <form onSubmit={handleSaveGoogleClientId} className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={e => setClientIdInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="outline">
                <KeyRound className="size-3.5" /> Save Client ID
              </Button>
              {googleClientId && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setClientIdInput("");
                    setGoogleClientId("");
                    toast("Google Client ID cleared");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Privacy */}
        <Card label="Privacy" title="Private on-device storage">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Photos, wardrobe details, and saved looks are linked to your personal account and stored in your browser’s local IndexedDB. No images are uploaded to remote servers.
          </p>
          <p className="mt-3">
            Clearing site data or switching browser will remove local data — use export to keep a backup.
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
