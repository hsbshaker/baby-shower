import Link from "next/link";
import { getAdminItems, recentSyncRuns } from "@/app/admin/actions";
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
  if (!secret || !site) return null;
  const endpoint = `${site.replace(/\/$/, "")}/api/sync`;
  const code = `(async()=>{if(!/amazon\\./.test(location.hostname)){alert('Open your Amazon registry page first, then click this bookmark.');return}window.scrollTo(0,document.body.scrollHeight);await new Promise(r=>setTimeout(r,1500));try{const r=await fetch(${JSON.stringify(endpoint)},{method:'POST',headers:{'Authorization':'Bearer ${secret}','Content-Type':'application/json'},body:JSON.stringify({html:document.documentElement.outerHTML})});const j=await r.json();alert('Registry sync: '+(j.status||r.status)+'\\n'+(j.message||j.error||''))}catch(e){alert('Sync failed: '+e)}})();`;
  return `javascript:${encodeURIComponent(code)}`;
}

export default async function AdminHome() {
  const [items, runs] = await Promise.all([getAdminItems(), recentSyncRuns()]);
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

      <SyncPanel runs={runs} bookmarklet={bookmarklet} registryUrl={registryUrl} />

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
