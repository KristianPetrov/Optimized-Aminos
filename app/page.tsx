import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  Microscope,
  Atom,
  BadgeCheck,
  Snowflake,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

async function loadFeatured() {
  try {
    return await getFeaturedProducts(8);
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await loadFeatured();

  return (
    <div className="overflow-hidden">
      {/* ---------- HERO ---------- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px] animate-glow" />
          <div className="absolute right-[10%] top-[20%] h-[300px] w-[300px] rounded-full bg-blue-700/20 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(232,200,121,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,200,121,0.6) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Atom size={14} /> Research-Grade Peptide Science
            </div>

            <h1 className="animate-fade-up mt-7 text-4xl font-semibold leading-[1.1] tracking-tight text-foam sm:text-6xl">
              Precision peptides for the
              <span className="text-gradient-gold"> frontier of research</span>
            </h1>

            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              Optimized Aminos manufactures and supplies ultra-high-purity
              research peptides — rigorously tested, transparently documented,
              and built for the demands of serious laboratory investigation.
            </p>

            <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/store"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                Explore the Catalog
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/science"
                className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm text-foam transition-colors hover:border-gold/40 hover:text-gold"
              >
                Our Standards
              </Link>
            </div>

            <p className="animate-fade-in mt-6 text-xs uppercase tracking-[0.2em] text-faint">
              For Research Use Only · Not for Human Consumption
            </p>
          </div>

          {/* Trust metrics */}
          <Reveal className="mt-20" delay={150}>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
              {[
                { value: "≥99%", label: "Verified Purity" },
                { value: "3rd-Party", label: "HPLC / MS Tested" },
                { value: "Lyophilized", label: "Cold-Chain Handled" },
                { value: "100%", label: "Batch Traceability" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-ink-800 px-6 py-7 text-center"
                >
                  <div className="text-2xl font-semibold text-gradient-gold">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-mist">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- MISSION ---------- */}
      <section className="relative border-y border-line bg-ink-800/50">
        <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Our Mission
            </p>
            <h2 className="mx-auto mt-5 max-w-4xl text-2xl font-medium leading-snug text-foam sm:text-4xl sm:leading-[1.25]">
              To accelerate discovery by giving researchers{" "}
              <span className="text-gradient-gold">
                uncompromising access to pure, traceable, and ethically supplied
                peptides
              </span>{" "}
              — so the next breakthrough is never limited by the quality of its
              materials.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-mist">
              We exist to serve the scientific community with integrity. Every
              compound we offer is produced to exacting standards, independently
              verified, and documented end-to-end. We believe rigorous research
              deserves rigorous inputs — and we hold ourselves accountable to
              that principle on every order.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- VALUES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mb-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foam sm:text-4xl">
            Built on scientific rigor
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-mist">
            Four commitments that define every vial we ship.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Microscope,
              title: "Analytical Purity",
              body: "Each batch is validated by HPLC and mass spectrometry, with certificates of analysis available on request.",
            },
            {
              icon: Snowflake,
              title: "Cold-Chain Integrity",
              body: "Lyophilized and handled to preserve molecular stability from synthesis to your bench.",
            },
            {
              icon: BadgeCheck,
              title: "Full Traceability",
              body: "Lot-level documentation means you always know exactly what you're working with.",
            },
            {
              icon: ShieldCheck,
              title: "Ethical Supply",
              body: "Research-use-only compliance is embedded in everything we do — no shortcuts, no ambiguity.",
            },
          ].map((value, i) => (
            <Reveal key={value.title} delay={i * 100}>
              <div className="group h-full rounded-2xl border border-line bg-gradient-to-b from-navy-700/60 to-ink-800/60 p-6 transition-colors hover:border-gold/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition-transform group-hover:scale-110">
                  <value.icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foam">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {value.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED PRODUCTS ---------- */}
      {featured.length > 0 && (
        <section className="border-t border-line bg-ink-800/50">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  Featured Catalog
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foam sm:text-4xl">
                  Reference compounds
                </h2>
              </div>
              <Link
                href="/store"
                className="group inline-flex items-center gap-2 text-sm text-gold hover:text-foam"
              >
                View all peptides
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Reveal>

            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((product, i) => (
                <Reveal key={product.id} delay={i * 60}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- COMPLIANCE CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-navy to-ink p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                <FlaskConical size={22} />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foam sm:text-3xl">
                Strictly for research. Always.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-mist">
                All products sold by Optimized Aminos are intended exclusively
                for in-vitro laboratory research and development. They are not
                drugs, foods, cosmetics, or supplements, and are not intended to
                diagnose, treat, cure, or prevent any disease. By purchasing, you
                confirm you are a qualified researcher.
              </p>
              <Link
                href="/compliance"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
              >
                Read our compliance policy
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
