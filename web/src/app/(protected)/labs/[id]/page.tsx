/**
 * Lab Detail Page
 * Displays public information about a specific lab/post.
 * Includes a link to the application form.
 */
"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Loading from "../../../components/Loading";
import Toast, { type ToastState } from "../../../components/Toast";
// getLab will be called via fetch
import "./page.css";

export interface Lab {
  id: string;
  name: string;
  desc: string;
  details: string[];
  tags?: string[];
}

function LabDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"RESEARCHER" | "STUDENT" | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // Fetch lab data
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          return;
        }
        // Transform post data to lab format
        setLab({
          id: data.id.toString(),
          name: data.title,
          desc: data.body || "",
          details: data.researcher?.user?.name ? [`Posted by ${data.researcher.user.name}`] : [],
          tags: data.tags || [],
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch user role
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.researcher) {
          setUserRole("RESEARCHER");
        } else if (data?.user?.student) {
          setUserRole("STUDENT");
        }
      })
      .catch(() => {});
  }, [id]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return <Loading fullPage />;
  }

  if (!lab) {
    return (
      <>
        <Navbar isLoggedIn={true} role={userRole || undefined} />
        <div className="lab-detail-page">
          <div className="container">
            <div className="error-message">Lab not found.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar isLoggedIn={true} role={userRole || undefined} />
      <div className="lab-detail-page">
        <div className="lab-detail-card">
          <h1 className="lab-title">{lab.name}</h1>

          {lab.tags && lab.tags.length > 0 && (
            <div className="lab-tags">
              {lab.tags.map((tag) => (
                <span key={tag} className="lab-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <section>
            <h2 className="section-title">Description</h2>
            <p className="section-text">{lab.desc}</p>
          </section>

          {lab.details && lab.details.length > 0 && (
            <section>
              <h2 className="section-title">Details</h2>
              <ul className="section-text">
                {lab.details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href={`/student_application/apply?lab=${lab.id}`}
            className="apply-button"
            onClick={() => {
              setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
              setIsDismissing(false);
            }}
          >
            Apply Now
          </Link>
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

export default function LabDetail() {
  return (
    <Suspense fallback={<Loading fullPage />}>
      <LabDetailContent />
    </Suspense>
  );
}
