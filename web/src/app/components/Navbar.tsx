/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import { useState, type SyntheticEvent } from "react";
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
  const [logoFailed, setLogoFailed] = useState(false);

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
        <Link href="/" className="navbar-brand" prefetch={true}>
          {logoFailed ? (
            <span style={{ fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>
              LABRADOOR
            </span>
          ) : (
            <Image
              src="/logo.png"
              alt="Labradoor"
              width={120}
              height={40}
              priority
              loading="eager"
              style={{ height: "auto", width: "auto", objectFit: "contain" }}
              onError={(e: SyntheticEvent<HTMLImageElement, Event>) => {
                // Hide broken image and switch to text fallback
                e.currentTarget.style.display = "none";
                setLogoFailed(true);
              }}
            />
          )}
        </Link>
        <ul className="navbar-links">
          {role === "STUDENT" && (
            <li>
              <Link href="/my-applications" prefetch={true}>My Applications</Link>
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
                    <Link href="/profile" prefetch={true} className="profile-button">
                      Profile
                    </Link>
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
