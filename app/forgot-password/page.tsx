import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foam">
          Forgot password?
        </h1>
        <p className="mt-2 text-sm text-mist">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>
      <div className="mt-8 panel rounded-2xl p-7">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
