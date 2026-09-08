import Link from "next/link";
import { getAdminItems, recentSyncRuns } from "@/app/admin/actions";
import { SyncPanel } from "@/components/admin/SyncPanel";
import { ItemRow } from "@/components/admin/ItemRow";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [items, runs] = await Promise.all([getAdminItems(), recentSyncRuns()]);
  const gifted = items.filter((i) => i.qty_purchased >= i.qty_needed).length;

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

      <SyncPanel runs={runs} />

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
