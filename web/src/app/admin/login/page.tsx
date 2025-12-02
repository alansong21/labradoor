"use client";
import { useState } from "react";
import Link from "next/link";
import "../../login/login.css";

export default function AdminLoginPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

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
      setStatus("Logged in!");
      window.location.href = "/admin/dashboard";
    } else {
      const body = await res.json().catch(() => null);
      setStatus(body?.error ? JSON.stringify(body.error) : "Login failed.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Admin Login</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-wrapper">
            <input 
              type="email" 
              name="email" 
              placeholder="Admin Email" 
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
            Sign In as Admin
          </button>
        </form>

        {status && <p className="status-message">{status}</p>}
        
        <p className="signup-prompt">
          <Link href="/login" className="signup-link">← Back to regular login</Link>
        </p>
      </div>
    </div>
  );
}
