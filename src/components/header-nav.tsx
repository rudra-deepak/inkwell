"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/?sort=discussed", label: "Discussions" },
  { href: "/dashboard", label: "Dashboard" },
];

export function HeaderNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const links = signedIn ? LINKS : LINKS.slice(0, 2);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((link) => {
        const base = link.href.split("?")[0];
        const active = pathname === base && !link.href.includes("?");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
              active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
