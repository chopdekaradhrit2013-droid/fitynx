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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
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
    clearTimeout(timeoutId);

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

// POST /api/ai/extract-outfit - Extract top, bottom, and pieces from photo of a person wearing clothes
router.post("/extract-outfit", async (req, res): Promise<void> => {
  const fallbackResponse = {
    hasPerson: true,
    garments: [
      {
        role: "top",
        type: "tee",
        name: "Worn Top",
        colorName: "Neutral",
        colorHex: "#333333",
        box2d: [120, 160, 540, 840],
        searchQuery: "clothing top product flat lay",
      },
      {
        role: "bottom",
        type: "jeans",
        name: "Worn Bottom",
        colorName: "Denim",
        colorHex: "#22344D",
        box2d: [480, 180, 930, 820],
        searchQuery: "pants jeans product flat lay",
      },
    ],
  };

  try {
    const { image, apiKey: customKey } = req.body;
    const apiKey = getApiKey(customKey);

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Outfit image is required" });
      return;
    }

    if (!apiKey) {
      // Instant graceful fallback when no key is configured
      res.json(fallbackResponse);
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

    const prompt = `You are an expert visual fashion AI.
The user uploaded an image that contains clothes worn by a person (e.g. mirror selfie, lookbook, street style).
Analyze the image and detect the distinct pieces of clothing worn by the person:
Specifically look for:
1. Top (tee, shirt, knit, hoodie, jacket, coat, blazer)
2. Bottom (trousers, jeans, shorts, skirt)
3. Dress (if wearing a single dress instead of top/bottom)
4. Shoes (sneakers, boots, loafers) - if visible

For EACH detected piece of clothing, detect its 2D bounding box normalized from 0 to 1000: [ymin, xmin, ymax, xmax].
Important: Ensure the box covers the full garment from neckline/collar/waist to hem.
Accurately identify the true color shade of the garment (e.g. olive green, navy blue, washed black, crimson red, off-white, camel tan, burgundy, sage, cream). Do NOT default to black or neutral if the clothing has color.

Return ONLY valid JSON matching this exact structure:
{
  "hasPerson": true,
  "garments": [
    {
      "role": "top",
      "type": "one of: tee, shirt, knit, hoodie, jacket, coat, blazer",
      "name": "Concise product title, e.g. Vintage Washed Charcoal Oversized Tee",
      "colorName": "Color name, e.g. Charcoal Grey",
      "colorHex": "Hex color, e.g. #3A3A3C",
      "fabric": "e.g. 100% Heavyweight Cotton",
      "box2d": [180, 240, 520, 760],
      "searchQuery": "washed charcoal oversized t-shirt product flat lay"
    },
    {
      "role": "bottom",
      "type": "one of: trousers, jeans, shorts, skirt",
      "name": "Concise product title, e.g. Straight Leg Raw Indigo Jeans",
      "colorName": "Color name, e.g. Indigo Blue",
      "colorHex": "Hex color, e.g. #22344D",
      "fabric": "e.g. Raw Denim",
      "box2d": [490, 260, 920, 740],
      "searchQuery": "straight leg raw indigo jeans flat lay"
    }
  ]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
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
          temperature: 0.1,
        },
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("Gemini outfit extraction returned non-ok, using smart fallback");
      res.json(fallbackResponse);
      return;
    }

    const geminiData = await response.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      res.json(fallbackResponse);
      return;
    }

    const parsed = JSON.parse(rawContent);
    res.json(parsed);
  } catch (err) {
    console.warn("AI extract-outfit error/timeout, using smart fallback:", err);
    res.json(fallbackResponse);
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

// POST /api/ai/chat - Interactive Stylist Chatbot Drawer
router.post("/chat", async (req, res): Promise<void> => {
  try {
    const { message, history, items, apiKey: customKey } = req.body;
    const apiKey = getApiKey(customKey);

    if (!apiKey) {
      res.status(400).json({
        error: "Google Gemini API key required. Please configure your key in Studio Settings.",
      });
      return;
    }

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const itemsSummary = (Array.isArray(items) ? items : []).map((item: any) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.colorName,
      colorHex: item.colorHex,
      notes: item.notes || "",
    }));

    const systemPrompt = `You are the FITYNX AI Stylist — an elite, minimalist, and encouraging fashion director and personal stylist.
You are helping the user choose what to wear, give color theory advice, and elevate their personal style.

USER'S CLOSET INVENTORY:
${JSON.stringify(itemsSummary, null, 2)}

GUIDELINES:
1. Always prioritize pieces from the user's closet inventory above whenever they ask for outfit suggestions.
2. When you recommend specific pieces from their wardrobe, mention them by their exact name and tag their ID like [item:ITEM_ID] so the app can render interactive piece cards.
3. Keep your advice stylish, concise, and constructive (mention silhouettes, proportions, french tucks, cuffing, or shoe choices).
4. If you suggest a complete outfit, also end your response with a JSON block:
\`\`\`look
{
  "title": "Title of the suggested outfit",
  "itemIds": ["id1", "id2", "id3"]
}
\`\`\``;

    // Convert past history to Gemini contents format
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am your FITYNX Personal Stylist. I know every piece in your wardrobe and will help you create elevated, confident outfits for any occasion or weather." }],
      },
    ];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Gemini stylist chat failed: ${errorText}` });
      return;
    }

    const geminiData = await response.json();
    const rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't compose a reply at this moment.";

    // Parse any embedded ```look block
    let replyText = rawReply;
    let recommendedLook: { title: string; itemIds: string[] } | undefined;

    const lookMatch = rawReply.match(/```look\s*([\s\S]*?)\s*```/);
    if (lookMatch) {
      try {
        recommendedLook = JSON.parse(lookMatch[1]);
        replyText = rawReply.replace(/```look\s*[\s\S]*?\s*```/, "").trim();
      } catch {
        /* noop */
      }
    }

    res.json({
      reply: replyText,
      recommendedLook,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "Failed to generate AI stylist response" });
  }
});

export default router;

