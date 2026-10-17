"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/Logo";
import { NAV_LINKS } from "@/lib/data";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-[840px] flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-900">রক্তদাতা</span>
            <span className="block text-[9px] font-semibold tracking-[0.15em] text-indigo-900">
              ROKTODATA
            </span>
          </span>
        </Link>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {NAV_LINKS.map((link) => {
            const active = link.href === pathname;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={active ? "text-red-600" : "text-slate-600 hover:text-red-600"}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
