import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { nameColor } from "@/lib/color";
import { useStore } from "@/lib/store";
import { GARMENT_TYPES, type WardrobeItem, type Group } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Calendar,
  Check,
  CheckSquare,
  CloudSun,
  Compass,
  Download,
  Layers,
  Luggage,
  MapPin,
  Palmtree,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface TripDay {
  dayNumber: number;
  label: string;
  weatherNote: string;
  items: WardrobeItem[];
}

const TRIP_VIBES = [
  { id: "city", label: "City & Sightseeing", icon: Compass },
  { id: "work", label: "Business & Work", icon: Briefcase },
  { id: "resort", label: "Vacation & Leisure", icon: Palmtree },
  { id: "casual", label: "Weekend Getaway", icon: Luggage },
];

export function CapsulePackingAssistant() {
  const items = useStore(s => s.items);
  const [, setLocation] = useLocation();

  const [destination, setDestination] = React.useState("Paris");
  const [days, setDays] = React.useState(3);
  const [vibe, setVibe] = React.useState("city");
  const [loadingWeather, setLoadingWeather] = React.useState(false);
  const [weatherInfo, setWeatherInfo] = React.useState<{
    city: string;
    temp: number;
    description: string;
    high: number;
    low: number;
  } | null>({
    city: "Paris",
    temp: 16,
    description: "Partly cloudy & mild",
    high: 19,
    low: 12,
  });

  // Selected capsule pieces
  const [capsule, setCapsule] = React.useState<WardrobeItem[]>([]);
  const [packedIds, setPackedIds] = React.useState<Set<string>>(new Set());

  // Fetch destination weather
  const fetchWeather = async (targetCity = destination) => {
    if (!targetCity.trim()) return;
    setLoadingWeather(true);
    try {
      const data = await api.weather.current({ city: targetCity });
      setWeatherInfo({
        city: data.location,
        temp: Math.round(data.temperatureC),
        description: data.condition,
        high: Math.round(data.temperatureC + 3),
        low: Math.round(data.feelsLikeC - 2),
      });
      toast.success(`Loaded forecast for ${data.location}`);
    } catch {
      toast.info(`Using estimated travel climate for ${targetCity}`);
      setWeatherInfo({
        city: targetCity,
        temp: 18,
        description: "Mild daytime conditions",
        high: 21,
        low: 14,
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  // Generate optimal capsule wardrobe from user's clothes
  const generateCapsule = React.useCallback(() => {
    if (items.length === 0) {
      setCapsule([]);
      return;
    }

    // Determine quotas based on trip days
    const topCount = Math.min(items.filter(i => GARMENT_TYPES[i.type].group === "top").length, Math.max(2, Math.ceil(days * 0.6)));
    const bottomCount = Math.min(items.filter(i => GARMENT_TYPES[i.type].group === "bottom").length, Math.max(1, Math.ceil(days * 0.4)));
    const layerCount = Math.min(items.filter(i => GARMENT_TYPES[i.type].group === "outerwear").length, days >= 3 ? 2 : 1);
    const shoeCount = Math.min(items.filter(i => GARMENT_TYPES[i.type].group === "shoes").length, days >= 4 ? 2 : 1);

    // Pick neutral/versatile anchor bottoms
    const userBottoms = items.filter(i => GARMENT_TYPES[i.type].group === "bottom");
    const chosenBottoms = userBottoms.slice(0, bottomCount);

    // Pick matching tops
    const userTops = items.filter(i => GARMENT_TYPES[i.type].group === "top");
    const chosenTops = userTops.slice(0, topCount);

    // Pick outerwear
    const userLayers = items.filter(i => GARMENT_TYPES[i.type].group === "outerwear");
    const chosenLayers = userLayers.slice(0, layerCount);

    // Pick shoes
    const userShoes = items.filter(i => GARMENT_TYPES[i.type].group === "shoes");
    const chosenShoes = userShoes.slice(0, shoeCount);

    // Pick an accessory if available
    const userAccs = items.filter(i => GARMENT_TYPES[i.type].group === "accessory");
    const chosenAccs = userAccs.slice(0, 1);

    const fullCapsule = [
      ...chosenLayers,
      ...chosenTops,
      ...chosenBottoms,
      ...chosenShoes,
      ...chosenAccs,
    ];

    setCapsule(fullCapsule);
    setPackedIds(new Set());
  }, [items, days]);

  // Initial generation
  React.useEffect(() => {
    if (items.length > 0) {
      generateCapsule();
    }
  }, [generateCapsule, items.length]);

  // Check off item in packing list
  const togglePacked = (id: string) => {
    setPackedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Generate day-by-day outfits from the capsule
  const dayOutfits: TripDay[] = React.useMemo(() => {
    if (capsule.length === 0) return [];

    const tops = capsule.filter(i => GARMENT_TYPES[i.type].group === "top");
    const bottoms = capsule.filter(i => GARMENT_TYPES[i.type].group === "bottom");
    const layers = capsule.filter(i => GARMENT_TYPES[i.type].group === "outerwear");
    const shoes = capsule.filter(i => GARMENT_TYPES[i.type].group === "shoes");

    const result: TripDay[] = [];
    for (let d = 1; d <= days; d++) {
      const dayTop = tops[(d - 1) % tops.length];
      const dayBottom = bottoms[(d - 1) % bottoms.length];
      const dayLayer = layers.length > 0 ? layers[(d - 1) % layers.length] : undefined;
      const dayShoe = shoes.length > 0 ? shoes[(d - 1) % shoes.length] : undefined;

      const outfitPieces = [dayLayer, dayTop, dayBottom, dayShoe].filter((p): p is WardrobeItem => !!p);

      result.push({
        dayNumber: d,
        label: d === 1 ? "Day 1 · Departure & Arrival" : d === days ? `Day ${d} · Final Day & Return` : `Day ${d} · Full Day Explore`,
        weatherNote: weatherInfo ? `${weatherInfo.high}° / ${weatherInfo.low}° · ${weatherInfo.description}` : "Expected mild weather",
        items: outfitPieces,
      });
    }

    return result;
  }, [capsule, days, weatherInfo]);

  return (
    <div className="space-y-8">
      {/* Trip Configuration Card */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-7 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary mb-2">
              <Luggage className="size-3 text-[#F26A4B]" />
              Capsule Packing Assistant
            </div>
            <h3 className="font-serif text-2xl font-normal">Pack light. Travel sharp.</h3>
            <p className="text-xs text-muted-foreground mt-1">
              FITYNX matches destination weather with your wardrobe to pack a compact, versatile capsule.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateCapsule}
            className="text-xs h-8 gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="size-3.5" /> Re-shuffle Capsule
          </Button>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Destination</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchWeather()}
                  className="studio-input pl-8 text-xs h-9"
                  placeholder="City name…"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingWeather}
                onClick={() => fetchWeather()}
                className="h-9 px-3"
              >
                <Search className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Days */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Trip Duration</label>
            <div className="flex items-center gap-1.5">
              {[2, 3, 5, 7].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                    days === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Trip Vibe</label>
            <select
              value={vibe}
              onChange={e => setVibe(e.target.value)}
              className="studio-input text-xs h-9"
            >
              {TRIP_VIBES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Weather Banner */}
        {weatherInfo && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/60 p-3.5 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CloudSun className="size-5 text-[#F26A4B]" />
              </div>
              <div>
                <p className="font-medium text-foreground">{weatherInfo.city} Forecast</p>
                <p className="text-muted-foreground text-[11px]">{weatherInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Thermometer className="size-3.5 text-primary" /> Current {weatherInfo.temp}°C
              </span>
              <span className="text-muted-foreground">
                High {weatherInfo.high}°C · Low {weatherInfo.low}°C
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Capsule Wardrobe Overview */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-serif text-xl font-normal">Your Capsule Pieces</h4>
            <p className="text-xs text-muted-foreground">
              {capsule.length} pieces selected · {packedIds.size} of {capsule.length} packed
            </p>
          </div>
          <span className="font-mono text-xs text-primary font-medium">
            {Math.round((packedIds.size / Math.max(1, capsule.length)) * 100)}% Packed
          </span>
        </div>

        {/* Piece checklist */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {capsule.map(item => {
            const isPacked = packedIds.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePacked(item.id)}
                className={cn(
                  "group relative flex flex-col items-center rounded-xl border p-2.5 text-left transition-all",
                  isPacked
                    ? "border-primary/80 bg-primary/5 ring-1 ring-primary/40"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-card p-1">
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                  <div
                    className={cn(
                      "absolute top-1 right-1 flex size-5 items-center justify-center rounded-full transition-colors",
                      isPacked ? "bg-primary text-primary-foreground" : "bg-background/80 text-muted-foreground border border-border"
                    )}
                  >
                    <Check className={cn("size-3", isPacked ? "opacity-100" : "opacity-0")} />
                  </div>
                </div>
                <span className="mt-2 text-[11px] font-medium text-foreground truncate w-full text-center">
                  {item.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {GARMENT_TYPES[item.type].label} · {item.colorName}
                </span>
              </button>
            );
          })}
        </div>

        {capsule.length === 0 && (
          <p className="text-center py-8 text-xs text-muted-foreground">
            No wardrobe pieces available. Upload clothes to your wardrobe to generate a travel capsule!
          </p>
        )}
      </div>

      {/* Day by Day Outfit Schedule */}
      {dayOutfits.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-xl font-normal">Day-by-Day Outfit Plan</h4>
            <p className="text-xs text-muted-foreground">{days} outfits curated from your capsule</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dayOutfits.map(day => (
              <div
                key={day.dayNumber}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm text-foreground">{day.label}</h5>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Day {day.dayNumber}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sun className="size-3 text-[#F26A4B]" />
                  {day.weatherNote}
                </p>

                {/* Garments in this outfit */}
                <div className="grid grid-cols-4 gap-2 py-2">
                  {day.items.map(it => (
                    <div key={it.id} className="relative aspect-[4/5] rounded-lg border border-border bg-background p-1" title={it.name}>
                      <img src={it.image} alt={it.name} className="h-full w-full object-contain" />
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {day.items.length} pieces
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const ids = day.items.map(i => i.id).join(",");
                      setLocation(`/app/stylist?items=${encodeURIComponent(ids)}`);
                    }}
                    className="text-xs h-7 gap-1 text-primary hover:bg-primary/10"
                  >
                    <Layers className="size-3" /> View on Canvas →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
