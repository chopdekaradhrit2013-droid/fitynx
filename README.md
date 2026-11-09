# FITYNX — Private AI Wardrobe Studio

A full-stack web application: a polished marketing page, an intelligent wardrobe studio, and a dedicated backend storing user accounts, photos, outfits, and calendar data so users can access their wardrobe whenever they return.

**Stack:** React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · Express · Node.js · JWT · bcryptjs

## Features

- **Full-Stack Persistent Backend:** Stores user accounts, uploaded garments, background cutouts, saved outfits, and calendar plans with instant cross-session restoration.
- **Email & Password Authentication:** Bcrypt hashed password authentication with secure JWT tokens (`/api/auth/signup`, `/api/auth/signin`).
- **User Data Isolation:** Every user's wardrobe, outfits, and calendar entries are isolated to their own account.
- **On-Device Intelligent Stylist:** Rules-based color harmony, weather, and occasion engine that composes complete outfits using only the pieces the user has uploaded.
- **Private Image Processing:** Canvas-based smart cutout generation and palette extraction running locally on the user's device.

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Run both backend server (port 3001) and frontend (port 5173)
npm run dev

# Or run separately:
npm run dev:server    # Backend API server on http://localhost:3001
npm run dev:client    # Vite frontend on http://localhost:5173
```

- **Frontend:** [http://localhost:5173/](http://localhost:5173/)
- **Backend API:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

## Backend API Endpoints

- `POST /api/auth/signup` — Register with name, email, and password.
- `POST /api/auth/signin` — Sign in with email and password.
- `GET /api/auth/me` — Retrieve the authenticated user profile.
- `POST /api/auth/signout` — Sign out of the session.
- `GET /api/wardrobe` — List all wardrobe items for the authenticated user.
- `POST /api/wardrobe` — Upload/add garment items and photos.
- `PATCH /api/wardrobe/:id` — Update garment details.
- `DELETE /api/wardrobe/:id` — Delete a garment piece.
- `DELETE /api/wardrobe` — Wipe all wardrobe data for the user.
- `GET /api/looks` — Retrieve saved and composed outfits.
- `POST /api/looks` — Save composed outfits.
- `PATCH /api/looks/:id/toggle` — Toggle saved status for an outfit.
- `GET /api/plans` — Retrieve outfit calendar schedule.
- `POST /api/plans` — Schedule an outfit for a specific date.
- `DELETE /api/plans/:id` — Remove a calendar entry.

## Project layout

```
client/                 # Frontend Vite React SPA
  src/
    contexts/           # AuthContext & ThemeContext
    components/
      auth/             # ProtectedRoute
      site/             # UserMenu, Brand, LookCard, Modal, Reveal
      ui/               # Button, Tooltip, Sonner toast, Product rail gallery
    pages/
      Home.tsx          # Landing page
      AuthPage.tsx      # Sign in & Sign up page
      studio/           # Wardrobe · Stylist · Saved · Calendar · Settings
    library/            # api, store, imaging, stylist engine, types

server/                 # Backend Node.js / Express API
  data/                 # Persistent database storage (database.json)
  src/
    routes/             # auth, wardrobe, looks, plans routers
    auth.ts             # JWT generation/verification, bcrypt hashing
    db.ts               # Atomic JSON database manager
    index.ts            # Express server entry point
    types.ts            # Backend data types and schemas
```
