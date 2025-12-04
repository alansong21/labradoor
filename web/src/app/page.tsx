/**
 * Landing / Home Page
 * 
 * If logged in: Displays a list of available lab openings (Student view) or dashboard (Researcher view).
 * If logged out: Displays the landing page with role selection (Student vs Researcher).
 */
import Link from "next/link";
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
      <main className="landing-page">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to Labradoor</h1>
          <p className="hero-subtitle">Connect with research opportunities at UCLA</p>

          <div className="role-selection-container">
            <div className="role-card student-card">
              <h2>I am a Student</h2>
              <p>
                Find research labs, apply for positions, and track your
                applications.
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
