"use client";

import React from "react";
import "./Loading.css";

interface LoadingProps {
  fullPage?: boolean;
  message?: string;
}

export default function Loading({ fullPage = false, message = "Loading..." }: LoadingProps) {
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner-small" />
      <span className="loading-text">{message}</span>
    </div>
  );
}

