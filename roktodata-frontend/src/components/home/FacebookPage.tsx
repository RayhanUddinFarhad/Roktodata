import { ArrowUpRight } from "lucide-react";
import { FacebookIcon } from "@/components/BrandIcons";
import { FACEBOOK_URL } from "@/lib/data";


// Invites visitors to follow the Facebook page.
export default function FacebookPage() {
  return (
    <section className="px-4 pb-12">
      <div className="mx-auto flex max-w-[808px] flex-col gap-6 rounded-2xl border border-[#1877F2]/20 bg-linear-to-br from-[#eef4ff] to-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1462cc] text-white shadow-lg shadow-[#1877F2]/30">
          <FacebookIcon className="h-9 w-9" />
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">ফেসবুকে রক্তদাতার সাথে থাকুন</h2>
          <p className="mt-1 text-sm text-slate-600">জরুরি রক্তের অনুরোধ আর নতুন খবর সবার আগে পেতে পেজে যুক্ত হোন।</p>
        </div>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1462cc] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1877F2]/30 hover:bg-[#0f52ad]"
        >
          <FacebookIcon className="h-4 w-4" />
          পেজে যান
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
