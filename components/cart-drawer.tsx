"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const {
    items,
    isOpen,
    setOpen,
    setQuantity,
    removeItem,
    subtotalCents,
    count,
  } = useCart();
  const router = useRouter();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-navy-700 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-foam">
            <ShoppingBag size={16} className="text-gold" />
            Cart {count > 0 && <span className="text-gold">({count})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-mist hover:text-foam"
          >
            <X size={16} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag size={40} className="text-faint" />
            <p className="text-mist">Your cart is empty.</p>
            <Link
              href="/store"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-gold/40 px-5 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
            >
              Browse the catalog
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li
                    key={item.slug}
                    className="flex gap-3 rounded-xl border border-line bg-ink/40 p-3"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-white to-zinc-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foam">
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.slug)}
                          aria-label="Remove item"
                          className="text-faint hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-gold">
                        {formatPrice(item.priceCents)}
                      </p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          onClick={() =>
                            setQuantity(item.slug, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-mist hover:text-foam"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-sm text-foam">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            setQuantity(item.slug, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-mist hover:text-foam"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-line px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-mist">Subtotal</span>
                <span className="text-lg font-semibold text-foam">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <p className="mb-3 text-xs text-faint">
                Shipping options available at checkout. Taxes not applicable to
                research materials.
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/checkout");
                }}
                className="block w-full rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3 text-center text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
