"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { resetPassword } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1.5 block text-xs text-mist">New password</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={inputClass}
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.password}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-mist">
          Confirm new password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Re-enter password"
          className={inputClass}
        />
        {state?.fieldErrors?.confirmPassword && (
          <p className="mt-1 text-xs text-red-400">
            {state.fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          <AlertCircle size={15} className="mt-px shrink-0" />
          <div>
            <p>{state.error}</p>
            <Link
              href="/forgot-password"
              className="mt-1 inline-block text-gold hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
