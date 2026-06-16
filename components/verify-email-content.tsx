"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions/auth";

const inputClass =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";

export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState(
    resendVerificationEmail,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-3 text-left">
      {!email && (
        <div>
          <label className="mb-1.5 block text-xs text-mist">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@lab.com"
            className={inputClass}
          />
        </div>
      )}
      {email && <input type="hidden" name="email" value={email} />}
      {state?.success ? (
        <p className="text-center text-sm text-green-300">{state.success}</p>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="w-full text-sm text-gold hover:underline disabled:opacity-60"
        >
          {pending ? "Sending..." : "Resend verification email"}
        </button>
      )}
    </form>
  );
}

export function VerifyEmailCheckContent({ email }: { email?: string }) {
  return (
    <div className="text-center">
      <Mail size={40} className="mx-auto text-gold" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foam">
        {email ? "Check your inbox" : "Resend verification email"}
      </h1>
      <p className="mt-3 text-sm text-mist">
        {email ? (
          <>
            We sent a verification link to{" "}
            <span className="font-medium text-foam">{email}</span>. Click the
            link in that email to activate your account.
          </>
        ) : (
          "Enter your email address and we'll send a new verification link."
        )}
      </p>
      <ResendVerificationForm email={email} />
      <p className="mt-8 text-sm text-mist">
        Already verified?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
