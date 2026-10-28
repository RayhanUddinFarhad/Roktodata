import { MapPin, Quote } from "lucide-react";
import { formatLocation, type Feedback } from "@/lib/data";

const banglaDate = new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// One approved feedback: the words first, then who wrote it (name, area, as patient side or donor).
export default function FeedbackCard({ feedback, className = "" }: { feedback: Feedback; className?: string }) {
  const donor = feedback.role === "donor";
  return (
    <figure className={`relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <Quote className="absolute right-4 top-4 h-7 w-7 text-red-100" fill="currentColor" />
      <blockquote className="flex-1 whitespace-pre-line pr-6 text-[14px] leading-relaxed text-slate-700">{feedback.message}</blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
            donor ? "bg-gradient-to-br from-red-500 to-rose-700" : "bg-gradient-to-br from-indigo-500 to-indigo-800"
          }`}
        >
          {feedback.name.trim().charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-900">{feedback.name}</span>
          <span className="flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatLocation(feedback.district, feedback.upazila)}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span
            className={`block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              donor ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {feedback.roleLabel}
          </span>
          <span className="mt-1 block text-[10px] text-slate-400">{banglaDate.format(new Date(feedback.date))}</span>
        </span>
      </figcaption>
    </figure>
  );
}
