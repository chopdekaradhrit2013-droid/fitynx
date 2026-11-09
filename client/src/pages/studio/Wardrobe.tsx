import { Modal } from "@/components/site/Modal";
import { EmptyState, Field, PageHeader, Thumb, itemImage } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import ClothingRailHero, { type GarmentKind, type RailGarment } from "@/components/ui/product-rail-gallery";
import { nameColor } from "@/lib/color";
import { buildSampleWardrobe } from "@/lib/sample";
import { actions, uid, useStore } from "@/lib/store";
import { analyzeFile, defaultName, type Analysis } from "@/lib/imaging";
import { GARMENT_TYPES, GROUP_LABELS, type GarmentType, type Group, type WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Loader2, Plus, Scissors, Search, Shirt, Trash2, Upload, WandSparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const GROUPS = Object.keys(GROUP_LABELS) as Group[];
const RAIL_KIND: Partial<Record<GarmentType, GarmentKind>> = { tee: "tee", shirt: "shirt", knit: "knit", hoodie: "hoodie", jacket: "jacket", coat: "coat", blazer: "jacket" };

interface Draft extends Analysis { key: string; name: string; fileName: string }

export default function Wardrobe() {
  const items = useStore(s => s.items);
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<Group | "all">("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WardrobeItem | null>(null);
  const hasSamples = items.some(i => i.sample);

  const filtered = items.filter(i => {
    const g = GARMENT_TYPES[i.type].group;
    if (group !== "all" && g !== group) return false;
    return `${i.name} ${i.colorName} ${GARMENT_TYPES[i.type].label}`.toLowerCase().includes(query.trim().toLowerCase());
  });

  const rail: RailGarment[] = items.slice(0, 16).map(i => ({
    id: i.id, name: i.name, category: GARMENT_TYPES[i.type].label, kind: RAIL_KIND[i.type] ?? "tee", color: i.colorHex,
    image: itemImage(i), tag: i.colorName, description: i.notes || `${i.colorName} ${GARMENT_TYPES[i.type].label.toLowerCase()} from your wardrobe.`,
    details: [GARMENT_TYPES[i.type].label, i.colorName, GROUP_LABELS[GARMENT_TYPES[i.type].group]],
  }));

  const loadSamples = () => { actions.addItems(buildSampleWardrobe()); toast.success("Sample wardrobe added", { description: "14 illustrated pieces to explore. Remove them any time in Settings." }); };

  return (
    <div className="space-y-14">
      <PageHeader eyebrow="Your collection" title="Wardrobe." text="Everything you own, catalogued on this device. Add a photo and FITYNX reads the colour, lifts the garment off its background, and gets it ready to style."
        action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add pieces</Button>} />

      {items.length === 0 ? (
        <EmptyState icon={<Shirt className="size-7" />} title="Start with one favourite piece." text="Upload a photo of something you wear often — a flat-lay on a plain surface works best. Or explore the studio first with a sample wardrobe."
          action={<><Button onClick={() => setAddOpen(true)}><Upload className="size-4" /> Upload clothing</Button><Button variant="outline" onClick={loadSamples}>Load sample wardrobe</Button></>} />
      ) : (
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", ...GROUPS] as const).map(g => {
                const n = g === "all" ? items.length : items.filter(i => GARMENT_TYPES[i.type].group === g).length;
                if (g !== "all" && n === 0) return null;
                return <button key={g} onClick={() => setGroup(g)} aria-pressed={group === g} className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-colors", group === g ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent hover:text-foreground")}>{g === "all" ? "All pieces" : GROUP_LABELS[g]} <span className="opacity-60">{n}</span></button>;
              })}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or colour" aria-label="Search wardrobe" className="studio-input pl-9 md:w-64" />
            </div>
          </div>

          {filtered.length === 0 ? <p className="mt-10 text-center text-sm text-muted-foreground">No pieces match that search.</p> : (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map(item => (
                <button key={item.id} onClick={() => setEditing(item)} className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-[0_12px_32px_rgba(30,30,30,0.1)]">
                  <div className="relative aspect-[4/5] bg-background p-4">
                    <img src={itemImage(item)} alt={item.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]" />
                    {item.cutout && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"><Scissors className="size-3" /> Cut out</span>}
                    {item.sample && <span className="absolute right-3 top-3 rounded-full bg-card/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Sample</span>}
                  </div>
                  <div className="p-3.5">
                    <h3 className="truncate text-sm font-medium">{item.name}</h3>
                    <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted-foreground"><i className="size-2.5 rounded-full border border-border" style={{ background: item.colorHex }} />{GARMENT_TYPES[item.type].label} · {item.colorName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {items.length >= 2 && <ClothingRailHero items={rail} eyebrow="Interactive closet" heading="Handle your wardrobe." caption="Brush along the rail, then open a piece for details." />}
      {items.length > 0 && !hasSamples && items.length < 4 && <p className="text-center text-xs text-muted-foreground">Tip: the stylist works best with a few tops, bottoms and shoes. <button onClick={loadSamples} className="underline underline-offset-4 hover:text-foreground">Add the sample wardrobe</button> to see it in action.</p>}

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditModal item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function TypeSelect({ value, onChange, id }: { value: GarmentType; onChange: (t: GarmentType) => void; id?: string }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value as GarmentType)} className="studio-input">
      {GROUPS.map(g => <optgroup key={g} label={GROUP_LABELS[g]}>{(Object.keys(GARMENT_TYPES) as GarmentType[]).filter(t => GARMENT_TYPES[t].group === g).map(t => <option key={t} value={t}>{GARMENT_TYPES[t].label}</option>)}</optgroup>)}
    </select>
  );
}

function AddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (!open) { setDrafts([]); setBusy(false); } }, [open]);

  const handle = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setBusy(true);
    const next: Draft[] = [];
    for (const file of list.slice(0, 12)) {
      try {
        const a = await analyzeFile(file);
        next.push({ ...a, key: uid(), fileName: file.name, name: defaultName(a.colorName, a.type) });
      } catch (err) { toast.error(err instanceof Error ? err.message : `Couldn’t read ${file.name}`); }
    }
    setDrafts(d => [...d, ...next]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const patch = (key: string, p: Partial<Draft>) => setDrafts(d => d.map(x => (x.key === key ? { ...x, ...p } : x)));
  const save = () => {
    const now = Date.now();
    actions.addItems(drafts.map<WardrobeItem>((d, i) => ({ id: uid(), name: d.name.trim() || defaultName(d.colorName, d.type), type: d.type, colorHex: d.colorHex, colorName: d.colorName, notes: "", image: d.image, cutout: d.cutout, createdAt: now - i })));
    toast.success(`${drafts.length} ${drafts.length === 1 ? "piece" : "pieces"} added to your wardrobe`);
    onClose();
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} eyebrow="Add to wardrobe" title="Bring a piece in." wide={drafts.length > 0}>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handle(e.target.files)} />
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files); }}
        className={cn("flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors disabled:cursor-wait", drag ? "border-primary bg-accent" : "border-primary/35 bg-background/60 hover:bg-accent")}>
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">{busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}</span>
        <span className="mt-4 text-sm font-medium">{busy ? "Analysing your photos…" : "Choose or drop clothing photos"}</span>
        <span className="mt-1 text-xs text-muted-foreground">JPG, PNG or WEBP · up to 15 MB each · photos stay on this device</span>
      </button>

      {drafts.length > 0 && (
        <>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">Check what FITYNX detected. Colour is read from the photo; the garment type is a best guess — correct it so the stylist can use it properly.</p>
          <ul className="mt-4 space-y-3">
            {drafts.map(d => (
              <li key={d.key} className="grid grid-cols-[84px_1fr] gap-4 rounded-xl border border-border bg-background/60 p-3 sm:grid-cols-[96px_1fr_auto]">
                <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-card"><img src={d.cutout || d.image} alt="" className="h-full w-full object-contain p-1" /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name"><input className="studio-input" value={d.name} onChange={e => patch(d.key, { name: e.target.value })} maxLength={60} /></Field>
                  <Field label="Type" hint={d.typeGuessed ? "Guessed from the file name" : "Please confirm"}><TypeSelect value={d.type} onChange={t => patch(d.key, { type: t, name: d.name === defaultName(d.colorName, d.type) ? defaultName(d.colorName, t) : d.name })} /></Field>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground sm:col-span-2">
                    <label className="inline-flex items-center gap-2">Colour <input type="color" value={d.colorHex} onChange={e => { const n = nameColor(e.target.value); patch(d.key, { colorHex: e.target.value, colorName: n, name: d.name === defaultName(d.colorName, d.type) ? defaultName(n, d.type) : d.name }); }} className="size-6 cursor-pointer rounded border border-border bg-transparent p-0" /></label>
                    <span>{d.colorName}</span>
                    <span className="inline-flex items-center gap-1">{d.cutout ? <><Check className="size-3 text-primary" /> Background removed</> : <>Original photo (background kept)</>}</span>
                  </div>
                </div>
                <button onClick={() => setDrafts(x => x.filter(y => y.key !== d.key))} aria-label="Discard" className="col-span-2 justify-self-end rounded-full p-2 text-muted-foreground hover:text-destructive sm:col-span-1 sm:self-start"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}><WandSparkles className="size-4" /> Add {drafts.length} to wardrobe</Button></div>
        </>
      )}
    </Modal>
  );
}

