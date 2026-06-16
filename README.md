# Optimized Aminos

A clean, futuristic storefront for a research-peptide company, built with **Next.js 16 (App Router)**, **Tailwind v4**, **Drizzle ORM + Neon Postgres**, **NextAuth (Auth.js v5)**, and **Resend**.

Theme: dark blue/black with gold accents, subtle scroll animations, and strict **Research Use Only (RUO)** compliance throughout.

## Features

- **Futuristic front page** with a strong mission statement and RUO compliance messaging.
- **Store** with category-grouped catalog, product detail pages, a slide-out cart, and checkout.
- **Manual payments** via **Zelle** and **Venmo** — orders are created as `pending_payment` and the customer receives instructions + an order reference.
- **Authentication** with NextAuth (credentials), registration, email verification, forgot password, login, and route protection via `proxy.ts`.
- **Account area** where customers view their order history and status.
- **Admin dashboard** (`/admin`) with two tabs:
  - **Orders** — view every order, mark as **Paid**, add a **carrier + tracking number** and mark **Shipped**, or **Cancel** (which restocks inventory). Every status change sends a confirmation email.
  - **Inventory** — set price, stock level, active, and featured flags per product.
- **Transactional emails** (Resend): order received, payment confirmed, shipped (with tracking), cancelled, plus an admin new-order notification.
- **Legal/compliance pages**: Research Use Only policy, Terms of Sale, Privacy Policy.

## Tech Stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)      |
| Styling        | Tailwind CSS v4                         |
| Database       | Neon (serverless Postgres)              |
| ORM            | Drizzle ORM + drizzle-kit               |
| Auth           | NextAuth / Auth.js v5 (credentials)     |
| Email          | Resend                                  |
| Icons          | lucide-react                            |
| Validation     | Zod                                     |

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for the full list):

- `DATABASE_URL` — Neon pooled connection string.
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `RESEND_API_KEY`, `EMAIL_FROM`, `AUTH_EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` — for emails.
- `NEXT_PUBLIC_SITE_URL` — used in verification and password-reset links (default: `https://optimizedaminos.co`).
- `NEXT_PUBLIC_ZELLE_RECIPIENT`, `NEXT_PUBLIC_VENMO_HANDLE` — shown at checkout.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — the initial admin account.

### 3. Create the database schema

Push the schema to your Neon database (or run the generated migration):

```bash
pnpm db:push        # apply schema directly
# or
pnpm db:migrate     # run the SQL migration in db/migrations
```

### 4. Seed the catalog + admin user

```bash
pnpm db:seed
```

This upserts all products (using the images in `public/products`) and creates the admin user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### 5. Run the app

```bash
pnpm dev
```

Visit `http://localhost:3000`. Sign in with your seeded admin credentials and open `/admin`.

## Project Structure

```
app/
  page.tsx                 # Front page (mission, values, featured, compliance CTA)
  store/                   # Catalog + product detail
  checkout/                # Checkout (Zelle/Venmo)
  order/[reference]/       # Order confirmation + payment instructions
  account/                 # Customer order history
  admin/                   # Admin dashboard (orders + inventory)
  login/ register/ forgot-password/ reset-password/ verify-email/  # Auth pages
  compliance/ terms/ privacy/ science/
  api/auth/[...nextauth]/  # NextAuth route handler
auth.ts, auth.config.ts    # NextAuth setup (split for edge-safe proxy)
proxy.ts                   # Route protection (Next.js 16 "proxy", formerly middleware)
db/                        # Drizzle schema, client, migrations, seed
lib/                       # Server actions, data access, email, formatting
components/                # UI + client components
```

## Order Lifecycle

1. Customer checks out → order created as **`pending_payment`**, confirmation email with Zelle/Venmo instructions + reference.
2. Customer sends payment with the reference in the note.
3. Admin confirms payment → marks **Paid** → "payment confirmed" email.
4. Admin adds carrier + tracking → marks **Shipped** → "shipped" email with tracking.
5. (Optional) Admin **Cancels** → inventory restocked → "cancelled" email.

## Notes

- All products are presented strictly **For Research Use Only**. Compliance language appears in the top bar, footer, product pages, checkout, and emails.
- Prices are stored in cents; inventory decrements on order and restocks on cancellation.
- Payments are handled manually (no payment processor integration), per the requirements.
