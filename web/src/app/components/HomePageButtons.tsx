"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Toast, { type ToastState } from "./Toast";

interface HomePageButtonsProps {
  role: "student" | "researcher";
}

export default function HomePageButtons({ role }: HomePageButtonsProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLinkClick = () => {
    setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
    setIsDismissing(false);
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/signup?role=${role}`}
          prefetch={true}
          className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium transition hover:bg-[#1e40af] btn-blue-glow"
          style={{ color: 'white' }}
          onClick={handleLinkClick}
        >
          Join as {role === "student" ? "Student" : "Researcher"}
        </Link>
        <Link
          href={`/login?role=${role}`}
          prefetch={true}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          onClick={handleLinkClick}
        >
          Login
        </Link>
      </div>
      <Toast
        toast={toast}
        isDismissing={isDismissing}
        onDismiss={() => setIsDismissing(true)}
        onAnimationEnd={() => {
          if (isDismissing) {
            setToast(null);
            setIsDismissing(false);
          }
        }}
      />
    </>
  );
}

