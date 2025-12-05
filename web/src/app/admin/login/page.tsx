/**
 * Admin Login Page
 * Separate login flow for system administrators.
 * Uses a distinct admin session cookie.
 */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Toast, { type ToastState } from "../../components/Toast";
import "../../login/login.css";

export default function AdminLoginPage() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    setIsDismissing(false);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/admin/login", {
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
          window.location.href = "/admin/dashboard";
        }, 500);
      } else {
        setHasError(true);
        const body = await res.json().catch(() => null);
        setToast({
          id: Date.now(),
          tone: "error",
          message: body?.error ? (typeof body.error === "string" ? body.error : "Login failed") : "Login failed. Try again.",
        });
        setIsDismissing(false);
      }
    } catch (err) {
      setHasError(true);
      setToast({
        id: Date.now(),
        tone: "error",
        message: "Login failed. Try again.",
      });
      setIsDismissing(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Navbar isLoggedIn={false} hideAuthButtons={true} />
      <div className="auth-page">
        <div className="auth-card">
          <div className="role-pill role-pill--researcher">Admin Login</div>
          <div className="auth-card__intro">
            <h1>Admin Access</h1>
            <p>Sign in to manage researcher verifications and system administration.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className={`auth-field ${hasError ? "auth-field--error" : ""}`}>
              <span className="auth-label">Admin Email</span>
              <input
                type="email"
                name="email"
                className={`auth-input ${hasError ? "auth-input--error" : ""}`}
                placeholder="admin@ucla.edu"
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
                "Sign in as Admin"
              )}
            </button>
          </form>

          <p className="auth-footer">
            <Link 
              href="/login" 
              prefetch={true} 
              className="auth-link"
              onClick={() => {
                setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
                setIsDismissing(false);
              }}
            >
              ← Back to regular login
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
