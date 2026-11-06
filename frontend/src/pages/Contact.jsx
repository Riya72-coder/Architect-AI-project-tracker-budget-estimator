import React, { useState } from "react";
import "../css/style.css";
import "../css/contact.css";
import { API_BASE_URL } from "../config";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("❌ Please fill in all fields.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("✅ Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to send message. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus("");
      }, 4000);
    }
  };

  return (
    <main className="dashboard" style={{ padding: "30px 40px", minHeight: "calc(100vh - 160px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <section className="contact-section card" style={{ width: "600px", maxWidth: "100%", padding: "40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Connect With Us</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "30px", fontSize: "0.9rem" }}>
          Have questions or inquiries? Drop us a message, and our team will get back to you shortly.
        </p>

        {status && (
          <div style={{ padding: "10px 15px", borderRadius: "8px", background: status.startsWith("✅") ? "var(--green-100)" : "var(--red-100)", color: status.startsWith("✅") ? "var(--green-700-text)" : "var(--red-700-text)", fontWeight: 600, textAlign: "center", marginBottom: "20px" }}>
            {status}
          </div>
        )}

        <form id="contactForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label htmlFor="contactName" style={{ fontWeight: 500, display: "block", marginBottom: "5px" }}>Full Name:</label>
            <input
              type="text"
              id="contactName"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail" style={{ fontWeight: 500, display: "block", marginBottom: "5px" }}>Email Address:</label>
            <input
              type="email"
              id="contactEmail"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactMessage" style={{ fontWeight: 500, display: "block", marginBottom: "5px" }}>Your Message:</label>
            <textarea
              id="contactMessage"
              placeholder="How can we help you?"
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", resize: "none" }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-send" 
            disabled={loading}
            style={{ padding: "12px", borderRadius: "8px", background: "var(--green-500)", color: "white", fontWeight: "bold", border: "none", cursor: "pointer", transition: "0.2s" }}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </main>
  );
}
