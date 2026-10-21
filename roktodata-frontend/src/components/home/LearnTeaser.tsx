import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/home/HowItWorks";
import { ArticleCard } from "@/components/learn/ArticleParts";
import { getArticle } from "@/lib/articles";

// Three of the "জানুন" articles on the home page, the ones people search for most.
const PICKS = ["dengue-platelet-count", "who-can-donate-blood", "blood-group-compatibility"];

export default function LearnTeaser() {
  const articles = PICKS.map((slug) => getArticle(slug)!);
  return (
    <section className="bg-white px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="জানুন" title="রক্তদান ও ডেঙ্গু: যা জানা জরুরি" text="জরুরি মুহূর্তে কাজে লাগে এমন তথ্য, সহজ বাংলায়।" />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Link href="/learn" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
            সব লেখা পড়ুন
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
