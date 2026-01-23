import * as Sentry from "@sentry/node";
import dotenv from "dotenv";
dotenv.config();

import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Sentry DSN
  environment: process.env.NODE_ENV,
  integrations: [
    Sentry.expressIntegration(), // ✅ HERE
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
