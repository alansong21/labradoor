"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import "./login.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const [status, setStatus] = useState<string | null>(null);

  const getTitle = () => {
    if (role === "student") return "Student Login";
    if (role === "researcher") return "Researcher Login";
    return "Log In";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
      setStatus("Logged in!");
      window.location.href = "/researcher-myposts";
    } else {
      const body = await res.json().catch(() => null);
      setStatus(body?.error ? JSON.stringify(body.error) : "Login failed.");
    }
  }

  return (
    <>
      <Navbar isLoggedIn={false} hideAuthButtons={true} />
      <div className="login-page">
        <div className="login-container">
          <h1 className="login-title">{getTitle()}</h1>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-wrapper">
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                className="login-input"
                required 
              />
            </div>
            
            <div className="input-wrapper">
              <input 
                type="password" 
                name="password" 
                placeholder="Password" 
                className="login-input"
                minLength={8} 
                required 
              />
            </div>
            
            <button type="submit" className="login-submit-button">
              Sign In
            </button>
          </form>

          {status && <p className="status-message">{status}</p>}
          
          <p className="signup-prompt">
            Don't have an account yet? <Link href="/signup" className="signup-link">Create Account</Link>
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
