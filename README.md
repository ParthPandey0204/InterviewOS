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

Screenshots and a 90-second demo video are not yet recorded. Before publishing, deploy the app, then show a company-targeted session, a weak answer's review chart and improved answer, and Analytics with weak-topic clustering and UsageLog metrics.

**Live link:** not deployed yet.

## Real-user study

No real-user study has been run. After deployment, invite consenting participants and publish only aggregate participation, completed-session count, and average-score data.

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

InterviewOS includes an automated evaluation harness and versioned prompt architecture for measuring—not assuming—LLM grading reliability.

![Scoring benchmark status](docs/scoring-benchmark-status.svg)

Run `npm run eval:harness -- --runs=10 --persist` with valid provider credentials to generate reproducible figures. The benchmark persists only real LLM responses under a dedicated non-user account; omit `--persist` for a dry run.

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
