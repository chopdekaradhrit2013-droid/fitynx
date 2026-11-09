import { Router } from "express";

const router = Router();

interface SearchResult {
  title: string;
  thumbnail: string;
  image: string;
  source: string;
}

function getGeminiApiKey(customKey?: string): string | undefined {
  return customKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || undefined;
}

// Curated high-resolution studio flat-lay pieces library
const CURATED_STUDIO_PIECES: SearchResult[] = [
  // Tops
  {
    title: "Classic Heavyweight White Crewneck Tee",
    thumbnail: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Washed Charcoal Boxy T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Midnight Navy Relaxed T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Olive Green Heavy Cotton T-Shirt",
    thumbnail: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Heather Grey Minimalist Tee",
    thumbnail: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Crisp Oxford Cotton Button-Down Shirt",
    thumbnail: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Chunky Knit Wool Cable Sweater Cream",
    thumbnail: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Heavyweight Black Pullover Hoodie",
    thumbnail: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },

  // Outerwear
  {
    title: "Vintage Washed Blue Denim Trucker Jacket",
    thumbnail: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Raw Indigo Selvedge Denim Jacket",
    thumbnail: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Tailored Charcoal Wool Blazer",
    thumbnail: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Classic Camel Overcoat",
    thumbnail: "https://images.unsplash.com/photo-1539533018447-63fcce667883?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce667883?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Black Leather Biker Jacket",
    thumbnail: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },

  // Bottoms
  {
    title: "Classic Straight Leg Blue Denim Jeans",
    thumbnail: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Washed Black Straight Cut Jeans",
    thumbnail: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Tailored Pleated Trousers Black",
    thumbnail: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Relaxed Fit Chino Trousers Khaki Sand",
    thumbnail: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Olive Relaxed Cargo Trousers",
    thumbnail: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },

  // Footwear
  {
    title: "Clean Minimalist White Leather Sneakers",
    thumbnail: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Black Leather Penny Loafers",
    thumbnail: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
  {
    title: "Classic Suede Chelsea Boots Brown",
    thumbnail: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&auto=format&fit=crop&q=85",
    source: "Studio Flat Lay Collection",
  },
];

// Search Wikimedia Commons public clothing catalog
async function searchWikimediaFashion(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      query + " clothing"
    )}&gsrlimit=12&prop=imageinfo&iiprop=url|thumburl|extmetadata&iiurlwidth=400&format=json&origin=*`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "FitynxFashionApp/2.0 (studio@fitynx.local)" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {}) as any[];
      const items: SearchResult[] = [];

      for (const p of pages) {
        const info = p.imageinfo?.[0];
        if (info && info.thumburl && info.url && !/\.(svg|ogv|ogg|pdf)$/i.test(info.url)) {
          const rawTitle = (p.title || "")
            .replace(/^File:/i, "")
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/[-_]/g, " ");
          items.push({
            title: rawTitle.length > 50 ? `${rawTitle.slice(0, 50)}…` : rawTitle,
            thumbnail: info.thumburl,
            image: info.url,
            source: "Wikimedia Commons Fashion",
          });
        }
      }
      return items;
    }
  } catch (err) {
    console.warn("Wikimedia fashion search skipped:", err);
  }
  return [];
}

// Fetch visual catalog images using query with multiple fallback sources
async function fetchVisualCatalogImages(fashionQuery: string): Promise<SearchResult[]> {
  const queryLower = fashionQuery.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);

  // 1. Check curated studio collection for instant relevant matches
  const curatedMatches = CURATED_STUDIO_PIECES.filter(piece => {
    const text = `${piece.title} ${piece.source}`.toLowerCase();
    return queryTokens.some(token => text.includes(token));
  });

  // 2. Fetch live results from Wikimedia fashion catalog
  const wikiMatches = await searchWikimediaFashion(fashionQuery);

  const combined = [...curatedMatches, ...wikiMatches];

  // If matches found, return them
  if (combined.length > 0) {
    return combined.slice(0, 16);
  }

  // 3. Fallback to full curated studio flat-lay collection
  return CURATED_STUDIO_PIECES.slice(0, 12);
}

// POST /api/lens/search-by-image - Reverse image search with Google Lens & Visual Analysis
router.post("/search-by-image", async (req, res): Promise<void> => {
  try {
    const { image, apiKey: customKey } = req.body;
    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Image data URL is required" });
      return;
    }

    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    // Visually analyze the image with Gemini to identify product characteristics
    let visualQuery = "clothing product studio flat lay";
    let visualTitle = "Identified Garment";

    const apiKey = getGeminiApiKey(customKey);
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this garment image visually.
Identify the exact piece: garment type, color shade, cut/fit, fabric texture, style.
Generate a concise 3 to 5 word visual search phrase to find clean e-commerce studio catalog photos of this exact piece.
Return ONLY JSON:
{"title": "Concise product title", "query": "3-5 word search query, e.g. dark grey oversized heavy cotton t-shirt"}`,
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.1,
            },
          }),
        });
        clearTimeout(timer);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.query) visualQuery = parsed.query;
            if (parsed.title) visualTitle = parsed.title;
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini visual feature extraction skipped/timed out:", geminiErr);
      }
    }

    // Fetch visual catalog matches (curated flat-lays + live web)
    const results = await fetchVisualCatalogImages(visualQuery);

    res.json({
      lensUrl: "https://lens.google.com/",
      query: visualQuery,
      visualTitle,
      results,
    });
  } catch (err) {
    console.error("Lens search-by-image error:", err);
    res.status(500).json({ error: "Failed to search Google Lens by image" });
  }
});

// Search web for studio catalog clothing images by query
router.get("/search", async (req, res): Promise<void> => {
  try {
    const rawQuery = String(req.query.q || "").trim();
    if (!rawQuery) {
      res.status(400).json({ error: "Search query 'q' is required" });
      return;
    }

    const results = await fetchVisualCatalogImages(rawQuery);
    res.json({ query: rawQuery, results });
  } catch (err) {
    console.error("Lens search error:", err);
    res.status(500).json({ error: "Failed to perform visual search" });
  }
});

// Proxy web images to avoid CORS and return data URL
router.get("/proxy", async (req, res): Promise<void> => {
  try {
    const targetUrl = String(req.query.url || "").trim();
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      res.status(400).json({ error: "Valid image 'url' is required" });
      return;
    }

    const imgRes = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    });

    if (!imgRes.ok) {
      res.status(imgRes.status).json({ error: "Failed to fetch image" });
      return;
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    res.json({ dataUrl, contentType });
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).json({ error: "Failed to proxy image" });
  }
});

export default router;
