/**
 * Admin Dashboard
 * Main interface for administrators.
 * Allows viewing and managing researcher verification statuses.
 */
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import Toast, { type ToastState } from "../../components/Toast";
import "../admin.css";

interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  uclaId?: string | null;
  student?: { year: string; major: string } | null;
  researcher?: { department: string; verifyStatus: string } | null;
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

type TabType = "verification" | "deleteUser";

// Researcher Verification Component
function ResearcherVerification({
  researchers,
  updating,
  onUpdateStatus,
}: {
  researchers: Researcher[];
  updating: number | null;
  onUpdateStatus: (userId: number, status: "VERIFIED" | "PENDING" | "UNVERIFIED") => void;
}) {
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
                        onUpdateStatus(researcher.userId, "VERIFIED")
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
                        onUpdateStatus(researcher.userId, "PENDING")
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
                        onUpdateStatus(researcher.userId, "UNVERIFIED")
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
  );
}

// Delete User Component
function DeleteUserTab({
  users,
  searchTerm,
  selectedUser,
  deleteConfirm,
  onSearchChange,
  onSelectUser,
  onDeleteUser,
  onCancelDelete,
  onConfirmChange,
}: {
  users: User[];
  searchTerm: string;
  selectedUser: User | null;
  deleteConfirm: string;
  onSearchChange: (value: string) => void;
  onSelectUser: (user: User) => void;
  onDeleteUser: () => void;
  onCancelDelete: () => void;
  onConfirmChange: (value: string) => void;
}) {
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uclaId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  );

  console.log("DeleteUserTab - Total users:", users.length);
  console.log("DeleteUserTab - Filtered users:", filteredUsers.length);
  console.log("DeleteUserTab - Search term:", searchTerm);

  return (
    <div className="admin-section">
      <h2>Delete User</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        Search and delete users from the system. Total users: {users.length}
      </p>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by email, name, or UCLA ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="user-list">
        {filteredUsers.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>{user.name || "No name"}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-details">
                ID: {user.id} | UCLA ID: {user.uclaId || "N/A"}
              </p>
              <p className="user-details">
                Type: {user.student ? "Student" : user.researcher ? "Researcher" : "User"}
                {user.student && ` | ${user.student.major} - ${user.student.year}`}
                {user.researcher && ` | ${user.researcher.department}`}
              </p>
              <p className="user-details">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onSelectUser(user)}
              className="delete-user-btn"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="delete-modal-overlay" onClick={onCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm User Deletion</h3>
            <div className="modal-user-info">
              <p><strong>Name:</strong> {selectedUser.name || "No name"}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>ID:</strong> {selectedUser.id}</p>
            </div>
            <p className="warning-text">
              ⚠️ This action cannot be undone. All related data will be deleted.
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => onConfirmChange(e.target.value)}
              className="confirm-input"
            />
            <div className="modal-buttons">
              <button onClick={onCancelDelete} className="cancel-btn">
                Cancel
              </button>
              <button 
                onClick={onDeleteUser}
                disabled={deleteConfirm !== "DELETE"}
                className="confirm-delete-btn"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("verification");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  
  // Researcher verification state
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [updating, setUpdating] = useState<number | null>(null);
  
  // Delete user state
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Auto-dismiss success toast
  useEffect(() => {
    if (toast?.tone === "success") {
      const timer = setTimeout(() => setIsDismissing(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
          fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });
      // console.log("Fetch users response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        // console.log("Users data received:", data);
        // console.log("Number of users:", data.users?.length);
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users, status:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const updateVerificationStatus = async (
    userId: number,
    status: "VERIFIED" | "PENDING" | "UNVERIFIED"
  ) => {
    setUpdating(userId);
    setToast({ id: Date.now(), tone: "loading", message: "Updating status..." });
    setIsDismissing(false);
    try {
      const res = await fetch(`/api/admin/researchers/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verifyStatus: status }),
      });

      if (res.ok) {
        setResearchers((prev) =>
          prev.map((r) =>
            r.userId === userId ? { ...r, verifyStatus: status } : r
          )
        );
        setToast({ id: Date.now(), tone: "success", message: "Status updated successfully" });
      } else {
        setToast({ id: Date.now(), tone: "error", message: "Failed to update verification status" });
        setIsDismissing(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({ id: Date.now(), tone: "error", message: "Error updating verification status" });
      setIsDismissing(false);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || deleteConfirm !== "DELETE") {
      setToast({ id: Date.now(), tone: "error", message: "Please type DELETE to confirm" });
      setIsDismissing(false);
      return;
    }

    setToast({ id: Date.now(), tone: "loading", message: "Deleting user..." });
    setIsDismissing(false);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setToast({ id: Date.now(), tone: "success", message: `User ${selectedUser.email} has been deleted` });
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setSelectedUser(null);
        setDeleteConfirm("");
      } else {
        setToast({ id: Date.now(), tone: "error", message: "Failed to delete user" });
        setIsDismissing(false);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setToast({ id: Date.now(), tone: "error", message: "Error deleting user" });
      setIsDismissing(false);
    }
  };

  const handleCancelDelete = () => {
    setSelectedUser(null);
    setDeleteConfirm("");
  };

  const handleLogout = async () => {
    setToast({ id: Date.now(), tone: "loading", message: "Logging out..." });
    setIsDismissing(false);
    try {
      await fetch("/api/auth/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      setToast({ id: Date.now(), tone: "success", message: "Logged out successfully" });
      setTimeout(() => {
        router.push("/admin/login");
      }, 500);
    } catch (error) {
      setToast({ id: Date.now(), tone: "error", message: "Logout failed" });
      setIsDismissing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Loading fullPage />
      </div>
    );
  }

  return (
    <>
      <Navbar isLoggedIn={false} hideAuthButtons={true} />
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

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "verification" ? "active" : ""}`}
            onClick={() => setActiveTab("verification")}
          >
            Researcher Verification
          </button>
          <button
            className={`tab-button ${activeTab === "deleteUser" ? "active" : ""}`}
            onClick={() => setActiveTab("deleteUser")}
          >
            Delete User
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "verification" && (
          <ResearcherVerification
            researchers={researchers}
            updating={updating}
            onUpdateStatus={updateVerificationStatus}
          />
        )}

        {activeTab === "deleteUser" && (
          <DeleteUserTab
            users={users}
            searchTerm={searchTerm}
            selectedUser={selectedUser}
            deleteConfirm={deleteConfirm}
            onSearchChange={setSearchTerm}
            onSelectUser={setSelectedUser}
            onDeleteUser={handleDeleteUser}
            onCancelDelete={handleCancelDelete}
            onConfirmChange={setDeleteConfirm}
          />
        )}
      </div>
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
