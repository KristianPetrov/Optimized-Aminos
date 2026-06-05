import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Research Use Only Policy",
  description:
    "Optimized Aminos products are sold strictly for in-vitro laboratory research. Read our full Research Use Only compliance policy.",
};

export default function CompliancePage() {
  return (
    <LegalPage
      eyebrow="Compliance"
      title="Research Use Only Policy"
      intro="Optimized Aminos is committed to the responsible supply of research materials. This policy governs every product we sell."
    >
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
        <h2 className="text-gold">For Research Use Only</h2>
        <p className="text-foam">
          All products offered by Optimized Aminos are intended{" "}
          <strong>strictly for in-vitro laboratory research and
          development purposes only.</strong> They are <strong>not</strong>{" "}
          intended for human or veterinary use and are <strong>not</strong>{" "}
          drugs, foods, cosmetics, dietary supplements, or medical devices.
        </p>
      </div>

      <section>
        <h2>Not for human consumption</h2>
        <p>
          Our products are not intended to diagnose, treat, cure, or prevent any
          disease or medical condition. They may not be administered to humans
          or animals under any circumstances. No statements made on this website
          have been evaluated by the U.S. Food and Drug Administration (FDA) or
          any other regulatory authority.
        </p>
      </section>

      <section>
        <h2>Who may purchase</h2>
        <p>
          By placing an order you represent and warrant that:
        </p>
        <ul>
          <li>You are at least 21 years of age.</li>
          <li>
            You are a qualified researcher, or an authorized representative of a
            research or educational institution, business, or laboratory.
          </li>
          <li>
            You will use the products solely for legitimate, lawful in-vitro
            research and not for any human or animal use.
          </li>
          <li>
            You will handle, store, and dispose of all materials in accordance
            with applicable laws, regulations, and good laboratory practice.
          </li>
        </ul>
      </section>

      <section>
        <h2>Researcher responsibility</h2>
        <p>
          The purchaser assumes all responsibility and liability for the safe
          handling, use, and disposal of any product purchased. Researchers are
          solely responsible for determining and complying with all federal,
          state, and local laws and regulations applicable to the purchase,
          possession, and use of these materials in their jurisdiction.
        </p>
      </section>

      <section>
        <h2>No medical advice</h2>
        <p>
          Nothing on this website constitutes medical, scientific, or
          professional advice. Product descriptions reference published research
          for informational purposes only and are not claims of efficacy or
          safety for any use.
        </p>
      </section>

      <section>
        <h2>Right to refuse</h2>
        <p>
          Optimized Aminos reserves the right to refuse or cancel any order that
          we believe, in our sole discretion, may be intended for human or
          animal use or any unlawful purpose.
        </p>
      </section>
    </LegalPage>
  );
}
