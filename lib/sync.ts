// Intentionally does NOT import 'server-only' — scripts/import-amazon.ts
// (a plain Node CLI, not a Next.js server context) needs to call
// runAmazonSync() directly.
import { createServerClient } from './supabase';
import { parseRegistryHtml, detectRegistryBlocked } from './amazon';
import type { Category, Item } from './types';

export interface SyncResult {
  status: 'ok' | 'error' | 'skipped';
  itemsSeen: number;
  itemsUpdated: number;
  itemsAdded: number;
  message: string;
}

export interface SyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'ok' | 'error' | 'skipped';
  items_seen: number | null;
  items_updated: number | null;
  message: string | null;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20_000;
// A single fetch response that parses to this many items or more is
// suspicious given pagination exists (see below) — log a warning so it
// shows up without failing the sync.
const POSSIBLE_TRUNCATION_THRESHOLD = 20;

interface PageFetchResult {
  ok: boolean;
  html: string;
  message: string;
}

/**
 * Fetches the registry page(s) at `url`.
 *
 * --- Pagination ---
 * The registry page ships a `#br-vv-item-loading-more-spinner` element,
 * implying more items can lazy-load beyond what's server-rendered on the
 * first response. We inspected a saved copy of the real page (see the
 * larger comment in lib/amazon.ts) looking for a "load more" URL, a
 * `lek`/`lastEvaluatedKey`-style cursor, a page-size config, or hidden
 * inputs near the spinner, and found none — no data attribute, inline
 * script, or config blob in the HTML references a follow-up endpoint or
 * cursor token for additional items. The mechanism most likely lives in
 * an external JS bundle fetched from Amazon's CDN at runtime, which we
 * don't have a saved copy of and won't guess the shape of.
 *
 * Because of that, this function only ever performs the single initial
 * request — there is no second page to follow. If items are added to
 * the registry beyond whatever page size triggers lazy-loading, a sync
 * could silently miss them; `runAmazonSync` guards against that only by
 * logging a warning when an unusually large number of items parse from
 * one response (see POSSIBLE_TRUNCATION_THRESHOLD below).
 */
