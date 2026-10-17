import { ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import type { ComplaintStatus, DonorStatus, FraudReportStatus, RequestStatus } from "@/lib/data";

const DONOR_STATUS: Record<DonorStatus, { label: string; tone: string }> = {
  Pending: { label: "অপেক্ষমাণ", tone: "bg-amber-100 text-amber-800" },
  Active: { label: "অনুমোদিত", tone: "bg-emerald-100 text-emerald-700" },
  Blocked: { label: "ব্লকড", tone: "bg-slate-200 text-slate-700" },
};

const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: string }> = {
  Open: { label: "খোলা", tone: "bg-red-100 text-red-700" },
  Resolved: { label: "সমাধান হয়েছে", tone: "bg-emerald-100 text-emerald-700" },
  Dismissed: { label: "বাতিল", tone: "bg-slate-200 text-slate-600" },
};

const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: string }> = {
  Pending: { label: "অপেক্ষমাণ", tone: "bg-amber-100 text-amber-800" },
  Approved: { label: "পোস্ট করা হয়েছে", tone: "bg-emerald-100 text-emerald-700" },
  Fulfilled: { label: "রক্ত পাওয়া গেছে", tone: "bg-blue-100 text-indigo-900" },
  Rejected: { label: "বাতিল", tone: "bg-slate-200 text-slate-600" },
};

export const REQUEST_STATUS_LABELS = Object.fromEntries(
  Object.entries(REQUEST_STATUS).map(([key, value]) => [key, value.label]),
) as Record<RequestStatus, string>;

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { label, tone } = REQUEST_STATUS[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

const FRAUD_STATUS: Record<FraudReportStatus, { label: string; tone: string }> = {
  Pending: { label: "অপেক্ষমাণ", tone: "bg-amber-100 text-amber-800" },
  Approved: { label: "তালিকাভুক্ত", tone: "bg-red-100 text-red-700" },
  Rejected: { label: "বাতিল", tone: "bg-slate-200 text-slate-600" },
};

export const FRAUD_STATUS_LABELS = Object.fromEntries(
  Object.entries(FRAUD_STATUS).map(([key, value]) => [key, value.label]),
) as Record<FraudReportStatus, string>;

export function FraudStatusBadge({ status }: { status: FraudReportStatus }) {
  const { label, tone } = FRAUD_STATUS[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

export const DONOR_STATUS_LABELS = Object.fromEntries(
  Object.entries(DONOR_STATUS).map(([key, value]) => [key, value.label]),
) as Record<DonorStatus, string>;

export const COMPLAINT_STATUS_LABELS = Object.fromEntries(
  Object.entries(COMPLAINT_STATUS).map(([key, value]) => [key, value.label]),
) as Record<ComplaintStatus, string>;

export function DonorStatusBadge({ status }: { status: DonorStatus }) {
  const { label, tone } = DONOR_STATUS[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const { label, tone } = COMPLAINT_STATUS[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{label}</span>;
}

// "2026-10-17T11:14:45.810Z" -> "2026-10-17"
export const formatDate = (iso: string) => iso.slice(0, 10);

const BUTTON_TONES = {
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  red: "bg-red-600 text-white hover:bg-red-700",
  outlineRed: "border border-red-200 text-red-600 hover:bg-red-50",
  gray: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

export function ActionButton({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: keyof typeof BUTTON_TONES;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${BUTTON_TONES[tone]}`}
    >
      {children}
    </button>
  );
}

export function ListState({ loading, empty, emptyText }: { loading: boolean; empty: boolean; emptyText: string }) {
  if (loading && empty) {
    return (
      <div className="flex justify-center rounded-xl border border-slate-200 bg-white py-14">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">
        <Inbox className="h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm">{emptyText}</p>
      </div>
    );
  }
  return null;
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-600">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="আগের পাতা"
        className="rounded-md border border-slate-300 bg-white p-1.5 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      পাতা {page} / {pages}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="পরের পাতা"
        className="rounded-md border border-slate-300 bg-white p-1.5 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