function EditModal({ item, onClose }: { item: WardrobeItem | null; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<GarmentType>("tee");
  const [color, setColor] = React.useState("#000000");
  const [notes, setNotes] = React.useState("");
  React.useEffect(() => { if (item) { setName(item.name); setType(item.type); setColor(item.colorHex); setNotes(item.notes); } }, [item]);
  if (!item) return null;
  return (
    <Modal open onClose={onClose} eyebrow="Wardrobe piece" title={item.name}>
      <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
        <Thumb item={item} className="aspect-[4/5]" />
        <div className="space-y-4">
          <Field label="Name"><input className="studio-input" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></Field>
          <Field label="Type"><TypeSelect value={type} onChange={setType} /></Field>
          <Field label="Colour"><div className="flex items-center gap-3"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="size-9 cursor-pointer rounded border border-border bg-transparent p-0" /><span className="text-sm text-muted-foreground">{nameColor(color)}</span></div></Field>
          <Field label="Notes"><textarea className="studio-input min-h-16 resize-none" value={notes} onChange={e => setNotes(e.target.value)} maxLength={240} placeholder="Fit, fabric, care…" /></Field>
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between">
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`Remove “${item.name}” from your wardrobe?`)) { actions.removeItem(item.id); toast("Piece removed"); onClose(); } }}><Trash2 className="size-4" /> Remove</Button>
        <div className="flex gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { actions.updateItem(item.id, { name: name.trim() || item.name, type, colorHex: color, colorName: nameColor(color), notes }); onClose(); toast.success("Saved"); }}>Save changes</Button></div>
      </div>
    </Modal>
  );
}
