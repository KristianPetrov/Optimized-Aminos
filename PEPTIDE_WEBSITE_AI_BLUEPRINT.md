# AI Blueprint: RUO Peptide Ecommerce Website

This document describes the current Optimized Aminos site in enough detail for an AI or developer to build a similar peptide ecommerce website under a different brand. Replace brand names, logos, legal copy, payment handles, email senders, product images, and policy text as needed.

Important compliance baseline: the site must present all products as "For Research Use Only" and must not include dosing, administration instructions, medical advice, disease treatment claims, human-use claims, or veterinary-use claims. Confirm current laws, regulations, shipping rules, payment-provider policies, and platform policies before launch.

## 1. Site Purpose

Build a dark, premium ecommerce storefront for research peptides with:

- Public catalog and product detail pages.
- Client-side cart with persistent local storage.
- Checkout with shipping address, shipping method, manual Zelle/Venmo payment preference, referral code, and required Research Use Only confirmation.
- Orders created immediately as `pending_payment`.
- Manual admin workflow to mark orders paid, ship orders with tracking, cancel orders, and manage inventory.
- Customer accounts with verified email sign-in and order history.
- Guest checkout and guest order tracking by order reference plus email.
- Admin dashboards for orders, inventory, referral partners/codes, and analytics.
- Transactional emails through Resend.
- Legal and compliance pages.

## 2. Recommended Tech Stack

Use the same architecture unless the target project has different constraints.

| Concern | Implementation |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Database | Neon serverless Postgres |
| ORM | Drizzle ORM and drizzle-kit |
| Auth | Auth.js / NextAuth v5 credentials provider |
| Email | Resend |
| Validation | Zod |
| Password hashing | bcryptjs |
| Icons | lucide-react |
| Package manager | pnpm |

Next.js 16 note: this codebase uses App Router, async `PageProps` params/searchParams, Server Components, Server Functions / Server Actions, and `proxy.ts` for route protection. If rebuilding in this repo, read the local Next.js guide in `node_modules/next/dist/docs/01-app/index.md` before changing app code.

## 3. Environment Variables

Create `.env.local` or equivalent with these values:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-with-openssl-rand-base64-32"

RESEND_API_KEY="re_..."
EMAIL_FROM="New Brand <orders@example.com>"
AUTH_EMAIL_FROM="New Brand <noreply@example.com>"
ADMIN_NOTIFICATION_EMAIL="admin@example.com"

NEXT_PUBLIC_SITE_URL="https://example.com"
NEXT_PUBLIC_ZELLE_RECIPIENT="payments@example.com"
NEXT_PUBLIC_VENMO_HANDLE="YourVenmoHandle"

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-strong-password"
```

Behavior:

- `DATABASE_URL` is required for Drizzle/Neon.
- `AUTH_SECRET` is required by Auth.js.
- `RESEND_API_KEY` enables emails. If absent, email sends should no-op with a server warning.
- `NEXT_PUBLIC_SITE_URL` is used in metadata, auth links, password reset links, order links, and admin email links.
- `NEXT_PUBLIC_ZELLE_RECIPIENT` and `NEXT_PUBLIC_VENMO_HANDLE` appear at checkout, on order pages, and in order emails.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` create or update the first admin account during seeding.

## 4. Database Schema

Use cents for all monetary values. Use UUID primary keys. Use order item snapshots so historical orders remain accurate even if product data changes later.

### Enums

```text
user_role: customer, admin
order_status: pending_payment, paid, shipped, cancelled
payment_method: zelle, venmo
discount_type: percent, fixed
auth_token_type: email_verification, password_reset
```

### Tables

#### users

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, default random |
| name | text nullable | Customer/admin display name |
| email | text unique not null | Store lowercase |
| password_hash | text not null | bcrypt hash |
| role | user_role not null | Default `customer` |
| email_verified_at | timestamptz nullable | Required before login |
| created_at | timestamptz not null | Default now |

#### auth_tokens

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid not null | FK users.id, cascade delete |
| type | auth_token_type not null | `email_verification` or `password_reset` |
| token_hash | text not null | SHA-256 hash of random token |
| expires_at | timestamptz not null | Verification 24h, reset 1h |
| created_at | timestamptz not null | Default now |

Token rules:

- Generate 32 random bytes, hex encode as raw token.
- Store only SHA-256 token hash.
- Delete existing token of the same type for the user before inserting a new one.
- Consume token once by hash, type, and unexpired timestamp, then delete it.

