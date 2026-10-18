import { ChevronDown, CircleHelp } from "lucide-react";
import JsonLd from "@/components/JsonLd";

export interface FaqItem {
  question: string;
  answer: string;
}

// Questions people search for, answered on the page and marked up as FAQPage for search engines.
export default function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <JsonLd data={jsonLd} />
      <h2 className="flex items-center gap-2 font-bold text-slate-900">
        <CircleHelp className="h-5 w-5 text-red-600" />
        {title}
      </h2>
      <div className="mt-3 divide-y divide-slate-100">
        {items.map(({ question, answer }) => (
          <details key={question} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800 hover:text-red-600">
              {question}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
