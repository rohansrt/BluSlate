"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/client";

/** Records a page view on every route change (docs/decisions/0011). Admin pages are skipped. */
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    track("page_view");
  }, [pathname]);
  return null;
}