#### products

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| slug | text unique not null | Product route key |
| name | text not null | Product display name |
| short_description | text not null | Card subtitle / vial amount |
| description | text not null | Research-only product description |
| category | text not null | Used for grouped catalog sections |
| price_cents | integer not null | Store USD cents |
| image | text not null | Public image path |
| inventory | integer not null | Default 0 |
| featured | boolean not null | Featured on home |
| active | boolean not null | Hidden from public catalog when false |
| created_at | timestamptz not null | Default now |

#### referral_partners

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text not null | Partner/influencer/source name |
| email | text nullable | Optional partner contact |
| notes | text nullable | Internal notes |
| active | boolean not null | Partner-level on/off switch |
| created_at | timestamptz not null | Default now |

#### referral_codes

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| partner_id | uuid not null | FK referral_partners.id, cascade delete |
| code | text unique not null | Normalized uppercase, no spaces |
| discount_type | discount_type not null | `percent` or `fixed` |
| discount_value | integer not null | Percent whole number or cents for fixed |
| min_subtotal_cents | integer not null | Minimum cart subtotal before discount |
| active | boolean not null | Code-level on/off switch |
| used_count | integer not null | Incremented when an order is placed |
| created_at | timestamptz not null | Default now |

Referral code rules:

- Normalize by trimming, uppercasing, and removing whitespace.
- Allow letters, numbers, and dashes.
- Percent discounts must be 1 through 100.
- Fixed discounts are stored in cents.
- Code is valid only if both code and partner are active.
- Discount must never exceed subtotal.
- Admin stats should count confirmed orders only: `paid` or `shipped`.

#### orders

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| reference | text unique not null | Human reference like `OA-7F3A91` |
| user_id | uuid nullable | FK users.id, set null; guest orders have null |
| email | text not null | Lowercase checkout email |
| status | order_status not null | Default `pending_payment` |
| payment_method | payment_method not null | Preferred method selected at checkout |
| subtotal_cents | integer not null | Product subtotal before shipping/discount |
| shipping_cents | integer not null | Selected shipping cost |
| discount_cents | integer not null | Discount amount |
| referral_code_id | uuid nullable | FK referral_codes.id, set null |
| referral_code | text nullable | Snapshot of code string |
| total_cents | integer not null | subtotal - discount + shipping |
| shipping_address | jsonb not null | Snapshot object shown below |
| tracking_number | text nullable | Set when shipped |
| carrier | text nullable | USPS, UPS, FedEx, DHL, etc. |
| notes | text nullable | Internal notes |
| created_at | timestamptz not null | Default now |
| updated_at | timestamptz not null | Default now |

Shipping address JSON:

```ts
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
```

#### order_items

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| order_id | uuid not null | FK orders.id, cascade delete |
| product_id | uuid nullable | FK products.id, set null |
| name | text not null | Product name snapshot |
| slug | text not null | Product slug snapshot |
| image | text not null | Product image snapshot |
| unit_price_cents | integer not null | Price snapshot |
| quantity | integer not null | Ordered quantity |

## 5. Seed Catalog

Seed products by slug. On conflict, update name, short description, description, category, price, image, and featured flag. Preserve live `inventory` and `active` fields during reseeds unless intentionally resetting stock.

Product images live in `public/products`. Build equivalent transparent product renderings for the new brand.

