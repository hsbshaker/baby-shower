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
| `SCRAPER_API_KEY` | Optional. ScraperAPI key for a hands-off scheduled sync (see §3). |
   | `NEXT_PUBLIC_SITE_URL` | Public base URL of the deployed site. |

3. Deploy.

## 3. Amazon sync

`/api/sync` parses the public registry page (names, prices, images,
purchased counts) and upserts items. Every run is logged to `sync_runs` and
shown in the admin. It accepts either a fetch it performs itself or a page
posted to it as `{ "html": "..." }`.

**Amazon refuses requests from cloud IPs.** Vercel's servers and GitHub's
runners both get a 403 bot page, so the scheduled paths below only succeed
when Amazon happens to allow them. The reliable path is the bookmarklet.

1. **Bookmarklet (recommended).** In `/admin`, drag **Sync Baby Registry**
   to your bookmarks bar. Open your Amazon registry page and click it: it
   scrolls to load every item, then posts the page to `/api/sync`. Takes
   about two seconds. Do this after gifts arrive, or whenever you add items.
2. **Supabase pg_cron (configured).** `cron.job` `amazon-registry-sync`
   calls `/api/sync` at minute 7 of every hour from Vercel. Logs an error
   and changes nothing when Amazon blocks it.
3. **GitHub Actions** (`.github/workflows/sync-amazon.yml`). Fetches the
   page from a runner at minute 23 of every hour and posts it. Needs the
   repo secret `SYNC_SECRET`. Currently also blocked by Amazon.
4. **ScraperAPI (optional, hands-off).** Set `SCRAPER_API_KEY` on Vercel
   and the scheduled sync fetches Amazon through ScraperAPI's residential
   IPs. Their free tier covers roughly one fetch per hour.

Manual options: the admin **Sync now** button, or
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
