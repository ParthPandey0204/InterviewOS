import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { ScoreCard, type EvaluationScores } from "../components/ScoreCard";

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

  return (
    <div className="room-page">
      <header className="room-header">
        <Link to="/" className="back-link">← Dashboard</Link>
        <div>
          <strong>{session.mode} interview (Replay)</strong>
          <span>{session.difficulty.toLowerCase()} difficulty{session.targetCompany && ` · ${session.targetCompany}`}</span>
        </div>
      </header>
      
      <main className="replay-layout">
        <div className="transcript-container">
          {session.turns.map((turn, index) => {
            const nextTurn = session.turns[index + 1];
            // If it's a USER turn, look for the evaluation in its metadata
            const evaluation = turn.role === "USER" ? turn.metadata?.evaluation : null;
            
            return (
              <div key={turn.id} className={`turn-bubble ${turn.role.toLowerCase()}-turn`}>
                <div className="turn-role">{turn.role === "ASSISTANT" ? "Interviewer" : "You"}</div>
                <div className="turn-content">{turn.content}</div>
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
