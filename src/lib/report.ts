/** Report an error to Sentry without making Sentry a hard dependency of the module that failed. */
export function reportError(err: unknown): void {
  console.error(err);
  import('@sentry/astro').then((Sentry) => Sentry.captureException(err)).catch(() => {});
}
