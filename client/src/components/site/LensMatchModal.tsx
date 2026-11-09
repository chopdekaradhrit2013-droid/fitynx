import React, { useEffect, useState, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { api, getSavedGeminiKey } from "@/lib/api";
import { createFastThumbnail, readFile } from "@/lib/imaging";
import { searchInGoogleLens, downloadGarmentImage } from "@/lib/lens";
import {
  ArrowUpRight,
  Check,
  ClipboardPaste,
  Download,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface LensMatchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  currentImage?: string;
  onSelectImage: (imageDataUrl: string, title?: string) => void;
}

export function LensMatchModal({
  open,
  onClose,
  initialQuery = "",
  currentImage,
  onSelectImage,
}: LensMatchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [visualTitle, setVisualTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [lensOpening, setLensOpening] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<
    Array<{ title: string; thumbnail: string; image: string; source: string }>
  >([]);

  // Reverse search driven by the actual image
  const performImageSearch = async (imgSource: string) => {
    setLoading(true);
    try {
      const apiKey = getSavedGeminiKey() || undefined;
      const fastThumb = await createFastThumbnail(imgSource, 512, 0.8);
      const res = await api.lens.searchByImage(fastThumb, apiKey);

      if (res.visualTitle) setVisualTitle(res.visualTitle);
      if (res.query) setQuery(res.query);
      setResults(res.results || []);
    } catch (err) {
      console.warn("Visual image search error:", err);
      // Fallback text search if image search fails
      if (initialQuery.trim()) {
        try {
          const res = await api.lens.search(initialQuery);
          setResults(res.results || []);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const performTextSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await api.lens.search(q);
      setResults(res.results || []);
    } catch (err) {
      console.error("Lens text search error:", err);
      toast.error("Failed to search web for studio images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (currentImage) {
      void performImageSearch(currentImage);
    } else if (initialQuery) {
      setQuery(initialQuery);
      void performTextSearch(initialQuery);
    }
  }, [open, currentImage, initialQuery]);

  // Global paste listener: user can paste an image or image URL from Google Lens anywhere in the modal
  useEffect(() => {
    if (!open) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // 1. Check for image file on clipboard
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              try {
                const dataUrl = await readFile(file);
                onSelectImage(dataUrl, "Pasted from Google Lens");
                toast.success("Applied clean studio photo from clipboard!");
                onClose();
                return;
              } catch (err) {
                console.warn("Failed reading pasted image:", err);
              }
            }
          }
        }
      }

      // 2. Check for image URL on clipboard
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\/.+\.(png|jpg|jpeg|webp|avif)/i.test(text)) {
        e.preventDefault();
        try {
          const proxyRes = await api.lens.proxy(text);
          onSelectImage(proxyRes.dataUrl, "Pasted from Google Lens URL");
          toast.success("Applied studio photo from copied URL!");
          onClose();
        } catch {
          onSelectImage(text, "Pasted from Google Lens URL");
          toast.success("Applied studio photo!");
          onClose();
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, onSelectImage, onClose]);

  // Drag and drop image files directly onto modal
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      try {
        const dataUrl = await readFile(file);
        onSelectImage(dataUrl, file.name);
        toast.success("Applied dropped garment photo!");
        onClose();
      } catch (err) {
        toast.error("Failed to read dropped image file");
      }
    }
  };

  const handleLaunchGoogleLens = async () => {
    if (!currentImage) return;
    setLensOpening(true);
    try {
      toast.info("Opening Google Lens with your garment photo...");
      const res = await searchInGoogleLens(currentImage);
      if (res.clipboardCopied) {
        toast.success(
          "Garment photo copied to clipboard! In Google Lens, press ⌘V / Ctrl+V to search immediately."
        );
      } else {
        toast.success("Opened Google Lens!");
      }
    } catch (err) {
      console.error("Google Lens launch failed:", err);
      toast.error("Could not launch Google Lens");
    } finally {
      setLensOpening(false);
    }
  };

  const handleSelect = async (imgUrl: string, title?: string) => {
    setDownloading(imgUrl);
    try {
      const proxyRes = await api.lens.proxy(imgUrl);
      onSelectImage(proxyRes.dataUrl, title);
      toast.success("Applied clean studio photo!");
      onClose();
    } catch (err) {
      console.warn("Direct proxy failed, using image URL directly:", err);
      onSelectImage(imgUrl, title);
      toast.success("Applied studio photo!");
      onClose();
    } finally {
      setDownloading(null);
    }
  };

  const handleApplyUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      toast.error("Please enter a valid https image URL");
      return;
    }
    setUrlBusy(true);
    try {
      const proxyRes = await api.lens.proxy(url);
      onSelectImage(proxyRes.dataUrl);
      toast.success("Applied photo from URL!");
      onClose();
    } catch {
      onSelectImage(url);
      toast.success("Applied photo from URL!");
      onClose();
    } finally {
      setUrlBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Visual Image Search & Lens Matching"
      title="Search product by garment image"
      wide
    >
      <div
        className="space-y-6"
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Source Garment & Google Lens Primary Action Bar */}
        {currentImage && (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-background p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background p-1.5 flex items-center justify-center shadow-xs">
                  <img src={currentImage} alt="Search source" className="size-full object-contain" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F26A4B]/10 px-2 py-0.5 text-[10px] font-medium text-[#F26A4B]">
                      <Sparkles className="size-2.5" /> Visual Photo Match
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-medium tracking-tight text-foreground truncate">
                    {visualTitle || "Reverse search this piece"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Matches cut, texture, fabric weave, and color tone
                  </p>
                </div>
              </div>

              {/* Action Buttons: Google Lens Search & Download */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleLaunchGoogleLens}
                  disabled={lensOpening}
                  className="gap-2 bg-[#F26A4B] text-white hover:bg-[#E05A3B] shadow-xs active:scale-95 transition-all font-medium text-xs px-4 py-2"
                >
                  {lensOpening ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Globe className="size-3.5" />
                  )}
                  <span>Search on Google Lens</span>
                  <ArrowUpRight className="size-3.5 opacity-80" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Download image to drag onto Google Lens"
                  onClick={() => downloadGarmentImage(currentImage, "garment-piece.jpg")}
                  className="gap-1.5 text-xs border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 px-3.5 py-2 text-xs text-muted-foreground border border-border/50">
              <ClipboardPaste className="size-3.5 text-[#F26A4B] shrink-0" />
              <span>
                <strong>Quick Workflow:</strong> Click &quot;Search on Google Lens&quot; above. When Google Lens opens, press <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘V</kbd> to search immediately. Right-click any match, choose &quot;Copy Image&quot;, and press <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘V</kbd> here!
              </span>
            </div>
          </div>
        )}

        {/* Drag and Drop Zone Overlay indicator */}
        {isDragging && (
          <div className="rounded-xl border-2 border-dashed border-primary bg-primary/10 p-8 text-center text-sm font-medium text-primary">
            Drop your studio product photo here to apply immediately!
          </div>
        )}

        {/* Search Refinement Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            void performTextSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. vintage navy denim jacket product flat lay"
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" disabled={loading} variant="outline" className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Refine
          </Button>
        </form>

        {/* Studio Product Catalog Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3 text-[#F26A4B]" />
              Matching Studio Flat-Lay Photos
            </h5>
            <span className="text-[11px] text-muted-foreground">
              {results.length} clean product options
            </span>
          </div>

          <div className="min-h-[240px] max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Scanning visual features & locating catalog flat lays…</p>
                <p className="text-xs text-muted-foreground">Matching fabric texture, color palette, and cut</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground space-y-3">
                <Globe className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No direct catalog photos returned</p>
                <Button
                  size="sm"
                  onClick={handleLaunchGoogleLens}
                  className="gap-2 bg-[#F26A4B] text-white hover:bg-[#E05A3B]"
                >
                  <Globe className="size-3.5" />
                  Search with Google Lens
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {results.map((r, idx) => (
                  <button
                    type="button"
                    key={idx}
                    disabled={downloading !== null}
                    onClick={() => handleSelect(r.image, r.title)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-2 text-left transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-background/80 flex items-center justify-center">
                      <img
                        src={r.thumbnail || r.image}
                        alt={r.title}
                        loading="lazy"
                        className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                      />
                      {downloading === r.image && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                          <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 min-w-0">
                      <p className="truncate text-[11px] font-medium text-foreground group-hover:text-primary">
                        {r.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Sparkles className="size-2.5 text-[#F26A4B]" /> Clean Flat-Lay
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paste Direct Image URL or Drop Helper */}
        <form onSubmit={handleApplyUrl} className="flex items-center gap-2 border-t border-border pt-4">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="url"
              placeholder="Or paste image URL found on Google Lens..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={urlBusy || !urlInput.trim()}>
            {urlBusy ? <Loader2 className="size-3.5 animate-spin" /> : "Apply URL"}
          </Button>
        </form>

        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
