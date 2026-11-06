import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, direct to projects
    if (localStorage.getItem("token")) {
      navigate("/projects");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill all fields!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", email);
        localStorage.setItem("userEmail", email);
        if (data.role) {
          localStorage.setItem("role", data.role);
        }
        navigate("/projects");
      } else {
        setError(data.message || "❌ Invalid credentials!");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Server error! Please make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section" style={{ minHeight: "calc(100vh - 160px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card">
        <h2>User Login</h2>
        {error && <div style={{ color: "var(--red-700-text)", background: "var(--red-100)", border: "1px solid var(--red-300)", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email:</label>
            <input
              type="email"
              id="loginEmail"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password:</label>
            <input
              type="password"
              id="loginPassword"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-send" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </section>
  );
}
