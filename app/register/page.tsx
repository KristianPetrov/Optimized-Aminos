import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foam">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-mist">
          Join Optimized Aminos to order research-grade peptides.
        </p>
      </div>
      <div className="mt-8 panel rounded-2xl p-7">
        <RegisterForm />
      </div>
    </div>
  );
}
