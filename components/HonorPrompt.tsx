"use client";

import { useState, useTransition } from "react";
import { markPurchased, undoPurchase } from "@/app/actions/purchases";

type Phase = "asking" | "thanks" | "error" | "dismissed";

/**
 * Honor-system prompt for third-party items. Appears after the guest opens
 * the store link, and lets them mark the gift purchased without an account.
 */
export function HonorPrompt({
  itemId,
  visible,
  onPurchased,
  onUndo,
}: {
  itemId: string;
  visible: boolean;
  onPurchased: () => void;
  onUndo: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("asking");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Stay visible after a thank-you even though the card flips to purchased.
  const shown = phase === "thanks" || (visible && phase !== "dismissed");
  if (!shown) return null;

  const confirm = () =>
    startTransition(async () => {
      const res = await markPurchased(itemId);
      if (res.ok) {
        setPhase("thanks");
        setMessage(null);
        onPurchased();
      } else {
        setPhase("error");
        setMessage(res.message);
      }
    });

  const undo = () =>
    startTransition(async () => {
      const res = await undoPurchase(itemId);
      if (res.ok) {
        setPhase("asking");
        setMessage(null);
        onUndo();
      } else {
        setMessage(res.message);
      }
    });

  return (
    <div
      role="status"
      className="mt-3 rounded-sm border border-brass/40 bg-cream/70 px-3 py-3 text-center animate-[fadeIn_.4s_ease]"
    >
      {phase === "asking" && (
        <>
          <p className="font-display text-[1.02rem] italic leading-snug text-navy">
            Did you buy this?
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="eyebrow mt-2 inline-flex w-full items-center justify-center rounded-sm border border-navy/70 py-2 text-[0.6rem] text-navy transition-colors hover:bg-navy hover:text-cream disabled:opacity-50"
          >
            {pending ? "One moment…" : "Tap to mark it purchased"}
          </button>
          <button
            type="button"
            onClick={() => setPhase("dismissed")}
            className="mt-2 text-[0.72rem] font-light text-stone underline-offset-4 hover:underline"
          >
            Not yet
          </button>
        </>
      )}

      {phase === "thanks" && (
        <>
          <p className="font-display text-[1.02rem] italic leading-snug text-saddle">
            Thank you, truly. <span aria-hidden>🎉</span>
          </p>
          <button
            type="button"
            onClick={undo}
            disabled={pending}
            className="mt-1.5 text-[0.72rem] font-light text-stone underline-offset-4 hover:underline disabled:opacity-50"
          >
            Tapped by mistake? Undo
          </button>
          {message && (
            <p className="mt-1 text-[0.72rem] font-light text-cognac">{message}</p>
          )}
        </>
      )}

      {phase === "error" && (
        <>
          <p className="text-[0.78rem] font-light leading-snug text-cognac">
            {message ?? "Something went wrong."}
          </p>
          <button
            type="button"
            onClick={() => setPhase("asking")}
            className="mt-1.5 text-[0.72rem] font-light text-stone underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
