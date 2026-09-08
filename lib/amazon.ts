import * as cheerio from 'cheerio';

/**
 * A single item parsed from a public Amazon baby registry page.
 */
export interface ParsedRegistryItem {
  amazon_item_id: string;
  asin: string;
  name: string;
  price: number | null;
  image_url: string | null;
  qty_needed: number;
  qty_purchased: number;
  buy_url: string;
}

const QUANTITY_SELECTOR = '.br-vv-item-card-header-quantity-need-text';

// Registry cards nest a handful of divs deep (span -> ... -> the
// `aok-float-left` wrapper that has `id="<regItemId>"`). Cap the ancestor
// walk well above that so we never accidentally climb past the card into
// the shared grid wrapper (which would "contain" every card's quantity
// text and make the walk useless for disambiguation).
const MAX_ANCESTOR_HOPS = 20;

/**
 * Parses a saved (or freshly fetched) Amazon baby registry HTML page into
 * a flat list of items. Pure / no network. Never throws for a whole page —
 * any single item that fails to parse is skipped with a console.warn.
 *
 * --- How item cards are found ---
 * Each real product card has one or more elements carrying
 * `data-br-vv-item-action="{...json...}"` where the JSON includes
 * `regItemId`, `regId`, and `asin`. A given card repeats this attribute
 * on 2-3 different elements (the hover overlay, the "more details"
 * trigger, etc.), all nested inside the same card container, so results
 * are de-duplicated by `regItemId`.
 *
 * The page also contains a "gifts and funds" card (e.g. a diaper fund)
 * that carries the same `data-br-vv-item-action` attribute shape but
 * *without* an `asin` field and without a quantity-need element anywhere
 * in its container — it is excluded by both of those checks.
 *
 * For each candidate, we walk up from the action element to the nearest
 * ancestor whose subtree contains `.br-vv-item-card-header-quantity-need-text`
 * (the "N of M Purchased" badge). Because DOM containment only grows as
 * you go up, the *first* ancestor that contains a match is guaranteed to
 * be the smallest (nearest) one — i.e. the actual card container, not
 * some larger wrapper that happens to contain a different card's badge.
 *
 * --- Pagination ---
 * The page ships a `#br-vv-item-loading-more-spinner` element, implying
 * more items can lazy-load beyond what's server-rendered. We searched the
 * saved page for a concrete mechanism (a "load more" URL, a `lek`/
 * `lastEvaluatedKey`-style cursor, a page-size config, hidden inputs near
 * the spinner) and found none: no data attribute, inline script, or
 * config blob near the spinner references a follow-up endpoint or cursor
 * token. It's plausible the mechanism lives in an external JS bundle
 * fetched from Amazon's CDN, which isn't present in the saved HTML. Since
 * we can't determine it reliably, we do NOT guess a URL/shape here —
 * `fetchAllRegistryPages` in lib/sync.ts documents this same finding and
 * `runAmazonSync` just logs a warning if a single fetch parses an
 * unusually large number of items (possible truncation).
 */
