import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  service: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/health`)
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false, service: "server unavailable" }));
  }, []);

  return (
    <main className="app-shell">
      <section className="workspace">
        <p className="eyebrow">InterviewOS</p>
        <h1>Hiring workflow command center</h1>
        <p className="lede">
          Vite, React, Express, and Prisma are ready. Connect Supabase next and
          start shaping the product.
        </p>
        <div className="status-panel" aria-label="Server status">
          <span className={health?.ok ? "status-dot online" : "status-dot"} />
          <span>{health ? health.service : "checking server..."}</span>
        </div>
      </section>
    </main>
  );
}