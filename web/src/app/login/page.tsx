/**
 * Login Page
 * Handles user authentication (Student & Researcher).
 * Redirects to appropriate dashboard upon success.
 */
"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import "./login.css";

type StatusState = { tone: "success" | "error"; message: string } | null;

const ROLE_COPY: Record<"student" | "researcher", { title: string; blurb: string }> = {
  student: {
    title: "Student login",
    blurb: "Access saved labs, applications, and personalized recommendations.",
  },
  researcher: {
    title: "Researcher login",
    blurb: "Manage posts, review applicants, and keep your lab profile current.",
  },
};

const ROLE_TOGGLE = [
  { label: "Student", value: "student" },
  { label: "Researcher", value: "researcher" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") || "student").toLowerCase() as "student" | "researcher";
  const [status, setStatus] = useState<StatusState>(null);

  const roleCopy = useMemo(() => ROLE_COPY[roleParam], [roleParam]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (res.ok) {
      setStatus({ tone: "success", message: "Logged in! Redirecting..." });
      if (roleParam === "researcher") {
        window.location.href = "/my-posts";
      } else {
        window.location.href = "/";
      }
    } else {
      const body = await res.json().catch(() => null);
      setStatus({
        tone: "error",
        message: body?.error ? JSON.stringify(body.error) : "Login failed.",
      });
    }
  }

  return (
    <>
      <Navbar isLoggedIn={false} hideAuthButtons={true} />
      <div className="auth-page">
        <div className="auth-card">
          <div className={`role-pill role-pill--${roleParam}`}>{roleCopy.title}</div>
          <div className="auth-card__intro">
            <h1>Welcome back.</h1>
            <p>{roleCopy.blurb}</p>
          </div>

          <div className="role-toggle" aria-label="Select role">
            <span
              className={`role-toggle__indicator role-toggle__indicator--${roleParam}`}
              aria-hidden="true"
            />
            {ROLE_TOGGLE.map(({ label, value }) => (
              <Link
                key={value}
                href={`/login?role=${value}`}
                className={`role-toggle__option ${value === roleParam ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span className="auth-label">UCLA email</span>
              <input type="email" name="email" className="auth-input" placeholder="you@ucla.edu" required />
            </label>

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                type="password"
                name="password"
                className="auth-input"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>

            <button type="submit" className="auth-button primary">
              Sign in
            </button>
          </form>

          {status && (
            <p className={`status-message status-${status.tone}`} role="status">
              {status.message}
            </p>
          )}

          <p className="auth-footer">
            Don&apos;t have an account yet?{" "}
            <Link href={`/signup?role=${roleParam}`} className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