export function parseRegistryHtml(html: string): ParsedRegistryItem[] {
  const $ = cheerio.load(html);
  const items: ParsedRegistryItem[] = [];
  const seen = new Set<string>();

  $('[data-br-vv-item-action]').each((_, el) => {
    try {
      const raw = $(el).attr('data-br-vv-item-action');
      if (!raw) return;

      let action: { regItemId?: string; regId?: string; asin?: string };
      try {
        action = JSON.parse(raw);
      } catch {
        return; // not the JSON shape we expect, skip silently
      }

      const { regItemId, regId, asin } = action;
      // No asin => not a real product card (e.g. the diaper-fund gift
      // card, which shares this attribute but has a different shape).
      if (!regItemId || !regId || !asin) return;
      if (seen.has(regItemId)) return;

      // Walk up to the nearest ancestor that contains both the quantity
      // badge and the product link. A card's markup splits these across
      // two sibling subtrees (an image/quantity overlay span, and a
      // separate "productui" block with the title + price link), so an
      // ancestor that contains only the quantity text is often too small
      // — keep climbing until both are present.
      const linkSelector = `a[href*="/dp/${asin}"]`;
      let container = $(el);
      let found = false;
      for (let hops = 0; hops < MAX_ANCESTOR_HOPS && container.length > 0; hops++) {
        if (
          container.find(QUANTITY_SELECTOR).length > 0 &&
          container.find(linkSelector).length > 0
        ) {
          found = true;
          break;
        }
        container = container.parent();
      }
      if (!found) return; // no quantity element nearby -> not a trackable item

      seen.add(regItemId);

      // --- Quantity ---
      const qtyText = container
        .find(QUANTITY_SELECTOR)
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();
      let qty_purchased = 0;
      let qty_needed = 1;
      const qtyMatch = qtyText.match(/(\d+)\s+of\s+(\d+)\s+Purchased/i);
      if (qtyMatch) {
        qty_purchased = parseInt(qtyMatch[1], 10);
        qty_needed = parseInt(qtyMatch[2], 10);
      }

      // --- Product link + title ---
      const link = container.find(linkSelector).first();
      let name = '';
      if (link.length > 0) {
        const h2 = link.find('h2').first();
        name = (
          h2.attr('aria-label') ||
          h2.text() ||
          link.attr('title') ||
          link.text() ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim();
      }
      if (!name) {
        name = (container.find('img[alt]').first().attr('alt') || '').trim();
      }
      name = cleanName(name);
      if (!name) {
        console.warn(`parseRegistryHtml: skipping ${regItemId} (${asin}) — no name found`);
        return;
      }

      // --- Price ---
      let price: number | null = null;
      const offscreen = container.find('.a-price .a-offscreen').first().text().trim();
      const offscreenMatch = offscreen.match(/\$?([\d,]+\.\d{2})/);
      if (offscreenMatch) {
        price = parseFloat(offscreenMatch[1].replace(/,/g, ''));
      } else {
        const anyPriceMatch = container.text().match(/\$\s?([\d,]+\.\d{2})/);
        if (anyPriceMatch) {
          price = parseFloat(anyPriceMatch[1].replace(/,/g, ''));
        }
      }

      // --- Image ---
      let image_url: string | null = null;
      const src = container.find('.br-item-image img').first().attr('src');
      if (src && src.includes('m.media-amazon.com')) {
        image_url = stripImageSizeSuffix(src);
      }

      const buy_url = `https://www.amazon.com/dp/${asin}?colid=${regId}&coliid=${regItemId}&ref_=lv_vv_wl_dp`;

      items.push({
        amazon_item_id: regItemId,
        asin,
        name,
        price,
        image_url,
        qty_needed,
        qty_purchased,
        buy_url,
      });
    } catch (err) {
      console.warn('parseRegistryHtml: skipping an item due to a parse error', err);
    }
  });

  return items;
}

/** Trims a raw title down to something display-sized. */
function cleanName(raw: string): string {
  let name = raw.trim();
  if (name.length > 80) {
    const pipeIdx = name.indexOf(' | ');
    const commaIdx = name.indexOf(', ');
    const candidates = [pipeIdx, commaIdx].filter((i) => i > -1);
    if (candidates.length > 0) {
      name = name.slice(0, Math.min(...candidates)).trim();
    }
  }
  return name;
}

/**
 * Strips Amazon image size/format suffixes, e.g. turns
 * `.../41b8g6Y7jGL._AC_SL1500_.jpg` into `.../41b8g6Y7jGL.jpg`.
 */
function stripImageSizeSuffix(src: string): string {
  return src.replace(/\._[A-Za-z0-9,_]+_(?=\.[a-zA-Z]+(?:\?.*)?$)/, '');
}

/**
 * Detects an Amazon anti-bot / captcha interstitial page instead of the
 * real registry markup.
 */
export function detectRegistryBlocked(html: string): boolean {
  if (!html || html.length < 5 * 1024) return true;
  const markers = [
    'Type the characters you see',
    'api-services-support@amazon.com',
    'Robot Check',
  ];
  return markers.some((marker) => html.includes(marker));
}
