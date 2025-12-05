"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

export type ToastTone = "success" | "error" | "loading";

export interface ToastState {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastProps {
  toast: ToastState | null;
  isDismissing: boolean;
  onDismiss: () => void;
  onAnimationEnd: () => void;
}

export default function Toast({ toast, isDismissing, onDismiss, onAnimationEnd }: ToastProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!toast || !mounted) return null;

  const toastContent = (
    <div
      className={`toast toast--${toast.tone} ${isDismissing ? "toast--dismissing" : ""}`}
      role="alert"
      onAnimationEnd={onAnimationEnd}
    >
      {toast.tone === "loading" && <span className="toast-spinner" />}
      {toast.tone === "error" && <span className="toast-icon">⚠</span>}
      <span>{toast.message}</span>
      {toast.tone !== "loading" && (
        <button
          className="toast-close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );

  return createPortal(toastContent, document.body);
}

