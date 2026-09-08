-- ============================================================================
-- Baby registry — initial schema
--
-- HOW TO RUN: open your Supabase project dashboard -> SQL Editor -> New query,
-- paste this entire file, and click "Run". Run it once. It is safe to re-run
-- (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS where practical),
-- but it is not written to be run against a database that already has data
-- from a *different* schema version.
--
-- After running this, optionally run supabase/seed.sql to load starter items.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- items
-- ----------------------------------------------------------------------------
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2),
  image_url text,
  description text,
  category text not null check (
    category in ('Nursery', 'Feeding', 'Clothing', 'Gear', 'Bath', 'Health', 'Play')
  ),
  store text not null default 'Amazon',
  buy_url text not null,
  qty_needed int not null default 1 check (qty_needed >= 1),
  qty_purchased int not null default 0 check (qty_purchased >= 0),
  source text not null check (source in ('amazon', 'external')),
  amazon_item_id text unique,
  asin text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_is_active_sort_order_idx
  on items (is_active, sort_order, created_at);

-- Bump updated_at on every row update.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on items;
create trigger items_set_updated_at
  before update on items
  for each row
  execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- purchases
-- ----------------------------------------------------------------------------
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  created_at timestamptz not null default now(),
  source text not null check (source in ('honor', 'amazon', 'admin')),
  qty int not null default 1,
  ip_hash text,
  note text
);

create index if not exists purchases_item_id_idx on purchases (item_id);

-- ----------------------------------------------------------------------------
-- sync_runs
-- ----------------------------------------------------------------------------
create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('ok', 'error', 'skipped')),
  items_seen int,
  items_updated int,
  message text
);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- All writes go through the server using the service-role key, which
-- bypasses RLS entirely. The policies below only grant read-only access
-- to the anon role, and only for active items. There are no anon write
-- policies anywhere, and no anon read access to purchases or sync_runs.
-- ----------------------------------------------------------------------------
alter table items enable row level security;
alter table purchases enable row level security;
alter table sync_runs enable row level security;

drop policy if exists "anon can read active items" on items;
create policy "anon can read active items"
  on items
  for select
  to anon
  using (is_active = true);

-- No policies are defined for purchases or sync_runs, so with RLS enabled
-- the anon role has zero access (no select, no insert, no update, no delete).
