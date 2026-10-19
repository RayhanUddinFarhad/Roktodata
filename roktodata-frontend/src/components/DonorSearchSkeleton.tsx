// Grey placeholders the size of the donor search (filter box, results heading, cards), shown before
// it loads so the footer doesn't jump down when the real content arrives. Heights match the real
// components at each breakpoint.
export function DonorCardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[232px] animate-pulse rounded-xl border border-slate-200 bg-white p-4 sm:h-[269px]">
          <div className="flex justify-between">
            <div className="h-7 w-12 rounded-md bg-slate-100" />
            <div className="h-5 w-24 rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 h-5 w-32 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
          <div className="mt-3 h-5 w-24 rounded-full bg-slate-100" />
          <div className="mt-8 h-8 w-full rounded-md bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function DonorSearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="রক্তদাতার তালিকা লোড হচ্ছে">
      <div className="h-[344px] animate-pulse rounded-xl border border-slate-200 bg-white sm:h-[219px] lg:h-[147px]" />
      <div className="mt-8 h-6 w-48 rounded bg-slate-200/70" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-slate-200/50" />
      <DonorCardSkeletons />
    </div>
  );
}
