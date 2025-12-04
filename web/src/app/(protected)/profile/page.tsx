"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import "./page.css";

interface User {
  id: number;
  email: string;
  name: string | null;
  uclaId: string | null;
  createdAt: string;
  student?: {
    year: string;
    major: string;
    description: string | null;
  };
  researcher?: {
    department: string;
    verifyStatus: string;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    uclaId: "",
    year: "",
    major: "",
    description: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          uclaId: data.user.uclaId || "",
          year: data.user.student?.year || "",
          major: data.user.student?.major || "",
          description: data.user.student?.description || "",
          department: data.user.researcher?.department || "",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Update basic user info
      const userUpdateBody: any = {
        name: formData.name,
        uclaId: formData.uclaId,
      };

      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userUpdateBody),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : JSON.stringify(data.error) || "Failed to update profile";
        setError(errorMsg);
        return;
      }

      // If student, update student-specific fields
      if (user?.student) {
        const studentRes = await fetch(`/api/students/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            year: formData.year,
            major: formData.major,
            description: formData.description,
          }),
        });

        if (!studentRes.ok) {
          const data = await studentRes.json();
          const errorMsg = typeof data.error === 'string' 
            ? data.error 
            : JSON.stringify(data.error) || "Failed to update student information";
          setError(errorMsg);
          return;
        }
      }

      if (user?.researcher) {
        const researcherRes = await fetch(`/api/researchers/${user.id}`, {
          method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                department: formData.department,
            }),
        });

        if (!researcherRes.ok) {
            const data = await researcherRes.json();
            const errorMsg = typeof data.error === 'string' 
              ? data.error 
              : JSON.stringify(data.error) || "Failed to update researcher information";
            setError(errorMsg);
            return;
        }
    }

    setSuccess("Profile updated successfully!");
    setEditing(false);
    fetchUserProfile();
    } catch (error) {
      setError("An error occurred while updating profile");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
    // Reset form data to current user data
    if (user) {
      setFormData({
        name: user.name || "",
        uclaId: user.uclaId || "",
        year: user.student?.year || "",
        major: user.student?.major || "",
        description: user.student?.description || "",
        department: user.researcher?.department || "",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={null} />
        <div className="profile-page">
          <div className="profile-container">
            <div className="loading">Loading profile...</div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar user={null} />
        <div className="profile-page">
          <div className="profile-container">
            <div className="error">Failed to load profile</div>
          </div>
        </div>
      </>
    );
  }

  const userRole = user.student ? "Student" : user.researcher ? "Researcher" : "User";

  return (
    <>
      <Navbar user={user} />
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h1>My Profile</h1>
            {!editing && (
              <button onClick={() => setEditing(true)} className="edit-button">
                Edit Profile
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h2>Basic Information</h2>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label>UCLA ID</label>
                  <input
                    type="text"
                    name="uclaId"
                    value={formData.uclaId}
                    onChange={handleInputChange}
                    placeholder="Enter your UCLA ID"
                  />
                </div>
              </div>

              {user.student && (
                <div className="form-section">
                  <h2>Student Information</h2>
                  
                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="e.g., Freshman, Sophomore, Junior, Senior"
                    />
                  </div>

                  <div className="form-group">
                    <label>Major</label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      placeholder="Enter your major"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </div>
              )}

              {user.researcher && (
                <div className="form-section">
                  <h2>Researcher Information</h2>
                  
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="Enter your department"
                    />
                  </div>

                  <div className="form-group">
                    <label>Verification Status</label>
                    <div className={`status-badge ${user.researcher.verifyStatus.toLowerCase()}`}>
                      {user.researcher.verifyStatus}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="profile-section">
                <h2>Basic Information</h2>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{user.name || "Not set"}</span>
                </div>
                <div className="info-row">
                  <span className="label">UCLA ID:</span>
                  <span className="value">{user.uclaId || "Not set"}</span>
                </div>
                <div className="info-row">
                  <span className="label">Account Type:</span>
                  <span className="value">{userRole}</span>
                </div>
                <div className="info-row">
                  <span className="label">Member Since:</span>
                  <span className="value">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {user.student && (
                <div className="profile-section">
                  <h2>Student Information</h2>
                  <div className="info-row">
                    <span className="label">Year:</span>
                    <span className="value">{user.student.year}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Major:</span>
                    <span className="value">{user.student.major}</span>
                  </div>
                  {user.student.description && (
                    <div className="info-row">
                      <span className="label">Description:</span>
                      <span className="value">{user.student.description}</span>
                    </div>
                  )}
                </div>
              )}

              {user.researcher && (
                <div className="profile-section">
                  <h2>Researcher Information</h2>
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span className="value">{user.researcher.department}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Verification Status:</span>
                    <span className={`status-badge ${user.researcher.verifyStatus.toLowerCase()}`}>
                      {user.researcher.verifyStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
