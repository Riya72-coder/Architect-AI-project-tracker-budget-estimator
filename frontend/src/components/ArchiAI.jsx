import React, { useState, useEffect, useRef } from "react";
import "../css/chatbot.css";
import { API_BASE_URL, CHATBOT_API_URL } from "../config";

export default function ArchiAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const email = localStorage.getItem("email");
  const token = localStorage.getItem("token");

  const chatBoxRef = useRef(null);

  // Load chat sessions on mount or when email changes
  useEffect(() => {
    if (email) {
      loadSessions();
    }
  }, [email]);

  // Scroll to bottom when messages list or typing state changes
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadSessions = async () => {
    if (!email) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-session/user/${email}`);
      const data = await response.json();
      setSessions(data || []);
    } catch (error) {
      console.error("Session Load Error:", error);
    }
  };

  const openSession = async (sessionId) => {
    try {
      setActiveSessionId(sessionId);
      const response = await fetch(`${API_BASE_URL}/api/chat-session/${sessionId}`);
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error("Open Session Error:", error);
    }
  };

  const createSession = async (firstMessage) => {
    if (!email) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          title: firstMessage.substring(0, 40),
        }),
      });
      const session = await response.json();
      await loadSessions();
      setActiveSessionId(session.id);
      return session.id;
    } catch (error) {
      console.error("Create Session Error:", error);
      return null;
    }
  };

  const handleSendMessage = async (msgText) => {
    if (!msgText.trim()) return;
    
    // Add user message locally
    const newUserMsg = { message: msgText, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(msgText);
    }

    try {
      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          message: msgText,
          email: email,
          sessionId: sessionId,
        }),
      });
      const data = await response.json();
      
      // Add bot message response
      setMessages((prev) => [...prev, { message: data.response || data.message || "No reply from AI", sender: "bot" }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { message: "⚠️ Connection error to AI assistant.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
      // Reload sessions to update title if it was first message
      loadSessions();
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat session?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/chat-session/${sessionId}`, { method: "DELETE" });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      loadSessions();
    } catch (error) {
      console.error("Delete Session Error:", error);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear all chat sessions?")) return;
    try {
      for (const session of sessions) {
        await fetch(`${API_BASE_URL}/api/chat-session/${session.id}`, { method: "DELETE" });
      }
      setActiveSessionId(null);
      setMessages([]);
      loadSessions();
    } catch (error) {
      console.error("Clear Chat Error:", error);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      alert("No messages to export.");
      return;
    }
    const chatText = messages
      .map((msg) => `${msg.sender.toUpperCase()}: ${msg.message}`)
      .join("\n\n");
    const blob = new Blob([chatText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ArchiAI-Chat-${activeSessionId || "session"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setIsOpen(true);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* FLOAT BUTTON */}
      <div 
        id="chat-toggle" 
        title="Open ArchiAI" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: isOpen ? "none" : "flex" }}
      >
        🤖
      </div>

      {/* CHAT CONTAINER */}
      <div id="chat-container" className={isOpen ? "chat-open active" : ""}>
        {/* HEADER */}
        <div id="chat-header">
          <div className="chat-brand">
            <div className="chat-logo">🤖</div>
            <div className="chat-info">
              <h3>ArchiAI</h3>
              <p>Architecture Intelligence</p>
              <div className="chat-status">
                <span className="online-dot"></span> Online
              </div>
            </div>
          </div>
          
          <div className="chat-actions">
            <span id="chat-minimize" title="Minimize" onClick={() => setIsOpen(false)}>
              <i className="fa-solid fa-minus"></i>
            </span>
            <div className="chat-menu">
              <span id="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className="fa-solid fa-ellipsis"></i>
              </span>
              {isMenuOpen && (
                <div id="menu-dropdown" style={{ display: "block" }}>
                  <div onClick={() => { handleExportChat(); setIsMenuOpen(false); }}>
                    <i className="fa-solid fa-download"></i> Export Chat
                  </div>
                  <div onClick={() => { alert("ArchiAI version 1.0. A premium AI assistant helping architects estimate budgets and analyze project risks."); setIsMenuOpen(false); }}>
                    <i className="fa-solid fa-circle-info"></i> About ArchiAI
                  </div>
                  <div onClick={() => { handleClearChat(); setIsMenuOpen(false); }} style={{ color: "#ff4d4d" }}>
                    <i className="fa-solid fa-trash-can"></i> Clear All
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div id="chat-main-wrapper">
          {/* HISTORY SIDEBAR */}
          <div id="chat-history-sidebar">
            <div className="history-header">
              <button id="new-chat-btn" onClick={startNewChat}>
                <i className="fa-solid fa-plus"></i> New Chat
              </button>
              <div className="history-label">Recent Chats</div>
              <input
                type="text"
                id="history-search"
                placeholder="Search Chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div id="history-list">
              {filteredSessions.map((session) => (
                <div 
                  key={session.id} 
                  className={`history-item ${activeSessionId === session.id ? "active-chat" : ""}`}
                  onClick={() => openSession(session.id)}
                >
                  <span className="chat-title">💬 {session.title}</span>
                  <i 
                    className="fa-solid fa-trash-can delete-btn" 
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    title="Delete Chat"
                  ></i>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div style={{ color: "#64748b", padding: "10px", textAlign: "center", fontSize: "0.8rem" }}>
                  No sessions found
                </div>
              )}
            </div>
          </div>

          {/* CHAT PANEL */}
          <div id="chat-right-panel">
            <div id="chat-box" ref={chatBoxRef}>
              {messages.length === 0 ? (
                <div className="bot-msg welcome-msg">
                  👋 Hi, I'm <b>ArchiAI</b>
                  <br /><br />
                  Try asking:
                  <br />📊 Project Insights
                  <br />🔥 Most Important Project
                  <br />📅 Nearest Deadline
                  <br />🚨 Future Risk Projects
                  <br />📁 Show All Projects
                  <br />⚠️ Delayed Projects
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={msg.sender === "user" ? "user-msg" : "bot-msg"}>
                    <div className="msg-text">
                      {msg.message.split("\n").map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < msg.message.split("\n").length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="bot-msg">
                  <div className="typing-bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QUICK SUGGESTIONS */}
        <div id="chat-suggestions">
          <button onClick={() => handleSendMessage("Show project insights")}>📊 Insights</button>
          <button onClick={() => handleSendMessage("Show delayed projects")}>⚠️ Delayed</button>
          <button onClick={() => handleSendMessage("Portfolio health")}>📈 Health</button>
          <button onClick={() => handleSendMessage("Most important project")}>🔥 Priority</button>
          <button onClick={() => handleSendMessage("Nearest deadline")}>📅 Deadline</button>
          <button onClick={() => handleSendMessage("Future risk projects")}>🚨 Future Risk</button>
        </div>

        {/* INPUT AREA */}
        <form 
          id="chat-input-area"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
        >
          <input
            type="text"
            id="user-input"
            placeholder="Ask about projects, deadlines, risks..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" disabled={isTyping}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </>
  );
}
