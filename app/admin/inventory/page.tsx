import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data";
import { InventoryRow } from "@/components/admin/inventory-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Inventory" };

export default async function AdminInventoryPage() {
  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = await getAllProducts();
  } catch {
    products = [];
  }

  const totalUnits = products.reduce((sum, p) => sum + p.inventory, 0);
  const lowStock = products.filter(
    (p) => p.inventory > 0 && p.inventory <= 5,
  ).length;
  const outOfStock = products.filter((p) => p.inventory <= 0).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Products", value: String(products.length) },
          { label: "Units in Stock", value: String(totalUnits) },
          { label: "Low Stock (≤5)", value: String(lowStock) },
          { label: "Out of Stock", value: String(outOfStock) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-ink-800/50 p-5"
          >
            <p className="text-xs uppercase tracking-wider text-faint">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foam">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-ink-800/50 p-12 text-center text-mist">
            No products found. Run{" "}
            <code className="rounded bg-ink px-1.5 py-0.5 text-gold">
              pnpm db:seed
            </code>{" "}
            to populate the catalog.
          </div>
        ) : (
          products.map((product) => (
            <InventoryRow key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
