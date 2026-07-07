# BDnFlix — Netflix-style Streaming Platform

A premium streaming platform built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), and Zustand. Stream movies, TV shows, and anime via embed providers with TMDB metadata.

## Deploy to Netlify

### Option 1: Drag & Drop ZIP
1. Unzip `bdnflix-deploy.zip`
2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the unzipped folder onto the page
4. Netlify will auto-detect Next.js and build

### Option 2: Manual Deploy
1. Unzip `bdnflix-deploy.zip`
2. Run `npm install --legacy-peer-deps`
3. Run `npm run netlify:build`
4. Deploy the `.next` folder to Netlify

## Environment Variables

The `.env` file is included with:
- `DATABASE_URL` — SQLite database path (relative)
- `TMDB_API_TOKEN` — TMDB read access token (pre-configured)
- `TMDB_API_KEY` — TMDB API key (pre-configured)

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM with SQLite
- **State**: Zustand
- **API**: TMDB (metadata) + 5 embed streaming providers

## Features
- Netflix-style profile gate (up to 5 profiles, kids mode, PIN lock)
- Hero banner with auto-rotating featured content
- Content rows: Trending, Popular, Top Rated, Continue Watching, Top Picks, Curated Collections
- Detail modal with trailer, cast, episodes, recommendations, ratings, share
- Full-screen player with 5 streaming sources, episode selector, autoplay countdown, skip intro
- Search (movies, TV, people)
- My List with sort/filter, Watch History, Ratings
- Watch Stats dashboard with achievements/badges, weekly chart, top genres
- Year in Review recap
- New & Popular view with trending people, browse by language
- Notification center, keyboard shortcuts, scroll-to-top
- Person/cast detail pages with filmography
- Error boundary, responsive design, dark cinematic theme

## Notes
- SQLite is ephemeral on Netlify (data resets on each deploy). For persistent data, consider upgrading to a hosted database (PostgreSQL/MySQL) by updating `prisma/schema.prisma` and `DATABASE_URL`.
- Streaming content is served via public embed providers (Videasy, VidSrc, VidKing, 2Embed, MultiEmbed).
