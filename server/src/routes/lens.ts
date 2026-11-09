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

// Helper: fetch visual catalog images using query
async function fetchVisualCatalogImages(fashionQuery: string): Promise<SearchResult[]> {
  try {
    const cleanFashionQuery = `${fashionQuery} clothing product studio flat lay`;
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(cleanFashionQuery)}&iax=images&ia=images`,
      { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } }
    );
    const tokenHtml = await tokenRes.text();
    const vqdMatch = tokenHtml.match(/vqd=([\d-]+)/) || tokenHtml.match(/"vqd":"([\d-]+)"/);

    if (vqdMatch && vqdMatch[1]) {
      const vqd = vqdMatch[1];
      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(cleanFashionQuery)}&vqd=${vqd}&f=,,,type:photo,,&p=1`,
        { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } }
      );
      const data = await imgRes.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results
          .slice(0, 12)
          .map((r: any) => ({
            title: r.title || "Studio Garment Photo",
            thumbnail: r.thumbnail || r.image,
            image: r.image || r.thumbnail,
            source: r.url || "",
          }))
          .filter((r: SearchResult) => r.image && r.thumbnail);
      }
    }
  } catch (e) {
    console.warn("Catalog image search fallback:", e);
  }
  return [];
}

// POST /api/lens/search-by-image - Reverse image search with Google Lens
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

    const buffer = Buffer.from(base64Data, "base64");

    // 1. Upload the image directly to Google Lens to generate the official reverse search URL
    let lensUrl: string | undefined;
    try {
      const formData = new FormData();
      formData.append("encoded_image", new Blob([buffer], { type: mimeType }), "garment.jpg");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const lensRes = await fetch("https://lens.google.com/upload", {
        method: "POST",
        body: formData,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      clearTimeout(timer);
      lensUrl = lensRes.headers.get("location") || undefined;
    } catch (lensErr) {
      console.warn("Direct Google Lens upload error:", lensErr);
    }

    // 2. Visually analyze the image to identify the exact product
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

    // 3. Fetch visual catalog matches
    const results = await fetchVisualCatalogImages(visualQuery);

    res.json({
      lensUrl: lensUrl || `https://lens.google.com/`,
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
