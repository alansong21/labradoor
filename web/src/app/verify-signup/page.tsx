"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifySignupContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Token missing");
      return;
    }

    fetch("/api/auth/verify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (res.ok) return "Verification successful. You can now log in.";
        const body = await res.json().catch(() => null);
        return body?.error ?? "Verification failed.";
      })
      .then(setStatus)
      .catch(() => setStatus("Verification failed."));
  }, [params]);

  return (
    <main>
      <h1>{status}</h1>
    </main>
  );
}

export default function VerifySignupPage() {
  return (
    <Suspense fallback={<main><h1>Verifying…</h1></main>}>
      <VerifySignupContent />
    </Suspense>
  );
}
