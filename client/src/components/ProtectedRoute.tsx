import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-card">
          <div className="loading-brand" aria-label="InterviewOS">
            <span className="loading-brand-icon" aria-hidden="true">✦</span>
            <span>Interview<span>OS</span></span>
          </div>
          <div className="session-restore-spinner" aria-hidden="true"><i /><i /><i /></div>
          <p className="section-kicker">Welcome back</p>
          <h1>Restoring your session</h1>
          <p className="loading-description">Getting your interview workspace ready for you.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
