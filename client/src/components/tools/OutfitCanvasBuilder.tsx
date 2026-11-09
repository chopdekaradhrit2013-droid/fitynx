import { Button } from "@/components/ui/button";
import { nameColor } from "@/lib/color";
import { actions, uid, useStore } from "@/lib/store";
import { GARMENT_TYPES, GROUP_LABELS, type GarmentType, type Group, type Look, type WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  Grid,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  Shirt,
  Sparkles,
  Trash2,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export interface CanvasGarment {
  canvasId: string;
  item: WardrobeItem;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number; // 0.5 to 1.8
  rotation: number; // degrees -45 to 45
  zIndex: number;
}

interface OutfitCanvasBuilderProps {
  initialItemIds?: string[];
  onSaved?: (lookId: string) => void;
}

type AspectRatio = "4:5" | "1:1" | "9:16";
type CanvasTheme = "minimal" | "linen" | "studio";

export function OutfitCanvasBuilder({ initialItemIds, onSaved }: OutfitCanvasBuilderProps) {
  const items = useStore(s => s.items);
  const [placed, setPlaced] = React.useState<CanvasGarment[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [aspect, setAspect] = React.useState<AspectRatio>("4:5");
  const [theme, setTheme] = React.useState<CanvasTheme>("minimal");
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [drawerGroup, setDrawerGroup] = React.useState<Group | "all">("all");
  const [lookTitle, setLookTitle] = React.useState("Custom Look");
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    canvasId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Initialize with passed items if provided
  React.useEffect(() => {
    if (initialItemIds && initialItemIds.length > 0 && items.length > 0) {
      const initialPieces = initialItemIds
        .map(id => items.find(i => i.id === id))
        .filter((i): i is WardrobeItem => !!i);
      
      if (initialPieces.length > 0) {
        applyHeadToToeLayout(initialPieces);
      }
    }
  }, [initialItemIds, items]);

  // Selected garment helper
  const selected = placed.find(p => p.canvasId === selectedId);

  // Group items by category
  const tops = placed.filter(p => GARMENT_TYPES[p.item.type].group === "top");
  const bottoms = placed.filter(p => GARMENT_TYPES[p.item.type].group === "bottom");
  const layers = placed.filter(p => GARMENT_TYPES[p.item.type].group === "outerwear");
  const shoes = placed.filter(p => GARMENT_TYPES[p.item.type].group === "shoes");
  const accessories = placed.filter(p => GARMENT_TYPES[p.item.type].group === "accessory");

  // Palette analysis
  const palette = React.useMemo(() => {
    return Array.from(new Set(placed.map(p => p.item.colorHex)));
  }, [placed]);

  // Color harmony deduction
  const harmony = React.useMemo(() => {
    if (placed.length < 2) return { label: "Add pieces to evaluate harmony", score: 80, badge: "In progress" };
    const hues = placed.map(p => {
      const hex = p.item.colorHex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      if (max !== min) {
        const d = max - min;
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }
      return h * 360;
    });

    const isNeutral = placed.every(p => ["black", "white", "grey", "navy", "beige", "cream", "charcoal"].includes(p.item.colorName.toLowerCase()));
    if (isNeutral) {
      return { label: "Understated Neutral Foundation", score: 96, badge: "Monochrome / Neutral" };
    }

    const diff = Math.abs(hues[0] - (hues[1] ?? hues[0]));
    if (diff > 140 && diff < 220) {
      return { label: "Complementary Dynamic Contrast", score: 94, badge: "Complementary" };
    }
    if (diff < 50) {
      return { label: "Harmonious Analogous Flow", score: 92, badge: "Analogous" };
    }
    return { label: "Balanced Tonal Pairing", score: 88, badge: "Balanced" };
  }, [placed]);

  // Add an item to the canvas
  const addItemToCanvas = (item: WardrobeItem) => {
    // Determine smart default position based on garment category
    const group = GARMENT_TYPES[item.type].group;
    let defaultX = 50;
    let defaultY = 50;
    let defaultScale = 1.0;

    if (group === "outerwear") {
      defaultX = 35;
      defaultY = 28;
      defaultScale = 1.1;
    } else if (group === "top") {
      defaultX = 55;
      defaultY = 32;
      defaultScale = 0.95;
    } else if (group === "bottom") {
      defaultX = 50;
      defaultY = 62;
      defaultScale = 1.0;
    } else if (group === "shoes") {
      defaultX = 50;
      defaultY = 88;
      defaultScale = 0.85;
    } else if (group === "accessory") {
      defaultX = 75;
      defaultY = 40;
      defaultScale = 0.75;
    }

    const newPiece: CanvasGarment = {
      canvasId: uid(),
      item,
      x: defaultX,
      y: defaultY,
      scale: defaultScale,
      rotation: 0,
      zIndex: placed.length + 1,
    };

    setPlaced(prev => [...prev, newPiece]);
    setSelectedId(newPiece.canvasId);
    toast.success(`Added ${item.name} to canvas`);
  };

  const removePiece = (canvasId: string) => {
    setPlaced(prev => prev.filter(p => p.canvasId !== canvasId));
    if (selectedId === canvasId) setSelectedId(null);
  };

  const updateSelected = (patch: Partial<CanvasGarment>) => {
    if (!selectedId) return;
    setPlaced(prev =>
      prev.map(p => (p.canvasId === selectedId ? { ...p, ...patch } : p))
    );
  };

  // Layout presets
  const applyHeadToToeLayout = (garmentsToLayout = placed.map(p => p.item)) => {
    const next: CanvasGarment[] = [];
    let z = 1;

    // Outerwear
    const layer = garmentsToLayout.find(i => GARMENT_TYPES[i.type].group === "outerwear");
    if (layer) {
      next.push({ canvasId: uid(), item: layer, x: 32, y: 26, scale: 1.08, rotation: -3, zIndex: z++ });
    }

    // Top
    const top = garmentsToLayout.find(i => GARMENT_TYPES[i.type].group === "top");
    if (top) {
      next.push({ canvasId: uid(), item: top, x: layer ? 60 : 50, y: 28, scale: 0.95, rotation: layer ? 2 : 0, zIndex: z++ });
    }

    // Bottom
    const bottom = garmentsToLayout.find(i => GARMENT_TYPES[i.type].group === "bottom");
    if (bottom) {
      next.push({ canvasId: uid(), item: bottom, x: 50, y: 62, scale: 1.0, rotation: 0, zIndex: z++ });
    }

    // Shoes
    const shoe = garmentsToLayout.find(i => GARMENT_TYPES[i.type].group === "shoes");
    if (shoe) {
      next.push({ canvasId: uid(), item: shoe, x: 50, y: 88, scale: 0.85, rotation: 0, zIndex: z++ });
    }

    // Accessory
    const acc = garmentsToLayout.find(i => GARMENT_TYPES[i.type].group === "accessory");
    if (acc) {
      next.push({ canvasId: uid(), item: acc, x: 78, y: 46, scale: 0.72, rotation: 8, zIndex: z++ });
    }

    // Add any remaining
    for (const remaining of garmentsToLayout) {
      if (!next.some(n => n.item.id === remaining.id)) {
        next.push({ canvasId: uid(), item: remaining, x: 50, y: 50, scale: 0.9, rotation: 0, zIndex: z++ });
      }
    }

    setPlaced(next);
    setSelectedId(null);
  };

  const applyFlatLayGrid = () => {
    if (placed.length === 0) return;
    const coords = [
      { x: 30, y: 30 },
      { x: 70, y: 30 },
      { x: 30, y: 70 },
      { x: 70, y: 70 },
      { x: 50, y: 50 },
    ];
    setPlaced(prev =>
      prev.map((p, idx) => ({
        ...p,
        x: coords[idx % coords.length].x,
        y: coords[idx % coords.length].y,
        scale: 0.9,
        rotation: 0,
      }))
    );
  };

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent, canvasId: string) => {
    e.stopPropagation();
    setSelectedId(canvasId);
    const piece = placed.find(p => p.canvasId === canvasId);
    if (!piece || !canvasRef.current) return;

    dragRef.current = {
      canvasId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: piece.x,
      initialY: piece.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, dragRef.current.initialX + deltaX));
    const newY = Math.max(5, Math.min(95, dragRef.current.initialY + deltaY));

    setPlaced(prev =>
      prev.map(p =>
        p.canvasId === dragRef.current?.canvasId ? { ...p, x: newX, y: newY } : p
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      dragRef.current = null;
    }
  };

  // Smart Auto-Complete: Fills in missing pieces from user wardrobe
  const handleAutoComplete = () => {
    if (items.length === 0) {
      toast.info("Upload pieces to your wardrobe first.");
      return;
    }

    const currentGroups = new Set(placed.map(p => GARMENT_TYPES[p.item.type].group));
    const toAdd: WardrobeItem[] = [];

    // If no top, find a top
    if (!currentGroups.has("top")) {
      const top = items.find(i => GARMENT_TYPES[i.type].group === "top");
      if (top) toAdd.push(top);
    }
    // If no bottom, find a bottom
    if (!currentGroups.has("bottom")) {
      const bottom = items.find(i => GARMENT_TYPES[i.type].group === "bottom");
      if (bottom) toAdd.push(bottom);
    }
    // If no shoes, find shoes
    if (!currentGroups.has("shoes")) {
      const shoe = items.find(i => GARMENT_TYPES[i.type].group === "shoes");
      if (shoe) toAdd.push(shoe);
    }
    // If no outerwear and we have one in wardrobe, add outerwear
    if (!currentGroups.has("outerwear") && placed.length >= 2) {
      const layer = items.find(i => GARMENT_TYPES[i.type].group === "outerwear");
      if (layer) toAdd.push(layer);
    }

    if (toAdd.length === 0) {
      toast.info("Outfit already contains the core pieces!");
      return;
    }

    const allItems = [...placed.map(p => p.item), ...toAdd];
    applyHeadToToeLayout(allItems);
    toast.success(`Auto-completed look with ${toAdd.length} pieces from your closet!`);
  };

  // Save look to database and store
  const handleSaveLook = async () => {
    if (placed.length === 0) {
      toast.error("Add at least one piece to the canvas before saving.");
      return;
    }

    setSaving(true);
    try {
      const newLook: Look = {
        id: uid(),
        title: lookTitle.trim() || `${harmony.badge} Look`,
        occasion: "Everyday",
        rationale: `${harmony.label}. Curated in Outfit Canvas.`,
        coordination: `${placed.length} pieces: ${placed.map(p => p.item.name).join(", ")}.`,
        finishing: "Personal flat-lay collage.",
        tip: `Palette: ${placed.map(p => p.item.colorName).join(" + ")}.`,
        score: harmony.score / 10,
        scoreNote: harmony.badge,
        items: placed.map(p => ({ itemId: p.item.id, role: GARMENT_TYPES[p.item.type].label })),
        saved: true,
        createdAt: Date.now(),
      };

      await actions.saveLook(newLook);
      toast.success(`Saved "${newLook.title}" to your Saved Looks!`);
      if (onSaved) onSaved(newLook.id);
    } catch {
      toast.error("Failed to save look");
    } finally {
      setSaving(false);
    }
  };

  // Export high-resolution PNG moodboard
  const handleExportPNG = async () => {
    if (placed.length === 0) {
      toast.error("Canvas is empty.");
      return;
    }

    setExporting(true);
    try {
      const exportCanvas = document.createElement("canvas");
      const exportWidth = 1200;
      const exportHeight = aspect === "1:1" ? 1200 : aspect === "9:16" ? 2133 : 1500;
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Draw background
      if (theme === "linen") {
        ctx.fillStyle = "#F6F3EE";
      } else if (theme === "studio") {
        ctx.fillStyle = "#FFFFFF";
      } else {
        ctx.fillStyle = "#FAF8F5";
      }
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // Subtle editorial border
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(36, 36, exportWidth - 72, exportHeight - 72);

      // Header branding
      ctx.fillStyle = "#111111";
      ctx.font = "bold 22px 'Space Grotesk', sans-serif";
      ctx.letterSpacing = "4px";
      ctx.fillText("FITYNX STUDIO", 60, 84);

      ctx.fillStyle = "#888888";
      ctx.font = "14px 'Space Grotesk', sans-serif";
      ctx.letterSpacing = "1px";
      ctx.fillText(`CURATED LOOK · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}`, 60, 110);

      // Draw all garments sorted by zIndex
      const sorted = [...placed].sort((a, b) => a.zIndex - b.zIndex);
      for (const p of sorted) {
        if (!p.item.image) continue;
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = p.item.image;
        });

        const targetX = (p.x / 100) * exportWidth;
        const targetY = (p.y / 100) * exportHeight;
        const baseW = 340 * p.scale;
        const baseH = 425 * p.scale;

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
        ctx.restore();
      }

      // Bottom footer: Palette circles and details
      const footerY = exportHeight - 80;
      ctx.fillStyle = "#111111";
      ctx.font = "bold 16px 'Space Grotesk', sans-serif";
      ctx.letterSpacing = "1px";
      ctx.fillText(lookTitle.toUpperCase(), 60, footerY);

      ctx.fillStyle = "#777777";
      ctx.font = "13px 'Space Grotesk', sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(`${harmony.badge} · ${harmony.label}`, 60, footerY + 24);

      // Draw palette circles on bottom right
      let circleX = exportWidth - 80;
      const uniqueColors = Array.from(new Set(placed.map(p => p.item.colorHex)));
      for (const hex of uniqueColors) {
        ctx.beginPath();
        ctx.arc(circleX, footerY + 10, 14, 0, Math.PI * 2);
        ctx.fillStyle = hex;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        circleX -= 36;
      }

      // Trigger download
      const dataUrl = exportCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `fitynx-${lookTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
      a.click();
      toast.success("Moodboard image exported successfully!");
    } catch (err) {
      toast.error("Failed to export image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 md:p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={lookTitle}
            onChange={e => setLookTitle(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-hidden"
            placeholder="Outfit name…"
          />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ({placed.length} pieces on canvas)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Layouts */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => applyHeadToToeLayout()}
              title="Head-to-toe stack"
              className="rounded px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Head-to-Toe
            </button>
            <button
              type="button"
              onClick={applyFlatLayGrid}
              title="Flat-lay grid"
              className="rounded px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Flat-Lay
            </button>
          </div>

          {/* Auto-Complete */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoComplete}
            className="text-xs h-8 gap-1.5"
          >
            <Wand2 className="size-3.5 text-[#F26A4B]" />
            Auto-Complete
          </Button>

          {/* Export PNG */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting || placed.length === 0}
            onClick={handleExportPNG}
            className="text-xs h-8 gap-1.5"
          >
            <Download className="size-3.5" />
            {exporting ? "Rendering…" : "Export PNG"}
          </Button>

          {/* Save Look */}
          <Button
            type="button"
            size="sm"
            disabled={saving || placed.length === 0}
            onClick={handleSaveLook}
            className="text-xs h-8 gap-1.5"
          >
            <Save className="size-3.5" />
            {saving ? "Saving…" : "Save Look"}
          </Button>
        </div>
      </div>

      {/* Main Canvas & Inspector Area */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas Display */}
        <div className="flex flex-col items-center">
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => setSelectedId(null)}
            className={cn(
              "relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-border shadow-xs transition-all select-none touch-none",
              aspect === "4:5" ? "aspect-[4/5]" : aspect === "1:1" ? "aspect-square" : "aspect-[9/16]",
              theme === "linen" ? "bg-[#FAF7F2] dark:bg-[#1A1816]" : theme === "studio" ? "bg-white dark:bg-black" : "bg-[#F9F7F4] dark:bg-[#141414]"
            )}
            style={{
              backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Canvas Header watermark */}
            <div className="absolute top-4 left-4 z-0 pointer-events-none opacity-40">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em]">FITYNX STUDIO</p>
              <p className="font-serif text-xs">{lookTitle}</p>
            </div>

            {/* Placed Garments */}
            {placed.map(p => {
              const isSelected = selectedId === p.canvasId;
              return (
                <div
                  key={p.canvasId}
                  onPointerDown={e => handlePointerDown(e, p.canvasId)}
                  className={cn(
                    "absolute cursor-grab active:cursor-grabbing transition-[filter,box-shadow]",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg shadow-xl"
                  )}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
                    zIndex: p.zIndex,
                  }}
                >
                  <div className="relative group w-36 sm:w-44 aspect-[4/5] flex items-center justify-center p-2">
                    <img
                      src={p.item.image}
                      alt={p.item.name}
                      draggable={false}
                      className="h-full w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                    />
                    {/* Hover delete button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        removePiece(p.canvasId);
                      }}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:scale-110"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty Canvas Placeholder */}
            {placed.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground pointer-events-none">
                <Shirt className="size-12 stroke-[1.2] opacity-30 mb-3" />
                <h4 className="font-serif text-lg text-foreground/70">Your Canvas is Ready</h4>
                <p className="text-xs max-w-xs mt-1">
                  Click any garment from your wardrobe below to place it here. Drag freely to arrange your flat-lay.
                </p>
              </div>
            )}
          </div>

          {/* Quick Aspect & Theme controls */}
          <div className="mt-3 flex items-center justify-between w-full max-w-[560px] px-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Ratio:</span>
              {(["4:5", "1:1", "9:16"] as AspectRatio[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspect(r)}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors",
                    aspect === r ? "bg-primary text-primary-foreground font-medium" : "hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span>Theme:</span>
              {(["minimal", "linen", "studio"] as CanvasTheme[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded px-2 py-0.5 capitalize transition-colors",
                    theme === t ? "bg-accent text-foreground font-medium" : "hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Selected Item Controls & Palette Analysis */}
        <div className="space-y-4">
          {/* Selected Piece Adjustments */}
          {selected ? (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#F26A4B]">Selected Piece</p>
                  <h4 className="font-medium text-sm truncate max-w-[200px]">{selected.item.name}</h4>
                  <p className="text-xs text-muted-foreground">{GARMENT_TYPES[selected.item.type].label} · {selected.item.colorName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePiece(selected.canvasId)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Remove from canvas"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Scale Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Scale</span>
                  <span className="font-mono">{Math.round(selected.scale * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-7 p-0"
                    onClick={() => updateSelected({ scale: Math.max(0.6, selected.scale - 0.1) })}
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <input
                    type="range"
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={selected.scale}
                    onChange={e => updateSelected({ scale: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="size-7 p-0"
                    onClick={() => updateSelected({ scale: Math.min(1.6, selected.scale + 0.1) })}
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rotation</span>
                  <span className="font-mono">{selected.rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="2"
                    value={selected.rotation}
                    onChange={e => updateSelected({ rotation: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => updateSelected({ rotation: 0 })}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Layer Ordering (Z-Index) */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Layer Order</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 gap-1"
                    onClick={() => updateSelected({ zIndex: selected.zIndex + 1 })}
                  >
                    <ArrowUp className="size-3" /> Bring Forward
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7 gap-1"
                    onClick={() => updateSelected({ zIndex: Math.max(1, selected.zIndex - 1) })}
                  >
                    <ArrowDown className="size-3" /> Send Backward
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center text-xs text-muted-foreground">
              <Maximize2 className="size-6 mx-auto mb-2 opacity-40" />
              Click any garment on the canvas to resize, rotate, or change layering.
            </div>
          )}

          {/* Style & Harmony Analysis Card */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="size-3.5 text-[#F26A4B]" />
                Palette &amp; Harmony
              </h5>
              <span className="font-mono text-xs font-semibold text-primary">{harmony.score}%</span>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {palette.map(hex => (
                <div
                  key={hex}
                  className="size-7 rounded-full border border-border shadow-xs flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: hex }}
                  title={`${nameColor(hex)} (${hex})`}
                />
              ))}
              {palette.length === 0 && <span className="text-xs text-muted-foreground">No pieces placed yet</span>}
            </div>

            <p className="text-xs font-medium text-foreground">{harmony.label}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {placed.length > 0
                ? `${placed.length} pieces composed on canvas. Ready to export as a personal moodboard.`
                : "Select clothing items from your wardrobe below to start building."}
            </p>
          </div>
        </div>
      </div>

      {/* Wardrobe Tray / Drawer */}
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-serif text-xl font-normal">Add from your Wardrobe</h4>
            <p className="text-xs text-muted-foreground">Click any piece to place it on the moodboard canvas.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "top", "bottom", "outerwear", "shoes", "dress", "accessory"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setDrawerGroup(g)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                  drawerGroup === g
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {g === "all" ? "All pieces" : GROUP_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* Garment Grid in Drawer */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {items
            .filter(i => (drawerGroup === "all" ? true : GARMENT_TYPES[i.type].group === drawerGroup))
            .map(item => {
              const countOnCanvas = placed.filter(p => p.item.id === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItemToCanvas(item)}
                  className="group relative flex flex-col items-center rounded-xl border border-border bg-background p-2 text-left transition-all hover:border-primary hover:shadow-sm active:scale-95"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-card p-1">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain transition-transform group-hover:scale-105"
                    />
                    {countOnCanvas > 0 && (
                      <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {countOnCanvas}
                      </span>
                    )}
                  </div>
                  <span className="mt-2 truncate w-full text-center text-[11px] font-medium text-foreground">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {item.colorName}
                  </span>
                </button>
              );
            })}
        </div>

        {items.length === 0 && (
          <p className="text-center py-6 text-xs text-muted-foreground">
            No clothes found in this category. Upload pieces in the Wardrobe section first!
          </p>
        )}
      </div>
    </div>
  );
}
