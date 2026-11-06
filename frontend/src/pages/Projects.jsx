import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [userFilterOptions, setUserFilterOptions] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form fields for Add/Edit
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDeadline, setProjectDeadline] = useState("");
  const [projectStatus, setProjectStatus] = useState("Pending");
  const [projectImage, setProjectImage] = useState(null);
  const [currentEditId, setCurrentEditId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Load User info
    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        loadProjects(data);
      })
      .catch((err) => {
        console.error(err);
        localStorage.clear();
        navigate("/login");
      });
  }, [token, navigate]);

  // Load Projects from backend
  const loadProjects = async (currentUser) => {
    try {
      const url = currentUser.role === "ADMIN"
        ? `${API_BASE_URL}/api/projects/all`
        : `${API_BASE_URL}/api/projects/${currentUser.email}`;

      const res = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();

      setProjects(data || []);
      setFilteredProjects(data || []);

      if (currentUser.role === "ADMIN") {
        const uniqueEmails = [...new Set(data.map((p) => p.userEmail))];
        setUserFilterOptions(uniqueEmails);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  // Handle Search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      applyFilters(projects, selectedUserFilter);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/projects/search?query=${searchQuery}`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => {
          applyFilters(data, selectedUserFilter);
        })
        .catch((err) => console.error("Search error:", err));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, projects, selectedUserFilter]);

  const applyFilters = (projectList, userFilter) => {
    let result = projectList || [];
    if (user && user.role === "ADMIN" && userFilter !== "all") {
      result = result.filter((p) => p.userEmail === userFilter);
    }
    setFilteredProjects(result);
  };

  const handleUserFilterChange = (e) => {
    const selected = e.target.value;
    setSelectedUserFilter(selected);
    applyFilters(projects, selected);
  };

  // Status visual class helper
  const formatStatusClass = (status) => {
    if (!status) return "pending";
    const s = status.toLowerCase();
    if (s.includes("track") || s.includes("completed")) return "ontrack";
    if (s.includes("delay")) return "delayed";
    if (s.includes("progress")) return "progress";
    return "pending";
  };

  // Delete Project
  const handleDeleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setFilteredProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Delete failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
    }
  };

  // Add Project Submit
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Project Name is required!");
      return;
    }

    const formData = new FormData();
    let finalStatus = projectStatus;
    const today = new Date().toISOString().split("T")[0];
    if (projectDeadline && projectDeadline < today && projectStatus !== "Completed") {
      finalStatus = "Delayed";
    }

    formData.append("name", projectName);
    formData.append("description", projectDesc);
    formData.append("deadline", projectDeadline);
    formData.append("status", finalStatus);
    if (projectImage) {
      formData.append("image", projectImage);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/add`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      if (res.ok) {
        alert("Project added successfully ✅");
        setShowAddModal(false);
        // Reset fields
        setProjectName("");
        setProjectDesc("");
        setProjectDeadline("");
        setProjectStatus("Pending");
        setProjectImage(null);
        // Reload
        loadProjects(user);
      } else {
        const errorText = await res.text();
        alert("❌ " + errorText);
      }
    } catch (err) {
      console.error(err);
      alert("Server error ❌");
    }
  };

  // Open Edit Modal
  const openEditProject = (e, p) => {
    e.stopPropagation();
    setCurrentEditId(p.id);
    setProjectName(p.name || "");
    setProjectDesc(p.description || "");
    setProjectDeadline(p.deadline ? p.deadline.split("T")[0] : "");
    setProjectStatus(p.status || "Pending");
    setShowEditModal(true);
  };

  // Edit Project Submit
  const handleEditProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const formData = new FormData();
    let finalStatus = projectStatus;
    const today = new Date().toISOString().split("T")[0];
    if (projectDeadline && projectDeadline < today && projectStatus !== "Completed") {
      finalStatus = "Delayed";
    }

    formData.append("name", projectName);
    formData.append("description", projectDesc);
    formData.append("deadline", projectDeadline);
    formData.append("status", finalStatus);
    if (projectImage) {
      formData.append("image", projectImage);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/update/${currentEditId}`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token },
        body: formData,
      });

      if (res.ok) {
        alert("Project updated successfully ✅");
        setShowEditModal(false);
        setProjectImage(null);
        loadProjects(user);
      } else {
        alert("Update failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Update failed ❌");
    }
  };

  if (!user) return <div style={{ display: "flex", justifyContent: "center", padding: "50px", fontSize: "1.2rem" }}>Loading dashboard...</div>;

  const isAdmin = user.role === "ADMIN";

  return (
    <main className="dashboard project-dashboard">
      <header className="project-header">
        <div className="project-header-title">
          <h1 style={{ margin: 0 }}>{isAdmin ? "All Projects" : "Your Projects"}</h1>
        </div>

        {/* Dynamic header items */}
        <div className="project-header-actions">
          {/* SEARCH */}
          <div className="navbar-search project-search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* ADMIN FILTER */}
          {isAdmin && (
            <select
              id="userFilter"
              value={selectedUserFilter}
              onChange={handleUserFilterChange}
              className="user-filter-select"
            >
              <option value="all">All Users</option>
              {userFilterOptions.map((email) => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          )}

          {!isAdmin && (
            <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
              <i className="fa-solid fa-plus"></i> Add Project
            </button>
          )}
        </div>
      </header>

      {/* PROJECTS GRID */}
      <div className="project-grid" id="projectGrid">
        {filteredProjects.length === 0 ? (
          <div className="project-card empty-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
            <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>No projects found 🚀</p>
            <p style={{ fontSize: "12px", opacity: 0.7 }}>
              {isAdmin ? "There are no projects created by users yet." : "Click Add Project to get started!"}
            </p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isOwner = p.userEmail === user.email;
            const imgSrc = p.image && !p.image.includes("default")
              ? `${API_BASE_URL}/uploads/${p.image}`
              : "/images/default.png";

            return (
              <div
                key={p.id}
                className="project-card"
                onClick={() => {
                  if (isAdmin) {
                    // Admins get read-only dashboard with viewMode parameter
                    localStorage.setItem("viewMode", "admin");
                    navigate(`/dashboard/${p.id}`);
                  } else {
                    localStorage.removeItem("viewMode");
                    navigate(`/dashboard/${p.id}`);
                  }
                }}
                style={{ cursor: "pointer", position: "relative" }}
              >
                {(isOwner || isAdmin) && (
                  <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, display: "flex", gap: "5px" }}>
                    <button
                      className="edit-btn"
                      onClick={(e) => openEditProject(e, p)}
                      style={{ background: "rgba(255, 255, 255, 0.9)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}
                    >
                      <i className="fa-solid fa-pen" style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}></i>
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteProject(e, p.id)}
                      style={{ background: "rgba(255, 255, 255, 0.9)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}
                    >
                      <i className="fa-solid fa-trash" style={{ color: "var(--red-500)", fontSize: "0.8rem" }}></i>
                    </button>
                  </div>
                )}

                <img src={imgSrc} className="project-card-img" alt="Project" style={{ width: "100%", height: "180px", objectFit: "cover", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }} />

                <div className="project-card-content" style={{ padding: "15px" }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>{p.name}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "15px", minHeight: "40px" }}>
                    {p.description ? p.description.substring(0, 60) + (p.description.length > 60 ? "..." : "") : "No description provided."}
                  </p>

                  {isAdmin && (
                    <div className="project-owner" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "10px" }}>
                      👤 Owner: <b>{p.userEmail}</b>
                    </div>
                  )}

                  <div className="project-extra" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className={`status ${formatStatusClass(p.status)}`}>
                      {p.status || "Pending"}
                    </span>
                    <span className="deadline" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      ⏰ {p.deadline ? p.deadline.split("T")[0] : "No Deadline"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* + ADD PROJECT CARD — only for non-admin users */}
        {!isAdmin && (
          <div
            className="project-card add-project-card"
            onClick={() => setShowAddModal(true)}
            title="Add new project"
          >
            <div className="add-project-inner">
              <div className="add-project-icon">
                <i className="fa-solid fa-plus"></i>
              </div>
              <span className="add-project-label">New Project</span>
            </div>
          </div>
        )}
      </div>

      {/* ADD PROJECT MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Project</h2>
            <form onSubmit={handleAddProject}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Project Name:</label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Description:</label>
                <textarea
                  placeholder="Enter project description"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows="3"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "none" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Deadline:</label>
                <input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Status:</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Project Image (Optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProjectImage(e.target.files[0])}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-send" style={{ padding: "10px 20px", borderRadius: "8px", background: "var(--green-500)", color: "white", border: "none", cursor: "pointer" }}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Edit Project</h2>
            <form onSubmit={handleEditProject}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Project Name:</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Description:</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows="3"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "none" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Deadline:</label>
                <input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Status:</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Update Image (Optional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProjectImage(e.target.files[0])}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-send" style={{ padding: "10px 20px", borderRadius: "8px", background: "var(--green-500)", color: "white", border: "none", cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
