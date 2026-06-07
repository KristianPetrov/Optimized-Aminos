import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { db } from "./index";
import { products, users, type NewProduct } from "./schema";

const catalog: Omit<NewProduct, "id" | "createdAt">[] = [
  {
    slug: "bpc-157-10mg",
    name: "BPC-157",
    shortDescription: "10mg · Body Protection Compound",
    description:
      "BPC-157 is a synthetic pentadecapeptide studied extensively in preclinical models for its role in tissue repair, angiogenesis, and gut-lining research. A staple reference compound for recovery and connective-tissue investigations.",
    category: "Repair & Recovery",
    priceCents: 8500,
    image: "/products/bpc-157-10mg.png",
    inventory: 50,
    featured: true,
  },
  {
    slug: "tb-500-10mg",
    name: "TB-500",
    shortDescription: "10mg · Thymosin Beta-4 Fragment",
    description:
      "TB-500 is the synthetic analog of the active region of Thymosin Beta-4, a peptide investigated in models of cellular migration, vascularization, and recovery research.",
    category: "Repair & Recovery",
    priceCents: 6000,
    image: "/products/tb-500-10mg.png",
    inventory: 40,
    featured: true,
  },
  {
    slug: "bpc-157-10mg-ghk-cu-10mg-tb-500-10mg",
    name: "BPC-157 / GHK-Cu / TB-500 Blend",
    shortDescription: "10mg / 10mg / 10mg · Triple Repair Matrix",
    description:
      "A research blend combining BPC-157, GHK-Cu, and TB-500 in a single vial for comparative studies of synergistic repair, regeneration, and connective-tissue pathways.",
    category: "Repair & Recovery",
    priceCents: 12999,
    image: "/products/bpc-157-10mg-ghk-cu-10mg-tb-500-10mg.png",
    inventory: 25,
    featured: true,
  },
  {
    slug: "wolverine-pro-10mg",
    name: "Wolverine Pro Blend",
    shortDescription: "10mg · Advanced Recovery Stack",
    description:
      "The Wolverine Pro research blend is formulated for advanced regeneration and recovery studies, combining repair-oriented peptides into a single reference vial.",
    category: "Repair & Recovery",
    priceCents: 15000,
    image: "/products/wolverine-pro-10mg.png",
    inventory: 20,
    featured: true,
  },
  {
    slug: "klow-10mg-50mg",
    name: "KLOW Blend",
    shortDescription: "Multi-peptide regeneration blend",
    description:
      "KLOW is a multi-peptide research blend used in comparative regeneration and tissue-repair investigations.",
    category: "Repair & Recovery",
    priceCents: 19500,
    image: "/products/klow-10mg-50mg.png",
    inventory: 18,
  },
  {
    slug: "ghk-cu-50mg",
    name: "GHK-Cu",
    shortDescription: "50mg · Copper Peptide",
    description:
      "GHK-Cu is a naturally occurring copper-binding tripeptide widely referenced in dermal regeneration, collagen remodeling, and anti-inflammatory research.",
    category: "Repair & Recovery",
    priceCents: 6500,
    image: "/products/ghk-cu-50mg.png",
    inventory: 35,
  },
  {
    slug: "cjc-1295-10mg-ipamorelin-10mg",
    name: "CJC-1295 / Ipamorelin Blend",
    shortDescription: "10mg / 10mg · GH Secretagogue Stack",
    description:
      "A combination of CJC-1295 and Ipamorelin, two growth-hormone secretagogues frequently paired in endocrine and metabolic research models.",
    category: "Growth & Metabolic",
    priceCents: 10000,
    image: "/products/cjc-1295-10mg-ipamorelin-10mg.png",
    inventory: 30,
    featured: true,
  },
  {
    slug: "ipamorelin-10mg",
    name: "Ipamorelin",
    shortDescription: "10mg · Selective GH Secretagogue",
    description:
      "Ipamorelin is a selective growth-hormone secretagogue and ghrelin-receptor agonist studied for its targeted release profile in endocrine research.",
    category: "Growth & Metabolic",
    priceCents: 5499,
    image: "/products/ipamorelin-10mg.png",
    inventory: 45,
  },
  {
    slug: "tesamorelin-10mg",
    name: "Tesamorelin",
    shortDescription: "10mg · GHRH Analog",
    description:
      "Tesamorelin is a stabilized growth-hormone-releasing hormone (GHRH) analog referenced in metabolic and adipose-tissue research.",
    category: "Growth & Metabolic",
    priceCents: 10000,
    image: "/products/tesamorelin-10mg.png",
    inventory: 28,
  },
  {
    slug: "tesamorelin-20mg",
    name: "Tesamorelin",
    shortDescription: "20mg · GHRH Analog (High Concentration)",
    description:
      "A higher-concentration vial of Tesamorelin, a stabilized GHRH analog used in metabolic and adipose-tissue research.",
    category: "Growth & Metabolic",
    priceCents: 14000,
    image: "/products/tesamorelin-20mg.png",
    inventory: 20,
  },
  {
    slug: "aod-9604-10mg",
    name: "AOD-9604",
    shortDescription: "10mg · Modified GH Fragment",
    description:
      "AOD-9604 is a modified fragment of human growth hormone (176-191) studied in lipid metabolism and adipose-tissue research models.",
    category: "Growth & Metabolic",
    priceCents: 6999,
    image: "/products/aod-9604-10mg.png",
    inventory: 30,
  },
  {
    slug: "aicar-50mg",
    name: "AICAR",
    shortDescription: "50mg · AMPK Activator",
    description:
      "AICAR is an AMP-activated protein kinase (AMPK) activator referenced in cellular energy metabolism and endurance research.",
    category: "Growth & Metabolic",
    priceCents: 14000,
    image: "/products/aicar-50mg.png",
    inventory: 22,
  },
  {
    slug: "rt-3-10mg",
    name: "Retatrutide",
    shortDescription: "10mg · Triple-Agonist (Research)",
    description:
      "Retatrutide is a triple-agonist peptide (GIP/GLP-1/glucagon) under active investigation in metabolic and weight-regulation research.",
    category: "Growth & Metabolic",
    priceCents: 15000,
    image: "/products/rt-3-10mg.png",
    inventory: 25,
    featured: true,
  },
  {
    slug: "rt-3-20mg",
    name: "Retatrutide",
    shortDescription: "20mg · Triple-Agonist (Research)",
    description:
      "A higher-concentration vial of Retatrutide, a triple-agonist peptide (GIP/GLP-1/glucagon) studied in metabolic research.",
    category: "Growth & Metabolic",
    priceCents: 20000,
    image: "/products/rt-3-20mg.png",
    inventory: 18,
  },
  {
    slug: "rt-3-30mg",
    name: "Retatrutide",
    shortDescription: "30mg · Triple-Agonist (Research)",
    description:
      "The highest-concentration Retatrutide vial in the catalog, intended for extended metabolic research protocols.",
    category: "Growth & Metabolic",
    priceCents: 25000,
    image: "/products/rt-3-30mg.png",
    inventory: 15,
  },
  {
    slug: "mots-c-10mg",
    name: "MOTS-c",
    shortDescription: "10mg · Mitochondrial-Derived Peptide",
    description:
      "MOTS-c is a mitochondrial-derived peptide studied for its role in metabolic regulation, insulin sensitivity, and cellular energy research.",
    category: "Longevity & Mitochondrial",
    priceCents: 6500,
    image: "/products/mots-c-10mg.png",
    inventory: 30,
  },
  {
    slug: "mots-c-40mg",
    name: "MOTS-c",
    shortDescription: "40mg · Mitochondrial-Derived Peptide",
    description:
      "A high-concentration MOTS-c vial for extended mitochondrial and metabolic research protocols.",
    category: "Longevity & Mitochondrial",
    priceCents: 13000,
    image: "/products/mots-c-40mg.png",
    inventory: 16,
  },
  {
    slug: "ss-31-10mg",
    name: "SS-31 (Elamipretide)",
    shortDescription: "10mg · Mitochondrial-Targeted Peptide",
    description:
      "SS-31 is a mitochondria-targeted tetrapeptide referenced in research on cardiolipin stabilization and cellular energy production.",
    category: "Longevity & Mitochondrial",
    priceCents: 7500,
    image: "/products/ss-31-10mg.png",
    inventory: 20,
  },
  {
    slug: "nad-1000mg",
    name: "NAD+",
    shortDescription: "1000mg · Cellular Coenzyme",
    description:
      "NAD+ is an essential coenzyme central to cellular metabolism, DNA repair, and longevity research at the mitochondrial level.",
    category: "Longevity & Mitochondrial",
    priceCents: 22500,
    image: "/products/nad-1000mg.png",
    inventory: 24,
    featured: true,
  },
  {
    slug: "semax-10mg",
    name: "Semax",
    shortDescription: "10mg · Nootropic Peptide",
    description:
      "Semax is a synthetic peptide derived from ACTH(4-10), studied for its influence on BDNF expression and cognitive research models.",
    category: "Cognitive & Nootropic",
    priceCents: 12500,
    image: "/products/semax-10mg.png",
    inventory: 28,
  },
  {
    slug: "selank-10mg",
    name: "Selank",
    shortDescription: "10mg · Anxiolytic Peptide",
    description:
      "Selank is a synthetic analog of the immunomodulatory peptide tuftsin, referenced in anxiolytic and neuroregulatory research.",
    category: "Cognitive & Nootropic",
    priceCents: 12500,
    image: "/products/selank-10mg.png",
    inventory: 28,
  },
  {
    slug: "mt-2-10mg",
    name: "Melanotan II",
    shortDescription: "10mg · Melanocortin Agonist",
    description:
      "Melanotan II is a synthetic analog of alpha-melanocyte-stimulating hormone studied in melanocortin-receptor and pigmentation research.",
    category: "Specialty Research",
    priceCents: 5499,
    image: "/products/mt-2-10mg.png",
    inventory: 32,
  },
];

async function main() {
  console.log("Seeding database...");

  // Upsert products by slug
  for (const product of catalog) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          category: product.category,
          priceCents: product.priceCents,
          image: product.image,
          featured: product.featured ?? false,
        },
      });
  }
  console.log(`Seeded ${catalog.length} products.`);

  // Create the initial admin user if it doesn't exist
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db
      .insert(users)
      .values({
        email: adminEmail.toLowerCase(),
        name: "Administrator",
        passwordHash,
        role: "admin",
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { role: "admin", passwordHash },
      });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.log("Skipping admin seed (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set).");
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
