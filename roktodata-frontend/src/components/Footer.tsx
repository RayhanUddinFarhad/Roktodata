import Link from "next/link";
import { cacheLife } from "next/cache";
import { Mail } from "lucide-react";
import { FacebookIcon } from "@/components/BrandIcons";
import LogoMark from "@/components/Logo";
import { CONTACT_EMAIL, DEVELOPER_NAME, FACEBOOK_URL } from "@/lib/data";

const QUICK_LINKS = [
  { href: "/", label: "হোম পেজ" },
  { href: "/find-donor", label: "ডোনার তালিকা" },
  { href: "/donors", label: "জেলাভিত্তিক রক্তদাতা" },
  { href: "/patient-search", label: "রোগীর জন্য সার্চ" },
  { href: "/blood-requests", label: "রক্তের অনুরোধসমূহ" },
  { href: "/fraud-donors", label: "প্রতারক ডোনার তালিকা" },
  { href: "/register", label: "ডোনার রেজিস্ট্রেশন" },
  { href: "/learn", label: "রক্তদান ও ডেঙ্গু: জানুন" },
  { href: "/about", label: "আমাদের সম্পর্কে" },
];

export default async function Footer() {
  "use cache";
  cacheLife("days");

  return (
    <footer className="bg-[#0f172a] text-slate-400">
      <div className="mx-auto grid max-w-[840px] gap-10 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" gradient="bg-red-600" />
            <span className="font-bold text-white">রক্তদাতা (RoktoData)</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            সারাদেশের মানুষের রক্তদান সহজলভ্য করতে এবং জীবন বাঁচাতে আমাদের এই অরাজনৈতিক সামাজিক উদ্যোগ।
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-white">দ্রুত লিংক</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-white">যোগাযোগ</h2>
          <p className="mt-3 text-sm">যেকোনো প্রশ্ন, পরামর্শ বা ডোনার তালিকা পাঠাতে ইমেইল করুন:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-2 flex items-center gap-2 break-all font-semibold text-red-400 hover:text-red-300"
          >
            <Mail className="h-4 w-4 shrink-0" />
            {CONTACT_EMAIL}
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1462cc] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f52ad]"
          >
            <FacebookIcon className="h-4 w-4" />
            ফেসবুক পেজ
          </a>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} রক্তদাতা (RoktoData)। সর্বস্বত্ব সংরক্ষিত। ডেভেলপ করেছেন{" "}
        <Link href="/about" className="font-semibold text-slate-300 hover:text-white">
          {DEVELOPER_NAME}
        </Link>
      </div>
    </footer>
  );
}
