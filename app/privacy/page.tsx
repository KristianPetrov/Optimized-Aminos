import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Optimized Aminos collects and uses your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We respect your privacy and collect only what we need to fulfill your orders."
    >
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Account details: your name, email address, and password (stored hashed).</li>
          <li>Order details: shipping address, contact information, and order history.</li>
          <li>Payment confirmation: the method you select and references you provide.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>
          We use your information solely to process and ship your orders, send
          transactional emails about your order status, and provide customer
          support. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2>Email communications</h2>
        <p>
          We send transactional emails (order confirmation, payment
          confirmation, and shipping notifications) via our email provider.
          These are necessary to fulfill your order.
        </p>
      </section>

      <section>
        <h2>Data security</h2>
        <p>
          Passwords are stored using industry-standard hashing. We take
          reasonable measures to protect your information, though no method of
          transmission or storage is completely secure.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You may request access to or deletion of your account data at any time
          by contacting us.
        </p>
      </section>
    </LegalPage>
  );
}
