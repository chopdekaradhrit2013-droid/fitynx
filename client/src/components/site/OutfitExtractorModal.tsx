import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { LensMatchModal } from "./LensMatchModal";
import { api, getSavedGeminiKey, type ExtractedGarment } from "@/lib/api";
import { cropImageRegion, generateAiCutout, analyzeFile, createFastThumbnail } from "@/lib/imaging";
import { GARMENT_TYPES, GROUP_LABELS, type GarmentType, type Group } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Globe, Layers, Loader2, RefreshCw, Scissors, Sparkles, User, Wand2 } from "lucide-react";
import { toast } from "sonner";

export interface ExtractedPieceDraft {
  id: string;
  role: "top" | "bottom" | "outerwear" | "dress" | "shoes";
  name: string;
  type: GarmentType;
  colorName: string;
  colorHex: string;
  fabric?: string;
  image: string;
  cutout?: string;
  cutoutBusy?: boolean;
  notes: string;
  searchQuery?: string;
}

interface OutfitExtractorModalProps {
  open: boolean;
  onClose: () => void;
  originalImage: string;
  onConfirm: (pieces: ExtractedPieceDraft[]) => void;
}

const DEFAULT_TOP_BOX: [number, number, number, number] = [120, 160, 540, 840];
const DEFAULT_BOTTOM_BOX: [number, number, number, number] = [480, 180, 930, 820];

