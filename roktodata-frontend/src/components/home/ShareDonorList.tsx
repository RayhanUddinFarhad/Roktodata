import { Mail, ShieldCheck, Users } from "lucide-react";
import CopyEmailButton from "@/components/home/CopyEmailButton";
import { CONTACT_EMAIL } from "@/lib/data";

const MAIL_SUBJECT = "ডোনার তালিকা পাঠাচ্ছি";


export default function ShareDonorList() {
  return (
    <section className="bg-white px-4 py-14">
      <div className="mx-auto max-w-[808px] overflow-hidden rounded-2xl bg-linear-to-r from-[#1e2a5e] via-[#15172b] to-[#7f1d1d] text-white shadow-xl">
        <div className="grid gap-8 p-7 sm:p-9 md:grid-cols-[1fr_15rem] md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-red-100">
              <Users className="h-3.5 w-3.5" />
              ক্লাব, সংগঠন ও স্বেচ্ছাসেবীদের জন্য
            </span>
            <h2 className="mt-3 text-2xl font-bold leading-snug">আপনার কাছে থাকা ডোনার তালিকা আমাদের পাঠান</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              আপনার এলাকা, ক্লাব বা সংগঠনের রক্তদাতাদের তালিকা ইমেইল করুন। আমরা যাচাই করে তাঁদের এই নেটওয়ার্কে যুক্ত
              করব, যাতে জরুরি মুহূর্তে আরও বেশি মানুষ রক্ত পান।
            </p>

            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              নাম, মোবাইল, রক্তের গ্রুপ আর জেলা-থানা থাকলেই চলবে (Excel, Word বা PDF)। ডোনারদের সম্মতি নিয়ে পাঠাবেন।
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 text-center text-slate-900">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Mail className="h-6 w-6" />
            </span>
            <p className="mt-3 text-xs text-slate-500">ইমেইল করুন</p>
            <p className="break-all font-semibold text-slate-900">{CONTACT_EMAIL}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}`}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
            >
              <Mail className="h-4 w-4" />
              ইমেইল পাঠান
            </a>
            <CopyEmailButton email={CONTACT_EMAIL} />
          </div>
        </div>
      </div>
    </section>
  );
}
