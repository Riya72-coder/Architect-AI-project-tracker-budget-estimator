import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import "../css/style.css";

// Register ChartJS modules
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement,
  Filler
);

export default function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [daysLeftText, setDaysLeftText] = useState("--");
  const [daysLeftColor, setDaysLeftColor] = useState("var(--text-primary)");
  const [healthStatusColor, setHealthStatusColor] = useState("var(--text-primary)");
  
  // Budget Estimator state
  const [projectType, setProjectType] = useState("");
  const [area, setArea] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const viewMode = localStorage.getItem("viewMode");
  const isAdminView = role === "ADMIN" && viewMode === "admin";

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

    // Auto-refresh stats every 5s if in admin mode, or set listener on window focus
    const focusHandler = () => {
      loadTasks();
    };
    window.addEventListener("focus", focusHandler);

    let interval;
    if (isAdminView) {
      interval = setInterval(loadTasks, 5000);
    }

    return () => {
      window.removeEventListener("focus", focusHandler);
      if (interval) clearInterval(interval);
    };
  }, [projectId, token, navigate]);

  const loadProject = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/id/${projectId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to fetch project");
      const p = await res.json();
      setProject(p);

      // Process deadline
      if (p.deadline) {
        const dateOnly = p.deadline.split("T")[0];
        const diff = new Date(dateOnly) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (days < 0) {
          setDaysLeftText("🚨 Deadline Passed");
          setDaysLeftColor("var(--red-500)");
        } else if (days <= 2) {
          setDaysLeftText(`⚠️ ${days} days left`);
          setDaysLeftColor("var(--amber-500)");
        } else {
          setDaysLeftText(`${days} days left`);
          setDaysLeftColor("var(--text-primary)");
        }
      }

      // Process project health status color
      if (p.status) {
        if (p.status === "Completed") setHealthStatusColor("#22c55e");
        else if (p.status === "In Progress") setHealthStatusColor("#3b82f6");
        else if (p.status === "Pending") setHealthStatusColor("#f59e0b");
        else if (p.status === "Delayed") setHealthStatusColor("#ef4444");
      }
    } catch (err) {
      console.error(err);
      navigate("/projects");
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/project/${projectId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      // Sort tasks: newest first
      const sortedTasks = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTasks(sortedTasks);
    } catch (err) {
      console.error(err);
    }
  };

  // 3D Model logic
  const getModelFromText = (text) => {
    if (!text) return "/models/default/default.glb";
    const cleanText = text.toLowerCase();
    const words = cleanText.replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    const has = (w) => words.includes(w);

    if (has("school")) return "/models/public/school1.glb";
    if (has("college")) return "/models/public/college1.glb";
    if (has("hospital")) return "/models/public/hospital1.glb";
    if (has("hotel")) return "/models/commercial/hotel1.glb";
    if (has("mall")) return "/models/commercial/mall1.glb";
    if (has("office")) return "/models/commercial/office1.glb";
    if (has("warehouse")) return "/models/industrial/warehouse1.glb";
    if (has("factory")) return "/models/industrial/factory1.glb";
    if (has("villa")) return "/models/residential/villa1.glb";
    if (has("apartment") || has("flat") || cleanText.includes("residential complex")) return "/models/residential/apartment1.glb";
    if (has("house") || has("home")) return "/models/residential/house1.glb";
    if (has("interior") || has("room") || has("3bhk")) return "/models/interior/room1.glb";
    if (has("bridge")) return "/models/construction/bridge1.glb";
    if (has("road")) return "/models/construction/road1.glb";
    if (has("building")) return "/models/construction/building1.glb";
    if (has("garden")) return "/models/outdoor/garden1.glb";
    if (has("park")) return "/models/outdoor/park1.glb";

    return "/models/default/default.glb";
  };

  // Math stats
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Risk logic
  let riskText = "Low Risk ✅";
  let riskClass = "low-risk";
  if (progress < 30) {
    riskText = "High Risk ❌";
    riskClass = "high-risk";
  } else if (progress < 70) {
    riskText = "Medium Risk ⚠️";
    riskClass = "medium-risk";
  }

  // Timeline logic
  let timelineStage = "Planning";
  if (progress === 0) timelineStage = "Planning";
  else if (progress < 100) timelineStage = "Execution";
  else timelineStage = "Completed";

  // Budget Estimation handler
  const handleEstimateBudget = () => {
    if (!projectType || !area) {
      alert("Please fill in project type and area sq ft ❌");
      return;
    }
    const rate = projectType === "Residential" ? 1500 : 2500;
    const cost = parseFloat(area) * rate;
    setEstimatedCost(cost);
  };

  // Charts configurations
  const doughnutData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [{
      data: [completed, inProgress, pending],
      backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b"],
      borderWidth: 1,
    }]
  };

  const barData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [{
      label: "Number of Tasks",
      data: [completed, inProgress, pending],
      backgroundColor: ["#16a34a", "#2563eb", "#d97706"],
    }]
  };

  const lineData = {
    labels: ["Start", "Mid", "Now"],
    datasets: [{
      label: "Progress %",
      data: [Math.max(progress - 20, 0), Math.max(progress - 10, 0), progress],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    }]
  };

  if (!project) return <div style={{ display: "flex", justifyContent: "center", padding: "50px", fontSize: "1.2rem" }}>Loading project dashboard...</div>;

  const modelPath = getModelFromText(project.name + " " + (project.description || ""));

  return (
    <main className="dashboard dashboard-page">
      
      {/* Eye-catching admin view alert banner */}
      {isAdminView && (
        <div style={{ background: "var(--red-500)", color: "white", padding: "12px", textAlign: "center", borderRadius: "8px", fontWeight: "bold", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "var(--shadow-sm)" }}>
          <i className="fa-solid fa-eye"></i> 👁️ Admin View Mode (Read Only)
        </div>
      )}

      {/* PREMIUM HEADER */}
      <section className="project-header dashboard-header">
        <div className="project-left">
          <h1 id="projectName" style={{ margin: "0 0 10px 0" }}>{project.name}</h1>
          <p className="desc" id="projectDesc" style={{ color: "var(--text-secondary)", maxWidth: "800px", marginBottom: "15px" }}>
            {project.description || "No project description provided."}
          </p>

          <div className="project-meta">
            <span>📅 Deadline: <b id="projectDeadline">{project.deadline ? project.deadline.split("T")[0] : "--"}</b></span>
            <span>⏳ Timeframe: <b id="daysLeft" style={{ color: daysLeftColor }}>{daysLeftText}</b></span>
            {project.userEmail && (
              <span className="role">👤 Architect: <b>{project.userEmail.split("@")[0].toUpperCase()}</b></span>
            )}
            <span className="status" id="healthStatus" style={{ color: healthStatusColor, fontWeight: 600 }}>
              {project.status || "Pending"}
            </span>
          </div>
        </div>

        <div className="project-right">
          <Link to={isAdminView ? "/admin" : "/projects"} className="back-btn">
            ← Back
          </Link>
        </div>
      </section>

      {/* ANALYTICS GRID */}
      <div className="dashboard-grid">
        
        {/* Project Health progress */}
        <div className="card">
          <h3>Project Health</h3>
          <p id="progressText" style={{ fontSize: "1.5rem", fontWeight: 700, margin: "10px 0" }}>{progress}% Completed</p>
          <div className="progress-bar" style={{ background: "var(--bg-subtle)", borderRadius: "10px", height: "12px", overflow: "hidden" }}>
            <div id="progressBar" style={{ width: `${progress}%`, background: "var(--green-500)", height: "100%", transition: "width 0.4s" }}></div>
          </div>
        </div>

        {/* Task Counter */}
        <div className="card">
          <h3>Task Stats</h3>
          <div style={{ marginTop: "15px" }}>
            <p style={{ margin: "5px 0" }}>Total Tasks: <b id="totalTasks" style={{ fontSize: "1.1rem" }}>{total}</b></p>
            <p style={{ margin: "5px 0" }}>Completed: <b id="completedTasks" style={{ color: "var(--green-600)", fontSize: "1.1rem" }}>{completed}</b></p>
            <p style={{ margin: "5px 0" }}>Pending: <b id="pendingTasks" style={{ color: "var(--amber-500)", fontSize: "1.1rem" }}>{pending}</b></p>
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ alignSelf: "flex-start", marginBottom: "15px" }}>Task Distribution</h3>
          <div style={{ width: "100%", maxHeight: "200px", display: "flex", justifyContent: "center" }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3>Task Comparison</h3>
          <div style={{ height: "200px", marginTop: "15px" }}>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Line Chart */}
        <div className="card">
          <h3>Progress Trend</h3>
          <div style={{ height: "200px", marginTop: "15px" }}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* AI Risk Alert */}
        <div className="card">
          <h3>⚠️ AI Risk Alerts</h3>
          <ul id="riskList" style={{ listStyleType: "none", padding: 0, marginTop: "15px" }}>
            <li className={riskClass} style={{ padding: "10px 15px", borderRadius: "8px", background: progress < 30 ? "var(--red-100)" : progress < 70 ? "var(--amber-100)" : "var(--green-100)", color: progress < 30 ? "var(--red-700-text)" : progress < 70 ? "var(--amber-700-text)" : "var(--green-700-text)", fontWeight: 600 }}>
              {riskText}
            </li>
          </ul>
        </div>

        {/* Timeline Status */}
        <div className="card">
          <h3>Project Timeline</h3>
          <ul id="timelineStatus" style={{ listStyleType: "none", padding: 0, marginTop: "15px" }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "var(--green-500)" }}></i> Planning
            </li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", opacity: timelineStage !== "Planning" ? 1 : 0.4 }}>
              <i className={timelineStage !== "Planning" ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: timelineStage !== "Planning" ? "var(--green-500)" : "var(--text-secondary)" }}></i> Execution
            </li>
            <li style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: "10px", opacity: timelineStage === "Completed" ? 1 : 0.4 }}>
              <i className={timelineStage === "Completed" ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} style={{ color: timelineStage === "Completed" ? "var(--green-500)" : "var(--text-secondary)" }}></i> Handover & Completion
            </li>
          </ul>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h3>Recent Tasks</h3>
          <ul id="recentTasks" style={{ listStyleType: "none", padding: 0, marginTop: "15px" }}>
            {tasks.length === 0 ? (
              <li style={{ color: "var(--text-secondary)" }}>No tasks yet</li>
            ) : (
              tasks.slice(0, 4).map((t) => {
                const statusColor = t.status === "Completed"
                  ? "var(--green-500)"
                  : t.status === "In Progress"
                  ? "var(--blue-500)"
                  : "var(--amber-500)";

                return (
                  <li key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500 }}>{t.title || t.name}</span>
                    <span style={{ color: statusColor, fontSize: "0.85rem", fontWeight: 600 }}>{t.status}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Team Utilization */}
        <div className="card">
          <h3>Team Utilization</h3>
          <div id="teamUtilization" style={{ marginTop: "15px" }}>
            <p style={{ margin: "5px 0" }}>Workload assigned: <b>{total} tasks</b></p>
            <p style={{ margin: "5px 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Workforce is currently managing tasks assigned to this project context.
            </p>
          </div>
        </div>

        {/* Budget Estimator */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3>Budget Estimator</h3>
          <select 
            id="projectType" 
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            disabled={isAdminView}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
          >
            <option value="">Select Type</option>
            <option value="Residential">Residential (₹1,500/sq ft)</option>
            <option value="Commercial">Commercial (₹2,500/sq ft)</option>
          </select>

          <input 
            type="number" 
            id="area" 
            placeholder="Enter Area (sq ft)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            disabled={isAdminView}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
          />
          <button 
            id="estimateBtn" 
            onClick={handleEstimateBudget}
            disabled={isAdminView}
            className="btn-send"
            style={{ height: "40px", border: "none", cursor: isAdminView ? "default" : "pointer" }}
          >
            Estimate Budget
          </button>

          {estimatedCost !== null && (
            <p id="estimateResult" style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--green-600)", margin: 0 }}>
              Estimated Cost: ₹ {estimatedCost.toLocaleString()}
            </p>
          )}
        </div>

        {/* 3D Model View */}
        <div className="card card-render-3d">
          <h3>3D Architectural Render</h3>
          <div className="model-viewer-wrapper" style={{ marginTop: "15px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
            <model-viewer 
              id="modelViewer"
              src={modelPath}
              alt="3D Architectural Model"
              auto-rotate
              camera-controls
              style={{ width: "100%", height: "350px", backgroundColor: "#0f172a" }}>
            </model-viewer>
          </div>
        </div>

      </div>

    </main>
  );
}
