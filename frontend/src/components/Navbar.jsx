import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState(null); // for inline informational expand
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const viewMode = localStorage.getItem("viewMode");

  // Auto-close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Extract active project id from query params or path params
  const queryParams = new URLSearchParams(location.search);
  const activeProjectId = projectId || queryParams.get("projectId") || queryParams.get("id");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        loadNotifications(data);
      })
      .catch((err) => {
        console.error("❌ User fetch failed:", err);
        localStorage.clear();
        navigate("/login");
      });
  }, [token]);

  // Periodic notification fetch
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadNotifications(user);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
        setExpandedNotifId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async (currentUser) => {
    if (!currentUser) return;
    try {
      let url = "";
      if (currentUser.role === "ADMIN") {
        url = `${API_BASE_URL}/api/notifications/admin`;
      } else {
        url = `${API_BASE_URL}/api/notifications/${currentUser.email}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error("Notification load error:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read/${id}`, {
        method: "PUT",
      });
      loadNotifications(user);
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  // Determine if a notification is "actionable" (has a deep-link destination).
  // Primary: use linkUrl field from backend.
  // Fallback: classify by message prefix for old notifications that pre-date the linkUrl column.
  const ACTIONABLE_PREFIXES = [
    "New Project Added:",
    "Project Updated:",
    "New Task Assigned:",
    "Task Updated:",
    "New Task Created:",
  ];
  const isNotifActionable = (notif) => {
    if (notif.linkUrl) return true;
    return ACTIONABLE_PREFIXES.some((prefix) => notif.message?.startsWith(prefix));
  };

  // Build a best-effort fallback link for old notifications without linkUrl
  const getFallbackLink = (notif) => {
    if (notif.linkUrl) return notif.linkUrl;
    const msg = notif.message || "";
    if (msg.startsWith("New Task Assigned:") || msg.startsWith("Task Updated:") || msg.startsWith("New Task Created:")) {
      return "/projects"; // can't know projectId from message alone → land on projects list
    }
    if (msg.startsWith("New Project Added:") || msg.startsWith("Project Updated:")) {
      return "/projects"; // same fallback
    }
    return null;
  };

  // Smart click: deep-link (actionable) OR expand inline (informational)
  const handleNotificationClick = async (notif) => {
    const actionable = isNotifActionable(notif);
    if (actionable) {
      // ✅ ACTIONABLE — mark read + navigate
      await markAsRead(notif.id);
      setShowNotifDropdown(false);
      setExpandedNotifId(null);
      const link = notif.linkUrl || getFallbackLink(notif);
      navigate(link);
    } else {
      // ℹ️ INFORMATIONAL — toggle expand inline
      setExpandedNotifId((prev) => (prev === notif.id ? null : notif.id));
      await markAsRead(notif.id);
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      await markAsRead(n.id);
    }
    setExpandedNotifId(null);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/login");
  };

  const avatarUrl = user?.profilePic && user.profilePic !== "null"
    ? `${API_BASE_URL}/uploads/${user.profilePic}`
    : "/images/logo.png";

  const unreadCount = notifications.length;

  return (
    <nav className="navbar">
      <div className="logo" style={{ cursor: "pointer" }} onClick={() => navigate(activeProjectId ? `/dashboard/${activeProjectId}` : "/projects")}>
        <img src="/images/logo.png" className="logo-img" alt="Logo" />
        <h1>AI Project Tracker</h1>
      </div>

      {token && (
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <i className={mobileMenuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
        </button>
      )}

      {token && (
        <ul className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {activeProjectId ? (
            <>
              <li>
                <Link
                  to={viewMode === "admin" ? `/dashboard/${activeProjectId}?id=${activeProjectId}` : `/dashboard/${activeProjectId}`}
                  className={location.pathname.startsWith("/dashboard") ? "active" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              {viewMode !== "admin" && (
                <>
                  <li>
                    <Link
                      to={`/tasks/manage/${activeProjectId}`}
                      className={location.pathname.startsWith("/tasks/manage") ? "active" : ""}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Manage Tasks
                    </Link>
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/projects"
                  className={location.pathname === "/projects" ? "active" : ""}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Projects
                </Link>
              </li>
              {role === "ADMIN" && (
                <li>
                  <Link
                    to="/admin"
                    className={location.pathname === "/admin" ? "active" : ""}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                </li>
              )}
            </>
          )}
          <li>
            <Link
              to="/about"
              className={location.pathname === "/about" ? "active" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={location.pathname === "/contact" ? "active" : ""}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
          </li>
        </ul>
      )}

      {token && user && (
        <div className="navbar-user">
          <span className="navbar-welcome">
            👋 <span className="welcome-prefix">Welcome </span>
            <span id="userName" style={{ fontWeight: 600 }}>{user.name}</span>
          </span>

          {/* NOTIFICATION BELL */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <a
              href="#"
              id="bellIcon"
              onClick={(e) => {
                e.preventDefault();
                setShowNotifDropdown(!showNotifDropdown);
                if (showNotifDropdown) setExpandedNotifId(null);
              }}
            >
              <i className="fa-regular fa-bell" style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}></i>
              {unreadCount > 0 && (
                <span id="notifCount" className="notif-count" style={{ display: "inline-block" }}>
                  {unreadCount}
                </span>
              )}
            </a>

            {/* SMART NOTIFICATION DROPDOWN */}
            {showNotifDropdown && (
              <div id="notifDropdown" className="notif-dropdown" style={{ display: "block" }}>
                {/* Header */}
                <div className="notif-header">
                  <span className="notif-title">🔔 Notifications</span>
                  {notifications.length > 0 && (
                    <button className="notif-mark-all" onClick={handleMarkAllRead} title="Mark all as read">
                      ✓ Clear all
                    </button>
                  )}
                </div>

                <ul id="notifList">
                  {notifications.length === 0 ? (
                    <li className="empty">
                      <span style={{ fontSize: "1.5rem" }}>🎉</span>
                      <br />
                      You're all caught up!
                    </li>
                  ) : (
                    notifications.map((n) => {
                      const isActionable = isNotifActionable(n);
                      const isExpanded = expandedNotifId === n.id;

                      return (
                        <li
                          key={n.id}
                          className={`notif-item ${isActionable ? "notif-actionable" : "notif-informational"} ${isExpanded ? "notif-expanded" : ""}`}
                          onClick={() => handleNotificationClick(n)}
                          title={isActionable ? "Click to open →" : "Click to expand"}
                        >
                          {/* Type indicator icon */}
                          <span className="notif-type-icon">
                            {isActionable ? "🔗" : "ℹ️"}
                          </span>

                          {/* Message + timestamp */}
                          <div className="notif-content">
                            <span className="notif-message">{n.message}</span>
                            <small className="notif-time">{new Date(n.createdAt).toLocaleString()}</small>

                            {/* Inline expanded panel — only for informational */}
                            {!isActionable && isExpanded && (
                              <div className="notif-inline-detail">
                                <p>{n.message}</p>
                                <small>Received: {new Date(n.createdAt).toLocaleString()}</small>
                                <br />
                                <small style={{ color: "#888" }}>This is a system alert with no action required.</small>
                              </div>
                            )}
                          </div>

                          {/* Arrow for actionable */}
                          {isActionable && (
                            <span className="notif-arrow">›</span>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>

          <img
            src={avatarUrl}
            className="user-avatar"
            id="profileBtn"
            alt="Avatar"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          />
          <a href="#" id="logoutBtn" onClick={handleLogout} title="Logout">
            <i className="fa-solid fa-right-from-bracket"></i>
          </a>
        </div>
      )}
    </nav>
  );
}
