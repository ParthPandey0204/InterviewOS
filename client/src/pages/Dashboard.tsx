import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

type Session = {
  id: string;
  mode: string;
  difficulty: string;
  targetCompany: string | null;
  createdAt: string;
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await apiRequest<{ sessions: Session[] }>("/api/sessions");
        setSessions(res.sessions || []);
      } catch (e) {
        console.error("Failed to load sessions", e);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadSessions();
  }, []);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="user-badge">
          <div className="avatar">
            {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div className="user-info">
            <h3>{user?.name || "Candidate"}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        <button onClick={logout} className="btn-secondary">
          Sign Out
        </button>
      </header>

      <main>
        <div className="eyebrow">Authenticated Workspace</div>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>Interview Dashboard</h1>
        <p className="lede" style={{ marginBottom: "32px" }}>
          Welcome to InterviewOS. Your session is authenticated with an in-memory JWT access token and secured via an httpOnly refresh cookie.
        </p>

        <div className="status-panel" style={{ marginBottom: "32px" }}>
          <span className="status-dot online"></span>
          <span>Auth Status: Authenticated (JWT Memory + httpOnly Cookie)</span>
          <span className="badge" style={{ marginLeft: "auto" }}>Protected Route</span>
        </div>

        <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#ffffff" }}>Your Active Practice Sessions</h2>
          {loadingSessions ? (
            <p style={{ color: "var(--text-muted)" }}>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No interview sessions created yet. Use the API or client to start a new session!</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {sessions.map((s) => (
                <div key={s.id} style={{ padding: "14px 18px", background: "rgba(15, 23, 42, 0.5)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#ffffff" }}>{s.mode} Interview</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Difficulty: {s.difficulty} {s.targetCompany && `• Company: ${s.targetCompany}`}</div>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
