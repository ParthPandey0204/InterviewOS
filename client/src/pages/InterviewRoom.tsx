import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest, getAccessToken } from "../api/client";
import { ScoreCard, type EvaluationScores } from "../components/ScoreCard";

type Turn = { id: string; role: "USER" | "ASSISTANT"; content: string; metadata?: { evaluation?: EvaluationScores } };
type Session = { id: string; mode: string; difficulty: string; targetCompany: string | null; turns: Turn[] };
type Review = { question: string; answer: string; evaluation: EvaluationScores | null };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const parseEvents = (buffer: string) => {
  const events = buffer.split(/\r?\n\r?\n/);
  return { complete: events.slice(0, -1), remainder: events.at(-1) ?? "" };
};

const streamRequest = async (endpoint: string, options: RequestInit) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 140_000);
  try { return await fetch(`${API_BASE}${endpoint}`, { ...options, signal: controller.signal }); }
  catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The AI service took too long to respond. Please try again.");
    throw error;
  } finally { window.clearTimeout(timeout); }
};

export const InterviewRoom: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [startingQuestion, setStartingQuestion] = useState(false);
  const [openingAttempt, setOpeningAttempt] = useState(0);
  const [endingSession, setEndingSession] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/sessions/${id}`, { headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Unable to load session");
        setSession(data.session);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load session"); }
    })();
  }, [id]);

  useEffect(() => {
    if (!session || session.turns.length || startingQuestion || error || !id) return;
    const startInterview = async () => {
      setStartingQuestion(true); setStreamingQuestion(""); setError(null);
      try {
        const response = await streamRequest(`/api/sessions/${id}/start/stream`, { method: "POST", headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials: "include" });
        if (!response.ok || !response.body) throw new Error("Unable to start the interview.");
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
        const consume = (message: string) => {
          const name = message.split(/\r?\n/).find((line) => line.startsWith("event:"))?.slice(6).trim();
          const line = message.split(/\r?\n/).find((item) => item.startsWith("data:"));
          if (!line) return;
          const payload = JSON.parse(line.slice(5).trim());
          if (name === "delta") setStreamingQuestion((current) => current + payload.content);
          if (name === "done") setSession((current) => current ? { ...current, turns: [payload.turn] } : current);
          if (name === "error") throw new Error(payload.message || "Unable to start the interview.");
        };
        while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const { complete, remainder } = parseEvents(buffer); buffer = remainder; complete.forEach(consume); }
        if (buffer.trim()) consume(buffer);
      } catch (startError) { setError(startError instanceof Error ? startError.message : "Unable to start the interview."); }
      finally { setStartingQuestion(false); }
    };
    void startInterview();
  }, [id, session, startingQuestion, error, openingAttempt]);

  const latestQuestion = useMemo(() => [...(session?.turns || [])].reverse().find((turn) => turn.role === "ASSISTANT")?.content, [session]);
  const retryOpeningQuestion = () => { if (!startingQuestion && !latestQuestion) { setError(null); setOpeningAttempt((attempt) => attempt + 1); } };
  const endSession = async () => {
    if (!id || endingSession) return;
    setEndingSession(true); setError(null);
    try { await apiRequest(`/api/sessions/${id}/complete`, { method: "POST" }); navigate("/"); }
    catch (endError) { setError(endError instanceof Error ? endError.message : "Unable to end this session."); setEndingSession(false); }
  };

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || !id || isStreaming || !latestQuestion) return;
    const answerToSubmit = answer.trim(); const questionToReview = latestQuestion;
    setError(null); setAnswer(""); setIsStreaming(true);
    try {
      const response = await streamRequest(`/api/sessions/${id}/turns/stream`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` }, credentials: "include", body: JSON.stringify({ answer: answerToSubmit }) });
      if (!response.ok || !response.body) { const data = await response.json().catch(() => ({})); throw new Error(data.error?.message || "Unable to submit answer"); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let completed = false;
      const handleEvent = (message: string) => {
        const name = message.split(/\r?\n/).find((line) => line.startsWith("event:"))?.slice(6).trim();
        const line = message.split(/\r?\n/).find((item) => item.startsWith("data:"));
        if (!line) return;
        const payload = JSON.parse(line.slice(5).trim());
        if (name === "done") {
          completed = true;
          setSession((current) => current ? { ...current, turns: [...current.turns, payload.turn, payload.nextQuestion] } : current);
          setReview({ question: questionToReview, answer: answerToSubmit, evaluation: payload.turn.metadata?.evaluation ?? null });
        }
        if (name === "error") throw new Error(payload.message || "Interview stream failed");
      };
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const { complete, remainder } = parseEvents(buffer); buffer = remainder; complete.forEach(handleEvent); }
      if (buffer.trim()) handleEvent(buffer);
      if (!completed) throw new Error("The interview response finished without a next question. Please try again.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to submit answer"); setAnswer(answerToSubmit); }
    finally { setIsStreaming(false); }
  };

  if (!session && !error) return <div className="room-page room-loading">Loading your interview room...</div>;
  if (!session) return <div className="room-page room-loading"><p>{error}</p><Link to="/">Return to dashboard</Link></div>;
  const header = <header className="room-header"><Link to="/" className="back-link">← Dashboard</Link><div><strong>{session.mode} interview</strong><span>{session.difficulty.toLowerCase()} difficulty{session.targetCompany && ` · ${session.targetCompany}`}</span></div><button className="btn-secondary end-session" onClick={() => void endSession()} disabled={endingSession}>{endingSession ? "Ending…" : "End session"}</button></header>;

  if (review) {
    const total = review.evaluation ? review.evaluation.correctness + review.evaluation.clarity + review.evaluation.depth : 0;
    const needsBetterAnswer = total < 12;
    return <div className="room-page">{header}<main className="review-layout"><section className="answer-review"><p className="section-kicker">Answer review</p><h1>{needsBetterAnswer ? "Here’s how to strengthen your answer" : "Your answer is on the right track"}</h1><div className="review-question"><span>Question</span><p>{review.question}</p></div>{review.evaluation ? <><p className="review-feedback">{review.evaluation.feedback || "Review the score breakdown, then continue when you are ready."}</p>{needsBetterAnswer && <article className="better-answer"><p className="section-kicker">A stronger answer</p><p>{review.evaluation.betterAnswer || "A model answer is unavailable for this response."}</p></article>}</> : <p className="review-feedback">Your response was saved, but its automated evaluation was unavailable this time.</p>}<button className="primary-action next-question-button" type="button" onClick={() => setReview(null)}>Next Question</button></section>{review.evaluation ? <ScoreCard scores={review.evaluation} /> : <aside className="room-tip"><p className="section-kicker">Next step</p><h3>Keep building momentum</h3><p>Continue to the next question when you’re ready.</p></aside>}</main></div>;
  }

  return <div className="room-page">{header}<main className="room-layout"><section className="interview-panel"><div className="question-box"><p className="section-kicker">Interviewer question</p>{streamingQuestion || latestQuestion ? <h1>{streamingQuestion || latestQuestion}</h1> : <h1 className="question-placeholder">{startingQuestion ? "Connecting to your interviewer…" : "Your interviewer has not generated a question yet."}</h1>}{startingQuestion && <span className="streaming-indicator">Generating your opening question…</span>}{error && !latestQuestion && <button className="retry-question-button" type="button" onClick={retryOpeningQuestion}>Try again</button>}</div><form className="answer-composer" onSubmit={submitAnswer}><label htmlFor="answer">Your answer</label><textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Think aloud, explain your reasoning, and mention any trade-offs…" disabled={isStreaming || startingQuestion || !latestQuestion} required /><div className="answer-actions"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><button className="primary-action" disabled={isStreaming || startingQuestion || !latestQuestion || !answer.trim()}>{isStreaming ? "Reviewing answer…" : "Submit answer"}</button></div></form>{error && <p className="room-error">{error}</p>}</section><aside className="room-tip"><p className="section-kicker">Interview tip</p><h3>Make your thinking visible</h3><p>Lead with your approach, then explain trade-offs and edge cases. This gives the interviewer a clearer signal.</p></aside></main></div>;
};
