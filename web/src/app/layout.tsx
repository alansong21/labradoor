/**
 * Root Layout
 * Defines the global HTML structure and font settings for the application.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";

// Lazy load Footer - not critical for initial render
const Footer = dynamic(() => import("./components/Footer"), {
  ssr: true,
});

// Lazy load PageLoader - client component for route transitions
// Using wrapper component to enable ssr: false
const PageLoader = dynamic(() => import("./components/PageLoaderWrapper"), {
  ssr: true, // Wrapper can be SSR'd, but PageLoader itself is client-only
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload the main font
});

export const metadata: Metadata = {
  title: "Labradoor",
  description: "A platform to connect UCLA students with research labs",
  // Performance optimizations
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
  },
  // Resource hints for better performance
  other: {
    "dns-prefetch": "//fonts.googleapis.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <div className="floating-blob blob-left" aria-hidden="true" />
        <div className="floating-blob blob-right" aria-hidden="true" />
        {children}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
