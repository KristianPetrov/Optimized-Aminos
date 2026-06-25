"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import
  {
    products,
    referralCodeProductPrices,
    referralPartners,
    referralCodes,
  } from "@/db/schema";
import { auth } from "@/auth";
import
  {
    describeDiscount,
    normalizeCode,
    validateReferralCode,
    type ReferralPricedItem,
  } from "@/lib/referrals";
import { formatPrice } from "@/lib/format";

async function requireAdmin ()
{
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

export async function createReferralPartner (
  _prev: ReferralActionState,
  formData: FormData,
): Promise<ReferralActionState>
{
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

export async function toggleReferralPartner (
  partnerId: string,
  active: boolean,
): Promise<ReferralActionState>
{
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
  discountType: z.enum(["percent", "fixed", "set_price"]),
  discountValue: z.coerce.number().min(0, "Discount must be 0 or greater."),
  minOrderDollars: z.coerce.number().min(0).max(1000000).default(0),
  excludeReconstitutionSolution: z.boolean(),
});

const setPriceEntrySchema = z.object({
  productId: z.string().uuid(),
  priceDollars: z.coerce.number().positive().max(100000),
});

function parseSetPriceEntries (formData: FormData)
{
  const rawEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("setPrice:"))
    .map(([key, value]) => ({
      productId: key.slice("setPrice:".length),
      priceDollars: String(value).trim(),
    }))
    .filter((entry) => entry.priceDollars !== "");

  return z.array(setPriceEntrySchema).safeParse(rawEntries);
}

export async function createReferralCode (
  _prev: ReferralActionState,
  formData: FormData,
): Promise<ReferralActionState>
{
  await requireAdmin();

  const parsed = codeSchema.safeParse({
    partnerId: formData.get("partnerId"),
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue") || 0,
    minOrderDollars: formData.get("minOrderDollars") || 0,
    excludeReconstitutionSolution:
      formData.get("excludeReconstitutionSolution") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    partnerId,
    code,
    discountType,
    discountValue,
    minOrderDollars,
    excludeReconstitutionSolution,
  } = parsed.data;

  if (discountType === "percent" && (discountValue < 1 || discountValue > 100)) {
    return { error: "Percent discount must be between 1 and 100." };
  }

  if (discountType === "fixed" && discountValue <= 0) {
    return { error: "Fixed discount must be greater than 0." };
  }

  const setPriceEntriesResult = parseSetPriceEntries(formData);
  if (!setPriceEntriesResult.success) {
    return { error: "Enter valid set prices." };
  }
  const setPriceEntries = Array.from(
    new Map(
      setPriceEntriesResult.data.map((entry) => [entry.productId, entry]),
    ).values(),
  );

  if (discountType === "set_price" && setPriceEntries.length === 0) {
    return { error: "Add at least one product set price." };
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

  if (discountType === "set_price") {
    const productIds = Array.from(
      new Set(setPriceEntries.map((entry) => entry.productId)),
    );
    const setPriceCentsByProductId = new Map(
      setPriceEntries.map((entry) => [
        entry.productId,
        Math.round(entry.priceDollars * 100),
      ]),
    );
    const matchingProducts = await db
      .select({
        id: products.id,
        name: products.name,
        priceCents: products.priceCents,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (matchingProducts.length !== productIds.length) {
      return { error: "One or more products for set pricing no longer exist." };
    }

    const nonDiscountedProduct = matchingProducts.find(
      (product) =>
        (setPriceCentsByProductId.get(product.id) ?? 0) >= product.priceCents,
    );

    if (nonDiscountedProduct) {
      return {
        error: `Set price for ${nonDiscountedProduct.name} must be below ${formatPrice(nonDiscountedProduct.priceCents)}.`,
      };
    }
  }

  const [insertedCode] = await db
    .insert(referralCodes)
    .values({
      partnerId,
      code: normalized,
      discountType,
      discountValue:
        discountType === "percent"
          ? Math.round(discountValue)
          : discountType === "fixed"
            ? Math.round(discountValue * 100)
            : 0,
      minSubtotalCents: Math.round(minOrderDollars * 100),
      excludeReconstitutionSolution,
    })
    .returning({ id: referralCodes.id });

  if (discountType === "set_price") {
    await db.insert(referralCodeProductPrices).values(
      setPriceEntries.map((entry) => ({
        referralCodeId: insertedCode.id,
        productId: entry.productId,
        priceCents: Math.round(entry.priceDollars * 100),
      })),
    );
  }

  revalidatePath("/admin/referrals");
  return { ok: true };
}

export async function toggleReferralCode (
  codeId: string,
  active: boolean,
): Promise<ReferralActionState>
{
  await requireAdmin();
  await db
    .update(referralCodes)
    .set({ active })
    .where(eq(referralCodes.id, codeId));
  revalidatePath("/admin/referrals");
  return { ok: true };
}

export async function toggleReferralCodeReconstitutionExclusion (
  codeId: string,
  excludeReconstitutionSolution: boolean,
): Promise<ReferralActionState>
{
  await requireAdmin();
  await db
    .update(referralCodes)
    .set({ excludeReconstitutionSolution })
    .where(eq(referralCodes.id, codeId));
  revalidatePath("/admin/referrals");
  return { ok: true };
}

export type ApplyCodeResult =
  | { ok: true; code: string; discountCents: number; description: string }
  | { ok: false; error: string };

const referralPreviewItemSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const referralPreviewSchema = z.array(referralPreviewItemSchema).min(1);

/** Public action used at checkout to preview a referral code's discount. */
export async function applyReferralCode (
  rawCode: string,
  items: z.infer<typeof referralPreviewSchema>,
): Promise<ApplyCodeResult>
{
  const parsed = referralPreviewSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: "Your cart is empty." };
  }

  const slugs = parsed.data.map((item) => item.slug);
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.slug, slugs));
  const bySlug = new Map(dbProducts.map((product) => [product.slug, product]));

  let subtotalCents = 0;
  let reconstitutionSolutionSubtotalCents = 0;
  const pricedItems: ReferralPricedItem[] = [];

  for (const item of parsed.data) {
    const product = bySlug.get(item.slug);
    if (!product || !product.active) {
      return {
        ok: false,
        error: "An item in your cart is no longer available.",
      };
    }

    const lineSubtotalCents = product.priceCents * item.quantity;
    subtotalCents += lineSubtotalCents;
    if (product.isReconstitutionSolution) {
      reconstitutionSolutionSubtotalCents += lineSubtotalCents;
    }
    pricedItems.push({
      productId: product.id,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      isReconstitutionSolution: product.isReconstitutionSolution,
    });
  }

  const result = await validateReferralCode(
    rawCode,
    subtotalCents,
    reconstitutionSolutionSubtotalCents,
    pricedItems,
  );
  if (!result.ok) return result;

  const excludesReconstitutionSolution =
    result.code.excludeReconstitutionSolution &&
    result.excludedSubtotalCents > 0;
  const description = result.code.discountType === "set_price"
    ? `Set prices on ${result.priceOverrides.length} eligible ${
      result.priceOverrides.length === 1 ? "item" : "items"
    }`
    : describeDiscount(result.code);

  return {
    ok: true,
    code: result.code.code,
    discountCents: result.discountCents,
    description:
      description +
      (excludesReconstitutionSolution && result.code.discountType !== "set_price"
        ? " eligible items"
        : ""),
  };
}
