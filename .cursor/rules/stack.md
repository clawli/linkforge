# Stack & Conventions

## Stack
- Next.js 15 with App Router (not Pages Router)
- TypeScript (strict mode)
- Tailwind CSS with shadcn/ui components
- Drizzle ORM with better-sqlite3 (SQLite)
- Database file stored at `./data/linkforge.db`

## Conventions
- Use `src/` directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/db/`
- Server Components by default, `"use client"` only when needed
- API routes in `src/app/api/`
- Database schema in `src/db/schema.ts`, connection in `src/db/index.ts`
- Shared types in `src/lib/types.ts`
- Use `cn()` utility from shadcn for className merging
- Dark theme by default (dark background, light text)
- All pages must be responsive (375px, 768px, 1280px)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx drizzle-kit generate` — generate migrations
- `npx drizzle-kit push` — push schema to DB

## Key Decisions
- No authentication — use unique admin tokens per link
- Admin tokens stored in browser localStorage
- Short codes are 7-character nanoids
- Custom slugs allowed (3-50 chars, alphanumeric + hyphens)
- SQLite for simplicity — migrating to Turso/Postgres later via Drizzle
- QR codes generated server-side via `qrcode` package
- Click tracking extracts: referrer, user-agent (device/browser/OS), geo from request headers
