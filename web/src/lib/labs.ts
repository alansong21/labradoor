import "./labs.css"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function getLabs() {
  try {
    // Note: In a server component, we can fetch directly from the container URL if needed,
    // but for simplicity and consistency with client-side, we'll use the public URL or internal docker network.
    // Since this runs on the server (Next.js), we should use the internal docker name if possible,
    // OR use the absolute URL.
    // However, Next.js rewrites in next.config.ts handle /api -> http://server:4000/api
    // But `fetch` in Server Components needs an absolute URL.

    // For Server Components running in Docker, 'http://server:4000' is the internal URL.
    const res = await fetch("http://server:4000/api/posts", { cache: "no-store" });
    if (!res.ok) return [];

    const posts = await res.json();
    // Map backend 'Post' to frontend 'Lab' structure if needed, or just return posts.
    // The frontend expects: { id, name, desc, details[] }
    // Backend returns: { id, title, content, author: { name } }

    return posts.map((p: any) => ({
      id: p.id.toString(),
      name: p.title,
      desc: p.body,
      details: [`Posted by ${p.researcher?.user?.name || "Unknown"}`], // We can add more details if we want
      tags: p.tags || [],
    }));
  } catch (error) {
    console.error("Failed to fetch labs:", error);
    return [];
  }
}

export async function getLab(id: string) {
  try {
    const res = await fetch(`http://server:4000/api/posts/${id}`, { cache: "no-store" });
    if (!res.ok) return null;

    const p = await res.json();
    return {
      id: p.id.toString(),
      name: p.title,
      desc: p.body,
      details: [`Posted by ${p.researcher?.user?.name || "Unknown"}`],
      questions: p.questions,
      tags: p.tags || [],
    };
  } catch (error) {
    console.error("Failed to fetch lab:", error);
    return null;
  }
}
