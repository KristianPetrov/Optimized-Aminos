import "server-only";
import { db } from "@/db";
import { products, orders, orderItems } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
