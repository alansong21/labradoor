"use client";
import React, { useEffect, useState, use } from "react";
import Navbar from "../../../../components/Navbar";
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [id]);

  return (
    <>
      <Navbar isLoggedIn={true} />
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
                      <h2>{applicant?.name || "Unknown Name"}</h2>
                      <p className="applicant-email">{applicant?.email ?? "No email"}</p>
                      {applicant?.uclaId && (
                        <p className="applicant-id">UID: {applicant.uclaId}</p>
                      )}
                      <p className="applied-date">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="responses-section">
                      <h3>Responses</h3>
                      {app.answers.length === 0 && (
                        <p className="empty-responses">No responses submitted.</p>
                      )}
                      {app.answers.map((answer) => (
                        <div key={answer.id} className="response-item">
                          <p className="question-text">
                            {answer.question?.body && typeof answer.question.body === "object"
                              ? answer.question.body.prompt ?? "Question"
                              : "Question"}
                          </p>
                          <p className="answer-text">
                            {typeof answer.body?.value === "boolean"
                              ? answer.body.value ? "Yes" : "No"
                              : String(answer.body?.value ?? "")}
                          </p>
                        </div>
                      ))}
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
