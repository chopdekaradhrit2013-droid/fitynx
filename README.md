# FITYNX — Private AI Wardrobe Studio

A fast, static React site: a polished marketing page plus a working wardrobe studio (upload, cut-outs, colour analysis, outfit composer, saved looks, calendar). Everything runs in the browser — photos and data are stored locally in IndexedDB and never uploaded.

**Stack:** Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · wouter · IndexedDB. No backend, database or environment variables required.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run check      # type-check
```

## Deploy on Vercel

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel choose **Add New → Project** and import the repo.
3. Leave the detected settings — `vercel.json` already sets framework **Vite**, build command `npm run build`, output `dist`, SPA rewrites (so `/app/stylist` etc. work on refresh) and security/cache headers.
4. Click **Deploy**. No environment variables are needed.

Or with the CLI: `npm i -g vercel && vercel --prod`.

## Project layout

```
client/
  index.html            SEO / Open Graph meta, fonts
  public/               favicon, og-image, robots.txt
  src/
    pages/Home.tsx      landing page
    pages/studio/       Wardrobe · Stylist · Saved · Calendar · Settings
    lib/                store (IndexedDB), imaging (colour + cut-out), stylist engine, sample data
    components/         site UI + the interactive closet rail
vercel.json             Vercel config
```

## How the "stylist" works

It is an on-device rules engine, not a hosted LLM: it scores every candidate outfit for colour harmony (neutrals, tonal, accent, complementary), occasion formality, weather suitability and formality consistency, picks up to three diverse looks, and writes the explanation from those scores. It only uses pieces in the user's wardrobe. If you later want an LLM, add a Vercel Function (e.g. `api/stylist.ts`) that holds the API key server-side and call it from `Stylist.tsx`.

## Notes

- Background removal is a lightweight client-side method that works best on plain backdrops; it automatically falls back to the original photo when the result looks unreliable.
- Data lives per-browser. Settings → Export downloads a JSON backup.
