import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type AnalyticsData = {
  topicAverages: Array<{ topic: string; averageScore: number; attempts: number }>;
  sessionsOverTime: Array<{ date: string; score: number; mode: string }>;
  clusterInsights: Array<{ clusterLabel: string; averageScore: number; questionCount: number; sessionCount: number }>;
  usage: { providers: Array<{ provider: string; totalTokens: number; estimatedCostUsd: number; p50LatencyMs: number; p95LatencyMs: number }> };
};

const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;

export const Analytics: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAnalytics = async () => { setLoading(true); setError(null); try { setData(await apiRequest<AnalyticsData>("/api/sessions/analytics")); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load analytics."); } finally { setLoading(false); } };
  useEffect(() => { void loadAnalytics(); }, []);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Your account";

  return <div className="dashboard-page">
    <header className="dashboard-header">
      <div className="header-left"><div className="dashboard-brand" onClick={() => navigate("/")}><div className="brand-icon"><StarIcon /></div>InterviewOS</div><div className="header-links"><Link to="/" className={`header-link ${location.pathname === "/" ? "active" : ""}`}><HomeIcon /> Dashboard</Link><Link to="/analytics" className={`header-link ${location.pathname === "/analytics" ? "active" : ""}`}><BarChartIcon /> Analytics</Link></div></div>
      <div className="header-right"><div className="user-badge"><div className="avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</div><div className="user-info"><h3>{displayName}</h3><p>{user?.email || ""}</p></div><ChevronDownIcon /></div><button onClick={logout} className="btn-secondary">Sign out <ArrowRightIcon /></button></div>
    </header>
    <div className="dashboard-shell"><main>
      <div className="dashboard-eyebrow">Your insights</div><h1>Analytics & Progress</h1><p className="dashboard-lede">Track your performance over time and identify areas for improvement.</p>
      {error ? <div className="inline-state error-state"><span>{error}</span><button className="resume-button" onClick={() => void loadAnalytics()}>Try again</button></div>
        : loading ? <p className="session-state">Loading your analytics...</p>
          : !data || (!data.topicAverages.length && !data.sessionsOverTime.length) ? <p className="session-state">Not enough scored answers to display analytics. Complete an interview question and review its score first.</p>
            : <>
              <section className="insights-container semantic-insights"><p className="section-kicker">Semantic weak topics</p><h2>Conceptual gaps</h2>{data.clusterInsights.length ? <ul>{data.clusterInsights.map((insight) => <li key={insight.clusterLabel}>You consistently score low on questions semantically close to <strong>“{insight.clusterLabel}”</strong>, even when phrased differently across {insight.sessionCount} {insight.sessionCount === 1 ? "session" : "sessions"}.</li>)}</ul> : <p className="session-state">No repeated conceptual weak spot yet. Your topic performance below is grouped by the concepts in each question—not by interview mode.</p>}</section>
              <div className="analytics-grid"><section className="analytics-card"><div><p className="section-kicker">Weak areas</p><h2>Topic-wise Performance</h2></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.topicAverages}><PolarGrid stroke="#e5eee5" /><PolarAngleAxis dataKey="topic" tick={{ fill: "#506451", fontSize: 12 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#91b795" }} /><Radar name="Average Score" dataKey="averageScore" stroke="#3a6e3a" fill="#b8d8bc" fillOpacity={0.6} /><RechartsTooltip /></RadarChart></ResponsiveContainer></div></section><section className="analytics-card"><div><p className="section-kicker">Progress</p><h2>Sessions Over Time</h2></div><div className="chart-container"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.sessionsOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5eee5" /><XAxis dataKey="date" stroke="#91b795" tick={{ fill: "#506451", fontSize: 12 }} /><YAxis domain={[0, 100]} stroke="#91b795" tick={{ fill: "#506451", fontSize: 12 }} /><RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1ebe2", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} /><Line type="monotone" dataKey="score" stroke="#3a6e3a" strokeWidth={3} dot={{ r: 4, fill: "#3a6e3a" }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></section></div>
              {data.usage.providers.length > 0 && <section className="analytics-card usage-dashboard"><p className="section-kicker">Internal operations</p><h2>AI cost & latency</h2><p className="usage-note">Estimated list-price cost from UsageLog. Latencies are measured server-side.</p><div className="usage-table"><div className="usage-row usage-labels"><span>Provider</span><span>Tokens</span><span>Est. cost</span><span>P50 / P95</span></div>{data.usage.providers.map((provider) => <div className="usage-row" key={provider.provider}><strong>{provider.provider}</strong><span>{provider.totalTokens.toLocaleString()}</span><span>${provider.estimatedCostUsd.toFixed(4)}</span><span>{Math.round(provider.p50LatencyMs)} / {Math.round(provider.p95LatencyMs)} ms</span></div>)}</div></section>}
            </>}
    </main></div>
  </div>;
};
