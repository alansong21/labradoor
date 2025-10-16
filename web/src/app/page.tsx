"use client";
import { useEffect, useState } from "react";

type User = { id: number; name?: string | null; email: string };
type Post = {
  id: number;
  title: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  User?: User | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.json())
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>Posts</h1>
      {loading ? <p>Loading…</p> : posts.length === 0 ? <p>No posts yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map(p => (
            <li key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                by {p.User?.name ?? "Unknown"} · {new Date(p.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
