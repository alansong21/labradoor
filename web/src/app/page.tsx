"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: number; name?: string | null; email: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  return (
    <main>
      <h1>Labradoor</h1>
      {user ? (
        <>
          <p>Welcome, {user.name ?? user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link href="/signup">Sign up</Link>
          <Link href="/login">Login</Link>
        </>
      )}
    </main>
  );
}