```yaml
products:
  - slug: bpc-157-10mg
    name: BPC-157
    shortDescription: "10mg - Body Protection Compound"
    description: "BPC-157 is a synthetic pentadecapeptide studied extensively in preclinical models for its role in tissue repair, angiogenesis, and gut-lining research. A staple reference compound for recovery and connective-tissue investigations."
    category: Repair & Recovery
    priceCents: 8500
    image: /products/bpc-157-10mg.png
    inventory: 50
    featured: true

  - slug: tb-500-10mg
    name: TB-500
    shortDescription: "10mg - Thymosin Beta-4 Fragment"
    description: "TB-500 is the synthetic analog of the active region of Thymosin Beta-4, a peptide investigated in models of cellular migration, vascularization, and recovery research."
    category: Repair & Recovery
    priceCents: 6000
    image: /products/tb-500-10mg.png
    inventory: 40
    featured: true

  - slug: bpc-157-10mg-ghk-cu-10mg-tb-500-10mg
    name: BPC-157 / GHK-Cu / TB-500 Blend
    shortDescription: "10mg / 10mg / 10mg - Triple Repair Matrix"
    description: "A research blend combining BPC-157, GHK-Cu, and TB-500 in a single vial for comparative studies of synergistic repair, regeneration, and connective-tissue pathways."
    category: Repair & Recovery
    priceCents: 12999
    image: /products/bpc-157-10mg-ghk-cu-10mg-tb-500-10mg.png
    inventory: 25
    featured: true

  - slug: wolverine-pro-10mg
    name: Wolverine Pro Blend
    shortDescription: "10mg - Advanced Recovery Stack"
    description: "The Wolverine Pro research blend is formulated for advanced regeneration and recovery studies, combining repair-oriented peptides into a single reference vial."
    category: Repair & Recovery
    priceCents: 15000
    image: /products/wolverine-pro-10mg.png
    inventory: 20
    featured: true

  - slug: klow-10mg-50mg
    name: KLOW Blend
    shortDescription: "Multi-peptide regeneration blend"
    description: "KLOW is a multi-peptide research blend used in comparative regeneration and tissue-repair investigations."
    category: Repair & Recovery
    priceCents: 19500
    image: /products/klow-10mg-50mg.png
    inventory: 18

  - slug: ghk-cu-50mg
    name: GHK-Cu
    shortDescription: "50mg - Copper Peptide"
    description: "GHK-Cu is a naturally occurring copper-binding tripeptide widely referenced in dermal regeneration, collagen remodeling, and anti-inflammatory research."
    category: Repair & Recovery
    priceCents: 6500
    image: /products/ghk-cu-50mg.png
    inventory: 35

  - slug: cjc-1295-10mg-ipamorelin-10mg
    name: CJC-1295 / Ipamorelin Blend
    shortDescription: "10mg / 10mg - GH Secretagogue Stack"
    description: "A combination of CJC-1295 and Ipamorelin, two growth-hormone secretagogues frequently paired in endocrine and metabolic research models."
    category: Growth & Metabolic
    priceCents: 10000
    image: /products/cjc-1295-10mg-ipamorelin-10mg.png
    inventory: 30
    featured: true

  - slug: ipamorelin-10mg
    name: Ipamorelin
    shortDescription: "10mg - Selective GH Secretagogue"
    description: "Ipamorelin is a selective growth-hormone secretagogue and ghrelin-receptor agonist studied for its targeted release profile in endocrine research."
    category: Growth & Metabolic
    priceCents: 5499
    image: /products/ipamorelin-10mg.png
    inventory: 45

  - slug: tesamorelin-10mg
    name: Tesamorelin
    shortDescription: "10mg - GHRH Analog"
    description: "Tesamorelin is a stabilized growth-hormone-releasing hormone (GHRH) analog referenced in metabolic and adipose-tissue research."
    category: Growth & Metabolic
    priceCents: 10000
    image: /products/tesamorelin-10mg.png
    inventory: 28

  - slug: tesamorelin-20mg
    name: Tesamorelin
    shortDescription: "20mg - GHRH Analog (High Concentration)"
    description: "A higher-concentration vial of Tesamorelin, a stabilized GHRH analog used in metabolic and adipose-tissue research."
    category: Growth & Metabolic
    priceCents: 14000
    image: /products/tesamorelin-20mg.png
    inventory: 20

  - slug: aod-9604-10mg
    name: AOD-9604
    shortDescription: "10mg - Modified GH Fragment"
    description: "AOD-9604 is a modified fragment of human growth hormone (176-191) studied in lipid metabolism and adipose-tissue research models."
    category: Growth & Metabolic
    priceCents: 6999
    image: /products/aod-9604-10mg.png
    inventory: 30

  - slug: aicar-50mg
    name: AICAR
    shortDescription: "50mg - AMPK Activator"
    description: "AICAR is an AMP-activated protein kinase (AMPK) activator referenced in cellular energy metabolism and endurance research."
    category: Growth & Metabolic
    priceCents: 14000
    image: /products/aicar-50mg.png
    inventory: 22

  - slug: rt-3-10mg
    name: Retatrutide
    shortDescription: "10mg - Triple-Agonist (Research)"
    description: "Retatrutide is a triple-agonist peptide (GIP/GLP-1/glucagon) under active investigation in metabolic and weight-regulation research."
    category: Growth & Metabolic
    priceCents: 15000
    image: /products/rt-3-10mg.png
    inventory: 25
    featured: true

  - slug: rt-3-20mg
    name: Retatrutide
    shortDescription: "20mg - Triple-Agonist (Research)"
    description: "A higher-concentration vial of Retatrutide, a triple-agonist peptide (GIP/GLP-1/glucagon) studied in metabolic research."
    category: Growth & Metabolic
    priceCents: 20000
    image: /products/rt-3-20mg.png
    inventory: 18

  - slug: rt-3-30mg
    name: Retatrutide
    shortDescription: "30mg - Triple-Agonist (Research)"
    description: "The highest-concentration Retatrutide vial in the catalog, intended for extended metabolic research protocols."
    category: Growth & Metabolic
    priceCents: 25000
    image: /products/rt-3-30mg.png
    inventory: 15

  - slug: mots-c-10mg
    name: MOTS-c
    shortDescription: "10mg - Mitochondrial-Derived Peptide"
    description: "MOTS-c is a mitochondrial-derived peptide studied for its role in metabolic regulation, insulin sensitivity, and cellular energy research."
    category: Longevity & Mitochondrial
    priceCents: 6500
    image: /products/mots-c-10mg.png
    inventory: 30

  - slug: mots-c-40mg
    name: MOTS-c
    shortDescription: "40mg - Mitochondrial-Derived Peptide"
    description: "A high-concentration MOTS-c vial for extended mitochondrial and metabolic research protocols."
    category: Longevity & Mitochondrial
    priceCents: 13000
    image: /products/mots-c-40mg.png
    inventory: 16

  - slug: ss-31-10mg
    name: SS-31 (Elamipretide)
    shortDescription: "10mg - Mitochondrial-Targeted Peptide"
    description: "SS-31 is a mitochondria-targeted tetrapeptide referenced in research on cardiolipin stabilization and cellular energy production."
    category: Longevity & Mitochondrial
    priceCents: 7500
    image: /products/ss-31-10mg.png
    inventory: 20

  - slug: nad-1000mg
    name: NAD+
    shortDescription: "1000mg - Cellular Coenzyme"
    description: "NAD+ is an essential coenzyme central to cellular metabolism, DNA repair, and longevity research at the mitochondrial level."
    category: Longevity & Mitochondrial
    priceCents: 22500
    image: /products/nad-1000mg.png
    inventory: 24
    featured: true

  - slug: semax-10mg
    name: Semax
    shortDescription: "10mg - Nootropic Peptide"
    description: "Semax is a synthetic peptide derived from ACTH(4-10), studied for its influence on BDNF expression and cognitive research models."
    category: Cognitive & Nootropic
    priceCents: 12500
    image: /products/semax-10mg.png
    inventory: 28

  - slug: selank-10mg
    name: Selank
    shortDescription: "10mg - Anxiolytic Peptide"
    description: "Selank is a synthetic analog of the immunomodulatory peptide tuftsin, referenced in anxiolytic and neuroregulatory research."
    category: Cognitive & Nootropic
    priceCents: 12500
    image: /products/selank-10mg.png
    inventory: 28

  - slug: mt-2-10mg
    name: Melanotan II
    shortDescription: "10mg - Melanocortin Agonist"
    description: "Melanotan II is a synthetic analog of alpha-melanocyte-stimulating hormone studied in melanocortin-receptor and pigmentation research."
    category: Specialty Research
    priceCents: 5499
    image: /products/mt-2-10mg.png
    inventory: 32
```

