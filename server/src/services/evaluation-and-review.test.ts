import assert from "node:assert/strict";
import test from "node:test";
import { validateEvaluationScores } from "./answer-evaluation.service.js";
import { findConnectedClusters, type QuestionEvidence } from "./clustering.service.js";
import { daysUntilReview } from "./conceptual-review.service.js";

test("validateEvaluationScores accepts complete integer rubric scores", () => {
  const result = validateEvaluationScores({ correctness: 5, clarity: 4, depth: 3 });
  assert.deepEqual(result, {
    correctness: 5,
    clarity: 4,
    depth: 3,
    feedback: "Use the score breakdown to identify the part of your explanation that needs the most work.",
    betterAnswer: ""
  });
});

test("validateEvaluationScores rejects out-of-range and non-integer scores", () => {
  assert.throws(() => validateEvaluationScores({ correctness: 6, clarity: 3, depth: 2 }));
  assert.throws(() => validateEvaluationScores({ correctness: 4.5, clarity: 3, depth: 2 }));
});

const evidence = (questionId: string, embedding: number[]): QuestionEvidence => ({
  questionId,
  prompt: questionId,
  topic: "DSA",
  averageScore: 2,
  sessionIds: new Set(["session-1"]),
  embedding
});

test("findConnectedClusters uses the 0.62 threshold and transitive connections", () => {
  const clusters = findConnectedClusters([
    evidence("a", [1, 0]),
    evidence("b", [0.7, Math.sqrt(0.51)]), // cosine with a = 0.70
    evidence("c", [0, 1]), // connected to b (~0.714), not directly to a
    evidence("isolated", [-1, 0])
  ]);
  assert.equal(clusters.length, 1);
  assert.deepEqual(new Set(clusters[0].map((item) => item.questionId)), new Set(["a", "b", "c"]));
});

test("review intervals prioritize weaker conceptual clusters", () => {
  assert.equal(daysUntilReview(1.5), 1);
  assert.equal(daysUntilReview(2.5), 2);
  assert.equal(daysUntilReview(2.51), 4);
});
