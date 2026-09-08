"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 text-left">
      <label htmlFor="password" className="eyebrow block text-cream/70">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="mt-2 w-full rounded-sm border border-cream/25 bg-navy px-3 py-2.5 text-cream outline-none transition-colors focus:border-brass"
      />
      {state?.error && (
        <p className="mt-3 text-[0.8rem] text-brass">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="eyebrow mt-5 w-full rounded-sm bg-cream py-3 text-[0.65rem] text-navy transition-colors hover:bg-brass disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
