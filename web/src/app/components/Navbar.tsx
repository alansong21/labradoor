import React from "react";
import "./Navbar.css";
import Link from "next/link";

export default function Navbar() {
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
          <li>
            <a href="/api">API</a>
          </li>
          <li>
            <a href="/help">Help</a>
          </li>
          <li>
            <a href="/login">Login</a>
          </li>
        </ul>
        <Link href="/signup" className="signup-button">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
