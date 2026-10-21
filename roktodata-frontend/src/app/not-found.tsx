import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = { title: "পাতাটি পাওয়া যায়নি | রক্তদাতা" };

// Any address the site doesn't have. It sits outside the (site) layout, so it adds the navbar
// and footer itself.
export default function NotFound() {
  return (
    <>
      <Navbar />
      <NotFoundContent />
      <Footer />
    </>
  );
}
