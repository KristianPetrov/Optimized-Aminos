import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Copy, Truck } from "lucide-react";
import { auth } from "@/auth";
import { getOrderByReference } from "@/lib/data";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderPage(props: PageProps<"/order/[reference]">) {
  const { reference } = await props.params;
  const session = await auth();

  let order;
  try {
    order = await getOrderByReference(reference);
  } catch {
    order = null;
  }

  if (!order) notFound();

  // Only the owner or an admin may view an order.
  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isAdmin = session?.user?.role === "admin";
  if (!isOwner && !isAdmin) notFound();

  const zelle =
    process.env.NEXT_PUBLIC_ZELLE_RECIPIENT || "payments@optimizedaminos.com";
  const venmo = process.env.NEXT_PUBLIC_VENMO_HANDLE || "@OptimizedAminos";
  const payTo = order.paymentMethod === "zelle" ? zelle : venmo;

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
            via <strong className="capitalize text-foam">{order.paymentMethod}</strong> to:
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-ink/60 px-4 py-3">
            <span className="font-mono text-base text-foam">{payTo}</span>
            <Copy size={16} className="text-faint" />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-mist">
            Include your order reference{" "}
            <strong className="text-gold">{order.reference}</strong> in the
            payment note so we can match it quickly. Your order ships once
            payment is confirmed — we&apos;ll email you at every step.
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
            <span className="font-mono text-foam">{order.trackingNumber}</span>
          </p>
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
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink">
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
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
        <div className="flex justify-between text-base font-semibold text-foam">
          <span>Total</span>
          <span>{formatPrice(order.totalCents)}</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/account"
          className="inline-block rounded-full border border-line px-6 py-2.5 text-sm text-mist transition-colors hover:text-foam"
        >
          View all my orders
        </Link>
      </div>
    </div>
  );
}
