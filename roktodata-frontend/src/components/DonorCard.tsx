import { CalendarDays, MapPin, Phone, PhoneCall } from "lucide-react";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import ComplaintButton from "@/components/ComplaintButton";
import type { Donor } from "@/lib/data";

export default function DonorCard({ donor }: { donor: Donor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-600">
          {donor.bloodGroup}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
          <MapPin className="h-3 w-3 text-red-500" />
          {donor.district}, {donor.upazila}
        </span>
      </div>

      <h3 className="mt-3 font-bold text-slate-900">{donor.fullName}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
        শেষ রক্তদান:{" "}
        <span className="font-semibold text-slate-700">{donor.lastDonationDate ?? "তথ্য নেই"}</span>
      </p>
      <AvailabilityBadge className="mt-2" />

      <div className="mt-4 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700">
          <Phone className="h-3.5 w-3.5 text-emerald-600" fill="currentColor" />
          {donor.phoneNumber}
        </span>
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <ComplaintButton donor={donor} />
          <a
            href={`tel:${donor.phoneNumber}`}
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
          >
            <PhoneCall className="h-3 w-3" />
            কল করুন
          </a>
        </div>
      </div>
    </div>
  );
}
