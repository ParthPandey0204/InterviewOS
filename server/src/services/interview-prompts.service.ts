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
  "Correctness: factual accuracy, sound reasoning, and whether the answer solves the actual question.",
  "Clarity: organization, concise explanation, explicit assumptions, and ability to communicate under interview pressure.",
  "Depth: coverage of tradeoffs, edge cases, complexity, practical constraints, and follow-up awareness."
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
