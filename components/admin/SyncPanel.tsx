"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { lastSuccessfulSyncAt } from "@/app/admin/actions";
import { relativeTime } from "@/lib/relative-time";

export type SyncRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_seen: number | null;
  items_updated: number | null;
  message: string | null;
};

const POLL_MS = 4000;
const WAIT_LIMIT_MS = 10 * 60 * 1000;

type Phase = "idle" | "waiting" | "synced" | "gave-up";

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
  lastSyncedAt: initialLastSyncedAt,
  bookmarklet,
  registryUrl,
}: {
  runs: SyncRunRow[];
  lastSyncedAt: string | null;
  bookmarklet?: string | null;
  registryUrl?: string | null;
}) {
  const router = useRouter();
  const [lastSyncedAt, setLastSyncedAt] = useState(initialLastSyncedAt);
  const [phase, setPhase] = useState<Phase>("idle");
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const baseline = useRef<string | null>(initialLastSyncedAt);

  // Keep "Last synced" honest while the page stays open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // While waiting, poll our own backend for a newer successful sync.
  useEffect(() => {
    if (phase !== "waiting") return;
    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const latest = await lastSuccessfulSyncAt();
        if (cancelled) return;
        const base = baseline.current;
        if (latest && (!base || new Date(latest) > new Date(base))) {
          setLastSyncedAt(latest);
          setNow(Date.now());
          setPhase("synced");
          router.refresh();
          return;
        }
      } catch {
        /* transient; try again next tick */
      }
      if (Date.now() - startedAt >= WAIT_LIMIT_MS) {
        setPhase("gave-up");
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };

    let timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, router]);

  const openAndSync = () => {
    if (!registryUrl) return;
    baseline.current = lastSyncedAt;
    window.open(registryUrl, "_blank", "noopener");
    setPhase("waiting");
  };

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
      <div className="px-5 py-5">
        <h2 className="eyebrow text-stone">Amazon registry sync</h2>
        <p className="mt-2 font-display text-2xl font-medium text-navy">
          Last synced:{" "}
          <span className={lastSyncedAt ? "" : "text-stone"}>
            {lastSyncedAt ? relativeTime(lastSyncedAt, now) : "never"}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {phase === "waiting" ? (
            <span
              role="status"
              className="eyebrow inline-flex items-center gap-2.5 rounded-sm border border-brass/50 bg-cream px-5 py-3 text-[0.65rem] text-saddle"
            >
              <span
                aria-hidden
                className="h-2 w-2 animate-pulse rounded-full bg-brass"
              />
              Waiting for Amazon sync…
            </span>
          ) : phase === "synced" ? (
            <span
              role="status"
              className="eyebrow inline-flex items-center gap-2 rounded-sm border border-emerald-700/40 bg-cream px-5 py-3 text-[0.65rem] text-emerald-800"
            >
              <span aria-hidden>✓</span> Synced
            </span>
          ) : null}

          {phase !== "waiting" && (
            <button
              type="button"
              onClick={openAndSync}
              disabled={!registryUrl}
              className="eyebrow rounded-sm bg-navy px-5 py-3 text-[0.65rem] text-cream transition-colors hover:bg-navy-deep disabled:opacity-50"
            >
              {phase === "synced" ? "Sync again" : "Open Amazon & Sync"}
            </button>
          )}

          {phase === "waiting" && (
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="text-[0.75rem] font-light text-stone underline-offset-4 hover:text-navy hover:underline"
            >
              Cancel
            </button>
          )}
        </div>

        {phase === "gave-up" && (
          <p className="mt-3 text-[0.8rem] font-light text-stone">
            No sync arrived. Open Amazon and click the bookmark whenever you&rsquo;re ready.
          </p>
        )}

        <p className="mt-4 max-w-2xl text-[0.8rem] font-light leading-relaxed text-ink/70">
          Amazon opens in a new tab. Click the{" "}
          <span className="text-navy">Sync Baby Registry</span> bookmark there and
          this page updates on its own.
        </p>

        {bookmarklet && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[0.75rem] font-light text-stone">
              First time? Drag this to your bookmarks bar:
            </span>
            <span
              // A javascript: href must be emitted as raw HTML; React refuses them.
              dangerouslySetInnerHTML={{
                __html: `<a href="${bookmarklet.replace(/"/g, "&quot;")}" draggable="true" onclick="return false" class="eyebrow inline-flex cursor-grab items-center gap-2 rounded-sm border border-brass/60 bg-cream px-3 py-2 text-[0.58rem] text-saddle" title="Drag me to your bookmarks bar">↞ Sync Baby Registry</a>`,
              }}
            />
            <button
              type="button"
              onClick={copyBookmarklet}
              className="text-[0.75rem] font-light text-stone underline-offset-4 hover:text-navy hover:underline"
            >
              {copied ? "Copied" : "or copy the link"}
            </button>
          </div>
        )}
      </div>

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
