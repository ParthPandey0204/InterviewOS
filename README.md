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
```

Add your Supabase Postgres connection string to `server/.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Use the pooled connection string for `DATABASE_URL`. Prisma migrations need `DIRECT_URL`.

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

## Useful Commands

```bash
npm run dev:client
npm run dev:server
npm run build
npm run lint
npm run prisma:migrate
```
