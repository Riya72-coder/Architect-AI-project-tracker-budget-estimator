import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !company || !password || !confirmPassword) {
      setError("Please fill all fields!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Registration Successful! Directing to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "❌ Registration failed!");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Server error! Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-section" style={{ minHeight: "calc(100vh - 160px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="login-card">
        <h2>User Registration</h2>
        {error && <div style={{ color: "var(--red-700-text)", background: "var(--red-100)", border: "1px solid var(--red-300)", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "center" }}>{error}</div>}
        {success && <div style={{ color: "var(--green-700-text)", background: "var(--green-100)", border: "1px solid var(--green-300)", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "center" }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="company">Company / College:</label>
            <input
              type="text"
              id="company"
              placeholder="Enter company or college"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-send" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="register-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </section>
  );
}
