"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Menu, X } from "lucide-react";
import DonorCTA from "@/components/DonorCTA";
import LogoMark from "@/components/Logo";
import { NAV_LINKS } from "@/lib/data";

// Sticky header: logo, links (large screens) and the "রক্তদাতা হোন" button, which stays in view on
// every page; on smaller screens the button sits next to the ☰ menu. Slims down once scrolled.
export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (href: string) =>
    href === pathname ? "text-red-600" : "text-slate-600 hover:text-red-600";
  const onRegister = pathname === "/register";

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "border-slate-200 shadow-sm" : "border-slate-200"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-[padding] ${
          scrolled ? "py-1.5" : "py-2"
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <LogoMark className={`transition-[width,height] ${scrolled ? "h-8 w-8" : "h-9 w-9"}`} />
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

        <div className="hidden lg:block">
          <DonorCTA active={onRegister} />
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <DonorCTA active={onRegister} compact />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-menu" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-100 px-4 py-2 lg:hidden">
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
          <li className="mt-1 border-t border-slate-100 pt-1">
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Download className="h-4 w-4" />
              অ্যাপ ডাউনলোড করুন
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