export async function fetchAllRegistryPages(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PageFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let response: Response | null = null;
    // Amazon intermittently answers 403/503 to automated traffic. One
    // short retry recovers most of those; anything beyond that waits for
    // the next scheduled run.
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 4000));
      response = await fetchImpl(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Upgrade-Insecure-Requests': '1',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (response.ok || (response.status !== 403 && response.status !== 503)) break;
    }

    if (!response || !response.ok) {
      return {
        ok: false,
        html: '',
        message: `Registry fetch failed: HTTP ${response?.status ?? 'no response'}`,
      };
    }

    const html = await response.text();
    return { ok: true, html, message: '' };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const message = isAbort
      ? `Registry fetch timed out after ${FETCH_TIMEOUT_MS / 1000}s`
      : `Registry fetch failed: ${err instanceof Error ? err.message : String(err)}`;
    return { ok: false, html: '', message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Guesses a category for a newly-discovered registry item from its name,
 * using the same keyword heuristic as the seed data. First match wins;
 * default is 'Gear'.
 */
export function guessCategory(name: string): Category {
  const n = name.toLowerCase();
  const rules: [string[], Category][] = [
    [['bottle', 'milk', 'breast', 'feeding', 'bib'], 'Feeding'],
    [
      ['crib', 'bassinet', 'sheet', 'mattress', 'monitor', 'sound', 'nursery', 'wipe', 'diaper'],
      'Nursery',
    ],
    [['stroller', 'car seat', 'carrier', 'bag'], 'Gear'],
    [['bath', 'towel', 'tub'], 'Bath'],
    [['onesie', 'swaddle', 'sleep sack', 'sock'], 'Clothing'],
    [['thermometer', 'kit', 'aspirator', 'health'], 'Health'],
    [['toy', 'play', 'mat', 'rattle'], 'Play'],
  ];
  for (const [keywords, category] of rules) {
    if (keywords.some((keyword) => n.includes(keyword))) {
      return category;
    }
  }
  return 'Gear';
}

/**
 * Fetches the configured Amazon registry, parses it, and upserts items
 * into Supabase. Never throws — every failure mode returns a SyncResult
 * with status 'error' (or 'skipped' when unconfigured). Always logs a
 * row to sync_runs (best-effort; a logging failure doesn't affect the
 * returned result).
 */
export interface SyncOptions {
  /**
   * Pre-fetched registry page HTML. When provided, the network fetch is
   * skipped entirely — used by the GitHub Actions path, where the runner
   * fetches Amazon (from a different IP pool than Vercel) and posts the
   * page to /api/sync.
   */
  html?: string;
}

export async function runAmazonSync(options: SyncOptions = {}): Promise<SyncResult> {
  const startedAt = new Date();
  const result = await computeSync(options);
  const finishedAt = new Date();
  await logSyncRun(result, startedAt, finishedAt);
  return result;
}

async function computeSync(options: SyncOptions): Promise<SyncResult> {
  try {
    let fetched: PageFetchResult;
    if (options.html) {
      fetched = { ok: true, html: options.html, message: '' };
    } else {
      const url = process.env.AMAZON_REGISTRY_URL;
      if (!url) {
        return {
          status: 'skipped',
          itemsSeen: 0,
          itemsUpdated: 0,
          itemsAdded: 0,
          message: 'AMAZON_REGISTRY_URL not configured',
        };
      }
      fetched = await fetchAllRegistryPages(url, fetch);
    }

    if (!fetched.ok) {
      console.error('runAmazonSync:', fetched.message);
      return {
        status: 'error',
        itemsSeen: 0,
        itemsUpdated: 0,
        itemsAdded: 0,
        message: fetched.message,
      };
    }

    if (detectRegistryBlocked(fetched.html)) {
      const message = 'Registry page looks blocked (captcha/robot check)';
      console.error('runAmazonSync:', message);
      return { status: 'error', itemsSeen: 0, itemsUpdated: 0, itemsAdded: 0, message };
    }

    const parsed = parseRegistryHtml(fetched.html);

    if (parsed.length === 0) {
      const message = 'Parsed 0 items from a 200 response — markup changed?';
      console.error('runAmazonSync:', message);
      return { status: 'error', itemsSeen: 0, itemsUpdated: 0, itemsAdded: 0, message };
    }

    if (parsed.length >= POSSIBLE_TRUNCATION_THRESHOLD) {
      console.warn(
        `runAmazonSync: parsed ${parsed.length} items in a single response. ` +
          'The registry supports lazy-loaded pagination whose mechanism this ' +
          'sync could not determine (see the comment above fetchAllRegistryPages ' +
          'in lib/sync.ts) — results may be truncated.',
      );
    }

    const supabase = createServerClient();

    const { data: existingRows, error: fetchError } = await supabase
      .from('items')
      .select('id, amazon_item_id, sort_order')
      .not('amazon_item_id', 'is', null);
    if (fetchError) throw fetchError;

    const existingByAmazonId = new Map<string, { id: string; sort_order: number }>();
    for (const row of existingRows ?? []) {
      if (row.amazon_item_id) {
        existingByAmazonId.set(row.amazon_item_id, { id: row.id, sort_order: row.sort_order });
      }
    }

    const { data: maxSortRow } = await supabase
      .from('items')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextSortOrder = (maxSortRow?.sort_order ?? -1) + 1;

    let itemsUpdated = 0;
    let itemsAdded = 0;

    for (const parsedItem of parsed) {
      const existing = existingByAmazonId.get(parsedItem.amazon_item_id);

      if (existing) {
        const update: Partial<Item> = {
          price: parsedItem.price,
          qty_needed: parsedItem.qty_needed,
          qty_purchased: parsedItem.qty_purchased,
          buy_url: parsedItem.buy_url,
          asin: parsedItem.asin,
        };
        if (parsedItem.image_url !== null) {
          update.image_url = parsedItem.image_url;
        }
        const { error } = await supabase.from('items').update(update).eq('id', existing.id);
        if (error) throw error;
        itemsUpdated++;
      } else {
        const insert: Omit<Item, 'id' | 'created_at' | 'updated_at'> = {
          name: parsedItem.name,
          price: parsedItem.price,
          image_url: parsedItem.image_url,
          description: null,
          category: guessCategory(parsedItem.name),
          store: 'Amazon',
          buy_url: parsedItem.buy_url,
          qty_needed: parsedItem.qty_needed,
          qty_purchased: parsedItem.qty_purchased,
          source: 'amazon',
          amazon_item_id: parsedItem.amazon_item_id,
          asin: parsedItem.asin,
          sort_order: nextSortOrder++,
          is_active: true,
        };
        const { error } = await supabase.from('items').insert(insert);
        if (error) throw error;
        itemsAdded++;
      }
    }

    return {
      status: 'ok',
      itemsSeen: parsed.length,
      itemsUpdated,
      itemsAdded,
      message: `Synced ${parsed.length} items seen on the registry page (${itemsAdded} added, ${itemsUpdated} updated).`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('runAmazonSync failed:', err);
    return { status: 'error', itemsSeen: 0, itemsUpdated: 0, itemsAdded: 0, message };
  }
}

async function logSyncRun(result: SyncResult, startedAt: Date, finishedAt: Date): Promise<void> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('sync_runs').insert({
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      status: result.status,
      items_seen: result.itemsSeen,
      items_updated: result.itemsUpdated,
      message: result.message,
    });
    if (error) throw error;
  } catch (err) {
    console.error('runAmazonSync: failed to write sync_runs row', err);
  }
}

/** Returns the most recent sync_runs rows, newest first. */
export async function getRecentSyncRuns(limit = 5): Promise<SyncRun[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SyncRun[];
}
