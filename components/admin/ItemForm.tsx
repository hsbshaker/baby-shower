"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveItem } from "@/app/admin/actions";
import { CATEGORIES, type Item } from "@/lib/types";

const field =
  "mt-1.5 w-full rounded-sm border border-linen bg-white px-3 py-2.5 text-[0.9rem] text-ink outline-none transition-colors focus:border-navy";
const label = "eyebrow block text-[0.6rem] text-stone";

export function ItemForm({ item }: { item?: Item }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveItem, undefined);

  useEffect(() => {
    if (state?.ok) router.push("/admin");
  }, [state, router]);

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="sm:col-span-2">
        <label className={label} htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={item?.name} className={field} />
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="description">Short description</label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={item?.description ?? ""}
          className={field}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="buy_url">Buy link</label>
        <input
          id="buy_url"
          name="buy_url"
          type="url"
          required
          defaultValue={item?.buy_url}
          placeholder="https://"
          className={field}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="image_url">Image URL</label>
        <input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={item?.image_url ?? ""}
          placeholder="https://"
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="store">Store</label>
        <input id="store" name="store" required defaultValue={item?.store ?? "Amazon"} className={field} />
      </div>

      <div>
        <label className={label} htmlFor="price">Price (USD)</label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item?.price ?? ""}
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="category">Category</label>
        <select id="category" name="category" defaultValue={item?.category ?? "Nursery"} className={field}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="source">Source</label>
        <select id="source" name="source" defaultValue={item?.source ?? "external"} className={field}>
          <option value="external">Third-party store (honor system)</option>
          <option value="amazon">Amazon registry (auto-synced)</option>
        </select>
      </div>

      <div>
        <label className={label} htmlFor="qty_needed">Quantity wanted</label>
        <input
          id="qty_needed"
          name="qty_needed"
          type="number"
          min="1"
          defaultValue={item?.qty_needed ?? 1}
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="qty_purchased">Quantity purchased</label>
        <input
          id="qty_purchased"
          name="qty_purchased"
          type="number"
          min="0"
          defaultValue={item?.qty_purchased ?? 0}
          className={field}
        />
      </div>

      <div>
        <label className={label} htmlFor="sort_order">Sort order</label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={item?.sort_order ?? 0}
          className={field}
        />
      </div>

      <label className="flex items-center gap-3 self-end pb-2.5 text-[0.85rem]">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={item?.is_active ?? true}
          className="h-4 w-4 accent-navy"
        />
        Visible on the site
      </label>

      {state?.error && (
        <p className="text-[0.85rem] text-cognac sm:col-span-2">{state.error}</p>
      )}

      <div className="flex items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="eyebrow rounded-sm bg-navy px-6 py-3 text-[0.65rem] text-cream transition-colors hover:bg-navy-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="eyebrow text-[0.62rem] text-stone hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
