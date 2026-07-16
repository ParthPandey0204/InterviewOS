import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "InterviewOS API"
  });
});

app.use("/api/auth", authRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`InterviewOS API listening on http://localhost:${config.port}`);
});