import type { Metadata } from "next";
import Link from "next/link";
import {
  Microscope,
  Snowflake,
  BadgeCheck,
  FlaskConical,
  ShieldCheck,
  Beaker,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "The Science & Our Standards",
  description:
    "How Optimized Aminos sources, tests, and verifies research-grade peptides.",
};

const pillars = [
  {
    icon: Microscope,
    title: "Analytical Verification",
    body: "Every lot is characterized by High-Performance Liquid Chromatography (HPLC) for purity and Mass Spectrometry (MS) for identity confirmation. Certificates of Analysis are available on request.",
  },
  {
    icon: Snowflake,
    title: "Lyophilized Stability",
    body: "Peptides are supplied as lyophilized (freeze-dried) powder to maximize shelf stability and preserve molecular integrity from synthesis to your bench.",
  },
  {
    icon: BadgeCheck,
    title: "Lot Traceability",
    body: "Each vial is traceable to its production lot, so you always know exactly what you're working with — essential for reproducible research.",
  },
  {
    icon: ShieldCheck,
    title: "Ethical, Compliant Supply",
    body: "We operate strictly within a Research Use Only framework, with clear documentation and no ambiguity about the intended use of our materials.",
  },
];

const process = [
  { step: "01", title: "Synthesis", body: "Compounds are produced using validated solid-phase peptide synthesis." },
  { step: "02", title: "Purification", body: "Crude material is purified to research-grade purity targets of ≥99%." },
  { step: "03", title: "Verification", body: "Independent HPLC and MS analysis confirms purity and identity." },
  { step: "04", title: "Lyophilization", body: "Material is freeze-dried, sealed, and labeled with lot information." },
  { step: "05", title: "Cold Handling", body: "Vials are stored and shipped with care to preserve stability." },
];

export default function SciencePage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-line">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Beaker size={14} /> Quality & Standards
            </div>
            <h1 className="mt-7 text-4xl font-semibold tracking-tight text-foam sm:text-5xl">
              Rigor you can{" "}
              <span className="text-gradient-gold">reproduce</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-mist">
              Reproducible research depends on reliable inputs. We treat every
              vial as if your results depend on it — because they do.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-line bg-gradient-to-b from-navy-700/60 to-ink-800/60 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <pillar.icon size={22} />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-foam">
                  {pillar.title}
                </h2>
                <p className="mt-2 leading-relaxed text-mist">{pillar.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink-800/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              From Synthesis to Bench
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foam sm:text-4xl">
              Our process
            </h2>
          </Reveal>
          <div className="space-y-4">
            {process.map((item, i) => (
              <Reveal key={item.step} delay={i * 60}>
                <div className="flex items-center gap-5 rounded-2xl border border-line bg-ink/40 p-5">
                  <span className="text-2xl font-semibold text-gradient-gold">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foam">{item.title}</h3>
                    <p className="text-sm text-mist">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-navy to-ink p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <FlaskConical size={28} className="mx-auto text-gold" />
            <h2 className="mt-5 text-2xl font-semibold text-foam sm:text-3xl">
              Ready to equip your research?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-mist">
              Browse our catalog of verified research peptides.
            </p>
            <Link
              href="/store"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              View the catalog <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
