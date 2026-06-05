import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms of sale for Optimized Aminos research materials.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Sale"
      intro="These terms govern your purchase of research materials from Optimized Aminos."
    >
      <section>
        <h2>1. Acceptance</h2>
        <p>
          By placing an order, you agree to these Terms of Sale and our{" "}
          Research Use Only Policy. If you do not agree, do not place an order.
        </p>
      </section>

      <section>
        <h2>2. Research use only</h2>
        <p>
          All products are sold exclusively for in-vitro laboratory research.
          You confirm you are a qualified researcher and will not use products
          for human or veterinary purposes. See our Research Use Only Policy for
          full details.
        </p>
      </section>

      <section>
        <h2>3. Orders and payment</h2>
        <p>
          Payments are processed manually via Zelle or Venmo. After placing an
          order you will receive payment instructions and an order reference.
          Orders are held as &quot;pending payment&quot; until funds are
          received and confirmed. Products remain the property of Optimized
          Aminos until payment clears. We reserve the right to cancel any unpaid
          order.
        </p>
      </section>

      <section>
        <h2>4. Shipping</h2>
        <p>
          Orders are prepared and shipped after payment is confirmed. You will
          receive an email with carrier and tracking information once your order
          ships. Title and risk of loss pass to you upon delivery to the
          carrier.
        </p>
      </section>

      <section>
        <h2>5. Returns</h2>
        <p>
          Due to the nature of research materials, all sales are final. Vials
          cannot be returned once shipped. If your order arrives damaged or
          incorrect, contact us within 7 days and we will work to resolve the
          issue.
        </p>
      </section>

      <section>
        <h2>6. Limitation of liability</h2>
        <p>
          Products are provided &quot;as is&quot; for research purposes. To the
          maximum extent permitted by law, Optimized Aminos shall not be liable
          for any damages arising from the use or misuse of any product. The
          purchaser assumes all risk and responsibility.
        </p>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>
          We may update these terms at any time. Continued use of the site
          constitutes acceptance of the revised terms.
        </p>
      </section>
    </LegalPage>
  );
}
