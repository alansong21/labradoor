"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { usePathname } from "next/navigation";
import Loading from "./Loading";

export default function PageLoader() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // On initial mount, don't show loading
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }

    // Detect route changes
    if (prevPathRef.current !== pathname) {
      setIsLoading(true);
      prevPathRef.current = pathname;
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Hide loading after page has time to render
      timeoutRef.current = setTimeout(() => {
        startTransition(() => {
          setIsLoading(false);
        });
      }, 250);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // Show loading during transitions or when explicitly loading
  if (isPending || isLoading) {
    return <Loading fullPage message="Loading page..." />;
  }

  return null;
}

