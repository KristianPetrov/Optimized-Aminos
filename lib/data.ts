import "server-only";
import { db } from "@/db";
import {
  products,
  orders,
  orderItems,
  referralPartners,
  referralCodes,
  referralCodeProductPrices,
  type ReferralCode,
} from "@/db/schema";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

export async function getActiveProducts() {
  return db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.featured), products.category, products.name);
}

export async function getFeaturedProducts(limit = 6) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .limit(limit);
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return product ?? null;
}

export async function getAllProducts() {
  return db.select().from(products).orderBy(products.category, products.name);
}

export async function getOrderItems(orderId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getOrdersForUser(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getAllOrdersWithItems() {
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));
  const allItems = await db.select().from(orderItems);
  const grouped = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = grouped.get(item.orderId) ?? [];
    list.push(item);
    grouped.set(item.orderId, list);
  }
  return allOrders.map((o) => ({ ...o, items: grouped.get(o.id) ?? [] }));
}

export async function getOrderWithItems(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;
  const items = await getOrderItems(orderId);
  return { ...order, items };
}

export type ReferralCodeWithStats = ReferralCode & {
  orderCount: number;
  revenueCents: number;
  discountGivenCents: number;
  productPrices: {
    productId: string;
    productSlug: string;
    productName: string;
    productCategory: string;
    catalogPriceCents: number;
    priceCents: number;
  }[];
};

export async function getReferralPartnersWithCodes() {
  const partners = await db
    .select()
    .from(referralPartners)
    .orderBy(desc(referralPartners.createdAt));

  const codes = await db
    .select()
    .from(referralCodes)
    .orderBy(desc(referralCodes.createdAt));
  const productPrices = await db
    .select({
      referralCodeId: referralCodeProductPrices.referralCodeId,
      productId: referralCodeProductPrices.productId,
      productSlug: products.slug,
      productName: products.name,
      productCategory: products.category,
      catalogPriceCents: products.priceCents,
      priceCents: referralCodeProductPrices.priceCents,
    })
    .from(referralCodeProductPrices)
    .innerJoin(products, eq(referralCodeProductPrices.productId, products.id))
    .orderBy(products.category, products.name);

  // Aggregate confirmed usage (paid/shipped) per code.
  const usage = await db
    .select({
      referralCodeId: orders.referralCodeId,
      orderCount: sql<number>`count(*)::int`,
      revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      discountGivenCents: sql<number>`coalesce(sum(${orders.discountCents}), 0)::int`,
    })
    .from(orders)
    .where(
      and(
        isNotNull(orders.referralCodeId),
        inArray(orders.status, ["paid", "shipped"]),
      ),
    )
    .groupBy(orders.referralCodeId);

  const usageByCode = new Map(usage.map((u) => [u.referralCodeId, u]));
  const productPricesByCode = new Map<string, typeof productPrices>();
  for (const productPrice of productPrices) {
    const current = productPricesByCode.get(productPrice.referralCodeId) ?? [];
    current.push(productPrice);
    productPricesByCode.set(productPrice.referralCodeId, current);
  }

  const codesWithStats: ReferralCodeWithStats[] = codes.map((c) => {
    const u = usageByCode.get(c.id);
    return {
      ...c,
      orderCount: u?.orderCount ?? 0,
      revenueCents: u?.revenueCents ?? 0,
      discountGivenCents: u?.discountGivenCents ?? 0,
      productPrices: productPricesByCode.get(c.id) ?? [],
    };
  });

  return partners.map((partner) => ({
    ...partner,
    codes: codesWithStats.filter((c) => c.partnerId === partner.id),
  }));
}

export async function getOrderByReference(reference: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.reference, reference))
    .limit(1);
  if (!order) return null;
  const items = await getOrderItems(order.id);
  return { ...order, items };
}
