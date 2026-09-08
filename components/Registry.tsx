"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type Category, type Item } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { CashFundCard } from "./CashFundCard";

type Filter = "All" | Category;

export function Registry({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const it of items) c.set(it.category, (c.get(it.category) ?? 0) + 1);
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  const giftedCount = items.filter((i) => i.qty_purchased >= i.qty_needed).length;
  const filters: Filter[] = ["All", ...CATEGORIES.filter((c) => counts.has(c))];

  return (
    <section id="registry" className="linen bg-cream">
      {/* Section heading */}
      <div className="mx-auto max-w-6xl px-5 pt-14 text-center sm:px-8 md:pt-20">
        <p className="eyebrow text-cognac">The Registry</p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-navy sm:text-5xl">
          A few things for baby
        </h2>
        <p className="mt-3 font-display text-lg italic text-stone">
          {items.length} gifts &middot; {giftedCount} already spoken for
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 mt-8 border-y border-linen/80 bg-cream/85 backdrop-blur-md">
        <nav
          aria-label="Filter by category"
          className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8"
        >
          {filters.map((f) => {
            const active = f === filter;
            const n = f === "All" ? items.length : counts.get(f) ?? 0;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`eyebrow shrink-0 rounded-full border px-4 py-2 text-[0.62rem] transition-colors ${
                  active
                    ? "border-navy bg-navy text-cream"
                    : "border-ink/15 text-ink/70 hover:border-navy/50 hover:text-navy"
                }`}
              >
                {f}
                <span
                  className={`ml-1.5 tabular-nums ${active ? "text-cream/60" : "text-stone/70"}`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8 sm:pt-8 md:pb-28">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {filter === "All" && <CashFundCard />}
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
        {visible.length === 0 && (
          <p className="py-16 text-center font-display text-xl italic text-stone">
            Nothing here just yet.
          </p>
        )}

        <p className="mx-auto mt-12 max-w-md text-center text-[0.8rem] font-light leading-relaxed text-stone">
          Amazon gifts are purchased through our registry, so you&rsquo;ll receive
          Amazon&rsquo;s gift receipts and easy returns. Gifts from other stores
          ship directly from that store.
        </p>
      </div>
    </section>
  );
}
