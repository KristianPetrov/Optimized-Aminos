"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  priceCents: number;
  image: string;
  inventory: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.inventory <= 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (soldOut) return;
    addItem({
      slug: product.slug,
      name: product.name,
      image: product.image,
      priceCents: product.priceCents,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <Link
      href={`/store/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-navy-700/70 to-ink-800/70 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_20px_60px_-20px_rgba(232,200,121,0.25)]"
    >
      <div className="relative aspect-square overflow-hidden bg-ink">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 320px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 z-20 rounded-full border border-gold/30 bg-ink/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-gold backdrop-blur">
          {product.category}
        </span>
        {soldOut && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-foam transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-mist">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-foam">
            {formatPrice(product.priceCents)}
          </span>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            {added ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
