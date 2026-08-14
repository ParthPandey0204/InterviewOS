import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

// SVG Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

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
  const location = useLocation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
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
        setSessionsError(e instanceof Error ? e.message : "Unable to load your sessions.");
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
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <div className="brand-icon"><StarIcon /></div>
            InterviewOS
          </div>
          <div className="header-links">
            <Link to="/" className={`header-link ${location.pathname === '/' ? 'active' : ''}`}><HomeIcon /> Dashboard</Link>
            <Link to="/analytics" className={`header-link ${location.pathname === '/analytics' ? 'active' : ''}`}><BarChartIcon /> Analytics</Link>
          </div>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <div className="avatar">{user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}</div>
            <div className="user-info">
              <h3>{user?.name || "Candidate"}</h3>
              <p>{user?.email}</p>
            </div>
            <ChevronDownIcon />
          </div>
          <button onClick={logout} className="btn-secondary">Sign out <ArrowRightIcon /></button>
        </div>
      </header>

      <div className="dashboard-shell">
        <main>
          <section className="hero-section">
            <div className="hero-content">
              <div className="dashboard-eyebrow">Your workspace</div>
              <h1>Practice with <span>purpose.</span></h1>
              <p className="dashboard-lede">Choose a focused interview mode, tailor the difficulty, and build confidence session by session.</p>
            </div>
            <div className="hero-illustration">
               {/* Decorative elements to suggest the mountain/target from the mockup */}
               <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                 <path d="M0,200 L100,100 L200,150 L350,50 L400,80 L400,200 Z" fill="rgba(145, 183, 149, 0.2)" />
                 <path d="M150,200 L250,120 L320,160 L400,90 L400,200 Z" fill="rgba(145, 183, 149, 0.3)" />
                 <circle cx="280" cy="80" r="30" fill="none" stroke="#639b6d" strokeWidth="8" />
                 <circle cx="280" cy="80" r="15" fill="#639b6d" />
                 <line x1="240" y1="120" x2="280" y2="80" stroke="#4a7a52" strokeWidth="4" />
               </svg>
            </div>
          </section>

          <section className="quick-start-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">Quick start</p>
                <h2>What would you like to practise?</h2>
              </div>
              <button className="primary-action" onClick={() => openSetup()}><PlusIcon /> Custom session</button>
            </div>
            
            <div className="mode-grid">
              {modes.map((item) => (
                <div key={item} className="mode-card" onClick={() => openSetup(item)}>
                  <div className="mode-icon">
                    {item === "Technical" ? <CodeIcon /> : item === "Behavioural" ? <UsersIcon /> : <BriefcaseIcon />}
                  </div>
                  <strong>{item}</strong>
                  <p>{item === "Technical" ? "Solve coding problems, systems design and technical questions." : item === "Behavioural" ? "Practice common behavioural questions and improve clarity." : "Tackle real-world business cases and sharpen problem solving."}</p>
                  <div className="mode-start">Start <ArrowRightIcon /></div>
                  <div className="card-graphic">
                    {/* Placeholder for card graphics */}
                    {item === "Technical" && (
                      <svg width="120" height="80" viewBox="0 0 120 80">
                        <rect x="10" y="10" width="100" height="60" rx="4" fill="#eaf5eb" stroke="#c9ddca" strokeWidth="2"/>
                        <circle cx="20" cy="20" r="3" fill="#a0bfa3"/><circle cx="30" cy="20" r="3" fill="#a0bfa3"/><circle cx="40" cy="20" r="3" fill="#a0bfa3"/>
                        <line x1="20" y1="35" x2="60" y2="35" stroke="#a0bfa3" strokeWidth="4" strokeLinecap="round"/>
                        <line x1="20" y1="45" x2="80" y2="45" stroke="#a0bfa3" strokeWidth="4" strokeLinecap="round"/>
                        <line x1="20" y1="55" x2="50" y2="55" stroke="#a0bfa3" strokeWidth="4" strokeLinecap="round"/>
                      </svg>
                    )}
                    {item === "Behavioural" && (
                      <svg width="100" height="80" viewBox="0 0 100 80">
                        <path d="M20,30 h50 a10,10 0 0 1 10,10 v20 a10,10 0 0 1 -10,10 h-30 l-10,10 v-10 h-10 a10,10 0 0 1 -10,-10 v-20 a10,10 0 0 1 10,-10 z" fill="#eaf5eb" stroke="#c9ddca" strokeWidth="2"/>
                        <circle cx="35" cy="50" r="3" fill="#a0bfa3"/><circle cx="45" cy="50" r="3" fill="#a0bfa3"/><circle cx="55" cy="50" r="3" fill="#a0bfa3"/>
                      </svg>
                    )}
                    {item === "Case Study" && (
                      <svg width="100" height="80" viewBox="0 0 100 80">
                        <circle cx="40" cy="40" r="30" fill="#eaf5eb" stroke="#c9ddca" strokeWidth="2"/>
                        <path d="M40,40 L40,10 A30,30 0 0 1 70,40 Z" fill="#c9ddca"/>
                        <line x1="80" y1="20" x2="95" y2="20" stroke="#a0bfa3" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="80" y1="35" x2="95" y2="35" stroke="#a0bfa3" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="80" y1="50" x2="95" y2="50" stroke="#a0bfa3" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="sessions-panel">
            <div className="sessions-heading">
              <div>
                <p className="section-kicker">Practice history</p>
                <h2>Past sessions</h2>
              </div>
              <span className="session-count">{sessions.length} total</span>
            </div>
            {sessionsError && <div className="inline-state error-state"><span>{sessionsError}</span><button className="resume-button" onClick={() => window.location.reload()}>Try again</button></div>}
            {loadingSessions ? (
              <p className="session-state">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="session-state">No interview sessions yet. Start one above and your progress will appear here.</p>
            ) : (
              <div className="sessions-list">
                {sessions.map((s) => {
                  const score = formatScore(s);
                  const isScored = score !== "Not scored";
                  return (
                    <article key={s.id} className="session-row">
                      <div className="session-info">
                        <div className="session-icon">
                           {s.mode === "Technical" ? <CodeIcon /> : s.mode === "Behavioural" ? <UsersIcon /> : <BriefcaseIcon />}
                        </div>
                        <div className="session-details">
                          <span className="session-title">{s.mode} Interview{s.mode === "Case Study" && s.targetCompany ? ` - ${s.targetCompany}` : ""}</span>
                          <div className="session-meta">
                            <span className="session-meta-item"><BarChartIcon /> {s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1).toLowerCase()} difficulty</span>
                            <span>·</span>
                            <span className="session-meta-item">30 mins</span> {/* Placeholder time since backend might not provide duration */}
                          </div>
                        </div>
                      </div>
                      
                      <div className="session-metrics">
                        <span className={`score-pill ${!isScored ? 'not-scored' : ''}`}>{score}</span>
                        <div className="session-date"><CalendarIcon /> {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
                        <button className="resume-button" onClick={() => navigate(isScored ? `/sessions/${s.id}/replay` : `/sessions/${s.id}`)}>
                          {isScored ? "Review" : "Open"} <ArrowRightIcon />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {isSetupOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !isStarting && setIsSetupOpen(false)}>
          <section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setIsSetupOpen(false)} aria-label="Close setup">×</button>
            <p className="section-kicker">New practice session</p>
            <h2 id="setup-title">Set up your interview</h2>
            <p className="modal-description">Choose the format that best matches the role you are preparing for.</p>
            {setupError && <p className="setup-error">{setupError}</p>}
            <form onSubmit={startSession}>
              <label>Interview mode
                <select value={mode} onChange={(event) => setMode(event.target.value)}>
                  {modes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Difficulty
                <div className="difficulty-options">
                  {["EASY", "MEDIUM", "HARD"].map((item) => (
                    <button key={item} type="button" className={difficulty === item ? "selected" : ""} onClick={() => setDifficulty(item)}>{item[0] + item.slice(1).toLowerCase()}</button>
                  ))}
                </div>
              </label>
              <label>Target company
                <select value={company} onChange={(event) => setCompany(event.target.value)}>
                  {companies.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button className="primary-action modal-submit" disabled={isStarting}>{isStarting ? "Starting…" : "Start session"}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};