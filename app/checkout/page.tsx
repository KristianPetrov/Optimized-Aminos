import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?redirectTo=/checkout");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foam">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-mist">
        Complete your research-material order.
      </p>

      <div className="mt-10">
        <CheckoutForm
          defaultEmail={session.user.email ?? ""}
          defaultName={session.user.name ?? ""}
          zelleRecipient={
            process.env.NEXT_PUBLIC_ZELLE_RECIPIENT ||
            "payments@optimizedaminos.com"
          }
          venmoHandle={
            process.env.NEXT_PUBLIC_VENMO_HANDLE || "@OptimizedAminos"
          }
        />
      </div>
    </div>
  );
}
