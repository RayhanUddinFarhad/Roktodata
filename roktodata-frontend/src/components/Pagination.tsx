import { ChevronLeft, ChevronRight } from "lucide-react";
import { toBanglaNumber } from "@/lib/data";

// Page numbers to show: first, last, and the current page with one neighbour on each side,
// with gaps ("…") where pages are skipped. E.g. 1 … 4 5 6 … 20
function pageItems(page: number, pages: number): (number | "gap")[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

export default function Pagination({
  page,
  pages,
  onPage,
  disabled,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  if (pages <= 1) return null;

  const button = "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="পৃষ্ঠা" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={disabled || page <= 1}
        className={`${button} gap-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40`}
      >
        <ChevronLeft className="h-4 w-4" />
        আগের
      </button>

      {pageItems(page, pages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            disabled={disabled}
            aria-current={item === page ? "page" : undefined}
            className={`${button} ${
              item === page
                ? "border-red-600 bg-red-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {toBanglaNumber(item)}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={disabled || page >= pages}
        className={`${button} gap-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40`}
      >
        পরবর্তী
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
