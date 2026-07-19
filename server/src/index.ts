import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/logging.js";
import { authRouter } from "./routes/auth.routes.js";
import { sessionRouter } from "./routes/session.routes.js";

const app = express();

app.use(helmet());
app.use(requestLogger);
app.use(corsMiddleware);
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
});