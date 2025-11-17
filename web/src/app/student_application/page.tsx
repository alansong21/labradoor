"use client";
import React, { useState } from "react";
import "./page.css";

interface ApplicationSection {
  id: string;
  title: string;
  type: "text" | "textarea";
}

interface ApplyPageProps {
  customSections?: ApplicationSection[];
}

const ApplyPage: React.FC<ApplyPageProps> = ({ customSections = [] }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resume: null as File | null,
    customResponses: {} as Record<string, string>,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomResponse = (sectionId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customResponses: { ...prev.customResponses, [sectionId]: value },
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, resume: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const defaultSection: ApplicationSection = {
    id: "prompts",
    title: "Prompts (what ever tf you want as your sections):",
    type: "textarea",
  };

  const sections =
    customSections.length > 0 ? customSections : [defaultSection];

  return (
    <div className="apply-page">
      <div className="apply-container">
        <h1 className="page-title">Apply</h1>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="input-field">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="text-input"
              />
            </div>

            <div className="input-field">
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="text-input"
              />
            </div>

            <div className="input-field">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="text-input"
              />
            </div>

            <div className="input-field">
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          <div className="resume-section">
            <h2 className="section-heading">Resume</h2>
            <label className="upload-button">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="file-input"
              />
              <span>Upload</span>
            </label>
            {formData.resume && (
              <p className="file-name">{formData.resume.name}</p>
            )}
          </div>

          {sections.map((section) => (
            <div key={section.id} className="custom-section">
              <h2 className="section-heading">{section.title}</h2>
              {section.type === "textarea" ? (
                <textarea
                  placeholder="Type Here"
                  value={formData.customResponses[section.id] || ""}
                  onChange={(e) =>
                    handleCustomResponse(section.id, e.target.value)
                  }
                  className="textarea-input"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Type Here"
                  value={formData.customResponses[section.id] || ""}
                  onChange={(e) =>
                    handleCustomResponse(section.id, e.target.value)
                  }
                  className="text-input"
                />
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
};

export default ApplyPage;
