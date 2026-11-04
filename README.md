# InterviewOS

InterviewOS is a practice interview platform that gives structured AI feedback, shows an improved answer before advancing, and identifies weak concepts across sessions.

## Problem statement

Interview practice is usually unstructured: candidates get a question, move on too quickly, and never see where their reasoning was weak. InterviewOS provides a deliberate feedback loop: answer, review the score and stronger answer, then explicitly continue. It also surfaces recurring weak-topic clusters over time.

## Architecture

```mermaid
flowchart LR
  UI[React / Vite client] --> API[Express API]
  API --> DB[(Supabase Postgres / Prisma)]
  API --> LLM[Gemini with Groq fallback]
  LLM --> API
  API --> Usage[UsageLog: tokens, cost, latency]
  Usage --> Analytics[Progress and operations dashboard]
```

## Reliability story

The evaluator has versioned baseline and calibrated prompts. Its benchmark harness calls the configured LLM for both versions and reports per-sample run-to-run variance; no reliability percentage is published until that benchmark is run and recorded. See [the methodology](docs/SCORING_PROMPT_VERSIONING.md).

## Features

- In-room answer review, radar chart, targeted feedback, and improved-answer guidance.
- Weak-topic clustering and spaced-repetition question focus.
- Razorpay, Zepto, Meesho, and Flipkart-style interview question filters when a target company is selected.
- Web Speech API voice dictation (Chrome/Edge).
- Internal UsageLog dashboard for token volume, estimated cost, and provider p50/p95 latency.
- Server-side daily session cap (`DAILY_SESSION_CAP`, default: 8) to protect free-tier capacity.
- Gemini request timeout configuration (`LLM_REQUEST_TIMEOUT_MS`, default: 120000) with optional Groq fallback.
- GitHub Actions validation on every push and pull request.

## Screenshots and demo

The two demos highlight the complete InterviewOS experience and its analysis tools:

- [Demo 1: End-to-end workflow (MP4)](https://res.cloudinary.com/bfuyyun2/video/upload/v1793765253/Demo_2_2.mp4) demonstrates the flow from sign-in through question generation and the interview experience. It uses an easy technical question to keep the focus on how the product works.
- [Demo 2: Interview analysis (MP4)](https://res.cloudinary.com/bfuyyun2/video/upload/v1793765233/Demo_2.mp4) demonstrates InterviewOS's analysis features after a hard technical interview session.

### Product screenshots

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/dashboard.png" alt="InterviewOS dashboard" width="420"><br><strong>Dashboard</strong></td>
    <td align="center"><img src="docs/screenshots/session-setup.png" alt="Interview session setup" width="420"><br><strong>Session setup</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/interview-question.png" alt="Interview question and answer form" width="420"><br><strong>Interview question</strong></td>
    <td align="center"><img src="docs/screenshots/answer-review.png" alt="AI answer feedback and rubric scores" width="420"><br><strong>Answer feedback and rubric scores</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/analytics.png" alt="InterviewOS analytics dashboard" width="420"><br><strong>Analytics</strong></td>
    <td align="center"><img src="docs/screenshots/stronger-answer.png" alt="AI feedback with a stronger answer example" width="420"><br><strong>Stronger answer guidance</strong></td>
  </tr>
</table>

The answer review screenshots show both the rubric scores and a stronger answer example to guide the next attempt.

**Live app:** [https://interview-os-client.vercel.app/](https://interview-os-client.vercel.app/)

## Planned user study

No real-user study has been run yet. After deployment, the planned study is to invite consenting participants and publish only aggregate participation, completed-session count, and average-score data.

Monorepo for InterviewOS:

- `client`: Vite + React
- `server`: Node.js + Express + Prisma

## Setup

```bash
npm install
```

Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Add your Supabase Postgres connection string to `server/.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

Use Supabase Session Mode pooler locally if direct IPv6 is unavailable.

Configure at least one LLM provider key in `server/.env` before starting the app. The default provider is Gemini, so set `GEMINI_API_KEY`; you can also set `GROQ_API_KEY` to enable Groq fallback, or set `LLM_PROVIDER=groq` to use Groq as the default.

Then generate Prisma Client:

```bash
npm run prisma:generate
```

Run both apps:

```bash
npm run dev
```

Client: http://localhost:5173

Server: http://localhost:4000

## Deployment

### Backend: Render

Use `render.yaml` as a Render Blueprint.

Set these Render environment variables before deploying:

```env
DATABASE_URL="your Supabase Session Mode pooler URL"
DIRECT_URL="your Supabase Session Mode pooler URL, or direct URL if available"
CLIENT_ORIGIN="https://your-vercel-app.vercel.app"
CORS_ORIGINS="https://your-vercel-app.vercel.app"
GEMINI_API_KEY="your Gemini key"
GROQ_API_KEY="your Groq key"
```

Render will generate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` from the blueprint.

Migrations run automatically on service start. If a deploy fails with Prisma error `P3009` (failed migration), clear the failed record once, then redeploy:

```bash
# Use your production DATABASE_URL / DIRECT_URL in .env or the shell
npm.cmd exec --workspace server -- prisma migrate resolve --rolled-back 20260819000000_add_cluster_review_schedule
npm.cmd exec --workspace server -- prisma migrate deploy
```

### Frontend: Vercel

Create a Vercel project using `client` as the project root. The `client/vercel.json` file sets the Vite build and SPA fallback.

Set this Vercel environment variable:

```env
VITE_API_URL="https://your-render-service.onrender.com"
```

Then update Render `CLIENT_ORIGIN` and `CORS_ORIGINS` to the final Vercel URL.

## LLM Scoring Prompt Reliability & Versioning

InterviewOS scores answers on correctness, clarity, and depth. Its evaluator has two versioned prompts: a zero-shot baseline (`v1`) and a calibrated prompt (`v2`) with explicit 0–5 rubric definitions and three few-shot examples. The analysis flow is demonstrated in [Demo 2](https://res.cloudinary.com/bfuyyun2/video/upload/v1793765233/Demo_2.mp4), which follows a hard technical interview session.

![Scoring benchmark status](docs/scoring-benchmark-status.svg)

The benchmark harness compares both prompt versions across 30 DSA, system design, and behavioral answers, repeating each evaluation and reporting mean per-answer run-to-run variance. Reliability results are not claimed until a benchmark run is recorded with its model, provider, date, run count, failures, and variance output.

Run `npm run eval:harness -- --runs=10 --persist` with valid provider credentials to persist actual LLM responses under a dedicated non-user account. Omit `--persist` for a dry run.

For the prompt definitions and methodology, see [SCORING_PROMPT_VERSIONING.md](docs/SCORING_PROMPT_VERSIONING.md).

## Useful Commands

```bash
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run prisma:migrate
npm run eval:harness
```
