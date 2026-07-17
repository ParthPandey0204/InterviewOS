import cors from "cors";
import { config } from "../config.js";
import { HttpError } from "./error.js";

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(403, "Origin is not allowed by CORS"));
  }
});