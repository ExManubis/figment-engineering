import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://e5cfe2d15e357020c1351fa3e75519fe@o4511191666196480.ingest.de.sentry.io/4511191668883536",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // Enable logs to be sent to Sentry
  enableLogs: true,
  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,
});