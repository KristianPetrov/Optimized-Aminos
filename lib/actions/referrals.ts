"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { referralPartners, referralCodes } from "@/db/schema";
import { auth } from "@/auth";
import { normalizeCode, validateReferralCode } from "@/lib/referrals";
import { formatPrice } from "@/lib/format";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export type ReferralActionState = { ok?: boolean; error?: string } | null;

const partnerSchema = z.object({
  name: z.string().min(2, "Partner name is required."),
  email: z
    .string()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export async function createReferralPartner(
  _prev: ReferralActionState,
  formData: FormData,
): Promise<ReferralActionState> {
  await requireAdmin();

  const parsed = partnerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.insert(referralPartners).values({
    name: parsed.data.name.trim(),
    email: parsed.data.email ? parsed.data.email.toLowerCase() : null,
    notes: parsed.data.notes?.trim() || null,
  });

  revalidatePath("/admin/referrals");
  return { ok: true };
}

export async function toggleReferralPartner(
  partnerId: string,
  active: boolean,
): Promise<ReferralActionState> {
  await requireAdmin();
  await db
    .update(referralPartners)
    .set({ active })
    .where(eq(referralPartners.id, partnerId));
  revalidatePath("/admin/referrals");
  return { ok: true };
}

const codeSchema = z.object({
  partnerId: z.string().uuid(),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters.")
    .max(24, "Code must be 24 characters or fewer.")
    .regex(/^[a-zA-Z0-9-]+$/, "Use only letters, numbers, and dashes."),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number().positive("Discount must be greater than 0."),
  minOrderDollars: z.coerce.number().min(0).max(1000000).default(0),
});

export async function createReferralCode(
  _prev: ReferralActionState,
  formData: FormData,
): Promise<ReferralActionState> {
  await requireAdmin();

  const parsed = codeSchema.safeParse({
    partnerId: formData.get("partnerId"),
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrderDollars: formData.get("minOrderDollars") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { partnerId, code, discountType, discountValue, minOrderDollars } =
    parsed.data;

  if (discountType === "percent" && (discountValue < 1 || discountValue > 100)) {
    return { error: "Percent discount must be between 1 and 100." };
  }

  const normalized = normalizeCode(code);
  const [existing] = await db
    .select({ id: referralCodes.id })
    .from(referralCodes)
    .where(eq(referralCodes.code, normalized))
    .limit(1);

  if (existing) {
    return { error: `Code ${normalized} already exists.` };
  }

  await db.insert(referralCodes).values({
    partnerId,
    code: normalized,
    discountType,
    discountValue:
      discountType === "percent"
        ? Math.round(discountValue)
        : Math.round(discountValue * 100),
    minSubtotalCents: Math.round(minOrderDollars * 100),
  });

  revalidatePath("/admin/referrals");
  return { ok: true };
}

export async function toggleReferralCode(
  codeId: string,
  active: boolean,
): Promise<ReferralActionState> {
  await requireAdmin();
  await db
    .update(referralCodes)
    .set({ active })
    .where(eq(referralCodes.id, codeId));
  revalidatePath("/admin/referrals");
  return { ok: true };
}

export type ApplyCodeResult =
  | { ok: true; code: string; discountCents: number; description: string }
  | { ok: false; error: string };

/** Public action used at checkout to preview a referral code's discount. */
export async function applyReferralCode(
  rawCode: string,
  subtotalCents: number,
): Promise<ApplyCodeResult> {
  const result = await validateReferralCode(rawCode, subtotalCents);
  if (!result.ok) return result;

  return {
    ok: true,
    code: result.code.code,
    discountCents: result.discountCents,
    description:
      result.code.discountType === "percent"
        ? `${result.code.discountValue}% off`
        : `${formatPrice(result.code.discountValue)} off`,
  };
}
