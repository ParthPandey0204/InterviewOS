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
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand" aria-label="InterviewOS">
            <span>Interview</span><strong>OS</strong>
          </div>
          <div className="user-badge">
            <div className="avatar">
              {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </div>
            <div className="user-info">
              <h3>{user?.name || "Candidate"}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary">Sign out</button>
        </header>

        <main>
          <div className="dashboard-eyebrow">Your workspace</div>
          <h1>Interview dashboard</h1>
          <p className="dashboard-lede">Keep track of your interview practice and pick up where you left off.</p>

          <div className="status-panel">
            <span className="status-dot"></span>
            <span>Signed in securely</span>
            <span className="badge">Protected workspace</span>
          </div>

          <section className="sessions-panel">
            <div className="sessions-heading">
              <div>
                <p className="section-kicker">Practice history</p>
                <h2>Your interview sessions</h2>
              </div>
              <span className="session-count">{sessions.length} total</span>
            </div>
            {loadingSessions ? (
              <p className="session-state">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="session-state">No interview sessions yet. Your practice history will appear here once you create one.</p>
            ) : (
              <div className="sessions-list">
                {sessions.map((s) => (
                  <article key={s.id} className="session-row">
                    <div>
                      <strong>{s.mode} interview</strong>
                      <p>Difficulty: {s.difficulty}{s.targetCompany && ` · ${s.targetCompany}`}</p>
                    </div>
                    <time>{new Date(s.createdAt).toLocaleDateString()}</time>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
