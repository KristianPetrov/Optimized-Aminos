import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VerifyEmailCheckContent } from "@/components/verify-email-content";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailCheckPage(
  props: PageProps<"/verify-email/check">,
) {
  const session = await auth();
  if (session?.user) redirect("/account");

  const { email } = await props.searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="panel rounded-2xl p-7">
        <VerifyEmailCheckContent
          email={typeof email === "string" ? email : undefined}
        />
      </div>
    </div>
  );
}
