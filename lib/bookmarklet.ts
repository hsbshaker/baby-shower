/**
 * Builds the "Sync Baby Registry" bookmarklet.
 *
 * Amazon refuses registry pages to cloud IPs, so the sync runs from the
 * owner's own browser. Signed-in owners also see a different page than
 * guests, so the bookmarklet never reads the page it runs on. Instead, from
 * any amazon.com tab it:
 *
 *   1. fetches the public registry URL without cookies (the guest view,
 *      which defaults to the "Still needed" filter),
 *   2. follows the guest view's own load-more mechanism until the
 *      pagination key runs out,
 *   3. requests the "Purchased" filter the same way, since Amazon hides
 *      purchased items from the default list,
 *   4. posts all of that HTML to /api/sync in one payload.
 *
 * The load-more endpoint and its parameters come from Amazon's visitor-view
 * script: POST /baby-reg/visitor-view-load-more-items with the page's
 * `gridViewParam` state (registryId, sort, filters, paginationKey, ...),
 * form-encoded. Each response fragment carries the next state.
 */
export function buildBookmarklet({
  endpoint,
  secret,
  registryUrl,
}: {
  endpoint: string;
  secret: string;
  registryUrl: string;
}): string {
  const code = `
(async () => {
  if (!/amazon\\./.test(location.hostname)) {
    alert('Open Amazon first, then click this bookmark.');
    return;
  }
  const REG = ${JSON.stringify(registryUrl)};
  const MORE = new URL('/baby-reg/visitor-view-load-more-items', REG).toString();
  const post = async (html) => {
    const r = await fetch(${JSON.stringify(endpoint)}, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ${secret}', 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });
    return r.json();
  };
  const state = (html) => {
    const m = [...html.matchAll(/gridViewParam[^>]*>\\s*(\\{[\\s\\S]*?\\})\\s*<\\/script>/g)].pop();
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
  };
  const loadMore = async (params) => {
    const r = await fetch(MORE, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
      body: new URLSearchParams(params).toString()
    });
    if (!r.ok) throw new Error('load-more HTTP ' + r.status);
    return r.text();
  };
  const collect = async (s) => {
    let out = '';
    for (let i = 0; i < 30; i++) {
      const frag = await loadMore(s);
      out += frag;
      const next = state(frag);
      if (!next || !next.paginationKey) break;
      s = Object.assign({}, s, next);
    }
    return out;
  };
  let html = '';
  let note = '';
  try {
    const p = await fetch(REG, { credentials: 'omit', cache: 'no-store' });
    if (!p.ok) throw new Error('registry HTTP ' + p.status);
    html = await p.text();
    const base = state(html);
    if (base) {
      if (base.paginationKey) {
        try { html += await collect(base); }
        catch (e) { note += ' (later pages unavailable: ' + e.message + ')'; }
      }
      try {
        html += await collect(Object.assign({}, base, { filters: 'PURCHASED', paginationKey: '', lastItemCategory: '' }));
      } catch (e) {
        note += ' (purchased list unavailable: ' + e.message + ')';
      }
    } else {
      note = ' (page state not found; purchased items may be missing)';
    }
  } catch (e) {
    html = document.documentElement.outerHTML;
    note = ' (used current page: ' + e.message + ')';
  }
  try {
    const j = await post(html);
    alert('Registry sync: ' + (j.status || 'error') + '\\n' + (j.message || j.error || '') + note);
  } catch (e) {
    alert('Sync failed: ' + e);
  }
})();`;
  // Collapse to one line: bookmarklets cannot contain line breaks.
  const oneLine = code
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
  return `javascript:${encodeURIComponent(oneLine)}`;
}
