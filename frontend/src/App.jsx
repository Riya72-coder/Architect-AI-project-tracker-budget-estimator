import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ArchiAI from "./components/ArchiAI";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import Dashboard from "./pages/Dashboard";
import ManageTasks from "./pages/ManageTasks";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Layout wrapper to conditionalize navbar and ArchiAI presence
function AppContent() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Auth pages don't get the floating chatbot or navbar (usually)
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";

  return (
    <div className="app-container" style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Dynamic Navbar */}
      {!isAuthPage && <Navbar />}

      {/* Pages Container */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/:projectId" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/tasks/manage/:projectId" element={
          <ProtectedRoute>
            <ManageTasks />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />

        <Route path="/about" element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        } />

        <Route path="/contact" element={
          <ProtectedRoute>
            <Contact />
          </ProtectedRoute>
        } />

        {/* Catch-all and Default redirects */}
        <Route path="/" element={token ? <Navigate to="/projects" replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={token ? <Navigate to="/projects" replace /> : <Navigate to="/login" replace />} />
      </Routes>

      {/* Dynamic ArchiAI chatbot assistant */}
      {!isAuthPage && token && <ArchiAI />}

      {/* FOOTER */}
      {!isAuthPage && (
        <footer className="footer" style={{ marginTop: "40px", width: "100%", textAlign: "center", borderTop: "1px solid var(--border)", padding: "20px 0" }}>
          <p>© 2026 AI Project Tracker for Architecture | Designed by VisionCoders Team</p>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
