"use client";

import { useState, useTransition, useActionState, useEffect, useRef } from "react";
import
  {
    ChevronDown,
    Plus,
    Tag,
    AlertCircle,
    Power,
    UserPlus,
  } from "lucide-react";
import type { DiscountType, Product, ReferralPartner } from "@/db/schema";
import type { ReferralCodeWithStats } from "@/lib/data";
import
  {
    createReferralPartner,
    createReferralCode,
    toggleReferralPartner,
    toggleReferralCode,
    toggleReferralCodeReconstitutionExclusion,
    type ReferralActionState,
  } from "@/lib/actions/referrals";
import { formatPrice, formatDate } from "@/lib/format";

type PartnerWithCodes = ReferralPartner & { codes: ReferralCodeWithStats[] };
type ReferralProduct = Pick<
  Product,
  "id" | "name" | "category" | "priceCents"
>;

const inputClass =
  "w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";
const labelClass = "mb-1.5 block text-xs text-mist";

export function NewPartnerForm ()
{
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ReferralActionState, FormData>(
    createReferralPartner,
    null,
  );

  useEffect(() =>
  {
    if (state?.ok) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close form after server action success
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
      >
        <UserPlus size={15} /> New Partner
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="w-full rounded-2xl border border-gold/30 bg-gold/5 p-5"
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-gold">
        New referral partner
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Partner name</label>
          <input name="name" required placeholder="Jane Doe" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input
            name="email"
            type="email"
            placeholder="partner@example.com"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes (optional)</label>
          <input
            name="notes"
            placeholder="Instagram influencer, gym owner, etc."
            className={inputClass}
          />
        </div>
      </div>
      {state?.error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={13} /> {state.error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create partner"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-mist hover:text-foam"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PartnerCard ({
  partner,
  products,
}: {
  partner: PartnerWithCodes;
  products: ReferralProduct[];
})
{
  const [expanded, setExpanded] = useState(true);
  const [isPending, startTransition] = useTransition();

  const referredOrders = partner.codes.reduce((s, c) => s + c.orderCount, 0);
  const referredRevenue = partner.codes.reduce((s, c) => s + c.revenueCents, 0);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-ink-800/50 ${!partner.active ? "opacity-60" : ""
        }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-4">
          <ChevronDown
            size={16}
            className={`text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          <div>
            <p className="text-sm font-semibold text-foam">{partner.name}</p>
            <p className="text-xs text-faint">
              {partner.email ?? "No email"} · Added {formatDate(partner.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-xs text-mist">
            {partner.codes.length} {partner.codes.length === 1 ? "code" : "codes"}
          </span>
          <span className="text-xs text-mist">{referredOrders} orders</span>
          <span className="font-semibold text-foam">
            {formatPrice(referredRevenue)}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${partner.active
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-red-400/10 text-red-300"
              }`}
          >
            {partner.active ? "Active" : "Inactive"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line px-5 py-5">
          {partner.notes && (
            <p className="mb-4 text-sm text-mist">{partner.notes}</p>
          )}

          {partner.codes.length > 0 ? (
            <ul className="space-y-3">
              {partner.codes.map((code) => (
                <CodeRow key={code.id} code={code} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">No referral codes yet.</p>
          )}

          <div className="mt-5">
            <NewCodeForm partnerId={partner.id} products={products} />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                {
                  toggleReferralPartner(partner.id, !partner.active);
                })
              }
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors disabled:opacity-60 ${partner.active
                  ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                  : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                }`}
            >
              <Power size={13} />
              {partner.active ? "Deactivate partner" : "Reactivate partner"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CodeRow ({ code }: { code: ReferralCodeWithStats })
{
  const [isPending, startTransition] = useTransition();

  const discountLabel =
    code.discountType === "percent"
      ? `${code.discountValue}% off`
      : code.discountType === "fixed"
        ? `${formatPrice(code.discountValue)} off`
        : `Set prices · ${code.productPrices.length} ${
          code.productPrices.length === 1 ? "product" : "products"
        }`;
  const setPriceSummary = code.discountType === "set_price"
    ? code.productPrices
      .slice(0, 4)
      .map((price) => `${price.productName} ${formatPrice(price.priceCents)}`)
      .join(" · ")
    : "";

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3 ${!code.active ? "opacity-60" : ""
        }`}
    >
      <div className="flex items-center gap-3">
        <Tag size={15} className="text-gold" />
        <div>
          <p className="font-mono text-sm font-semibold text-gold">{code.code}</p>
          <p className="text-xs text-mist">
            {discountLabel}
            {code.minSubtotalCents > 0 &&
              ` · min order ${formatPrice(code.minSubtotalCents)}`}
            {code.excludeReconstitutionSolution &&
              " · excludes reconstitution solution"}
          </p>
          {setPriceSummary && (
            <p className="mt-1 text-xs text-faint">
              {setPriceSummary}
              {code.productPrices.length > 4 && " · more"}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-mist">
          <p>
            {code.orderCount} {code.orderCount === 1 ? "order" : "orders"} ·{" "}
            {formatPrice(code.revenueCents)} revenue
          </p>
          <p className="text-faint">
            {formatPrice(code.discountGivenCents)} discounts given
          </p>
        </div>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
            {
              toggleReferralCodeReconstitutionExclusion(
                code.id,
                !code.excludeReconstitutionSolution,
              );
            })
          }
          aria-pressed={code.excludeReconstitutionSolution}
          aria-label="Toggle reconstitution solution eligibility"
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors disabled:opacity-60 ${code.excludeReconstitutionSolution
              ? "bg-amber-400/10 text-amber-300 hover:bg-white/10 hover:text-mist"
              : "bg-white/5 text-mist hover:bg-amber-400/10 hover:text-amber-300"
            }`}
        >
          {code.excludeReconstitutionSolution ? "Recon off" : "Recon on"}
        </button>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
            {
              toggleReferralCode(code.id, !code.active);
            })
          }
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors disabled:opacity-60 ${code.active
              ? "bg-emerald-400/10 text-emerald-300 hover:bg-red-400/10 hover:text-red-300"
              : "bg-red-400/10 text-red-300 hover:bg-emerald-400/10 hover:text-emerald-300"
            }`}
        >
          {code.active ? "Active" : "Inactive"}
        </button>
      </div>
    </li>
  );
}

function NewCodeForm ({
  partnerId,
  products,
}: {
  partnerId: string;
  products: ReferralProduct[];
})
{
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [state, action, pending] = useActionState<ReferralActionState, FormData>(
    createReferralCode,
    null,
  );
  const productsByCategory = products.reduce<Record<string, ReferralProduct[]>>(
    (groups, product) =>
    {
      const group = groups[product.category] ?? [];
      group.push(product);
      groups[product.category] = group;
      return groups;
    },
    {},
  );
  const productGroups = Object.entries(productsByCategory);

  useEffect(() =>
  {
    if (state?.ok) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close form after server action success
      setOpen(false);
      setDiscountType("percent");
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gold/40 px-3 py-2 text-xs text-gold transition-colors hover:bg-gold/10"
      >
        <Plus size={13} /> New referral code
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-xl border border-gold/30 bg-gold/5 p-4"
    >
      <input type="hidden" name="partnerId" value={partnerId} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>Code</label>
          <input
            name="code"
            required
            placeholder="JANE10"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass}>Discount type</label>
          <select
            name="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            className={inputClass}
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed ($)</option>
            <option value="set_price">Set prices</option>
          </select>
        </div>
        {discountType === "set_price" ? (
          <input type="hidden" name="discountValue" value="0" />
        ) : (
          <div>
            <label className={labelClass}>
              {discountType === "percent" ? "Percent off" : "Dollars off"}
            </label>
            <input
              name="discountValue"
              required
              type="number"
              min={discountType === "percent" ? 1 : 0.01}
              max={discountType === "percent" ? 100 : undefined}
              step={discountType === "percent" ? 1 : 0.01}
              placeholder={discountType === "percent" ? "10" : "25.00"}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className={labelClass}>Min order $ (optional)</label>
          <input
            name="minOrderDollars"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>
      {discountType === "set_price" && (
        <div className="mt-4 rounded-lg border border-line bg-ink/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-medium uppercase tracking-wider text-mist">
              Product set prices
            </label>
            <span className="text-[11px] text-faint">
              Leave unchanged products blank
            </span>
          </div>
          {productGroups.length === 0 ? (
            <p className="mt-3 text-xs text-faint">
              No products are available for set pricing.
            </p>
          ) : (
            <div className="mt-3 max-h-80 space-y-4 overflow-y-auto pr-1">
              {productGroups.map(([category, categoryProducts]) => (
                <div key={category}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
                    {category}
                  </p>
                  <div className="space-y-2">
                    {categoryProducts.map((product) => (
                      <label
                        key={product.id}
                        className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-lg border border-line bg-ink/50 px-3 py-2"
                      >
                        <span>
                          <span className="block text-xs font-medium text-foam">
                            {product.name}
                          </span>
                          <span className="block text-[11px] text-faint">
                            Current {formatPrice(product.priceCents)}
                          </span>
                        </span>
                        <input
                          name={`setPrice:${product.id}`}
                          type="number"
                          min={0.01}
                          step={0.01}
                          placeholder={(product.priceCents / 100).toFixed(2)}
                          className="w-full rounded-md border border-line bg-ink/70 px-2 py-1.5 text-right text-xs text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <label className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-ink/40 px-3 py-2 sm:col-span-2 lg:col-span-4">
        <input
          type="checkbox"
          name="excludeReconstitutionSolution"
          className="mt-0.5 h-4 w-4 accent-[#e8c879]"
        />
        <span className="text-xs text-mist">
          Exclude reconstitution solution
        </span>
      </label>
      {state?.error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={13} /> {state.error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-gold to-gold-deep px-4 py-2 text-xs font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create code"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-xs text-mist hover:text-foam"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
