import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Copy, Truck, ArrowUpRight } from "lucide-react";
import { auth } from "@/auth";
import { getOrderByReference } from "@/lib/data";
import { formatPrice, formatDate } from "@/lib/format";
import { buildVenmoLink, formatVenmoHandle } from "@/lib/payments";
import { getTrackingUrl } from "@/lib/tracking";
import { getShippingOptionLabel } from "@/lib/shipping";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderPage(props: PageProps<"/order/[reference]">) {
  const { reference } = await props.params;
  const { email: emailParam } = await props.searchParams;
  const session = await auth();

  let order;
  try {
    order = await getOrderByReference(reference);
  } catch {
    order = null;
  }

  if (!order) redirect(`/track?reference=${encodeURIComponent(reference)}`);

  // Access is granted to: the owner, an admin, or anyone who can supply the
  // matching email (guest orders are verified by reference + email).
  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isAdmin = session?.user?.role === "admin";
  const providedEmail =
    typeof emailParam === "string" ? emailParam.toLowerCase() : null;
  const emailMatches = providedEmail === order.email.toLowerCase();

  if (!isOwner && !isAdmin && !emailMatches) {
    redirect(`/track?reference=${encodeURIComponent(reference)}`);
  }

  const isGuestView = !isOwner && !isAdmin;

  const zelle =
    process.env.NEXT_PUBLIC_ZELLE_RECIPIENT || "payments@optimizedaminos.co";
  const venmo = process.env.NEXT_PUBLIC_VENMO_HANDLE || "OptimizedAminos";
  const venmoLink = buildVenmoLink(venmo, order.totalCents, order.reference);
  const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);
  const shippingLabel = getShippingOptionLabel(
    order.shippingAddress.shippingMethod,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold animate-fade-in">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="animate-fade-up mt-5 text-3xl font-semibold tracking-tight text-foam">
          Order confirmed
        </h1>
        <p className="mt-2 text-mist">
          Reference{" "}
          <span className="font-mono font-semibold text-gold">
            {order.reference}
          </span>
        </p>
        <div className="mt-3 flex justify-center">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Payment instructions */}
      {order.status === "pending_payment" && (
        <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">
            Complete your payment
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Send{" "}
            <strong className="text-foam">
              {formatPrice(order.totalCents)}
            </strong>{" "}
            with either Zelle or Venmo. Use whichever method works best.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-ink/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foam">Zelle</span>
                <Copy size={16} className="text-faint" />
              </div>
              <p className="mt-2 break-all font-mono text-base text-gold">
                {zelle}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-ink/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foam">Venmo</span>
                <Copy size={16} className="text-faint" />
              </div>
              <p className="mt-2 font-mono text-base text-gold">
                {formatVenmoHandle(venmo)}
              </p>
            </div>
          </div>

          <a
            href={venmoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D95CE] py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
          >
            Pay {formatPrice(order.totalCents)} with Venmo
            <ArrowUpRight size={16} />
          </a>

          <p className="mt-3 text-xs leading-relaxed text-mist">
            Include your order reference in the payment note so we can match it
            quickly. The Venmo link pre-fills the amount and reference.{" "}
            Your order reference is{" "}
            <strong className="text-gold">{order.reference}</strong>. Your order
            ships once payment is confirmed — we&apos;ll email you at every step.
          </p>
        </div>
      )}

      {order.status === "shipped" && order.trackingNumber && (
        <div className="mt-10 rounded-2xl border border-sky-400/30 bg-sky-400/5 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">
            <Truck size={16} /> Shipment tracking
          </h2>
          <p className="mt-3 text-sm text-mist">
            Carrier: <strong className="text-foam">{order.carrier}</strong>
          </p>
          <p className="mt-1 text-sm text-mist">
            Tracking:{" "}
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sky-300 underline underline-offset-2 transition-colors hover:text-sky-200"
              >
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-mono text-foam">
                {order.trackingNumber}
              </span>
            )}
          </p>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-400/40 px-4 py-2.5 text-sm text-sky-300 transition-colors hover:bg-sky-400/10"
            >
              Track package on {order.carrier}
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      )}

      {/* Items */}
      <div className="mt-8 panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
            Items
          </h2>
          <span className="text-xs text-faint">
            {formatDate(order.createdAt)}
          </span>
        </div>
        <ul className="mt-5 space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-white to-zinc-100">
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foam">{item.name}</p>
                <p className="text-xs text-faint">Qty {item.quantity}</p>
              </div>
              <span className="text-sm text-mist">
                {formatPrice(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="my-5 h-px bg-line" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-mist">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-emerald-300">
              <span>
                Discount
                {order.referralCode && (
                  <span className="ml-1 font-mono">({order.referralCode})</span>
                )}
              </span>
              <span>−{formatPrice(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-mist">
            <span>{shippingLabel}</span>
            <span>{formatPrice(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-foam">
            <span>Total</span>
            <span>{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        {isGuestView ? (
          <p className="text-sm text-mist">
            Save this page or your order number{" "}
            <span className="font-mono text-gold">{order.reference}</span> to
            check your status anytime at{" "}
            <Link href="/track" className="text-gold hover:underline">
              order tracking
            </Link>
            .
          </p>
        ) : (
          <Link
            href="/account"
            className="inline-block rounded-full border border-line px-6 py-2.5 text-sm text-mist transition-colors hover:text-foam"
          >
            View all my orders
          </Link>
        )}
      </div>
    </div>
  );
}
