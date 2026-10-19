// Every donor shown publicly is ready to donate (the API filters out the rest).
export default function AvailabilityBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ${className}`}>
      ● রক্ত দিতে প্রস্তুত
    </span>
  );
}
