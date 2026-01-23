// src/app.ts
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import morgan from "morgan"; // moragn → fixed

import { envVariable } from "./app/config";
import { mainRoutes } from "./app/apiRoutes";
import globalErrorHandler from "./app/middleware/globalErrorHandeller";
import { RedisStore } from "connect-redis";
import helmet from "helmet";
import rateLimiter from "./app/config/rateLimit";
import { cookieOptions } from "./app/config/cookie";
import { logger } from "./app/utils/logger";
import { sanitizeMiddleware } from "./app/middleware/sanitizeMiddleware";
import swaggerUi from "swagger-ui-express";
import { swaggerDoc } from "./app/config/swagger";
import * as Sentry from "@sentry/node";

// ==============================
// App Configuration
// ==============================
const app: Application = express();

// -------------------------------
// Rate limiter
// -------------------------------
app.use(rateLimiter);

// -------------------------------
// Helmet
// -------------------------------
app.use(helmet());

app.disable("x-powered-by");

// -------------------------------
// Morgan
// -------------------------------
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// -------------------------------
// CORS
// -------------------------------
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// -------------------------------
// Body & Cookie
// -------------------------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// Sanitize
// -------------------------------
app.use(sanitizeMiddleware);

// -------------------------------
// Routes
// -------------------------------
app.get("/debug-sentry", (req, res) => {
  throw new Error("My first Sentry error!");
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "Server running" });
});

swaggerDoc(app);
mainRoutes(app);

// -------------------------------
// 404
// -------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Page Not Found" });
});

// ==============================
// SENTRY ERROR HANDLER (BEFORE GLOBAL)
// ==============================
// MUST be before your global handler
app.use(Sentry.expressErrorHandler());

// ==============================
// GLOBAL ERROR HANDLER (LAST)
// ==============================
app.use(globalErrorHandler);

export default app;
