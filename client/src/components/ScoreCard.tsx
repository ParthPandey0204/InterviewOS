import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export type EvaluationScores = {
  correctness: number;
  clarity: number;
  depth: number;
  feedback?: string;
  betterAnswer?: string;
};

export const ScoreCard: React.FC<{ scores: EvaluationScores }> = ({ scores }) => {
  const data = [
    { metric: "Correctness", score: scores.correctness, target: 5 },
    { metric: "Clarity", score: scores.clarity, target: 5 },
    { metric: "Depth", score: scores.depth, target: 5 }
  ];
  const overall = Math.round(((scores.correctness + scores.clarity + scores.depth) / 15) * 100);

  return <aside className="score-card" aria-label={`Answer score: ${overall}%`}><div><p className="section-kicker">Answer evaluation</p><h3>{overall}% overall</h3></div><div className="radar-wrap"><ResponsiveContainer width="100%" height={190}><RadarChart data={data} outerRadius="66%"><PolarGrid stroke="#c9ddca" /><PolarAngleAxis dataKey="metric" tick={{ fill: "#526353", fontSize: 11 }} /><Radar dataKey="target" stroke="#a8b6a9" fill="none" strokeDasharray="4 4" /><Radar dataKey="score" stroke="#3a6e3a" fill="#7cad7e" fillOpacity={0.4} /></RadarChart></ResponsiveContainer></div><p className="score-chart-key">Solid outline: your answer · dashed outline: target</p><dl>{data.map(({ metric, score }) => <div key={metric}><dt>{metric}</dt><dd>{score}/5</dd></div>)}</dl></aside>;
};
