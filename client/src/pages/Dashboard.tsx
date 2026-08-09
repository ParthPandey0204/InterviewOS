import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

const modes = ["Technical", "Behavioural", "Case Study"];
const companies = ["No preference", "Google", "Microsoft", "Amazon", "Meta", "Apple"];

type Session = {
  id: string;
  mode: string;
  difficulty: string;
  targetCompany: string | null;
  createdAt: string;
  topicStats?: Array<{ score: number | null }>;
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [mode, setMode] = useState(modes[0]);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [company, setCompany] = useState(companies[0]);
  const [isStarting, setIsStarting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

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

  const openSetup = (selectedMode = modes[0]) => {
    setMode(selectedMode);
    setSetupError(null);
    setIsSetupOpen(true);
  };

  const startSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsStarting(true);
    setSetupError(null);
    try {
      const result = await apiRequest<{ session: Session }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ mode, difficulty, company: company === "No preference" ? undefined : company })
      });
      setSessions((current) => [result.session, ...current]);
      setIsSetupOpen(false);
      navigate(`/sessions/${result.session.id}`);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to start your session.");
    } finally {
      setIsStarting(false);
    }
  };

  const formatScore = (session: Session) => {
    const scores = (session.topicStats ?? [])
      .map((stat) => stat.score)
      .filter((score): score is number => score !== null);
    if (!scores.length) return "Not scored";
    return `${Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 20)}%`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand" aria-label="InterviewOS" style={{ cursor: 'pointer' }}><span>Interview</span><strong>OS</strong></div>
          <div className="header-links">
            <Link to="/" className="header-link active">Dashboard</Link>
            <Link to="/analytics" className="header-link">Analytics</Link>
          </div>
          <div className="user-badge" style={{ marginLeft: 'auto' }}><div className="avatar">{user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}</div><div className="user-info"><h3>{user?.name || "Candidate"}</h3><p>{user?.email}</p></div></div>
          <button onClick={logout} className="btn-secondary">Sign out</button>
        </header>

        <main>
          <div className="dashboard-eyebrow">Your workspace</div>
          <h1>Practice with purpose.</h1>
          <p className="dashboard-lede">Choose a focused interview mode, tailor the difficulty, and build confidence session by session.</p>

          <section className="quick-start-section">
            <div><p className="section-kicker">Quick start</p><h2>What would you like to practise?</h2></div>
            <button className="primary-action" onClick={() => openSetup()}>Custom session</button>
            <div className="mode-grid">
              {modes.map((item) => <button key={item} className="mode-card" onClick={() => openSetup(item)}><span className="mode-icon">{item === "Technical" ? "⌘" : item === "Behavioural" ? "☀" : "◇"}</span><strong>{item}</strong><small>Start a focused practice session</small><span>Start →</span></button>)}
            </div>
          </section>

          <section className="sessions-panel">
            <div className="sessions-heading"><div><p className="section-kicker">Practice history</p><h2>Past sessions</h2></div><span className="session-count">{sessions.length} total</span></div>
            {loadingSessions ? <p className="session-state">Loading sessions...</p> : sessions.length === 0 ? <p className="session-state">No interview sessions yet. Start one above and your progress will appear here.</p> : <div className="sessions-list">{sessions.map((s) => <article key={s.id} className="session-row"><div><strong>{s.mode} interview</strong><p>{s.difficulty.toLowerCase()} difficulty{s.targetCompany && ` · ${s.targetCompany}`}</p></div><div className="session-metrics"><span className="score-pill">{formatScore(s)}</span><time>{new Date(s.createdAt).toLocaleDateString()}</time><button className="resume-button" onClick={() => navigate(formatScore(s) !== "Not scored" ? `/sessions/${s.id}/replay` : `/sessions/${s.id}`)}>{formatScore(s) !== "Not scored" ? "Review" : "Open"}</button></div></article>)}</div>}
          </section>
        </main>
      </div>

      {isSetupOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => !isStarting && setIsSetupOpen(false)}><section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setIsSetupOpen(false)} aria-label="Close setup">×</button><p className="section-kicker">New practice session</p><h2 id="setup-title">Set up your interview</h2><p className="modal-description">Choose the format that best matches the role you are preparing for.</p>{setupError && <p className="setup-error">{setupError}</p>}<form onSubmit={startSession}><label>Interview mode<select value={mode} onChange={(event) => setMode(event.target.value)}>{modes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Difficulty<div className="difficulty-options">{["EASY", "MEDIUM", "HARD"].map((item) => <button key={item} type="button" className={difficulty === item ? "selected" : ""} onClick={() => setDifficulty(item)}>{item[0] + item.slice(1).toLowerCase()}</button>)}</div></label><label>Target company<select value={company} onChange={(event) => setCompany(event.target.value)}>{companies.map((item) => <option key={item}>{item}</option>)}</select></label><button className="primary-action modal-submit" disabled={isStarting}>{isStarting ? "Starting…" : "Start session"}</button></form></section></div>}
    </div>
  );
};
