"use client";

import React from "react";
import Link from "next/link";
import "./page.css";

export default function LabPage({ params }: { params: { id: string } }) {
  const lab = {
    name: "Lab Name",
    tag: "CS",
    description: `
Yao coin is the premier fifo stack research group. We do research on money laundering. 
Northrop Grumman is seeking Artificial Intelligence (AI) / Physical AI doctorate students 
for an internship opportunity. This position will be located at our Space sector in Redondo Beach, 
CA with an alternative location of Sunnyvale, CA. Hybrid work schedule is available.

The qualified candidate will become part of Northrop Grumman’s Space Sector AI Integration Team.
    `,
    required: "Magnus Carlson",
    preferred: "Magnus Carlson",
  };

  return (
    <div className="container">
      <div className="content">
        <h1 className="lab-title">{lab.name}</h1>
        <div className="lab-tag">{lab.tag}</div>
        <section>
          <h2 className="section-title">Description:</h2>
          <p className="section-text">{lab.description.trim()}</p>
        </section>
        <section>
          <h2 className="section-title">Required Qualifications:</h2>
          <p className="section-text">{lab.required}</p>
          <h2 className="section-title">Preferred Qualifications:</h2>
          <p className="section-text">{lab.preferred}</p>
        </section>
        <Link href="/student_application/apply" className="lab-button">
          Apply
        </Link>
      </div>
    </div>
  );
}
