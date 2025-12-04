/**
 * Student Application Page
 * Displays the application form for a specific lab post.
 * Dynamically renders questions based on the post's configuration.
 * Handles form submission to the backend.
 */
"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import "./page.css";

type QuestionType = "LONG_TEXT" | "SHORT_TEXT" | "CHECKBOX" | "MULTIPLE_CHOICE";

interface QuestionBody {
  prompt?: string;
  description?: string;
  options?: string[];
}

interface Question {
  id: number;
  type: QuestionType | string;
  body?: QuestionBody | string | null;
  question?: string;
  description?: string;
  options?: string[];
}

interface Post {
  id: number;
  title: string;
  body: string;
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

  useEffect(() => {
    if (!post) return;
    const defaults: Record<number, string> = {};
    post.questions.forEach((q) => {
      const rawType = typeof q.type === "string" ? q.type.toUpperCase().replace(/-/g, "_") : "";
      if (rawType === "CHECKBOX" && responses[q.id] === undefined) {
        defaults[q.id] = "false";
      }
    });
    if (Object.keys(defaults).length > 0) {
      setResponses((prev) => ({ ...defaults, ...prev }));
    }
  }, [post]); 

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
        <p className="post-desc">{post.body}</p>

        <form className="application-form" onSubmit={handleSubmit}>
          {post.questions.map((q) => {
            const rawType = typeof q.type === "string" ? q.type.toUpperCase().replace(/-/g, "_") : "LONG_TEXT";
            const normalizedType =
              rawType === "TEXT" ? "LONG_TEXT" : (["LONG_TEXT", "SHORT_TEXT", "CHECKBOX", "MULTIPLE_CHOICE"].includes(rawType) ? (rawType as QuestionType) : "LONG_TEXT");
            const body = typeof q.body === "object" && q.body !== null ? q.body : undefined;
            const prompt = body?.prompt ?? q.question ?? (typeof q.body === "string" ? q.body : "Question");
            const helper = body?.description ?? q.description ?? "";
            const options = body?.options ?? q.options ?? [];

            return (
              <div key={q.id} className="form-section">
                <label className="field-label">{prompt}</label>
                {helper && (
                  <p className="field-helper">{helper}</p>
                )}

                {normalizedType === "LONG_TEXT" && (
                  <textarea
                    className="textarea-input"
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    required
                  />
                )}

                {normalizedType === "SHORT_TEXT" && (
                  <input
                    type="text"
                    className="text-input"
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    required
                  />
                )}

                {normalizedType === "CHECKBOX" && (
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={responses[q.id] === "true"}
                        onChange={(e) => handleResponseChange(q.id, e.target.checked ? "true" : "false")}
                      />
                      Yes
                    </label>
                  </div>
                )}

                {normalizedType === "MULTIPLE_CHOICE" && (
                  <select
                    className="select-input"
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    required
                  >
                    <option value="">Select an option</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}

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
