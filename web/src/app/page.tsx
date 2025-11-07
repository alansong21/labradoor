"use client";
import React from "react";
import "./page.css";

export default function Page() {
  const labs = [
    {
      name: "Yaocoin",
      desc: "World's premier first in first out research group",
      details: [
        "Must be special",
        "Looking for EE/ECE/CS students",
        "who have taken CS 9000",
        "At least plat in Valorant",
      ],
    },
    {
      name: "ByteLabs",
      desc: "Innovating low-level compute systems for next-gen AI hardware",
      details: [
        "Strong in embedded systems",
        "Experience with Verilog or FPGA",
        "Collaborative research focus",
        "ECE majors preferred",
      ],
    },
    {
      name: "NeuroDrive",
      desc: "Research group on perception and navigation for autonomous systems",
      details: [
        "Experience with ROS or OpenCV",
        "Interested in robotics research",
        "Comfortable with Python/C++",
        "Enjoys hardware integration",
      ],
    },
    {
      name: "PhotonAI",
      desc: "Merging optics and machine learning for new vision architectures",
      details: [
        "Interest in ML + EE intersection",
        "Experience with PyTorch/TensorFlow",
        "Exposure to signal processing",
        "Creative, interdisciplinary mindset",
      ],
    },
  ];

  return (
    <main className="lab-page">
      <h1 className="title">Lab Openings</h1>
      <p className="subtitle">Unleash Your True Potential</p>

      <div className="card-container">
        {labs.map((lab, idx) => (
          <div key={idx} className="lab-card">
            <div className="avatar" />
            <h2 className="lab-name">{lab.name}</h2>
            <p className="lab-desc">{lab.desc}</p>

            <ul className="lab-details">
              {lab.details.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <button className="learn-more">Learn More</button>
          </div>
        ))}
      </div>
    </main>
  );
}
