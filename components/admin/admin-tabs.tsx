"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Boxes } from "lucide-react";

const tabs = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-8 flex gap-1 rounded-xl border border-line bg-ink-800/50 p-1">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gold/15 text-gold"
                : "text-mist hover:bg-white/5 hover:text-foam"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
