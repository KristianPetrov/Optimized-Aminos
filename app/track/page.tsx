import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { TrackForm } from "@/components/track-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Look up the status of your Optimized Aminos order using your order number and email.",
};

export default async function TrackPage(props: PageProps<"/track">) {
  const { reference } = await props.searchParams;
  const defaultReference = typeof reference === "string" ? reference : "";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <PackageSearch size={22} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foam">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-mist">
          Enter your order number and the email you used at checkout to view
          your order status and payment details.
        </p>
      </div>
      <div className="mt-8 panel rounded-2xl p-7">
        <TrackForm defaultReference={defaultReference} />
      </div>
    </div>
  );
}
