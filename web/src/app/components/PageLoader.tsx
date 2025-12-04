"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loading from "./Loading";

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => {
      // Small delay to ensure smooth transition
      setTimeout(() => setLoading(false), 100);
    };

    // Listen to route changes
    handleStart();
    handleComplete();

    return () => {
      setLoading(false);
    };
  }, [pathname]);

  if (!loading) return null;

  return <Loading fullPage message="Loading page..." />;
}

