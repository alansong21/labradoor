/**
 * Admin Dashboard
 * Main interface for administrators.
 * Allows viewing and managing researcher verification statuses.
 */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../admin.css";

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

interface Researcher {
  userId: number;
  verifyStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";
  department: string;
  user: User;
  _count: {
    posts: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);

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
          fetchResearchers();
        }
      } catch (error) {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchResearchers = async () => {
    try {
      const res = await fetch("/api/admin/researchers", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setResearchers(data);
      }
    } catch (error) {
      console.error("Failed to fetch researchers:", error);
    }
  };

  const updateVerificationStatus = async (
    userId: number,
    status: "VERIFIED" | "PENDING" | "UNVERIFIED"
  ) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/researchers/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verifyStatus: status }),
      });

      if (res.ok) {
        // Update local state
        setResearchers((prev) =>
          prev.map((r) =>
            r.userId === userId ? { ...r, verifyStatus: status } : r
          )
        );
      } else {
        alert("Failed to update verification status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating verification status");
    } finally {
      setUpdating(null);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "#28a745";
      case "PENDING":
        return "#ffc107";
      case "UNVERIFIED":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          {adminEmail && (
            <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
              Logged in as: {adminEmail}
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-section">
        <h2>Researcher Verification</h2>
        <p style={{ marginBottom: "1rem", color: "#666" }}>
          Total Researchers: {researchers.length}
        </p>

        {researchers.length === 0 ? (
          <p>No researchers found.</p>
        ) : (
          <div className="researcher-list">
            {researchers.map((researcher) => (
              <div key={researcher.userId} className="researcher-card">
                <div className="researcher-info">
                  <h3>{researcher.user.name || "No name"}</h3>
                  <p className="researcher-email">{researcher.user.email}</p>
                  <p className="researcher-details">
                    Department: {researcher.department} | Posts:{" "}
                    {researcher._count.posts}
                  </p>
                  <p className="researcher-details">
                    Joined:{" "}
                    {new Date(researcher.user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="researcher-actions">
                  <div
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(researcher.verifyStatus),
                    }}
                  >
                    {researcher.verifyStatus}
                  </div>

                  <div className="action-buttons">
                    {researcher.verifyStatus !== "VERIFIED" && (
                      <button
                        onClick={() =>
                          updateVerificationStatus(
                            researcher.userId,
                            "VERIFIED"
                          )
                        }
                        disabled={updating === researcher.userId}
                        className="verify-btn"
                      >
                        ✓ Verify
                      </button>
                    )}
                    {researcher.verifyStatus !== "PENDING" && (
                      <button
                        onClick={() =>
                          updateVerificationStatus(researcher.userId, "PENDING")
                        }
                        disabled={updating === researcher.userId}
                        className="pending-btn"
                      >
                        ⏸ Pending
                      </button>
                    )}
                    {researcher.verifyStatus !== "UNVERIFIED" && (
                      <button
                        onClick={() =>
                          updateVerificationStatus(
                            researcher.userId,
                            "UNVERIFIED"
                          )
                        }
                        disabled={updating === researcher.userId}
                        className="unverify-btn"
                      >
                        ✗ Unverify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
