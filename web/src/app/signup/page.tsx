/**
 * Signup Page
 * Handles new user registration.
 * Supports both Student and Researcher roles based on query param.
 * Sends verification email upon success.
 */
"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import "./signup.css";

type StatusState = { tone: "success" | "error"; message: string } | null;

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
  const [status, setStatus] = useState<StatusState>(null);

  const roleCopy = useMemo(() => ROLE_COPY[roleParam], [roleParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (formData.password !== formData.confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

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
        setStatus({
          tone: "success",
          message: "Account created! Check your UCLA inbox for the verification email.",
        });
      } else {
        const body = await res.json().catch(() => null);
        setStatus({
          tone: "error",
          message: body?.error ? JSON.stringify(body.error) : "Signup failed.",
        });
      }
    } catch (err) {
      setStatus({ tone: "error", message: "An unexpected error occurred." });
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
            {ROLE_TOGGLE.map(({ label, value }) => (
              <Link
                key={value}
                href={`/signup?role=${value}`}
                className={`role-toggle__option ${value === roleParam ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span className="auth-label">Full name</span>
              <input
                type="text"
                name="name"
                placeholder="First Last"
                className="auth-input"
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">UCLA email</span>
              <input
                type="email"
                name="email"
                placeholder="you@ucla.edu"
                className="auth-input"
                required
                onChange={handleChange}
              />
            </label>

            {roleParam === "student" && (
              <label className="auth-field">
                <span className="auth-label">UCLA ID (UID)</span>
                <input
                  type="text"
                  name="uclaId"
                  placeholder="000000000"
                  className="auth-input"
                  onChange={handleChange}
                />
              </label>
            )}

            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Create at least 8 characters"
                className="auth-input"
                minLength={8}
                required
                onChange={handleChange}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                className="auth-input"
                minLength={8}
                required
                onChange={handleChange}
              />
            </label>

            <button type="submit" className="auth-button primary">
              Create account
            </button>
          </form>

          {status && (
            <p className={`status-message status-${status.tone}`} role="status">
              {status.message}
            </p>
          )}

          <p className="auth-footer">
            Already have an account?{" "}
            <Link href={`/login?role=${roleParam}`} className="auth-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
