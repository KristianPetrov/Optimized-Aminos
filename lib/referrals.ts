import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import
  {
    referralCodeProductPrices,
    referralCodes,
    referralPartners,
    type ReferralCode,
  } from "@/db/schema";
import { formatPrice } from "./format";

export function normalizeCode (raw: string): string
{
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function computeDiscountCents (
  code: Pick<ReferralCode, "discountType" | "discountValue">,
  subtotalCents: number,
): number
{
  const raw = code.discountType === "percent"
    ? Math.round((subtotalCents * code.discountValue) / 100)
    : code.discountType === "fixed"
      ? code.discountValue
      : 0;
  return Math.max(0, Math.min(raw, subtotalCents));
}

export function describeDiscount (
  code: Pick<ReferralCode, "discountType" | "discountValue">,
): string
{
  if (code.discountType === "percent") return `${code.discountValue}% off`;
  if (code.discountType === "fixed") {
    return `${formatPrice(code.discountValue)} off`;
  }
  return "Set item prices";
}

export type ReferralPricedItem = {
  productId: string;
  unitPriceCents: number;
  quantity: number;
  isReconstitutionSolution: boolean;
};

export type ReferralPriceOverride = {
  productId: string;
  priceCents: number;
  discountCents: number;
};

export type ReferralValidation =
  | {
      ok: true;
      code: ReferralCode;
      discountCents: number;
      discountableSubtotalCents: number;
      excludedSubtotalCents: number;
      priceOverrides: ReferralPriceOverride[];
    }
  | { ok: false; error: string };

async function computeSetPriceDiscount (
  codeId: string,
  items: ReferralPricedItem[],
  excludeReconstitutionSolution: boolean,
): Promise<{
  discountCents: number;
  priceOverrides: ReferralPriceOverride[];
}>
{
  const eligibleItems = excludeReconstitutionSolution
    ? items.filter((item) => !item.isReconstitutionSolution)
    : items;
  const productIds = Array.from(
    new Set(eligibleItems.map((item) => item.productId)),
  );

  if (productIds.length === 0) {
    return { discountCents: 0, priceOverrides: [] };
  }

  const prices = await db
    .select({
      productId: referralCodeProductPrices.productId,
      priceCents: referralCodeProductPrices.priceCents,
    })
    .from(referralCodeProductPrices)
    .where(
      and(
        eq(referralCodeProductPrices.referralCodeId, codeId),
        inArray(referralCodeProductPrices.productId, productIds),
      ),
    );

  const priceByProductId = new Map(
    prices.map((price) => [price.productId, price.priceCents]),
  );
  let discountCents = 0;
  const priceOverrides: ReferralPriceOverride[] = [];

  for (const item of eligibleItems) {
    const setPriceCents = priceByProductId.get(item.productId);
    if (setPriceCents === undefined) continue;

    const lineDiscountCents =
      Math.max(0, item.unitPriceCents - setPriceCents) * item.quantity;
    if (lineDiscountCents <= 0) continue;

    discountCents += lineDiscountCents;
    priceOverrides.push({
      productId: item.productId,
      priceCents: setPriceCents,
      discountCents: lineDiscountCents,
    });
  }

  return { discountCents, priceOverrides };
}

/**
 * Validates a referral code against a subtotal: the code and its partner must
 * be active and the subtotal must meet the code's minimum order amount.
 */
export async function validateReferralCode (
  rawCode: string,
  subtotalCents: number,
  reconstitutionSolutionSubtotalCents = 0,
  pricedItems: ReferralPricedItem[] = [],
): Promise<ReferralValidation>
{
  const normalized = normalizeCode(rawCode);
  if (!normalized) {
    return { ok: false, error: "Enter a referral code." };
  }

  const [match] = await db
    .select({
      code: referralCodes,
      partnerActive: referralPartners.active,
    })
    .from(referralCodes)
    .innerJoin(
      referralPartners,
      eq(referralCodes.partnerId, referralPartners.id),
    )
    .where(eq(referralCodes.code, normalized))
    .limit(1);

  if (!match || !match.code.active || !match.partnerActive) {
    return { ok: false, error: "That referral code isn't valid." };
  }

  const excludedSubtotalCents = match.code.excludeReconstitutionSolution
    ? Math.min(Math.max(reconstitutionSolutionSubtotalCents, 0), subtotalCents)
    : 0;
  const discountableSubtotalCents = subtotalCents - excludedSubtotalCents;

  if (discountableSubtotalCents <= 0) {
    return {
      ok: false,
      error: "This code doesn't apply to reconstitution solution.",
    };
  }

  if (discountableSubtotalCents < match.code.minSubtotalCents) {
    return {
      ok: false,
      error: `This code requires a minimum order of ${formatPrice(match.code.minSubtotalCents)}.`,
    };
  }

  if (match.code.discountType === "set_price") {
    if (pricedItems.length === 0) {
      return {
        ok: false,
        error: "This code needs cart items before set prices can be applied.",
      };
    }

    const setPriceResult = await computeSetPriceDiscount(
      match.code.id,
      pricedItems,
      match.code.excludeReconstitutionSolution,
    );

    if (setPriceResult.discountCents <= 0) {
      return {
        ok: false,
        error: "This code doesn't set prices for items in your cart.",
      };
    }

    return {
      ok: true,
      code: match.code,
      discountCents: Math.min(
        setPriceResult.discountCents,
        discountableSubtotalCents,
      ),
      discountableSubtotalCents,
      excludedSubtotalCents,
      priceOverrides: setPriceResult.priceOverrides,
    };
  }

  return {
    ok: true,
    code: match.code,
    discountCents: computeDiscountCents(match.code, discountableSubtotalCents),
    discountableSubtotalCents,
    excludedSubtotalCents,
    priceOverrides: [],
  };
}
