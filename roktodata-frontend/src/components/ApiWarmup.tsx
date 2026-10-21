"use client";

import { useEffect } from "react";
import { preconnect } from "react-dom";
import { API_URL, warmUpApi } from "@/lib/api";

// Wakes the API as soon as any public page opens, so a search a few seconds later doesn't
// have to wait for the sleeping free-tier server to start. Also opens the connection to the API
// early (a preconnect hint in the page head). Renders nothing.
export default function ApiWarmup() {
  preconnect(API_URL, { crossOrigin: "anonymous" });
  useEffect(() => {
    warmUpApi();
  }, []);
  return null;
}
