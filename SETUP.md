# Empire State Trail 2026 — Setup Guide

Forked from the West Highland Way trip site. Same stack (Next.js + Supabase + Netlify), new trip: Brooklyn → Montreal by bike, Sept 4–11, 2026.

## Quick Start

```bash
cd empire-state-trail
npm install
cp .env.local.example .env.local
# Fill in .env.local with your credentials (see below — these must be a NEW
# Supabase project and NEW Strava app, not reused from the old site)
npm run dev
```

---

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a **new** project (don't reuse the West Highland Way one — different trip data)
2. Note your project URL and anon key from **Settings → API**
3. Note your service role key (keep this secret — server-side only)

### Run Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase/schema.sql` (already seeded with all 8 days of this trip)
3. Click **Run**

### Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name: `photos`
4. Toggle **Public bucket** ON
5. Click **Create**
6. Go to **Policies** for the bucket and add:
   - SELECT: `true` (anyone can view)
   - INSERT: handled by service role key from API routes
   - DELETE: handled by service role key from API routes

### Enable Google OAuth
1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Create OAuth credentials at [console.developers.google.com](https://console.developers.google.com):
   - Create a new project (or use existing)
   - Enable Google OAuth2 API
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret back to Supabase Google provider settings
5. Save

---

## 2. Mapbox Setup

1. Reuse your existing Mapbox account (or create one at [mapbox.com](https://mapbox.com))
2. Go to **Account → Tokens**
3. Create a new public token (or use the default public token)
4. Add to `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

The map uses the `outdoors-v12` style. The route line is drawn from approximate
city-to-city waypoints (`components/RouteMap.tsx`) rather than a road-accurate
polyline — swap in a GPX export from the Strava routes if you want the exact
road path.

---

## 3. Strava API Setup

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application (or reuse an existing one — the client ID/secret aren't trip-specific)
3. Note **Client ID** and **Client Secret**
4. To get a refresh token with `activity:read_all` scope:
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   ```
5. After authorizing, exchange the code for a token:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -F client_id=YOUR_CLIENT_ID \
     -F client_secret=YOUR_CLIENT_SECRET \
     -F code=THE_CODE_FROM_STEP_4 \
     -F grant_type=authorization_code
   ```
6. Save the `refresh_token` from the response to `.env.local`

### Linking Strava Activities to Days
After each riding day, in the Admin Dashboard:
1. Go to the day section
2. Find the Strava activity ID from the URL: `strava.com/activities/[ID]`
3. Enter the ID and click Save

Or subscribe to the Strava webhook (Admin → Strava Webhook section) so activities auto-link by date — no manual step needed.

---

## 4. Admin Setup

1. Set a secure password in `.env.local` as `ADMIN_PASSWORD`
2. Generate a JWT secret (at least 32 characters):
   ```bash
   openssl rand -base64 32
   ```
3. Add to `.env.local` as `ADMIN_JWT_SECRET`
4. Visit `/admin` to log in

---

## 5. Live Location Tracking

Three ways to show Pete & Lena's position on the map, in order of effort:

**A. Garmin LiveTrack via Zapier (richest — has real-time trail, no manual step)**
- On your Garmin device: Settings → LiveTrack → enable Auto-Start
- Set up the Zapier Zap described in the Admin Dashboard's "Garmin LiveTrack Auto-Post" section (watches for the LiveTrack email, posts the link to `/api/garmin/webhook`)
- The site polls the Garmin KML feed for current coordinates automatically while a LiveTrack session is active

**B. iOS Shortcut fallback (simplest, works with patchy signal)**
- Create an iOS Shortcut that POSTs `{ lat, lng, secret }` to `https://YOUR-SITE.netlify.app/api/location`, where `secret` matches `GARMIN_WEBHOOK_SECRET`
- Run it manually (or on a Personal Automation trigger) whenever you have signal — a few times a day is enough for friends/family to see rough progress
- This is the most reliable option for the rural stretches near Ticonderoga/Plattsburgh where cell coverage is patchy

**C. Manual pin in Admin Dashboard**
- Set the current day / location by hand at the end of each day if the above aren't working

---

## 6. Google Doc Sync (optional, best-effort)

The Admin Dashboard has a "Sync from Google Doc" button that pulls trip details
from the [planning doc](https://docs.google.com/document/d/1MQWShnBS1wbHtjwCzi0Ybs5wRYHfDYUZE0V0jUi4Mvc)
directly into the `days` table (`app/api/sync-doc/route.ts`). It looks for
`Day N:` headings with `Sleep:` / `Dinner:` / `Resupply:` sub-sections and a
`strava.com/routes` link. The current doc isn't formatted that way, so this
will mostly no-op until the doc is restructured to match — until then, just
edit day details directly in the Admin Dashboard, which always works.

---

## 7. Deployment (Netlify)

This repo is already configured for Netlify (`netlify.toml`, `@netlify/plugin-nextjs`).

1. Push this repo to a new GitHub repo (e.g. `empire-state-trail`)
2. In Netlify: **Add new site → Import an existing project** → pick the repo
3. Add all variables from `.env.local.example` under **Site settings → Environment variables**
4. Deploy

For the Garmin webhook, your Netlify domain will be:
`https://YOUR-SITE.netlify.app/api/garmin/webhook`

---

## 8. Day-of Operations

### Each Morning
1. Log into `/admin/dashboard`
2. Set **Current Active Day** to today's day number
3. Optionally clear the previous day's LiveTrack URL

### During the Ride
- Start your Garmin activity with LiveTrack enabled (or fire the iOS Shortcut a few times if signal is patchy)
- Friends and family can click "Watch Them Live" on the website

### Each Evening
1. In Admin Dashboard, find today's day section
2. Write your diary entry and save
3. Upload photos from the day
4. Add your Strava Activity ID once the activity is synced

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token |
| `ADMIN_PASSWORD` | Password for admin login |
| `ADMIN_JWT_SECRET` | Secret for signing admin JWT (32+ chars) |
| `STRAVA_CLIENT_ID` | Strava API client ID |
| `STRAVA_CLIENT_SECRET` | Strava API client secret |
| `STRAVA_REFRESH_TOKEN` | Strava OAuth refresh token |
| `STRAVA_ATHLETE_ID` | Strava athlete ID |
| `GARMIN_WEBHOOK_SECRET` | Secret for validating Garmin/Zapier webhook, also used by the iOS Shortcut fallback |
