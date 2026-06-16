import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { verifyEmailToken } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailPage(
  props: PageProps<"/verify-email">,
) {
  const session = await auth();
  if (session?.user) redirect("/account");

  const { token } = await props.searchParams;

  if (!token || typeof token !== "string") {
    return (
      <VerifyEmailResult
        status="missing"
        message="This verification link is missing a token."
      />
    );
  }

  const result = await verifyEmailToken(token);

  if (result.status === "success") {
    return (
      <VerifyEmailResult
        status="success"
        message="Your email has been verified. You can now sign in to your account."
      />
    );
  }

  return (
    <VerifyEmailResult
      status="invalid"
      message="This verification link is invalid or has expired."
    />
  );
}

function VerifyEmailResult({
  status,
  message,
}: {
  status: "success" | "invalid" | "missing";
  message: string;
}) {
  const isSuccess = status === "success";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="panel rounded-2xl p-7 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foam">
          {isSuccess ? "Email verified" : "Verification failed"}
        </h1>
        <p className="mt-3 text-sm text-mist">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          {isSuccess ? (
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink"
            >
              Sign in
            </Link>
          ) : (
            <>
              <Link
                href="/verify-email/check"
                className="rounded-xl bg-gradient-to-r from-gold to-gold-deep py-3.5 text-sm font-semibold text-ink"
              >
                Resend verification email
              </Link>
              <Link href="/login" className="text-sm text-gold hover:underline">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
