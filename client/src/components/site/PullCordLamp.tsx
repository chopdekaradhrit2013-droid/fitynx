import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import * as React from "react";

// Synthesize authentic photography studio flash capacitor & shutter click
function playStudioClick() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 1. Shutter blade release click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);

    // 2. High frequency electrical capacitor pop
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "triangle";
    pop.frequency.setValueAtTime(1800, ctx.currentTime + 0.015);
    pop.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.05);
    popGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.015);
    popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    pop.start(ctx.currentTime + 0.015);
    pop.stop(ctx.currentTime + 0.06);
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
  const [isFlashing, setIsFlashing] = React.useState(false);

  const isLight = theme === "light";

  const handlePull = () => {
    setIsPulling(false);
    setIsSwinging(false);

    // Trigger realistic flash strobe pulse
    setIsFlashing(true);
    window.setTimeout(() => setIsFlashing(false), 160);

    // Force swing animation restart
    window.requestAnimationFrame(() => {
      setIsSwinging(true);
    });

    playStudioClick();
    setHasInteracted(true);

    // Toggle theme synchronized with studio latch
    window.setTimeout(() => {
      toggleTheme();
    }, 100);
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col items-center select-none group/studio-light",
        className
      )}
      style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.18))" }}
    >
      {/* 1. Ceiling Mounting Bracket & Rigging Clamp */}
      <div className="flex flex-col items-center">
        {/* Ceiling track clamp */}
        <div className="w-5 h-2 rounded-xs bg-[#222] dark:bg-[#444] border-b border-black/30 shadow-xs" />
        {/* Industrial suspension rod & safety cable */}
        <div className="relative w-[2px] h-[36px] sm:h-[46px] bg-[#333] dark:bg-[#666]">
          {/* Cable tension collar */}
          <div className="absolute top-1/2 -left-1 w-2.5 h-1 rounded-xs bg-[#555] dark:bg-[#777]" />
        </div>
      </div>

      {/* 2. Photo Studio Monolight / Strobe Body with Barn Doors */}
      <div className="relative flex flex-col items-center">
        {/* Studio U-Yoke Pivot Bracket */}
        <div className="relative flex items-center justify-center">
          {/* Left Yoke Arm & Knurled Knob */}
          <div className="absolute -left-3.5 top-1 flex items-center">
            <div className="size-2 rounded-full bg-[#E5C158] border border-black/40 shadow-xs" title="Pan tilt lock" />
            <div className="w-1.5 h-7 bg-[#2A2A2E] rounded-xs" />
          </div>

          {/* Right Yoke Arm & Knurled Knob */}
          <div className="absolute -right-3.5 top-1 flex items-center">
            <div className="w-1.5 h-7 bg-[#2A2A2E] rounded-xs" />
            <div className="size-2 rounded-full bg-[#E5C158] border border-black/40 shadow-xs" title="Pan tilt lock" />
          </div>

          {/* Main Studio Spotlight Housing */}
          <div
            className={cn(
              "relative z-10 w-[58px] h-[34px] rounded-sm transition-all duration-300",
              "bg-gradient-to-b from-[#2A2A2E] to-[#18181A] border border-black/60 shadow-lg",
              isLight && "ring-1 ring-[#F26A4B]/40",
              isFlashing && "brightness-175 scale-[1.02]"
            )}
          >
            {/* Top Cooling Ribs / Vents */}
            <div className="absolute top-1 inset-x-2 flex justify-between gap-1 opacity-60">
              <div className="h-0.5 w-full bg-[#444] rounded-full" />
              <div className="h-0.5 w-full bg-[#444] rounded-full" />
              <div className="h-0.5 w-full bg-[#444] rounded-full" />
            </div>

            {/* Rear Status LED (Studio Ready Indicator) */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <span
                className={cn(
                  "size-1.5 rounded-full transition-all duration-300",
                  isLight
                    ? "bg-[#10B981] shadow-[0_0_6px_#10B981]"
                    : "bg-[#EF4444] shadow-[0_0_4px_#EF4444]"
                )}
                title={isLight ? "Studio Strobe: LIVE" : "Studio Strobe: STANDBY"}
              />
              <span className="font-mono text-[7px] uppercase tracking-tighter text-[#888]">
                {isLight ? "ON" : "OFF"}
              </span>
            </div>

            {/* Studio Fresnel Lens (Emits soft amber beam when active) */}
            <div
              className={cn(
                "absolute -bottom-1.5 inset-x-1.5 h-3 rounded-b-md border transition-all duration-300 flex items-center justify-center",
                isLight
                  ? "bg-gradient-to-r from-[#FFE894] via-[#FFF5D0] to-[#FFE894] border-[#E5C158] shadow-[0_4px_16px_rgba(255,230,120,0.6)]"
                  : "bg-[#252528] border-black/50"
              )}
            >
              {/* Concentric fresnel glass rings */}
              <div
                className={cn(
                  "size-2 rounded-full border border-black/20 transition-opacity",
                  isLight ? "opacity-40" : "opacity-15"
                )}
              />
            </div>
          </div>
        </div>

        {/* 3. The 4 Studio Barn Doors (Shaping the lookbook light) */}
        {/* Top Barn Door (tilted up) */}
        <div
          className={cn(
            "absolute -top-3 z-20 w-[48px] h-3.5 bg-[#1B1B1E] border border-black/70 shadow-md",
            "rounded-t-sm transition-transform duration-300 origin-bottom",
            "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-white/10"
          )}
          style={{ transform: "perspective(120px) rotateX(-32deg)" }}
        />

        {/* Bottom Barn Door (tilted down) */}
        <div
          className={cn(
            "absolute -bottom-3.5 z-20 w-[48px] h-3.5 bg-[#1B1B1E] border border-black/70 shadow-md",
            "rounded-b-sm transition-transform duration-300 origin-top",
            "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/10"
          )}
          style={{ transform: "perspective(120px) rotateX(32deg)" }}
        />

        {/* Left Barn Door (tilted outward left) */}
        <div
          className="absolute -left-3 top-2 z-20 w-3 h-[28px] bg-[#1E1E22] border border-black/70 rounded-l-xs shadow-md origin-right"
          style={{ transform: "perspective(120px) rotateY(28deg)" }}
        />

        {/* Right Barn Door (tilted outward right) */}
        <div
          className="absolute -right-3 top-2 z-20 w-3 h-[28px] bg-[#1E1E22] border border-black/70 rounded-r-xs shadow-md origin-left"
          style={{ transform: "perspective(120px) rotateY(-28deg)" }}
        />

        {/* 4. Radiant Studio Spotlight Cone Beam (Shoots downward onto your wardrobe in Light Mode) */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute top-[32px] pointer-events-none transition-all duration-400 z-0",
            isLight ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: 0,
            height: 0,
            borderLeft: "85px solid transparent",
            borderRight: "85px solid transparent",
            borderBottom: "250px solid rgba(255, 230, 140, 0.22)",
            transformOrigin: "top center",
            filter: "blur(4px)",
          }}
        />

        {/* 5. The Studio Grip Pull Cord with Atelier Fabric Tag */}
        <div
          id="lampToggle"
          role="button"
          tabIndex={0}
          aria-label={`Pull studio cord to switch to ${isLight ? "dark" : "light"} mode`}
          title={`Pull studio cord for ${isLight ? "Dark" : "Light"} mode`}
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
            "absolute top-[30px] -right-4.5 z-30 cursor-pointer flex flex-col items-center",
            isSwinging && "lamp-swing"
          )}
          style={{ transformOrigin: "top center" }}
        >
          {/* Metallic Studio Bead Chain (stretches visually when pulled) */}
          <div
            className={cn(
              "w-[1.5px] transition-[height] duration-75 ease-out flex flex-col items-center justify-between",
              isLight ? "bg-[#555]" : "bg-[#888]",
              isPulling ? "h-[74px]" : "h-[54px] sm:h-[62px]"
            )}
          >
            {/* Tiny ball chain links */}
            <span className="size-1 rounded-full bg-[#999] -my-0.5" />
            <span className="size-1 rounded-full bg-[#999] -my-0.5" />
            <span className="size-1 rounded-full bg-[#999] -my-0.5" />
            <span className="size-1 rounded-full bg-[#999] -my-0.5" />
          </div>

          {/* Studio Garment / Shutter Tag Pull Handle */}
          <div
            className={cn(
              "relative flex items-center justify-center transition-all duration-100",
              "px-1.5 py-1 rounded-xs border shadow-md",
              "bg-[#FAF8F5] text-[#1E1E1E] border-[#D2CBBB] dark:bg-[#252528] dark:text-[#EAEAEA] dark:border-[#3E3E44]",
              "hover:scale-110 active:scale-95 active:translate-y-1.5",
              isPulling && "translate-y-1 scale-105"
            )}
          >
            {/* Tag Brass Eyelet Ring */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-2 rounded-full border border-black/40 bg-[#D4AF37] shadow-xs" />

            {/* Tag Content: Studio Camera / Light Monogram */}
            <div className="flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider uppercase">
              <span className="size-1.5 rounded-full bg-[#F26A4B]" />
              <span>{isLight ? "LIGHT" : "DARK"}</span>
            </div>
          </div>

          {/* Hover Studio Tooltip */}
          {showTooltip && !hasInteracted && (
            <span className="pointer-events-none absolute left-7 top-10 whitespace-nowrap rounded-md border border-border bg-card/95 backdrop-blur-xs px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground shadow-lg opacity-0 group-hover/studio-light:opacity-100 transition-opacity">
              Pull studio light
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
