"use client";

import { useEffect, useRef } from "react";

// A thin bar at the top of the page that fills as the article is read.
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent" aria-hidden>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-linear-to-r from-red-600 via-rose-500 to-amber-400" />
    </div>
  );
}
