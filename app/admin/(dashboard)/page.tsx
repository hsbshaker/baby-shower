import Link from "next/link";
import { getAdminItems, lastSuccessfulSyncAt, recentSyncRuns } from "@/app/admin/actions";
import { SyncPanel } from "@/components/admin/SyncPanel";
import { ItemRow } from "@/components/admin/ItemRow";

export const dynamic = "force-dynamic";

/**
 * One-click sync from the admin's own browser: run on the Amazon registry
 * page, it posts that page's HTML to /api/sync. Amazon refuses requests from
 * cloud IPs, so this is the reliable path. The secret lives only in the
 * admin's bookmark.
 */
function buildBookmarklet(): string | null {
  const secret = process.env.SYNC_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const registryUrl = process.env.AMAZON_REGISTRY_URL;
  if (!secret || !site || !registryUrl) return null;
  const endpoint = `${site.replace(/\/$/, "")}/api/sync`;
  // Signed-in owners see a different registry page than guests, and the
  // parser targets the guest view. So from any amazon.com page, fetch the
  // public registry URL without cookies (the guest view), and only fall
  // back to the current page's HTML if that fails.
  const code = [
    "(async()=>{",
    "if(!/amazon\\./.test(location.hostname)){alert('Open Amazon first, then click this bookmark.');return}",
    `const post=async h=>{const r=await fetch(${JSON.stringify(endpoint)},{method:'POST',headers:{'Authorization':'Bearer ${secret}','Content-Type':'application/json'},body:JSON.stringify({html:h})});return r.json()};`,
    "let j=null;",
    `try{const p=await fetch(${JSON.stringify(registryUrl)},{credentials:'omit',cache:'no-store'});if(p.ok){j=await post(await p.text())}}catch(e){}`,
    "if(!j||j.status!=='ok'){try{window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,1500));j=await post(document.documentElement.outerHTML)}catch(e){alert('Sync failed: '+e);return}}",
    "alert('Registry sync: '+(j.status||'error')+'\\n'+(j.message||j.error||''))",
    "})();",
  ].join("");
  return `javascript:${encodeURIComponent(code)}`;
}

export default async function AdminHome() {
  const [items, runs, lastSyncedAt] = await Promise.all([
    getAdminItems(),
    recentSyncRuns(),
    lastSuccessfulSyncAt(),
  ]);
  const gifted = items.filter((i) => i.qty_purchased >= i.qty_needed).length;
  const bookmarklet = buildBookmarklet();
  const registryUrl = process.env.AMAZON_REGISTRY_URL ?? null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-cognac">Overview</p>
          <h1 className="mt-1 font-display text-4xl font-medium text-navy">
            {items.length} items · {gifted} gifted
          </h1>
        </div>
        <Link
          href="/admin/items/new"
          className="eyebrow rounded-sm bg-navy px-5 py-3 text-[0.65rem] text-cream transition-colors hover:bg-navy-deep"
        >
          + Add item
        </Link>
      </div>

      <SyncPanel
        runs={runs}
        lastSyncedAt={lastSyncedAt}
        bookmarklet={bookmarklet}
        registryUrl={registryUrl}
      />

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow text-stone">Items</h2>
          <p className="text-[0.75rem] font-light text-stone">
            Order here is the order on the site.
          </p>
        </div>
        <ul className="mt-3 divide-y divide-linen rounded-sm border border-linen bg-ivory">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === items.length - 1}
            />
          ))}
          {items.length === 0 && (
            <li className="px-5 py-10 text-center font-display text-lg italic text-stone">
              No items yet. Add one or run the Amazon sync.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
