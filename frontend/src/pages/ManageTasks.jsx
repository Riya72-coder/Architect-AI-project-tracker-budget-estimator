import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../css/style.css";
import { API_BASE_URL } from "../config";

export default function ManageTasks() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);

  // Form Fields
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigned, setTaskAssigned] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskCost, setTaskCost] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskStatus, setTaskStatus] = useState("Pending");
  const [taskProgress, setTaskProgress] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!projectId) {
      navigate("/projects");
      return;
    }

    loadProject();
    loadTasks();
  }, [projectId, token, navigate]);

  const loadProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/id/${projectId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/project/${projectId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setTasks(data || []);
      applyFilter(data, activeFilter);
    } catch (err) {
      console.error(err);
      alert("Error loading tasks ❌");
    }
  };

  const applyFilter = (taskList, filter) => {
    if (filter === "all") {
      setFilteredTasks(taskList);
    } else {
      setFilteredTasks(taskList.filter((t) => t.status === filter));
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(tasks, filter);
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        alert("Task Deleted 🗑️");
        loadTasks();
      } else {
        alert("Delete failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed ❌");
    }
  };

  // Add Task submit
  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) {
      alert("Task name is required!");
      return;
    }

    let progressVal = parseInt(taskProgress) || 0;
    if (taskStatus === "Completed") {
      progressVal = 100;
    }

    const taskData = {
      name: taskName,
      description: taskDesc,
      assignedTo: taskAssigned,
      startDate: taskStartDate,
      deadline: taskDeadline,
      cost: parseFloat(taskCost) || 0,
      priority: taskPriority,
      status: taskStatus,
      progress: progressVal,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/add/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        alert("Task Added Successfully ✅");
        setShowAddModal(false);
        // Reset form
        setTaskName("");
        setTaskDesc("");
        setTaskAssigned("");
        setTaskStartDate("");
        setTaskDeadline("");
        setTaskCost("");
        setTaskPriority("Medium");
        setTaskStatus("Pending");
        setTaskProgress(0);
        // Reload
        loadTasks();
      } else {
        const text = await res.text();
        alert("Error: " + text);
      }
    } catch (err) {
      console.error(err);
      alert("Error adding task ❌");
    }
  };

  // Open Edit Task modal
  const openEditTask = (task) => {
    setCurrentEditId(task.id);
    setTaskName(task.name || "");
    setTaskDesc(task.description || "");
    setTaskAssigned(task.assignedTo || "");
    setTaskStartDate(task.startDate || "");
    setTaskDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    setTaskCost(task.cost || "");
    setTaskPriority(task.priority || "Medium");
    setTaskStatus(task.status || "Pending");
    setTaskProgress(task.progress || 0);
    setShowEditModal(true);
  };

  // Edit Task submit
  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    let progressVal = parseInt(taskProgress) || 0;
    if (taskStatus === "Completed") {
      progressVal = 100;
    }

    const updatedTask = {
      name: taskName,
      description: taskDesc,
      assignedTo: taskAssigned,
      startDate: taskStartDate,
      deadline: taskDeadline,
      cost: parseFloat(taskCost) || 0,
      priority: taskPriority,
      status: taskStatus,
      progress: progressVal,
      projectId: parseInt(projectId),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${currentEditId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(updatedTask),
      });

      if (res.ok) {
        alert("Task Updated Successfully ✅");
        setShowEditModal(false);
        loadTasks();
      } else {
        alert("Update failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating task ❌");
    }
  };

  return (
    <main className="dashboard tasks-page">
      <header className="project-header">
        <div className="project-header-title">
          <h1 style={{ margin: 0 }}>Manage Tasks</h1>
          <p style={{ margin: "5px 0 0 0", color: "var(--text-secondary)" }}>
            Project: <b>{project?.name || "Loading..."}</b>
          </p>
        </div>

        <div className="project-header-actions">
          <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
            <i className="fa-solid fa-plus"></i> Add Task
          </button>
          <Link to={`/dashboard/${projectId}`} className="back-btn">
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* FILTER BUTTONS */}
      <div className="task-filters">
        <button 
          onClick={() => handleFilterChange("all")} 
          style={{ padding: "8px 15px", borderRadius: "8px", border: "1px solid var(--border)", background: activeFilter === "all" ? "var(--green-500)" : "white", color: activeFilter === "all" ? "white" : "var(--text-primary)", cursor: "pointer", transition: "0.2s" }}
        >
          All
        </button>
        <button 
          onClick={() => handleFilterChange("Pending")} 
          style={{ padding: "8px 15px", borderRadius: "8px", border: "1px solid var(--border)", background: activeFilter === "Pending" ? "var(--amber-500)" : "white", color: activeFilter === "Pending" ? "white" : "var(--text-primary)", cursor: "pointer", transition: "0.2s" }}
        >
          Pending
        </button>
        <button 
          onClick={() => handleFilterChange("In Progress")} 
          style={{ padding: "8px 15px", borderRadius: "8px", border: "1px solid var(--border)", background: activeFilter === "In Progress" ? "var(--blue-500)" : "white", color: activeFilter === "In Progress" ? "white" : "var(--text-primary)", cursor: "pointer", transition: "0.2s" }}
        >
          In Progress
        </button>
        <button 
          onClick={() => handleFilterChange("Completed")} 
          style={{ padding: "8px 15px", borderRadius: "8px", border: "1px solid var(--border)", background: activeFilter === "Completed" ? "var(--green-500)" : "white", color: activeFilter === "Completed" ? "white" : "var(--text-primary)", cursor: "pointer", transition: "0.2s" }}
        >
          Completed
        </button>
      </div>

      {/* TASKS LIST */}
      <div id="taskContainer" className="task-grid">
        {filteredTasks.length === 0 ? (
          <p style={{ gridColumn: "span 3", textAlign: "center", color: "var(--text-secondary)", padding: "40px" }}>No tasks found 🚀</p>
        ) : (
          filteredTasks.map((task) => {
            const statusClass = task.status ? task.status.toLowerCase().replace(" ", "-") : "pending";
            return (
              <div key={task.id} className="task-card" style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="task-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{task.name}</h3>
                  <span className={`status ${statusClass}`}>
                    {task.status}
                  </span>
                </div>

                <p className="task-desc" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", minHeight: "40px", margin: 0 }}>
                  {task.description || "No description provided."}
                </p>

                <div className="task-details" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div>👤 Assigned: <b>{task.assignedTo || "-"}</b></div>
                  <div>📆 Start: {task.startDate || "-"}</div>
                  <div>⏳ Deadline: {task.deadline ? task.deadline.split("T")[0] : "-"}</div>
                </div>

                <div className="task-extra" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  💰 Budget: ₹{task.cost ? task.cost.toLocaleString() : 0}
                </div>

                <div className="progress-bar" style={{ height: "6px", background: "var(--bg-subtle)", borderRadius: "3px", overflow: "hidden", marginTop: "5px" }}>
                  <div className="progress-fill" style={{ width: `${task.progress || 0}%`, background: "var(--green-500)", height: "100%" }}></div>
                </div>
                <small style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{task.progress || 0}% completed</small>

                <div className="actions" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button onClick={() => openEditTask(task)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "white", cursor: "pointer", transition: "0.2s" }}>✏️ Edit</button>
                  <button onClick={() => handleDeleteTask(task.id)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--red-300)", background: "var(--red-100)", color: "var(--red-700-text)", cursor: "pointer", transition: "0.2s" }}>🗑️ Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Task</h2>
            <form onSubmit={handleAddTaskSubmit}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Task Name:</label>
                <input
                  type="text"
                  placeholder="Enter task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Description:</label>
                <textarea
                  placeholder="Enter task description"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows="3"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "none" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Assigned To:</label>
                <input
                  type="text"
                  placeholder="Employee name or email"
                  value={taskAssigned}
                  onChange={(e) => setTaskAssigned(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Start Date:</label>
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(e) => setTaskStartDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Deadline:</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Budget Cost (₹):</label>
                <input
                  type="number"
                  placeholder="Task cost"
                  value={taskCost}
                  onChange={(e) => setTaskCost(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Priority:</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Status:</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Progress (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => setTaskProgress(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-send" style={{ padding: "10px 20px", borderRadius: "8px", background: "var(--green-500)", color: "white", border: "none", cursor: "pointer" }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && (
        <div className="modal-backdrop" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ background: "white", padding: "30px", borderRadius: "12px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Edit Task</h2>
            <form onSubmit={handleEditTaskSubmit}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Task Name:</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Description:</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows="3"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", resize: "none" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Assigned To:</label>
                <input
                  type="text"
                  value={taskAssigned}
                  onChange={(e) => setTaskAssigned(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Start Date:</label>
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(e) => setTaskStartDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Deadline:</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Budget Cost (₹):</label>
                <input
                  type="number"
                  value={taskCost}
                  onChange={(e) => setTaskCost(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Priority:</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Status:</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Progress (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => setTaskProgress(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="btn-send" style={{ padding: "10px 20px", borderRadius: "8px", background: "var(--green-500)", color: "white", border: "none", cursor: "pointer" }}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
