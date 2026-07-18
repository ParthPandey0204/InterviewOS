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

## Useful Commands

```bash
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run prisma:migrate
```