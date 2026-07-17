import "dotenv/config";

const requiredSecret = (name: string, fallback: string) => {
  const value = process.env[name] ?? fallback;

  if (process.env.NODE_ENV === "production" && value === fallback) {
    throw new Error(`${name} must be set in production`);
  }

  return value;
};

const parseOrigins = (value: string) => {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGINS ??
      process.env.CLIENT_ORIGIN ??
      "http://localhost:5173"
  ),
  requestLogFormat: process.env.REQUEST_LOG_FORMAT ?? "dev",
  jwt: {
    accessSecret: requiredSecret(
      "JWT_ACCESS_SECRET",
      "dev-access-secret-change-me"
    ),
    refreshSecret: requiredSecret(
      "JWT_REFRESH_SECRET",
      "dev-refresh-secret-change-me"
    ),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
  }
};