import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "অ্যাডমিন প্যানেল | রক্তদাতা",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
