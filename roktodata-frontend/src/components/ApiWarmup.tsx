"use client";

import { useEffect } from "react";
import { warmUpApi } from "@/lib/api";

// Wakes the API as soon as any public page opens, so a search a few seconds later doesn't
// have to wait for the sleeping free-tier server to start. Renders nothing.
export default function ApiWarmup() {
  useEffect(() => {
    warmUpApi();
  }, []);
  return null;
}
