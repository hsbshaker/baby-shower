"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { deleteItem, moveItem, setPurchased } from "@/app/admin/actions";
import type { Item } from "@/lib/types";

const btn =
  "eyebrow rounded-sm border border-ink/15 px-2.5 py-1.5 text-[0.56rem] text-ink/70 transition-colors hover:border-navy hover:text-navy disabled:opacity-40";

export function ItemRow({
  item,
  isFirst,
  isLast,
}: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, start] = useTransition();
  const purchased = item.qty_purchased >= item.qty_needed;

  return (
    <li
      className={`flex items-center gap-4 px-4 py-3 ${pending ? "opacity-50" : ""} ${
        item.is_active ? "" : "bg-linen/40"
      }`}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-linen bg-white">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt=""
            fill
            sizes="56px"
            className={`object-contain p-1 ${purchased ? "opacity-50 saturate-50" : ""}`}
          />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-2xl italic text-linen">
            S
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link
            href={`/admin/items/${item.id}`}
            className="truncate font-display text-[1.05rem] font-medium text-navy hover:underline"
          >
            {item.name}
          </Link>
          {!item.is_active && <span className="eyebrow text-[0.55rem] text-stone">hidden</span>}
        </div>
        <p className="mt-0.5 text-[0.75rem] font-light text-stone">
          {item.store} · {item.category} ·{" "}
          {item.price != null ? `$${item.price}` : "no price"} ·{" "}
          <span className={purchased ? "text-saddle" : ""}>
            {item.qty_purchased}/{item.qty_needed} purchased
          </span>
          {item.source === "amazon" && " · synced"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => void (await setPurchased(item.id, !purchased)))}
          className={`${btn} ${purchased ? "border-brass/60 bg-cream text-saddle" : ""}`}
          title={purchased ? "Mark as not purchased" : "Mark as purchased"}
        >
          {purchased ? "Purchased" : "Mark purchased"}
        </button>
        <button
          type="button"
          disabled={pending || isFirst}
          onClick={() => start(async () => void (await moveItem(item.id, "up")))}
          className={btn}
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || isLast}
          onClick={() => start(async () => void (await moveItem(item.id, "down")))}
          className={btn}
          aria-label="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Remove "${item.name}" from the registry?`))
              start(async () => void (await deleteItem(item.id)));
          }}
          className={`${btn} hover:border-cognac hover:text-cognac`}
          aria-label="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
