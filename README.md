# Bhaavbhumi / Smart City Interactive Map — Developer Guide

> **Purpose:** This document is written for the next developer who takes over this project.
> It explains the architecture, data flow, key design decisions, and exactly how to handle common tasks — including adding new elevation images, managing plots, and extending the admin panel.

---

## Table of Contents

1. [What This App Does](#what-this-app-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Multi-Site Architecture](#multi-site-architecture)
5. [Data Layer — Supabase](#data-layer--supabase)
6. [Environment Variables](#environment-variables)
7. [Key Components](#key-components)
8. [How Elevation Images Work](#how-elevation-images-work)
9. [Adding New Elevation Images (Step-by-Step)](#adding-new-elevation-images-step-by-step)
10. [Admin Panel](#admin-panel)
11. [Utility Scripts](#utility-scripts)
12. [Deployment](#deployment)
13. [Common Tasks Cheat Sheet](#common-tasks-cheat-sheet)
14. [Known Quirks / Gotchas](#known-quirks--gotchas)

---

## What This App Does

An **interactive property map** for real estate projects. Users can:
- Pan/zoom an SVG layout of the entire township
- Click any plot/house to see its price, size, status, and elevation photos
- Filter plots by availability status
- Search plots by label (e.g. "D12", "L5")
- Submit an enquiry (WhatsApp / website / visit)

Currently hosts **two sites** on the same codebase:

| Site slug | Project | Domain pattern |
|---|---|---|
| `mangalamcity` | Mangalam City | `mangalamcity.mahavirgroupindia.com` |
| `bhaavbhumi` | Bhaavbhumi | `bhaavbhumi.mahavirgroupindia.com` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript** |
| Styling | **Vanilla CSS** (`app/globals.css`) — no Tailwind classes in JSX |
| Animations | **Framer Motion** |
| Icons | **Lucide React** |
| Database | **Supabase** (PostgreSQL) |
| Image compression | **Sharp** (Node.js — scripts only, not bundled) |
| Fonts | Inter + Outfit via Google Fonts |
| Deployment | **Vercel** |

---

## Project Structure

```
smart-city-map/
│
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — detects site slug from hostname/cookie
│   ├── page.tsx                # Main map page (public-facing)
│   ├── globals.css             # ALL styles live here (no component-level CSS)
│   ├── admin/                  # Per-site admin panel (login, plot editor)
│   └── hq/                    # Super-admin panel (manage all sites & users)
│
├── app/api/                    # API routes (Next.js route handlers)
│   ├── plots/route.ts          # GET (fetch plots), POST (upsert), DELETE (all)
│   ├── plots/[id]/route.ts     # DELETE single plot
│   ├── enquiries/route.ts      # GET / POST enquiries
│   └── switch-site/route.ts   # Sets testSiteSlug cookie (dev only)
│
├── components/                 # UI components
│   ├── MapCanvas.tsx           # CORE: SVG map rendering, pan/zoom, click handling
│   ├── PlotDetailPanel.tsx     # CORE: Side panel shown when a plot is clicked
│   ├── Header.tsx              # Top bar (logo, site name, filter, search)
│   ├── FilterBar.tsx           # Status filter chips
│   ├── SearchBar.tsx           # Plot search input
│   ├── Legend.tsx              # Map legend (colour key)
│   ├── OpenSpacePanel.tsx      # Info panel for parks/amenity areas
│   └── AdminMapper.tsx         # Admin-only: visual plot placement tool
│
├── data/
│   ├── plots.ts                # Utility functions (formatPrice, getStatusColor, etc.)
│   └── sites.ts                # Site config registry (logos, names, meta titles)
│
├── lib/
│   ├── context.tsx             # CORE: AppContext + HoverContext (global state)
│   ├── supabase.ts             # Browser Supabase client (anon key)
│   └── supabase-server.ts      # Server Supabase client (service role key)
│
├── types/index.ts              # All TypeScript interfaces (Plot, Enquiry, etc.)
│
├── public/
│   ├── bhaavbhumi/amenities/   # All Bhaavbhumi elevation WebP images live here
│   └── images/                 # Mangalam City amenity images
│
├── scripts/                    # Node.js utility scripts (run manually)
│   ├── compress-elevations.mjs # Compress raw renders → HQ WebP for Bhaavbhumi
│   ├── compress-views.mjs      # Compress amenity renders → WebP
│   ├── import-mangalam-plots.mjs # One-time DB import from Excel/KML
│   ├── query-plots.mjs         # Debug: print all plots by type/facing from DB
│   └── convert-pdf.mjs         # Convert PDF layout → PNG
│
├── elevations/                 # DROP SOURCE IMAGES HERE before compressing
│                               # (not committed to git — files are 15-30 MB each)
│
├── .env.local                  # Secret keys — NEVER commit this file
└── Views/                      # Raw TIF/JPG amenity renders (source files)
```

---

## Multi-Site Architecture

This single codebase serves **multiple real estate projects** simultaneously.
The active site is determined by the **subdomain** of the request hostname.

### How site detection works (`app/layout.tsx`):

```
Request comes in
       │
       ├── hostname = localhost / .vercel.app?
       │     └── Read cookie "testSiteSlug"
       │           → defaults to "mangalamcity" if cookie absent
       │
       └── Real production hostname (e.g. bhaavbhumi.mahavirgroupindia.com)?
             └── Extract first subdomain part → siteSlug = "bhaavbhumi"
```

The `siteSlug` is passed down via `AppProvider` and all API calls use it as a filter.

### Switching sites in development (localhost)

```
http://localhost:3000/api/switch-site?slug=bhaavbhumi
```

This sets a cookie. Then visiting `http://localhost:3000` will load Bhaavbhumi.

### Adding a new site

1. Add an entry in `data/sites.ts` (slug, name, logo, metaTitle, metaDescription)
2. Insert a row in the Supabase `sites` table with the same slug
3. Point a new subdomain at the Vercel deployment
4. Add any site-specific image logic to `PlotDetailPanel.tsx`

---

## Data Layer — Supabase

### Database tables

| Table | Purpose |
|---|---|
| `sites` | One row per real estate project |
| `plots` | All plot/house data. Every row has a `site_id` FK |
| `enquiries` | Buyer enquiries submitted through the map |
| `admins` | Admin users with bcrypt-hashed passwords |

### `plots` table — important columns

| Column | Type | Notes |
|---|---|---|
| `id` | text | e.g. `new-plot-1784097287104` |
| `site_id` | uuid/text | FK to `sites.id` |
| `label` | text | Human-readable: D12, L5, C3, etc. |
| `number` | int | Sort order within a type group |
| `type` | text | e.g. `"Type 3"`, `"Type 4"`, `"Amenity"` |
| `facing` | text | `"EAST"`, `"WEST"`, `"NORTH"`, etc. |
| `status` | text | `"available"`, `"sold"`, `"reserved"`, `"N/A"` |
| `price` | int | In rupees |
| `sizeSqFt` | float | Plot area in sq ft |
| `points` | text | SVG polygon points string for the map overlay |

### API access pattern

The UI talks to Supabase only through **Next.js API routes**:

```
Browser → /api/plots?site=bhaavbhumi → route handler (service role key) → Supabase
```

Never call Supabase directly from client components using the service role key.

---

## Environment Variables

Create `.env.local` at the project root (never commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # Public — safe in browser
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...     # PRIVATE — server only
```

> WARNING: `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security.
> It is only used in server-side API routes and Node scripts.
> Never import `supabase-server.ts` into a client component.

---

## Key Components

### `MapCanvas.tsx`
The core of the app. Renders the map image as a background and draws SVG polygon
overlays on top of each plot. Handles:
- Pan (drag) and zoom (wheel/pinch) via CSS transforms
- Plot click → sets `selectedPlot` in AppContext
- Hover highlight (isolated HoverContext — no full tree re-renders)
- Colour-coding by status or type

Map transform state (`x`, `y`, `scale`) lives locally in this component.

### `PlotDetailPanel.tsx`
Slides in from the right when a plot is selected. Key function:

```
getHeroImage(plot, siteSlug)
  └── siteSlug === 'bhaavbhumi'? → getBhaavbhumiHero(plot)
  └── else                       → getMangalamHero(plot)
```

`getBhaavbhumiHero` selects images based on `plot.type` + `plot.facing`.
`getMangalamHero` selects images based on `plot.label` (keyword matching).

### `lib/context.tsx`
Two contexts intentionally separated:
- **AppContext** — plots, enquiries, selected plot, filter/search, all CRUD
- **HoverContext** — only the hovered plot ID; isolated so hover events don't cause full re-renders

All mutations use **optimistic updates**: UI updates instantly, Supabase write happens silently in background.

---

## How Elevation Images Work

Images are selected based on two fields: `plot.type` and `plot.facing`.

### Current image mapping (as of July 2026)

| Type | Facing | Plots | Images served |
|---|---|---|---|
| Type 2 | EAST | B1–B19 | `type2_east_1.webp`, `type2_east_2.webp` |
| Type 2 | WEST | A1, A2, A3, A7 | ❌ Blank (no image yet) |
| Type 3 | WEST | C1–C7, D1–D8, D17, D18, D22, D23 | `type3_west_1.webp`, `type3_west_2.webp` |
| Type 3 | EAST | D9–D16, D24–D30 | `type3_houses.webp` |
| Type 4 | WEST | E1–E8, E19–E27, A19–A23, F19–F22 | `type4_west_1.webp`, `type4_west_2.webp` |
| Type 4 | EAST | E9–E18, E28–E36, B20–B26, F15–F18 | `type4_east_1.webp`, `type4_east_2.webp` |
| Type 5 | WEST | G1–G3, F8–F14, F30–F35 | `type5_west_1.webp`, `type5_west_2.webp` |
| Type 5 | EAST | F1–F7, F23–F29, F36–F41 | `type5_houses1.webp`, `type5_houses2.webp` |
| Type 6 | EAST | L1–L8 | `type6_east_1.webp`, `type6_east_2.webp` |
| Type 6 | WEST | L9, L10, L11 | `type6_west_1.webp`, `type6_west_2.webp` |

> Note on L9: was entered as EAST by mistake, manually corrected to WEST in July 2026.

### File naming convention

```
type{N}_{facing}_{index}.webp

Examples:
  type3_west_1.webp
  type4_east_2.webp
```

All images live in: `public/bhaavbhumi/amenities/`

---

## Adding New Elevation Images (Step-by-Step)

### Step 1 — Drop source files into `/elevations/`

Place raw PNG/JPEG files in the `elevations/` folder. Do not commit these — they are 15–30 MB each.

### Step 2 — Add mapping in `scripts/compress-elevations.mjs`

Open the `MAP` array and add:

```js
{ src: 'Your Source File.jpeg',  out: 'type3_east_1.webp' },
```

### Step 3 — Run compression

```bash
node scripts/compress-elevations.mjs
```

Output goes to `public/bhaavbhumi/amenities/` at ~500–600 KB per image.

### Step 4 — Update `PlotDetailPanel.tsx`

Find `getBhaavbhumiHero()` and add/modify the type block:

```tsx
if (lowerType === 'type 3' || lowerType === 'type3') {
  if (facing === 'EAST') {
    return {
      images: [
        '/bhaavbhumi/amenities/type3_east_1.webp',
        '/bhaavbhumi/amenities/type3_east_2.webp',
      ],
      label: 'Type 3 House — East Facing',
    };
  }
  // ... west case below
}
```

`facing` comes from the database and is normalised to UPPERCASE in the code.

### Step 5 — Verify, commit, push

```bash
npx tsc --noEmit
git add public/bhaavbhumi/amenities/type3_east_1.webp ...
git add components/PlotDetailPanel.tsx scripts/compress-elevations.mjs
git commit -m "feat: add Type 3 East elevation images"
git push origin master
```

Vercel auto-deploys on push to `master`.

---

## Admin Panel

### Per-site admin (`/admin`)
- Login: email + password stored in Supabase `admins` table (bcrypt hashed)
- Features: view enquiries, change plot statuses, visual plot mapper tool

### HQ super-admin (`/hq`)
- Separate auth credentials
- Features: manage all sites, all admin users, cross-site view

---

## Utility Scripts

| Script | Purpose | When to run |
|---|---|---|
| `compress-elevations.mjs` | Compress raw renders from `/elevations/` → WebP | New elevation images arrive |
| `compress-views.mjs` | Compress amenity views from `/Views/` → WebP | New amenity renders arrive |
| `query-plots.mjs` | Print all Bhaavbhumi plots (type, label, facing) | Debugging / verifying DB |
| `import-mangalam-plots.mjs` | Bulk-import plots from Excel/KML into DB | Initial import / re-import |
| `convert-pdf.mjs` | Convert layout PDF → PNG for map background | Layout map update |

Run all scripts with: `node scripts/script-name.mjs`
Scripts read `.env.local` directly — no dev server needed.

---

## Deployment

- **Platform:** Vercel
- **Branch:** `master` — auto-deploys on every push
- **Environment variables:** Set in Vercel dashboard → Project → Settings → Environment Variables
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Common Tasks Cheat Sheet

| Task | Action |
|---|---|
| Add elevation image | Drop in `/elevations/` → update `compress-elevations.mjs` → run script → update `getBhaavbhumiHero()` |
| Change plot status | Use `/admin` panel or edit directly in Supabase dashboard |
| Fix a plot's facing | Supabase dashboard → `plots` table → find by label → edit `facing` column |
| Add a new site | Add to `data/sites.ts` + insert row in Supabase `sites` table + point subdomain |
| View all Bhaavbhumi plots | `node scripts/query-plots.mjs` |
| Switch site in dev | Visit `http://localhost:3000/api/switch-site?slug=bhaavbhumi` |
| Start dev server | `npm run dev` |
| Type check | `npx tsc --noEmit` |
| Compress amenity views | Drop TIF/JPG in `/Views/` → `node scripts/compress-views.mjs` |

---

## Known Quirks / Gotchas

1. **`facing` casing in DB is inconsistent** — most plots store `"EAST"` / `"WEST"` uppercase, but some were manually entered as `"West"` (title case). The code normalises with `.toUpperCase()` before all comparisons.

2. **`type` field format** — stored as `"Type 3"` (capitalised with space). Image logic handles both `"type 3"` and `"type3"` via `toLowerCase()` comparisons.

3. **`HoverContext` is separate from `AppContext`** — intentional performance decision. Hover events fire dozens of times per second; isolating them prevents every plot polygon from re-rendering on every mouse move.

4. **`MapCanvas` is dynamically imported with `ssr: false`** — the canvas uses `window` and `devicePixelRatio`, which crash during server-side rendering.

5. **Vercel free tier has a 100 MB limit per deployment** — the WebP images in `public/` count toward this. If the limit is hit, move images to Supabase Storage or a CDN.

6. **`elevations/` folder** — add to `.gitignore` if it grows large. Raw source images (15–30 MB each) should not be committed to git.

---

*Last updated: July 2026 — Mahavir Group development team.*
