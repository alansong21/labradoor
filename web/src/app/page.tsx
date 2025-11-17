import Link from "next/link";
import { getLabs } from "@/lib/labs";
import Navbar from "./components/Navbar";

export default async function Page() {
  const labs = await getLabs();

  return (
    <>
      <Navbar />

      <main className="lab-page">
        <h1 className="title">Lab Openings</h1>
        ...
        <div className="card-container">
          {labs.map((lab) => (
            <div key={lab.id} className="lab-card">
              <h2 className="lab-name">{lab.name}</h2>
              <p className="lab-desc">{lab.desc}</p>

              <ul className="lab-details">
                {lab.details.map((line) => (
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
