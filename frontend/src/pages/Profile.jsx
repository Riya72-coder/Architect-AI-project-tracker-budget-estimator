import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [projectStats, setProjectStats] = useState({ total: 0, completed: 0, delayed: 0, active: 0 });
  const [userTaskStats, setUserTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalProjects: 0, delayedProjects: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadUserProfile();
  }, [token, navigate]);

  const loadUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const currentUser = await res.json();
      setUser(currentUser);

      // Load statistics based on user
      loadProjectStats(currentUser);
      loadRecentActivity(currentUser);

      if (currentUser.role === "ADMIN") {
        loadAdminStats();
      } else {
        loadUserTaskStats(currentUser);
      }
    } catch (err) {
      console.error(err);
      localStorage.clear();
      navigate("/login");
    }
  };

  const loadProjectStats = async (currentUser) => {
    try {
      const url = currentUser.role === "ADMIN"
        ? `${API_BASE_URL}/api/projects/all`
        : `${API_BASE_URL}/api/projects/${currentUser.email}`;

      const res = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
      });
      const projects = await res.json();

      setProjectStats({
        total: projects.length,
        completed: projects.filter((p) => p.status === "Completed").length,
        delayed: projects.filter((p) => p.status === "Delayed").length,
        active: projects.filter((p) => p.status === "In Progress").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadUserTaskStats = async (currentUser) => {
    try {
      // Get all projects first
      const projRes = await fetch(`${API_BASE_URL}/api/projects/${currentUser.email}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const projects = await projRes.json();

      let allTasks = [];
      for (const p of projects) {
        const res = await fetch(`${API_BASE_URL}/api/tasks/project/${p.id}`, {
          headers: { Authorization: "Bearer " + token },
        });
        const tasks = await res.json();
        allTasks = allTasks.concat(tasks);
      }

      setUserTaskStats({
        total: allTasks.length,
        completed: allTasks.filter((t) => t.status === "Completed").length,
        pending: allTasks.filter((t) => t.status !== "Completed").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminStats = async () => {
    try {
      const usersRes = await fetch(`${API_BASE_URL}/api/users/all`);
      const users = await usersRes.json();

      const projRes = await fetch(`${API_BASE_URL}/api/projects/all`, {
        headers: { Authorization: "Bearer " + token },
      });
      const projects = await projRes.json();

      setAdminStats({
        totalUsers: users.length,
        totalProjects: projects.length,
        delayedProjects: projects.filter((p) => p.status === "Delayed").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecentActivity = async (currentUser) => {
    try {
      const url = currentUser.role === "ADMIN"
        ? `${API_BASE_URL}/api/notifications`
        : `${API_BASE_URL}/api/notifications/${currentUser.email}`;

      const res = await fetch(url);
      const data = await res.json();
      setRecentActivity(data.slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadProfile = async () => {
    if (!selectedFile) {
      alert("Please select an image first!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/uploadProfile/${user.id}`, {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      alert(text);
      setSelectedFile(null);
      // Reload profile
      loadUserProfile();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return <div style={{ display: "flex", justifyContent: "center", padding: "50px", fontSize: "1.2rem" }}>Loading profile...</div>;

  const profileImgSrc = user.profilePic && user.profilePic !== "null"
    ? `${API_BASE_URL}/uploads/${user.profilePic}`
    : "/images/logo.png"; // Fallback to logo or default icon

  const isAdmin = user.role === "ADMIN";

  return (
    <main className="dashboard profile-page">
      <header className="project-header">
        <h1 style={{ margin: 0 }}>User Profile</h1>
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
      </header>

      <div className="profile-container">
        
        {/* LEFT COLUMN: AVATAR & BASIC DETAILS */}
        <div className="card profile-user-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "35px 20px" }}>
          <img 
            src={profileImgSrc} 
            id="profileImg" 
            alt="Profile Avatar" 
            style={{ width: "130px", height: "130px", borderRadius: "50%", objectFit: "cover", border: "4px solid var(--green-100)", marginBottom: "20px", boxShadow: "var(--shadow-md)" }} 
          />
          <h2 id="userName" style={{ margin: "0 0 5px 0" }}>{user.name}</h2>
          <span id="roleBadge" className={`role-badge ${isAdmin ? "admin" : "user"}`} style={{ display: "inline-block", padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase", marginBottom: "15px" }}>
            {user.role}
          </span>
          
          <div style={{ width: "100%", textAlign: "left", marginTop: "20px", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>📧 Email: <b id="userEmail" style={{ color: "var(--text-secondary)" }}>{user.email}</b></div>
            <div>🏢 Company/College: <b id="userCompany" style={{ color: "var(--text-secondary)" }}>{user.company}</b></div>
          </div>

          <div style={{ marginTop: "30px", width: "100%" }}>
            <label style={{ display: "block", marginBottom: "10px", fontSize: "0.85rem", fontWeight: 600 }}>Update Profile Picture:</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              id="profileInput"
              style={{ display: "block", width: "100%", fontSize: "0.8rem", marginBottom: "12px" }}
            />
            <button 
              id="uploadBtn" 
              onClick={handleUploadProfile}
              disabled={uploading}
              className="btn-send"
              style={{ width: "100%", height: "35px", border: "none", fontSize: "0.85rem" }}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </div>

          <button 
            onClick={handleLogout} 
            style={{ width: "100%", marginTop: "30px", padding: "10px", borderRadius: "8px", border: "1px solid var(--red-300)", background: "var(--red-100)", color: "var(--red-700-text)", cursor: "pointer", fontWeight: "bold" }}
          >
            Logout
          </button>
        </div>

        {/* RIGHT COLUMN: STATS & ACTIVITIES */}
        <div className="profile-content-col" style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          {/* Project statistics */}
          <div className="card">
            <h3>Project Statistics</h3>
            <div className="profile-stats-grid stats-4-col">
              <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold" }} id="totalProjects">{projectStats.total}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total</div>
              </div>
              <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--green-600)" }} id="completedProjects">{projectStats.completed}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Completed</div>
              </div>
              <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--blue-500)" }} id="activeProjects">{projectStats.active}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Active</div>
              </div>
              <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--red-500)" }} id="delayedProjects">{projectStats.delayed}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Delayed</div>
              </div>
            </div>
          </div>

          {/* USER SPECIFIC TASK STATS */}
          {!isAdmin && (
            <div className="card" id="userSection">
              <h3>Task Workload Details</h3>
              <div className="profile-stats-grid stats-3-col">
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold" }} id="totalTasks">{userTaskStats.total}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Assigned</div>
                </div>
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--green-600)" }} id="completedTasks">{userTaskStats.completed}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Finished</div>
                </div>
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--amber-500)" }} id="pendingTasks">{userTaskStats.pending}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Pending</div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SYSTEM STATS */}
          {isAdmin && (
            <div className="card" id="adminSection">
              <h3>System Overview Stats</h3>
              <div className="profile-stats-grid stats-3-col">
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold" }} id="totalUsers">{adminStats.totalUsers}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Users</div>
                </div>
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold" }} id="totalProjectsAdmin">{adminStats.totalProjects}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Global Projects</div>
                </div>
                <div style={{ padding: "15px", background: "var(--bg-subtle)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--red-500)" }} id="delayedProjectsAdmin">{adminStats.delayedProjects}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>System Delays</div>
                </div>
              </div>
            </div>
          )}

          {/* RECENT ACTIVITY LOGS */}
          <div className="card">
            <h3>Recent System Activities</h3>
            <div id="recentActivity" style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "15px" }}>
              {recentActivity.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No recent activity logs.</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>{activity.message}</p>
                    <small style={{ color: "var(--text-secondary)" }}>{new Date(activity.createdAt).toLocaleString()}</small>
                    <hr style={{ opacity: 0.15, marginTop: "10px" }} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
