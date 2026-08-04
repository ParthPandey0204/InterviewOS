import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import illustration from "../assets/interview_illustration.jpg";
import "../login.css";

const GradCap = () => (
  <svg className="login-brand-cap" width="26" height="20" viewBox="0 0 26 20" fill="none">
    <path d="M13 0L0 7.5L13 15L26 7.5L13 0Z" fill="#1a1a1a" />
    <path d="M3.5 11V16.5C3.5 16.5 6.5 20 13 20C19.5 20 22.5 16.5 22.5 16.5V11"
          stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="26" y1="7.5" x2="26" y2="14" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── LEFT ── */}
        <div className="login-left">
          <div className="login-illustration">
            <img src={illustration} alt="Interview illustration" />
          </div>
          <div className="login-left-text">
            <h2>InterviewOS</h2>
            <p>Master Your Career and Build the Perfect Team with InterviewOS, the Ultimate Interview Operating System</p>
          </div>

        </div>

        {/* ── RIGHT ── */}
        <div className="login-right">

          <div className="login-brand">
            <GradCap />
            <span className="brand-wordmark">
              <span className="brand-dark">Interview</span><span className="brand-green">OS</span>
            </span>
          </div>

          <div className="login-form-wrapper">
            {error && <div className="login-alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">

              <div className="login-field">
                <label htmlFor="login-email">Username or email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="johnsmith007"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password"
                  >
                    {showPassword
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div className="forgot-row">
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="login-register-text">
              Are you new?{" "}
              <Link to="/register" className="register-link">Create an Account</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};