/**
 * Signup Page
 * Handles new user registration.
 * Supports both Student and Researcher roles based on query param.
 * Sends verification email upon success.
 */
"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import Toast, { type ToastState } from "../components/Toast";
import "./signup.css";

const ROLE_COPY: Record<
  "student" | "researcher",
  { title: string; blurb: string; helper: string }
> = {
  student: {
    title: "Student signup",
    blurb: "Create an account to discover labs, build your profile, and track applications.",
    helper: "Use your UCLA email so labs know you’re part of the community.",
  },
  researcher: {
    title: "Researcher signup",
    blurb: "Publish openings, manage applicants, and keep your lab presence up to date.",
    helper: "Use your UCLA email so applicants can trust your lab is verified.",
  },
};

const ROLE_TOGGLE = [
  { label: "Student", value: "student" },
  { label: "Researcher", value: "researcher" },
];

function SignupForm() {
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") || "student").toLowerCase() as "student" | "researcher";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    uclaId: "",
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);

  const roleCopy = useMemo(() => ROLE_COPY[roleParam], [roleParam]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (hasError) {
      setHasError(false);
      setErrorField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);
    setErrorField(null);

    if (formData.password !== formData.confirmPassword) {
      setHasError(true);
      setErrorField("confirmPassword");
      setToast({
        id: Date.now(),
        tone: "error",
        message: "Passwords do not match.",
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setToast({ id: Date.now(), tone: "loading", message: "Creating account..." });

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          uclaId: formData.uclaId || undefined,
          role: roleParam.toUpperCase(),
        }),
      });

      if (res.ok) {
        setHasError(false);
        setToast({
          id: Date.now(),
          tone: "success",
          message: "Account created! Check your UCLA inbox for the verification email.",
        });
      } else {
        setHasError(true);
        const body = await res.json().catch(() => null);
        let errorMsg = "Signup failed. Please try again.";
        
        if (body?.error) {
          const error = body.error;
          // Handle different error formats
          if (typeof error === "string") {
            errorMsg = error;
          } else if (typeof error === "object") {
            // Handle validation errors from zod or similar
            if (error.email) {
              errorMsg = error.email.includes("ucla") || error.email.includes("UCLA") 
                ? "Invalid UCLA email. Use your @ucla.edu or @g.ucla.edu address."
                : "Invalid email format.";
            } else if (error.password) {
              if (error.password.includes("8") || error.password.includes("length")) {
                errorMsg = "Password must be at least 8 characters.";
              } else {
                errorMsg = error.password;
              }
            } else if (error.uclaId) {
              errorMsg = "Invalid UCLA ID. Must be 9 digits.";
            } else if (error.name) {
              errorMsg = "Please enter your full name.";
            } else {
              // Try to extract first error message
              const firstError = Object.values(error)[0];
              errorMsg = typeof firstError === "string" ? firstError : errorMsg;
            }
          }
          
          // Clean up common error messages
          if (errorMsg.toLowerCase().includes("email") && errorMsg.toLowerCase().includes("ucla")) {
            errorMsg = "Invalid UCLA email. Use your @ucla.edu or @g.ucla.edu address.";
          } else if (errorMsg.toLowerCase().includes("password") && (errorMsg.toLowerCase().includes("8") || errorMsg.toLowerCase().includes("length"))) {
            errorMsg = "Password must be at least 8 characters.";
          } else if (errorMsg.toLowerCase().includes("already exists") || errorMsg.toLowerCase().includes("taken")) {
            errorMsg = "An account with this email already exists.";
          }
        }
        
        setToast({
          id: Date.now(),
          tone: "error",
          message: errorMsg,
        });
      }
    } catch (err) {
      setHasError(true);
      setToast({
        id: Date.now(),
        tone: "error",
        message: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar isLoggedIn={false} hideAuthButtons={true} />
      <div className="auth-page">
        <div className="auth-card">
          <div className={`role-pill role-pill--${roleParam}`}>{roleCopy.title}</div>
          <div className="auth-card__intro">
            <h1>Join Labradoor.</h1>
            <p>{roleCopy.blurb}</p>
          </div>
          <p className="auth-helper">{roleCopy.helper}</p>

          <div className="role-toggle" aria-label="Select role">
            <span
              className={`role-toggle__indicator role-toggle__indicator--${roleParam}`}
              aria-hidden="true"
            />
            {ROLE_TOGGLE.map(({ label, value }) => (
              <Link
                key={value}
                href={`/signup?role=${value}`}
                prefetch={true}
                className={`role-toggle__option ${value === roleParam ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className={`auth-field ${errorField === "name" ? "auth-field--error" : ""}`}>
              <span className="auth-label">Full name</span>
              <input
                type="text"
                name="name"
                placeholder="First Last"
                className={`auth-input ${errorField === "name" ? "auth-input--error" : ""}`}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errorField === "name" && hasError && (
                <div className="auth-field-error">
                  <span className="auth-field-error__icon">⚠</span>
                  <span className="auth-field-error__text">Please check this field</span>
                </div>
              )}
            </label>

            <label className={`auth-field ${errorField === "email" ? "auth-field--error" : ""}`}>
              <span className="auth-label">UCLA email</span>
              <input
                type="email"
                name="email"
                placeholder="you@ucla.edu"
                className={`auth-input ${errorField === "email" ? "auth-input--error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errorField === "email" && hasError && (
                <div className="auth-field-error">
                  <span className="auth-field-error__icon">⚠</span>
                  <span className="auth-field-error__text">Please check this field</span>
                </div>
              )}
            </label>

            {roleParam === "student" && (
              <label className={`auth-field ${errorField === "uclaId" ? "auth-field--error" : ""}`}>
                <span className="auth-label">UCLA ID (UID)</span>
                <input
                  type="text"
                  name="uclaId"
                  placeholder="000000000"
                  className={`auth-input ${errorField === "uclaId" ? "auth-input--error" : ""}`}
                  value={formData.uclaId}
                  onChange={handleChange}
                />
                {errorField === "uclaId" && hasError && (
                  <div className="auth-field-error">
                    <span className="auth-field-error__icon">⚠</span>
                    <span className="auth-field-error__text">Please check this field</span>
                  </div>
                )}
              </label>
            )}

            <label className={`auth-field ${errorField === "password" ? "auth-field--error" : ""}`}>
              <span className="auth-label">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Create at least 8 characters"
                className={`auth-input ${errorField === "password" ? "auth-input--error" : ""}`}
                value={formData.password}
                minLength={8}
                required
                onChange={handleChange}
              />
              {errorField === "password" && hasError && (
                <div className="auth-field-error">
                  <span className="auth-field-error__icon">⚠</span>
                  <span className="auth-field-error__text">Please check this field</span>
                </div>
              )}
            </label>

            <label className={`auth-field ${errorField === "confirmPassword" ? "auth-field--error" : ""}`}>
              <span className="auth-label">Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                className={`auth-input ${errorField === "confirmPassword" ? "auth-input--error" : ""}`}
                value={formData.confirmPassword}
                minLength={8}
                required
                onChange={handleChange}
              />
              {errorField === "confirmPassword" && hasError && (
                <div className="auth-field-error">
                  <span className="auth-field-error__icon">⚠</span>
                  <span className="auth-field-error__text">Passwords do not match</span>
                </div>
              )}
            </label>

            <button type="submit" className="auth-button primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="auth-button-spinner" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link href={`/login?role=${roleParam}`} prefetch={true} className="auth-link">
              Log in
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

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading fullPage message="Loading signup page..." />}>
      <SignupForm />
    </Suspense>
  );
}
