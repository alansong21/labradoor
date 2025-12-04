/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import React, { useEffect, useState } from "react";
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
  const [userName, setUserName] = useState<string | null>(user?.name || null);
  
  const isLoggedIn = !!user;
  const role = user?.student ? "STUDENT" : user?.researcher ? "RESEARCHER" : null;

  useEffect(() => {
    // fetch user's name if not provided in user prop
    if (!user?.name && isLoggedIn) {
      fetchUserProfile();
    } else if (user?.name) {
      setUserName(user.name);
    }
  }, [user, isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUserName(data.user?.name || null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      
      router.refresh();
      router.push("/");
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
                      {userName || "Profile"}
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
