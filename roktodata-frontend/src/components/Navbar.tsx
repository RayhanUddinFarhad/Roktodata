"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LogoMark from "@/components/Logo";
import { NAV_LINKS } from "@/lib/data";

// Full link row on large screens; a ☰ menu with a stacked list below that.
export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    href === pathname ? "text-red-600" : "text-slate-600 hover:text-red-600";

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <LogoMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-900">রক্তদাতা</span>
            <span className="block text-[9px] font-semibold tracking-[0.15em] text-indigo-900">ROKTODATA</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-x-5 text-sm lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={`whitespace-nowrap ${linkClass(link.href)}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-slate-100 px-4 py-2 lg:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm ${
                  link.href === pathname ? "bg-red-50 font-semibold text-red-600" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
