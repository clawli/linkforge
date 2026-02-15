# LinkForge — PRD

## What It Is
A fast, modern URL shortener with click analytics, QR code generation, and a clean dashboard. No account required — create short links instantly, manage them with unique admin tokens stored in the browser.

## Why It Exists
Bitly limits free users to 10 links/month. Most URL shorteners have bloated UIs. LinkForge is free, fast, and gives you analytics that matter — without signing up for anything.

**Kill filter answers:**
- "Can AI do this?" → NO. AI can't host redirect endpoints, track live clicks, or serve QR codes.
- "Would I use this?" → YES. Anyone sharing links wants to know who's clicking.
- "Is the pain sharp enough?" → YES. Bitly's free tier is crippled. Most alternatives are ugly or overkill.

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **SQLite via better-sqlite3** for local dev (file-based, zero config)
- **Drizzle ORM** for DB abstraction
- **nanoid** for generating short codes
- **qrcode** package for QR generation
- **recharts** for analytics charts
- Deploy to **Vercel**

## Database Strategy
Use SQLite (better-sqlite3) with Drizzle ORM. Store the DB file at `./data/linkforge.db`. This works perfectly for local dev and single-server deployments. For Vercel production, we'll migrate to Turso (edge SQLite) later — Drizzle makes this a config change. For now, build and test locally with SQLite.

## Schema
- **links** table: id, slug (unique), url, adminToken, createdAt, expiresAt (nullable)
- **clicks** table: id, linkId (FK), timestamp, referrer, country, city, device, browser, os

## Tasks (in order)

### Task 1: Project Setup + Database Schema
- [x] Initialize Next.js 15 with TypeScript, Tailwind, App Router
- [x] Install dependencies: drizzle-orm, better-sqlite3, nanoid, shadcn/ui
- [x] Set up Drizzle config + schema (links, clicks tables)
- [x] Create DB initialization script
- [x] Create `.env.example`
- [x] Set up shadcn/ui with a dark theme

### Task 2: Core URL Shortening API
- [x] POST `/api/links` — create short link (accepts: url, optional slug). Returns: shortUrl, adminToken, slug
- [x] GET `/api/links/[slug]` — get link details (requires adminToken query param)
- [x] GET `/[slug]` — redirect to original URL + log click with metadata (referrer, user-agent parsing for device/browser/os, geo from headers)
- [x] Validate URLs, prevent duplicate slugs, generate 7-char nanoid for auto slugs
- [x] Rate limit link creation (simple in-memory, 10/min per IP)

### Task 3: Link Creation UI (Homepage)
- [x] Beautiful landing page with centered URL input
- [x] Paste URL → get short link instantly
- [x] Optional: expand to set custom slug
- [x] Copy-to-clipboard button with confirmation
- [x] Show QR code immediately after creation
- [x] Save adminToken to localStorage for link management
- [x] Mobile responsive

### Task 4: Analytics Dashboard
- [x] Route: `/dashboard/[slug]?token=[adminToken]`
- [x] Accessible via "View Stats" on homepage after creating a link
- [x] Show: total clicks, clicks over time (line chart), top referrers, device/browser/OS breakdown
- [x] Clean, data-dense layout using recharts + shadcn cards
- [x] Auto-refresh every 30 seconds
- [x] Mobile responsive

### Task 5: Link Management (My Links)
- [x] Route: `/my-links`
- [x] Show all links stored in localStorage (by adminToken)
- [x] For each link: short URL, destination, click count, created date
- [x] Click to view full analytics
- [x] Delete link option
- [x] Mobile responsive

### Task 6: QR Code Feature
- [x] Generate QR code for any short link
- [x] Download QR as PNG
- [x] Customizable colors (foreground/background)
- [x] Available from dashboard and creation result

### Task 7: Polish + Final Responsive Pass
- [x] Favicon and page titles/meta tags (OG tags for sharing)
- [x] Loading states, error states, empty states
- [x] 404 page for invalid slugs
- [x] Consistent spacing, hover states, transitions
- [x] Test at 375px, 768px, 1280px
- [x] Zero console errors
- [x] Clean footer with branding
