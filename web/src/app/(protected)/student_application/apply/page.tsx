"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import "./page.css";

interface Question {
  id: number;
  type: "text" | "checkbox" | "multiple-choice";
  question: string;
  options: string[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  questions: Question[];
}

function ApplyForm() {
  const searchParams = useSearchParams();
  const postId = searchParams.get("lab");
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          setPost(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [postId]);

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setSubmitting(true);

    const formattedResponses = Object.entries(responses).map(([qId, answer]) => ({
      questionId: parseInt(qId),
      answer,
    }));

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          responses: formattedResponses,
        }),
      });

      if (res.ok) {
        alert("Application submitted successfully!");
        router.push("/");
      } else {
        const body = await res.json();
        alert(body.error || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!postId) return <div className="error-message">Invalid URL: Missing lab ID.</div>;
  if (loading) return <div className="loading-message">Loading application form...</div>;
  if (!post) return <div className="error-message">Post not found.</div>;

  return (
    <div className="apply-page">
      <div className="apply-container">
        <h1 className="page-title">Apply to {post.title}</h1>
        <p className="post-desc">{post.content}</p>

        <form className="application-form" onSubmit={handleSubmit}>
          {post.questions.map((q) => (
            <div key={q.id} className="form-section">
              <label className="field-label">{q.question}</label>
              
              {q.type === "text" && (
                <textarea
                  className="textarea-input"
                  value={responses[q.id] || ""}
                  onChange={(e) => handleResponseChange(q.id, e.target.value)}
                  required
                />
              )}

              {q.type === "checkbox" && (
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={responses[q.id] === "Yes"}
                      onChange={(e) => handleResponseChange(q.id, e.target.checked ? "Yes" : "No")}
                    />
                    Yes
                  </label>
                </div>
              )}

              {q.type === "multiple-choice" && (
                <select
                  className="select-input"
                  value={responses[q.id] || ""}
                  onChange={(e) => handleResponseChange(q.id, e.target.value)}
                  required
                >
                  <option value="">Select an option</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <>
      <Navbar isLoggedIn={true} />
      <Suspense fallback={<div>Loading...</div>}>
        <ApplyForm />
      </Suspense>
    </>
  );
}
