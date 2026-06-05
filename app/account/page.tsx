import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getOrdersForUser } from "@/lib/data";
import { formatPrice, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirectTo=/account");

  let orders: Awaited<ReturnType<typeof getOrdersForUser>> = [];
  try {
    orders = await getOrdersForUser(session.user.id);
  } catch {
    orders = [];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foam">
            My account
          </h1>
          <p className="mt-2 text-sm text-mist">
            Signed in as {session.user.email}
          </p>
        </div>
        <Link
          href="/store"
          className="rounded-full border border-gold/40 px-5 py-2.5 text-sm text-gold transition-colors hover:bg-gold/10"
        >
          Continue shopping
        </Link>
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-[0.12em] text-foam">
        Order history
      </h2>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-ink-800/50 p-12 text-center">
          <Package size={36} className="mx-auto text-faint" />
          <p className="mt-4 text-mist">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/store"
            className="mt-4 inline-block rounded-full border border-gold/40 px-6 py-2.5 text-sm text-gold hover:bg-gold/10"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/order/${order.reference}`}
                className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-ink-800/50 p-5 transition-colors hover:border-gold/30"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-gold">
                    {order.reference}
                  </p>
                  <p className="mt-1 text-xs text-faint">
                    {formatDate(order.createdAt)} ·{" "}
                    <span className="capitalize">{order.paymentMethod}</span>
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-semibold text-foam">
                    {formatPrice(order.totalCents)}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-faint transition-transform group-hover:translate-x-1 group-hover:text-gold"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
