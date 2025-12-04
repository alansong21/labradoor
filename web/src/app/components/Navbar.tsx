"use client";

import React from "react";
import "./Navbar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  isLoggedIn?: boolean;
  role?: string;
  hideAuthButtons?: boolean;
}

export default function Navbar({ isLoggedIn = false, role, hideAuthButtons = false }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // await fetch("http://localhost:4000/api/auth/logout", {
      //   method: "POST",
      // });
      // We can also hit the Next.js API route if we had one proxying, but here we hit the backend directly.
      // Actually, since we are in the browser, we should use the relative path if we have a proxy setup,
      // OR use the full URL.
      // Wait, the previous code used `/api/auth/signup` which implies there is a proxy or rewrite in next.config.ts.
      // Let's check next.config.ts to be sure, or just assume /api works.
      // The signup page used `/api/auth/signup`. So I should use `/api/auth/logout`.
      
      await fetch("/api/auth/logout", { method: "POST" });
      
      router.refresh(); // Refresh the current route to update server components
      router.push("/"); // Redirect to landing page
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/" className="navbar-brand">
          LABRADOOR
        </a>
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
        </ul>
      </div>
      <div className="navbar-right">
        {!hideAuthButtons && (
          <>
            <ul className="navbar-links">
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
