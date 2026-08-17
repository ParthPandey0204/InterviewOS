import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/logging.js";
import { authRouter } from "./routes/auth.routes.js";
import { sessionRouter } from "./routes/session.routes.js";
import { runClusteringJob } from "./services/clustering.service.js";

const app = express();

app.use(helmet());
app.use(requestLogger);
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "InterviewOS API"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`InterviewOS API listening on http://localhost:${config.port}`);
  
  // Run clustering job periodically (e.g. every 6 hours)
  const CLUSTERING_INTERVAL = 6 * 60 * 60 * 1000;
  setInterval(() => {
    void runClusteringJob();
  }, CLUSTERING_INTERVAL);
  
  // Optionally run once on startup
  setTimeout(() => {
    void runClusteringJob();
  }, 10000);
});