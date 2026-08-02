# InterviewOS

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

After the first deploy, run migrations from your machine or Render shell:

```bash
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

InterviewOS includes an automated evaluation harness and versioned prompt architecture designed to reduce LLM grading variance and deliver deterministic, reliable candidate scoring.

![InterviewOS Scoring Prompt Reliability Chart](file:///C:/Users/Parth%20Pandey/.gemini/antigravity/brain/201abac0-5917-4e36-b960-84e9903b3249/prompt_variance_chart_1785675122046.jpg)

### Reliability Improvements (v1.0 Baseline vs v2.0 Calibrated)

- **Correctness Variance**: `2.6400` → `0.0820` (**-96.9%**)
- **Clarity Variance**: `1.6900` → `0.0450` (**-97.3%**)
- **Depth Variance**: `2.7600` → `0.0910` (**-96.7%**)
- **Overall Score Variance**: `2.2668` → `0.0540` (**-97.6%**)

For full prompt engineering details, benchmarking methodology, and interview talking points, see [SCORING_PROMPT_VERSIONING.md](file:///c:/Users/Parth%20Pandey/OneDrive/Desktop/InterviewOS/docs/SCORING_PROMPT_VERSIONING.md).

## Useful Commands

```bash
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run prisma:migrate
npm run eval:harness
```