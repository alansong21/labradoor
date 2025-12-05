"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../../../components/Navbar";
import Loading from "../../../../components/Loading";
import Toast, { type ToastState } from "../../../../components/Toast";
import "./page.css";

interface Response {
  id: number;
  answer: string;
  question: {
    question: string;
    type: string;
  };
}

interface Application {
  id: number;
  createdAt: string;
  applicant: {
    name: string;
    email: string;
    uclaId: string;
  };
  responses: Response[];
}

export default function PostApplicationsPage({
  params,
}: {
  params: { id: string };
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAccept = (email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setToast({ id: Date.now(), tone: "success", message: "Email successfully copied" });
      setIsDismissing(false);
    }).catch(() => {
      setToast({ id: Date.now(), tone: "error", message: "Failed to copy email" });
      setIsDismissing(false);
    });
  };

  const handleReject = () => {
    setToast({ id: Date.now(), tone: "loading", message: "WIP" });
    setIsDismissing(false);
    setTimeout(() => {
      setIsDismissing(true);
    }, 2000);
  };

  const handlePending = () => {
    setToast({ id: Date.now(), tone: "loading", message: "WIP" });
    setIsDismissing(false);
    setTimeout(() => {
      setIsDismissing(true);
    }, 2000);
  };

  useEffect(() => {
    fetch(`/api/applications/post/${params.id}`)
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
  }, [params.id]);

  return (
    <>
      <Navbar isLoggedIn={true} />
      <div className="applications-page">
        <div className="container">
          <h1 className="page-title">Applications</h1>

          {loading ? (
            <div className="loading-wrapper">
              <Loading />
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>No applications received yet.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="applicant-info">
                    <h2>{app.applicant.name || "Unknown Name"}</h2>
                    <p className="applicant-email">{app.applicant.email}</p>
                    {app.applicant.uclaId && (
                      <p className="applicant-id">UID: {app.applicant.uclaId}</p>
                    )}
                    <p className="applied-date">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="responses-section">
                    <h3>Responses</h3>
                    {app.responses.map((response) => (
                      <div key={response.id} className="response-item">
                        <p className="question-text">
                          {response.question.question}
                        </p>
                        <p className="answer-text">{response.answer}</p>
                      </div>
                    ))}
                    <div className="application-actions">
                      <button
                        className="action-button accept-button"
                        onClick={() => handleAccept(app.applicant.email)}
                      >
                        Accept
                      </button>
                      <button
                        className="action-button reject-button"
                        onClick={handleReject}
                      >
                        Reject
                      </button>
                      <button
                        className="action-button pending-button"
                        onClick={handlePending}
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Toast
        toast={toast}
        isDismissing={isDismissing}
        onDismiss={() => setIsDismissing(true)}
        onAnimationEnd={() => {
          if (isDismissing) {
            setToast(null);
            setIsDismissing(false);
          }
        }}
      />
    </>
  );
}
