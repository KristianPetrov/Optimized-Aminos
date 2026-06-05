import type { OrderStatus } from "@/db/schema";

const config: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  paid: {
    label: "Paid",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  shipped: {
    label: "Shipped",
    className: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-400/40 bg-red-400/10 text-red-300",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
