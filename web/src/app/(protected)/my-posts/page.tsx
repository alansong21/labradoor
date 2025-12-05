/**
 * My Posts Page (Student View)
 * Displays a list of posts the student has applied to (or saved).
 * Note: The current implementation fetches "my-posts" which might be shared with researcher logic,
 * but this page seems intended for students or researchers viewing their own content.
 */
"use client";
import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import Loading from "../../components/Loading";
import Toast, { type ToastState } from "../../components/Toast";
import "./page.css";

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  _count: {
    applications: number;
  };
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    fetch("/api/posts/my-posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <>
      <Navbar isLoggedIn={true} />
      <div className="my-posts-page">
        <div className="container">
          <div className="header">
            <h1>My Posts</h1>
            <Link 
              href="/researcher-post-creation" 
              className="create-button"
              onClick={() => {
                setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
                setIsDismissing(false);
              }}
            >
              Create New Post
            </Link>
          </div>

          {loading ? (
            <div className="loading-wrapper">
              <Loading />
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any posts yet.</p>
              <Link href="/researcher-post-creation" className="create-link">
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-content">
                    <h2>{post.title}</h2>
                    <p className="post-date">
                      Posted on {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <p className="post-desc">{post.content}</p>
                  </div>
                  <div className="post-footer">
                    <div className="app-count-badge">
                      {post._count.applications} {post._count.applications === 1 ? 'Application' : 'Applications'}
                    </div>
                    <Link
                      href={`/researcher-myposts/${post.id}/applications`}
                      className="view-apps-button"
                      onClick={() => {
                        setToast({ id: Date.now(), tone: "loading", message: "Loading applications..." });
                        setIsDismissing(false);
                      }}
                    >
                      View Applications
                    </Link>
                    <button
                      className="delete-button"
                      disabled={deleting === post.id}
                      onClick={async () => {
                        if (!confirm("Delete this post?")) return;
                        setDeleting(post.id);
                        setToast({ id: Date.now(), tone: "loading", message: "Deleting post..." });
                        setIsDismissing(false);
                        try {
                          const res = await fetch(`/api/posts/${post.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            setPosts((prev) => prev.filter((p) => p.id !== post.id));
                            setToast({ id: Date.now(), tone: "success", message: "Post deleted successfully" });
                          } else {
                            const body = await res.json().catch(() => null);
                            setToast({ id: Date.now(), tone: "error", message: body?.error ?? "Failed to delete post" });
                          }
                        } catch (err) {
                          console.error(err);
                          setToast({ id: Date.now(), tone: "error", message: "Failed to delete post" });
                        } finally {
                          setDeleting(null);
                        }
                      }}
                    >
                      {deleting === post.id ? "Deleting..." : "Delete"}
                    </button>
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
