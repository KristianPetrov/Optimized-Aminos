"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "./cart-provider";

type Props = {
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  inventory: number;
};

export function ProductDetailActions({
  slug,
  name,
  image,
  priceCents,
  inventory,
}: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = inventory <= 0;
  const max = Math.max(1, inventory);

  function add() {
    addItem({ slug, name, image, priceCents }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  function buyNow() {
    addItem({ slug, name, image, priceCents }, qty);
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
        This compound is currently out of stock. Please check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-xl border border-line">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-mist hover:text-foam"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-foam">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-mist hover:text-foam"
          >
            <Plus size={16} />
          </button>
        </div>
        <span className="text-sm text-faint">
          {inventory} in stock
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={add}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/40 px-6 py-3.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
        >
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? "Added to cart" : "Add to cart"}
        </button>
        <button
          onClick={buyNow}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-deep px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
