import { Button } from "@/components/ui/button";
import { api, getSavedGeminiKey } from "@/lib/api";
import { useStore } from "@/lib/store";
import { GARMENT_TYPES, type WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bot,
  Layers,
  Loader2,
  Send,
  Shirt,
  Sparkles,
  User,
  X,
} from "lucide-react";
import * as React from "react";
import { useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  recommendedLook?: { title: string; itemIds: string[] };
}

const STARTER_PROMPTS = [
  "What should I wear for dinner tonight?",
  "Give me an elevated casual look.",
  "How should I layer for mild weather?",
  "What colors go best with my trousers?",
];

interface AiStylistDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AiStylistDrawer({ open, onClose }: AiStylistDrawerProps) {
  const items = useStore(s => s.items);
  const [, setLocation] = useLocation();

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "initial",
      role: "model",
      text: "Hello! I am your personal FITYNX Stylist. I have reviewed all the pieces in your digital wardrobe. Ask me what to wear for any occasion, get color theory advice, or let me compose a look for you!",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleSend = async (userPrompt = input) => {
    const text = userPrompt.trim();
    if (!text || busy) return;

    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const apiKey = getSavedGeminiKey() || undefined;
      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const res = await api.ai.chat({
        message: text,
        history,
        items,
        apiKey,
      });

      const modelMsg: Message = {
        id: `m_${Date.now()}`,
        role: "model",
        text: res.reply,
        recommendedLook: res.recommendedLook,
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: err instanceof Error ? err.message : "Sorry, I had trouble styling right now. Please check your Gemini API key in Settings.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  // Helper to parse [item:id] tags into visual cards
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(\[item:[a-zA-Z0-9_-]+\])/g);
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap leading-relaxed">
          {parts.map((part, index) => {
            const match = part.match(/^\[item:([a-zA-Z0-9_-]+)\]$/);
            if (match) {
              const itemId = match[1];
              const garment = items.find(i => i.id === itemId);
              if (garment) {
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/90 px-2 py-0.5 mx-1 my-0.5 align-middle shadow-xs text-xs"
                  >
                    {garment.image ? (
                      <img src={garment.image} alt="" className="size-4 rounded-xs object-contain" />
                    ) : (
                      <i className="size-2.5 rounded-full" style={{ backgroundColor: garment.colorHex }} />
                    )}
                    <span className="font-medium text-foreground">{garment.name}</span>
                  </span>
                );
              }
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
          })}
        </p>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-4 text-[#F26A4B]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium leading-none">AI Stylist</h3>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                Powered by Gemini · {items.length} pieces loaded
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col gap-1.5 max-w-[88%]",
                m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {m.role === "user" ? (
                  <>You <User className="size-2.5" /></>
                ) : (
                  <><Bot className="size-2.5 text-[#F26A4B]" /> FITYNX Stylist</>
                )}
              </div>

              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm shadow-xs",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : "border border-border bg-card text-card-foreground rounded-tl-xs"
                )}
              >
                {renderMessageContent(m.text)}

                {/* Recommended Look Preview Card */}
                {m.recommendedLook && (
                  <div className="mt-3 rounded-xl border border-border/80 bg-background/80 p-3 space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[#F26A4B]">
                      Curated Outfit
                    </p>
                    <p className="font-serif text-sm font-medium">{m.recommendedLook.title}</p>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {m.recommendedLook.itemIds.map(id => {
                        const it = items.find(i => i.id === id);
                        if (!it) return null;
                        return (
                          <div key={id} className="size-12 shrink-0 rounded-lg border border-border bg-card p-1">
                            <img src={it.image} alt={it.name} className="h-full w-full object-contain" />
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        onClose();
                        const ids = m.recommendedLook!.itemIds.join(",");
                        setLocation(`/app/stylist?items=${encodeURIComponent(ids)}`);
                      }}
                      className="w-full text-xs h-7 gap-1.5"
                    >
                      <Layers className="size-3" /> Assemble on Canvas →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground mr-auto">
              <Loader2 className="size-3.5 animate-spin text-[#F26A4B]" />
              <span>Stylist is reviewing your closet…</span>
            </div>
          )}
        </div>

        {/* Starter Chips (shown when only 1-2 messages) */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Quick style briefs:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-border p-3 bg-card/60">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your stylist anything about your clothes…"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
            <Button
              type="submit"
              size="sm"
              disabled={busy || !input.trim()}
              className="size-9 rounded-xl p-0 shrink-0"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
