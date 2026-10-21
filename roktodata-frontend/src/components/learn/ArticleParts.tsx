import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Clock,
  Info,
  Lightbulb,
  ShieldCheck,
  Soup,
  Sparkles,
  Syringe,
  TriangleAlert,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toBanglaNumber } from "@/lib/data";
import { CATEGORIES, readingMinutes, type Article, type Block, type IconName } from "@/lib/articles";

export const ICONS: Record<IconName, LucideIcon> = {
  activity: Activity,
  alert: TriangleAlert,
  soup: Soup,
  syringe: Syringe,
  shield: ShieldCheck,
  userCheck: UserCheck,
  calendar: CalendarClock,
  clipboard: ClipboardList,
  users: Users,
  sparkles: Sparkles,
};

// **bold** and [text](/path) inside article text.
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index} className="font-semibold text-slate-900">{m[1]}</strong>);
    else
      parts.push(
        <Link key={m.index} href={m[3]} className="font-semibold text-red-600 underline decoration-red-200 underline-offset-4 hover:decoration-red-600">
          {m[2]}
        </Link>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

const NOTE = {
  tip: { icon: Lightbulb, box: "border-emerald-200 bg-emerald-50", title: "text-emerald-800", iconBox: "bg-emerald-600" },
  warn: { icon: TriangleAlert, box: "border-amber-300 bg-amber-50", title: "text-amber-900", iconBox: "bg-amber-500" },
  info: { icon: Info, box: "border-sky-200 bg-sky-50", title: "text-sky-900", iconBox: "bg-sky-600" },
};

export function ArticleBlock({ block }: { block: Block }) {
  if ("p" in block)
    return (
      <p className="text-[15px] leading-8 text-slate-700">
        <RichText text={block.p} />
      </p>
    );
  if ("list" in block)
    return (
      <ul className="space-y-2.5">
        {block.list.map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-7 text-slate-700">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <span>
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  if ("steps" in block)
    return (
      <ol className="space-y-3">
        {block.steps.map((item, i) => (
          <li key={item} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[15px] leading-7 text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
              {toBanglaNumber(i + 1)}
            </span>
            <span>
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ol>
    );
  if ("note" in block) {
    const n = NOTE[block.note.tone];
    return (
      <aside className={`flex gap-3 rounded-xl border p-4 ${n.box}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${n.iconBox}`}>
          <n.icon className="h-4 w-4" />
        </span>
        <div>
          <p className={`font-bold ${n.title}`}>{block.note.title}</p>
          <p className="mt-1 text-sm leading-7 text-slate-700">
            <RichText text={block.note.text} />
          </p>
        </div>
      </aside>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-[13px] sm:text-sm">
        <thead className="bg-slate-900 text-white">
          <tr>
            {block.table.head.map((h, i) => (
              <th key={i} className="px-3 py-3 font-semibold sm:px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {block.table.rows.map((row, r) => (
            <tr key={r} className="even:bg-slate-50">
              {row.map((cell, c) => (
                <td key={c} className={`px-3 py-3 align-top leading-6 sm:px-4 ${c === 0 ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                  <RichText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// A card with a coloured header: the article's big number, its icon and its category.
export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const Icon = ICONS[article.icon];
  return (
    <Link
      href={`/learn/${article.slug}`}
      className={`group flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
        featured ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div className={`relative overflow-hidden bg-linear-to-br ${article.tone} p-5 text-white ${featured ? "md:w-[46%] md:p-8" : ""}`}>
        <Icon className="absolute -bottom-6 -right-6 h-32 w-32 text-white/15 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" strokeWidth={1.5} />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
          <Icon className="h-3 w-3" />
          {CATEGORIES[article.category].label}
        </span>
        <p className={`relative mt-4 font-bold leading-none ${featured ? "text-4xl md:text-5xl" : "text-3xl"}`}>{article.hook.value}</p>
        <p className="relative mt-2 max-w-[16rem] text-xs leading-5 text-white/90">{article.hook.label}</p>
      </div>
      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:justify-center md:p-8" : ""}`}>
        <h3 className={`font-bold leading-snug text-slate-900 transition-colors group-hover:text-red-600 ${featured ? "text-xl md:text-2xl" : "text-base"}`}>
          {article.title}
        </h3>
        <p className={`mt-2 text-sm leading-6 text-slate-600 ${featured ? "" : "line-clamp-2"}`}>{article.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {toBanglaNumber(readingMinutes(article))} মিনিটে পড়ুন
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
            পড়ুন
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
