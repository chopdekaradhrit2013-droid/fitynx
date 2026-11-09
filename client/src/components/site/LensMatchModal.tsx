import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { api, getSavedGeminiKey } from "@/lib/api";
import { createFastThumbnail } from "@/lib/imaging";
import { Check, ExternalLink, Globe, Link2, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
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
  const [lensUrl, setLensUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
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

      if (res.lensUrl) setLensUrl(res.lensUrl);
      if (res.visualTitle) setVisualTitle(res.visualTitle);
      if (res.query) setQuery(res.query);
      setResults(res.results || []);

      if (!res.results || res.results.length === 0) {
        toast.info("Searched Google Lens for image. Click 'Open in Google Lens' to view all visual results.");
      }
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
      eyebrow="Google Lens Visual Search"
      title="Search product by image"
      wide
    >
      <div className="space-y-6">
        {/* Source image header & Google Lens direct action */}
        {currentImage && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center gap-3.5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background p-1 flex items-center justify-center">
                <img src={currentImage} alt="Search source" className="size-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#F26A4B]">
                  Searching by image
                </p>
                <h4 className="truncate font-serif text-base font-normal">
                  {visualTitle || "Reverse searching garment image"}
                </h4>
                <p className="truncate text-xs text-muted-foreground">
                  Google Lens analyzes the visual texture, cut, and color
                </p>
              </div>
            </div>

            {lensUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(lensUrl, "_blank", "noopener,noreferrer")}
                className="gap-2 shrink-0 border-[#F26A4B]/40 hover:border-[#F26A4B] text-foreground font-medium"
              >
                <ExternalLink className="size-3.5 text-[#F26A4B]" />
                <span>Open in Google Lens</span>
              </Button>
            )}
          </div>
        )}

        {/* Search bar */}
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
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Refine Search
          </Button>
        </form>

        {/* Gallery Results */}
        <div className="min-h-[260px] max-h-[420px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Scanning garment image with Google Lens…</p>
              <p className="text-xs text-muted-foreground">Analyzing visual features and locating studio product photos</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-muted-foreground space-y-3">
              <Globe className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No direct catalog photos returned yet</p>
              {lensUrl && (
                <Button
                  size="sm"
                  onClick={() => window.open(lensUrl, "_blank", "noopener,noreferrer")}
                  className="gap-2"
                >
                  <ExternalLink className="size-3.5" />
                  View All Matches on Google Lens
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {results.map((r, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={downloading !== null}
                  onClick={() => handleSelect(r.image, r.title)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-2 text-left transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-background/80">
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
                      <Sparkles className="size-2.5 text-[#F26A4B]" /> Clean Studio
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paste direct image URL fallback */}
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

