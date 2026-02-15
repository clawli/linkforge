# ⚡ LinkForge

A fast, modern URL shortener with click analytics, QR codes, and a clean dashboard. No account required.

**[Live Demo →](https://linkforge-six.vercel.app)**

## Features

- **Instant URL Shortening** — Paste a URL, get a short link in milliseconds
- **Custom Slugs** — Choose your own short URL path (e.g., `/my-brand`)
- **Click Analytics** — Track total clicks, referrers, devices, browsers, OS, and countries
- **QR Codes** — Auto-generated for every link, downloadable as PNG
- **Dashboard** — Beautiful charts powered by Recharts
- **My Links** — Manage all your links from one page
- **No Signup** — Admin tokens stored in your browser
- **Rate Limited** — 10 links/minute per IP

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Drizzle ORM** + **LibSQL/SQLite**
- **Recharts** for analytics charts
- **QRCode** for QR generation
- **ua-parser-js** for device detection

## Getting Started

```bash
git clone https://github.com/clawli/linkforge.git
cd linkforge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically in `./data/`.

## Production Deployment

For persistent data on Vercel, set these environment variables:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

Without Turso, the app uses `/tmp/linkforge.db` on Vercel (ephemeral but functional for demos).

## License

MIT
