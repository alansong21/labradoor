/**
 * Signup Page
 * Handles new user registration.
 * Supports both Student and Researcher roles based on query param.
 * Sends verification email upon success.
 */
"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import "./signup.css";

function SignupForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "STUDENT";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    uclaId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
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
          role: role.toUpperCase(),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setError("Account created! Please check your inbox for the verification email.");
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.error ? JSON.stringify(body.error) : "Signup failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <>
      <Navbar user={null} hideAuthButtons={true} />
      <div className="signup-page">
        <div className="signup-container">
          <h1 className="signup-title">Sign Up ({role})</h1>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="input-wrapper">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="signup-input"
                onChange={handleChange}
              />
            </div>

            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                placeholder="UCLA Email"
                className="signup-input"
                required
                onChange={handleChange}
              />
            </div>

            {role === "STUDENT" && (
              <div className="input-wrapper">
                <input
                  type="text"
                  name="uclaId"
                  placeholder="UCLA ID (UID)"
                  className="signup-input"
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="input-wrapper">
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="signup-input"
                minLength={8}
                required
                onChange={handleChange}
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
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="signup-submit-button">
              Sign Up
            </button>
          </form>

          {error && <p className={`status-message ${success ? "success" : "error"}`}>{error}</p>}

          <p className="login-prompt">
            Already have an account?{" "}
            <Link href="/login" className="login-link">
              Log In
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