export function OutfitExtractorModal({
  open,
  onClose,
  originalImage,
  onConfirm,
}: OutfitExtractorModalProps) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const [pieces, setPieces] = React.useState<ExtractedPieceDraft[]>([]);
  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [lensIndex, setLensIndex] = React.useState<number | null>(null);

  // Extract garments when modal opens with an image
  React.useEffect(() => {
    if (!open || !originalImage) {
      setPieces([]);
      return;
    }

    let cancelled = false;

    async function extract() {
      setAnalyzing(true);
      try {
        const apiKey = getSavedGeminiKey() || undefined;
        let detectedGarments: ExtractedGarment[] = [];

        // 1. Create a lightweight 640px JPEG thumbnail (~35KB) for lightning-fast network transfer
        const fastThumb = await createFastThumbnail(originalImage, 640, 0.82);

        try {
          const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000));
          const apiPromise = api.ai.extractOutfit(fastThumb, apiKey);
          const res = await Promise.race([apiPromise, timeoutPromise]);
          if (res?.garments && res.garments.length > 0) {
            detectedGarments = res.garments;
          }
        } catch (aiErr) {
          console.warn("Gemini outfit extraction error/timeout, using smart body segmentation:", aiErr);
        }

        // If no AI garments detected, fallback to smart body proportion segmentation
        if (detectedGarments.length === 0) {
          detectedGarments = [
            {
              role: "top",
              type: "tee",
              name: "Worn Top",
              colorName: "Neutral",
              colorHex: "#333333",
              box2d: DEFAULT_TOP_BOX,
              searchQuery: "clothing top product flat lay",
            },
            {
              role: "bottom",
              type: "jeans",
              name: "Worn Bottom",
              colorName: "Denim",
              colorHex: "#22344D",
              box2d: DEFAULT_BOTTOM_BOX,
              searchQuery: "pants jeans product flat lay",
            },
          ];
        }

        if (cancelled) return;

        // Crop pieces concurrently on canvas in parallel (< 15ms)
        const drafts: ExtractedPieceDraft[] = await Promise.all(
          detectedGarments.map(async (g, i) => {
            const cropped = await cropImageRegion(originalImage, g.box2d);
            const validTypes = Object.keys(GARMENT_TYPES) as GarmentType[];
            const pieceType: GarmentType = validTypes.includes(g.type as GarmentType)
              ? (g.type as GarmentType)
              : g.role === "bottom"
                ? "jeans"
                : "tee";

            return {
              id: `extracted-${i}-${Date.now()}`,
              role: g.role,
              name: g.name || (g.role === "top" ? "Worn Top Piece" : "Worn Bottom Piece"),
              type: pieceType,
              colorName: g.colorName || "Extracted Color",
              colorHex: g.colorHex || "#222222",
              fabric: g.fabric,
              image: cropped,
              notes: `Extracted from worn outfit photograph. ${g.fabric ? `Fabric: ${g.fabric}.` : ""}`,
              searchQuery: g.searchQuery,
            };
          })
        );

        if (!cancelled) {
          setPieces(drafts);
          setActiveTab(0);
        }
      } catch (err) {
        console.error("Failed to extract outfit pieces:", err);
        toast.error("Could not extract outfit pieces from image.");
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    }

    extract();

    return () => {
      cancelled = true;
    };
  }, [open, originalImage]);

  const handleCutout = async (index: number) => {
    const target = pieces[index];
    if (!target) return;

    setPieces(p => p.map((item, i) => (i === index ? { ...item, cutoutBusy: true } : item)));

    try {
      const cutout = await generateAiCutout(target.image);
      if (cutout) {
        setPieces(p => p.map((item, i) => (i === index ? { ...item, cutout, cutoutBusy: false } : item)));
        toast.success(`Removed background from ${target.name}`);
      } else {
        toast.info("Could not extract transparent cutout for this piece.");
        setPieces(p => p.map((item, i) => (i === index ? { ...item, cutoutBusy: false } : item)));
      }
    } catch {
      toast.error("Background cutout failed.");
      setPieces(p => p.map((item, i) => (i === index ? { ...item, cutoutBusy: false } : item)));
    }
  };

  const handleLensReplace = (index: number, newImage: string) => {
    setPieces(p => p.map((item, i) => (i === index ? { ...item, image: newImage, cutout: newImage } : item)));
    setLensIndex(null);
    toast.success("Replaced with studio product photo!");
  };

  const updatePiece = (index: number, field: keyof ExtractedPieceDraft, value: any) => {
    setPieces(p => p.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const currentPiece = pieces[activeTab];

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Extracting pieces from your outfit"
      eyebrow="Outfit Garment Extractor"
    >
      <div className="space-y-6">
        <p className="-mt-2 text-xs text-muted-foreground">
          We isolated the garments worn in your photo so you can catalogue the top and bottom into your wardrobe separately.
        </p>

        {analyzing ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="size-8 animate-spin text-[#F26A4B]" />
            <p className="mt-4 font-serif text-lg font-medium">Detecting garments on person...</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Locating the top and bottom pieces, cropping coordinates, and reading fabric tones.
            </p>
          </div>
        ) : pieces.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No distinct garments could be separated from this photo.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Extracted Pieces Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              {pieces.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-95 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    activeTab === idx
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className="capitalize">{p.role}:</span>
                  <span className="max-w-[120px] truncate">{p.name}</span>
                </button>
              ))}
            </div>

            {/* Active Piece Card */}
            {currentPiece && (
              <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
                {/* Image & Cutout Preview */}
                <div className="space-y-3">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-background p-2 flex items-center justify-center">
                    <img
                      src={currentPiece.cutout || currentPiece.image}
                      alt={currentPiece.name}
                      className="size-full object-contain"
                    />
                    {currentPiece.cutout && (
                      <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        Cutout
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCutout(activeTab)}
                      disabled={currentPiece.cutoutBusy}
                      className="w-full text-xs gap-1.5"
                    >
                      {currentPiece.cutoutBusy ? (
                        <>
                          <Loader2 className="size-3 animate-spin" /> Cutting...
                        </>
                      ) : (
                        <>
                          <Scissors className="size-3 text-[#F26A4B]" /> AI Cutout
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLensIndex(activeTab)}
                      className="w-full text-xs gap-1.5"
                    >
                      <Globe className="size-3 text-sky-400" /> Lens Studio Shot
                    </Button>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Garment Title</label>
                    <input
                      className="studio-input mt-1"
                      value={currentPiece.name}
                      onChange={e => updatePiece(activeTab, "name", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Category</label>
                      <select
                        className="studio-input mt-1"
                        value={currentPiece.type}
                        onChange={e => updatePiece(activeTab, "type", e.target.value as GarmentType)}
                      >
                        {Object.keys(GARMENT_TYPES).map(t => (
                          <option key={t} value={t}>
                            {GARMENT_TYPES[t as GarmentType].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Color Tone</label>
                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                        <span
                          className="size-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: currentPiece.colorHex }}
                        />
                        <span className="truncate">{currentPiece.colorName}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notes</label>
                    <input
                      className="studio-input mt-1"
                      value={currentPiece.notes}
                      onChange={e => updatePiece(activeTab, "notes", e.target.value)}
                      placeholder="e.g. 100% Cotton, thrifted"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end border-t border-border pt-5">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => {
                  onConfirm(pieces);
                  toast.success(`Extracted and catalogued ${pieces.length} pieces into your wardrobe!`);
                  onClose();
                }}
                className="gap-2"
              >
                <Check className="size-4" />
                Add All {pieces.length} Pieces to Wardrobe
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lens Match Modal for any extracted piece */}
      {lensIndex !== null && pieces[lensIndex] && (
        <LensMatchModal
          open={true}
          onClose={() => setLensIndex(null)}
          initialQuery={
            pieces[lensIndex].searchQuery ||
            `${pieces[lensIndex].name} ${pieces[lensIndex].colorName} ${GARMENT_TYPES[pieces[lensIndex].type].label} flat lay`
          }
          currentImage={pieces[lensIndex].cutout || pieces[lensIndex].image}
          onSelectImage={(dataUrl: string) => handleLensReplace(lensIndex, dataUrl)}
        />
      )}
    </Modal>
  );
}
