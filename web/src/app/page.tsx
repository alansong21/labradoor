/**
 * Landing / Home Page
 * 
 * If logged in: Displays a list of available lab openings (Student view) or dashboard (Researcher view).
 * If logged out: Displays the landing page with role selection (Student vs Researcher).
 */
/* import Link from "next/link";
import Navbar from "./components/Navbar";
import "./landing.css";
import { cookies } from "next/headers";
import { getLabs } from "@/lib/labs";
import LabList from "./components/LabList";

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isLoggedIn = !!session;

  if (isLoggedIn) {
    const labs = await getLabs();
    
    // Fetch user data to determine role
    let userRole = null;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: `session=${session.value}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user?.researcher) {
          userRole = "RESEARCHER";
        } else if (data.user?.student) {
          userRole = "STUDENT";
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
    
    return <LabList labs={labs} userRole={userRole} />;
  }

  return (
    <>
      <Navbar isLoggedIn={false} />

              </p>
              <div className="role-actions">
                <Link href="/signup?role=student" className="role-button primary">
                  Join as Student
                </Link>
                <Link href="/login?role=student" className="role-button secondary">
                  Login
                </Link>
              </div>
            </div>

            <div className="role-card researcher-card">
              <h2>I am a Researcher</h2>
              <p>
                Post open positions, review applicants, and manage your lab page.
              </p>
              <div className="role-actions">
                <Link
                  href="/signup?role=researcher"
                  className="role-button primary"
                >
                  Join as Researcher
                </Link>
                <Link
                  href="/login?role=researcher"
                  className="role-button secondary"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
 */

import Link from "next/link";
import Navbar from "./components/Navbar";
import { cookies } from "next/headers";
import { getLabs } from "@/lib/labs";
import LabList from "./components/LabList";

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isLoggedIn = !!session;

  if (isLoggedIn && session?.value) {
    const labs = await getLabs();
    let userRole: "RESEARCHER" | "STUDENT" | null = null;

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        "http://localhost:4000";

      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: `session=${session.value}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user?.researcher) {
          userRole = "RESEARCHER";
        } else if (data.user?.student) {
          userRole = "STUDENT";
        }
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }

    return <LabList labs={labs} userRole={userRole} />;
  }

  return (
    <>
      <Navbar isLoggedIn={false} />

      <main className="min-h-screen">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 sm:pt-16">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Match UCLA students with{" "}
              <span className="text-[#2563eb]">research labs</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              A centralized platform where labs post standardized openings and
              students discover, filter, and apply in one place.
            </p>
          </div>

            {/* Role cards */}
          <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
            {/* Student card */}
            <div className="flex flex-col rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl shadow-lg shadow-slate-200/20 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/30 hover:bg-white/75 hover:border-white/60">
              <h2 className="text-lg font-semibold text-slate-900">
                I am a Student
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Browse open lab positions across UCLA, start applications, and
                track your status from one dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup?role=student"
                  className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1e40af]"
                >
                  Join as Student
                </Link>
                <Link
                  href="/login?role=student"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Researcher card */}
            <div className="flex flex-col rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl shadow-lg shadow-slate-200/20 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/30 hover:bg-white/75 hover:border-white/60">
              <h2 className="text-lg font-semibold text-slate-900">
                I am a Researcher
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Post openings, review applicants, and manage your lab&apos;s
                presence on campus in a single workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup?role=researcher"
                  className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1e40af]"
                >
                  Join as Researcher
                </Link>
                <Link
                  href="/login?role=researcher"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
