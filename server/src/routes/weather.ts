import { Router } from "express";

const router = Router();

// WMO Weather interpretation codes
function interpretWeatherCode(code: number): { condition: string; isRain: boolean; isSnow: boolean } {
  if (code === 0) return { condition: "Clear Sky", isRain: false, isSnow: false };
  if (code === 1) return { condition: "Mainly Clear", isRain: false, isSnow: false };
  if (code === 2) return { condition: "Partly Cloudy", isRain: false, isSnow: false };
  if (code === 3) return { condition: "Overcast", isRain: false, isSnow: false };
  if (code >= 45 && code <= 48) return { condition: "Foggy", isRain: false, isSnow: false };
  if (code >= 51 && code <= 57) return { condition: "Drizzle", isRain: true, isSnow: false };
  if (code >= 61 && code <= 67) return { condition: "Rain", isRain: true, isSnow: false };
  if (code >= 71 && code <= 77) return { condition: "Snow", isRain: false, isSnow: true };
  if (code >= 80 && code <= 82) return { condition: "Rain Showers", isRain: true, isSnow: false };
  if (code >= 85 && code <= 86) return { condition: "Snow Showers", isRain: false, isSnow: true };
  if (code >= 95) return { condition: "Thunderstorm", isRain: true, isSnow: false };
  return { condition: "Cloudy", isRain: false, isSnow: false };
}

function getClothingAdvice(tempC: number, apparentTempC: number, isRain: boolean, windKmh: number) {
  let weatherCategory: "hot" | "mild" | "cool" | "cold" | "rainy" = "mild";
  const tips: string[] = [];

  if (isRain) {
    weatherCategory = "rainy";
    tips.push("Water-resistant outer layer (trench, parka, or shell)");
    tips.push("Closed-toe water-repellent footwear — avoid open suede or light canvas");
    tips.push("Keep an umbrella handy");
  } else if (tempC >= 25 || apparentTempC >= 26) {
    weatherCategory = "hot";
    tips.push("Lightweight, breathable fabrics: linen, cotton jersey, loose silhouettes");
    tips.push("Single-layer tops, shorts, or flowy skirts");
    tips.push("Canvas sneakers, sandals, or breathable loafers");
  } else if (tempC >= 17) {
    weatherCategory = "mild";
    tips.push("Comfortable everyday weight: crisp button-down, t-shirt, or light overshirt");
    tips.push("Chinos, relaxed denim, or tailored trousers");
    tips.push("Versatile footwear: minimal sneakers or loafers");
  } else if (tempC >= 11) {
    weatherCategory = "cool";
    tips.push("Strategic layering: knitwear, denim jacket, blazer, or light trench");
    tips.push("Medium-weight denim, wool trousers, or corduroys");
    tips.push("Leather sneakers, boots, or oxfords");
  } else {
    weatherCategory = "cold";
    tips.push("Insulated heavy outerwear: wool overcoat, puffer, or shearling");
    tips.push("Thermal mid-layers: chunky turtleneck, fleece, or cashmere knit");
    tips.push("Sturdy boots and warming accessories (scarf, beanie)");
  }

  if (windKmh > 25 && !isRain) {
    tips.push("Breezy conditions: opt for wind-blocking jackets rather than loose flutters");
  }

  return {
    category: weatherCategory,
    summary:
      weatherCategory === "rainy"
        ? "Wet & rainy: Layer with water-resistant outerwear and dark or treated footwear."
        : weatherCategory === "hot"
          ? "Warm & sunny: Keep it breezy and breathable with single layers."
          : weatherCategory === "cold"
            ? "Cold: Prioritize warm insulation, chunky knits, and a structured overcoat."
            : weatherCategory === "cool"
              ? "Crisp & cool: Perfect for jackets, overshirts, and tonal layering."
              : "Mild & pleasant: Balanced weather suitable for versatile everyday combinations.",
    tips,
  };
}

// GET /api/weather/current
// Query params: ?lat=...&lon=... OR ?city=...
router.get("/current", async (req, res): Promise<void> => {
  try {
    let lat = req.query.lat ? Number(req.query.lat) : undefined;
    let lon = req.query.lon ? Number(req.query.lon) : undefined;
    const city = req.query.city ? String(req.query.city).trim() : undefined;
    let locationName = city || "Local Weather";

    if (city && (lat === undefined || lon === undefined)) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
          locationName = `${geoData.results[0].name}, ${geoData.results[0].country_code?.toUpperCase() || geoData.results[0].country}`;
        }
      }
    }

    // Default to New York if neither provided
    if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
      lat = 40.7128;
      lon = -74.006;
      locationName = "New York, US";
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh`;

    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      res.status(weatherRes.status).json({ error: "Failed to fetch weather from Open-Meteo" });
      return;
    }

    const weatherData = await weatherRes.json();
    const cur = weatherData.current;
    if (!cur) {
      res.status(500).json({ error: "No current weather reading returned" });
      return;
    }

    const codeInfo = interpretWeatherCode(cur.weather_code);
    const isRain = codeInfo.isRain || (cur.precipitation && cur.precipitation > 0.2);
    const advice = getClothingAdvice(cur.temperature_2m, cur.apparent_temperature, isRain, cur.wind_speed_10m);

    res.json({
      location: locationName,
      coordinates: { lat, lon },
      temperatureC: Math.round(cur.temperature_2m),
      temperatureF: Math.round((cur.temperature_2m * 9) / 5 + 32),
      feelsLikeC: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      windKmh: Math.round(cur.wind_speed_10m),
      precipitationMm: cur.precipitation || 0,
      condition: codeInfo.condition,
      isRain,
      isSnow: codeInfo.isSnow,
      category: advice.category,
      summary: advice.summary,
      tips: advice.tips,
    });
  } catch (err) {
    console.error("Weather API error:", err);
    res.status(500).json({ error: "Internal server error fetching weather data" });
  }
});

export default router;
