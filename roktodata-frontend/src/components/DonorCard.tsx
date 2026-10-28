"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, EyeOff, MapPin, Phone, PhoneCall } from "lucide-react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import ComplaintButton from "@/components/ComplaintButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import { trackDonorContact } from "@/lib/api";
import { guardContact } from "@/lib/contactPledge";
import { type Donor, donorWhatsAppMessage, formatLocation, NOT_MENTIONED } from "@/lib/data";

// The update page with this donor's public details filled in and "not ready" chosen, for a donor
// who finds themselves in the list but can't donate now (they still verify the number by SMS).
function hideLink(donor: Donor) {
  const params = new URLSearchParams({ phone: donor.phoneNumber, group: donor.bloodGroup, district: donor.district, hide: "1" });
  if (donor.fullName !== "নাম উল্লেখ নেই") params.set("name", donor.fullName);
  if (donor.upazila) params.set("thana", donor.upazila);
  return `/register?${params}`;
}

export default function DonorCard({ donor }: { donor: Donor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700">
          {donor.bloodGroup}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          <MapPin className="h-3 w-3 text-red-500" />
          {formatLocation(donor.district, donor.upazila)}
        </span>
      </div>

      <h3 className="mt-3 font-bold text-slate-900">{donor.fullName}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
        শেষ রক্তদান:{" "}
        <span className="font-semibold text-slate-700">{donor.lastDonationDate ?? NOT_MENTIONED}</span>
      </p>
      <AvailabilityBadge className="mt-2" />

      <div className="mt-4 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
          <Phone className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" />
          {donor.phoneNumber}
        </span>
        <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
          <ComplaintButton donor={donor} />
          <WhatsAppButton
            phone={donor.phoneNumber}
            message={donorWhatsAppMessage(donor.bloodGroup)}
            onClick={(e) => guardContact(e, "whatsapp", () => trackDonorContact(donor.id, "whatsapp"))}
          />
          <a
            href={`tel:${donor.phoneNumber}`}
            onClick={(e) => guardContact(e, "call", () => trackDonorContact(donor.id, "call"))}
            className="flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <PhoneCall className="h-3 w-3" />
            কল করুন
          </a>
        </div>
        <Link
          href={hideLink(donor)}
          prefetch={false}
          className="group mt-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-2 text-[11px] leading-snug text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
        >
          <EyeOff className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
          <span className="flex-1">
            এটি আপনার নাম্বার? রক্ত দিতে না চাইলে{" "}
            <span className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 group-hover:decoration-indigo-700">
              সাময়িকভাবে লুকান
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
