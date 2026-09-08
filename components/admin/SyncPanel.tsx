"use client";

import { useState, useTransition } from "react";
import { triggerSync } from "@/app/admin/actions";
import type { SyncResult } from "@/lib/sync";

export type SyncRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_seen: number | null;
  items_updated: number | null;
  message: string | null;
};

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const tone: Record<string, string> = {
  ok: "text-emerald-700",
  error: "text-cognac",
  skipped: "text-stone",
};

export function SyncPanel({
  runs,
  bookmarklet,
  registryUrl,
}: {
  runs: SyncRunRow[];
  bookmarklet?: string | null;
  registryUrl?: string | null;
}) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const copyBookmarklet = async () => {
    if (!bookmarklet) return;
    try {
      await navigator.clipboard.writeText(bookmarklet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the drag link still works */
    }
  };

  return (
    <section className="rounded-sm border border-linen bg-ivory">
      {bookmarklet && (
        <div className="border-b border-linen px-5 py-4">
          <h2 className="eyebrow text-stone">Sync from your browser</h2>
          <p className="mt-1 max-w-2xl text-[0.8rem] font-light leading-relaxed text-ink/70">
            Amazon blocks automated requests from servers, so the most reliable sync
            runs from you. Drag the button below to your bookmarks bar once. Then
            open your{" "}
            {registryUrl ? (
              <a
                href={registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy underline underline-offset-2"
              >
                Amazon registry
              </a>
            ) : (
              "Amazon registry"
            )}{" "}
            and click the bookmark. It sends that page here and updates every item.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              // A javascript: href must be emitted as raw HTML; React refuses them.
              dangerouslySetInnerHTML={{
                __html: `<a href="${bookmarklet.replace(/"/g, "&quot;")}" draggable="true" onclick="return false" class="eyebrow inline-flex cursor-grab items-center gap-2 rounded-sm border border-brass/60 bg-cream px-4 py-2.5 text-[0.62rem] text-saddle" title="Drag me to your bookmarks bar">↞ Sync Baby Registry</a>`,
              }}
            />
            <button
              type="button"
              onClick={copyBookmarklet}
              className="text-[0.75rem] font-light text-stone underline-offset-4 hover:text-navy hover:underline"
            >
              {copied ? "Copied" : "or copy the bookmark link"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h2 className="eyebrow text-stone">Scheduled sync</h2>
          <p className="mt-1 text-[0.8rem] font-light text-ink/70">
            Runs hourly from the server. Works only when Amazon serves the page to it.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setResult(await triggerSync()))}
          className="eyebrow rounded-sm border border-navy px-5 py-2.5 text-[0.62rem] text-navy transition-colors hover:bg-navy hover:text-cream disabled:opacity-50"
        >
          {pending ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {result && (
        <p
          className={`border-t border-linen px-5 py-3 text-[0.8rem] ${tone[result.status] ?? ""}`}
        >
          <span className="eyebrow mr-2 text-[0.58rem]">{result.status}</span>
          {result.itemsSeen} seen · {result.itemsAdded} added · {result.itemsUpdated} updated
          {result.message ? ` · ${result.message}` : ""}
        </p>
      )}

      {runs.length > 0 && (
        <ul className="divide-y divide-linen border-t border-linen">
          {runs.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-2.5 text-[0.78rem] font-light"
            >
              <span className="w-32 tabular-nums text-stone">{fmt(r.started_at)}</span>
              <span className={`eyebrow text-[0.56rem] ${tone[r.status] ?? ""}`}>
                {r.status}
              </span>
              <span className="text-ink/70">
                {r.items_seen ?? 0} seen · {r.items_updated ?? 0} updated
              </span>
              {r.message && <span className="text-stone">{r.message}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
