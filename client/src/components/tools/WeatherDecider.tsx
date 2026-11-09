import * as React from "react";
import { api, type WeatherData } from "@/lib/api";
import { useStore, actions } from "@/lib/store";
import { composeLooks } from "@/lib/stylist";
import { LookCard } from "@/components/site/LookCard";
import { Button } from "@/components/ui/button";
import { Cloud, CloudRain, Loader2, MapPin, RefreshCw, Search, Snowflake, Sun, Thermometer, Wind, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Look } from "@/lib/types";

export function WeatherDecider() {
  const items = useStore(s => s.items);
  const storedLooks = useStore(s => s.looks);

  const [loading, setLoading] = React.useState(true);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [cityInput, setCityInput] = React.useState("");
  const [searchBusy, setSearchBusy] = React.useState(false);
  const [generatedLooks, setGeneratedLooks] = React.useState<Look[]>([]);
  const [composing, setComposing] = React.useState(false);

  // Load weather on mount
  const loadWeather = React.useCallback(async (lat?: number, lon?: number, city?: string) => {
    setLoading(true);
    try {
      const data = await api.weather.current({ lat, lon, city });
      setWeather(data);
    } catch (err) {
      console.error("Failed to load weather:", err);
      // Fallback default
      try {
        const fallback = await api.weather.current({ city: "London" });
        setWeather(fallback);
      } catch {
        toast.error("Could not load weather data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          loadWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Denied or unavailable, use auto default
          loadWeather();
        },
        { timeout: 7000 }
      );
    } else {
      loadWeather();
    }
  }, [loadWeather]);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setSearchBusy(true);
    try {
      await loadWeather(undefined, undefined, cityInput.trim());
      setCityInput("");
    } finally {
      setSearchBusy(false);
    }
  };

  const handleComposeForWeather = () => {
    if (!weather) return;
    setComposing(true);
    setTimeout(() => {
      const brief = {
        occasion: "Everyday",
        vibe: "polished" as const,
        weather: weather.category,
        colors: "",
        note: `Optimized for ${weather.temperatureC}°C, ${weather.condition}`,
      };
      const { looks } = composeLooks(items, brief);
      if (looks.length > 0) {
        actions.setLooks(looks);
        setGeneratedLooks(looks);
        toast.success(`Generated ${looks.length} looks optimized for ${weather.location}`);
      } else {
        toast.info("Add more items to your wardrobe to compose complete weather outfits.");
      }
      setComposing(false);
    }, 400);
  };

  const getWeatherIcon = (cond: string, isRain: boolean, isSnow: boolean) => {
    if (isSnow) return <Snowflake className="size-8 text-sky-300" />;
    if (isRain) return <CloudRain className="size-8 text-blue-400" />;
    if (cond.toLowerCase().includes("clear") || cond.toLowerCase().includes("sun")) {
      return <Sun className="size-8 text-amber-400" />;
    }
    return <Cloud className="size-8 text-stone-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Weather Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/20 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              <MapPin className="size-3.5 text-[#F26A4B]" />
              <span>{weather ? weather.location : "Detecting local climate..."}</span>
            </div>
            <h3 className="font-serif text-3xl font-normal tracking-tight md:text-4xl">
              {weather ? `${weather.temperatureC}°C · ${weather.condition}` : "Loading Weather..."}
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {weather?.summary || "Fetching live meteorological conditions to calculate optimal layering."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {weather && (
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-sm">
                {getWeatherIcon(weather.condition, weather.isRain, weather.isSnow)}
                <div>
                  <div className="text-xl font-semibold">{weather.temperatureC}°C <span className="text-xs font-normal text-muted-foreground">({weather.temperatureF}°F)</span></div>
                  <div className="text-xs text-muted-foreground">Feels like {weather.feelsLikeC}°C</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Weather Metrics */}
        {weather && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-5 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Thermometer className="size-3.5 text-[#F26A4B]" />
              <span>Category: <strong className="font-medium text-foreground capitalize">{weather.category}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wind className="size-3.5 text-blue-400" />
              <span>Wind: <strong className="font-medium text-foreground">{weather.windKmh} km/h</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CloudRain className="size-3.5 text-sky-400" />
              <span>Rain: <strong className="font-medium text-foreground">{weather.precipitationMm} mm</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-3.5 text-amber-400" />
              <span>Humidity: <strong className="font-medium text-foreground">{weather.humidity}%</strong></span>
            </div>
          </div>
        )}

        {/* Tips Box */}
        {weather && weather.tips && weather.tips.length > 0 && (
          <div className="mt-5 rounded-xl border border-border/50 bg-background/50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#F26A4B]">Today's Layering Formula</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {weather.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#F26A4B]">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleCitySearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Change city (e.g. Paris, Tokyo)"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                className="h-9 w-48 rounded-lg border border-border bg-background px-3 text-xs placeholder:text-muted-foreground sm:w-64"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={searchBusy}>
              {searchBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>

          <Button
            onClick={handleComposeForWeather}
            disabled={composing || !weather || items.length === 0}
            className="gap-2"
          >
            {composing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-[#F26A4B]" />}
            Decide Outfit for Today's Weather
          </Button>
        </div>
      </div>

      {/* Generated Weather Looks */}
      {generatedLooks.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Weather-Optimized Outfits for {weather?.location} ({weather?.category})
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">{generatedLooks.length} looks</span>
          </div>
          <div className="grid gap-6">
            {generatedLooks.map(look => (
              <LookCard key={look.id} look={look} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
