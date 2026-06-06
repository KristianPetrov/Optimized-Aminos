"use client";

import { useActionState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { lookupOrder, type LookupState } from "@/lib/actions/orders";

const inputClass =
  "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";

export function TrackForm({ defaultReference = "" }: { defaultReference?: string }) {
  const [state, formAction, pending] = useActionState<LookupState, FormData>(
    lookupOrder,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs text-mist">Order number</label>
        <input
          name="reference"
          required
          defaultValue={defaultReference}
          placeholder="OA-XXXXXX"
          className={`${inputClass} font-mono uppercase`}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-mist">
          Email used on the order
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@lab.com"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          <AlertCircle size={15} className="mt-px shrink-0" />
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        <Search size={15} />
        {pending ? "Looking up..." : "Find my order"}
      </button>
    </form>
  );
}
