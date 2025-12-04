/**
 * My Applications Page
 * Displays all applications submitted by the current student.
 * Shows application status and links to view details.
 */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useUser } from "@/hooks/useUser";
import "./page.css";

interface Application {
  id: number;
  createdAt: string;
  status: string;
  post: {
    id: number;
    title: string;
    summary?: string | null;
  };
  answers: Array<{
    id: number;
    type: string;
    body: {
      value: any;
    };
  }>;
}

export default function MyApplicationsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Navbar user={user} />
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
              {applications.map((app) => (
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
                    <a href={`/labs/${app.post.id}`} className="view-post-link">
                      View Post →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

