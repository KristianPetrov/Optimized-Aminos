import type { Metadata } from "next";
import { getAllOrdersWithItems } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { OrderManager } from "@/components/admin/order-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof getAllOrdersWithItems>> = [];
  try {
    orders = await getAllOrdersWithItems();
  } catch {
    orders = [];
  }

  const pending = orders.filter((o) => o.status === "pending_payment");
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Total Orders", value: String(orders.length) },
    { label: "Awaiting Payment", value: String(pending.length) },
    { label: "Ready to Ship", value: String(paid.length) },
    { label: "Confirmed Revenue", value: formatPrice(revenue) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-ink-800/50 p-5"
          >
            <p className="text-xs uppercase tracking-wider text-faint">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foam">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-ink-800/50 p-12 text-center text-mist">
            No orders yet.
          </div>
        ) : (
          orders.map((order) => (
            <OrderManager key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}
