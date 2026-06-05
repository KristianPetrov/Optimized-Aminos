import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { getActiveProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research Peptide Catalog",
  description:
    "Browse high-purity research peptides supplied for in-vitro laboratory use only.",
};

async function loadProducts() {
  try {
    return await getActiveProducts();
  } catch {
    return [];
  }
}

export default async function StorePage() {
  const products = await loadProducts();

  const categories = Array.from(
    new Set(products.map((p) => p.category)),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          The Catalog
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foam sm:text-5xl">
          Research Peptides
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-mist">
          Every compound is supplied lyophilized and verified for purity. For
          research and laboratory use only.
        </p>
      </Reveal>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-ink-800/50 p-12 text-center text-mist">
          <p>The catalog is being prepared.</p>
          <p className="mt-2 text-sm text-faint">
            Once your database is connected and seeded, products will appear
            here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {categories.map((category) => (
            <section key={category}>
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-foam">
                  {category}
                </h2>
                <div className="h-px flex-1 gold-divider opacity-40" />
              </div>
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {products
                  .filter((p) => p.category === category)
                  .map((product, i) => (
                    <Reveal key={product.id} delay={i * 50}>
                      <ProductCard product={product} />
                    </Reveal>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
