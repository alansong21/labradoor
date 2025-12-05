import { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "./components/Loading";
import { cookies } from "next/headers";
import { getLabs } from "@/lib/labs";
import HomePageButtons from "./components/HomePageButtons";

// Lazy load components - reduce initial bundle size
const Navbar = dynamic(() => import("./components/Navbar"), {
  ssr: true, // Navbar is above the fold, keep SSR
});

// Lazy load LabList component - only loads when user is logged in
const LabList = dynamic(() => import("./components/LabList"), {
  loading: () => <Loading fullPage />,
  ssr: true, // Enable SSR for better initial load
});

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isLoggedIn = !!session;

  if (isLoggedIn && session?.value) {
    // Parallel fetch for better performance
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:4000";

    // Parallel fetch with optimized caching
    const cacheOption = process.env.NODE_ENV === 'production' 
      ? { next: { revalidate: 300 } } // Revalidate every 5 minutes in production
      : { cache: "no-store" as RequestCache }; // Always fresh in development
    
    const [labs, userData] = await Promise.allSettled([
      getLabs(),
      fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: `session=${session.value}`,
        },
        ...cacheOption,
      }).then((res) => (res.ok ? res.json() : null)).catch(() => null),
    ]);

    let userRole: "RESEARCHER" | "STUDENT" | null = null;
    const labsData = labs.status === "fulfilled" ? labs.value : [];

    if (userData.status === "fulfilled" && userData.value) {
      const data = userData.value;
      if (data.user?.researcher) {
        userRole = "RESEARCHER";
      } else if (data.user?.student) {
        userRole = "STUDENT";
      }
    }

    return (
      <Suspense fallback={<Loading fullPage />}>
        <LabList labs={labsData} userRole={userRole} />
      </Suspense>
    );
  }

  return (
    <>
      <Navbar isLoggedIn={false} />

      <main className="min-h-screen">
        <section className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 sm:pt-16">
          <div className="hero-glow" />
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Match UCLA students with{" "}
              <span className="gradient-text">research labs</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              A centralized platform where labs post standardized openings and
              students discover, filter, and apply in one place.
            </p>
          </div>

            {/* Role cards */}
          <div className="relative z-10 mt-10 grid w-full gap-6 sm:grid-cols-2">
            {/* Student card */}
            <div className="flex flex-col rounded-2xl border border-white/50 bg-white/65 backdrop-blur-xl shadow-lg shadow-slate-200/20 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/30 hover:bg-white/75 hover:border-white/60">
              <h2 className="text-lg font-semibold text-slate-900">
                I am a Student
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Browse open lab positions across UCLA, start applications, and
                track your status from one dashboard.
              </p>
              <HomePageButtons role="student" />
            </div>

            {/* Researcher card */}
            <div className="flex flex-col rounded-2xl border border-white/50 bg-white/65 backdrop-blur-xl shadow-lg shadow-slate-200/20 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/30 hover:bg-white/75 hover:border-white/60">
              <h2 className="text-lg font-semibold text-slate-900">
                I am a Researcher
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Post openings, review applicants, and manage your lab&apos;s
                presence on campus in a single workspace.
              </p>
              <HomePageButtons role="researcher" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
