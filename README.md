<div align="center">

# FITYNX

**Dress from what's yours.**

An AI-powered digital wardrobe, personal stylist, and visual moodboard studio that turns the clothes you already own into weather-ready outfits.

[**Live Demo →**](https://fitynx.vercel.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)

<!-- Add a hero screenshot or GIF here -->
<!-- ![FITYNX preview](./docs/preview.png) -->

</div>

---

## About

FITYNX is **wardrobe-first**. Instead of pushing fast fashion, it helps you get more out of the clothes you already own. Photograph your closet, and FITYNX organizes it, analyzes each garment with multimodal AI, and uses color theory plus live weather to compose complete outfits, so mornings stop being a decision.

- **Wardrobe-first:** maximize rotation and longevity, not new purchases.
- **Editorial aesthetic:** lookbook-inspired typography (Playfair Display, Inter, JetBrains Mono), a warm `#F26A4B` accent, and polished light/dark themes.
- **Fast and frictionless:** instant photo processing and sub-second imports with no slow client-side background removal.
- **Portable:** full JSON backup and restore.

## Features

### 👗 Digital Wardrobe
- **Multi-photo upload:** drag and drop up to 12 photos at once, with automatic dominant-color extraction and smart naming.
- **Mobile quick shutter:** one-tap camera capture straight into your closet.
- **Worn Outfit Extractor:** upload a mirror selfie or outfit photo and AI isolates the top and bottom as separate wardrobe items.
- **AI garment analysis:** detects type, color palette, fabric texture, and style vibe, and writes styling notes.
- **Google Lens search:** one-click reverse image search to find the real product.
- **Product Rail gallery:** a 3D hanger-rail carousel with front/back inspection.
- **Cost-per-wear tracking:** price ÷ wears, shown as badges like `4w` or `$8/w`.
- **Category filters:** Tops, Bottoms, Outerwear, Shoes, Dresses, Accessories.

### 🎨 Outfit Canvas & Moodboard Builder
- Drag-and-drop canvas with touch and pointer support.
- Scale, rotate (−40° to +40°), and layer-order controls.
- One-click **Head-to-Toe Stack** and **Flat-Lay Grid** presets.
- **Auto-Complete:** place a shirt and FITYNX pulls the best-matching pants, jacket, and shoes from your closet.
- **Live Color Harmony Meter:** Complementary, Monochromatic, Analogous, or Neutral Foundation.
- **Export** a 1200×1500 PNG lookbook card with color swatches.

### 💬 Ask AI Stylist
- Floating chat drawer available anywhere in the app.
- Gemini 2.0 Flash gets context from your actual closet inventory.
- Recommended pieces appear as visual garment chips.
- **Assemble on Canvas:** open a suggested outfit directly in the canvas with one tap.

### 🧭 Decision Tools
- **Weather Decider:** layering formulas from live local conditions.
- **Color Harmony Engine:** interactive color wheel (complementary, analogous, monochromatic, triadic).
- **Outfit Roulette:** a 10-second slot-machine outfit roll.
- **Face-Off Arena:** compare two looks side by side with scoring.
- **Trip & Capsule Packing:** enter a destination and 2–7 days to get a forecast, a capsule wardrobe, a packing checklist, and a day-by-day outfit plan.

### 📅 Calendar
- Assign saved looks to dates and plan tomorrow's outfit tonight.
- Wear counts are logged automatically when a look is scheduled.

### 💾 Data & Settings
- JSON export and one-click restore across devices.
- Use your own Gemini API key (stored locally) or the server default.
- Light and dark themes.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | wouter |
| State | `useSyncExternalStore` backed by IndexedDB, with server sync |
| Canvas | HTML5 Canvas |
| PWA | Web App Manifest, standalone mode, camera capture |
| Backend | Node.js, Express, TypeScript |
| Auth | Email/password, bcrypt, JWT |
| AI | Google Gemini 2.0 Flash (multimodal) |
| Weather | Open-Meteo API |
| Hosting | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+ <!-- adjust to your version -->
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/<your-username>/fitynx.git
cd fitynx
npm install
```

### Environment variables

Create a `.env` file in the project root (see `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=a_long_random_string
PORT=3000
# <!-- add any other variables your app uses -->
```

### Run locally

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

<!-- Adjust the commands above to match your package.json scripts -->

## Project Structure

```text
fitynx/
├── src/              # React app (components, pages, store, canvas engine)
├── server/           # Express API (auth, wardrobe, looks, calendar)
├── public/           # manifest.json, icons, static assets
└── ...
```

<!-- Replace with your real folder layout -->

## How It Works

- **State:** an external store (`useSyncExternalStore`) reads from IndexedDB for instant UI updates, then syncs to the server.
- **Garment analysis:** Gemini returns type, palette, texture, and style notes for each photo.
- **Worn Outfit Extractor:** Gemini detects pieces and returns normalized 2D bounding boxes, which are cropped into separate items.
- **Auto-Complete and harmony scoring:** candidate pieces are scored by color-theory relationships against the anchor garment.
- **Stylist chat:** your closet inventory is passed to Gemini as context so suggestions only use clothes you own.

## Privacy & Data

<!-- Make sure this section matches how your app really behaves. -->
- Wardrobe items and looks are stored locally in your browser (IndexedDB) and synced to your personal account.
- Accounts are isolated; passwords are hashed with bcrypt and sessions use JWTs.
- Photos you analyze are sent to Google Gemini to generate garment details and styling advice. You can supply your own API key in Settings.
- You can export all your data as JSON at any time and restore it later.

## Deployment

The app is deployed on [Vercel](https://fitynx.vercel.app).

1. Import the repository into Vercel.
2. Add the environment variables from the section above.
3. Deploy.

<!-- Explain how the Express API is hosted if it differs from the frontend. -->

## Roadmap

- [ ] <!-- idea 1 -->
- [ ] <!-- idea 2 -->
- [ ] <!-- idea 3 -->

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push and open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for details. <!-- change if needed -->

## Acknowledgements

- [Google Gemini](https://ai.google.dev/) for multimodal AI
- [Open-Meteo](https://open-meteo.com/) for weather data
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display), [Inter](https://rsms.me/inter/), and [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for typography

## Author

**<!-- Your Name -->** · [GitHub](https://github.com/<your-username>) · [LinkedIn](<!-- link -->)

---

<div align="center">
<sub>Dress from what's yours.</sub>
</div>
