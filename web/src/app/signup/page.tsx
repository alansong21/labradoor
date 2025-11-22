"use client";
import { useState } from "react";
import Link from "next/link";
import "./signup.css";

export default function SignupPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (res.ok) {
      setStatus("Check your inbox for verification email");
    } else {
      const body = await res.json().catch(() => null);
      setStatus(body?.error ? JSON.stringify(body.error) : "Signup failed.");
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1 className="signup-title">Sign Up</h1>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-wrapper">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="signup-input"
              required
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="signup-input"
              minLength={8}
              required
            />
          </div>

          <div className="input-wrapper">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="signup-input"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="signup-submit-button">
            Sign Up
          </button>
        </form>

        {status && <p className="status-message">{status}</p>}

        <p className="login-prompt">
          Already have an account?{" "}
          <Link href="/login" className="login-link">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