## 6. Routes and Pages

### Public storefront

| Route | Purpose |
| --- | --- |
| `/` | Homepage with hero logo, mission, trust metrics, values, featured products, and RUO compliance CTA |
| `/store` | Active product catalog grouped by category |
| `/store/[slug]` | Product image, details, price, inventory, quantity selector, add to cart, buy now, RUO notice |
| `/science` | Quality standards, HPLC/MS verification, lyophilization, lot traceability, process overview |
| `/compliance` | Research Use Only policy |
| `/terms` | Terms of sale |
| `/privacy` | Privacy policy |
| `/track` | Guest order lookup form by reference plus email |

### Commerce and account

| Route | Purpose |
| --- | --- |
| `/checkout` | Shipping details, shipping method, payment preference, referral code, summary, RUO checkbox |
| `/order/[reference]` | Order confirmation/details; payment instructions if pending; tracking if shipped |
| `/account` | Authenticated customer order history |

### Auth

| Route | Purpose |
| --- | --- |
| `/login` | Credentials login, optional redirect target, resend verification link for unverified users |
| `/register` | Account creation and verification email send |
| `/verify-email` | Consumes verification token |
| `/verify-email/check` | Shows check-email/resend-verification UI |
| `/forgot-password` | Request reset email |
| `/reset-password` | Consume reset token and set new password |
| `/api/auth/[...nextauth]` | Auth.js route handler |

### Admin

