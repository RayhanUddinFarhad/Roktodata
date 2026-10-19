"use client";

import { useId, useState } from "react";
import Link from "next/link";

// "রক্তদাতা হোন" button in the header. Its icon tells the site's donation story: a drop falls into a
// blood bag, the bag fills and a plus appears (once on load). Afterwards a drop falls in every 10 s
// with a small wiggle; hovering replays the full sequence. On the register page it stays still.
export default function DonorCTA({ active, compact = false }: { active: boolean; compact?: boolean }) {
  const clip = useId();
  const [replay, setReplay] = useState(0);

  return (
    <Link
      href="/register"
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => !active && setReplay((n) => n + 1)}
      className={`nav-donor inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold text-white shadow-md shadow-red-600/30 transition-colors ${
        active ? "bg-red-800" : "bg-red-600 hover:bg-red-700"
      } ${compact ? "py-1.5 pl-1.5 pr-3 text-xs" : "py-1.5 pl-2 pr-4 text-sm"}`}
    >
      <svg
        key={replay}
        viewBox="0 0 48 48"
        className={`${compact ? "h-6 w-6" : "h-7 w-7"} ${active ? "" : "nd-animate"}`}
        aria-hidden
      >
        <g className="nd-bag">
          <path d="M16 15h16a3 3 0 0 1 3 3v17a6 6 0 0 1-6 6h-10a6 6 0 0 1-6-6V18a3 3 0 0 1 3-3z" fill="none" stroke="#fff" strokeWidth="2.8" />
          <path d="M21 15v-3h6v3" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinejoin="round" />
          <clipPath id={clip}>
            <path d="M16.5 16.5h15a2 2 0 0 1 2 2V35a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5V18.5a2 2 0 0 1 2-2z" />
          </clipPath>
          <rect className="nd-fill" x="13" y="16" width="22" height="25" fill="#fecaca" clipPath={`url(#${clip})`} />
          <path className="nd-plus" d="M24 23v11M18.5 28.5h11" stroke="#b91c1c" strokeWidth="3.4" strokeLinecap="round" />
        </g>
        <path className="nd-drop" d="M24 1c-1 3-4 5-4 8a4 4 0 0 0 8 0c0-3-3-5-4-8z" fill="#fecaca" opacity="0" />
      </svg>
      রক্তদাতা হোন
    </Link>
  );
}
