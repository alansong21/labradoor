/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import React from "react";
import "./Navbar.css";
import Link from "next/link";
import Image from "next/image";
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
          <Image
            src="/logo.png"
            alt="Labradoor"
            width={120}
            height={40}
            priority
            style={{ height: "auto", width: "auto", objectFit: "contain" }}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              // Fallback to text if image doesn't exist
              const target = e.target as HTMLImageElement;
              const parent = target.closest(".navbar-brand") as HTMLElement;
              if (parent) {
                target.style.display = "none";
                const textFallback = document.createTextNode("LABRADOOR");
                parent.appendChild(textFallback);
                parent.style.fontWeight = "bold";
                parent.style.fontSize = "1.5rem";
                parent.style.color = "black";
              }
            }}
          />
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