| Route | Purpose |
| --- | --- |
| `/admin` | Redirects to `/admin/orders` |
| `/admin/orders` | Order stats and order manager |
| `/admin/inventory` | Product inventory, price, active, and featured controls |
| `/admin/referrals` | Referral partners, codes, and referral stats |
| `/admin/analytics` | Revenue, order count, AOV, units sold, sales chart, top products, status/payment/referral breakdowns |

## 7. Layout and Design System

Visual tone:

- Dark premium lab aesthetic.
- Backgrounds: near-black ink and deep navy.
- Accent: gold gradient.
- Text: off-white for headings, muted gray-blue for body.
- Cards/panels use subtle borders, low-opacity backgrounds, and restrained gradients.
- Product images appear on white-to-light-gray square image areas for contrast.
- RUO notice is visible in top bar, footer, product page, checkout, legal pages, and transactional emails.

Core layout:

- Root layout loads global font, global CSS, auth session, cart provider, site header, footer, and cart drawer.
- Header has top RUO bar, sticky nav, store/science/compliance links, account/admin links based on session, sign-in/sign-out, mobile menu, and cart button.
- Footer has brand summary, RUO panel, catalog links, legal links, track order link, and qualified-researcher acknowledgement.
- Cart drawer is global and slides from the right.

Suggested color tokens:

```css
--ink: #05070d;
--ink-800: #070b14;
--navy: #0b1322;
--navy-700: #101a2e;
--gold: #e8c879;
--gold-deep: #bb8e3a;
--foam: #f4f6fb;
--mist: #aeb7c7;
--faint: #5b6577;
--line: rgba(255,255,255,0.1);
```

Assets needed:

- Main logo for header.
- Large transparent or lined logo for homepage hero.
- Favicon/app icon.
- Product images for every seed product, preferably transparent PNGs on neutral product containers.

## 8. Cart Behavior

The cart is a client component using React context and browser `localStorage`.

Storage key:

```text
oa-cart-v1
```

Cart item shape:

```ts
type CartItem = {
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  quantity: number;
};
```

Cart functions:

- `addItem(item, quantity = 1)`: if slug exists, increment quantity; otherwise add item; open drawer.
- `removeItem(slug)`: remove line.
- `setQuantity(slug, quantity)`: update quantity; remove when quantity <= 0.
- `clear()`: empty cart after successful checkout.
- Derive `count` and `subtotalCents`.
- Delay cart badge rendering until hydrated to avoid localStorage hydration mismatch.

Security rule: the cart is never trusted for final price, product availability, active status, or inventory. Checkout sends slugs and quantities only. The server re-fetches products and calculates all prices.

## 9. Checkout and Order Creation

Checkout form sections:

- Shipping details: full name, email, phone optional, address1, address2 optional, city, state/region, postal code, country.
- Shipping method:
  - `standard`: label `Standard shipping`, price `1500`.
  - `overnight`: label `Overnight shipping`, price `5000`.
- Preferred payment method:
  - `zelle`.
  - `venmo`.
  - The selected method is a preference for records; customer receives both options.
- Referral code input:
  - Preview discount through public server action.
  - Re-validate when cart subtotal changes.
  - Store only applied code string in checkout payload.
- RUO checkbox:
  - Required before order creation.
  - Text must confirm qualified researcher and Research Use Only.
- Order summary:
  - Line items.
  - Subtotal.
  - Discount.
  - Shipping.
  - Total.

Server order creation steps:

1. Read optional signed-in session and attach `userId`; guest checkout is allowed.
2. Validate payload with Zod.
3. Require `acceptedTerms`.
4. Re-fetch all products by slug.
5. Reject inactive or missing products.
6. Reject quantities above inventory.
7. Calculate subtotal from database prices.
8. Validate referral code against real subtotal.
9. Read selected shipping option and calculate shipping.
10. Calculate `totalCents = subtotalCents - discountCents + shippingCents`.
11. Generate reference with prefix and six random characters.
12. Insert order with status `pending_payment`.
13. Increment referral code `used_count` if applied.
14. Insert order item snapshots.
15. Decrement product inventory by ordered quantities.
16. Send customer order confirmation and admin new-order email.
17. Return reference and email.
18. Clear cart on client and redirect to `/order/[reference]?email=...`.

Order reference generator:

```ts
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Pick 6 chars, return `OA-${out}` or replace prefix for new brand.
```

Inventory rule: stock is decremented when an order is placed, even before payment. Cancelling an order restocks items if the previous order status was not already `cancelled`.

## 10. Manual Payments

No payment processor is integrated.

Customer sees:

