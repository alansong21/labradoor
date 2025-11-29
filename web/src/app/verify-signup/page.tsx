"use client";
import "./page.css";

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
  <main className="verify-container">
    <div className="verify-card">
      {status === "Verifying..." && (
        <>
          <div className="spinner" />
          <h1 className="verify-title">Verifying your account…</h1>
          <p className="verify-text">Please wait a moment.</p>
        </>
      )}

      {status.includes("successful") && (
        <>
          <div className="verify-icon success">✔</div>
          <h1 className="verify-title success">Email Verified!</h1>
          <p className="verify-text">You can now log in to your account.</p>

          <a href="/login" className="verify-button success">
            Go to Login
          </a>
        </>
      )}

      {status !== "Verifying..." && !status.includes("successful") && (
        <>
          <div className="verify-icon error">✖</div>
          <h1 className="verify-title error">Verification Failed</h1>
          <p className="verify-text">{status}</p>

          <a href="/" className="verify-button error">
            Return Home
          </a>
        </>
      )}
    </div>
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
