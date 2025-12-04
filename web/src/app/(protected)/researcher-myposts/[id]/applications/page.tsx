/**
 * Researcher Applications View
 * Displays all applications received for a specific post.
 * Shows applicant details and their responses to custom questions.
 */
"use client";
import React, { useEffect, useState, use } from "react";
import Navbar from "../../../../components/Navbar";
import { useUser } from "@/hooks/useUser";
import "./page.css";

type QuestionType = "LONG_TEXT" | "SHORT_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX";

interface AnswerPayload {
  id: number;
  type: QuestionType | string;
  body: {
    value: any;
  };
  question: {
    body?: {
      prompt?: string;
    } | null;
  };
}

interface Application {
  id: number;
  createdAt: string;
  status: string;
  student?: {
    user?: {
      name?: string | null;
      email: string;
      uclaId?: string | null;
    };
  };
  answers: AnswerPayload[];
}

export default function PostApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = () => {
    fetch(`/api/applications/post/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update the local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to update status" }));
        alert(error.error || "Failed to update application status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update application status");
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className="applications-page">
        <div className="container">
          <h1 className="page-title">Applications</h1>

          {loading ? (
            <div className="loading">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>No applications received yet.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => {
                const applicant = app.student?.user;

                return (
                  <div key={app.id} className="application-card">
                    <div className="applicant-info">
                      <div className="applicant-header">
                        <div>
                          <h2>{applicant?.name || "Unknown Name"}</h2>
                          <p className="applicant-email">{applicant?.email ?? "No email"}</p>
                          {applicant?.uclaId && (
                            <p className="applicant-id">UID: {applicant.uclaId}</p>
                          )}
                          <p className="applied-date">
                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`status-badge status-${app.status.toLowerCase().replace("_", "-")}`}>
                          {app.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="responses-section">
                      <h3>Responses</h3>
                      {app.answers.length === 0 && (
                        <p className="empty-responses">No responses submitted.</p>
                      )}
                      {app.answers.map((answer) => {
                        const prompt =
                          answer.question?.body && typeof answer.question.body === "object"
                            ? answer.question.body.prompt ?? "Question"
                            : "Question";
                        const value = answer.body?.value;
                        let displayValue: string;
                        if (Array.isArray(value)) {
                          displayValue = value.length ? value.join(", ") : "No selections";
                        } else if (typeof value === "boolean") {
                          displayValue = value ? "Yes" : "No";
                        } else if (value === null || value === undefined || value === "") {
                          displayValue = "No response";
                        } else {
                          displayValue = String(value);
                        }
                        return (
                          <div key={answer.id} className="response-item">
                            <p className="question-text">{prompt}</p>
                            <p className="answer-text">{displayValue}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="actions-section">
                      <h3>Actions</h3>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleStatusUpdate(app.id, "UNDER_REVIEW")}
                          className={`action-btn ${app.status === "UNDER_REVIEW" ? "active" : ""}`}
                          disabled={app.status === "UNDER_REVIEW"}
                        >
                          Under Review
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, "ACCEPTED")}
                          className={`action-btn accept-btn ${app.status === "ACCEPTED" ? "active" : ""}`}
                          disabled={app.status === "ACCEPTED"}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                          className={`action-btn reject-btn ${app.status === "REJECTED" ? "active" : ""}`}
                          disabled={app.status === "REJECTED"}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
