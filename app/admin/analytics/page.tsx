import type { Metadata } from "next";
import Link from "next/link";
import { getAllOrdersWithItems } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { SalesChart, type SalesPoint } from "@/components/admin/sales-chart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Analytics" };

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage(
  props: PageProps<"/admin/analytics">,
) {
  const { range } = await props.searchParams;
  const days =
    RANGES.find((r) => String(r.days) === range)?.days ?? 30;

  let orders: Awaited<ReturnType<typeof getAllOrdersWithItems>> = [];
  try {
    orders = await getAllOrdersWithItems();
  } catch {
    orders = [];
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  // Confirmed sales = paid or shipped.
  const confirmed = orders.filter(
    (o) => o.status === "paid" || o.status === "shipped",
  );
  const inRange = confirmed.filter((o) => new Date(o.createdAt) >= start);

  const revenueCents = inRange.reduce((s, o) => s + o.totalCents, 0);
  const orderCount = inRange.length;
  const unitsSold = inRange.reduce(
    (s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0),
    0,
  );
  const aovCents = orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;
  const discountCents = inRange.reduce((s, o) => s + o.discountCents, 0);
  const referredCount = inRange.filter((o) => o.referralCode).length;

  // Daily series including empty days.
  const byDay = new Map<string, { revenueCents: number; orders: number }>();
  for (const o of inRange) {
    const key = dayKey(new Date(o.createdAt));
    const cur = byDay.get(key) ?? { revenueCents: 0, orders: 0 };
    cur.revenueCents += o.totalCents;
    cur.orders += 1;
    byDay.set(key, cur);
  }

  const series: SalesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    const entry = byDay.get(key);
    series.push({
      date: key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(d),
      revenueCents: entry?.revenueCents ?? 0,
      orders: entry?.orders ?? 0,
    });
  }

  // Top products by revenue.
  const productTotals = new Map<
    string,
    { name: string; units: number; revenueCents: number }
  >();
  for (const o of inRange) {
    for (const item of o.items) {
      const cur = productTotals.get(item.slug) ?? {
        name: item.name,
        units: 0,
        revenueCents: 0,
      };
      cur.units += item.quantity;
      cur.revenueCents += item.unitPriceCents * item.quantity;
      productTotals.set(item.slug, cur);
    }
  }
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 6);
  const maxProductRevenue = topProducts[0]?.revenueCents ?? 1;

  // Status + payment breakdowns over the same window (all orders).
  const allInRange = orders.filter((o) => new Date(o.createdAt) >= start);
  const statusCounts: { label: string; count: number; color: string }[] = [
    {
      label: "Pending payment",
      count: allInRange.filter((o) => o.status === "pending_payment").length,
      color: "bg-amber-400",
    },
    {
      label: "Paid",
      count: allInRange.filter((o) => o.status === "paid").length,
      color: "bg-emerald-400",
    },
    {
      label: "Shipped",
      count: allInRange.filter((o) => o.status === "shipped").length,
      color: "bg-sky-400",
    },
    {
      label: "Cancelled",
      count: allInRange.filter((o) => o.status === "cancelled").length,
      color: "bg-red-400",
    },
  ];

  const zelleCount = inRange.filter((o) => o.paymentMethod === "zelle").length;
  const venmoCount = inRange.filter((o) => o.paymentMethod === "venmo").length;

  const stats = [
    { label: `Revenue (${days}d)`, value: formatPrice(revenueCents) },
    { label: "Confirmed Orders", value: String(orderCount) },
    { label: "Avg Order Value", value: formatPrice(aovCents) },
    { label: "Units Sold", value: String(unitsSold) },
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

      {/* Revenue chart */}
      <div className="mt-8 rounded-2xl border border-line bg-ink-800/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
              Daily revenue
            </h2>
            <p className="mt-1 text-xs text-faint">
              Confirmed orders (paid &amp; shipped) per day
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-line bg-ink/40 p-1">
            {RANGES.map((r) => (
              <Link
                key={r.days}
                href={`/admin/analytics?range=${r.days}`}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === r.days
                    ? "bg-gold/15 text-gold"
                    : "text-mist hover:text-foam"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-6">
          {orderCount === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-faint">
              No confirmed sales in this period yet.
            </div>
          ) : (
            <SalesChart data={series} />
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-2xl border border-line bg-ink-800/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
            Top products
          </h2>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-faint">No sales in this period.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {topProducts.map((p) => (
                <li key={p.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foam">{p.name}</span>
                    <span className="text-mist">
                      {formatPrice(p.revenueCents)}
                      <span className="ml-2 text-xs text-faint">
                        {p.units} units
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep"
                      style={{
                        width: `${Math.max(3, (p.revenueCents / maxProductRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {/* Order status breakdown */}
          <div className="rounded-2xl border border-line bg-ink-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
              Orders by status
            </h2>
            <ul className="mt-4 space-y-2.5">
              {statusCounts.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2.5 text-mist">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <span className="font-semibold text-foam">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payments + referrals */}
          <div className="rounded-2xl border border-line bg-ink-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foam">
              Payments &amp; referrals
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-mist">Zelle orders</span>
                <span className="font-semibold text-foam">{zelleCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-mist">Venmo orders</span>
                <span className="font-semibold text-foam">{venmoCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-mist">Referred orders</span>
                <span className="font-semibold text-foam">{referredCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-mist">Discounts given</span>
                <span className="font-semibold text-emerald-300">
                  {formatPrice(discountCents)}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
