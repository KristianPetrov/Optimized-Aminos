"use client";

import { useState, useTransition, useActionState } from "react";
import {
  ChevronDown,
  Check,
  Truck,
  X,
  MapPin,
  AlertCircle,
} from "lucide-react";
import type { Order, OrderItem } from "@/db/schema";
import {
  markOrderPaid,
  cancelOrder,
  markOrderShipped,
  type AdminActionState,
} from "@/lib/actions/admin";
import { formatPrice, formatDate } from "@/lib/format";
import { getTrackingUrl } from "@/lib/tracking";
import { getShippingOptionLabel } from "@/lib/shipping";
import { OrderStatusBadge } from "@/components/order-status-badge";

type AdminOrder = Order & { items: OrderItem[] };

const carriers = ["USPS", "UPS", "FedEx", "DHL"];

export function OrderManager({ order }: { order: AdminOrder }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shipState, shipAction, shipPending] = useActionState<
    AdminActionState,
    FormData
  >(markOrderShipped, null);

  const addr = order.shippingAddress;
  const shippingLabel = getShippingOptionLabel(addr.shippingMethod);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-800/50">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          <ChevronDown
            size={16}
            className={`text-faint transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
          <div>
            <p className="font-mono text-sm font-semibold text-gold">
              {order.reference}
            </p>
            <p className="text-xs text-faint">
              {addr.fullName} · {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-wider text-mist">
            Preferred: {order.paymentMethod}
          </span>
          <OrderStatusBadge status={order.status} />
          <span className="text-sm font-semibold text-foam">
            {formatPrice(order.totalCents)}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line px-5 py-5">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Items + customer */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-mist">
                Items
              </h4>
              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between text-sm text-foam"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-faint">× {item.quantity}</span>
                    </span>
                    <span className="text-mist">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.discountCents > 0 && (
                <p className="mt-2 flex justify-between text-sm text-emerald-300">
                  <span>
                    Discount
                    {order.referralCode && (
                      <span className="ml-1 font-mono">
                        ({order.referralCode})
                      </span>
                    )}
                  </span>
                  <span>−{formatPrice(order.discountCents)}</span>
                </p>
              )}
              <p className="mt-2 flex justify-between text-sm text-mist">
                <span>{shippingLabel}</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </p>

              <h4 className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-mist">
                <MapPin size={13} /> Ship to
              </h4>
              <div className="mt-2 text-sm leading-relaxed text-mist">
                <p className="text-foam">{addr.fullName}</p>
                <p>{addr.address1}</p>
                {addr.address2 && <p>{addr.address2}</p>}
                <p>
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p>{addr.country}</p>
                <p className="mt-1 text-faint">{addr.email}</p>
                {addr.phone && <p className="text-faint">{addr.phone}</p>}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-mist">
                Manage order
              </h4>

              {order.status === "shipped" && (
                <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-400/5 p-4 text-sm">
                  <p className="flex items-center gap-2 text-sky-300">
                    <Truck size={15} /> Shipped via {order.carrier}
                  </p>
                  {(() => {
                    const url = getTrackingUrl(
                      order.carrier,
                      order.trackingNumber,
                    );
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block font-mono text-sky-300 underline underline-offset-2 transition-colors hover:text-sky-200"
                      >
                        {order.trackingNumber}
                      </a>
                    ) : (
                      <p className="mt-1 font-mono text-foam">
                        {order.trackingNumber}
                      </p>
                    );
                  })()}
                </div>
              )}

              {order.status === "cancelled" && (
                <p className="mt-3 text-sm text-red-300">
                  This order was cancelled and items were restocked.
                </p>
              )}

              {order.status === "pending_payment" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => {
                        markOrderPaid(order.id);
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-emerald-400 disabled:opacity-60"
                  >
                    <Check size={15} /> Mark as Paid
                  </button>
                  <CancelButton
                    orderId={order.id}
                    isPending={isPending}
                    onCancel={() =>
                      startTransition(() => {
                        cancelOrder(order.id);
                      })
                    }
                  />
                </div>
              )}

              {order.status === "paid" && (
                <>
                  <form action={shipAction} className="mt-3 space-y-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <div>
                      <label className="mb-1.5 block text-xs text-mist">
                        Carrier
                      </label>
                      <select
                        name="carrier"
                        required
                        defaultValue=""
                        className="w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-foam outline-none focus:border-gold/50"
                      >
                        <option value="" disabled>
                          Select carrier
                        </option>
                        {carriers.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-mist">
                        Tracking number
                      </label>
                      <input
                        name="trackingNumber"
                        required
                        placeholder="1Z..."
                        className="w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-foam outline-none focus:border-gold/50"
                      />
                    </div>
                    {shipState?.error && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle size={13} /> {shipState.error}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={shipPending}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
                      >
                        <Truck size={15} />
                        {shipPending ? "Sending..." : "Mark Shipped & Notify"}
                      </button>
                      <CancelButton
                        orderId={order.id}
                        isPending={isPending}
                        onCancel={() =>
                          startTransition(() => {
                            cancelOrder(order.id);
                          })
                        }
                      />
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CancelButton({
  isPending,
  onCancel,
}: {
  orderId: string;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={isPending}
          onClick={onCancel}
          className="rounded-lg bg-red-500/90 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          Confirm cancel
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-line px-3 py-2.5 text-sm text-mist"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/10"
    >
      <X size={15} /> Cancel
    </button>
  );
}
