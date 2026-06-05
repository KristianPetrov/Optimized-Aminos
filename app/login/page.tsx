import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  const { redirectTo } = await props.searchParams;
  const target = typeof redirectTo === "string" ? redirectTo : "/account";

  if (session?.user) redirect(target);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foam">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-mist">
          Sign in to access your orders and checkout.
        </p>
      </div>
      <div className="mt-8 panel rounded-2xl p-7">
        <LoginForm redirectTo={target} />
      </div>
    </div>
  );
}
