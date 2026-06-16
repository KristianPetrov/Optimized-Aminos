import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const session = await auth();
  if (session?.user) redirect("/account");

  const { token } = await props.searchParams;

  if (!token || typeof token !== "string") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="panel rounded-2xl p-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foam">
            Invalid reset link
          </h1>
          <p className="mt-3 text-sm text-mist">
            This password reset link is missing or invalid.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-gold to-gold-deep px-6 py-3.5 text-sm font-semibold text-ink"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foam">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-mist">
          Choose a new password for your account.
        </p>
      </div>
      <div className="mt-8 panel rounded-2xl p-7">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
