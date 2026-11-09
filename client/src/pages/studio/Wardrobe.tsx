import { LensMatchModal } from "@/components/site/LensMatchModal";
import { OutfitExtractorModal, type ExtractedPieceDraft } from "@/components/site/OutfitExtractorModal";
import { Modal } from "@/components/site/Modal";
import { EmptyState, Field, PageHeader, Thumb, itemImage } from "@/components/site/studio-ui";
import { Button } from "@/components/ui/button";
import ClothingRailHero, { type GarmentKind, type RailGarment } from "@/components/ui/product-rail-gallery";
import { nameColor } from "@/lib/color";
import { actions, uid, useStore } from "@/lib/store";
import { analyzeFile, createFastThumbnail, defaultName, readFile, type Analysis } from "@/lib/imaging";
import { api, getSavedGeminiKey } from "@/lib/api";
import { GARMENT_TYPES, GROUP_LABELS, type GarmentType, type Group, type WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Camera, Check, GalleryHorizontal, Globe, Layers, LayoutGrid, Loader2, Plus, Search, Shirt, Sparkles, Trash2, Upload, User, WandSparkles } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const GROUPS = Object.keys(GROUP_LABELS) as Group[];
const RAIL_KIND: Partial<Record<GarmentType, GarmentKind>> = { tee: "tee", shirt: "shirt", knit: "knit", hoodie: "hoodie", jacket: "jacket", coat: "coat", blazer: "jacket" };

interface Draft extends Analysis { key: string; name: string; fileName: string }

