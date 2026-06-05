"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/db/schema";
import { updateProductFull, type AdminActionState } from "@/lib/actions/admin";

export function InventoryRow({ product }: { product: Product }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    updateProductFull,
    null,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect server action success in transient UI state
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1600);
      return () => clearTimeout(t);
    }
  }, [state]);

  const lowStock = product.inventory > 0 && product.inventory <= 5;

  return (
    <form
      action={action}
      className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-line bg-ink-800/50 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]"
    >
      <input type="hidden" name="productId" value={product.id} />

      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foam">
            {product.name}
          </p>
          <p className="truncate text-xs text-faint">
            {product.shortDescription}
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-faint">
          Price ($)
        </span>
        <input
          name="priceDollars"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(product.priceCents / 100).toFixed(2)}
          className="w-24 rounded-lg border border-line bg-ink/60 px-3 py-2 text-sm text-foam outline-none focus:border-gold/50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-faint">
          Inventory
        </span>
        <input
          name="inventory"
          type="number"
          min="0"
          defaultValue={product.inventory}
          className={`w-24 rounded-lg border bg-ink/60 px-3 py-2 text-sm text-foam outline-none focus:border-gold/50 ${
            lowStock ? "border-amber-400/50" : "border-line"
          }`}
        />
      </label>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-mist">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product.active}
            className="h-4 w-4 accent-[#e8c879]"
          />
          Active
        </label>
        <label className="flex items-center gap-1.5 text-xs text-mist">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product.featured}
            className="h-4 w-4 accent-[#e8c879]"
          />
          Featured
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-60"
      >
        {saved ? <Check size={15} /> : null}
        {pending ? "Saving..." : saved ? "Saved" : "Save"}
      </button>

      {state?.error && (
        <p className="col-span-full text-xs text-red-400">{state.error}</p>
      )}
    </form>
  );
}
