import Link from "next/link";
import { getLabs } from "@/lib/labs";
import Navbar from "./components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "./landing.css";

interface Lab {
  id: string;
  name: string;
  desc: string;
  details: string[];
}

export default async function Page() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isLoggedIn = !!session;

  if (isLoggedIn) {
    const labs: Lab[] = await getLabs();
    return (
      <>
        <Navbar isLoggedIn={true} />
        <main className="lab-page">
          <h1 className="title">Lab Openings</h1>
          <div className="card-container">
            {labs.map((lab: Lab) => (
              <div key={lab.id} className="lab-card">
                <h2 className="lab-name">{lab.name}</h2>
                <p className="lab-desc">{lab.desc}</p>
                <ul className="lab-details">
                  {lab.details.map((line: string) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <Link href={`/labs/${lab.id}`} className="learn-more">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </main>
      </>
    );
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
              <p>Find research labs, apply for positions, and track your applications.</p>
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
              <p>Post open positions, review applicants, and manage your lab page.</p>
              <div className="role-actions">
                <Link href="/signup?role=researcher" className="role-button primary">
                  Join as Researcher
                </Link>
                <Link href="/login?role=researcher" className="role-button secondary">
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
