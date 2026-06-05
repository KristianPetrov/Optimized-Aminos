"use server";

import { z } from "zod";
import { eq, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { auth } from "@/auth";
import { getOrderWithItems } from "@/lib/data";
import {
  sendPaymentReceived,
  sendOrderShipped,
  sendOrderCancelled,
} from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export type AdminActionState = { ok?: boolean; error?: string } | null;

export async function markOrderPaid(orderId: string): Promise<AdminActionState> {
  await requireAdmin();
  await db
    .update(orders)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  const order = await getOrderWithItems(orderId);
  if (order) await sendPaymentReceived(order);

  revalidatePath("/admin");
  return { ok: true };
}

const shipSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.string().min(2, "Select a carrier."),
  trackingNumber: z.string().min(3, "Enter a tracking number."),
});

export async function markOrderShipped(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = shipSchema.safeParse({
    orderId: formData.get("orderId"),
    carrier: formData.get("carrier"),
    trackingNumber: formData.get("trackingNumber"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { orderId, carrier, trackingNumber } = parsed.data;

  await db
    .update(orders)
    .set({
      status: "shipped",
      carrier,
      trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const order = await getOrderWithItems(orderId);
  if (order) await sendOrderShipped(order);

  revalidatePath("/admin");
  return { ok: true };
}

export async function cancelOrder(orderId: string): Promise<AdminActionState> {
  await requireAdmin();

  const order = await getOrderWithItems(orderId);
  if (!order) return { error: "Order not found." };

  // Only restock if the order had not already been cancelled.
  if (order.status !== "cancelled") {
    for (const item of order.items) {
      if (item.productId) {
        await db
          .update(products)
          .set({ inventory: sql`${products.inventory} + ${item.quantity}` })
          .where(inArray(products.id, [item.productId]));
      }
    }
  }

  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await sendOrderCancelled(order);

  revalidatePath("/admin");
  return { ok: true };
}

const inventorySchema = z.object({
  productId: z.string().uuid(),
  inventory: z.coerce.number().int().min(0).max(100000),
});

export async function updateInventory(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = inventorySchema.safeParse({
    productId: formData.get("productId"),
    inventory: formData.get("inventory"),
  });

  if (!parsed.success) {
    return { error: "Invalid inventory value." };
  }

  await db
    .update(products)
    .set({ inventory: parsed.data.inventory })
    .where(eq(products.id, parsed.data.productId));

  revalidatePath("/admin");
  revalidatePath("/store");
  return { ok: true };
}

const productUpdateSchema = z.object({
  productId: z.string().uuid(),
  inventory: z.coerce.number().int().min(0).max(100000),
  priceDollars: z.coerce.number().min(0).max(100000),
  active: z.boolean(),
  featured: z.boolean(),
});

export async function updateProductFull(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = productUpdateSchema.safeParse({
    productId: formData.get("productId"),
    inventory: formData.get("inventory"),
    priceDollars: formData.get("priceDollars"),
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { error: "Invalid product values." };
  }

  await db
    .update(products)
    .set({
      inventory: parsed.data.inventory,
      priceCents: Math.round(parsed.data.priceDollars * 100),
      active: parsed.data.active,
      featured: parsed.data.featured,
    })
    .where(eq(products.id, parsed.data.productId));

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  revalidatePath("/");
  return { ok: true };
}
