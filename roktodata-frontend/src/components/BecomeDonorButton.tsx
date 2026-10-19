"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Only on pages without call/WhatsApp buttons in the bottom-right corner (donor cards, requests),
// so it never covers them.
const SHOW_ON = new Set(["/", "/about", "/donors"]);

// Floating "become a donor" button: a drop falls into a blood bag, the bag fills and a plus appears.
// Appears after the visitor scrolls past the hero search, plays once, then only pulses now and then.
// The label collapses to the icon after a few seconds; hover or focus shows it again.
export default function BecomeDonorButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setExpanded(false), 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!SHOW_ON.has(pathname) || !visible) return null;

  return (
    <Link
      href="/register"
      aria-label="রক্তদাতা হিসেবে যুক্ত হোন"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      className="donor-fab fixed bottom-5 right-4 z-40 flex items-center rounded-full bg-linear-to-br from-red-600 to-red-800 p-1.5 text-white shadow-lg shadow-red-900/30 ring-4 ring-white/70 sm:bottom-6 sm:right-6"
    >
      <span className="donor-fab-ring relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
        <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
          {/* bag */}
          <path d="M16 15h16a3 3 0 0 1 3 3v17a6 6 0 0 1-6 6h-10a6 6 0 0 1-6-6V18a3 3 0 0 1 3-3z" fill="none" stroke="#fff" strokeWidth="2.4" />
          <path d="M21 15v-3h6v3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
          <clipPath id="bag-inside">
            <path d="M16.5 16.5h15a2 2 0 0 1 2 2V35a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5V18.5a2 2 0 0 1 2-2z" />
          </clipPath>
          <rect className="donor-fab-fill" x="13" y="16" width="22" height="25" fill="#fecaca" clipPath="url(#bag-inside)" />
          {/* plus on the bag */}
          <path className="donor-fab-plus" d="M24 23v11M18.5 28.5h11" stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" />
          {/* falling drop */}
          <path className="donor-fab-drop" d="M24 1c-1 3-4 5-4 8a4 4 0 0 0 8 0c0-3-3-5-4-8z" fill="#fecaca" />
        </svg>
      </span>
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 ${
          expanded ? "max-w-40 pl-2 pr-3 opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        রক্তদাতা হোন
      </span>
    </Link>
  );
}
