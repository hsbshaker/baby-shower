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

export function SyncPanel({ runs }: { runs: SyncRunRow[] }) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-sm border border-linen bg-ivory">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h2 className="eyebrow text-stone">Amazon sync</h2>
          <p className="mt-1 text-[0.8rem] font-light text-ink/70">
            Runs hourly. Pulls new items and purchased counts from the public registry.
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
