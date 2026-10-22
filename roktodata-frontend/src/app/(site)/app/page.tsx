import type { Metadata } from "next";
import Image from "next/image";
import { RefreshCw, ShieldCheck, Smartphone, Zap, type LucideIcon } from "lucide-react";
import InstallApp from "@/components/InstallApp";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "অ্যাপ ডাউনলোড করুন | রক্তদাতা",
  description: "রক্তদাতা অ্যাপ ফোনে রাখুন: এক চাপে রক্তদাতা খুঁজুন। বিনামূল্যে, কয়েক সেকেন্ডে ইনস্টল, ফোনে প্রায় কোনো জায়গা নেয় না।",
  path: "/app",
});

const PERKS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Zap, title: "এক চাপে খুলুন", text: "জরুরি মুহূর্তে ব্রাউজারে ঠিকানা টাইপ করতে হবে না, হোম স্ক্রিন থেকেই খুলবে।" },
  { icon: Smartphone, title: "জায়গা নেয় না", text: "সাধারণ অ্যাপের মতো বড় ডাউনলোড নেই, ফোনের জায়গাও প্রায় লাগে না।" },
  { icon: RefreshCw, title: "সবসময় আপডেটেড", text: "আলাদা আপডেট দিতে হয় না, সবসময় সর্বশেষ ডোনার তালিকা দেখায়।" },
  { icon: ShieldCheck, title: "নিরাপদ", text: "অচেনা APK ফাইল নয়, সরাসরি আমাদের সাইট থেকে। ফোনের কোনো অনুমতি চায় না।" },
];

export default function AppPage() {
  return (
    <main className="flex-1 bg-slate-50">
      <section className="bg-linear-to-br from-red-600 to-indigo-900 px-4 pb-24 pt-12 text-center text-white">
        <Image src="/icons/icon-192.png" alt="" width={84} height={84} className="mx-auto rounded-full ring-4 ring-white/20" priority />
        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">রক্তদাতা অ্যাপ</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-red-50">
          জরুরি মুহূর্তে এক চাপেই রক্তদাতা খুঁজুন। বিনামূল্যে, কয়েক সেকেন্ডে ইনস্টল।
        </p>
      </section>

      <div className="mx-auto -mt-16 max-w-md px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <InstallApp />
        </div>
      </div>

      <section className="mx-auto grid max-w-3xl gap-3 px-4 py-10 sm:grid-cols-2">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
