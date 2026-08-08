import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

type AnalyticsData = {
  topicAverages: Array<{ topic: string; averageScore: number }>;
  sessionsOverTime: Array<{ date: string; score: number; mode: string }>;
};

export const Analytics: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiRequest<AnalyticsData>("/api/analytics");
        setData(res);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-brand" aria-label="InterviewOS" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span>Interview</span><strong>OS</strong>
          </div>
          <div className="header-links">
            <Link to="/" className="header-link">Dashboard</Link>
            <Link to="/analytics" className="header-link active">Analytics</Link>
          </div>
          <div className="user-badge" style={{ marginLeft: 'auto' }}>
            <div className="avatar">{user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}</div>
            <div className="user-info">
              <h3>{user?.name || "Candidate"}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary">Sign out</button>
        </header>

        <main>
          <div className="dashboard-eyebrow">Your insights</div>
          <h1>Analytics & Progress</h1>
          <p className="dashboard-lede">Track your performance over time and identify areas for improvement.</p>

          {loading ? (
            <p className="session-state">Loading your analytics...</p>
          ) : !data || (data.topicAverages.length === 0 && data.sessionsOverTime.length === 0) ? (
            <p className="session-state">Not enough data to display analytics. Complete a few interview sessions first!</p>
          ) : (
            <div className="analytics-grid">
              <section className="analytics-card">
                <div>
                  <p className="section-kicker">Weak Areas</p>
                  <h2>Topic-wise Performance</h2>
                </div>
                <div className="chart-container" style={{ height: 350, marginTop: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.topicAverages}>
                      <PolarGrid stroke="#e5eee5" />
                      <PolarAngleAxis dataKey="topic" tick={{ fill: '#506451', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#91b795' }} />
                      <Radar name="Average Score" dataKey="averageScore" stroke="#3a6e3a" fill="#b8d8bc" fillOpacity={0.6} />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="analytics-card">
                <div>
                  <p className="section-kicker">Progress</p>
                  <h2>Sessions Over Time</h2>
                </div>
                <div className="chart-container" style={{ height: 350, marginTop: 20 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.sessionsOverTime} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5eee5" />
                      <XAxis dataKey="date" stroke="#91b795" tick={{ fill: '#506451', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#91b795" tick={{ fill: '#506451', fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 8, border: '1px solid #e1ebe2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#3a6e3a" strokeWidth={3} dot={{ r: 4, fill: '#3a6e3a' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
