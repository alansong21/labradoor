"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../admin.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/admin/verify", {
          credentials: "include",
        });
        
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          const data = await res.json();
          setAdminEmail(data.admin?.email || "");
          setLoading(false);
        }
      } catch (error) {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/admin/login");
  };

  if (loading) {
    return <div className="admin-container">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          {adminEmail && <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>Logged in as: {adminEmail}</p>}
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      <p>Welcome to the admin portal!</p>
    </div>
  );
}
