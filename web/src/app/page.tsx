"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<{message?: string}>({});

  useEffect(() => {
    fetch("/api/hello")
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Next.js + Express</h1>
      <p>API says: {data.message ?? "Loading..."}</p>
    </main>
  );
}
