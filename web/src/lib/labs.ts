import "./labs.css"

// Use environment variable for API URL, with fallback
// In Docker: uses container name, locally: uses localhost
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: use internal Docker URL or localhost
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }
  // Client-side: use public URL (though this file is primarily server-side)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export async function getLabs() {
  try {
    const apiUrl = getApiUrl();
    // Optimize caching: use revalidate in production, no-store in development
    const cacheOption = process.env.NODE_ENV === 'production' 
      ? { next: { revalidate: 60 } } // Revalidate every 60 seconds in production
      : { cache: "no-store" as RequestCache }; // Always fresh in development
    
    const res = await fetch(`${apiUrl}/api/posts`, cacheOption);
    if (!res.ok) return [];

    const posts = await res.json();
    
    return posts.map((p: any) => ({
      id: p.id.toString(),
      name: p.title,
      desc: p.body,
      details: [`Posted by ${p.researcher?.user?.name || "Unknown"}`],
      tags: p.tags || [],
    }));
  } catch (error) {
    console.error("Failed to fetch labs:", error);
    return [];
  }
}

export async function getLab(id: string) {
  try {
    const apiUrl = getApiUrl();
    // Optimize caching: use revalidate in production, no-store in development
    const cacheOption = process.env.NODE_ENV === 'production'
      ? { next: { revalidate: 300 } } // Revalidate every 5 minutes in production
      : { cache: "no-store" as RequestCache }; // Always fresh in development
    
    const res = await fetch(`${apiUrl}/api/posts/${id}`, cacheOption);
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
