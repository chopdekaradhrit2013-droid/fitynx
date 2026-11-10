import { X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, eyebrow, children, wide }: { open: boolean; onClose: () => void; title: string; eyebrow?: string; children: React.ReactNode; wide?: boolean }) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Only focus the dialog container if nothing inside already has focus
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px] animate-modal-backdrop"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl outline-none md:rounded-2xl animate-modal-sheet",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 md:p-6">
          <div>
            {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>}
            <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em] md:text-3xl">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 md:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
