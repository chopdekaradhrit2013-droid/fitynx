import { Router } from "express";

const router = Router();

function getApiKey(customKey?: string): string | null {
  if (customKey && typeof customKey === "string" && customKey.trim()) {
    return customKey.trim();
  }
  return process.env.GEMINI_API_KEY || null;
}

// GET /api/ai/status - Check if Gemini AI is active
router.get("/status", (req, res): void => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    active: hasKey,
    model: "gemini-2.0-flash",
    message: hasKey
      ? "Google Gemini 2.0 Flash is connected."
      : "Gemini API key not configured on server. You can provide your key in Studio Settings.",
  });
});

// POST /api/ai/analyze - Inspect clothing photo with Gemini Vision
router.post("/analyze", async (req, res): Promise<void> => {
  try {
    const { image, apiKey: customKey } = req.body;
    const apiKey = getApiKey(customKey);

    if (!apiKey) {
      res.status(400).json({
        error: "Google Gemini API key required. Add GEMINI_API_KEY to server/.env or configure it in Studio Settings.",
      });
      return;
    }

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Garment image is required" });
      return;
    }

    // Extract base64 data and mime type
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `Analyze this piece of clothing with high precision fashion expertise.
Return ONLY valid JSON matching this exact structure:
{
  "name": "Concise product title, e.g. Vintage Faded Indigo Denim Jacket",
  "garmentType": "one of: tee, shirt, knit, hoodie, trousers, jeans, shorts, skirt, jacket, coat, blazer, dress, sneakers, boots, loafers, bag, scarf, cap",
  "colorName": "Refined color shade name, e.g. Midnight Navy, Sage Olive, Ecru, Camel",
  "colorHex": "Estimated hex code for dominant color, e.g. #1E3A8A",
  "fabric": "Estimated fabric or material, e.g. 100% Cotton Denim, Merino Wool, Silk, Suede",
  "styleVibe": "polished, relaxed, minimal, or expressive",
  "searchQuery": "3 to 6 word optimal search query to find this exact garment as a clean e-commerce studio catalog photo, e.g. navy denim trucker jacket product flat lay",
  "stylingTip": "One sentence fashion styling advice on how to wear this piece."
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
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
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      res.status(response.status).json({ error: `Gemini API call failed: ${errorText}` });
      return;
    }

    const geminiData = await response.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      res.status(500).json({ error: "Gemini did not return analysis text" });
      return;
    }

    const parsed = JSON.parse(rawContent);
    res.json({ analysis: parsed });
  } catch (err) {
    console.error("AI analyze error:", err);
    res.status(500).json({ error: "Failed to analyze garment image with Gemini" });
  }
});

// POST /api/ai/style - Editorial outfit composition
router.post("/style", async (req, res): Promise<void> => {
  try {
    const { brief, items, apiKey: customKey } = req.body;
    const apiKey = getApiKey(customKey);

    if (!apiKey) {
      res.status(400).json({ error: "Google Gemini API key required" });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "At least one wardrobe item is required" });
      return;
    }

    const itemsSummary = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.colorName,
      colorHex: item.colorHex,
      notes: item.notes,
    }));

    const prompt = `You are an elite, minimalist fashion stylist and editor.
The user wants an outfit for:
Occasion: ${brief.occasion || "Everyday"}
Feeling/Vibe: ${brief.vibe || "Polished"}
Weather: ${brief.weather || "Mild"}
Color Preferences: ${brief.colors || "None specified"}
Special Request / Note: ${brief.note || "None"}

Available Wardrobe Pieces:
${JSON.stringify(itemsSummary, null, 2)}

Pick the best combination of items from the user's available pieces (using their exact IDs).
Return ONLY valid JSON matching this exact structure:
{
  "title": "Creative editorial outfit title",
  "itemIds": ["id1", "id2", "id3"],
  "rationale": "Why these pieces balance in silhouette, proportion, and formality",
  "coordination": "Color harmony breakdown (e.g. tonal navy with contrasting camel accents)",
  "finishing": "Shoes, jewelry, or layering advice",
  "tip": "Practical fit or posture rule (e.g. unbutton top two buttons, cuff trousers)",
  "score": 96,
  "scoreNote": "Score rationale"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Gemini stylist failed: ${errorText}` });
      return;
    }

    const geminiData = await response.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawContent);

    res.json({ look: parsed });
  } catch (err) {
    console.error("AI style error:", err);
    res.status(500).json({ error: "Failed to generate AI styling" });
  }
});

export default router;

