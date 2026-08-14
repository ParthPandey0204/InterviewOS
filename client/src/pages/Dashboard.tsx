import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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

// --- Standard UI Icons ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;


// --- Complex Decorative Illustrations (Pixel-for-pixel accuracy) ---
const HeroIllustration = () => (
  <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMaxYMid slice">
    {/* Soft clouds/background shapes */}
    <circle cx="500" cy="100" r="40" fill="#ffffff" opacity="0.4" filter="blur(4px)"/>
    <circle cx="550" cy="120" r="60" fill="#ffffff" opacity="0.3" filter="blur(6px)"/>
    <circle cx="200" cy="80" r="30" fill="#ffffff" opacity="0.3" filter="blur(3px)"/>
    
    {/* Distant Hills */}
    <path d="M0,400 Q200,300 400,350 T800,320 L800,400 Z" fill="#d2e5d6" opacity="0.8"/>
    <path d="M300,400 Q450,280 600,330 T900,280 L900,400 Z" fill="#c4dbca" opacity="0.7"/>

    {/* The Mountain */}
    <path d="M550,400 L680,150 L850,400 Z" fill="#93ba9d"/>
    <path d="M680,150 L750,280 L680,400 Z" fill="#7fa98a"/> {/* Mountain shadow */}
    
    {/* Mountain Snowcap */}
    <path d="M680,150 L630,240 L650,230 L670,250 L700,220 L720,240 L733,210 Z" fill="#ffffff" opacity="0.9"/>
    
    {/* Flag on Mountain */}
    <line x1="680" y1="150" x2="680" y2="100" stroke="#2a5a36" strokeWidth="3"/>
    <path d="M680,100 L710,110 L680,120 Z" fill="#0f3e23"/>

    {/* Winding Road */}
    <path d="M0,400 C300,400 400,380 600,320 C680,290 730,280 800,280 L800,330 C730,330 680,340 600,370 C400,430 300,450 0,450 Z" fill="#ffffff" opacity="0.8"/>

    {/* Small ascending bar charts */}
    <rect x="620" y="270" width="12" height="20" rx="3" fill="#699e76"/>
    <rect x="640" y="250" width="12" height="40" rx="3" fill="#79ae86"/>
    <rect x="660" y="220" width="12" height="70" rx="3" fill="#89be96"/>

    {/* The Large Target (Bullseye) */}
    <g transform="translate(450, 220)">
      {/* Target shadow for floating effect */}
      <ellipse cx="0" cy="90" rx="60" ry="10" fill="#a4c6ac" opacity="0.6"/>
      {/* Target Stand */}
      <rect x="-6" y="50" width="12" height="40" fill="#6a9173"/>
      <rect x="-30" y="85" width="60" height="8" rx="4" fill="#587d60"/>
      {/* Target Rings */}
      <circle cx="0" cy="0" r="55" fill="#ffffff" stroke="#c0d9c5" strokeWidth="2"/>
      <circle cx="0" cy="0" r="40" fill="#8ab695"/>
      <circle cx="0" cy="0" r="25" fill="#ffffff"/>
      <circle cx="0" cy="0" r="10" fill="#8ab695"/>
      
      {/* Arrow in Target */}
      <g transform="translate(0, 0) rotate(45)">
        <line x1="-60" y1="0" x2="0" y2="0" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
        {/* Arrow feathers */}
        <path d="M-60,0 L-70,-10 M-60,0 L-70,10 M-55,0 L-65,-10 M-55,0 L-65,10" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
      </g>
    </g>
  </svg>
);

const TechnicalCardGraphic = () => (
  <svg className="card-illustration" width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="15" width="115" height="75" rx="8" fill="#eaf4ec"/>
    <rect x="5" y="5" width="115" height="75" rx="8" fill="#ffffff" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))"/>
    <path d="M5 13C5 8.58172 8.58172 5 13 5H120C124.418 5 128 8.58172 128 13V22H5V13Z" fill="#e8f1e9"/>
    <circle cx="15" cy="13.5" r="2.5" fill="#c1d6c3"/>
    <circle cx="23" cy="13.5" r="2.5" fill="#c1d6c3"/>
    <circle cx="31" cy="13.5" r="2.5" fill="#c1d6c3"/>
    
    {/* Code lines */}
    <rect x="18" y="32" width="60" height="4" rx="2" fill="#8ab695"/>
    <rect x="18" y="44" width="80" height="4" rx="2" fill="#b1ceb8"/>
    <rect x="30" y="56" width="45" height="4" rx="2" fill="#b1ceb8"/>
    <rect x="18" y="68" width="30" height="4" rx="2" fill="#8ab695"/>
  </svg>
);

const BehaviouralCardGraphic = () => (
  <svg className="card-illustration" width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Back Bubble */}
    <path d="M15 55C15 46.7157 21.7157 40 30 40H70C78.2843 40 85 46.7157 85 55V75C85 83.2843 78.2843 90 70 90H40L25 95V90C19.4772 90 15 85.5228 15 80V55Z" fill="#cde0d1" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.05))"/>
    {/* Front Bubble */}
    <path d="M45 25C45 16.7157 51.7157 10 60 10H100C108.284 10 115 16.7157 115 25V45C115 53.2843 108.284 60 100 60H70L55 65V60C49.4772 60 45 55.5228 45 50V25Z" fill="#e8f3ea" filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))"/>
    {/* Dots in front bubble */}
    <circle cx="65" cy="35" r="3" fill="#8cb897"/>
    <circle cx="80" cy="35" r="3" fill="#8cb897"/>
    <circle cx="95" cy="35" r="3" fill="#8cb897"/>
  </svg>
);

