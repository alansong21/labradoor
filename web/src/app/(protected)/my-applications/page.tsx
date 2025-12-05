/**
 * My Applications Page
 * Displays all applications submitted by the current student.
 * Shows application status and links to view details.
 */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useUser } from "@/hooks/useUsers";
import "./page.css";

interface Question {
  id: number;
  type: string;
  body: {
    prompt?: string;
    description?: string;
    options?: string[];
  };
}

interface Application {
  id: number;
  createdAt: string;
  status: string;
  post: {
    id: number;
    title: string;
    summary?: string | null;
    questions?: Question[];
  };
  answers: Array<{
    id: number;
    type: string;
    body: {
      value: any;
    };
    question?: Question;
    questionId: number;
  }>;
}

export default function MyApplicationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApplications, setExpandedApplications] = useState<Set<number>>(new Set());

  // Redirect researchers to my-posts
  useEffect(() => {
    if (!userLoading && user?.researcher) {
      router.push("/my-posts");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    // Don't fetch if user is a researcher (will be redirected)
    if (userLoading || user?.researcher) {
      return;
    }

    fetch("/api/applications/my-applications")
      .then((res) => {
        if (res.status === 204) {
          // No content - student has no applications
          return [];
        }
        if (!res.ok) {
          throw new Error("Failed to fetch applications");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user, userLoading]);

  // Don't render if user is a researcher (will be redirected)
  if (userLoading || user?.researcher) {
    return null;
  }

  const toggleApplication = (appId: number) => {
    setExpandedApplications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const formatAnswerValue = (answer: Application["answers"][0]): string => {
    const value = answer.body?.value;
    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "No selections";
    } else if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    } else if (value === null || value === undefined || value === "") {
      return "No response";
    } else {
      return String(value);
    }
  };

  const getQuestionPrompt = (answer: Application["answers"][0]): string => {
    if (answer.question?.body && typeof answer.question.body === "object") {
      return answer.question.body.prompt ?? "Question";
    }
    return "Question";
  };

  return (
    <>
      <Navbar isLoggedIn={!userLoading && !!user} role={user?.researcher ? "RESEARCHER" : "STUDENT"} />
      <div className="applications-page">
        <div className="container">
          <h1 className="page-title">My Applications</h1>

          {loading ? (
            <div className="loading">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>You haven't submitted any applications yet.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => {
                const isExpanded = expandedApplications.has(app.id);
                const hasAnswers = app.answers && app.answers.length > 0;
                
                return (
                  <div key={app.id} className="application-card">
                    <div className="application-header">
                      <h2>{app.post.title}</h2>
                      <span className={`status-badge status-${app.status.toLowerCase().replace("_", "-")}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    {app.post.summary && (
                      <p className="post-summary">{app.post.summary}</p>
                    )}
                    <div className="application-meta">
                      <p className="applied-date">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        {hasAnswers && (
                          <button
                            onClick={() => toggleApplication(app.id)}
                            className="view-questions-btn"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "Hide" : "View"} My Responses
                            <span className={`dropdown-arrow ${isExpanded ? "expanded" : ""}`}>
                              ▼
                            </span>
                          </button>
                        )}
                        <a href={`/labs/${app.post.id}`} className="view-post-link">
                          View Post →
                        </a>
                      </div>
                    </div>
                    {isExpanded && hasAnswers && (
                      <div className="responses-section">
                        {app.answers.map((answer) => {
                          const prompt = getQuestionPrompt(answer);
                          const displayValue = formatAnswerValue(answer);
                          return (
                            <div key={answer.id} className="qa-item">
                              <p className="question-text">{prompt}</p>
                              <p className="answer-text">{displayValue}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

