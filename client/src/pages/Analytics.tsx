import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { Area, AreaChart, CartesianGrid, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";

type AnalyticsData = {
  topicAverages: Array<{ topic: string; averageScore: number; attempts: number }>;
  sessionsOverTime: Array<{ date: string; score: number; mode: string }>;
  clusterInsights: Array<{ clusterLabel: string; averageScore: number; questionCount: number; sessionCount: number }>;
  overview: { evaluatedAnswers: number; completedSessions: number; averageScore: number | null; strongestTopic: string | null; focusTopic: string | null };
  usage: { providers: Array<{ provider: string; totalTokens: number; estimatedCostUsd: number; p50LatencyMs: number; p95LatencyMs: number }> };
};

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { date?: string; mode?: string } }> }) => !active || !payload?.length ? null : <div className="analytics-tooltip"><strong>{payload[0].payload.date}</strong><span>{payload[0].value}% score</span><small>{payload[0].payload.mode}</small></div>;

export const Analytics: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAnalytics = async () => { setLoading(true); setError(null); try { setData(await apiRequest<AnalyticsData>("/api/sessions/analytics")); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load analytics."); } finally { setLoading(false); } };
  useEffect(() => { void loadAnalytics(); }, []);

  const weakestTopics = useMemo(() => (data?.topicAverages ?? []).slice(0, 3), [data]);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Candidate";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const hasScores = Boolean(data?.overview.evaluatedAnswers);

  return <div className="dashboard-page analytics-page"><div className="dashboard-shell">
    <header className="dashboard-header">
      <div className="dashboard-brand" aria-label="InterviewOS" onClick={() => navigate("/")}><span>Interview</span><strong>OS</strong></div>
      <div className="header-links"><Link to="/" className="header-link">Dashboard</Link><Link to="/analytics" className="header-link active">Analytics</Link></div>
      <div className="user-badge analytics-user-badge"><div className="avatar">{avatarInitial}</div><div className="user-info"><h3>{displayName}</h3><p>{user?.email}</p></div></div><button onClick={logout} className="btn-secondary">Sign out</button>
    </header>
    <main>
      <section className="analytics-hero"><div><p className="dashboard-eyebrow">Performance intelligence</p><h1>See the patterns<br />behind your practice.</h1><p>Every scored answer becomes a clearer view of your interview readiness.</p></div><div className="analytics-hero-orbit" aria-hidden="true"><span /><i /><b>↗</b></div></section>
      {error ? <section className="analytics-state error-state"><p className="section-kicker">Couldn’t load insights</p><h2>{error}</h2><button className="primary-action" onClick={() => void loadAnalytics()}>Try again</button></section>
        : loading ? <section className="analytics-state"><span className="analytics-loader" /><p>Preparing your performance view…</p></section>
          : !data ? null : <>
            <section className="metrics-grid">
              <article className="metric-card metric-primary"><span>Interview readiness</span><strong>{data.overview.averageScore ?? "—"}{data.overview.averageScore !== null && <em>%</em>}</strong><p>{data.overview.averageScore === null ? "Score your first answer to begin." : data.overview.averageScore >= 70 ? "A solid foundation—keep raising the bar." : "Keep practicing; every answer adds signal."}</p></article>
              <article className="metric-card"><span>Evaluated answers</span><strong>{data.overview.evaluatedAnswers}</strong><p>Across {data.overview.completedSessions} completed {data.overview.completedSessions === 1 ? "session" : "sessions"}</p></article>
              <article className="metric-card"><span>Strongest area</span><strong className="metric-topic">{data.overview.strongestTopic ?? "—"}</strong><p>{data.overview.strongestTopic ? "Your most confident topic so far." : "Your strengths will appear here."}</p></article>
              <article className="metric-card"><span>Focus next</span><strong className="metric-topic">{data.overview.focusTopic ?? "—"}</strong><p>{data.overview.focusTopic ? "The lowest-scoring topic to revisit." : "Complete a scored answer first."}</p></article>
            </section>
            {!hasScores ? <section className="analytics-empty"><div className="empty-insight-mark">✦</div><div><p className="section-kicker">Your story starts here</p><h2>No scored answers yet</h2><p>Finish an answer in an interview session to unlock performance trends, topic signals, and semantic weak-area detection.</p><Link className="primary-action" to="/">Start practicing</Link></div></section> : <>
              <section className="analytics-content-grid"><article className="analytics-card performance-card"><div className="analytics-card-heading"><div><p className="section-kicker">Trajectory</p><h2>Performance over time</h2></div><span className="chart-badge">Latest sessions</span></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.sessionsOverTime} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#5d9860" stopOpacity=".34" /><stop offset="100%" stopColor="#5d9860" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="#e4eee5" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#667768", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#667768", fontSize: 11 }} tickLine={false} axisLine={false} /><RechartsTooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="score" stroke="#29663a" strokeWidth={3} fill="url(#scoreGradient)" /></AreaChart></ResponsiveContainer></div></article><article className="analytics-card radar-card"><div className="analytics-card-heading"><div><p className="section-kicker">Skill map</p><h2>Topic confidence</h2></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={data.topicAverages}><PolarGrid stroke="#dce9de" /><PolarAngleAxis dataKey="topic" tick={{ fill: "#526353", fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} /><Radar dataKey="averageScore" stroke="#29663a" strokeWidth={2} fill="#8cba91" fillOpacity={.38} /></RadarChart></ResponsiveContainer></div></article></section>
              <section className="analytics-lower-grid"><article className="analytics-card weakness-card"><div className="analytics-card-heading"><div><p className="section-kicker">Practice direction</p><h2>Where to focus next</h2></div></div>{weakestTopics.map((topic, index) => <div className="topic-row" key={topic.topic}><span className="topic-rank">0{index + 1}</span><div><strong>{topic.topic}</strong><small>{topic.attempts} evaluated {topic.attempts === 1 ? "answer" : "answers"}</small></div><div className="topic-progress"><i style={{ width: `${topic.averageScore}%` }} /></div><b>{topic.averageScore}%</b></div>)}</article><article className="analytics-card semantic-card"><div className="analytics-card-heading"><div><p className="section-kicker">Beyond topic tags</p><h2>Conceptual weak spots</h2></div><span className="semantic-icon">✦</span></div>{data.clusterInsights.length ? <div className="cluster-list">{data.clusterInsights.map((insight) => <div className="cluster-item" key={insight.clusterLabel}><strong>{insight.clusterLabel}</strong><p>Similar meaning across {insight.questionCount} questions in {insight.sessionCount} {insight.sessionCount === 1 ? "session" : "sessions"}.</p><span>{insight.averageScore.toFixed(1)}/5 average</span></div>)}</div> : <div className="semantic-empty"><strong>Still learning your patterns</strong><p>After two related low-scoring answers, we’ll identify concepts that recur even when questions are phrased differently.</p></div>}</article></section>
            </>}
            {data.usage.providers.length > 0 && <section className="analytics-card usage-dashboard"><div className="analytics-card-heading"><div><p className="section-kicker">System usage</p><h2>AI cost & latency</h2></div></div><div className="usage-table"><div className="usage-row usage-labels"><span>Provider</span><span>Tokens</span><span>Est. cost</span><span>P50 / P95</span></div>{data.usage.providers.map((provider) => <div className="usage-row" key={provider.provider}><strong>{provider.provider}</strong><span>{provider.totalTokens.toLocaleString()}</span><span>${provider.estimatedCostUsd.toFixed(4)}</span><span>{Math.round(provider.p50LatencyMs)} / {Math.round(provider.p95LatencyMs)} ms</span></div>)}</div></section>}
          </>}
    </main>
  </div></div>;
};
