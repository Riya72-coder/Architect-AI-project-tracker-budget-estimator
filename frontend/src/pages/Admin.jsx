import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Admin() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, totalUsers: 0, pendingProjects: 0 });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!token || role !== "ADMIN") {
      alert("Unauthorized Access! ❌");
      navigate("/projects");
      return;
    }

    loadAdminUser();
    loadStats();
    loadUsers();
    loadProjects();
    loadContactMessages();
  }, [token, role, navigate]);

  const loadAdminUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setStats({
        totalProjects: data.projects || 0,
        totalTasks: data.tasks || 0,
        totalUsers: data.users || 0,
        pendingProjects: data.pendingProjects || 0, // Fallback
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/projects`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadContactMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      // Reverse to show newest messages first
      setMessages((data || []).reverse());
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle user role (ADMIN <-> USER)
  const handleToggleRole = async (u) => {
    const newRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    if (!window.confirm(`Change role of ${u.name} to ${newRole}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${u.id}/role`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        alert("Role updated ✅");
        loadUsers();
      } else {
        alert("Role update failed ❌");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        alert("User Deleted 🗑️");
        loadUsers();
        loadStats();
      } else {
        alert("Delete failed ❌");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete project?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        alert("Project Deleted 🗑️");
        loadProjects();
        loadStats();
      } else {
        alert("Delete failed ❌");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open edit modal for project
  const openEditModal = (p) => {
    setCurrentEditId(p.id);
    setEditName(p.name || "");
    setEditDeadline(p.deadline ? p.deadline.split("T")[0] : "");
    setEditStatus(p.status || "Pending");
    setShowEditModal(true);
  };

  // Edit Project Submit
  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const formData = new FormData();
    formData.append("name", editName);
    formData.append("deadline", editDeadline);
    formData.append("status", editStatus);

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/update/${currentEditId}`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });
      if (res.ok) {
        alert("Project Updated ✅");
        setShowEditModal(false);
        loadProjects();
      } else {
        alert("Update failed ❌");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProject = (p) => {
    localStorage.setItem("viewMode", "admin");
    navigate(`/dashboard/${p.id}`);
  };

  return (
    <main className="dashboard admin-page">
      <header className="project-header">
        <h1 style={{ margin: 0 }}>Admin Control Panel</h1>
        <button onClick={() => navigate("/projects")} className="back-btn">
          Back to Projects
        </button>
      </header>

      {/* STATS OVERVIEW CARDS */}
      <section className="admin-stats-grid" style={{ marginBottom: "30px" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Total Projects</h3>
          <span style={{ fontSize: "2rem", fontWeight: 700, marginTop: "5px" }}>{stats.totalProjects}</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Total Tasks</h3>
          <span style={{ fontSize: "2rem", fontWeight: 700, marginTop: "5px", color: "var(--blue-500)" }}>{stats.totalTasks}</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Total Users</h3>
          <span style={{ fontSize: "2rem", fontWeight: 700, marginTop: "5px", color: "var(--green-600)" }}>{stats.totalUsers}</span>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Pending Projects</h3>
          <span style={{ fontSize: "2rem", fontWeight: 700, marginTop: "5px", color: "var(--amber-500)" }}>{stats.pendingProjects}</span>
        </div>
      </section>

      {/* USER MANAGEMENT SECTION */}
      <section className="card" style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "15px" }}>User Database</h2>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>ID</th>
                <th style={{ padding: "12px" }}>Name</th>
                <th style={{ padding: "12px" }}>Email</th>
                <th style={{ padding: "12px" }}>Company</th>
                <th style={{ padding: "12px" }}>Role</th>
                <th style={{ padding: "12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser && currentUser.email === u.email;
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px" }}>{u.id}</td>
                    <td style={{ padding: "12px" }}>{u.name}</td>
                    <td style={{ padding: "12px" }}>{u.email}</td>
                    <td style={{ padding: "12px" }}>{u.company}</td>
                    <td style={{ padding: "12px" }}>
                      <span className={`role-badge ${u.role === "ADMIN" ? "admin" : "user"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => handleToggleRole(u)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        {u.role === "ADMIN" ? "Make User" : "Make Admin"}
                      </button>
                      {!isSelf && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--red-300)", background: "var(--red-100)", color: "var(--red-700-text)", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* PROJECT MANAGEMENT SECTION */}
      <section className="card" style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "15px" }}>Architectural Projects</h2>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Owner Email</th>
                <th style={{ padding: "12px" }}>Name</th>
                <th style={{ padding: "12px" }}>Deadline</th>
                <th style={{ padding: "12px" }}>Status</th>
                <th style={{ padding: "12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px" }}>{p.userEmail}</td>
                  <td style={{ padding: "12px" }}><b>{p.name}</b></td>
                  <td style={{ padding: "12px" }}>{p.deadline ? p.deadline.split("T")[0] : "--"}</td>
                  <td style={{ padding: "12px" }}>
                    <span className="status ontrack" style={{ background: p.status === "Completed" ? "var(--green-100)" : p.status === "Delayed" ? "var(--red-100)" : "var(--blue-100)", color: p.status === "Completed" ? "var(--green-700-text)" : p.status === "Delayed" ? "var(--red-700-text)" : "var(--blue-700-text)" }}>
                      {p.status || "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => handleViewProject(p)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--blue-500)", color: "white", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => openEditModal(p)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--red-300)", background: "var(--red-100)", color: "var(--red-700-text)", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CONTACT INQUIRIES */}
      <section className="card">
        <h2 style={{ fontSize: "1.2rem", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "15px" }}>User Feedback & Contact Requests</h2>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                <th style={{ padding: "12px", width: "20%" }}>Sender</th>
                <th style={{ padding: "12px", width: "25%" }}>Email</th>
                <th style={{ padding: "12px", width: "40%" }}>Message</th>
                <th style={{ padding: "12px", width: "15%" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>No feedback messages found</td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px" }}>{m.name}</td>
                    <td style={{ padding: "12px" }}>{m.email}</td>
                    <td style={{ padding: "12px", whiteSpace: "pre-wrap" }}>{m.message}</td>
                    <td style={{ padding: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {m.time ? new Date(m.time).toLocaleString() : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PROJECT EDIT MODAL */}
      {showEditModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Edit Project (Admin Override)</h2>
            <form onSubmit={handleEditProject}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Project Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Deadline:</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Status:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-send" style={{ padding: "10px 20px", borderRadius: "8px", background: "var(--green-500)", color: "white", border: "none", cursor: "pointer" }}>Override Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
