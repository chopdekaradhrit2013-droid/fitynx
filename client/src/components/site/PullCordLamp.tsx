import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import * as React from "react";

function playSwitchClick() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    /* AudioContext not allowed before user gesture or unavailable */
  }
}

interface PullCordLampProps {
  className?: string;
  showTooltip?: boolean;
}

export function PullCordLamp({ className, showTooltip = true }: PullCordLampProps) {
  const { theme, toggleTheme } = useTheme();
  const [isPulling, setIsPulling] = React.useState(false);
  const [isSwinging, setIsSwinging] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);

  const isLight = theme === "light";

  const handlePull = () => {
    setIsPulling(false);
    setIsSwinging(false);

    // Force animation restart
    window.requestAnimationFrame(() => {
      setIsSwinging(true);
    });

    playSwitchClick();
    setHasInteracted(true);

    // Toggle theme with tiny realistic latch delay
    window.setTimeout(() => {
      toggleTheme();
    }, 90);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col items-center select-none group/lamp",
        className
      )}
      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))" }}
    >
      {/* The Hanging Cord from Ceiling */}
      <div
        className={cn(
          "w-[1.5px] transition-colors duration-300",
          isLight ? "bg-[#333]" : "bg-[#888]",
          "h-[42px] sm:h-[54px]"
        )}
      />

      {/* The Lamp Shade & Glowing Beam */}
      <div className="relative flex flex-col items-center">
        {/* Lamp Dome / Shade */}
        <div
          className={cn(
            "relative z-10 w-[54px] h-[28px] rounded-t-full transition-all duration-400 ease-out",
            isLight
              ? "bg-[#2E2822] shadow-[0_4px_12px_rgba(242,106,75,0.25)] border-b-2 border-[#F26A4B]"
              : "bg-[#1E1E22] shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-b-2 border-white/10"
          )}
        >
          {/* Top brass fastener */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-t-sm bg-[#D4AF37]/80" />
          {/* Subtle interior glow ring */}
          <div
            className={cn(
              "absolute bottom-0 inset-x-1 h-1 rounded-full transition-opacity duration-300",
              isLight ? "bg-[#FFE894] opacity-100" : "bg-transparent opacity-0"
            )}
          />
        </div>

        {/* The Glowing Light Beam (radiates down in Light Mode) */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-[26px] pointer-events-none transition-opacity duration-400 z-0",
            isLight ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: 0,
            height: 0,
            borderLeft: "65px solid transparent",
            borderRight: "65px solid transparent",
            borderBottom: "220px solid rgba(255, 222, 110, 0.22)",
            transformOrigin: "top center",
          }}
        />

        {/* The Interactive Pull String */}
        <div
          id="lampToggle"
          role="button"
          tabIndex={0}
          aria-label={`Pull cord to switch to ${isLight ? "dark" : "light"} mode`}
          title={`Pull cord for ${isLight ? "Dark" : "Light"} mode`}
          onPointerDown={() => setIsPulling(true)}
          onPointerUp={handlePull}
          onPointerLeave={() => setIsPulling(false)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePull();
            }
          }}
          className={cn(
            "absolute top-[26px] right-[-10px] z-20 cursor-pointer flex flex-col items-center",
            isSwinging && "lamp-swing"
          )}
          style={{ transformOrigin: "top center" }}
        >
          {/* String Line (stretches on pull) */}
          <div
            className={cn(
              "w-[1.5px] transition-[height] duration-100 ease-out",
              isLight ? "bg-[#666]" : "bg-[#AAA]",
              isPulling ? "h-[64px]" : "h-[46px] sm:h-[52px]"
            )}
          />

          {/* The Pull Bead Handle */}
          <div
            className={cn(
              "relative size-3 rounded-full transition-transform duration-100 shadow-md",
              "bg-[#F26A4B] active:scale-125 hover:scale-110",
              isPulling && "translate-y-1 scale-125"
            )}
          >
            {/* Tiny brass ring at bottom of bead */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-[#E5C158]" />
          </div>

          {/* Tooltip on hover if not interacted yet */}
          {showTooltip && !hasInteracted && (
            <span className="pointer-events-none absolute left-5 top-8 whitespace-nowrap rounded-md border border-border bg-card/95 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground shadow-md opacity-0 group-hover/lamp:opacity-100 transition-opacity">
              Pull cord
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
