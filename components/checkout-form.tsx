"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";
import { useCart } from "./cart-provider";
import { placeOrder } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format";

type PaymentMethod = "zelle" | "venmo";

export function CheckoutForm({
  defaultEmail,
  defaultName,
  zelleRecipient,
  venmoHandle,
}: {
  defaultEmail: string;
  defaultName: string;
  zelleRecipient: string;
  venmoHandle: string;
}) {
  const { items, subtotalCents, clear } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("zelle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      shipping: {
        fullName: String(data.get("fullName") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        address1: String(data.get("address1") || ""),
        address2: String(data.get("address2") || ""),
        city: String(data.get("city") || ""),
        state: String(data.get("state") || ""),
        postalCode: String(data.get("postalCode") || ""),
        country: String(data.get("country") || "United States"),
      },
      paymentMethod: method,
      acceptedTerms: data.get("acceptedTerms") === "on",
    };

    if (!payload.acceptedTerms) {
      setError("Please confirm the Research Use Only terms to continue.");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder(payload);
      if (result.ok) {
        clear();
        router.push(
          `/order/${result.reference}?email=${encodeURIComponent(result.email)}`,
        );
      } else {
        setError(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-ink-800/50 p-12 text-center">
        <p className="text-mist">Your cart is empty.</p>
        <Link
          href="/store"
          className="mt-4 inline-block rounded-full border border-gold/40 px-6 py-2.5 text-sm text-gold hover:bg-gold/10"
        >
          Browse the catalog
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        {/* Shipping */}
        <section className="panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
            Shipping details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-mist">Full name</label>
              <input name="fullName" required defaultValue={defaultName} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">Email</label>
              <input name="email" type="email" required defaultValue={defaultEmail} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">Phone (optional)</label>
              <input name="phone" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-mist">Address</label>
              <input name="address1" required placeholder="Street address" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <input name="address2" placeholder="Apt, suite, lab, etc. (optional)" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">City</label>
              <input name="city" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">State / Region</label>
              <input name="state" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">Postal code</label>
              <input name="postalCode" required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-mist">Country</label>
              <input name="country" required defaultValue="United States" className={inputClass} />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
            Payment method
          </h2>
          <p className="mt-2 text-xs text-mist">
            We process payments manually. Choose a method — you&apos;ll receive
            instructions and your order reference after placing the order.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(["zelle", "venmo"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                  method === m
                    ? "border-gold/60 bg-gold/10"
                    : "border-line bg-ink/40 hover:border-gold/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize text-foam">{m}</span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      method === m ? "border-gold bg-gold" : "border-faint"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-mist">
                  {m === "zelle" ? zelleRecipient : venmoHandle}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
            Order summary
          </h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.slug} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-white to-zinc-100">
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-foam">{item.name}</p>
                    <p className="text-xs text-faint">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm text-mist">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-5 h-px bg-line" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-mist">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-mist">
              <span>Shipping</span>
              <span className="text-gold">Complimentary</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-foam">
              <span>Total</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-2.5 text-xs text-mist">
            <input type="checkbox" name="acceptedTerms" className="mt-0.5 h-4 w-4 accent-[#e8c879]" />
            <span>
              I confirm I am a qualified researcher and these products are for{" "}
              <strong className="text-gold">Research Use Only</strong> — not for
              human or veterinary use.
            </span>
          </label>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <AlertCircle size={15} className="mt-px shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            <Lock size={15} />
            {isPending ? "Placing order..." : "Place order"}
          </button>
        </div>
      </aside>
    </form>
  );
}
