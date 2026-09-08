"use client";

import Image from "next/image";
import { useState } from "react";
import type { Item } from "@/lib/types";
import { StoreBadge } from "./StoreBadge";
import { HonorPrompt } from "./HonorPrompt";

function formatPrice(price: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ItemCard({ item }: { item: Item }) {
  // Local adjustment so an honor-system tap reflects immediately.
  const [delta, setDelta] = useState(0);
  const [clickedBuy, setClickedBuy] = useState(false);
  const qtyPurchased = Math.min(item.qty_purchased + delta, item.qty_needed);
  const purchased = qtyPurchased >= item.qty_needed;
  const partial = !purchased && qtyPurchased > 0;
  const remaining = Math.max(item.qty_needed - qtyPurchased, 0);
  const isAmazon = item.source === "amazon";
  const price = formatPrice(item.price);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-sm border bg-ivory shadow-card transition-all duration-300 ${
        purchased
          ? "border-linen"
          : "border-linen hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-card-hover"
      }`}
      aria-label={item.name}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-ivory">
        <div className="linen absolute inset-0" />
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={`object-contain p-6 transition duration-500 ${
              purchased
                ? "opacity-45 saturate-[0.35]"
                : "group-hover:scale-[1.03]"
            }`}
          />
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              purchased ? "opacity-40" : ""
            }`}
          >
            <span className="font-display text-6xl italic text-linen">S</span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <StoreBadge store={item.store} />
        </div>

        {purchased && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <span className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-brass/50 bg-cream/95 px-3 py-1.5 text-[0.62rem] text-saddle shadow-sm">
              Purchased <span aria-hidden>🎉</span>
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={`flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 ${
          purchased ? "opacity-70" : ""
        }`}
      >
        <h3 className="font-display text-[1.2rem] font-medium leading-snug text-ink sm:text-[1.3rem]">
          <span className="line-clamp-2">{item.name}</span>
        </h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-[0.8rem] font-light leading-relaxed text-stone sm:text-[0.85rem]">
            {item.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            {price ? (
              <span className="text-[0.95rem] font-medium tracking-wide text-navy">
                {price}
              </span>
            ) : (
              <span className="eyebrow text-stone">See store</span>
            )}
            {item.qty_needed > 1 && !purchased && (
              <span className="eyebrow text-[0.58rem] text-stone">
                {partial
                  ? `${qtyPurchased} of ${item.qty_needed} gifted`
                  : `Wants ${item.qty_needed}`}
              </span>
            )}
          </div>

          <div className="mt-3">
            {purchased ? (
              <a
                href={item.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="eyebrow block w-full py-2.5 text-center text-[0.62rem] text-stone underline-offset-4 hover:underline"
              >
                View item
              </a>
            ) : isAmazon ? (
              <a
                href={item.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="eyebrow block w-full rounded-sm bg-navy py-3 text-center text-[0.65rem] text-cream transition-colors hover:bg-navy-deep"
              >
                Buy on Amazon
              </a>
            ) : (
              <a
                href={item.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setClickedBuy(true)}
                className="eyebrow block w-full rounded-sm border border-cognac/60 py-[calc(0.75rem-1px)] text-center text-[0.65rem] text-cognac transition-colors hover:bg-cognac hover:text-cream"
              >
                Buy at {item.store}
              </a>
            )}
            {!isAmazon && (
              <HonorPrompt
                itemId={item.id}
                visible={clickedBuy && !purchased}
                onPurchased={() => setDelta((d) => d + 1)}
                onUndo={() => setDelta((d) => d - 1)}
              />
            )}
            {remaining > 1 && (
              <span className="sr-only">{remaining} still needed</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
