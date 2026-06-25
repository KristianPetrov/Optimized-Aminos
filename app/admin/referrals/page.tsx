import type { Metadata } from "next";
import { getAllProducts, getReferralPartnersWithCodes } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { NewPartnerForm, PartnerCard } from "@/components/admin/referral-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Referrals" };

export default async function AdminReferralsPage() {
  let partners: Awaited<ReturnType<typeof getReferralPartnersWithCodes>> = [];
  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    [partners, products] = await Promise.all([
      getReferralPartnersWithCodes(),
      getAllProducts(),
    ]);
  } catch {
    partners = [];
    products = [];
  }

  const allCodes = partners.flatMap((p) => p.codes);
  const activeCodes = allCodes.filter((c) => c.active).length;
  const referredOrders = allCodes.reduce((s, c) => s + c.orderCount, 0);
  const referredRevenue = allCodes.reduce((s, c) => s + c.revenueCents, 0);

  const stats = [
    { label: "Partners", value: String(partners.length) },
    { label: "Active Codes", value: String(activeCodes) },
    { label: "Referred Orders", value: String(referredOrders) },
    { label: "Referred Revenue", value: formatPrice(referredRevenue) },
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

      <div className="mt-8">
        <NewPartnerForm />
      </div>

      <div className="mt-6 space-y-4">
        {partners.length === 0 ? (
          <div className="rounded-2xl border border-line bg-ink-800/50 p-12 text-center text-mist">
            No referral partners yet. Create one to start issuing referral
            codes.
          </div>
        ) : (
          partners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              products={products}
            />
          ))
        )}
      </div>
    </div>
  );
}
