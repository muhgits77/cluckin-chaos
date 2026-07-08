# Cluckin' Chaos — Kentucky Food Truck Site

Premium Lake Cumberland food truck site (Bluegrass Digital Forge).  
Interactive menu + cart, plus a **live board** that pulls the latest menu and schedule from **TruckDash** via Supabase `published_trucks`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase JS client (public read of `published_trucks`)

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase + truck id values
npm run dev
```

### Live menu / schedule (simple JSON sync)

**Primary source:** `public/menu.json` (downloaded every time you hit **Publish** in TruckDash).

1. In TruckDash, update menu / schedule / special → **Publish Updates to My Website**
2. Browser downloads `menu.json`
3. Copy it to this repo: `public/menu.json` (replace the file)
4. Refresh Cluckin Chaos — Live Board + Menu update immediately

Optional env:

| Variable | Description |
|----------|-------------|
| `VITE_MENU_JSON_URL` | Override JSON path (default `/menu.json`) |
| `VITE_TRUCK_ID` | Truck slug for labels (default `cluckin-chaos`) |
| `VITE_SUPABASE_*` | Optional fallback if `menu.json` is missing |

The live board polls about every 30s and on tab focus.

## Supabase / TruckDash

1. Use the **same Supabase project** as TruckDash (or any project that has the `published_trucks` table from TruckDash’s `supabase/published_trucks.sql`).
2. RLS must allow **anon SELECT** on `published_trucks` (included in TruckDash SQL).
3. In TruckDash, set truck id to the same value as `VITE_TRUCK_ID` (e.g. `cluckin-chaos`) and use **Publish Updates to My Website**.

### What the live board shows

- Today’s special  
- Location (today’s schedule row or truck location)  
- Hours today  
- Full published menu  
- Weekly schedule  
- **Last published** timestamp  

## Deploy on Vercel

### 1. Import the repo

- Vercel → **Add New Project** → import this Git repo  
- Framework preset: **Vite**  
- Build command: `npm run build`  
- Output directory: `dist`

### 2. Add environment variables

In **Project → Settings → Environment Variables**, add for **Production** and **Preview**:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `VITE_TRUCK_ID` | `cluckin-chaos` (or your TruckDash truck id) |

> Vite only exposes variables prefixed with `VITE_`. Set them **before** build; changing env vars requires a **redeploy**.

Where to find Supabase values:

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Project Settings → API**  
3. Copy **Project URL** → `VITE_SUPABASE_URL`  
4. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`  
   (Do **not** use the `service_role` key on the frontend.)

### 3. Redeploy

After saving env vars:

- **Deployments** → open the latest deployment → **⋯ → Redeploy**  
  or push a new commit to trigger a build  

Confirm the live board loads (no “Live board not connected yet” message). If empty, publish once from TruckDash with the matching `truck_id`.

### CLI alternative

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_TRUCK_ID
vercel --prod
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Typecheck (`tsc --noEmit`) |

## Project layout (Supabase-related)

```
src/
  lib/supabase.ts          # createClient from VITE_* env
  lib/publishedTruck.ts     # fetch + map published_trucks row
  hooks/usePublishedTruck.ts
  components/LiveBoard.tsx  # special, hours, menu, schedule, last published
```

## Brand notes

Bluegrass Digital Forge — premium Kentucky food truck styling: warm slate, brand red / amber, Lake Cumberland authenticity. Static menu images stay local and photorealistic; live board prices/locations come from TruckDash.
