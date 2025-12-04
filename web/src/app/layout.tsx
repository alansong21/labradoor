/**
 * Root Layout
 * Defines the global HTML structure and font settings for the application.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Labradoor",
  description: "A platform to connect UCLA students with research labs",
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
        <div className="floating-blob blob-left" aria-hidden="true" />
        <div className="floating-blob blob-right" aria-hidden="true" />
        {children}
        <Footer />
      </body>
    </html>
  );
}
