/**
 * Navbar Component
 * Displays the main navigation bar.
 * Adapts based on login status and user role (Student vs Researcher).
 */
"use client";

import { useState, useEffect, useRef } from "react";
import "./Navbar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast, { type ToastState } from "./Toast";

interface NavbarProps {
  isLoggedIn?: boolean;
  role?: string;
  hideAuthButtons?: boolean;
  userName?: string;
}

export default function Navbar({ isLoggedIn = false, role, hideAuthButtons = false, userName }: NavbarProps) {
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [name, setName] = useState<string | null>(userName || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch user name if logged in and not provided
  useEffect(() => {
    if (isLoggedIn && !name) {
      fetch("/api/auth/me", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.name) {
            setName(data.user.name);
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [isLoggedIn, name]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

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

  const handleProfileClick = () => {
    setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
    setIsDismissing(false);
  };

  const handleLinkClick = () => {
    setToast({ id: Date.now(), tone: "loading", message: "Loading..." });
    setIsDismissing(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link href="/" className="navbar-brand" prefetch={true} onClick={handleLinkClick}>
            {logoFailed ? (
              <span style={{ fontWeight: "bold", fontSize: "1.5rem", color: "black" }}>
                LABRADOOR
              </span>
            ) : (
              <img
                src="/logo.png"
                alt="Labradoor"
                style={{ height: "40px", width: "auto", objectFit: "contain", display: "block" }}
                onError={() => {
                  setLogoFailed(true);
                }}
                onLoad={() => {
                  setLogoFailed(false);
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
          {!hideAuthButtons && isLoggedIn && name && (
            <div
              className="navbar-user-dropdown"
              ref={dropdownRef}
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
                setDropdownOpen(true);
              }}
              onMouseLeave={() => {
                closeTimeoutRef.current = setTimeout(() => {
                  setDropdownOpen(false);
                }, 300);
              }}
            >
              <span className="navbar-user-name" data-text={name}>{name}</span>
              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <Link
                    href="/profile"
                    prefetch={true}
                    className="navbar-dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <span className="navbar-dropdown-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                        <path d="M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z" fill="currentColor"/>
                      </svg>
                    </span>
                    Profile
                  </Link>
                  <button
                    className="navbar-dropdown-item navbar-dropdown-item--logout"
                    onClick={handleLogout}
                  >
                    <span className="navbar-dropdown-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M10 11L14 8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    Logout
                  </button>
                </div>
              )}
            </div>
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
