"use client";
import { useState } from "react";

export default function LoginPage() {
  const [status, setStatus] = useState<string | null>(null);

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
      window.location.href = "/";
    } else {
      const body = await res.json().catch(() => null);
      setStatus(body?.error ? JSON.stringify(body.error) : "Login failed.");
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="UCLA email" required />
        <input type="password" name="password" placeholder="Password" minLength={8} required />
        <button type="submit">Log in</button>
      </form>
      {status && <p>{status}</p>}
    </main>
  );
}
