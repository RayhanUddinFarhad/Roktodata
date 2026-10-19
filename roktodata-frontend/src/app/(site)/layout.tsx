import type { ReactNode } from "react";
import ApiWarmup from "@/components/ApiWarmup";
import BecomeDonorButton from "@/components/BecomeDonorButton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Public pages share the navbar and footer; the admin panel has its own layout.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ApiWarmup />
      <Navbar />
      {children}
      <Footer />
      <BecomeDonorButton />
    </>
  );
}
