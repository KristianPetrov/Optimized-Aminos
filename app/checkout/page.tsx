import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";
import { formatVenmoHandle } from "@/lib/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foam">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-mist">
        Complete your research-material order.
      </p>

      {!session?.user && (
        <p className="mt-4 rounded-xl border border-line bg-ink-800/50 px-4 py-3 text-sm text-mist">
          Checking out as a guest.{" "}
          <Link
            href="/login?redirectTo=/checkout"
            className="text-gold hover:underline"
          >
            Sign in
          </Link>{" "}
          to save this order to your account, or{" "}
          <Link href="/track" className="text-gold hover:underline">
            track an existing order
          </Link>
          .
        </p>
      )}

      <div className="mt-10">
        <CheckoutForm
          defaultEmail={session?.user?.email ?? ""}
          defaultName={session?.user?.name ?? ""}
          zelleRecipient={
            process.env.NEXT_PUBLIC_ZELLE_RECIPIENT ||
            "payments@optimizedaminos.com"
          }
          venmoHandle={formatVenmoHandle(
            process.env.NEXT_PUBLIC_VENMO_HANDLE || "OptimizedAminos",
          )}
        />
      </div>
    </div>
  );
}
