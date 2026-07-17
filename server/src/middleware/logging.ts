import morgan from "morgan";
import { config } from "../config.js";

export const requestLogger = morgan(config.requestLogFormat, {
  skip: () => config.nodeEnv === "test"
});