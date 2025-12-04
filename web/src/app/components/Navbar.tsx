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
                <li>
                  <button onClick={handleLogout} className="logout-button">
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}
