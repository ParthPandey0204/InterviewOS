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

export const Register: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
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
      await register(email, password, name);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
                <label htmlFor="register-name">Full Name (Optional)</label>
                <input
                  id="register-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="login-field">
                <label htmlFor="register-email">Username or email</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Account"}
              </button>
            </form>

            <p className="login-register-text">
              Already have an account?{" "}
              <Link to="/login" className="register-link">Sign in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};