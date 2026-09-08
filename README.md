# Baby Registry — Deployment Guide

A Next.js registry site backed by Supabase, with an honor-system "mark as
purchased" flow, an hourly Amazon registry sync, and a password-protected
admin panel.

## 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   `supabase/migrations/0001_init.sql`, and run it. This creates the
   `items`, `purchases`, and `sync_runs` tables plus row-level security
   policies.
3. Optionally run `supabase/seed.sql` the same way to load starter items.
4. Find your keys under **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (keep secret, server-only) →
     `SUPABASE_SERVICE_ROLE_KEY`

## 2. Vercel

1. Import this repo at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example`:

   | Variable | What it's for |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key, used for public read-only queries. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key, used for all server-side writes. Never expose to the client. |
   | `ADMIN_PASSWORD` | Password for `/admin`. Generate with `openssl rand -hex 24`. |
   | `SYNC_SECRET` | Shared secret required to call `/api/sync`. Generate with `openssl rand -hex 24`. |
   | `AMAZON_REGISTRY_URL` | Public Amazon registry URL to sync items from. |
   | `NEXT_PUBLIC_SITE_URL` | Public base URL of the deployed site. |

3. Deploy.

## 3. Hourly Amazon sync

Two schedules call the same endpoint, `/api/sync`, which fetches the public
registry page, parses names, prices, images and purchased counts, and upserts
them. Every run is logged to the `sync_runs` table and shown in the admin.

1. **Supabase pg_cron (already configured).** A `cron.job` named
   `amazon-registry-sync` runs at minute 7 of every hour and calls
   `/api/sync` with the `SYNC_SECRET`. The fetch happens from Vercel's
   servers, which Amazon sometimes answers with a 403. Those runs log an
   error and change nothing.
2. **GitHub Actions (`.github/workflows/sync-amazon.yml`).** Runs at
   minute 23 of every hour. The runner fetches the registry page itself and
   posts the HTML to `/api/sync`, so the request to Amazon comes from a
   different IP pool. Needs one repo secret, **Settings → Secrets and
   variables → Actions → `SYNC_SECRET`** (same value as on Vercel).
   `SITE_URL` is optional and defaults to the production URL in the file.

Manual options: the admin **Sync now** button, the workflow's **Run
workflow** button, or
`curl -H "Authorization: Bearer $SYNC_SECRET" https://<site>/api/sync`.

## 4. One-time import

To do an initial import of the Amazon registry before the first scheduled
sync runs, set up `.env.local` (see below) and run:

```bash
npm run import:amazon
```

## 5. Local development

```bash
cp .env.example .env.local
npm run dev
```

The site renders from static seed data when Supabase env vars aren't set,
so it works out of the box with no configuration. Append `?demo=purchased`
to the URL to preview the "purchased" styling on items.

## 6. Editing content

- **Welcome note** — edit `components/Welcome.tsx`.
- **Cash fund card** (Venmo handle, suggested amounts, blurb) — edit
  `lib/fund.ts`.