- Zelle recipient from `NEXT_PUBLIC_ZELLE_RECIPIENT`.
- Venmo handle from `NEXT_PUBLIC_VENMO_HANDLE`.
- Venmo deep link with amount and order reference prefilled.
- Instruction to include order reference in the payment note.

Venmo link format:

```ts
const params = new URLSearchParams({
  txn: "pay",
  audience: "private",
  recipients: venmoHandleWithoutAt,
  amount: (totalCents / 100).toFixed(2),
  note: orderReference,
});
return `https://venmo.com/?${params.toString()}`;
```

Admin manually verifies payment outside the app, then marks the order paid.

## 11. Order Lifecycle

Statuses:

```text
pending_payment -> paid -> shipped
pending_payment -> cancelled
paid -> cancelled
```

UI-supported actions:

- `pending_payment`: admin can mark paid or cancel.
- `paid`: admin can add carrier/tracking and mark shipped, or cancel.
- `shipped`: customer/admin can view tracking.
- `cancelled`: customer/admin can see cancellation state.

Admin actions:

- Mark paid:
  - Require admin session.
  - Set `status = paid`.
  - Update `updated_at`.
  - Email customer payment confirmation.
  - Revalidate admin pages.
- Mark shipped:
  - Require admin session.
  - Validate order UUID, carrier, tracking number.
  - Set `status = shipped`, carrier, tracking number, updated timestamp.
  - Email customer tracking notification.
  - Revalidate admin pages.
- Cancel:
  - Require admin session.
  - Load order with items.
  - If not already cancelled, add each item quantity back to product inventory.
  - Set `status = cancelled`.
  - Email customer cancellation.
  - Revalidate admin pages.

Carrier tracking links:

- USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=TRACKING`
- UPS: `https://www.ups.com/track?tracknum=TRACKING`
- FedEx: `https://www.fedex.com/fedextrack/?trknbr=TRACKING`
- DHL: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=TRACKING`

Unknown carrier returns no tracking URL and displays plain tracking number.

## 12. Order Access Rules

The order detail page must allow access when any of these is true:

- Signed-in user owns the order by `orders.user_id`.
- Signed-in user has `role = admin`.
- Guest provides matching email through query param after lookup or checkout.

Otherwise redirect to `/track?reference=...`.

Guest tracking:

- Form requires reference and email.
- Normalize reference to uppercase.
- Normalize email to lowercase.
- Fetch by reference.
- Match email exactly after lowercasing.
- Redirect to `/order/[reference]?email=...` on success.
- Return generic not-found error on failure.

## 13. Authentication

Use Auth.js v5 / NextAuth credentials provider with JWT sessions.

Configuration split:

- `auth.config.ts`:
  - Edge-safe config only.
  - No DB imports and no bcrypt imports.
  - Defines pages, JWT strategy, callbacks, and route authorization.
- `auth.ts`:
  - Imports database and bcrypt.
  - Defines credentials provider.
  - Validates email/password.
  - Rejects unverified email.
  - Exports `handlers`, `auth`, `signIn`, `signOut`.
- `proxy.ts`:
  - Uses edge-safe auth wrapper.
  - Protects `/admin/:path*` and `/account/:path*`.

Authorization:

- `/admin/*`: must be logged in and role admin.
- `/account/*`: must be logged in.
- All other public routes allowed.

Registration:

- Validate name min 2.
- Validate email.
- Password min 8, at least one number, at least one letter.
- Confirm password must match.
- If email exists and is unverified, send a new verification email and redirect to check page.
- If email exists and verified, return duplicate error.
- Hash password with bcrypt cost 10.
- Insert customer role.
- Create email verification token.
- Send verification email.
- Redirect to `/verify-email/check?email=...`.

Login:

- Validate email and password.
- Check password hash.
- If email unverified, return error and unverified email so UI can show resend link.
- Call Auth.js `signIn("credentials")` with redirect target.

Password reset:

- Request form always returns generic success.
- If user exists, create password reset token and send email.
- Reset page requires token query parameter.
- Consume token, hash new password, update user, redirect to login with success flag.

Email verification:

- `/verify-email?token=...` consumes token.
- On success, set `email_verified_at = now`.
- On invalid/missing token, show failure and link to resend page.

## 14. Emails

Use Resend. Build a dark HTML email layout with brand title, gold accents, RUO footer, and transactional content.

Email functions:

- `sendOrderConfirmation(order)`:
  - To customer.
  - Subject: order received, payment pending.
  - Includes reference, both payment options, total, order items, discount/shipping/total, account/order link.
- `sendPaymentReceived(order)`:
  - To customer.
  - Confirms payment and preparation for shipment.
- `sendOrderShipped(order)`:
  - To customer.
  - Includes carrier, tracking number, tracking URL if known, items, and order link.
- `sendOrderCancelled(order)`:
  - To customer.
  - Confirms cancellation and includes items.
- `sendAdminNewOrder(order)`:
  - To `ADMIN_NOTIFICATION_EMAIL`.
  - Includes reference, customer, preferred payment method, total, and admin dashboard link.
- `sendEmailVerification(email, token)`:
  - From auth sender.
  - Link to `/verify-email?token=...`.
  - Expires in 24 hours.
- `sendPasswordReset(email, token)`:
  - From auth sender.
  - Link to `/reset-password?token=...`.
  - Expires in 1 hour.

Every email footer should include:

```text
For Research Use Only. Not for human or veterinary use. Products are intended strictly for in-vitro laboratory research and development.
```

## 15. Admin Features

### Admin layout

- Server-check current session.
- Redirect non-admin to `/login?redirectTo=/admin`.
- Show admin header with signed-in email and back-to-site link.
- Tabs:
  - Orders.
  - Inventory.
  - Referrals.
  - Analytics.

### Orders dashboard

Stats:

- Total orders.
- Awaiting payment: count status `pending_payment`.
- Ready to ship: count status `paid`.
- Confirmed revenue: sum `total_cents` for `paid` and `shipped`.

Order manager:

- Collapsible rows.
- Header shows reference, customer name, date, preferred payment, status badge, total.
- Expanded view shows items, discount, shipping, shipping address, customer email/phone, and actions.
- Pending orders can be marked paid or cancelled.
- Paid orders can be shipped with carrier/tracking or cancelled.
- Shipped orders show tracking.
- Cancel requires a two-step confirmation UI.

### Inventory dashboard

Stats:

- Product count.
- Total units in stock.
- Low stock count where inventory > 0 and <= 5.
- Out of stock count where inventory <= 0.

Each inventory row lets admin update:

- Price in dollars.
- Inventory integer.
- Active checkbox.
- Featured checkbox.

Saving revalidates admin inventory, store, and homepage.

### Referral dashboard

Stats:

- Partners count.
- Active codes count.
- Referred order count.
- Referred revenue.

Partner features:

- Create partner with name, optional email, optional notes.
- Toggle partner active/inactive.
- Expand partner card to show codes.

Code features:

- Create code for partner.
- Discount type percent or fixed.
- Percent value 1-100.
- Fixed amount in dollars, stored as cents.
- Optional minimum order amount in dollars, stored as cents.
- Toggle code active/inactive.
- Show confirmed usage stats:
  - Orders.
  - Revenue.
  - Discounts given.

### Analytics dashboard

Ranges:

- 7 days.
- 30 days default.
- 90 days.

Confirmed sales are orders with status `paid` or `shipped`.

Stats:

- Revenue for selected range.
- Confirmed order count.
- Average order value.
- Units sold.

Charts and breakdowns:

- Daily revenue bar chart with empty days included.
- Top products by revenue.
- Orders by status for all orders in range.
- Payment preference counts for confirmed orders.
- Referred order count.
- Discounts given.

## 16. Data Access Functions

Build server-only functions for common reads:

- `getActiveProducts()`: active products ordered by featured desc, category, name.
- `getFeaturedProducts(limit = 6)`: active and featured products.
- `getProductBySlug(slug)`: one product or null.
- `getAllProducts()`: all products for admin.
- `getOrderItems(orderId)`.
- `getOrdersForUser(userId)`: customer account history.
- `getAllOrders()`: admin flat order list.
- `getAllOrdersWithItems()`: admin order rows with grouped items.
- `getOrderWithItems(orderId)`.
- `getOrderByReference(reference)`: order plus items.
- `getReferralPartnersWithCodes()`: partners, codes, and confirmed usage aggregates.

Use `server-only` for modules that should never be bundled into client code.

## 17. Server Actions

Required server actions:

Auth:

- `registerUser`.
- `authenticate`.
- `requestPasswordReset`.
- `resetPassword`.
- `resendVerificationEmail`.
- `verifyEmailToken`.
- `logout`.

Orders:

- `placeOrder`.
- `lookupOrder`.

Admin:

- `markOrderPaid`.
- `markOrderShipped`.
- `cancelOrder`.
- `updateInventory`.
- `updateProductFull`.

Referrals:

- `createReferralPartner`.
- `toggleReferralPartner`.
- `createReferralCode`.
- `toggleReferralCode`.
- `applyReferralCode`.

All mutation actions must:

- Validate input with Zod or equivalent.
- Require admin role where appropriate.
- Avoid trusting client-side price, stock, role, status, or discount calculations.
- Revalidate affected routes after mutation.

## 18. Setup and Commands

Recommended scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:baseline": "tsx db/baseline-migrations.ts",
  "db:push": "drizzle-kit push",
  "db:seed": "tsx db/seed.ts"
}
```

Setup:

```bash
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm db:seed
pnpm dev
```

If using migrations instead of push:

```bash
pnpm db:generate
pnpm db:migrate
```

Production:

```bash
pnpm build
pnpm start
```

## 19. Rebuild Instructions for Another AI

Use this implementation sequence:

1. Scaffold a Next.js 16 TypeScript app with App Router and Tailwind v4.
2. Install dependencies: Next, React, Drizzle, Neon serverless, NextAuth/Auth.js v5, bcryptjs, Resend, Zod, lucide-react.
3. Create the database schema exactly as described above.
4. Add Drizzle config and database client with lazy initialization so build-time imports do not require a live database.
5. Implement seed script with the catalog data, preserving live inventory/active state on reseed.
6. Implement Auth.js with an edge-safe config split and credentials provider.
7. Implement auth token creation/consumption for email verification and password reset.
8. Build public pages: home, store, product detail, science, compliance, terms, privacy, track.
9. Build global layout: header, footer, cart provider, cart drawer.
10. Implement cart localStorage behavior.
11. Implement checkout form and server-side order creation.
12. Implement referral validation and admin referral manager.
13. Implement order confirmation/detail pages with guest and account access rules.
14. Implement account order history.
15. Implement admin layout and dashboards for orders, inventory, referrals, analytics.
16. Implement Resend email templates.
17. Add route protection through `proxy.ts`.
18. Add product and logo assets.
19. Run lint/build and manually test complete order lifecycle.

## 20. Acceptance Checklist

The rebuilt site is complete when:

- Public catalog shows only active products grouped by category.
- Featured active products appear on the homepage.
- Product pages show price, inventory, add-to-cart, buy-now, and RUO notice.
- Cart persists in localStorage and clears after successful checkout.
- Checkout rejects empty carts, invalid shipping fields, invalid referral codes, missing RUO confirmation, inactive products, and over-inventory quantities.
- Server calculates price, discount, shipping, and total from database data.
- Orders are created as `pending_payment` and inventory decrements immediately.
- Customer receives order confirmation email, and admin receives new-order email.
- Order detail page shows manual payment instructions while pending.
- Admin can mark paid and customer receives payment email.
- Admin can enter carrier/tracking, mark shipped, and customer receives tracking email.
- Admin can cancel pending/paid orders and inventory restocks.
- Guest tracking requires matching reference and email.
- Auth requires email verification before login.
- Password reset works with expiring one-use tokens.
- Account page lists only the signed-in customer's orders.
- Admin routes and admin actions reject non-admins.
- Referral partners/codes can be created/toggled, applied at checkout, and shown in analytics.
- Analytics show confirmed revenue only from `paid` and `shipped` orders.
- RUO compliance language is visible in header, footer, product page, checkout, legal pages, and emails.
- No product page or email contains human-use, dosing, treatment, cure, supplement, or veterinary-use claims.

## 21. Manual Test Flow

1. Seed database and create admin.
2. Register customer.
3. Verify customer email through emailed link.
4. Sign in as customer.
5. Add a product to cart.
6. Apply a valid referral code if one exists.
7. Place order using standard shipping and Zelle.
8. Confirm order page shows pending payment and payment instructions.
9. Sign in as admin.
10. Mark order paid.
11. Confirm customer receives payment email.
12. Mark order shipped with USPS/UPS/FedEx/DHL tracking.
13. Confirm order page and email show tracking link.
14. Place another order and cancel it.
15. Confirm inventory restocks after cancellation.
16. Sign out and use `/track` with reference plus email to view guest order.
17. Verify non-admin cannot access `/admin`.
18. Verify unverified users cannot sign in.

## 22. Notes for Branding a New Site

Replace:

- Brand name.
- Domain and metadata.
- Logo assets.
- Product label designs.
- Email sender names/domains.
- Zelle/Venmo recipient.
- Legal entity and support contact.
- Admin seed account.
- Any product list, pricing, inventory, and categories that differ.

Keep:

- Research Use Only compliance structure.
- Manual payment order lifecycle.
- Server-side checkout validation.
- Order item snapshots.
- Token hashing for auth links.
- Route and server-action authorization.
- Guest order lookup by reference plus email.
