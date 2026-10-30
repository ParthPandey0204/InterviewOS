import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { ScoreCard, type EvaluationScores } from "../components/ScoreCard";
import { AiResponseText } from "../components/AiResponseText";

type Turn = { id: string; role: "USER" | "ASSISTANT"; content: string; metadata?: { evaluation?: EvaluationScores } };
type Session = { id: string; mode: string; difficulty: string; targetCompany: string | null; turns: Turn[] };

export const SessionReplay: React.FC = () => {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ session: Session }>(`/api/sessions/${id}`);
        setSession(data.session);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load session");
      }
    })();
  }, [id]);

  if (!session && !error) return <div className="room-page room-loading">Loading your session...</div>;
  if (!session) return <div className="room-page room-loading"><p>{error}</p><Link to="/">Return to dashboard</Link></div>;

  const evaluatedAnswers = session.turns
    .filter((turn) => turn.role === "USER" && turn.metadata?.evaluation)
    .map((turn) => turn.metadata!.evaluation!);
  const average = (key: keyof EvaluationScores) => evaluatedAnswers.length
    ? evaluatedAnswers.reduce((total, evaluation) => total + (evaluation[key] as number), 0) / evaluatedAnswers.length
    : null;
  const overallScore = evaluatedAnswers.length
    ? Math.round(evaluatedAnswers.reduce((total, evaluation) => total + evaluation.correctness + evaluation.clarity + evaluation.depth, 0) / (evaluatedAnswers.length * 15) * 100)
    : null;
  const lowestDimension = [
    { label: "Correctness", score: average("correctness") },
    { label: "Clarity", score: average("clarity") },
    { label: "Depth", score: average("depth") }
  ].filter((dimension): dimension is { label: string; score: number } => dimension.score !== null).sort((a, b) => a.score - b.score)[0];

  return (
    <div className="room-page">
      <header className="room-header">
        <Link to="/" className="back-link">← Dashboard</Link>
        <div>
          <strong>{session.mode} interview review</strong>
          <span>{session.difficulty.toLowerCase()} difficulty{session.targetCompany && ` · ${session.targetCompany}`}</span>
        </div>
      </header>
      
      <main className="replay-layout">
        <section className="session-review-summary">
          <p className="section-kicker">Session performance</p>
          <h1>{overallScore === null ? "Session complete" : `${overallScore}% overall`}</h1>
          <p>{evaluatedAnswers.length ? `Based on ${evaluatedAnswers.length} evaluated ${evaluatedAnswers.length === 1 ? "answer" : "answers"} in this session.` : "No evaluated answers were recorded in this session, so a performance score is not available."}</p>
          {evaluatedAnswers.length > 0 && <div className="session-review-metrics">
            <div><span>Correctness</span><strong>{average("correctness")!.toFixed(1)}<em>/5</em></strong></div>
            <div><span>Clarity</span><strong>{average("clarity")!.toFixed(1)}<em>/5</em></strong></div>
            <div><span>Depth</span><strong>{average("depth")!.toFixed(1)}<em>/5</em></strong></div>
          </div>}
          {lowestDimension && <p className="session-review-focus"><strong>Best area to focus on:</strong> {lowestDimension.label}. Review the answer feedback below for specific ways to improve.</p>}
          <div className="session-review-links"><Link className="primary-action" to="/analytics">View overall analytics</Link><Link className="state-link" to="/">Return to dashboard</Link></div>
        </section>
        <div className="transcript-heading"><div><p className="section-kicker">Answer by answer</p><h2>Session transcript and feedback</h2></div></div>
        <div className="transcript-container">
          {session.turns.length === 0 ? <div className="empty-state"><h3>No answers recorded yet</h3><p>Open this session and submit an answer to begin its transcript.</p></div> : session.turns.map((turn) => {
            // If it's a USER turn, look for the evaluation in its metadata
            const evaluation = turn.role === "USER" ? turn.metadata?.evaluation : null;
            
            return (
              <div key={turn.id} className={`turn-bubble ${turn.role.toLowerCase()}-turn`}>
                <div className="turn-role">{turn.role === "ASSISTANT" ? "Interviewer" : "You"}</div>
                <AiResponseText className="turn-content" content={turn.content} />
                {evaluation && (
                  <div className="turn-evaluation">
                    <ScoreCard scores={evaluation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
