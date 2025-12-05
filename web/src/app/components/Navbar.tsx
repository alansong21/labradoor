/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
import "./Navbar.css";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Toast, { type ToastState } from "./Toast";

interface NavbarProps {
  isLoggedIn?: boolean;
  role?: string;
  hideAuthButtons?: boolean;
}

export default function Navbar({ isLoggedIn = false, role, hideAuthButtons = false }: NavbarProps) {
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogout = async () => {
    setToast({ id: Date.now(), tone: "loading", message: "Logging out..." });
    setIsDismissing(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setToast({ id: Date.now(), tone: "success", message: "Logged out successfully" });
      setTimeout(() => {
        router.refresh();
        router.push("/");
      }, 500);
    } catch (error) {
      console.error("Logout failed", error);
      setToast({ id: Date.now(), tone: "error", message: "Logout failed" });
      setIsDismissing(false);
    }
  };

  const handleLinkClick = () => {
    setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
    setIsDismissing(false);
  };

  return (
    <>
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
                <Link href="/my-applications" prefetch={true} onClick={handleLinkClick}>My Applications</Link>
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
                      <Link href="/profile" prefetch={true} className="profile-button" onClick={handleLinkClick}>
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
