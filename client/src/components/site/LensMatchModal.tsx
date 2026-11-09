import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Check, Globe, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface LensMatchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery: string;
  currentImage?: string;
  onSelectImage: (imageDataUrl: string, title?: string) => void;
}

export function LensMatchModal({
  open,
  onClose,
  initialQuery,
  currentImage,
  onSelectImage,
}: LensMatchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{ title: string; thumbnail: string; image: string; source: string }>
  >([]);

  const performSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await api.lens.search(q);
      setResults(res.results || []);
      if (!res.results || res.results.length === 0) {
        toast.info("No matching studio photos found. Try a simpler keyword.");
      }
    } catch (err) {
      console.error("Lens search error:", err);
      toast.error("Failed to search web for studio images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      void performSearch(initialQuery);
    }
  }, [open, initialQuery]);

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

  const handleQuickTag = (tag: string) => {
    const newQuery = `${query.replace(/\s*(flat lay|studio|white backdrop|clean)\s*/gi, "").trim()} ${tag}`;
    setQuery(newQuery);
    void performSearch(newQuery);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Google Lens & Web Match"
      title="Find clean studio photo"
      wide
    >
      <div className="space-y-5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Search the web for clean e-commerce catalog photos with plain studio backdrops to replace your camera photo.
        </p>

        {/* Search bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            void performSearch(query);
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
            Search
          </Button>
        </form>

        {/* Quick refinement pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono text-[10px] uppercase text-muted-foreground mr-1">Refine:</span>
          {["flat lay", "white background", "studio shot", "minimal catalog"].map(tag => (
            <button
              type="button"
              key={tag}
              onClick={() => handleQuickTag(tag)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            >
              +{tag}
            </button>
          ))}
        </div>

        {/* Gallery Results */}
        <div className="min-h-[280px] max-h-[460px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Searching web catalogs for matching studio pieces…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
              <Globe className="size-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No results found for this query</p>
              <p className="text-xs">Try adjusting the garment name, type, or color in the search bar above.</p>
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

        <div className="flex justify-end border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
