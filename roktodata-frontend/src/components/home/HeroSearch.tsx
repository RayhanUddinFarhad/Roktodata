"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import ThanaSelect from "@/components/ThanaSelect";
import { BLOOD_GROUPS, DISTRICTS } from "@/lib/data";

const selectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-red-500 focus:outline-none";
const labelClass = "mb-1 block text-[11px] text-slate-600";

// Home page search: blood group, district and (once a district is picked) thana, then the
// find-donor page with those filters. Empty choices are left out of the link.
export default function HeroSearch() {
  const router = useRouter();
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (bloodGroup) params.set("bloodGroup", bloodGroup);
    if (district) params.set("district", district);
    if (thana) params.set("upazila", thana);
    const query = params.toString();
    router.push(query ? `/find-donor?${query}` : "/find-donor");
  }

  return (
    <form
      id="search"
      onSubmit={submit}
      className="mx-auto mt-6 grid max-w-3xl scroll-mt-20 grid-cols-2 gap-3 rounded-lg bg-white p-4 text-left shadow-xl lg:grid-cols-4 lg:items-end"
    >
      <label className="block">
        <span className={labelClass}>রক্তের গ্রুপ</span>
        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={selectClass}>
          <option value="">সব গ্রুপ</option>
          {BLOOD_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>জেলা</span>
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setThana("");
          }}
          className={selectClass}
        >
          <option value="">সকল জেলা</option>
          {DISTRICTS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 block lg:col-span-1">
        <span className={labelClass}>থানা / উপজেলা</span>
        <ThanaSelect district={district} value={thana} onChange={setThana} emptyLabel="সকল থানা" className={selectClass} />
      </label>
      <button
        type="submit"
        className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-md bg-red-600 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 lg:col-span-1"
      >
        <Search className="h-4 w-4" />
        ডোনার খুঁজুন
      </button>
    </form>
  );
}
