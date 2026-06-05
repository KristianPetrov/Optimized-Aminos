import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Microscope, Snowflake } from "lucide-react";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { getProductBySlug } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/store/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Product not found" };
    return {
      title: `${product.name} — ${product.shortDescription}`,
      description: product.description,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage(props: PageProps<"/store/[slug]">) {
  const { slug } = await props.params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    product = null;
  }

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/store"
        className="inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-gold"
      >
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white to-zinc-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-contain p-6"
          />
          <span className="absolute left-4 top-4 z-20 rounded-full border border-gold/30 bg-ink/70 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-gold backdrop-blur">
            {product.category}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight text-foam sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.12em] text-gold">
            {product.shortDescription}
          </p>

          <div className="mt-6 text-3xl font-semibold text-foam">
            {formatPrice(product.priceCents)}
          </div>

          <p className="mt-6 leading-relaxed text-mist">
            {product.description}
          </p>

          <div className="my-8 h-px gold-divider opacity-30" />

          <ProductDetailActions
            slug={product.slug}
            name={product.name}
            image={product.image}
            priceCents={product.priceCents}
            inventory={product.inventory}
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Microscope, label: "HPLC / MS verified" },
              { icon: Snowflake, label: "Shipped lyophilized" },
              { icon: ShieldCheck, label: "Lot traceable" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 rounded-xl border border-line bg-ink-800/50 px-3 py-3 text-xs text-mist"
              >
                <feature.icon size={15} className="text-gold" />
                {feature.label}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs leading-relaxed text-mist">
            <span className="font-semibold text-gold">Research Use Only.</span>{" "}
            This product is intended strictly for laboratory research. It is not
            for human or veterinary use, and not intended to diagnose, treat,
            cure, or prevent any disease.
          </div>
        </div>
      </div>
    </div>
  );
}
