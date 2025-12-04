/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import React from "react";
import "./Navbar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name?: string | null;
  student?: any;
  researcher?: any;
}

interface NavbarProps {
  user?: User | null;
  hideAuthButtons?: boolean;
}

export default function Navbar({ user, hideAuthButtons = false }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isLoggedIn = !!user;
  const role = user?.student ? "STUDENT" : user?.researcher ? "RESEARCHER" : null;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/" className="navbar-brand">
          LABRADOOR
        </a>
        {user && (
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            Logged in as: {user.email}
          </p>
        )}
      </div>
      <div className="navbar-right">
        {!hideAuthButtons && (
          <>
            <ul className="navbar-links">
              {role === "STUDENT" && (
                <li>
                  <a href="/my-applications">My Applications</a>
                </li>
              )}
              {role === "RESEARCHER" && (
                <li>
                  <a href="/researcher-myposts">My Posts</a>
                </li>
              )}
              {isLoggedIn && (
                <>
                  <li>
                    <a href="/profile" className="profile-button">
                      Profile
                    </a>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="logout-button">
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}
