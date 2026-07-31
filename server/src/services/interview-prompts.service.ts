import { QuestionDifficulty } from "@prisma/client";
import type { LLMMessage } from "./llm/index.js";

type InterviewPromptSession = {
  mode: string;
  difficulty: QuestionDifficulty;
  targetCompany: string | null;
  targetRole: string | null;
};

type ConversationTurn = {
  role: "USER" | "ASSISTANT" | string;
  content: string;
};

export type EvaluationScores = {
  correctness: number;
  clarity: number;
  depth: number;
};

const difficultyCalibration: Record<QuestionDifficulty, string> = {
  EASY:
    "Ask foundational questions. Prefer direct definitions, simple examples, and one-step reasoning. Avoid obscure edge cases unless the candidate introduces them.",
  MEDIUM:
    "Ask questions that require tradeoffs, implementation judgment, and multi-step reasoning. Include realistic follow-ups without turning the interview into trivia.",
  HARD:
    "Ask senior-level questions that require precise reasoning, edge-case analysis, scalability awareness, and clear justification of tradeoffs. Keep the question answerable in conversation."
};

const rubricDefinition = [
  "Scoring Rubric (Strict 0 to 5 Integer Scale for each axis):",
  "- Correctness (0-5): 5 = Fully accurate, sound reasoning, completely solves problem. 3 = Partially correct with minor flaws/omissions. 1 = Flawed reasoning or incorrect algorithm. 0 = Completely incorrect or non-answer.",
  "- Clarity (0-5): 5 = Well-structured, concise, explicit assumptions, professional. 3 = Understandable but wordy or slightly unorganized. 1 = Confusing, rambling, or vague. 0 = Incoherent.",
  "- Depth (0-5): 5 = Covers tradeoffs, edge cases, space/time complexity, and practical constraints. 3 = Basic explanation without deep tradeoffs. 1 = Shallow single-sentence answer. 0 = No technical depth."
].join("\n");

const fewShotExamples = [
  "--- FEW-SHOT SCORING EXAMPLES ---",
  "Example 1:",
  "Question: How do you find two numbers in an array that add up to a target sum?",
  "Answer: Use a Hash Map storing target - num as complement. O(n) time and O(n) space.",
  "Output: {\"correctness\": 5, \"clarity\": 5, \"depth\": 5}",
  "",
  "Example 2:",
  "Question: Design a Rate Limiter for an API gateway supporting 10,000 QPS.",
  "Answer: Put AWS CloudFront in front of the server and enable auto-scaling.",
  "Output: {\"correctness\": 1, \"clarity\": 2, \"depth\": 1}",
  "",
  "Example 3:",
  "Question: Tell me about a time you faced a production outage.",
  "Answer: Outages happen all the time so I just ignore PagerDuty alerts.",
  "Output: {\"correctness\": 0, \"clarity\": 1, \"depth\": 0}"
].join("\n");

const formatSessionContext = (session: InterviewPromptSession) => {
  return [
    `Mode: ${session.mode}`,
    `Difficulty: ${session.difficulty}`,
    session.targetCompany ? `Target company: ${session.targetCompany}` : undefined,
    session.targetRole ? `Target role: ${session.targetRole}` : undefined
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildInterviewerSystemPrompt = (session: InterviewPromptSession) => {
  return [
    "You are a focused, fair, high-signal technical interviewer.",
    "Persona: calm, direct, curious, and professional. Ask one question at a time. Do not reveal ideal answers. Do not grade the candidate in this turn.",
    "Topic constraint: stay within the requested interview mode and target context. If the candidate drifts, gently bring the conversation back to the relevant topic.",
    `Difficulty calibration: ${difficultyCalibration[session.difficulty]}`,
    "Rubric definition:",
    rubricDefinition,
    "Session context:",
    formatSessionContext(session),
    "Task: given the conversation so far, produce exactly one next interview question. Keep it concise, natural, and answerable."
  ].join("\n\n");
};

export const buildNextQuestionMessages = (
  session: InterviewPromptSession,
  turns: ConversationTurn[],
  latestAnswer: string
): LLMMessage[] => {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: buildInterviewerSystemPrompt(session)
    }
  ];

  for (const turn of turns) {
    if (turn.role === "USER" || turn.role === "ASSISTANT") {
      messages.push({
        role: turn.role === "USER" ? "user" : "assistant",
        content: turn.content
      });
    }
  }

  messages.push({ role: "user", content: latestAnswer });
  return messages;
};

export const buildEvaluationMessages = (input: {
  question: string;
  answer: string;
  session?: InterviewPromptSession;
}): LLMMessage[] => {
  const context = input.session ? `\n\nSession context:\n${formatSessionContext(input.session)}` : "";

  return [
    {
      role: "system",
      content: [
        "You are an interview answer evaluator. Score only the provided question and answer.",
        "Return strict JSON only, with no markdown, commentary, or extra keys.",
        "Schema: {\"correctness\": number, \"clarity\": number, \"depth\": number}",
        "Each score must be an integer from 0 to 5.",
        "Rubric definition:",
        rubricDefinition,
        fewShotExamples,
        context.trim()
      ]
        .filter(Boolean)
        .join("\n\n")
    },
    {
      role: "user",
      content: `Question:\n${input.question}\n\nAnswer:\n${input.answer}`
    }
  ];
};
