/**
 * Login Page
 * Handles user authentication (Student & Researcher).
 * Redirects to appropriate dashboard upon success.
 */
"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import Toast, { type ToastState } from "../components/Toast";
import "./login.css";

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
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const roleCopy = useMemo(() => ROLE_COPY[roleParam], [roleParam]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasError(false);
    setIsLoading(true);
    setToast({ id: Date.now(), tone: "loading", message: "Signing in..." });

    const form = new FormData(e.currentTarget);

    try {
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
        setHasError(false);
        setToast({ id: Date.now(), tone: "success", message: "Redirecting..." });
        setTimeout(() => {
          if (roleParam === "researcher") {
            window.location.href = "/my-posts";
          } else {
            window.location.href = "/";
          }
        }, 500);
      } else {
        setHasError(true);
        const body = await res.json().catch(() => null);
        setToast({
          id: Date.now(),
          tone: "error",
          message: "Login invalid. Try again.",
        });
      }
    } catch (err) {
      setHasError(true);
      setToast({
        id: Date.now(),
        tone: "error",
        message: "Login invalid. Try again.",
      });
    } finally {
      setIsLoading(false);
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
                prefetch={true}
                className={`role-toggle__option ${value === roleParam ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className={`auth-field ${hasError ? "auth-field--error" : ""}`}>
              <span className="auth-label">UCLA email</span>
              <input
                type="email"
                name="email"
                className={`auth-input ${hasError ? "auth-input--error" : ""}`}
                placeholder="you@ucla.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (hasError) setHasError(false);
                }}
                required
              />
            </label>

            <label className={`auth-field ${hasError ? "auth-field--error" : ""}`}>
              <span className="auth-label">Password</span>
              <input
                type="password"
                name="password"
                className={`auth-input ${hasError ? "auth-input--error" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (hasError) setHasError(false);
                }}
                minLength={8}
                required
              />
            </label>

            {hasError && (
              <div className="auth-form-error">
                <span className="auth-form-error__icon">⚠</span>
                <span className="auth-form-error__text">Login invalid, try again</span>
              </div>
            )}

            <button type="submit" className="auth-button primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="auth-button-spinner" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

                  <p className="auth-footer">
            Don&apos;t have an account yet?{" "}
            <Link 
              href={`/signup?role=${roleParam}`} 
              prefetch={true} 
              className="auth-link"
              onClick={() => {
                setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
                setIsDismissing(false);
              }}
            >
              Create an account
            </Link>
          </p>
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
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading fullPage message="Loading login page..." />}>
      <LoginForm />
    </Suspense>
  );
}