export default function Wardrobe() {
  const items = useStore(s => s.items);
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<Group | "all">("all");
  const [topView, setTopView] = React.useState<"rail" | "grid">("rail");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WardrobeItem | null>(null);

  const filtered = items.filter(i => {
    const g = GARMENT_TYPES[i.type].group;
    if (group !== "all" && g !== group) return false;
    return `${i.name} ${i.colorName} ${GARMENT_TYPES[i.type].label}`.toLowerCase().includes(query.trim().toLowerCase());
  });

  const tops = items.filter(i => GARMENT_TYPES[i.type].group === "top");
  const filteredTops = filtered.filter(i => GARMENT_TYPES[i.type].group === "top");

  const topsRail: RailGarment[] = React.useMemo(() => {
    const list = query.trim() ? filteredTops : tops;
    return list.map(i => ({
      id: i.id,
      name: i.name,
      category: GARMENT_TYPES[i.type].label,
      kind: (RAIL_KIND[i.type] ?? "tee") as GarmentKind,
      color: i.colorHex,
      image: itemImage(i) || undefined,
      tag: i.colorName,
      description: i.notes || `${i.colorName} ${GARMENT_TYPES[i.type].label.toLowerCase()} from your wardrobe.`,
      details: [
        GARMENT_TYPES[i.type].label,
        i.colorName,
        "Wardrobe Piece",
      ],
    }));
  }, [tops, filteredTops, query]);

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Your collection"
        title="Wardrobe."
        text="Everything you own, catalogued on this device. Add photos and FITYNX reads the colour, identifies the piece, and gets it ready to style."
        action={<Button onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add pieces</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Shirt className="size-7" />}
          title="No clothes uploaded yet"
          text="Your digital wardrobe is empty. Upload clear photos of your clothing pieces to get started with styling and outfit curation."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Upload className="size-4" /> Upload your clothes
            </Button>
          }
        />
      ) : (
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["all", ...GROUPS] as const).map(g => {
                const n = g === "all" ? items.length : items.filter(i => GARMENT_TYPES[i.type].group === g).length;
                if (g !== "all" && n === 0) return null;
                return (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    aria-pressed={group === g}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-all duration-200 active:scale-95 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      group === g
                        ? "border-primary bg-primary text-primary-foreground font-medium"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {g === "all" ? "All pieces" : GROUP_LABELS[g]} <span className="opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              {group === "top" && (
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-card shrink-0">
                  <button
                    type="button"
                    onClick={() => setTopView("rail")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      topView === "rail"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Rail view"
                  >
                    <GalleryHorizontal className="size-3.5" />
                    <span>Rail View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopView("grid")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      topView === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="size-3.5" />
                    <span>Grid View</span>
                  </button>
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or colour"
                  aria-label="Search wardrobe"
                  className="studio-input pl-9 md:w-64"
                />
              </div>
            </div>
          </div>

          {/* Special dedicated Tops Rail View when Tops filter is selected */}
          {group === "top" && topView === "rail" ? (
            topsRail.length === 0 ? (
              <p className="mt-10 text-center text-sm text-muted-foreground">No tops match that search.</p>
            ) : (
              <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card/40 p-4 md:p-6">
                <ClothingRailHero
                  items={topsRail}
                  hanger="wood"
                  eyebrow="Tops on the Rail"
                  heading="Your tops on the rail."
                  caption="Slide across the rail, rotate hangers, and inspect the front and back."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" /> Add new top
                    </Button>
                  }
                />
              </div>
            )
          ) : (
            <>
              {/* If viewing All pieces, showcase the Tops Rail at the top */}
              {group === "all" && topsRail.length > 0 && !query.trim() && (
                <div className="mt-7 mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card/80 to-card/20 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F26A4B]">Tops on the Rail</p>
                      <h3 className="font-serif text-2xl font-normal">Your tops on the rail</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGroup("top");
                        setTopView("rail");
                      }}
                      className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Focus tops ({tops.length}) →
                    </button>
                  </div>
                  <ClothingRailHero
                    items={topsRail}
                    hanger="wood"
                    caption="Slide across the rail, rotate hangers, and inspect the front and back."
                  />
                </div>
              )}

              {/* Grid of pieces */}
              {filtered.length === 0 ? (
                <p className="mt-10 text-center text-sm text-muted-foreground">No pieces match that search.</p>
              ) : (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setEditing(item)}
                      className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                      <div className="relative aspect-[4/5] bg-background p-4 flex items-center justify-center">
                        {itemImage(item) ? (
                          <img
                            src={itemImage(item)}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-3">
                            <Shirt className="size-8 opacity-40" />
                            <span className="mt-2 text-[11px]">No photo uploaded</span>
                          </div>
                        )}
                        {item.wearCount && item.wearCount > 0 ? (
                          <span className="absolute top-2 right-2 rounded-full border border-border bg-background/90 backdrop-blur-xs px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground shadow-xs">
                            {item.price ? `$${(item.price / item.wearCount).toFixed(0)}/w` : `${item.wearCount}w`}
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3.5">
                        <h3 className="truncate text-sm font-medium">{item.name}</h3>
                        <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted-foreground">
                          <i className="size-2.5 rounded-full border border-border" style={{ background: item.colorHex }} />
                          {GARMENT_TYPES[item.type].label} · {item.colorName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

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
  const [lensDraft, setLensDraft] = React.useState<Draft | null>(null);
  const [analyzingKey, setAnalyzingKey] = React.useState<string | null>(null);
  const [extractorImage, setExtractorImage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const extractorInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleExtractorConfirm = (pieces: ExtractedPieceDraft[]) => {
    const newDrafts: Draft[] = pieces.map(p => ({
      key: uid(),
      fileName: `${p.name}.png`,
      name: p.name,
      type: p.type,
      colorName: p.colorName,
      colorHex: p.colorHex,
      image: p.image,
      typeGuessed: false,
    }));
    setDrafts(prev => [...prev, ...newDrafts]);
    setExtractorImage(null);
    toast.success(`Extracted ${pieces.length} pieces from worn outfit!`);
  };

  const patch = (key: string, p: Partial<Draft>) => setDrafts(d => d.map(x => (x.key === key ? { ...x, ...p } : x)));

  const handleGeminiAnalyze = async (d: Draft) => {
    setAnalyzingKey(d.key);
    try {
      const apiKey = getSavedGeminiKey() || undefined;
      const fastThumb = await createFastThumbnail(d.image, 640);
      const res = await api.ai.analyze(fastThumb, apiKey);
      if (res?.analysis) {
        const a = res.analysis;
        patch(d.key, {
          name: a.name || d.name,
          type: (a.garmentType in GARMENT_TYPES ? a.garmentType : d.type) as GarmentType,
          colorName: a.colorName || d.colorName,
          colorHex: a.colorHex || d.colorHex,
        });
        toast.success(`Gemini recognized: ${a.name}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gemini analysis failed. Check API key in Settings.");
    } finally {
      setAnalyzingKey(null);
    }
  };

  const save = () => {
    const now = Date.now();
    actions.addItems(drafts.map<WardrobeItem>((d, i) => ({ id: uid(), name: d.name.trim() || defaultName(d.colorName, d.type), type: d.type, colorHex: d.colorHex, colorName: d.colorName, notes: "", image: d.image, createdAt: now - i })));
    toast.success(`${drafts.length} ${drafts.length === 1 ? "piece" : "pieces"} added to your wardrobe`);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={() => !busy && onClose()} eyebrow="Add to wardrobe" title="Bring a piece in." wide={drafts.length > 0}>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handle(e.target.files)} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files); }}
          className={cn("flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors disabled:cursor-wait", drag ? "border-primary bg-accent" : "border-primary/35 bg-background/60 hover:bg-accent")}>
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">{busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}</span>
          <span className="mt-4 text-sm font-medium">{busy ? "Importing photos…" : "Choose or drop clothing photos"}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG or WEBP · up to 15 MB each · photos stay on this device</span>
        </button>

        {/* Quick action prompts: Camera & Worn outfit extractor */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {/* Mobile Camera Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handle(e.target.files)}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Camera className="size-3.5 text-[#F26A4B]" />
            <span>Open Camera</span>
          </button>

          <input
            ref={extractorInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await readFile(file);
                setExtractorImage(url);
              }
              if (e.target) e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => extractorInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <User className="size-3.5 text-[#F26A4B]" />
            <span>Worn photo? Extract Top &amp; Bottom</span>
          </button>
        </div>

        {drafts.length > 0 && (
          <>
            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Review your pieces. Use <strong>Extract Top & Bottom</strong> to split worn clothes, or <strong>Google Lens</strong> to reverse search clean studio catalog photos.
            </p>
            <ul className="mt-4 space-y-3">
              {drafts.map(d => (
                <li key={d.key} className="grid grid-cols-[96px_1fr] gap-4 rounded-xl border border-border bg-background/60 p-3 sm:grid-cols-[108px_1fr_auto]">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg bg-card">
                      <img src={d.image} alt="" className="h-full w-full object-contain p-1" />
                    </div>
                    {/* Action buttons under thumbnail */}
                    <div className="flex w-full flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setLensDraft(d)}
                        className="flex w-full items-center justify-center gap-1 rounded border border-border bg-card px-1.5 py-1 text-[10px] text-primary hover:bg-primary/10"
                      >
                        <Globe className="size-2.5 text-[#F26A4B]" /> Google Lens
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <Field label="Name">
                        <input className="studio-input" value={d.name} onChange={e => patch(d.key, { name: e.target.value })} maxLength={60} />
                      </Field>
                    </div>
                    <Field label="Type" hint={d.typeGuessed ? "Guessed from file" : "Please confirm"}>
                      <TypeSelect value={d.type} onChange={t => patch(d.key, { type: t, name: d.name === defaultName(d.colorName, d.type) ? defaultName(d.colorName, t) : d.name })} />
                    </Field>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">AI Assist</label>
                      <div className="flex flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={analyzingKey === d.key}
                          onClick={() => handleGeminiAnalyze(d)}
                          className="w-full text-xs h-8 font-normal justify-start gap-1.5"
                        >
                          {analyzingKey === d.key ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-[#F26A4B]" />}
                          Gemini Auto-Tag
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setExtractorImage(d.image)}
                          className="w-full text-xs h-8 font-normal justify-start gap-1.5"
                        >
                          <Layers className="size-3.5 text-[#F26A4B]" />
                          Extract Top & Bottom
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:col-span-2 pt-1">
                      <label className="inline-flex items-center gap-2">
                        Colour <input type="color" value={d.colorHex} onChange={e => { const n = nameColor(e.target.value); patch(d.key, { colorHex: e.target.value, colorName: n, name: d.name === defaultName(d.colorName, d.type) ? defaultName(n, d.type) : d.name }); }} className="size-6 cursor-pointer rounded border border-border bg-transparent p-0" />
                      </label>
                      <span>{d.colorName}</span>
                      <span className="text-muted-foreground">Original photo</span>
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

      {/* Outfit Extractor Modal */}
      {extractorImage && (
        <OutfitExtractorModal
          open={true}
          originalImage={extractorImage}
          onClose={() => setExtractorImage(null)}
          onConfirm={handleExtractorConfirm}
        />
      )}

      {/* Lens Match Modal for Draft */}
      {lensDraft && (
        <LensMatchModal
          open={!!lensDraft}
          onClose={() => setLensDraft(null)}
          initialQuery={`${lensDraft.colorName} ${lensDraft.name}`}
          currentImage={lensDraft.image}
          onSelectImage={(newImg) => {
            patch(lensDraft.key, { image: newImg });
          }}
        />
      )}
    </>
  );
}

function EditModal({ item, onClose }: { item: WardrobeItem | null; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<GarmentType>("tee");
  const [color, setColor] = React.useState("#000000");
  const [notes, setNotes] = React.useState("");
  const [image, setImage] = React.useState("");
  const [price, setPrice] = React.useState<number | "">("");
  const [wearCount, setWearCount] = React.useState<number>(0);
  const [lensOpen, setLensOpen] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setType(item.type);
      setColor(item.colorHex);
      setNotes(item.notes);
      setImage(item.image);
      setPrice(typeof item.price === "number" ? item.price : "");
      setWearCount(item.wearCount || 0);
    }
  }, [item]);

  if (!item) return null;

  const cpw = typeof price === "number" && price > 0 ? (price / Math.max(1, wearCount)).toFixed(2) : null;

  const handleGemini = async () => {
    setAnalyzing(true);
    try {
      const apiKey = getSavedGeminiKey() || undefined;
      const res = await api.ai.analyze(image, apiKey);
      if (res?.analysis) {
        const a = res.analysis;
        setName(a.name || name);
        if (a.garmentType in GARMENT_TYPES) setType(a.garmentType as GarmentType);
        if (a.colorHex) setColor(a.colorHex);
        if (a.stylingTip) setNotes(n => n ? `${n}\n${a.stylingTip}` : (a.stylingTip || ""));
        toast.success(`Gemini recognized: ${a.name}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gemini analysis failed. Check API key in Settings.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Modal open onClose={onClose} eyebrow="Wardrobe piece" title={item.name}>
        <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-card">
              <img src={image} alt={name} className="h-full w-full object-contain p-2" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLensOpen(true)}
                className="w-full text-xs h-8 text-primary hover:bg-primary/10 gap-1.5"
              >
                <Globe className="size-3 text-[#F26A4B]" /> Google Lens
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={analyzing}
                onClick={handleGemini}
                className="w-full text-xs h-8 gap-1.5"
              >
                {analyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-[#F26A4B]" />}
                Gemini Tag
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Name"><input className="studio-input" value={name} onChange={e => setName(e.target.value)} maxLength={60} /></Field>
            <Field label="Type"><TypeSelect value={type} onChange={setType} /></Field>
            <Field label="Colour"><div className="flex items-center gap-3"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="size-9 cursor-pointer rounded border border-border bg-transparent p-0" /><span className="text-sm text-muted-foreground">{nameColor(color)}</span></div></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purchase Price ($)" hint={cpw ? `CPW: $${cpw}` : "Optional"}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 65"
                  className="studio-input"
                  value={price}
                  onChange={e => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                />
              </Field>
              <Field label="Wear Count">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold px-2">{wearCount} {wearCount === 1 ? "wear" : "wears"}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs ml-auto"
                    onClick={() => setWearCount(c => c + 1)}
                  >
                    +1 Wear
                  </Button>
                </div>
              </Field>
            </div>
            <Field label="Notes"><textarea className="studio-input min-h-16 resize-none" value={notes} onChange={e => setNotes(e.target.value)} maxLength={240} placeholder="Fit, fabric, care…" /></Field>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between">
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`Remove “${item.name}” from your wardrobe?`)) { actions.removeItem(item.id); toast("Piece removed"); onClose(); } }}><Trash2 className="size-4" /> Remove</Button>
          <div className="flex gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { actions.updateItem(item.id, { name: name.trim() || item.name, type, colorHex: color, colorName: nameColor(color), notes, image, price: typeof price === "number" ? price : undefined, wearCount }); onClose(); toast.success("Saved"); }}>Save changes</Button></div>
        </div>
      </Modal>

      {/* Lens Match Modal for Edit */}
      {lensOpen && (
        <LensMatchModal
          open={lensOpen}
          onClose={() => setLensOpen(false)}
          initialQuery={`${nameColor(color)} ${name}`}
          currentImage={image}
          onSelectImage={(newImg) => {
            setImage(newImg);
            actions.updateItem(item.id, { image: newImg });
          }}
        />
      )}
    </>
  );
}
