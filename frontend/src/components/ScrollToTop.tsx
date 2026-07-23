"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Force scroll position to the top of the page on route change
      window.scrollTo(0, 0);
    }
  }, [pathname, searchParams]);

  return null;
}
