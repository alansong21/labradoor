/**
 * Researcher My Posts Page
 * Displays a dashboard of posts created by the logged-in researcher.
 * Shows application counts and links to view detailed applications.
 */
"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import "./page.css";

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  tags?: string[];
  _count: {
    applications: number;
  };
}

export default function MyPostsPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <>
      <Navbar user={user} />
      <div className="my-posts-page">
        <div className="container">
          <div className="header">
            <h1>My Posts</h1>
            <Link href="/researcher-post-creation" className="create-button">
              Create New Post
            </Link>
          </div>

          {loading ? (
            <div className="loading">Loading posts...</div>
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
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-tags">
                        {post.tags.map((tag) => (
                          <span key={tag} className="post-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="post-desc">{post.content}</p>
                  </div>
                  <div className="post-footer">
                    <div className="app-count-badge">
                      {post._count.applications} Applications
                    </div>
                    <Link
                      href={`/researcher-myposts/${post.id}/applications`}
                      className="view-apps-button"
                    >
                      View Applications
                    </Link>
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
