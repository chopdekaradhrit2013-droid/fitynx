import { PageHeader } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { actions, useStore } from "@/lib/store";
import { Download, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";

function Card({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-5 md:p-7"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p><h2 className="mt-4 font-serif text-2xl tracking-[-0.03em]">{title}</h2><div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div></section>;
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const items = useStore(s => s.items);
  const looks = useStore(s => s.looks);
  const plan = useStore(s => s.plan);
  const samples = items.filter(i => i.sample).length;

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), items, looks, plan }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fitynx-wardrobe.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="The studio" title="Settings." text="How FITYNX stores your data, and the controls to keep, export or erase it." />
      <div className="grid gap-5 md:grid-cols-2">
        <Card label="Privacy" title="Everything stays on this device">
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Photos, wardrobe details and saved looks are kept in your browser’s local storage. FITYNX has no account system and no server that receives your images.</p>
          <p className="mt-3">Clearing site data or switching browser will remove your wardrobe — use export to keep a copy.</p>
        </Card>
        <Card label="Your data" title={`${items.length} pieces · ${looks.filter(l => l.saved).length} saved looks · ${plan.length} planned`}>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportData} disabled={!items.length}><Download className="size-4" /> Export JSON</Button>
            {samples > 0 && <Button variant="outline" onClick={() => { actions.clearSamples(); toast("Sample pieces removed"); }}>Remove {samples} sample pieces</Button>}
          </div>
        </Card>
        <Card label="Appearance" title="Theme">
          <Button variant="outline" onClick={toggleTheme}>{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} Switch to {theme === "dark" ? "light" : "dark"}</Button>
        </Card>
        <Card label="Danger zone" title="Erase everything">
          <p>Permanently deletes your wardrobe, looks and calendar from this browser.</p>
          <Button variant="outline" className="mt-4 text-destructive hover:text-destructive" onClick={async () => { if (window.confirm("Erase your entire wardrobe, saved looks and calendar? This cannot be undone.")) { await actions.wipe(); toast("All data erased"); } }}><Trash2 className="size-4" /> Erase all data</Button>
        </Card>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">How the stylist works: looks are composed on-device by a rules-based engine that scores colour harmony, occasion formality and weather suitability across the pieces you own. Garment colour is read from your photo; background removal works best on a plain backdrop.</p>
    </div>
  );
}
