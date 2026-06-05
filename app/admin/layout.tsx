import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login?redirectTo=/admin");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foam">
            Admin Dashboard
          </h1>
          <p className="text-xs text-faint">
            Signed in as {session.user.email}
          </p>
        </div>
        <Link
          href="/"
          className="ml-auto text-xs text-mist transition-colors hover:text-foam"
        >
          ← Back to site
        </Link>
      </div>

      <AdminTabs />

      <div className="mt-8">{children}</div>
    </div>
  );
}
