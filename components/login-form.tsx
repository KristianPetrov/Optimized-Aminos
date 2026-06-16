"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { authenticate } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";

export function LoginForm({
  redirectTo,
  resetSuccess,
}: {
  redirectTo: string;
  resetSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(authenticate, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {resetSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-xs text-green-300">
          Your password has been updated. Sign in with your new password.
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs text-mist">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@lab.com"
          className={inputClass}
          defaultValue={state?.unverifiedEmail ?? ""}
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs text-mist">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs text-gold hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClass}
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          <AlertCircle size={15} className="mt-px shrink-0" />
          <div>
            <p>{state.error}</p>
            {state.unverifiedEmail && (
              <Link
                href={`/verify-email/check?email=${encodeURIComponent(state.unverifiedEmail)}`}
                className="mt-2 inline-block text-gold hover:underline"
              >
                Resend verification email
              </Link>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-mist">
        New to Optimized Aminos?{" "}
        <Link href="/register" className="text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
