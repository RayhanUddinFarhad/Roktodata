import Link from "next/link";
import { cacheLife } from "next/cache";
import { Phone } from "lucide-react";
import LogoMark from "@/components/Logo";
import { HOTLINE } from "@/lib/data";

const QUICK_LINKS = [
  { href: "/", label: "হোম পেজ" },
  { href: "/find-donor", label: "ডোনার তালিকা" },
  { href: "/patient-search", label: "রোগীর জন্য সার্চ" },
  { href: "/blood-requests", label: "রক্তের অনুরোধসমূহ" },
  { href: "/register", label: "ডোনার রেজিস্ট্রেশন" },
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
          <h4 className="font-semibold text-white">দ্রুত লিংক</h4>
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
          <h4 className="font-semibold text-white">জরুরী হটলাইন</h4>
          <p className="mt-3 text-sm">রক্তের প্রয়োজনে যোগাযোগ করুন:</p>
          <a
            href={`tel:${HOTLINE.replace(/[\s-]/g, "")}`}
            className="mt-1 flex items-center gap-2 text-lg font-bold text-red-500"
          >
            <Phone className="h-5 w-5" fill="currentColor" />
            {HOTLINE}
          </a>
          <p className="mt-1 text-xs text-slate-500">২৪ ঘণ্টা সেবা চালু রয়েছে।</p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} রক্তদাতা (RoktoData)। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
