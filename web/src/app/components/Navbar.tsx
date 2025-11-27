import React from "react";
import "./Navbar.css";
import Link from "next/link";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/" className="navbar-brand">
          LABRADOOR
        </a>
        <ul className="navbar-links">
          <li>
            <a href="/my-applications">My Applications</a>
          </li>
          <li>
            <a href="/link3">Link 3</a>
          </li>
          <li>
            <a href="/link4">Link 4</a>
          </li>
        </ul>
      </div>
      <div className="navbar-right">
        <ul className="navbar-links">

          {!isLoggedIn && (
            <li>
              <a href="/login">Login</a>
            </li>
          )}
        </ul>
        {!isLoggedIn && (
          <Link href="/signup" className="signup-button">
            Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}
