import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAccessToken } from "../api/client";
import { ScoreCard, type EvaluationScores } from "../components/ScoreCard";

type Turn = { id: string; role: "USER" | "ASSISTANT"; content: string; metadata?: { evaluation?: EvaluationScores } };
type Session = { id: string; mode: string; difficulty: string; targetCompany: string | null; turns: Turn[] };
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const starterQuestion = (mode: string) => {
  if (mode === "Behavioural") return "Tell me about a time you handled a difficult challenge with your team. What did you do, and what was the result?";
  if (mode === "Case Study") return "How would you approach improving the activation rate for a new product?";
  return "Walk me through how you would design a scalable URL-shortening service.";
};

const parseEvents = (buffer: string) => {
  const events = buffer.split(/\r?\n\r?\n/);
  return { complete: events.slice(0, -1), remainder: events.at(-1) ?? "" };
};

export const InterviewRoom: React.FC = () => {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [answer, setAnswer] = useState("");
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<EvaluationScores | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/sessions/${id}`, { headers: { Authorization: `Bearer ${getAccessToken()}` }, credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Unable to load session");
        setSession(data.session);
        const lastUser = [...data.session.turns].reverse().find((turn: Turn) => turn.role === "USER");
        if (lastUser) setSubmittedAnswer(lastUser.content);
        if (lastUser?.metadata?.evaluation) setScores(lastUser.metadata.evaluation);
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load session"); }
    })();
  }, [id]);

  const { questionPrompt, interviewerResponse } = useMemo(() => {
    const turns = session?.turns || [];
    const lastUserIndex = turns.map((turn) => turn.role).lastIndexOf("USER");
    const questionBeforeLatestAnswer = lastUserIndex >= 0
      ? [...turns.slice(0, lastUserIndex)].reverse().find((turn) => turn.role === "ASSISTANT")?.content
      : undefined;
    const savedResponse = lastUserIndex >= 0
      ? turns.slice(lastUserIndex + 1).find((turn) => turn.role === "ASSISTANT")?.content
      : undefined;

    return {
      questionPrompt: questionBeforeLatestAnswer || (session ? starterQuestion(session.mode) : ""),
      interviewerResponse: submittedAnswer
        ? (isStreaming ? streamingQuestion || null : savedResponse || null)
        : null
    };
  }, [session, streamingQuestion, submittedAnswer, isStreaming]);

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || !id || isStreaming) return;
    const answerToSubmit = answer.trim();
    setError(null); setScores(null); setStreamingQuestion(""); setSubmittedAnswer(answerToSubmit); setAnswer(""); setIsStreaming(true);
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${id}/turns/stream`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` }, credentials: "include", body: JSON.stringify({ answer: answerToSubmit }) });
      if (!response.ok || !response.body) { const data = await response.json().catch(() => ({})); throw new Error(data.error?.message || "Unable to submit answer"); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let completed = false;
      const handleEvent = (message: string) => {
        const name = message.split(/\r?\n/).find((line) => line.startsWith("event:"))?.slice(6).trim();
        const line = message.split(/\r?\n/).find((item) => item.startsWith("data:"));
        if (!line) return;
        const payload = JSON.parse(line.slice(5).trim());
        if (name === "delta") setStreamingQuestion((current) => current + payload.content);
        if (name === "done") { completed = true; setSession((current) => current ? { ...current, turns: [...current.turns, payload.turn, payload.nextQuestion] } : current); if (payload.turn.metadata?.evaluation) setScores(payload.turn.metadata.evaluation); }
        if (name === "error") throw new Error(payload.message || "Interview stream failed");
      };
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const { complete, remainder } = parseEvents(buffer); buffer = remainder; complete.forEach(handleEvent); }
      if (buffer.trim()) handleEvent(buffer);
      if (!completed) throw new Error("The interview response finished without a next question. Please try again.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to submit answer"); }
    finally { setIsStreaming(false); }
  };

  if (!session && !error) return <div className="room-page room-loading">Loading your interview room...</div>;
  if (!session) return <div className="room-page room-loading"><p>{error}</p><Link to="/">Return to dashboard</Link></div>;
  return <div className="room-page"><header className="room-header"><Link to="/" className="back-link">← Dashboard</Link><div><strong>{session.mode} interview</strong><span>{session.difficulty.toLowerCase()} difficulty{session.targetCompany && ` · ${session.targetCompany}`}</span></div></header><main className="room-layout"><section className="interview-panel"><div className="question-box"><p className="section-kicker">Interviewer question</p><h1>{questionPrompt}</h1></div>{submittedAnswer && <article className="submitted-answer"><p className="section-kicker">Your submitted answer</p><p>{submittedAnswer}</p></article>}{(interviewerResponse || isStreaming) && <article className="interviewer-response"><p className="section-kicker">Interviewer response</p><p>{interviewerResponse || "Preparing the next question..."}</p>{isStreaming && <span className="streaming-indicator">Generating...</span>}</article>}<form className="answer-composer" onSubmit={submitAnswer}><label htmlFor="answer">Your next answer</label><textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Think aloud, explain your reasoning, and mention any trade-offs…" disabled={isStreaming} required /><div className="answer-actions"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><button className="primary-action" disabled={isStreaming || !answer.trim()}>{isStreaming ? "Interviewing…" : "Submit answer"}</button></div></form>{error && <p className="room-error">{error}</p>}</section>{scores ? <ScoreCard scores={scores} /> : <aside className="room-tip"><p className="section-kicker">Interview tip</p><h3>Make your thinking visible</h3><p>Lead with your approach, then explain trade-offs and edge cases. This gives the interviewer a clearer signal.</p></aside>}</main></div>;
};
