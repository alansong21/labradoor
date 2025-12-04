"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";

export interface Lab {
  id: string;
  name: string;
  desc: string;
  details: string[];
  tags?: string[];
}

interface Props {
  labs: Lab[];
}

export default function LabList({ labs }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labs;
    return labs.filter(
      (lab) =>
        lab.name.toLowerCase().includes(q) ||
        lab.desc.toLowerCase().includes(q)
    );
  }, [labs, query]);

  return (
    <>
      <Navbar isLoggedIn={true} />
      <main className="lab-page">
        <h1 className="title">Lab Openings</h1>
        <div className="lab-search">
          <input
            type="search"
            placeholder="Search by title or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="card-container">
          {filtered.map((lab) => (
            <div key={lab.id} className="lab-card">
              <h2 className="lab-name">{lab.name}</h2>
              <p className="lab-desc">{lab.desc}</p>
              {lab.tags && lab.tags.length > 0 && (
                <div className="lab-tags">
                  {lab.tags.map((tag) => (
                    <span key={tag} className="lab-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No labs matched your search.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
