"use client";

import { useState } from "react";
import type { AdminContext } from "@/components/admin/AdminDashboard";
import DonorsPanel from "@/components/admin/DonorsPanel";
import FraudReportsPanel from "@/components/admin/FraudReportsPanel";

// The public fraud list has two sources: users' fraud reports, and donors the admin blocked.
// This tab manages both.
export default function FraudTab({ ctx }: { ctx: AdminContext }) {
  const [view, setView] = useState<"reports" | "blocked">("reports");

  const views = [
    { id: "reports" as const, label: "ব্যবহারকারীদের রিপোর্ট" },
    { id: "blocked" as const, label: "ব্লক করা ডোনার" },
  ];

  return (
    <div>
      <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
              view === v.id ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "reports" ? <FraudReportsPanel ctx={ctx} /> : <DonorsPanel key="blocked" ctx={ctx} fixedStatus="Blocked" />}
    </div>
  );
}
