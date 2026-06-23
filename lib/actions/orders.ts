"use server";

import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products, orders, orderItems, referralCodes } from "@/db/schema";
import { auth } from "@/auth";
import { generateOrderReference } from "@/lib/format";
import { getOrderByReference } from "@/lib/data";
import { validateReferralCode } from "@/lib/referrals";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";
import { getShippingOption } from "@/lib/shipping";

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional(),
  address1: z.string().min(3, "Street address is required."),
  address2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State / region is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
  shippingMethod: z.enum(["standard", "overnight"]),
});

const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty."),
  shipping: shippingSchema,
  paymentMethod: z.enum(["zelle", "venmo"]),
  acceptedTerms: z.boolean(),
  referralCode: z.string().max(24).optional(),
});

export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; reference: string; email: string }
  | { ok: false; error: string };

export async function placeOrder (
  input: PlaceOrderInput,
): Promise<PlaceOrderResult>
{
  // Guest checkout is allowed: attach the user id when signed in, otherwise
  // the order is tracked by its reference + email.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid order details.",
    };
  }

  const { items, shipping, paymentMethod, acceptedTerms, referralCode } =
    parsed.data;

  if (!acceptedTerms) {
    return {
      ok: false,
      error: "You must confirm the research-use-only terms.",
    };
  }

  const slugs = items.map((i) => i.slug);

  // Re-fetch products server-side; never trust client-supplied prices.
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.slug, slugs));

  const bySlug = new Map(dbProducts.map((p) => [p.slug, p]));

  let subtotalCents = 0;
  const lineItems: {
    productId: string;
    name: string;
    slug: string;
    image: string;
    unitPriceCents: number;
    quantity: number;
    isReconstitutionSolution: boolean;
  }[] = [];
  let reconstitutionSolutionSubtotalCents = 0;

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product || !product.active) {
      return { ok: false, error: `An item in your cart is no longer available.` };
    }
    if (product.inventory < item.quantity) {
      return {
        ok: false,
        error: `Only ${product.inventory} of ${product.name} remain in stock.`,
      };
    }
    const lineSubtotalCents = product.priceCents * item.quantity;
    subtotalCents += lineSubtotalCents;
    if (product.isReconstitutionSolution) {
      reconstitutionSolutionSubtotalCents += lineSubtotalCents;
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      isReconstitutionSolution: product.isReconstitutionSolution,
    });
  }

  // Re-validate the referral code server-side against the real subtotal.
  let discountCents = 0;
  let appliedCodeId: string | null = null;
  let appliedCode: string | null = null;
  if (referralCode?.trim()) {
    const validation = await validateReferralCode(
      referralCode,
      subtotalCents,
      reconstitutionSolutionSubtotalCents,
    );
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }
    discountCents = validation.discountCents;
    appliedCodeId = validation.code.id;
    appliedCode = validation.code.code;
  }

  const selectedShipping = getShippingOption(shipping.shippingMethod);
  if (!selectedShipping) {
    return { ok: false, error: "Select a valid shipping method." };
  }

  const shippingCents = selectedShipping.priceCents;
  const totalCents = subtotalCents - discountCents + shippingCents;
  const reference = generateOrderReference();

  const [order] = await db
    .insert(orders)
    .values({
      reference,
      userId,
      email: shipping.email.toLowerCase(),
      status: "pending_payment",
      paymentMethod,
      subtotalCents,
      shippingCents,
      discountCents,
      referralCodeId: appliedCodeId,
      referralCode: appliedCode,
      totalCents,
      shippingAddress: shipping,
    })
    .returning();

  if (appliedCodeId) {
    await db
      .update(referralCodes)
      .set({ usedCount: sql`${referralCodes.usedCount} + 1` })
      .where(eq(referralCodes.id, appliedCodeId));
  }

  await db.insert(orderItems).values(
    lineItems.map((li) => ({
      orderId: order.id,
      productId: li.productId,
      name: li.name,
      slug: li.slug,
      image: li.image,
      unitPriceCents: li.unitPriceCents,
      quantity: li.quantity,
    })),
  );

  // Decrement inventory.
  for (const li of lineItems) {
    await db
      .update(products)
      .set({ inventory: sql`${products.inventory} - ${li.quantity}` })
      .where(inArray(products.id, [li.productId]));
  }

  const orderWithItems = {
    ...order,
    items: lineItems.map((li, idx) => ({
      id: `${order.id}-${idx}`,
      orderId: order.id,
      productId: li.productId,
      name: li.name,
      slug: li.slug,
      image: li.image,
      unitPriceCents: li.unitPriceCents,
      quantity: li.quantity,
    })),
  };

  await Promise.allSettled([
    sendOrderConfirmation(orderWithItems),
    sendAdminNewOrder(orderWithItems),
  ]);

  return { ok: true, reference, email: order.email };
}

export type LookupState = { error?: string } | null;

export async function lookupOrder (
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState>
{
  const reference = String(formData.get("reference") ?? "")
    .trim()
    .toUpperCase();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!reference || !email) {
    return { error: "Enter both your order number and email." };
  }

  const order = await getOrderByReference(reference);
  if (!order || order.email.toLowerCase() !== email) {
    return { error: "No order found with that order number and email." };
  }

  redirect(`/order/${order.reference}?email=${encodeURIComponent(email)}`);
}
