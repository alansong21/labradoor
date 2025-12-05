"use client";

import dynamic from "next/dynamic";

// Client component wrapper to enable ssr: false for PageLoader
const PageLoader = dynamic(() => import("./PageLoader"), {
  ssr: false, // Client-only component
});

export default function PageLoaderWrapper() {
  return <PageLoader />;
}