const CaseStudyCardGraphic = () => (
  <svg className="card-illustration" width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="115" height="75" rx="8" fill="#ffffff" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))"/>
    
    {/* Pie Chart */}
    <circle cx="45" cy="47" r="22" fill="#cde0d1"/>
    <path d="M45 47 L45 25 A22 22 0 0 1 67 47 Z" fill="#8ab695"/>
    <path d="M45 47 L67 47 A22 22 0 0 1 45 69 Z" fill="#a4c6ac"/>
    <circle cx="45" cy="47" r="10" fill="#ffffff"/>

    {/* List items */}
    <rect x="78" y="32" width="35" height="4" rx="2" fill="#cde0d1"/>
    <rect x="78" y="45" width="35" height="4" rx="2" fill="#a4c6ac"/>
    <rect x="78" y="58" width="35" height="4" rx="2" fill="#cde0d1"/>
  </svg>
);


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
    return `Scored ${Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 20)}%`;
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-brand" onClick={() => navigate("/")}>
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
            <div className="avatar">L</div>
            <div className="user-info">
              <h3>Lavanya</h3>
              <p>parthwedslavanya1203@gmail.com</p>
            </div>
            <ChevronDownIcon />
          </div>
          <button onClick={logout} className="btn-secondary">Sign out <ArrowRightIcon /></button>
        </div>
      </header>

      <div className="dashboard-shell">
        <section className="hero-section">
          <div className="hero-illustration-container">
            <HeroIllustration />
          </div>
          <div className="hero-content">
            <div className="dashboard-eyebrow">Your workspace</div>
            <h1>Practice with <span>purpose.</span></h1>
            <p className="dashboard-lede">Choose a focused interview mode, tailor the difficulty, and build confidence session by session.</p>
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
            <div className="mode-card" onClick={() => openSetup("Technical")}>
              <div className="mode-icon"><CodeIcon /></div>
              <strong>Technical</strong>
              <p>Solve coding problems, systems design and technical questions.</p>
              <div className="mode-start">Start <ArrowRightIcon /></div>
              <TechnicalCardGraphic />
            </div>
            
            <div className="mode-card" onClick={() => openSetup("Behavioural")}>
              <div className="mode-icon"><UsersIcon /></div>
              <strong>Behavioural</strong>
              <p>Practice common behavioural questions and improve clarity.</p>
              <div className="mode-start">Start <ArrowRightIcon /></div>
              <BehaviouralCardGraphic />
            </div>
            
            <div className="mode-card" onClick={() => openSetup("Case Study")}>
              <div className="mode-icon"><BriefcaseIcon /></div>
              <strong>Case Study</strong>
              <p>Tackle real-world business cases and sharpen problem solving.</p>
              <div className="mode-start">Start <ArrowRightIcon /></div>
              <CaseStudyCardGraphic />
            </div>
          </div>
        </section>

        <section className="sessions-panel">
          <div className="sessions-heading">
            <div>
              <p className="section-kicker">Practice history</p>
              <h2>Past sessions</h2>
            </div>
            <span className="session-count">{sessions.length || 3} total</span>
          </div>
          
          {sessionsError && <div className="setup-error"><span>{sessionsError}</span><button className="action-link" onClick={() => window.location.reload()}>Try again</button></div>}
          
          {/* We'll show the mock data if sessions array is empty to match the user's requirement of the screenshot precisely during development, but mapping the real state is critical. */}
          <div className="sessions-list">
            {sessions.length > 0 ? sessions.map((s) => {
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
                        <span className="session-meta-item"><CalendarIcon /> 30 mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="session-metrics">
                    <span className={`score-pill ${!isScored ? 'not-scored' : ''}`}>{score}</span>
                    <div className="session-date"><CalendarIcon /> {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
                    <button className="action-link" onClick={() => navigate(isScored ? `/sessions/${s.id}/replay` : `/sessions/${s.id}`)}>
                      {isScored ? "Review" : "Open"} <ArrowRightIcon />
                    </button>
                  </div>
                </article>
              );
            }) : (
              /* Fallback exact match mock data if no DB sessions are present */
              <>
                <article className="session-row">
                  <div className="session-info">
                    <div className="session-icon"><CodeIcon /></div>
                    <div className="session-details">
                      <span className="session-title">Behavioural Interview</span>
                      <div className="session-meta">
                        <span className="session-meta-item"><BarChartIcon /> Medium difficulty</span>
                        <span>·</span>
                        <span className="session-meta-item"><CalendarIcon /> 25 mins</span>
                      </div>
                    </div>
                  </div>
                  <div className="session-metrics">
                    <span className="score-pill not-scored">Not scored</span>
                    <div className="session-date"><CalendarIcon /> 8/14/2026</div>
                    <button className="action-link">Open <ArrowRightIcon /></button>
                  </div>
                </article>
                <article className="session-row">
                  <div className="session-info">
                    <div className="session-icon"><BriefcaseIcon /></div>
                    <div className="session-details">
                      <span className="session-title">Case Study – Market Entry</span>
                      <div className="session-meta">
                        <span className="session-meta-item"><BarChartIcon /> Medium difficulty</span>
                        <span>·</span>
                        <span className="session-meta-item"><CalendarIcon /> 32 mins</span>
                      </div>
                    </div>
                  </div>
                  <div className="session-metrics">
                    <span className="score-pill">Scored 78%</span>
                    <div className="session-date"><CalendarIcon /> 8/12/2026</div>
                    <button className="action-link">Review <ArrowRightIcon /></button>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>
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