import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { api, getSavedGeminiKey } from "@/lib/api";
import { createFastThumbnail, readFile } from "@/lib/imaging";
import {
  Check,
  Download,
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

const QUICK_FILTERS = [
  "Shorts",
  "Jeans",
  "Trousers",
  "Skirt",
  "T-Shirt",
  "Shirt",
  "Hoodie",
  "Jacket",
  "Dress",
];

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
      console.error("Text search error:", err);
      toast.error("Failed to search studio images");
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

  // Global paste listener: user can paste an image or image URL from clipboard
  useEffect(() => {
    if (!open) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              try {
                const dataUrl = await readFile(file);
                onSelectImage(dataUrl, "Pasted image");
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

      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\/.+\.(png|jpg|jpeg|webp|avif)/i.test(text)) {
        e.preventDefault();
        try {
          const proxyRes = await api.lens.proxy(text);
          onSelectImage(proxyRes.dataUrl, "Pasted from URL");
          toast.success("Applied studio photo from copied URL!");
          onClose();
        } catch {
          onSelectImage(text, "Pasted from URL");
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
      eyebrow="In-App Studio Matcher"
      title="Match with clean studio product photo"
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
        {/* Source Garment Header */}
        {currentImage && (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-background p-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-background p-1.5 flex items-center justify-center shadow-xs">
                <img src={currentImage} alt="Your worn garment" className="size-full object-contain" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F26A4B]/10 px-2 py-0.5 text-[10px] font-medium text-[#F26A4B]">
                    <Sparkles className="size-2.5" /> Studio Catalog Search
                  </span>
                </div>
                <h4 className="font-serif text-base font-medium tracking-tight text-foreground truncate">
                  {visualTitle || query || "Clean Product Flat-Lay Matches"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Select any clean flat-lay photo below to catalogue this piece with crisp studio imagery.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drag and Drop Zone Overlay indicator */}
        {isDragging && (
          <div className="rounded-xl border-2 border-dashed border-primary bg-primary/10 p-8 text-center text-sm font-medium text-primary">
            Drop your studio product photo here to apply immediately!
          </div>
        )}

        {/* Search Refinement & Quick Category Filters */}
        <div className="space-y-2.5">
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
                placeholder="e.g. olive cargo shorts, black pleated skirt, white crewneck tee"
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit" disabled={loading} variant="outline" className="gap-1.5">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Search
            </Button>
          </form>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-muted-foreground mr-1">Filter:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setQuery(f.toLowerCase());
                  void performTextSearch(f.toLowerCase());
                }}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-all active:scale-95"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

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

          <div className="min-h-[260px] max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Scanning catalog & locating clean studio photos…</p>
                <p className="text-xs text-muted-foreground">Matching garment cut, category, and color palette</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground space-y-3">
                <ImageIcon className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No direct catalog photos returned for this query</p>
                <p className="text-xs text-muted-foreground">Try clicking one of the category buttons above like Shorts, Skirt, or T-Shirt</p>
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
                        <Sparkles className="size-2.5 text-[#F26A4B]" /> Click to Apply
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paste Direct Image URL */}
        <form onSubmit={handleApplyUrl} className="flex items-center gap-2 border-t border-border pt-4">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="url"
              placeholder="Or paste any garment image URL from the web..."
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
