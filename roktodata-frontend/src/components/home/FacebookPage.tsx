import { ArrowUpRight, BellRing, HeartHandshake, Megaphone } from "lucide-react";
import { FacebookIcon } from "@/components/BrandIcons";
import { FACEBOOK_URL } from "@/lib/data";

const POINTS = [
  { icon: Megaphone, text: "জরুরি রক্তের অনুরোধ সবার আগে" },
  { icon: BellRing, text: "নতুন ফিচার ও আপডেটের খবর" },
  { icon: HeartHandshake, text: "রক্তদান নিয়ে সচেতনতা ও গল্প" },
];

// Invites visitors to follow the Facebook page.
export default function FacebookPage() {
  return (
    <section className="px-4 pb-12">
      <div className="mx-auto flex max-w-[808px] flex-col gap-6 rounded-2xl border border-[#1877F2]/20 bg-linear-to-br from-[#eef4ff] to-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30">
          <FacebookIcon className="h-9 w-9" />
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">ফেসবুকে রক্তদাতার সাথে থাকুন</h2>
          <p className="mt-1 text-sm text-slate-600">পেজে যুক্ত হলে আপনার নিউজফিডেই পাবেন:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <Icon className="h-3.5 w-3.5 text-[#1877F2]" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#1877F2]/30 hover:bg-[#166fe5]"
        >
          <FacebookIcon className="h-4 w-4" />
          পেজে যান
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
