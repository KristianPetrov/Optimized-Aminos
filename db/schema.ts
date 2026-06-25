import
  {
    pgTable,
    text,
    timestamp,
    integer,
    pgEnum,
    primaryKey,
    uuid,
    boolean,
    jsonb,
  } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "shipped",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["zelle", "venmo"]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percent",
  "fixed",
  "set_price",
]);

export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email_verification",
  "password_reset",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: authTokenTypeEnum("type").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // Short tagline / sequence info shown on the card
  shortDescription: text("short_description").notNull().default(""),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("Research Peptides"),
  // Price stored in cents to avoid float issues
  priceCents: integer("price_cents").notNull(),
  image: text("image").notNull(),
  inventory: integer("inventory").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  isReconstitutionSolution: boolean("is_reconstitution_solution")
    .notNull()
    .default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referralPartners = pgTable("referral_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => referralPartners.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  // Percent: whole number 1-100. Fixed: discount amount in cents.
  // Set-price codes keep this at 0 and use referralCodeProductPrices.
  discountValue: integer("discount_value").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  excludeReconstitutionSolution: boolean("exclude_reconstitution_solution")
    .notNull()
    .default(false),
  active: boolean("active").notNull().default(true),
  usedCount: integer("used_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const referralCodeProductPrices = pgTable(
  "referral_code_product_prices",
  {
    referralCodeId: uuid("referral_code_id")
      .notNull()
      .references(() => referralCodes.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.referralCodeId, table.productId],
    }),
  ],
);

type ShippingAddress = {
  fullName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod?: "standard" | "overnight";
};

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Human-friendly order reference, e.g. OA-3F8A2C
  reference: text("reference").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  referralCodeId: uuid("referral_code_id").references(() => referralCodes.id, {
    onDelete: "set null",
  }),
  // Snapshot of the code string at time of purchase
  referralCode: text("referral_code"),
  totalCents: integer("total_cents").notNull(),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddress>().notNull(),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  // Snapshot of product details at time of purchase
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  image: text("image").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  authTokens: many(authTokens),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const referralPartnersRelations = relations(
  referralPartners,
  ({ many }) => ({
    codes: many(referralCodes),
  }),
);

export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  partner: one(referralPartners, {
    fields: [referralCodes.partnerId],
    references: [referralPartners.id],
  }),
  orders: many(orders),
  productPrices: many(referralCodeProductPrices),
}));

export const referralCodeProductPricesRelations = relations(
  referralCodeProductPrices,
  ({ one }) => ({
    code: one(referralCodes, {
      fields: [referralCodeProductPrices.referralCodeId],
      references: [referralCodes.id],
    }),
    product: one(products, {
      fields: [referralCodeProductPrices.productId],
      references: [products.id],
    }),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type ReferralPartner = typeof referralPartners.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ReferralCodeProductPrice =
  typeof referralCodeProductPrices.$inferSelect;
export type DiscountType = (typeof discountTypeEnum.enumValues)[number];
export type { ShippingAddress };
