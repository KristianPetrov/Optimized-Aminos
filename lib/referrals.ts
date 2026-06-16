import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { referralCodes, referralPartners, type ReferralCode } from "@/db/schema";
import { formatPrice } from "./format";

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function computeDiscountCents(
  code: Pick<ReferralCode, "discountType" | "discountValue">,
  subtotalCents: number,
): number {
  const raw =
    code.discountType === "percent"
      ? Math.round((subtotalCents * code.discountValue) / 100)
      : code.discountValue;
  return Math.max(0, Math.min(raw, subtotalCents));
}

export function describeDiscount(
  code: Pick<ReferralCode, "discountType" | "discountValue">,
): string {
  return code.discountType === "percent"
    ? `${code.discountValue}% off`
    : `${formatPrice(code.discountValue)} off`;
}

export type ReferralValidation =
  | { ok: true; code: ReferralCode; discountCents: number }
  | { ok: false; error: string };

/**
 * Validates a referral code against a subtotal: the code and its partner must
 * be active and the subtotal must meet the code's minimum order amount.
 */
export async function validateReferralCode(
  rawCode: string,
  subtotalCents: number,
): Promise<ReferralValidation> {
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

  if (subtotalCents < match.code.minSubtotalCents) {
    return {
      ok: false,
      error: `This code requires a minimum order of ${formatPrice(match.code.minSubtotalCents)}.`,
    };
  }

  return {
    ok: true,
    code: match.code,
    discountCents: computeDiscountCents(match.code, subtotalCents),
  };
}
