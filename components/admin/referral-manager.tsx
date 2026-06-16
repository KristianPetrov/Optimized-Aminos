"use client";

import { useState, useTransition, useActionState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Plus,
  Tag,
  AlertCircle,
  Power,
  UserPlus,
} from "lucide-react";
import type { ReferralPartner } from "@/db/schema";
import type { ReferralCodeWithStats } from "@/lib/data";
import {
  createReferralPartner,
  createReferralCode,
  toggleReferralPartner,
  toggleReferralCode,
  type ReferralActionState,
} from "@/lib/actions/referrals";
import { formatPrice, formatDate } from "@/lib/format";

type PartnerWithCodes = ReferralPartner & { codes: ReferralCodeWithStats[] };

const inputClass =
  "w-full rounded-lg border border-line bg-ink/60 px-3 py-2.5 text-sm text-foam placeholder:text-faint outline-none transition-colors focus:border-gold/50";
const labelClass = "mb-1.5 block text-xs text-mist";

export function NewPartnerForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ReferralActionState, FormData>(
    createReferralPartner,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
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

export function PartnerCard({ partner }: { partner: PartnerWithCodes }) {
  const [expanded, setExpanded] = useState(true);
  const [isPending, startTransition] = useTransition();

  const referredOrders = partner.codes.reduce((s, c) => s + c.orderCount, 0);
  const referredRevenue = partner.codes.reduce((s, c) => s + c.revenueCents, 0);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-ink-800/50 ${
        !partner.active ? "opacity-60" : ""
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
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
              partner.active
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
            <NewCodeForm partnerId={partner.id} />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  toggleReferralPartner(partner.id, !partner.active);
                })
              }
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors disabled:opacity-60 ${
                partner.active
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

function CodeRow({ code }: { code: ReferralCodeWithStats }) {
  const [isPending, startTransition] = useTransition();

  const discountLabel =
    code.discountType === "percent"
      ? `${code.discountValue}% off`
      : `${formatPrice(code.discountValue)} off`;

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3 ${
        !code.active ? "opacity-60" : ""
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
          </p>
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
            startTransition(() => {
              toggleReferralCode(code.id, !code.active);
            })
          }
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors disabled:opacity-60 ${
            code.active
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

function NewCodeForm({ partnerId }: { partnerId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [state, action, pending] = useActionState<ReferralActionState, FormData>(
    createReferralCode,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setOpen(false);
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
            onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
            className={inputClass}
          >
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </div>
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
