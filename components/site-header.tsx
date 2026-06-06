"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X, ShieldCheck, User2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { logout } from "@/lib/actions/auth";

type HeaderUser = {
  name: string | null;
  email: string | null;
  role: "customer" | "admin";
} | null;

const navLinks = [
  { href: "/store", label: "Store" },
  { href: "/science", label: "The Science" },
  { href: "/compliance", label: "Compliance" },
];

export function SiteHeader({ user }: { user: HeaderUser }) {
  const { count, setOpen, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="w-full bg-gold/10 border-b border-gold/15 text-center text-[11px] tracking-[0.18em] uppercase text-gold py-1.5 px-4">
        For Research Use Only · Not for Human or Veterinary Use
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-lg font-semibold tracking-[0.06em]">
              <span className="text-gradient-gold">OPTIMIZED</span>
              <span className="text-foam"> AMINOS</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm transition-colors hover:text-foam ${
                    active ? "text-foam" : "text-mist"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                      active ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10 sm:flex"
              >
                <ShieldCheck size={14} /> Admin
              </Link>
            )}

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-mist transition-colors hover:text-foam"
                >
                  <User2 size={14} /> Account
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-xs text-faint transition-colors hover:text-mist"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border border-line px-4 py-1.5 text-xs text-mist transition-colors hover:text-foam sm:block"
              >
                Sign in
              </Link>
            )}

            <button
              onClick={() => setOpen(true)}
              aria-label="Open cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition-colors hover:border-gold/40 hover:text-gold"
            >
              <ShoppingCart size={18} />
              {hydrated && count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                  {count}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist md:hidden"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-line bg-ink/95 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-foam"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-line" />
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm text-gold hover:bg-white/5"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-foam"
                  >
                    My Account
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-faint hover:bg-white/5"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-foam"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
