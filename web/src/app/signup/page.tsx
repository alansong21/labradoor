"use client";
import { useState } from "react";

export default function SignupPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

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
      setStatus("Check the server logs for your verification link.");
    } else {
      const body = await res.json().catch(() => null);
      setStatus(body?.error ? JSON.stringify(body.error) : "Signup failed.");
    }
  }

  return (
    <main>
      <h1>Student Signup</h1>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="UCLA email" required />
        <input name="password" type="password" placeholder="Password" minLength={8} required />
        <button type="submit">Sign up</button>
      </form>
      {status && <p>{status}</p>}
    </main>
  );
}
